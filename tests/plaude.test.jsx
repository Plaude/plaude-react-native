import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Modal: 'Modal',
  Pressable: 'Pressable',
  Text: 'Text',
}));

vi.mock('react-native-webview', () => ({ WebView: 'WebView' }));

import { PlaudeProvider, usePlaude } from '../src/index.js';

const mounted = [];

afterEach(() => {
  act(() => mounted.splice(0).forEach((tree) => tree.unmount()));
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('opens, authenticates, and closes the messenger while preserving children', () => {
  vi.stubEnv('PLAUDE_APP_ID', undefined);
  let controls;

  function Consumer() {
    controls = usePlaude();
    return <span>Application content</span>;
  }

  let tree;
  act(() => {
    tree = renderer.create(
      <PlaudeProvider appId="test-app">
        <Consumer />
      </PlaudeProvider>,
    );
  });
  mounted.push(tree);

  expect(tree.root.findByType('span').children).toEqual([
    'Application content',
  ]);
  expect(tree.root.findByType('Modal').props.visible).toBe(false);

  act(() => {
    controls.openMessenger();
    controls.setToken('test-token');
  });

  expect(tree.root.findByType('Modal').props.visible).toBe(true);
  expect(tree.root.findByType('WebView').props.source.uri).toBe(
    'https://embed.plaudeai.com/messenger/test-app?token=test-token',
  );

  act(() => tree.root.findByType('Pressable').props.onPress());
  expect(tree.root.findByType('Modal').props.visible).toBe(false);
});

it('uses the environment app ID when configured', () => {
  vi.stubEnv('PLAUDE_APP_ID', 'environment-app');
  let tree;
  act(() => {
    tree = renderer.create(<PlaudeProvider appId="fallback-app" />);
  });
  mounted.push(tree);
  expect(tree.root.findByType('WebView').props.source.uri).toBe(
    'https://embed.plaudeai.com/messenger/environment-app',
  );
});

it('requires an app ID', () => {
  vi.stubEnv('PLAUDE_APP_ID', undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => renderer.create(<PlaudeProvider />)).toThrow(
    'It seems like you forgot to set the App ID.',
  );
});

it('requires a provider for the hook', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  function Consumer() {
    usePlaude();
    return null;
  }
  expect(() => renderer.create(<Consumer />)).toThrow(
    'It seems like you forgot to wrap your app with the PlaudeProvider component.',
  );
});
