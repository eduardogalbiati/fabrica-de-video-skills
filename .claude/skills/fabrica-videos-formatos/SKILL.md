---
name: fabrica-videos-formatos
description: Escolhe a moldura do vídeo entre tela dividida, rosto com janela, tela com rosto no canto, tutorial mudo em loop e rosto com legenda. Use quando ele quiser outro formato de vídeo, testar versões do mesmo conteúdo ou fazer um tutorial sem fala.
---

# /fabrica-videos-formatos — escolher o formato do vídeo

Skill da **Fábrica de Vídeos Agêntica**. O formato é a "moldura" do vídeo: onde fica o rosto, onde ficam as animações e a tela. As peças (`pecas.md` (na pasta da skill `fabrica-videos-peca`)) são as mesmas em todos.

Você é o **editor de vídeo**. O código está em `src\formatos\` (e `src\pecas\TelaDividida.tsx`). `npm run mostruario -- formatos` gera uma imagem com os formatos e a capa, com o guia das zonas ligado.

## Quando usar
- "Quero testar outro formato", "faz esse com o rosto em tela cheia", "um tutorial sem fala".
- No começo da skill `fabrica-videos-reels` e da skill `fabrica-videos-rapido`, para decidir a moldura antes do storyboard.

## Os formatos

| Formato | Componente | Como é | Use quando |
|---|---|---|---|
| Tela dividida | `TelaDividida` (`src\pecas\`) | Animações em cima (1080×960), rosto embaixo o tempo todo | O padrão: explicação com animação a cada frase |
| Rosto com janela | `RostoComJanela` | Rosto em tela cheia; nos trechos marcados encolhe para uma janela embaixo e as animações entram em cima | Abrir e fechar olhando para a câmera, com animação só nos trechos que pedem |
| Tela com rosto | `TelaComRosto` | A tela (print ou gravação) ocupa a parte de cima inteira; rosto num quadro de cantos arredondados embaixo | Mostrar um site ou uma ferramenta funcionando, comentando |
| Tutorial mudo | `TutorialMudo` | Sem fala e sem rosto: texto grande em cima com o número do passo, tela embaixo, feito para loop | Passo a passo de 15 s que a pessoa salva |
| Rosto com legenda | `VideoLegendado` (`src\videos\`) | Rosto em tela cheia, só legenda queimada | Recado rápido, sem animação (ver a skill `fabrica-videos-legendas`) |
| Rosto com efeitos | `<Gravacao>` + efeitos (`src\efeitos\`) | Rosto em tela cheia o tempo todo; nos momentos-chave, um efeito sobre a gravação (zoom de câmera, painéis em volta, texto atrás da cabeça…), com trechos limpos entre eles | Falar olhando para a câmera, com energia, sem dividir a tela (catálogo: `pecas.md` (na pasta da skill `fabrica-videos-peca`), "Efeitos sobre a gravação") |
| Demo (sessão do agente) | `JanelaAgente` + bandeja (`src\pecas\`) | Tela cheia, sem rosto: a janela do agente executando o pedido em cima (pedidos digitados, ferramentas, perguntas com botões); embaixo da faixa da legenda, o que cada passo produz (`OndaDeCorte`, print, roteiro, render) | Mostrar como se faz, passo a passo, num vídeo só com voz |

Exemplos prontos para copiar: `src\formatos\Demos.tsx` (composições `DemoRostoComJanela`, `DemoTelaComRosto`, `DemoTutorialMudo` no Studio).

## Como usar cada um
- **`RostoComJanela`**: `janelas={[{ de: 2, ate: 6 }]}` diz, em segundos, quando o rosto vira janela. As animações vão como filhos, em `<Sequence>` nos mesmos tempos, e usam as mesmas medidas da tela dividida. `enquadramento` vale para o rosto cheio e `enquadramentoJanela` para a janela, que é larga e baixa (834×450): teste os dois em vários momentos, como na skill `fabrica-videos-reels`, seção 4.
- **`TelaComRosto`**: o conteúdo vai de y 180 a y 960; a faixa da legenda (985–1125) fica livre; o rosto fica embaixo (`canto`: `inferior-esquerdo`, `inferior-direito` ou `superior-direito`). Ao lado do rosto sobra espaço para um rótulo ou um número.
- **`TutorialMudo`**: `passos` com `de`, `ate` (segundos), `numero` (ex.: `"1."`) e `texto` (`*palavra*` = cor do pilar). O conteúdo vai de y 620 a y 1580 e, abaixo de y 1080, não passa de x 930 (use `largura={834}` na `TelaSite`). O último passo mostra a mesma tela do primeiro, para o loop não ter emenda. Sem fala não há legenda: a faixa pode ser usada.
- **Demo (sessão do agente)**: não é um componente pronto, é um jeito de montar a composição. Uma `JanelaAgente` de y 236 a y 960 (uma por caminho ou conversa, sem fade entre elas, para parecer a mesma janela trocando de conversa), uma linha em mono em y 180 dizendo em que parte do vídeo estamos, e a bandeja de y 1150 a y 1540 (até x 930) com o que cada passo produz. A faixa da legenda fica livre. Todo texto da janela precisa ser real: comando que existe, saída que saiu, pergunta que a skill faz, fala e resposta que aconteceram. Fica bem em qualquer estilo; no `palco`, a janela parece flutuar sobre o piso.
- Em todos: `mostrarGuia` liga as zonas do Instagram para conferir, e a barra de progresso já vem.

## Conferir
`npm run mostruario -- formatos` gera `trabalho\out\formatos.jpg` com um quadro de cada demonstração e o guia ligado. Num vídeo de verdade, use `npm run folha`.

## Limites
- Gravação de tela (para `TelaComRosto` e `TutorialMudo`) é ele quem faz; a `TelaSite` cobre só o print parado com rolagem e zoom.
- Fundo trocado atrás do rosto ainda não tem formato pronto. O recorte já existe: `npm run recortar` gera a pessoa com transparência, e a `<PessoaRecortada>` (em `src\efeitos\Gravacao.tsx`) a põe por cima de qualquer fundo.
