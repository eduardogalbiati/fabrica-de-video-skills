# Biblioteca de peças — catálogo

Todas as peças de animação do estúdio, em `src\pecas\`. Cada uma é um componente com props, feito para a metade de cima da tela (1080×960) e só com as cores e fontes do design system. A imagem `docs\mostruario.jpg` mostra todas, na ordem da tabela.

Para ver em movimento: composição `Mostruario` no Studio (3 s por peça). Para refazer a imagem: `npm run mostruario` (de dentro de ``).

## Qual peça para o que ele disse

| Ele disse… | Peça | O que aparece |
|---|---|---|
| um número que sobe ("de 8 para 48") | `ContadorBarra` | Número grande contando, com barra enchendo |
| "antes era X, depois ficou Y" (nota, tempo, custo) | `AntesDepois` | Dois anéis: cinza à esquerda, cor do pilar à direita |
| uma comparação de tamanhos ("1 min para gravar, 3 h para editar") | `Barras` | Barras horizontais com o valor em mono; uma em destaque |
| uma evolução no tempo (views, tokens, custo por dia) | `GraficoLinha` | Linha que se desenha, com o valor final |
| "não X, e sim Y" / "não só X, mas Y" | `TextoRiscado` | Texto riscado e trocado (`riscar`) ou somado (`somar`) |
| uma lista de tarefas ou passos | `Checklist` | Itens que vão sendo marcados |
| um passo a passo com momentos de espera ("primeiro…, depois…, aí ela pergunta…") | `LinhaDePassos` | Passos descendo numa linha; os de pergunta ganham "?" na cor do pilar; com `visiveis`, rola |
| "perguntei para vocês", "a maioria acha" | `Enquete` | Opções com barras e percentuais |
| "chegou", "terminou", "me avisou" | `Notificacao` | Cartão de notificação descendo do topo |
| "aprovado", "testado", "100 de 100" | `Carimbo` | Carimbo inclinado que assenta |
| "pedi para a IA", "colei o prompt" | `ChatIA` | Pedido sendo digitado e a resposta em linhas |
| "rodei o comando", "o script fez" | `Terminal` | Janela de terminal com linhas digitadas |
| "pedi para a IA e ela fez", "a IA rodou e perguntou" (uma sessão inteira) | `JanelaAgente` | Sessão com o agente: pedido digitado, ferramentas rodando, saídas, pergunta com botões, menu do "/"; rola sozinha. Só com texto real |
| "cortou as pausas", "de 2 minutos para 30 segundos" | `OndaDeCorte` | Forma de onda real da gravação: os cortes apagam e somem, o que fica se junta e a duração conta |
| o nome de um site, app ou produto | `TelaSite` | Print numa moldura de navegador, com rolagem, zoom e clique |
| vários prints em sequência | `TrocaPrints` | Prints trocando em corte seco, com chips por cima |
| "o cérebro da IA", "por dentro do modelo" | `RedeNeural` (+ `Bisturi`, `Lupa`) | Rede de pontos; bisturi operando; lupa procurando |
| "uma em mil", "0,016%" | `GradeConexoes` | Grade de 1.000 pontos com um aceso |
| "travou", "ficou em loop" | `LoopPensando` | Seta circular com "pensando…" |
| "sem ver", "às cegas" | `OlhoRiscado` | Olho com um risco |
| "cada versão melhora a próxima" | `LinhaVersoes` | v1 → v2 → v3 acelerando, com curva |
| o título de uma cena | `TituloCena` (em `util.tsx`) | Título com a palavra-chave na cor do pilar |
| legenda queimada | `LegendaQueimada` | Ver a skill `fabrica-videos-legendas` |

## Props em comum
- `acento`: a cor do pilar (`pilares[pilar].acento`).
- `top`: posição vertical dentro da área de 1080×960. O título da cena costuma ficar em 220–240 e a peça a partir de 300.
- `inicio`: quadro em que a peça começa a entrar, contado do início da cena.
- Tempos internos (`depoisEm`, `revelaEm`, `marcaEm`, `clique.em`…): quadros, contados do início da cena. Para prender a uma palavra da fala, use `rel(t.<ancora>, "<cena>")`, como no `Exemplo.tsx`.
As props de cada peça estão no comentário no topo do arquivo dela; um exemplo pronto de cada uma está em `src\Mostruario.tsx`.

## Estilo
As peças obedecem ao estilo escolhido (`estilos\`): no `mini-action` entram com fade e subida curta e ficam paradas; no `orbita` os cartões (`TelaSite`, `Terminal`, `ChatIA`, `Notificacao`, `TrocaPrints`, `Enquete`) flutuam inclinados, com a borda acesa, e o fundo vira uma rede de pontos; no `palco` os cartões ficam foscos e de frente, com sombra, sobre um piso quadriculado, e a `*palavra*` em destaque vira itálico. Para ver todas as peças noutro estilo: `npm run estilo -- ver orbita` (ou `palco`).

## Efeitos sobre a gravação
Outra família, em `src\efeitos\`: em vez de ocupar a metade de cima, os efeitos agem **sobre a gravação do rosto em tela cheia**. A câmera aproxima, a interface flutua em volta da pessoa, o vídeo vira uma janela do editor. Servem para os vídeos em que a pessoa aparece falando, como o `rapido`, o `reels` e o formato rosto com legenda. A imagem `docs\efeitos.jpg` mostra todos, na ordem da tabela. Para ver em movimento, use a composição `MostruarioEfeitos` (3 s por efeito). Para refazer a imagem: `npm run mostruario -- efeitos`.

A base é a `<Gravacao video="..." inicio={segundo} />`. Sem `video`, ela mostra uma pessoa de exemplo. Os efeitos que mexem na imagem recebem a `<Gravacao>` como filho. Os outros vão por cima dela.

| Ele disse… | Efeito | O que aparece |
|---|---|---|
| a notícia, a novidade ("saiu", "agora dá para…") | `MuralManchetes` | Recortes de papel batendo em volta do rosto, com a `*palavra*` marcada a marca-texto |
| troca de assunto, ou para esconder um corte seco | `CorteMergulho` | A câmera mergulha num plano e sai no seguinte (`de`, `para`, `em`) |
| um site, post ou app ("olha esse aqui") | `CelularFlutuante` | Um celular entra pelo lado e rola o print ao lado da pessoa |
| "presta atenção nisso" | `ZoomCamera` | Zoom em degraus com o visor da câmera: cantos do quadro, REC e régua do zoom |
| "pedi para a IA e ela fez" | `InterfaceEmVolta` | Painéis flutuando em volta: pedido digitado, progresso, prévia, linha do tempo |
| "X fica entre A e B", os dois lados de uma discussão | `InterfaceEmVolta` (painéis `texto` com `rotulo`, `tamanho` e `forte`) | Cartões de nome em volta da cabeça: um em cima, um de cada lado, cada um entrando na palavra |
| "fiz tudo isso", várias peças de uma vez | `OrbitaDeCartoes` | Cartões (palavras ou prints) girando em volta da cabeça, em 3D. Palavra comprida: `proporcao={0.5}` (etiqueta deitada) e `tamanhoTexto` |
| o nome de uma coisa que aparece na cena | `EtiquetaColada` | Adesivo na cor do tema grudado no objeto; segue uma `trilha` marcada à mão, se o objeto se mexer |
| "antes era assim, agora…" (cru → tratado) | `VarreduraAntesDepois` | Um fio de luz atravessa e troca o `antes` pelo `depois`, com os rótulos |
| "foi assim que eu fiz este vídeo" | `RecuoEditor` | A câmera recua e o vídeo vira uma janela do editor: checklist, efeitos, linha do tempo com a onda |
| "comenta X que eu te mando" | `ComentarioCTA` | A caixa de comentário digita a palavra, envia, ganha um coração e recebe a resposta com o link (só o visual) |

Os quadros das props são contados do início da cena, como nas peças. Por cima do rosto, guarde a faixa da legenda (y 985–1125) e as zonas do Instagram. Os exemplos do `src\MostruarioEfeitos.tsx` já respeitam isso.

**Recorte da pessoa:** `npm run recortar -- "<vídeo>" <nome>` tira a pessoa do fundo com um modelo que roda no próprio PC (MediaPipe) e entrega `recortes\<nome>-pessoa.webm`, um vídeo com transparência. A `<PessoaRecortada>`, com o mesmo `inicio` da `<Gravacao>`, vai por cima de tudo que deve passar **atrás** da pessoa:
- Na órbita: `camada="atras"`, depois a pessoa, depois `camada="frente"`. O `MostruarioEfeitos` faz isso sozinho quando recebe o prop `pessoa`.
- Uma palavra gigante atrás da cabeça e o fundo trocado também usam o recorte: fundo ou texto primeiro, a pessoa por cima.

### Efeitos que precisam do recorte
Recebem a `pessoa` (a `<PessoaRecortada>`) e, quando faz sentido, a `gravacao` (a `<Gravacao>` com o mesmo `inicio`). No mostruário, sem gravação, a pessoa de exemplo faz o papel do recorte.

| Ele disse… | Efeito | O que aparece |
|---|---|---|
| "imagina você num estúdio", troca de cenário | `FundoTrocado` | Um círculo cresce atrás da pessoa e troca o fundo (cenário da marca, print, vídeo) |
| a virada do vídeo ("e aí caiu a ficha") | `Vertigem` | A pessoa fica do mesmo tamanho e o fundo mergulha atrás dela. Use o `<TunelDeFundo>` ou outro fundo, nunca a própria gravação |
| abertura com cara de colagem | `RecortePapel` | A pessoa vira um adesivo recortado sobre papel rasgado, com uma palavra em letras recortadas; anda aos trancos, como stop-motion |
| "isso não cabe num post" | `SaindoDoQuadro` | O vídeo encolhe e vira um post, e a cabeça sai por cima da moldura |
| destaque da pessoa, momento leve | `ContornoRabiscado` | Uma linha à mão em volta da silhueta, que "ferve", e rabiscos soltos (brilho, círculo, espiral) |
| o título do vídeo | `TextoAtras` | Uma palavra gigante passa atrás da cabeça e outra fica na frente do corpo; as letras chegam espalhadas. `saiEm` faz as palavras sumirem antes do fim da cena. A palavra da frente sai na cor do tema: em cima de roupa clara ela some, e aí vale trocar por uma `EtiquetaColada` |
| "fiz 40 vídeos assim", o fecho | `ParedeDeVideos` | Uma grade de miniaturas sobe devagar atrás da pessoa |

Com recorte, a órbita também passa por trás da cabeça. O `MostruarioEfeitos` recebe `pessoa` (e `duracaoVideo`, se o mostruário for mais longo que a gravação).

## Regras
- Dado na tela é dado real: nota medida, número citado com fonte, print verdadeiro. Peça nenhuma serve para inventar resultado.
- Uma cor de acento por vídeo. Nada de emoji animado, bounce, sombra em texto ou partícula.
- Abaixo de y=1080 (formatos de tela cheia), nada à direita de x=930: é a coluna de botões do Instagram.

Para criar uma peça nova, veja a skill `fabrica-videos-peca`.
