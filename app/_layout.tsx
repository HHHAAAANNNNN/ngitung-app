// app/_layout.tsx
import 'react-native-get-random-values'; // HARUS di baris paling atas!
import { Stack } from 'expo-router';
import { NoteProvider } from '../src/context/NoteContext';

export default function RootLayout() {
  return (
    <NoteProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NoteProvider>
  );
}