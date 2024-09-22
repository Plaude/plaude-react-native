<p align="center">
  <img src="https://plaudeai.com/apple-touch-icon.png" width="200px" align="center" alt="Plaude logo" style="border-radius:25%"/>
  <h1 align="center">Plaude for React Native</h1>
   <p align="center">
    <a href="https://plaudeai.com">Plaude</a>
    <br/>
    AI-powered tools for your company
  </p>
</p>
<br>

## Getting started

First, install the Plaude SDK.

```
npm install @plaude/react-native
```

Then, add the following environment variable from your dashboard.

```
PLAUDE_APP_ID="This is an example"
```

Then, wrap your application with the `PlaudeProvider` component.

```tsx
import { PlaudeProvider } from '@plaude/react-native';

export default function RootLayout() {
  return (
    <PlaudeProvider userId="User ID" token="User token">
      // Your application
    </PlaudeProvider>
  );
}
```

Although Plaude automatically gets the `App ID` from your environment, you can opt for manually setting it in the `PlaudeProvider` component.

```tsx
import { PlaudeProvider } from '@plaude/react-native';

export default function RootLayout() {
  return (
    <PlaudeProvider appId="Your App ID" userId="User ID" token="User token">
      // Your application
    </PlaudeProvider>
  );
}
```

At this point the installation is completed, you can make use of the Plaude messenger by calling the `open()` method from the `usePlaude()` hook.

```tsx
import { Pressable, Text, View } from 'react-native';
import { usePlaude } from '@plaude/react-native';

export default function Page() {
  const { openMessenger } = usePlaude();

  return (
    <View>
      <Pressable onPress={openMessenger}>
        <Text>Open Plaude</Text>
      </Pressable>
    </View>
  );
}
```
