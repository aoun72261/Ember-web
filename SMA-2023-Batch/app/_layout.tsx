import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../lib/store';

export default function RootLayout() {
  const { isAuthed, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthed) {
        router.replace('/lock');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthed, isLoading]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0f' } }}>
        <Stack.Screen name="lock" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="person/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="photo/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
    </>
  );
}
