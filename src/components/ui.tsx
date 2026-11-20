import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextProps, type ViewStyle } from 'react-native';

import { Cores, Espaco, STATUS_VISUAL, TOQUE_MINIMO, type StatusLinha } from '@/constants/theme';
import { usePreferencias } from '@/context/preferencias';
import type { Origem } from '@/types';

/** Texto que respeita a preferencia "texto grande" do app e o tamanho de fonte do sistema. */
export function Texto({ tamanho = 16, peso, cor = Cores.texto, style, ...props }: TextProps & { tamanho?: number; peso?: '400' | '600' | '700' | '800'; cor?: string }) {
  const { fs } = usePreferencias();
  return <Text maxFontSizeMultiplier={2} {...props} style={[{ fontSize: fs(tamanho), lineHeight: fs(tamanho) * 1.35, color: cor, fontWeight: peso }, style]} />;
}

export function Titulo({ children }: { children: ReactNode }) {
  return (
    <Texto tamanho={24} peso="800" accessibilityRole="header" style={{ marginBottom: Espaco.sm }}>
      {children}
    </Texto>
  );
}

export function Cartao({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[estilos.cartao, style]}>{children}</View>;
}

export function Botao({ titulo, onPress, variante = 'primario', carregando, desabilitado, dica }: { titulo: string; onPress: () => void; variante?: 'primario' | 'secundario' | 'perigo'; carregando?: boolean; desabilitado?: boolean; dica?: string }) {
  const fundo = variante === 'primario' ? Cores.primaria : variante === 'perigo' ? Cores.critico : Cores.cartao;
  const cor = variante === 'secundario' ? Cores.primaria : Cores.primariaTexto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!desabilitado || !!carregando, busy: !!carregando }}
      disabled={desabilitado || carregando}
      onPress={onPress}
      style={({ pressed }) => [estilos.botao, { backgroundColor: fundo, opacity: desabilitado ? 0.5 : pressed ? 0.85 : 1, borderColor: Cores.primaria }]}>
      {carregando ? <ActivityIndicator color={cor} /> : <Texto peso="700" cor={cor}>{titulo}</Texto>}
    </Pressable>
  );
}

export function Chip({ rotulo, selecionado, onPress }: { rotulo: string; selecionado: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: selecionado, checked: selecionado }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={[estilos.chip, selecionado && { backgroundColor: Cores.primaria, borderColor: Cores.primaria }]}>
      <Texto tamanho={15} peso="600" cor={selecionado ? Cores.primariaTexto : Cores.texto}>
        {selecionado ? '● ' : ''}
        {rotulo}
      </Texto>
    </Pressable>
  );
}

export function SeloStatus({ status, grande }: { status: StatusLinha; grande?: boolean }) {
  const v = STATUS_VISUAL[status];
  return (
    <View style={[estilos.selo, { backgroundColor: v.fundo, borderColor: v.cor }]} accessibilityLabel={`Status: ${v.rotulo}`}>
      <Texto tamanho={grande ? 18 : 14} peso="800" cor={v.cor}>
        {v.icone} {v.rotulo}
      </Texto>
    </View>
  );
}

/** Deixa claro de onde vem a informacao: API ao vivo ou exemplo offline. */
export function AvisoOrigem({ origem }: { origem: Origem | null }) {
  if (origem !== 'exemplo') return null;
  return (
    <View style={estilos.aviso} accessibilityRole="alert">
      <Texto tamanho={14} cor={Cores.aviso} peso="600">
        Sem conexão com o servidor. Mostrando dados de exemplo e os relatos salvos no seu celular.
      </Texto>
    </View>
  );
}

export function Carregando() {
  return (
    <View style={{ padding: Espaco.lg, alignItems: 'center' }} accessibilityLabel="Carregando">
      <ActivityIndicator size="large" color={Cores.primaria} />
    </View>
  );
}

export const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { padding: Espaco.md, paddingBottom: 48, gap: Espaco.md },
  cartao: { backgroundColor: Cores.cartao, borderRadius: 14, padding: Espaco.md, borderWidth: 1, borderColor: Cores.borda, gap: Espaco.sm },
  botao: { minHeight: TOQUE_MINIMO, borderRadius: 12, paddingHorizontal: Espaco.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  chip: { minHeight: TOQUE_MINIMO - 4, paddingHorizontal: 14, borderRadius: 24, borderWidth: 2, borderColor: Cores.borda, backgroundColor: Cores.cartao, justifyContent: 'center' },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espaco.sm },
  selo: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 2 },
  aviso: { backgroundColor: Cores.avisoFundo, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E8C46A' },
  input: { minHeight: TOQUE_MINIMO, borderWidth: 2, borderColor: Cores.borda, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Cores.cartao, color: Cores.texto },
});
