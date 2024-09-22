import { usePlaude } from '@plaude/react-native';
import { Button, View } from 'react-native';

export default function IndexPage() {
  const { open } = usePlaude();

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Button onPress={open} title="Open Plaude" />
    </View>
  );
}
