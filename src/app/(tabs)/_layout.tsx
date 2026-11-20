import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { Cores } from '@/constants/theme';

const icone = (simbolo: string) =>
  function Icone({ color }: { color: ColorValue }) {
    return (
      <Text style={{ fontSize: 22, color }} accessibilityElementsHidden importantForAccessibility="no">
        {simbolo}
      </Text>
    );
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Cores.primaria,
        tabBarInactiveTintColor: Cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: { minHeight: 64, paddingTop: 6 },
        headerStyle: { backgroundColor: Cores.cartao },
        headerTitleStyle: { color: Cores.texto, fontWeight: '800' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Agora', headerTitle: 'TransitoClaro', tabBarIcon: icone('🚇'), tabBarAccessibilityLabel: 'Situação das linhas agora' }} />
      <Tabs.Screen name="relatar" options={{ title: 'Relatar', tabBarIcon: icone('📣'), tabBarAccessibilityLabel: 'Enviar um relato' }} />
      <Tabs.Screen name="trajetos" options={{ title: 'Trajetos', headerTitle: 'Meus trajetos', tabBarIcon: icone('🧭'), tabBarAccessibilityLabel: 'Meus trajetos e alertas' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Meus relatos', tabBarIcon: icone('🗂️'), tabBarAccessibilityLabel: 'Meus relatos e ajustes' }} />
    </Tabs>
  );
}
