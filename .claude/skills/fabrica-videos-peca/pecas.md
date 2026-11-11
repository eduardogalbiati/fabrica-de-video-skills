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

## Regras
- Dado na tela é dado real: nota medida, número citado com fonte, print verdadeiro. Peça nenhuma serve para inventar resultado.
- Uma cor de acento por vídeo. Nada de emoji animado, bounce, sombra em texto ou partícula.
- Abaixo de y=1080 (formatos de tela cheia), nada à direita de x=930: é a coluna de botões do Instagram.

Para criar uma peça nova, veja a skill `fabrica-videos-peca`.
