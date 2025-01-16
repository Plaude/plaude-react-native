import { usePlaude } from '@plaude/react-native';
import { useEffect } from 'react';
import { Button, StyleSheet, View } from 'react-native';

export default function IndexPage() {
  const { openMessenger, setToken } = usePlaude();

  useEffect(() => {
    setToken(
      'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzI3NDExNzIwLCJzdWIiOiI4OWY2NWFmMC01MmE1LTQxODMtODA2Ni01NTMxNjY5ZDZmMDkiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.ug1LjtV-ZqYWqKJoCB20mHhe6o_27gaPQrmdZZvNcFM',
    );
  }, []);

  return (
    <View style={styles.container}>
      <Button onPress={openMessenger} title="Open Plaude" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
