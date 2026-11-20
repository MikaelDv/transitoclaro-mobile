# Uso de IA (copiloto)

Conforme os combinados da GS, a IA foi usada como copiloto para acelerar a escrita e revisar o código. Toda linha foi lida e a equipe sabe explicá-la.

| # | Prompt (resumo) | O que aproveitamos |
|---|---|---|
| 1 | "Leia o README do backend TransitoClaro (repo SOA) e proponha as telas de um app Expo Router que cubra a jornada principal do passageiro." | Estrutura de 4 abas + rota `linha/[id]` |
| 2 | "Crie um cliente REST em TypeScript para `/status`, `/linhas` e `/relatos` (JSON snake_case) com tempo limite e fallback para dados de exemplo quando a API não responder." | `src/services/api.ts` e `src/services/mock.ts` |
| 3 | "Modele um banco SQLite com expo-sqlite para histórico de relatos, fila offline, trajetos, alertas e configurações." | `src/db/database.ts` |
| 4 | "Revise as telas para acessibilidade: área de toque, contraste, leitores de tela, status sem depender só de cor." | `components/ui.tsx`, `accessibility*` nas telas |
| 5 | "Reaproveite as regras do motor PII da disciplina de Cybersecurity para avisar o usuário antes de enviar dados pessoais no relato." | `src/services/privacidade.ts` |
| 6 | "Escreva o README com a Ficha da CitizenTech, instruções e tabela critério → arquivo." | este README |
