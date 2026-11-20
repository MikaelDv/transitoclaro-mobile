import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { AvisoOrigem, Botao, Carregando, Cartao, SeloStatus, Texto, estilos } from '@/components/ui';
import { Cores } from '@/constants/theme';
import { buscarRelatosDaLinha, buscarStatus } from '@/services/api';
import type { Origem, RelatoApi, StatusLinhaApi } from '@/types';

const TIPO: Record<string, string> = { ATRASO: '⏱ Atraso', LOTACAO: '👥 Lotação', FALHA_OPERACIONAL: '⚠ Falha' };

function haQuanto(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`;
}

export default function LinhaScreen() {
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const linhaId = Number(id);
  const [status, setStatus] = useState<StatusLinhaApi | null>(null);
  const [relatos, setRelatos] = useState<RelatoApi[] | null>(null);
  const [origem, setOrigem] = useState<Origem | null>(null);

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([buscarStatus(), buscarRelatosDaLinha(linhaId)]);
      setStatus(s.dados.find((x) => x.linha_id === linhaId) ?? null);
      setRelatos(r.dados);
      setOrigem(r.origem === 'api' && s.origem === 'api' ? 'api' : 'exemplo');
    })();
  }, [linhaId]);

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Stack.Screen options={{ title: nome ?? 'Linha' }} />
      <AvisoOrigem origem={origem} />
      {status && (
        <Cartao>
          <SeloStatus status={status.status} grande />
          <Texto tamanho={18} peso="600">{status.mensagem}</Texto>
          <Texto tamanho={14} cor={Cores.textoSecundario}>
            {status.total_relatos} relato(s) na última hora · atraso médio {status.atraso_medio_minutos} min
          </Texto>
        </Cartao>
      )}
      <Texto tamanho={18} peso="700" accessibilityRole="header">Relatos recentes</Texto>
      {relatos == null && <Carregando />}
      {relatos?.length === 0 && <Texto cor={Cores.textoSecundario}>Nenhum relato recente nesta linha.</Texto>}
      {relatos?.map((r) => (
        <Cartao key={r.id}>
          <Texto peso="700">
            {TIPO[r.tipo]}
            {r.minutos_atraso ? ` · ${r.minutos_atraso} min` : ''}
            {r.nivel_lotacao ? ` · ${r.nivel_lotacao.toLowerCase()}` : ''}
          </Texto>
          {r.descricao ? <Texto tamanho={15}>{r.descricao}</Texto> : null}
          <Texto tamanho={13} cor={Cores.textoSecundario}>{haQuanto(r.criado_em)}</Texto>
        </Cartao>
      ))}
      <Botao titulo="Relatar algo nesta linha" onPress={() => router.push('/relatar')} />
    </ScrollView>
  );
}
