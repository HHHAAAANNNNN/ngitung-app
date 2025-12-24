// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  const { name } = useLocalSearchParams(); // Ambil nama dari params

  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#0d6efd',
        headerShown: false, // Matikan header di Tab Navigator
      }}
    >
      {/* Tab 1: Input Data */}
      <Tabs.Screen 
        name="detail/[id]" 
        options={{ 
          title: 'Input Data',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text>,
        }} 
      />

      {/* Tab 2: Hasil */}
      <Tabs.Screen 
        name="result" 
        options={{ 
          title: 'Hasil',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text>,
        }} 
      />
    </Tabs>
  );
}