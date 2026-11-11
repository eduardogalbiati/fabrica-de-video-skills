# Exemplo: storyboard

Uma batida a cada 2 a 3 segundos. A área das animações é a metade de cima da tela (1080×960). Código em `src/videos/Exemplo.tsx`.

| Cena | Entra em | Frase que abre a cena (âncora) | Peça | O que acontece |
|---|---|---|---|---|
| gancho | 0,0 s | "Dá para organizar" | `TituloCena` + `Halo` | Título centralizado, "3 passos" na cor do tema |
| passos | 2,6 s | "Primeiro, escolha" | `Checklist` | Três itens entram; cada um é marcado quando é dito (quadros 30, 55 e 80 da cena) |
| comparacao | 6,4 s | "Com a lista" | `Barras` | Barra cinza (4) e barra em destaque (9) |
| resultado | 9,6 s | "No fim" | `AntesDepois` | Anel cinza em 44 e anel do tema subindo até 90 |
| pergunta | 12,6 s | "Qual é a sua" | `TituloCena` + `Halo` | Pergunta centralizada |
| (fim) | 15,4 s | | `Encerramento` | Tela final de 2 s com a assinatura e o CTA da marca |

## Conferência

`npm run folha -- Exemplo src/videos/exemplo.tempos.json` gera a folha de contato com o guia das zonas ligado. Nada pode cair em área vermelha.
