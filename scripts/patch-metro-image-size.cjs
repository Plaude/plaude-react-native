const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

// Resolve from the package being installed so SDK and example installs each
// adapt their own Metro. Registry installs of the SDK do not run prepare.
const resolveFromProject = createRequire(
  path.join(process.cwd(), 'package.json'),
);
const metroRoot = path.dirname(
  resolveFromProject.resolve('metro/package.json'),
);
const filename = path.join(metroRoot, 'src/Assets.js');
let source = fs.readFileSync(filename, 'utf8');

// image-size 2 separates the synchronous buffer API from asynchronous file
// reads. Metro 0.80 uses both forms of the former callable CommonJS export.
const replacements = [
  [
    'const getImageSize = require("image-size");',
    'const { imageSize: getImageSize } = require("image-size");\n' +
      'const { imageSizeFromFile } = require("image-size/fromFile");',
  ],
  [
    'const dimensions = isImage ? getImageSize(isImageInput) : null;',
    'const dimensions = isImage\n' +
      '    ? typeof isImageInput === "string"\n' +
      '      ? await imageSizeFromFile(isImageInput)\n' +
      '      : getImageSize(isImageInput)\n' +
      '    : null;',
  ],
];

for (const [original, replacement] of replacements) {
  if (source.includes(replacement)) continue;
  if (!source.includes(original)) {
    throw new Error(
      `Review the Metro image-size compatibility patch for ${filename}`,
    );
  }
  source = source.replace(original, replacement);
}
fs.writeFileSync(filename, source);
