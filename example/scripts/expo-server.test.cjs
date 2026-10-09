const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { test } = require('node:test');
const { createRequestHandler } = require('@expo/server/build/vendor/http');

async function serve(t, middleware) {
  const server = http.createServer((request, response) => {
    middleware(request, response, (error) => {
      response.statusCode = error ? 500 : 404;
      response.end(error?.message ?? 'Not found');
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return async (pathname, { method = 'GET', headers = {}, body } = {}) =>
    new Promise((resolve, reject) => {
      const request = http.request(
        {
          host: '127.0.0.1',
          port: server.address().port,
          path: pathname,
          method,
          headers,
          agent: false,
        },
        (response) => {
          let text = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            text += chunk;
          });
          response.on('end', () =>
            resolve({
              status: response.statusCode,
              headers: response.headers,
              text,
            }),
          );
          response.on('error', reject);
        },
      );
      request.on('error', reject);
      request.end(body);
    });
}

test('Expo 51 CLI serves HTML, HEAD and dynamic API request bodies with server 0.5', async (t) => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plaude-routes-'));
  t.after(() => fs.rmSync(appDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(appDir, 'api'));
  fs.writeFileSync(
    path.join(appDir, 'index.tsx'),
    'export default function Page() {}',
  );
  fs.writeFileSync(
    path.join(appDir, 'api', '[id]+api.ts'),
    'export function POST() {}',
  );
  const {
    createRouteHandlerMiddleware,
  } = require('@expo/cli/build/src/start/server/metro/createServerRouteMiddleware');
  const request = await serve(
    t,
    createRouteHandlerMiddleware(process.cwd(), {
      appDir,
      routerRoot: appDir,
      config: { exp: { web: { output: 'server' } } },
      getStaticPageAsync: async () => ({
        content: '<html>Plaude route</html>',
      }),
      bundleApiRoute: async () => ({
        POST: async (request, params) =>
          Response.json({
            id: params.id,
            body: await request.text(),
            header: request.headers.get('x-fixture'),
          }),
      }),
    }),
  );
  const html = await request('/');
  assert.equal(html.status, 200);
  assert.match(html.headers['content-type'], /text\/html/);
  assert.equal(html.text, '<html>Plaude route</html>');
  const head = await request('/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.text, '');
  const api = await request('/api/customer-42', {
    method: 'POST',
    headers: { 'x-fixture': ['one', 'two'] },
    body: 'request body',
  });
  assert.equal(api.status, 200);
  assert.deepEqual(JSON.parse(api.text), {
    id: 'customer-42',
    body: 'request body',
    header: 'one, two',
  });
});

function apiMiddleware(routes, logError = () => {}) {
  return createRequestHandler(
    { build: '' },
    {
      getRoutesManifest: async () => ({
        htmlRoutes: [],
        notFoundRoutes: [],
        apiRoutes: Object.keys(routes).map((page) => ({
          page,
          file: page,
          routeKeys: {},
          namedRegex: new RegExp(`^${page}$`),
        })),
      }),
      getApiRoute: async (route) => routes[route.page],
      logApiRouteExecutionError: logError,
    },
  );
}

test('Expo HTTP adapter preserves streamed bodies, status and multiple cookies', async (t) => {
  const request = await serve(
    t,
    apiMiddleware({
      '/stream': {
        GET: () => {
          const headers = new Headers({
            'content-type': 'text/plain',
            'x-fixture': 'stream',
          });
          headers.append('set-cookie', 'first=1; Path=/');
          headers.append('set-cookie', 'second=2; Path=/');
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('first chunk;'));
                controller.enqueue(new TextEncoder().encode('second chunk'));
                controller.close();
              },
            }),
            { status: 201, headers },
          );
        },
      },
    }),
  );
  const response = await request('/stream');
  assert.equal(response.status, 201);
  assert.equal(response.text, 'first chunk;second chunk');
  assert.equal(response.headers['x-fixture'], 'stream');
  assert.deepEqual(response.headers['set-cookie'], [
    'first=1; Path=/',
    'second=2; Path=/',
  ]);
});

test('Expo HTTP adapter retains 404, 405 and API error responses', async (t) => {
  const errors = [];
  const request = await serve(
    t,
    apiMiddleware(
      {
        '/read': { GET: () => new Response('read') },
        '/fail': {
          GET: () => {
            throw new Error('fixture failure');
          },
        },
      },
      (error) => errors.push(error),
    ),
  );
  assert.equal((await request('/missing')).status, 404);
  assert.equal((await request('/read', { method: 'POST' })).status, 405);
  const failure = await request('/fail');
  assert.equal(failure.status, 500);
  assert.equal(failure.text, 'Internal server error');
  assert.equal(errors[0].message, 'fixture failure');
});
