# Marca

Esta pasta é a **marca** de quem usa o estúdio: tudo que muda de uma pessoa para outra na aparência dos vídeos. O motor (peças, formatos, scripts) não cita marca nenhuma; lê daqui.

A que vem no repositório é a `neutra`, um exemplo sem dono. Para pôr a sua, use a skill `/fabrica-videos-marca`.

## Arquivos
| Arquivo | O que guarda |
|---|---|
| `marca.json` | Nome, assinatura, nome e cargo da tarja, cores, temas (uma cor de acento por tema) e o encerramento padrão |
| `fontes.ts` | As três fontes (títulos, texto e mono), do Google Fonts |

## Campos do `marca.json`
- `site`: o que aparece na assinatura ("`site` · seção") e na tela de encerramento. Pode ser um `@nome` ou um endereço.
- `pessoa`: `nome` e `cargo` da tarja dos primeiros 3 segundos.
- `cores`: `bg000` (fundo), `bg100` (cartões), `bg200` (trilhos e molduras), `ink` (texto), `inkMuted` (texto secundário), `line` (bordas finas) e `danger` (só para marcar erro).
- `temas`: um por linha editorial. Cada um tem `acento` (a cor do vídeo), `soft` (a mesma cor em tom suave, para rótulos), `nome` (a seção, que aparece na assinatura) e `textoNoBotao` (o nome de uma cor de `cores`, ou um `#hex`). No código o tema é o prop `pilar`.
- `temaPadrao`: o tema usado nos exemplos e nos valores iniciais.
- `fundo.estrelas`: `true` desenha pontos sutis no fundo; `false` deixa o fundo liso.
- `encerramento`: o tema, a frase e o CTA padrão da tela final de 2 segundos.

## Como o estúdio lê
`src/animacoes/tema.ts` importa os dois arquivos e entrega `ds`, `pilares`, `tipo`, `marca` e `PILAR_PADRAO`. Nenhuma peça importa a marca direto.

## Outras marcas (pasta `marcas/`)
`marcas/<nome>/` guarda marcas que não são a ativa, no mesmo formato. Para ver o estúdio com outra marca sem trocar a ativa:

```
npm run marca -- ver <nome>
```

Sai `trabalho/out/mostruario-<nome>.jpg`. Para tornar uma marca ativa: `npm run marca -- usar <nome>` (a anterior fica guardada em `marcas/_anterior-<data>/`).

## Regras
- Mudou a marca? Rode `npx tsc` e `npm run mostruario` e olhe a imagem: todas as peças mudam juntas.
- O tamanho dos textos, os espaços, os cantos e as zonas do Instagram ficam no `tema.ts`: são do motor, não da marca.
- O jeito de mover e de desenhar (entrada, flutuação, perspectiva, brilho, fundo) é do **estilo**, em `estilos/`, e combina com qualquer marca. Ver `estilos/README.md`.
