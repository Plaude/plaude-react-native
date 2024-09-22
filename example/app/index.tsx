import { usePlaude } from '@plaude/react-native';
import { Button, StyleSheet, View } from 'react-native';

export default function IndexPage() {
  const { open } = usePlaude();

  return (
    <View style={styles.container}>
      <Button onPress={open} title="Open Plaude" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
