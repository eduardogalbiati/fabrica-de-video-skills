---
name: fabrica-videos-corte
description: Corte automático de uma gravação falada. Tira silêncios, erros, gaguejos e tomadas repetidas e deixa a melhor versão de cada frase, com relatório do que saiu. Use quando ele pedir para limpar, cortar pausas ou tirar erros de um vídeo.
---

# /fabrica-videos-corte — corte automático

Skill da **Fábrica de Vídeos Agêntica**. Limpa uma gravação falada: tira os silêncios, os erros, os gaguejos e as tomadas repetidas, e deixa só a melhor versão de cada frase. O original nunca é alterado.

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto. `TRABALHO` = a pasta `trabalho`.

## Quando usar
- O cliente manda uma gravação e diz "limpa", "corta as pausas", "tira os erros".
- Dentro da skill `fabrica-videos-rapido` e da skill `fabrica-videos-reels`, antes de sincronizar as animações.

## Como funciona
As **pausas** saem sozinhas: o script acha os silêncios pelo áudio. O que é **erro ou tomada repetida** é decisão de quem lê o texto: você. O cliente confere pelo relatório e ouvindo o resultado.

## Passo a passo
1. **Gravação no formato do estúdio.** Se veio do celular: copie o original para `TRABALHO\originais\` e rode `npm run converter -- "<original>" <slug>` (gera `TRABALHO\public\gravacao-<slug>.mp4`). Vale também para gravação que não é 4K HDR: o conversor gira o vídeo em pé, corta para 9:16 e passa para 30 fps. **A resolução da gravação é mantida** (4K continua 4K, do começo ao vídeo final): a qualidade que entra é a que sai. Extraia um quadro do convertido e do original (`ffmpeg -ss 20 -i <arquivo> -frames:v 1 ...`) e compare: rotação e cor têm de bater.
2. **Transcrever:** `npm run legendar -- "trabalho\public\gravacao-<slug>.mp4"` (em segundo plano; ~1 min para 2 min de gravação).
3. **Analisar:** `npm run cortar -- analisar "trabalho\public\gravacao-<slug>.mp4"`
   → `cortes\gravacao-<slug>.cortes.json` e `cortes\gravacao-<slug>.falas.md` (a gravação como tabela de falas com tempo, pausas e o aviso "parece repetir na fala N").
4. **Decidir o que sai.** Leia a tabela de falas inteira e preencha a lista `remover` do `.cortes.json`:
   - tomada repetida: fica a **última tomada completa** (ele recomeça quando erra); as anteriores saem: `{ "falas": [2, 3], "motivo": "errou e recomeçou" }`;
   - a mesma frase dita inteira duas vezes, com uma pausa longa no meio (na gravação real foi o CTA final): ele repetiu porque não gostou da primeira. Fica a última, e na mensagem a ele diga qual saiu, para ele poder trocar;
   - aquecimento antes de começar ("vamos lá", "tá", conversa) e tudo depois do CTA: sai;
   - gaguejo ou palavra solta no meio de uma fala: `npm run cortar -- palavras cortes\gravacao-<slug>.cortes.json <nº>` mostra os tempos palavra por palavra; use `{ "de": 12.30, "ate": 13.10, "motivo": "gaguejou" }`;
   - comentário fora do roteiro ("não, espera", "de novo", "corta"): sai;
   - pausa que é de propósito (suspense antes de um número): ponha em `manter`, ex.: `{ "de": 20.1, "ate": 21.4 }`;
   - se existe roteiro (`roteiros\<slug>.md`), compare: a tomada que fica é a que diz o texto do roteiro, ou a mais completa se ele mudou a fala.
   Na dúvida entre duas tomadas boas que dizem coisas diferentes, **não corte**: pergunte a ele.
5. **Aplicar:** `npm run cortar -- aplicar cortes\gravacao-<slug>.cortes.json`
   → `TRABALHO\public\gravacao-<slug>-limpa.mp4` e `cortes\gravacao-<slug>.relatorio.md` (o que saiu, quanto tempo, por quê e o texto que estava ali).
   - Se o relatório trouxer **"Atenção: N trecho(s) ficaram no vídeo sem nenhuma palavra"**, é som que não chega a ser silêncio e que a transcrição não pegou (ruído, alguém falando longe, risada). Quase sempre deve sair: ponha um `{ "de": ..., "ate": ..., "motivo": "som sem fala" }` cobrindo a pausa inteira onde eles estão e aplique de novo.
6. **Conferir sem ouvir:** transcreva o vídeo limpo (`npm run legendar -- "<...-limpa.mp4>"`) e leia `npm run falas -- legendas\gravacao-<slug>-limpa.json`. Três coisas:
   - o texto tem de ser o que ele quis dizer, sem palavra cortada no meio e sem sobra de erro (na primeira passada real sobrou um "Tá." do aquecimento: foi assim que o defeito apareceu);
   - a coluna "pausa depois" não pode ter nada acima de ~0,8 s: pausa grande no vídeo limpo é pedaço que sobrou entre dois cortes;
   - a tabela não pode ter fala repetida com o mesmo tempo: em vídeo de mais de 30 s o Whisper às vezes devolve um bloco de palavras duas vezes (o aviso "parece repetir" aparece em falas vizinhas, com os mesmos segundos). Não é defeito do corte: apague as cópias do `.json` da transcrição antes de usar no `batidas`;
   - o começo e o fim: tire uma folha de quadros do limpo (`ffmpeg -i <limpa> -vf "fps=1/2.5,scale=180:-1,tile=7x2" -frames:v 1 <folha.jpg>`) e veja se ele está no quadro e falando do primeiro ao último quadro.
   Se sobrou algo, ajuste `remover` e aplique de novo; se o defeito for do script, corrija o `cortar.mjs` e anote aqui.
7. **Mostrar a ele:** mande o vídeo limpo com o resumo do relatório: duração antes e depois, quantos cortes, as falas que você tirou por decisão sua (não as pausas) e o segundo de cada emenda no vídeo limpo (some a duração dos trechos que ficam, em `resultado.fica` do `.cortes.json`). **A conferência de ouvido é dele.**

## Ajustes (no `config` do `.cortes.json`, depois aplique de novo)
| Campo | Padrão | O que faz |
|---|---|---|
| `pausaMin` | 0,5 s | Silêncio a partir desse tamanho é cortado. Mais alto = mais natural, menos corte. |
| `folga` | 0,12 s | Respiro que sobra antes e depois de cada corte. Se as falas ficarem coladas demais, suba para 0,18. |
| `folgaFinal` | 0,35 s | Silêncio que sobra no fim do vídeo. |
| `ruidoDb` | automático | Limite do que conta como silêncio. Sala barulhenta: rode `analisar` de novo com um valor mais alto no fim do comando (ex.: `-32`). |

## Como o script encaixa os cortes (revisto com a primeira gravação real)
- **Pausas:** pelo silêncio medido no áudio. Pedaços de uma mesma pausa separados por um estalo de até 0,1 s viram uma pausa só.
- **Começo e fim:** sai tudo antes da primeira palavra e depois da última (ele se ajeitando, saindo do quadro), deixando 0,12 s no começo e `folgaFinal` no fim.
- **Fala marcada em `remover`:** o corte vai da primeira pausa depois da última palavra que fica até a última pausa antes da próxima palavra que fica. Quem manda é o silêncio do áudio, não o tempo do Whisper.

- **Som sem fala:** um trecho com som e nenhuma palavra transcrita fica no vídeo (o script não sabe se é ruído ou uma risada que deve ficar), e o relatório avisa quais são.

## Quando há mais de uma voz
Gravação com alguém dirigindo por trás da câmera (perguntas, "mais uma vez", "boa"): a transcrição não diz quem falou. Tire um quadro no segundo de cada fala em dúvida: quem está na câmera de boca fechada, olhando para o lado, não é quem falou. Saem as falas de quem dirige e as respostas dadas a ele; fica só o que foi dito para a câmera.

## Limites conhecidos
- Tempos do Whisper: na gravação real, o começo de uma fala depois de pausa longa veio até **0,4 s atrasado** e o fim de palavra até 0,25 s para mais ou para menos. Corte de fala inteira encosta no silêncio e não sofre com isso. Já o corte no meio de uma frase (gaguejo, sem silêncio dos dois lados) só tem o tempo do Whisper: confira esses pontos com mais cuidado e peça a ele para ouvir. Esse caso ainda não apareceu numa gravação real.
- Pausa menor que `pausaMin` fica (é o respiro natural entre frases).
- Corte seco na imagem: na tela dividida isso é normal. Se o salto incomodar, avise a ele em vez de inventar transição.
- Mais de 150 trechos numa passada o script recusa: aumente `pausaMin`.
