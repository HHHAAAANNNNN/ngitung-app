// app/(tabs)/_layout.tsx
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#A78BFA',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: {
        backgroundColor: '#1A1625',
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 15,
        paddingTop: 0,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
      headerStyle: {
        backgroundColor: '#0F0A1F',
      },
      headerTintColor: '#F9FAFB',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Tabs.Screen 
        name="detail/[id]" 
        options={{ 
          title: 'Detail Perhitungan',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? "calculate" : "calculate"} 
              size={24} 
              color={color} 
            />
          ),
          headerShown: false,
        }} 
      />
      <Tabs.Screen 
        name="result" 
        options={{ 
          title: 'Hasil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? "assessment" : "assessment"} 
              size={24} 
              color={color} 
            />
          ),
          headerShown: false,
        }} 
      />
    </Tabs>
  );
}