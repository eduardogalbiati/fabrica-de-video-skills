---
name: fabrica-videos-reels
description: Produz um Reels do cliente com roteiro e storyboard aprovados antes de gravar, animações presas à fala, sincronização com a gravação e render final. Use quando ele pedir um vídeo, Reels ou roteiro novo, ou para continuar um vídeo já roteirizado (por exemplo "/fabrica-videos-reels <tema>" ou "gravei o <slug>").
---

# /fabrica-videos-reels — do roteiro ao MP4

Skill da **Fábrica de Vídeos Agêntica** (ver a skill `fabrica-videos`). É o caminho "roteiro primeiro": o cliente aprova o roteiro e o storyboard antes de gravar. Se ele já gravou sem roteiro, use a skill `fabrica-videos-rapido`.

Fale em português, em linguagem simples (quem pede o vídeo quase nunca programa). Mostre o progresso com prévias renderizadas, não com código.
Antes de escrever código Remotion, leia `CLAUDE.md` (regras do design system, onde fica cada arquivo e os comandos) e, se as skills oficiais do Remotion estiverem instaladas, a `remotion-best-practices`.
O exemplo completo e aprovado é o vídeo **Exemplo**: `roteiros/exemplo*.{md,json}` + `src/videos/Exemplo.tsx`. Copie a estrutura dele.

Todos os comandos rodam no terminal, na raiz do projeto. Nas tabelas abaixo, `TRABALHO` = a pasta `trabalho` (fora do git).

## 0. Descubra em que etapa o vídeo está

Escolha um `slug` curto (ex.: `minha-ideia`) e veja o que já existe:

| Existe… | Então vá para |
|---|---|
| nada | 1. Roteiro |
| `roteiros/<slug>.md` aprovado, sem `-animacoes.md` | 2. Storyboard |
| storyboard, sem `src/videos/<Nome>.tsx` | 3. Construir |
| composição pronta + gravação nova (ele avisa onde salvou) | 4. Gravação |
| `TRABALHO\out\<slug>-final.mp4` | 5. Entrega |

Diga em uma linha em que etapa está e siga. Etapas 1 e 2 são conversas: proponha, ouça, refine; só avance com aprovação dele.

## 1. Roteiro → `roteiros/<slug>.md`

- Monte o roteiro aqui, em conversa com o cliente. Pergunte: tema (ou links/vídeo de referência), pilar (um dos temas da marca), duração alvo (30–60 s ≈ 2,5 palavras/s).
- Estrutura igual a `roteiros/exemplo.md`: blocos com início estimado, fala, card; dicionário de analogias se o público for leigo; **texto corrido para gravar**; prints necessários; **fatos checados com links**.
- Voz (ajuste à pessoa; as regras dela ficam com a marca): primeira pessoa, frases curtas, números concretos; gancho nos 3 primeiros segundos; nunca "revolucionário"/"o futuro chegou"; fecha com pergunta + CTA. Alarme vira pergunta, não afirmação. Não invente notícia.

## 2. Storyboard → `roteiros/<slug>-animacoes.md` + `roteiros/<slug>.ancoras.json`

- Por batida (troca visual a cada 2–3 s): tempo, frase, o que aparece em cima (área 1080×960).
- Reaproveite peças de `src/pecas/` antes de criar novas: `RedeNeural` + `Bisturi` (o "cérebro" da IA), `GradeConexoes`, `LoopPensando`, `Lupa`, `ContadorBarra`, `TrocaPrints`, `TextoRiscado` (modos `riscar`/`somar`), `OlhoRiscado`, `LinhaVersoes`; helpers `TituloCena`, `Halo`, `RotuloMono`, `aparece` em `util.tsx`.
- `ancoras.json`: `{ "cena": "primeiras palavras faladas nela" }` **na ordem da fala**. Evite nomes próprios nas âncoras (o Whisper erra: "Qwen"→"quen", "Claude"→"clou", "OpenAPI"→"OpenAI", e também "Vercel", "MCP", "JSON"). Batidas internas de uma cena (ex.: o momento de riscar) também viram âncoras.

## 3. Construir → `src/videos/<Nome>.tsx`

