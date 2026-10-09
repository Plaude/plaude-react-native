# Dependency compatibility patches

The security updates keep the SDK API, React Native versions and Expo SDK 51
example unchanged. Run `npm ci` in the repository and example separately. Use
Node 20 for the checks, as in CI.

## Metro and image-size 2

Both lockfiles resolve `image-size` to 2.0.4. Version 2.0.3 fixes
[ICNS parser loops](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) and
[JXL/HEIF parser loops](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq).

Metro 0.80.12 expects the old callable CommonJS export, accepting either a buffer
or a file path. `patch-metro-image-size.cjs` adapts its two call sites: buffers
use the synchronous `imageSize` export, and file paths use the asynchronous
`imageSizeFromFile` export. The latter retains bounded file reads and file handle
management. Root `prepare` and example `postinstall` apply the patch after each
install. It is idempotent and rejects an unrecognized Metro source file rather
than silently skipping an incompatible change. Recheck the adapter when Metro
changes; remove it and the override when upstream supports a patched parser.

`npm run test:dependencies` exercises each project's actual Metro for buffer
dimensions, file paths, density variants, asset plugins and archive paths. It
also checks zero-length ICNS entries and HEIF/JXL boxes in a subprocess with a
timeout, so a parser regression fails CI without permanently blocking Node.

The adapter is repository tooling. The SDK's published files remain `dist`;
registry consumers do not execute `prepare`, and npm overrides do not propagate
into consuming applications. Consumers must maintain their own React Native /
Metro dependency trees.

## Expo server without Remix

The example overrides `@expo/server` 0.4.4 with 0.5.3.
[Expo's changelog](https://github.com/expo/expo/blob/ee33df50fbe6bf9bb5d772e7f341f85a27cf9993/packages/@expo/server/CHANGELOG.md)
records removal of Remix in 0.5.2 and the Undici 6 constraint in 0.5.3. This removes
`@remix-run/node`, `@remix-run/server-runtime` and `turbo-stream` from the example
lockfile instead of forcing a new, incompatible stream protocol into Remix 2.

Expo's server uses Remix's HTTP stream helpers and global Fetch implementation;
the example's Expo CLI routes through Expo's own route manifest and request
handler. Expo server 0.5 replaces those helpers with Node web-stream conversion
and Undici, preserving the `build/vendor/http` entry point and handler callbacks
used by Expo CLI 0.18.31 and the environment types used by Expo Router 3.5.24.
HTML and API server functionality remains supported.

The example tests instantiate the actual Expo CLI route middleware and exercise
HTML, HEAD, dynamic API parameters, streamed POST bodies and duplicate request
headers. Additional real HTTP tests cover streamed responses, status codes,
multiple cookies, missing routes, unsupported methods and logged API errors.
The all-platform export checks the existing application as well.

## Remaining advisories and follow-up choices

As verified on October 9, 2026, both lockfiles still contain two packages with
high advisories and no published fix. The following options need separate
review and validation before a broader migration.

- [`node-forge` <= 1.4.0](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
  enters the SDK tooling through React Native's development middleware and
  `selfsigned` 2.4.1. The example also uses it directly through Expo CLI 0.18.31
  and `@expo/code-signing-certificates` 0.0.5. `selfsigned` 5.5.0 uses different
  X.509 libraries, but replacing that chain alone cannot clear the example's
  direct signing dependencies. The latest Expo certificate package (0.0.7)
  still depends on affected `node-forge`. Options are an upstream fix, a reviewed
  security fork, or migrating all certificate/signature consumers to maintained
  APIs. Validate certificate generation, signature rejection, Expo update code
  signing and development HTTPS; a blind override risks changing trust checks.
- [`braces` <= 3.0.3](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
  enters both trees through `micromatch` 4.0.8. Consumers include Metro's file
  map, React Native CLI/code generation, fast-glob/globby and Jest; the SDK also
  has Changesets consumers. Latest micromatch 4.0.8 still requires braces 3.0.3.
  Upgrading Changesets alone cannot remove the other chains. Options are an
  upstream depth-guard fix, a reviewed compatible fork, or consumer migrations
  to alternative glob implementations. Those migrations need checks for brace
  expansion, extglobs, negative patterns, ignored files, file watching, test
  discovery and release file selection. Picomatch/tinyglobby are not drop-in
  substitutes for every micromatch API.

These updates do not dismiss alerts, suppress audits or alter repository
security settings. npm audit reports propagated package counts rather than
Vanta's individual Dependabot alerts; unresolved counts remain visible.
