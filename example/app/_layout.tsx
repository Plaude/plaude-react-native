import { PlaudeProvider } from '@plaude/react-native';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const userId = '';
  const token = '';

  return (
    <PlaudeProvider userId={userId} token={token}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </PlaudeProvider>
  );
}
