---
name: fabrica-videos-capa
description: Faz a capa 1080x1920 de um Reels a partir de um quadro do vídeo ou de uma foto, com rótulo e título no padrão da marca, dentro da área que aparece no grid. Use quando ele pedir a capa de um vídeo.
---

# /fabrica-videos-capa — capa do vídeo

Skill da **Fábrica de Vídeos Agêntica**. Faz a capa 1080×1920 de um Reels: um quadro do vídeo ou uma foto de fundo, escurecido por igual, com rótulo e título grande no padrão da marca.

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto. `TRABALHO` = a pasta `trabalho`.

## Quando usar
- "Faz a capa desse vídeo", "quero uma capa com o título X".
- Na skill `fabrica-videos-entrega`, quando o quadro tirado do vídeo não serve de capa.

## Passo a passo
1. **Fundo e props:** `npm run capa -- <slug> "<vídeo ou foto>" [segundo]`
   - de um vídeo, tira o quadro do `segundo` (padrão 1,5). Escolha um momento de olho aberto e boca fechada: extraia alguns quadros e olhe antes;
   - de uma foto, usa a foto;
   - sem arquivo (`npm run capa -- <slug>`), a capa sai só com o fundo da marca.
   Gera `TRABALHO\public\capas\<slug>-fundo.jpg` e `roteiros\<slug>.capa.json`.
2. **Editar `roteiros\<slug>.capa.json`:**
   | Campo | O que é |
   |---|---|
   | `titulo` | Curto (até 6 palavras), com **uma** `*palavra-chave*` na cor do pilar. É o gancho do vídeo, não o resumo |
   | `rotulo` | Linha pequena acima do título (o assunto ou a fonte). Pode ficar vazio |
   | `pilar` | um dos temas da marca (`npm run marca -- listar`) |
   | `canto` | `"CAP. 04"` em série; vazio mostra o nome do pilar |
   | `posicao` | `baixo` (título embaixo, rosto em cima) ou `cima` |
   | `enquadramento` | Posição da imagem de fundo, ex.: `"50% 30%"` |
   | `escurecer` | De 0 a 0,9. Padrão 0,45; suba se o título não ler bem |
   | `tamanho` | Tamanho do título (padrão 124). Diminua se passar de 3 linhas |
3. **Conferir com o guia:** troque `mostrarGuia` para `true` numa cópia em `trabalho\out\` e rode
   `npx remotion still Capa "trabalho\out\capa-guia.png" --props="trabalho\out\<slug>.capa.json" --scale=0.4`.
   Título, rótulo e rosto precisam estar **fora da área vermelha**: só o que fica entre y=420 e y=1500 aparece na miniatura do grid.
4. **Renderizar:** `npx remotion still Capa "trabalho\out\<slug>-capa.png" --props=roteiros\<slug>.capa.json` (se o fundo veio de gravação ou foto em 4K, o `npm run capa` manda acrescentar `--scale=2`: a capa sai em 2160×3840, na mesma qualidade)
5. Olhe a imagem, mande a ele e copie para `entregas\<data>-<slug>\capa.png`.

## Regras do design system
- Escurecimento por igual, sem gradiente. O único efeito é o halo na cor do pilar atrás do título.
- Uma cor de acento. Título na fonte de títulos da marca; nada de contorno ou sombra na letra.
- Se o fato do título mudar (uma nota, um número), a capa muda junto com a fala, a tela e a legenda do post.

## Limites
- Não recorta a pessoa do fundo sozinha. Para uma capa com a pessoa recortada, use um quadro de `npm run recortar` (a pessoa sai com transparência).
- Não põe ícones nem emojis: o design system não usa.
