import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';

import { Botao, Cartao, Chip, Texto, estilos } from '@/components/ui';
import { Cores, Espaco } from '@/constants/theme';
import { salvarRelato } from '@/db/database';
import { ErroApi, buscarLinhas, enviarRelato } from '@/services/api';
import { removerDadosPessoais, verificarPrivacidade } from '@/services/privacidade';
import type { Linha, NivelLotacao, TipoOcorrencia } from '@/types';

const TIPOS: { valor: TipoOcorrencia; rotulo: string }[] = [
  { valor: 'ATRASO', rotulo: '⏱ Atraso' },
  { valor: 'LOTACAO', rotulo: '👥 Lotação' },
  { valor: 'FALHA_OPERACIONAL', rotulo: '⚠ Falha / parado' },
];
const NIVEIS: { valor: NivelLotacao; rotulo: string }[] = [
  { valor: 'VAZIO', rotulo: 'Vazio' },
  { valor: 'TRANQUILO', rotulo: 'Tranquilo' },
  { valor: 'CHEIO', rotulo: 'Cheio' },
  { valor: 'LOTADO', rotulo: 'Lotado' },
];
const MINUTOS = [5, 10, 15, 20, 30, 45];

/** Jornada principal: em 3 toques o passageiro avisa os outros sobre o que esta acontecendo. */
export default function RelatarScreen() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [linhaId, setLinhaId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoOcorrencia | null>(null);
  const [nivel, setNivel] = useState<NivelLotacao | null>(null);
  const [minutos, setMinutos] = useState<number | null>(null);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    buscarLinhas().then((r) => setLinhas(r.dados));
  }, []);

  const avisos = useMemo(() => verificarPrivacidade(descricao), [descricao]);
  const completo = linhaId != null && tipo != null && (tipo !== 'ATRASO' || minutos != null) && (tipo !== 'LOTACAO' || nivel != null);

  const limpar = () => {
    setTipo(null);
    setNivel(null);
    setMinutos(null);
    setDescricao('');
  };

  async function enviar() {
    if (!completo || linhaId == null || tipo == null) return;
    if (avisos.length > 0) {
      Alert.alert('Dados pessoais no texto', 'Remova os dados pessoais antes de enviar. O relato é anônimo.');
      return;
    }
    setEnviando(true);
    const linha = linhas.find((l) => l.id === linhaId)!;
    const novo = {
      linha_id: linhaId,
      tipo,
      nivel_lotacao: tipo === 'LOTACAO' ? nivel : null,
      minutos_atraso: tipo === 'ATRASO' ? minutos : null,
      descricao: descricao.trim() || null,
    };
    try {
      const remoto = await enviarRelato(novo);
      await salvarRelato({ ...novo, linha_nome: linha.nome }, remoto != null, remoto?.id ?? null);
      limpar();
      const msg = remoto ? 'Obrigado! Seu relato já ajuda outros passageiros.' : 'Sem internet agora. O relato ficou salvo no celular e será enviado depois (aba Meus relatos).';
      if (Platform.OS === 'web') router.push('/');
      else Alert.alert('Relato registrado', msg, [{ text: 'Ver situação das linhas', onPress: () => router.push('/') }]);
    } catch (e) {
      Alert.alert('Não foi possível enviar', e instanceof ErroApi ? e.message : 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Texto tamanho={15} cor={Cores.textoSecundario}>
          Relato anônimo: não pedimos nome, CPF ou telefone.
        </Texto>

        <Cartao>
          <Texto peso="700" accessibilityRole="header">1. Em qual linha você está?</Texto>
          <View style={estilos.linhaChips} accessibilityRole="radiogroup">
            {linhas.map((l) => (
              <Chip key={l.id} rotulo={l.nome} selecionado={linhaId === l.id} onPress={() => setLinhaId(l.id)} />
            ))}
          </View>
        </Cartao>

        <Cartao>
          <Texto peso="700" accessibilityRole="header">2. O que está acontecendo?</Texto>
          <View style={estilos.linhaChips} accessibilityRole="radiogroup">
            {TIPOS.map((t) => (
              <Chip key={t.valor} rotulo={t.rotulo} selecionado={tipo === t.valor} onPress={() => setTipo(t.valor)} />
            ))}
          </View>
          {tipo === 'ATRASO' && (
            <>
              <Texto tamanho={15}>Quantos minutos de atraso, mais ou menos?</Texto>
              <View style={estilos.linhaChips} accessibilityRole="radiogroup">
                {MINUTOS.map((m) => (
                  <Chip key={m} rotulo={`${m} min`} selecionado={minutos === m} onPress={() => setMinutos(m)} />
                ))}
              </View>
            </>
          )}
          {tipo === 'LOTACAO' && (
            <>
              <Texto tamanho={15}>Como está a lotação?</Texto>
              <View style={estilos.linhaChips} accessibilityRole="radiogroup">
                {NIVEIS.map((n) => (
                  <Chip key={n.valor} rotulo={n.rotulo} selecionado={nivel === n.valor} onPress={() => setNivel(n.valor)} />
                ))}
              </View>
            </>
          )}
        </Cartao>

        <Cartao>
          <Texto peso="700" accessibilityRole="header">3. Quer contar mais? (opcional)</Texto>
          <TextInput
            value={descricao}
            onChangeText={(t) => setDescricao(t.slice(0, 280))}
            placeholder="Ex.: trem parado entre Brás e Tatuapé"
            placeholderTextColor={Cores.textoSecundario}
            multiline
            maxLength={280}
            accessibilityLabel="Descrição do relato, opcional, até 280 caracteres"
            style={[estilos.input, { minHeight: 90, textAlignVertical: 'top', fontSize: 16 }]}
          />
          <Texto tamanho={13} cor={Cores.textoSecundario}>{descricao.length}/280</Texto>
          {avisos.length > 0 && (
            <View style={[estilos.aviso, { gap: Espaco.sm }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Texto tamanho={15} peso="700" cor={Cores.aviso}>
                🔒 Proteja seus dados: encontramos {avisos.map((a) => a.tipo).join(', ')} no texto.
              </Texto>
              <Texto tamanho={14} cor={Cores.aviso}>Este relato fica visível para outros passageiros. Não é preciso informar dados pessoais.</Texto>
              <Botao titulo="Remover dados pessoais" variante="secundario" onPress={() => setDescricao(removerDadosPessoais(descricao))} />
            </View>
          )}
        </Cartao>

        <Botao titulo="Enviar relato" onPress={enviar} carregando={enviando} desabilitado={!completo} dica="Envia o relato anônimo para os outros passageiros" />
        {!completo && <Texto tamanho={13} cor={Cores.textoSecundario} style={{ textAlign: 'center' }}>Escolha a linha e o que está acontecendo para enviar.</Texto>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
