---
name: fabrica-videos-rapido
description: Monta um Reels a partir de uma gravação já feita, sem roteiro prévio. Transcreve, limpa, propõe as animações pelo que foi dito e entrega a prévia. Use quando ele disser "gravei isso, monta", "edita esse vídeo" ou mandar uma gravação pedindo um reel.
---

# /fabrica-videos-rapido — gravação primeiro

Skill da **Fábrica de Vídeos Agêntica**. O cliente grava sem roteiro, manda o vídeo e pede. Você transcreve, limpa, propõe as animações a partir do que ele disse e entrega a prévia. É o caminho curto; o caminho com roteiro aprovado antes é a skill `fabrica-videos-reels`.

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto. `TRABALHO` = a pasta `trabalho`. Antes de escrever código, leia `CLAUDE.md`.

## Quando usar
- "Gravei isso, monta", "edita esse vídeo", "faz um reel com essa gravação".
- Se ele pedir **só corte** → a skill `fabrica-videos-corte`. **Só legenda** → a skill `fabrica-videos-legendas`.

## 3 perguntas (só as que ele não respondeu)
1. **Pilar** (cor): um dos temas da marca (`npm run marca -- listar`).
2. **Formato:** tela dividida com animações em cima (padrão), rosto em tela cheia só com legenda, ou um dos formatos de a skill `fabrica-videos-formatos` (rosto com janela, tela com rosto no canto, tutorial mudo).
3. **Legenda:** ele põe depois, no aplicativo de edição que usa, ou já sai queimada no vídeo.

## Passo a passo
1. **Slug e gravação.** Escolha um slug curto. Copie o original para `TRABALHO\originais\` e converta: `npm run converter -- "<original>" <slug>`.
2. **Limpar** pela skill `fabrica-videos-corte` (passos 2 a 6). Daqui em diante o vídeo é `gravacao-<slug>-limpa.mp4` e a transcrição é `legendas\gravacao-<slug>-limpa.json`.
3. **Ler o que ele disse:** `npm run falas -- legendas\gravacao-<slug>-limpa.json`. Escreva `roteiros\<slug>.md` com a transcrição corrigida (nomes próprios que o Whisper errou), a duração e os fatos citados. Fato que você não consegue conferir vira pergunta para ele, não vira texto na tela.
4. **Storyboard automático** em `roteiros\<slug>-animacoes.md`: uma batida a cada 2–3 s, escolhendo a peça pelo que foi dito. A tabela "Qual peça para o que ele disse" fica no catálogo **`pecas.md` (na pasta da skill `fabrica-videos-peca`)** (imagem `docs\mostruario.jpg`; exemplo de cada peça em `src\Mostruario.tsx`). O que é próprio deste caminho, visto no teste real:

   | Ele disse… | O que fazer |
   |---|---|
   | "traz A, B e C" | `Checklist`, cada item marcado na palavra em que ele fala (uma âncora interna por item) |
   | "se alguém perguntar à IA…" | caixa de chat com a pergunta digitada (é ilustração: diga isso a ele); resposta de IA (`ChatIA`) só com o texto real |
   | o nome de um site, app ou produto | `TelaSite` com print real (`npm run print-site`, guia a skill `fabrica-videos-print-site`, ou print que ele mandou); nunca invente tela |
   | o nome de algo, curto ("chama X") | o nome grande em mono (`tipo.statXl`) na cor do acento, com o endereço embaixo se houver |
   | a pergunta final e o CTA | cena de pergunta + botão Seguir, depois `Encerramento` (ou `TelaFinalReels`, em série) |

   Regras: reaproveite peças de `src\pecas\` antes de criar (peça nova: a skill `fabrica-videos-peca`); nada de emoji piscando, bounce ou efeito fora do design system; um acento por vídeo.
5. **Âncoras:** `roteiros\<slug>.ancoras.json` com as primeiras palavras de cada batida, copiadas da transcrição (sem nomes próprios). Depois
   `npm run batidas -- legendas\gravacao-<slug>-limpa.json roteiros\<slug>.ancoras.json src\videos\<slug>.tempos.json "<vídeo limpo>"`
   (com o vídeo no fim, a `duracaoFala` não passa da duração dele; sem ele, a fala saía 0,3 s mais longa que o vídeo).
6. **Construir** `src\videos\<Nome>.tsx` como na skill `fabrica-videos-reels`, seção 3 (esqueleto do `Exemplo.tsx`, registro em `src\videos\index.tsx`, prop `video` = `"gravacao-<slug>-limpa.mp4"`). Enquadramento: a skill `fabrica-videos-reels`, seção 4, item 5.
   - Legenda queimada: a skill `fabrica-videos-legendas`, caso 2. A `<LegendaQueimada>` vai **depois** do `</TelaDividida>`: dentro dele ela some, porque a metade de cima corta o que passa de 960 px.
7. **Conferir:** `npx tsc` e `npm run folha -- <Id> src\videos\<slug>.tempos.json`. Olhe a folha: nada em vermelho, nada sobreposto, textos cabendo. Para ler detalhe (código, legenda sobre a cabeça), renderize um ou dois quadros em meia escala: `npx remotion still <Id> "<saída>.png" --frame=<n> --scale=0.5`.
8. **Prévia:** `npx remotion render <Id> "trabalho\out\previa-<slug>.mp4"` e mande, junto com: o que você cortou, as batidas que escolheu e as dúvidas de fato (o que é ilustração, o que é esboço sem texto, a palavra que o Whisper ouviu diferente).
9. Ele pede ajustes na conversa. Quando aprovar: render final (`<slug>-final.mp4`) e a skill `fabrica-videos-entrega`. A prévia já sai em qualidade final (1080×1920, mesma composição): se nada mudou depois da aprovação, o final é uma cópia dela. O render sai baixo (cerca de −20 LUFS com a voz do iPhone): o `nivelar` da entrega é quase sempre necessário.

## Formato "rosto em tela cheia só com legenda"
Pule os passos 4 a 7: depois de limpar, siga a skill `fabrica-videos-legendas` (composição `VideoLegendado`, sem código por vídeo).

## O que este caminho não faz
- Não inventa imagem, print nem número: tudo que aparece saiu da fala dele ou de material que ele mandou.
- Não troca o fundo e não gera voz.
