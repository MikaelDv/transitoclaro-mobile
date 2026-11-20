import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Cores } from '@/constants/theme';
import { PreferenciasProvider } from '@/context/preferencias';

export default function RootLayout() {
  return (
    <PreferenciasProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Cores.cartao },
          headerTintColor: Cores.primaria,
          headerTitleStyle: { color: Cores.texto, fontWeight: '700' },
          contentStyle: { backgroundColor: Cores.fundo },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="linha/[id]" options={{ title: 'Detalhes da linha', headerBackTitle: 'Voltar' }} />
      </Stack>
    </PreferenciasProvider>
  );
}
