---
name: fabrica-videos-legendas
description: Legenda queimada no vídeo no padrão da marca, em frases inteiras e com a palavra-chave na cor do pilar. Use quando ele pedir para pôr legenda num vídeo ou quiser a legenda já pronta.
---

# /fabrica-videos-legendas — legenda queimada com palavra em destaque

Skill da **Fábrica de Vídeos Agêntica**. Queima a legenda no vídeo, no padrão da marca: frases inteiras, no máximo 2 linhas, na fonte de texto da marca, sobre tarja escura, **uma palavra-chave por frase na cor do pilar**. Sem animação palavra a palavra. Se a pessoa pedir legenda que flui palavra por palavra, use o **modelo fluido** (seção abaixo).

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto. `TRABALHO` = a pasta `trabalho`.

## Quando usar
- "Põe legenda", "legenda esse vídeo", "quero a legenda já no vídeo".
- Muita gente legenda depois, num aplicativo de edição. Esta skill só entra quando ele pede; não queime legenda por conta própria.

## Caso 1: vídeo de rosto em tela cheia (sem animações)
Não precisa de código por vídeo.
1. O vídeo precisa estar em `TRABALHO\public\`, em 1080×1920 (se veio do celular: `npm run converter`; se tem pausas e erros: a skill `fabrica-videos-corte` antes).
2. Transcrever: `npm run legendar -- "<vídeo>"`.
3. Paginar: `npm run paginar -- legendas\<nome>.json "<vídeo>" <pilar>` → `legendas\<nome>.legenda.json`. O paginador já não termina página em palavra que pede continuação ("direto no / Claude"), junta página de menos de 1 s à anterior quando cabe e cola extensões que o Whisper separa ("arquivo .txt" → "arquivo.txt").
4. **Revisar o arquivo** (é aqui que a legenda fica boa):
   - corrija nomes e termos que o Whisper errou (Claude, Vercel, MCP, JSON, nomes de sites). Na gravação real: "cloud" → Claude, "chat de apt" → ChatGPT;
   - se duas transcrições do mesmo trecho discordam (no teste real, "tá chutando" numa e "está chutando" na outra), escolha uma e cite na mensagem a ele;
   - marque **uma** palavra-chave por página com asteriscos: `"Meu site tirou *100 de 100*"`. É o número, o nome ou o verbo que carrega a frase;
   - página partida no lugar errado: junte ou divida à mão (cuide de `de` e `ate`, em segundos);
   - `pilar`: um dos temas da marca (`npm run marca -- listar`);
   - `posicao`: `terco-superior` (rosto em tela cheia), `faixa` (logo abaixo da divisão da tela dividida) ou `base`;
   - `enquadramento`: posição do vídeo no quadro, ex.: `"50% 50%"`.
5. Conferir um quadro com o guia das zonas: copie o arquivo para `trabalho\out\`, troque `mostrarGuia` para `true` e rode
   `npx remotion still VideoLegendado "trabalho\out\legenda.png" --props="trabalho\out\<arquivo>.json" --frame=60 --scale=0.4`. A legenda não pode cair em área vermelha nem cobrir a boca.
6. Renderizar: `npx remotion render VideoLegendado "trabalho\out\<slug>-legendado.mp4" --props=legendas\<nome>.legenda.json`.
7. Mandar a ele e fechar pela skill `fabrica-videos-entrega`.

`npm run paginar` não sobrescreve um arquivo que já existe (você pode ter marcado as palavras-chave). Para gerar de novo, acrescente `refazer` no fim do comando.

Outro jeito de legendar, a escolher quando ele pedir "legenda fluida" ou "palavra por palavra":
- **Como fica:** de 1 a 3 palavras por vez, em letra de título grande (70 px), sem tarja. Cada palavra entra no instante em que é falada e o bloco troca no seguinte. As palavras-chave saem na cor do tema (no estilo palco, também em itálico).
- **Fundo:** um véu escuro e difuso atrás das palavras ajuda a ler sobre fundo claro. Não é sombra no texto.
- **Peça:** `LegendaFluida`. Composição: a mesma `VideoLegendado`, com `modelo: "fluida"`.

Passos: os mesmos do caso 1, com estas diferenças.
1. **Paginar:** `npm run paginar -- legendas\<nome>.json "<vídeo>" <pilar> fluida` gera `legendas\<nome>.fluida.json`.
   - Blocos de até 3 palavras e 20 letras, quebrando em pausa de 0,35 s e em pontuação.
   - Sem pontuação na tela.
   - A palavra que abre frase sai em minúscula.
   - Palavra pendurada ("de", "o", "no") vai para o bloco seguinte.
2. **Revisar:**
   - nomes que o Whisper errou; a primeira palavra de frase que é nome próprio volta a ter maiúscula;
   - "chat de apt" vira um bloco só, "ChatGPT", com o tempo da primeira palavra;
3. **Posição:**
   - tela dividida: `posicao: "faixa"` e `centroLegenda: 0`.
4. **Conferir:** quadros com as zonas: `npm run quadros -- VideoLegendado 2s,10s,20s 0.3 legendas\<nome>.fluida.json guia`.
5. **Renderizar:** `npx remotion render VideoLegendado "<saída>.mp4" --props=legendas\<nome>.fluida.json`.

Num reel com animações, use a peça direto, fora do `<TelaDividida>`: `<LegendaFluida blocos={fluida.blocos} acento={acento} posicao="faixa" />`.

## Caso 2: reel com animações (tela dividida)
A peça é a mesma, dentro da composição do vídeo:
```tsx
import { LegendaQueimada } from "../pecas/LegendaQueimada";
import legenda from "../../legendas/gravacao-<slug>-limpa.legenda.json";
// dentro do JSX, depois do <TelaDividida>…</TelaDividida>:
<LegendaQueimada paginas={legenda.paginas} acento={acento} posicao="faixa" />
```
Gere o `.legenda.json` pelos passos 2 a 4 acima. A peça vai **fora** do `<TelaDividida>` (dentro dele ela some: a metade de cima corta o que passa de 960 px). Confira na folha de contato (`npm run folha`) se a legenda fica dentro da faixa verde. Com o enquadramento `"50% 47.9%"` a tarja cobre só o alto da cabeça, nunca olhos ou boca.

## Regras do design system para legenda
- No máximo 2 linhas; frases trocando a cada 2 a 3 s.
- Uma palavra-chave por frase, na cor do pilar. Nunca duas cores.
- Tarja na cor de fundo da marca com cantos de 8 px. Nada de contorno, sombra ou palavra pulando.
- O vídeo precisa se entender sem som: a legenda carrega a mensagem inteira.
- **Exceção:** o modelo fluido (acima) mostra palavra por palavra, sem tarja. Ele só entra quando a pessoa pede. A entrada de cada palavra é curta (5 quadros, subida pequena) e nunca pula.

## Onde está o código
- Peça: `src\pecas\LegendaQueimada.tsx` (frases) e `src\pecas\LegendaFluida.tsx` (fluida).
- Composição pronta: `src\videos\VideoLegendado.tsx` (Id `VideoLegendado`).
- Paginador: `scripts\paginar.mjs`.
