const fs = require('node:fs');
const path = require('node:path');

// Expo 51 imports tar as a default export. tar 7 exposes named exports and
// __esModule, so Expo's interop helper no longer creates that default export.
// Keep the patched extraction API and adapt only Expo's import wrapper.
const cliRoot = path.dirname(require.resolve('@expo/cli/package.json'));
const original = '_interopRequireDefault(require("tar"))';
const replacement = '({ default: require("tar") })';

for (const file of ['utils/tar.js', 'utils/npm.js']) {
  const filename = path.join(cliRoot, 'build/src', file);
  const source = fs.readFileSync(filename, 'utf8');
  if (source.includes(replacement)) continue;
  if (!source.includes(original)) {
    throw new Error(`Review the Expo tar compatibility patch for ${filename}`);
  }
  fs.writeFileSync(filename, source.replace(original, replacement));
}
