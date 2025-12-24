// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0d6efd' }}>
      <Tabs.Screen 
        name="detail/[id]" 
        options={{ 
          title: 'Input Data',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text>
        }} 
      />
      <Tabs.Screen 
        name="result" 
        options={{ 
          title: 'Hasil',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text>
        }} 
      />
    </Tabs>
  );
}