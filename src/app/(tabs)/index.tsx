import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { AvisoOrigem, Carregando, Cartao, SeloStatus, Texto, estilos } from '@/components/ui';
import { Cores, Espaco, STATUS_VISUAL } from '@/constants/theme';
import { buscarStatus } from '@/services/api';
import type { Origem, StatusLinhaApi } from '@/types';

const LOTACAO: Record<string, string> = { VAZIO: 'vazio', TRANQUILO: 'tranquilo', CHEIO: 'cheio', LOTADO: 'lotado' };
const TIPO: Record<string, string> = { METRO: 'Metrô', TREM: 'Trem', BRT: 'BRT' };

/** Tela principal: "posso sair agora?" — status de cada linha, piores primeiro. */
export default function AgoraScreen() {
  const [linhas, setLinhas] = useState<StatusLinhaApi[] | null>(null);
  const [origem, setOrigem] = useState<Origem | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [horario, setHorario] = useState('');

  const carregar = useCallback(async () => {
    setAtualizando(true);
    const r = await buscarStatus();
    setLinhas(r.dados);
    setOrigem(r.origem);
    setHorario(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setAtualizando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const criticas = linhas?.filter((l) => l.status === 'CRITICO').length ?? 0;

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={carregar} />}>
      <View accessibilityRole="summary">
        <Texto tamanho={22} peso="800">
          {linhas == null ? 'Carregando…' : criticas > 0 ? `${criticas} linha(s) com problema grave` : 'Nenhuma linha com problema grave'}
        </Texto>
        <Texto tamanho={14} cor={Cores.textoSecundario}>
          Baseado nos relatos de passageiros da última hora{horario ? ` · atualizado às ${horario}` : ''}. Puxe para atualizar.
        </Texto>
      </View>

      <AvisoOrigem origem={origem} />
      {linhas == null && <Carregando />}

      {linhas?.map((l) => {
        const v = STATUS_VISUAL[l.status];
        return (
          <Pressable
            key={l.linha_id}
            accessibilityRole="button"
            accessibilityLabel={`${l.linha}, ${TIPO[l.tipo]}. ${v.rotulo}. ${l.mensagem}`}
            accessibilityHint="Abre os detalhes e os relatos desta linha"
            onPress={() => router.push({ pathname: '/linha/[id]', params: { id: String(l.linha_id), nome: l.linha } })}>
            <Cartao style={{ borderLeftWidth: 8, borderLeftColor: v.cor }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Espaco.sm, flexWrap: 'wrap' }}>
                <Texto tamanho={18} peso="700" style={{ flexShrink: 1 }}>
                  {l.linha}
                </Texto>
                <SeloStatus status={l.status} />
              </View>
              <Texto tamanho={15}>{l.mensagem}</Texto>
              <Texto tamanho={13} cor={Cores.textoSecundario}>
                {TIPO[l.tipo]} · {l.total_relatos} relato(s)
                {l.atraso_medio_minutos > 0 ? ` · atraso médio ${l.atraso_medio_minutos} min` : ''}
                {l.lotacao_predominante ? ` · ${LOTACAO[l.lotacao_predominante]}` : ''}
              </Texto>
            </Cartao>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