1. Copie o esqueleto de `Exemplo.tsx`: schema zod (pilar, video, enquadramento, mostrarGuia, nome, cargo, prints, encerramento, `tempos`), `TelaDividida` por fora, uma `<Sequence>` + `<Cena>` (fade de 6 frames) por cena, `Encerramento` de 2 s no fim. Registre em `src/videos/index.tsx`, dentro de `<Folder name="Videos">` com `calculateMetadata` (duração = `duracaoFala` + 2 s).
2. Cada cena é **um componente próprio** que chama `useCurrentFrame()` (nunca chame hooks dentro de funções de um objeto/array no componente pai: o frame sai errado).
3. Peças novas vão para `src/pecas/` (genéricas, com props), seguindo os tokens de `src/animacoes/tema.ts`.
4. Prints e imagens da peça (arquivos pequenos): salve em `public\<slug>\` **desta pasta** e rode `npm run preparar`.
5. Fala provisória para testar antes da gravação: grave o texto corrido em `roteiros\<slug>.fala.txt` (UTF-8) e rode
   `npm run fala -- <slug> roteiros\<slug>.fala.txt` → `TRABALHO\public\previa\fala-<slug>.mp4` (voz do sistema, 1080×960).
   Depois `npm run legendar` + `npm run batidas` (seção 4) para gerar `src/videos/<slug>.tempos.json`, com o prop `video` = `"previa/fala-<slug>.mp4"`.
6. Verifique: `npx tsc` e a folha de contato com o guia ligado:
   `npm run folha -- <Id> src\videos\<slug>.tempos.json` → `TRABALHO\out\folha-<Id>.jpg` (1 quadro do fim de cada cena).
   Olhe a imagem: nada em vermelho (topo 160, base 320, laterais 96, botões à direita), nada sobreposto, textos cabendo.
7. Renderize a prévia: `npx remotion render <Id> "trabalho\out\previa-<slug>.mp4"` e mande para ele.

## 4. Gravação real → sincronizar e enquadrar

1. Ache a gravação nova (pergunte onde ele salvou). **Copie** o original para `TRABALHO\originais\` (nunca mova nem altere) e converta:
   `npm run converter -- "trabalho\originais\<arquivo>" <slug>` → `TRABALHO\public\gravacao-<slug>.mp4` (1080×1920, 30 fps, H.264).
   O conversor confere o arquivo com o `ffprobe` e, se for **4K HDR (iPhone recente)**, trata o HDR com `zscale` + `tonemap` (sem isso a cor sai lavada).
   Na primeira gravação HDR de cada sessão, extraia um quadro do convertido e mostre a ele para comparar com o celular.
2. `npm run legendar -- "trabalho\public\gravacao-<slug>.mp4"` (em segundo plano, ~1–2 min) → `legendas/gravacao-<slug>.json`.
   Se a gravação tiver pausas longas, erros ou tomadas repetidas, limpe antes de seguir (a skill `fabrica-videos-corte`): daí em diante o vídeo é `gravacao-<slug>-limpa.mp4` e a transcrição é a do vídeo limpo.
3. `npm run batidas -- legendas\gravacao-<slug>.json roteiros\<slug>.ancoras.json src\videos\<slug>.tempos.json "<vídeo>"`.
   Se faltar âncora, leia a transcrição e ajuste a frase. **Se ele mudou o sentido de uma fala, adapte a animação** (ex.: "não só por uma pessoa" → `TextoRiscado modo="somar"` em vez de riscar) e conte isso a ele.
4. `duracaoFala` ≤ duração do vídeo (senão sobra um instante sem imagem embaixo): com o vídeo no fim do comando acima, o `batidas` já limita sozinho; sem ele, corrija à mão.
5. Enquadramento (o rosto precisa ficar entre a faixa da legenda, y 985–1125, e a zona de baixo, y 1600): teste o recorte em ~12 momentos com
   `ffmpeg -ss <t> -i <video> -frames:v 1 -vf "crop=1080:960:0:<offset>" "trabalho\out\enq-<t>.png"` e olhe cada imagem.
   `enquadramento` = `"50% <offset/960*100>%"` (para fonte 1080×1920).
   **Cabeça inteira no quadro o vídeo todo.** O queixo pode encostar na zona de baixo; a boca nunca.
   Teste inclusive quando ele chega perto da câmera e use o maior offset em que o topo da cabeça nunca sai.
6. Confira a tarja de nome: se cobrir o rosto, ela fica na metade de cima (já é o padrão do `TelaDividida`).
7. Render final em segundo plano: `npx remotion render <Id> "trabalho\out\<slug>-final.mp4"`; confira duração/resolução com `ffprobe` e mande o vídeo.

## 5. Entrega

- Feche pela skill `fabrica-videos-entrega` (conferência técnica, capa, folha de quadros e `NOTAS.md`). Os pontos abaixo são o que é próprio deste fluxo.
- Se ele for legendar depois, num aplicativo de edição, explique onde pôr a legenda: **logo abaixo da barra da divisão (na cor do pilar)** (faixa verde do guia), no máximo 2 linhas. Se ele preferir a legenda já queimada no vídeo, veja a skill `fabrica-videos-legendas` (peça `LegendaQueimada`, posição `faixa`).
- Avise nomes que a transcrição costuma errar.
- Descrição do post: Se ele pedir, escreva uma **sugestão** em `NOTAS.md` (gancho, 2–3 frases com os números exatos, uma pergunta + o mesmo CTA falado, fonte, até 3 emojis, 4–6 hashtags, sem exageros que o estudo não sustenta).
- Registro em `entregas\AAAA-MM-DD-<slug>\`: `NOTAS.md` (Id da composição, comandos usados, caminho da gravação e do final, duração, enquadramento, o que ele mudou na fala), `capa.jpg` e a folha de contato. O vídeo final fica em `TRABALHO\out\`.
- Depois de aprovado, tire a gravação de `TRABALHO\public\` e guarde em `trabalho\arquivo\AAAA-MM-DD-<slug>\` (o Remotion copia a `public` inteira a cada render; pasta cheia deixa tudo lento). Anote o caminho novo em `NOTAS.md`.
- **Nunca publica, agenda nem envia.** Quem publica é o cliente.

## Armadilhas já resolvidas (não repita)

- Halo: use `<Halo>` (div com `filter: blur`), não `box-shadow` em elemento transparente (vira uma "pílula" escura).
- Destaque de várias palavras: `*10 tarefas*` precisa ser tratado como trecho, não palavra por palavra (ver `TextoImpacto`/`Destaque`).
- Rótulos centrados em pontos (ex.: `v1`) precisam de folga extra para não invadir a margem de 96 px.
- PowerShell: JSON direto em `--props='{...}'` perde as aspas. Grave num arquivo e use `--props=arquivo.json`.
- Gravação ou vídeo dentro do projeto vai parar no repositório: sempre em `TRABALHO`.
- A porta do Studio é a **3210**.

## Séries (vários reels sobre o mesmo assunto)

- Um slug por episódio (`<serie>-<n>-<tema>`) e, se o cliente pedir, uma sessão por episódio. Sessões em paralelo dividem a mesma pasta:
  cada uma mexe só nos arquivos do seu slug; em `src/videos/index.tsx` releia antes de editar e acrescente só a sua `<Composition>`; não altere peças compartilhadas.
- Fatos e decisões que valem para todos (um número que mudou, o CTA, o pilar) precisam ser repassados a todas as sessões na hora. Sem isso, cada vídeo fica com uma regra diferente.
- Tela final de série: `src/pecas/TelaFinalReels.tsx` no lugar do `Encerramento`, 4 s depois da fala (duração = `duracaoFala` + `telaFinalSeg`).
  Dois espaços 9:16 vazios (400×711) que ele cobre com reels no aplicativo de edição: um para o próximo capítulo (o último volta ao primeiro), outro para o reels que originou a série.

## Sons (opcional, só se ele pedir ou já tiver aprovado)

- Quatro sons curtos em uma pasta de sons dentro de `public` (traga os seus, com licença clara: o repositório não inclui sons): `abertura.mp3` (riser no gancho, volume ~0,35), `tecla.mp3` (a cada item que entra, ~0,3),
  `whoosh.mp3` (na virada/zoom, ~0,2), `blip.mp3` (quando chega o número ou a resposta final, ~0,3).
- Cada som é uma `<Sequence>` curta com `<Audio>` de `@remotion/media`, presa aos mesmos tempos das cenas; caminho e volume ficam em props do schema (string vazia desliga).
- Depois do render, meça o pico com `ffmpeg -i <video> -af volumedetect -vn -f null -` (deve ficar abaixo de 0 dB e os sons abaixo da voz). **Você não consegue ouvir: diga a ele que a conferência de ouvido é dele.**

## Lições de gravação

- Quem grava sem roteiro costuma falar frase a frase, com pausas longas, aquecer antes de começar, repetir a frase de que não gostou e sair do quadro no fim. A skill `fabrica-videos-corte` resolve tudo isso.
- É comum a pessoa mudar a fala ao gravar. Leia a transcrição inteira antes de confiar nas âncoras e adapte tela e legenda do post ao que foi dito de fato.
- Quando a fala sai mais curta que o roteiro, os detalhes e os números que saíram dela ficam escritos na tela.
- Ao trocar um fato (ex.: um número que foi atualizado), troque em todos os lugares: fala, tela, título, legenda do post e capa.
