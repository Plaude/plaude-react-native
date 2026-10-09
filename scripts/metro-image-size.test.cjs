const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

// The same suite exercises the actual Metro installed in each project.
const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));
const metroAssets = projectRequire('metro/src/Assets');
const imageSizePath = createRequire(
  projectRequire.resolve('metro/package.json'),
).resolve('image-size');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);

function fixtureDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plaude-metro-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('Metro preserves synchronous buffer dimensions and non-image behavior', () => {
  assert.deepEqual(metroAssets.getAssetSize('png', png, 'icon.png'), {
    width: 1,
    height: 1,
  });
  assert.equal(
    metroAssets.getAssetSize('txt', Buffer.from('hello'), 'file.txt'),
    null,
  );
  assert.throws(() =>
    metroAssets.getAssetSize('png', Buffer.alloc(0), 'empty.png'),
  );
});

test('Metro reads file dimensions, density variants and asset plugins', async (t) => {
  const directory = fixtureDirectory(t);
  const filename = path.join(directory, 'icon.png');
  fs.writeFileSync(filename, png);
  fs.writeFileSync(path.join(directory, 'icon@2x.png'), png);
  const plugin = path.join(directory, 'asset-plugin.cjs');
  fs.writeFileSync(
    plugin,
    'module.exports = asset => ({ ...asset, fixture: true });',
  );
  const asset = await metroAssets.getAssetData(
    filename,
    'assets/icon.png',
    [plugin],
    null,
    '/assets',
  );
  assert.equal(asset.width, 1);
  assert.equal(asset.height, 1);
  assert.deepEqual(asset.scales, [1, 2]);
  assert.deepEqual(asset.files, [
    filename,
    path.join(directory, 'icon@2x.png'),
  ]);
  assert.equal(asset.fixture, true);
  assert.equal(asset.__packager_asset, true);

  // A lone @2x asset must still be normalized to logical pixels.
  const scaled = path.join(directory, 'scaled@2x.png');
  fs.writeFileSync(scaled, png);
  const scaledAsset = await metroAssets.getAssetData(
    scaled,
    'assets/scaled.png',
    [],
    null,
    '/assets',
  );
  assert.equal(scaledAsset.width, 0.5);
  assert.equal(scaledAsset.height, 0.5);
});

test('Metro preserves the archive-path buffer branch', async (t) => {
  const directory = path.join(fixtureDirectory(t), 'fixture.zip', 'assets');
  fs.mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, 'icon.png');
  fs.writeFileSync(filename, png);
  const asset = await metroAssets.getAssetData(
    filename,
    'assets/icon.png',
    [],
    null,
    '/assets',
  );
  assert.equal(asset.width, 1);
  assert.equal(asset.height, 1);
});

test('malformed ICNS, HEIF and JXL entries terminate instead of blocking Node', () => {
  const icns = Buffer.alloc(16);
  icns.write('icns', 0);
  icns.writeUInt32BE(icns.length, 4);
  icns.write('icp4', 8);
  // The entry length at offset 12 remains zero.

  const heif = Buffer.alloc(64);
  for (const [offset, size, type] of [
    [0, 16, 'ftyp'],
    [16, 36, 'meta'],
    [28, 8, 'iprp'],
    [36, 20, 'ipco'],
    [44, 0, 'ispe'],
  ]) {
    heif.writeUInt32BE(size, offset);
    heif.write(type, offset + 4);
  }
  heif.write('avif', 8);

  const jxl = Buffer.alloc(40);
  jxl.writeUInt32BE(12, 0);
  jxl.write('JXL ', 4);
  jxl.set([13, 10, 135, 10], 8);
  jxl.writeUInt32BE(16, 12);
  jxl.write('ftyp', 16);
  jxl.write('jxl ', 20);
  jxl.write('jxlp', 32);
  // The jxlp box length and partial-codestream index remain zero.

  // A vulnerable synchronous parser would hang the test runner itself. Use a
  // bounded subprocess so a regression fails rather than hanging CI forever.
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `const assert = require('node:assert/strict');
       const { imageSize } = require(process.argv[1]);
       const inputs = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
       for (const input of inputs) {
         assert.throws(() => imageSize(Buffer.from(input, 'hex')));
       }`,
      imageSizePath,
    ],
    {
      input: JSON.stringify(
        [icns, heif, jxl].map((input) => input.toString('hex')),
      ),
      encoding: 'utf8',
      timeout: 3000,
    },
  );
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stderr);
});
