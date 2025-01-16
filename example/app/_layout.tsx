import { PlaudeProvider } from '@plaude/react-native';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <PlaudeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </PlaudeProvider>
  );
}
