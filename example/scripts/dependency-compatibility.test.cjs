const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('the native CLI still identifies the Android launcher with XML parser 5', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plaude-manifest-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const manifest = path.join(dir, 'AndroidManifest.xml');
  fs.writeFileSync(
    manifest,
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity android:name=".MainActivity"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>',
  );
  const getMainActivity =
    require('@react-native-community/cli-platform-android/build/config/getMainActivity').default;
  assert.equal(getMainActivity(manifest), '.MainActivity');
});

test('both plist consumers preserve iOS configuration with patched xmldom', () => {
  const value = {
    CFBundleIdentifier: 'com.plaude.example',
    UIRequiresFullScreen: true,
    CFBundleURLTypes: [{ CFBundleURLSchemes: ['plaude'] }],
  };
  for (const name of ['@expo/plist', 'plist']) {
    const imported = require(name);
    const plist = imported.default ?? imported;
    assert.deepEqual(plist.parse(plist.build(value)), value);
  }
});

test('Expo falls back to the patched JavaScript tar extraction API', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plaude-tar-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source');
  const destination = path.join(dir, 'destination');
  fs.mkdirSync(source);
  fs.mkdirSync(destination);
  fs.writeFileSync(path.join(source, 'fixture.txt'), 'Plaude archive fixture');
  const archive = path.join(dir, 'fixture.tar');
  await require('tar').create({ cwd: source, file: archive }, ['fixture.txt']);

  // Windows always exercises Expo's JavaScript fallback rather than system tar.
  const platform = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
  t.after(() => Object.defineProperty(process, 'platform', platform));
  await require('@expo/cli/build/src/utils/tar').extractAsync(
    archive,
    destination,
  );
  assert.equal(
    fs.readFileSync(path.join(destination, 'fixture.txt'), 'utf8'),
    'Plaude archive fixture',
  );
});
