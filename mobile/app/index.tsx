import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '../context/AppContext';
import { T } from '../constants/tokens';

export default function Index() {
  const { token, isLoading } = useApp();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: T.bg }} />;
  }

  return <Redirect href={token ? '/(tabs)' : '/onboarding'} />;
}
