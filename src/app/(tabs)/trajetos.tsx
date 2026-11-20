import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { AvisoOrigem, Botao, Cartao, Chip, SeloStatus, Texto, estilos } from '@/components/ui';
import { Cores, Espaco, STATUS_VISUAL, type StatusLinha } from '@/constants/theme';
import { listarTrajetos, removerTrajeto, salvarAlerta, salvarTrajeto, ultimosAlertas } from '@/db/database';
import type { AlertaLocal, Trajeto } from '@/db/tipos';
import { buscarLinhas, buscarStatus } from '@/services/api';
import type { Linha, Origem } from '@/types';

const PESO: Record<StatusLinha, number> = { NORMAL: 0, MODERADO: 1, CRITICO: 2 };
const CONSELHO: Record<StatusLinha, (linha: string) => string> = {
  NORMAL: () => 'Pode sair no horário de sempre: todas as linhas do trajeto estão normais.',
  MODERADO: (l) => `Saia uns 15 minutos antes: ${l} está com lentidão ou lotação.`,
  CRITICO: (l) => `Evite sair agora ou use outra rota: ${l} está com problema grave.`,
};
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** O passageiro salva os trajetos do dia a dia e, antes de sair, recebe um conselho simples. */
export default function TrajetosScreen() {
  const [trajetos, setTrajetos] = useState<Trajeto[]>([]);
  const [alertas, setAlertas] = useState<Record<number, AlertaLocal>>({});
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [origem, setOrigem] = useState<Origem | null>(null);
  const [verificando, setVerificando] = useState<number | null>(null);
  // formulario
  const [nome, setNome] = useState('');
  const [hora, setHora] = useState('07:30');
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setTrajetos(await listarTrajetos());
    const a = await ultimosAlertas();
    setAlertas(Object.fromEntries(a.map((x) => [x.trajeto_id, x])));
  }, []);

  useEffect(() => {
    buscarLinhas().then((r) => setLinhas(r.dados));
  }, []);
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  const nomeLinha = (id: number) => linhas.find((l) => l.id === id)?.nome ?? `Linha ${id}`;
  const alternar = (id: number) => setSelecionadas((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 6 ? [...s, id] : s));

  async function criar() {
    if (nome.trim().length < 2) return setErro('Dê um nome ao trajeto (ex.: Casa-Trabalho).');
    if (!HORA_VALIDA.test(hora)) return setErro('Horário no formato HH:MM, ex.: 07:30.');
    if (selecionadas.length === 0) return setErro('Escolha pelo menos uma linha.');
    setErro('');
    await salvarTrajeto(nome.trim(), hora, selecionadas);
    setNome('');
    setSelecionadas([]);
    recarregar();
  }

  async function verificar(t: Trajeto) {
    setVerificando(t.id);
    const r = await buscarStatus();
    setOrigem(r.origem);
    const doTrajeto = r.dados.filter((s) => t.linha_ids.includes(s.linha_id));
    const pior = doTrajeto.sort((a, b) => PESO[b.status] - PESO[a.status])[0];
    const status: StatusLinha = pior?.status ?? 'NORMAL';
    await salvarAlerta({ trajeto_id: t.id, status, mensagem: CONSELHO[status](pior?.linha ?? ''), linha_mais_afetada: status === 'NORMAL' ? null : (pior?.linha ?? null) });
    await recarregar();
    setVerificando(null);
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <AvisoOrigem origem={origem} />
      {trajetos.length === 0 && (
        <Texto cor={Cores.textoSecundario}>Você ainda não tem trajetos. Cadastre abaixo o caminho que faz todo dia.</Texto>
      )}

      {trajetos.map((t) => {
        const a = alertas[t.id];
        return (
          <Cartao key={t.id} style={a ? { borderLeftWidth: 8, borderLeftColor: STATUS_VISUAL[a.status].cor } : undefined}>
            <Texto tamanho={18} peso="700">{t.nome} · {t.horario_saida}</Texto>
            <Texto tamanho={14} cor={Cores.textoSecundario}>{t.linha_ids.map(nomeLinha).join(' → ')}</Texto>
            {a && (
              <View style={{ gap: Espaco.xs }} accessibilityLiveRegion="polite">
                <SeloStatus status={a.status} grande />
                <Texto tamanho={16} peso="600">{a.mensagem}</Texto>
                <Texto tamanho={12} cor={Cores.textoSecundario}>
                  Verificado às {new Date(a.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Texto>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: Espaco.sm }}>
              <View style={{ flex: 2 }}>
                <Botao titulo="Posso sair agora?" onPress={() => verificar(t)} carregando={verificando === t.id} />
              </View>
              <View style={{ flex: 1 }}>
                <Botao titulo="Excluir" variante="secundario" onPress={() => removerTrajeto(t.id).then(recarregar)} dica={`Exclui o trajeto ${t.nome}`} />
              </View>
            </View>
          </Cartao>
        );
      })}

      <Cartao>
        <Texto tamanho={18} peso="700" accessibilityRole="header">Novo trajeto</Texto>
        <Texto tamanho={15}>Nome</Texto>
        <TextInput value={nome} onChangeText={setNome} placeholder="Casa-Faculdade" placeholderTextColor={Cores.textoSecundario} maxLength={40} accessibilityLabel="Nome do trajeto" style={[estilos.input, { fontSize: 16 }]} />
        <Texto tamanho={15}>Horário de saída</Texto>
        <TextInput value={hora} onChangeText={setHora} placeholder="07:30" placeholderTextColor={Cores.textoSecundario} maxLength={5} keyboardType="numbers-and-punctuation" accessibilityLabel="Horário de saída no formato horas e minutos" style={[estilos.input, { fontSize: 16 }]} />
        <Texto tamanho={15}>Linhas que você usa (na ordem)</Texto>
        <View style={estilos.linhaChips}>
          {linhas.map((l) => (
            <Chip key={l.id} rotulo={selecionadas.includes(l.id) ? `${selecionadas.indexOf(l.id) + 1}. ${l.nome}` : l.nome} selecionado={selecionadas.includes(l.id)} onPress={() => alternar(l.id)} />
          ))}
        </View>
        {erro ? <Texto tamanho={14} cor={Cores.critico} accessibilityRole="alert">{erro}</Texto> : null}
        <Botao titulo="Salvar trajeto" onPress={criar} />
      </Cartao>
    </ScrollView>
  );
}
