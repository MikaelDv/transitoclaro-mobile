import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';

import { Botao, Cartao, Texto, estilos } from '@/components/ui';
import { Cores, Espaco } from '@/constants/theme';
import { usePreferencias } from '@/context/preferencias';
import { apagarHistorico, listarRelatos } from '@/db/database';
import type { RelatoLocal } from '@/db/tipos';
import { definirUrlApi, sincronizarPendentes, urlApi } from '@/services/api';

const TIPO: Record<string, string> = { ATRASO: 'Atraso', LOTACAO: 'Lotação', FALHA_OPERACIONAL: 'Falha' };

/** Historico local (SQLite), fila offline e ajustes de acessibilidade/servidor. */
export default function PerfilScreen() {
  const { textoGrande, alternarTextoGrande } = usePreferencias();
  const [relatos, setRelatos] = useState<RelatoLocal[]>([]);
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async () => {
    setRelatos(await listarRelatos());
    setUrl(await urlApi());
  }, []);
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const pendentes = relatos.filter((r) => r.sincronizado === 0).length;

  async function sincronizar() {
    setSincronizando(true);
    const n = await sincronizarPendentes();
    setMsg(n > 0 ? `${n} relato(s) enviado(s).` : 'Servidor indisponível. Tente mais tarde.');
    await carregar();
    setSincronizando(false);
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <Cartao>
        <Texto tamanho={18} peso="700" accessibilityRole="header">Seus relatos</Texto>
        <Texto tamanho={15}>
          {relatos.length} enviado(s) · {pendentes} aguardando internet
        </Texto>
        {pendentes > 0 && <Botao titulo="Enviar pendentes agora" onPress={sincronizar} carregando={sincronizando} />}
        {msg ? <Texto tamanho={14} cor={Cores.textoSecundario} accessibilityLiveRegion="polite">{msg}</Texto> : null}
      </Cartao>

      {relatos.map((r) => (
        <Cartao key={r.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Espaco.sm, flexWrap: 'wrap' }}>
            <Texto peso="700">{r.linha_nome}</Texto>
            <Texto tamanho={13} peso="700" cor={r.sincronizado ? Cores.normal : Cores.moderado}>
              {r.sincronizado ? '✓ Enviado' : '⏳ Na fila'}
            </Texto>
          </View>
          <Texto tamanho={15}>
            {TIPO[r.tipo]}
            {r.minutos_atraso ? ` · ${r.minutos_atraso} min` : ''}
            {r.nivel_lotacao ? ` · ${r.nivel_lotacao.toLowerCase()}` : ''}
          </Texto>
          {r.descricao ? <Texto tamanho={14} cor={Cores.textoSecundario}>“{r.descricao}”</Texto> : null}
          <Texto tamanho={12} cor={Cores.textoSecundario}>{new Date(r.criado_em).toLocaleString('pt-BR')}</Texto>
        </Cartao>
      ))}

      <Cartao>
        <Texto tamanho={18} peso="700" accessibilityRole="header">Ajustes</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          <Texto style={{ flex: 1 }}>Texto grande</Texto>
          <Switch value={textoGrande} onValueChange={alternarTextoGrande} accessibilityLabel="Texto grande" trackColor={{ true: Cores.primaria }} />
        </View>
        <Texto tamanho={15}>Endereço do servidor TransitoClaro</Texto>
        <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="Endereço do servidor" style={[estilos.input, { fontSize: 15 }]} />
        <Botao titulo="Salvar endereço" variante="secundario" onPress={() => definirUrlApi(url).then(() => setMsg('Endereço salvo.'))} />
        <Botao titulo="Apagar meu histórico" variante="perigo" onPress={() => apagarHistorico().then(carregar)} dica="Apaga os relatos salvos neste celular" />
        <Texto tamanho={13} cor={Cores.textoSecundario}>
          Privacidade: o TransitoClaro não pede nome, CPF ou telefone. Seus relatos são anônimos e o histórico fica só neste celular.
        </Texto>
      </Cartao>
    </ScrollView>
  );
}
