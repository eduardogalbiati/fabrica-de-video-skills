# Estilos

O **estilo** é o jeito de mover e de desenhar: como as coisas entram na tela, se os cartões ficam chapados ou flutuam em perspectiva, se há brilho, o que aparece no fundo. A **marca** é quem fala: cores, fontes, assinatura, nome. As duas são independentes: **qualquer marca combina com qualquer estilo**.

| Camada | Pasta | Muda… |
|---|---|---|
| Marca | `marca/` (a ativa) e `marcas/<nome>/` | cores, fontes, assinatura, tarja de nome, temas, encerramento |
| Estilo | `estilos/<nome>/` (o ativo é apontado em `estilos/ativo.ts`) | entrada, flutuação, perspectiva, brilho, fundo |

## Os estilos que existem

| Estilo | Pasta | Em uma frase |
|---|---|---|
| Mini-action | `estilos/mini-action/` | Movimentos curtos e sóbrios: entra com fade e uma subida curta e fica parado; cartões chapados; um halo atrás do título; fundo parado. É o padrão. |
| Órbita | `estilos/orbita/` | Interface flutuando no espaço: cartões que vêm de trás, inclinados em perspectiva, flutuando devagar, com a borda acesa na cor do tema; rede de pontos derivando no fundo. |
| Palco | `estilos/palco/` | Palco escuro: piso quadriculado em perspectiva sumindo no horizonte, luz de cima e partículas desfocadas; cartões foscos de frente, com sombra; destaque em itálico. |

Cada pasta tem o `estilo.json` (os números) e um `README.md` (as regras de uso, para qualquer IA aplicar do mesmo jeito).

## Como escolher

| Para | Comando |
|---|---|
| Ver os estilos e qual é o ativo | `npm run estilo -- listar` |
| Ver o mostruário num estilo, sem trocar o ativo | `npm run estilo -- ver <nome>` |
| Renderizar um vídeo com outra marca e/ou outro estilo, sem trocar os ativos | `npm run renderizar -- <Id> <saída.mp4> marca=<nome> estilo=<nome> [mudo]` |
| Folha de contato noutro estilo | `$env:FABRICA_ESTILO = "<nome>"; npm run folha -- <Id> <tempos.json>` (no macOS e no Linux: `FABRICA_ESTILO=<nome> npm run folha -- ...`) |
| Studio noutro estilo | a mesma variável antes do `npm run dev` |
| Trocar o estilo ativo de todo o estúdio | `npm run estilo -- usar <nome>` |

O vídeo não muda de código para mudar de estilo: o mesmo roteiro, as mesmas cenas e os mesmos tempos saem com outra cara.

## O que um estilo controla (`estilo.json`)

| Campo | O que faz | Mini-action |
|---|---|---|
| `movimento.curva` | Curva das entradas (cubic-bezier) | `[0.16, 1, 0.3, 1]` |
| `movimento.entrada.duracao` / `subida` | Quantos quadros e quantos px a entrada leva. As peças continuam pedindo os próprios valores; o estilo os escala em proporção a 14 quadros e 24 px | `14` / `24` |
| `movimento.entrada.escala` / `desfoque` | Entrar aproximando (escala menor que 1) e desfocado (px) | `1` / `0` |
| `flutuacao.amplitude` / `inclinacao` / `ciclo` / `perspectiva` | Vai e vem dos cartões (px), inclinação em perspectiva (graus), duração de um ciclo (s), distância da câmera (px) | `0` / `0` / `5` / `1400` |
| `fundo.tipo` | `estrelas` (paradas, se a marca permitir), `rede` (pontos e linhas derivando), `palco` (piso quadriculado em perspectiva, luz de cima, partículas) ou `liso` | `estrelas` |
| `fundo.pontos` / `deriva` | Na rede: quantos pontos (em 1920 px de altura) e quanto cada um anda (px) | — |
| `fundo.particulas` | No palco: quantas partículas desfocadas (em 1920 px de altura) | — |
| `cartao.brilho` / `transparencia` / `bordaNoAcento` | Brilho na cor do tema em volta dos cartões, fundo translúcido, borda na cor do tema | `0` / `0` / `false` |
| `cartao.bordaClara` / `sombra` / `realce` | Borda clara e fina, sombra grande embaixo, fio de luz na borda de cima | — |
| `halo` | Multiplica a intensidade do halo atrás dos títulos | `1` |
| `brilhoTitulo` | Brilho nos títulos e nas palavras em destaque | `0` |
| `destaque` | A `*palavra*` em destaque: `cor` (só na cor do tema) ou `italico` (na cor do tema e em itálico) | `cor` |

As cores vêm sempre da marca: o estilo diz *quanto* brilha e *se* a borda acende, a marca diz *em que cor*.

## Como as peças obedecem
O motor lê o estilo em `src/animacoes/estilo.ts`. As peças chamam três ajustes **depois** do próprio visual delas: `cartao(acento)` (superfície), `flutua(frame, semente)` (perspectiva e vai e vem) e `brilhoTitulo(acento)` (títulos). A entrada (`aparece`), a curva (`ease`), o halo, o destaque (`Destaque`) e o fundo (`FundoNoite`, com `RedeDeFundo` e `PalcoDeFundo`) também seguem o estilo. Num estilo que não mexe em nada, como o mini-action, cada ajuste devolve `{}` e a peça sai igual, quadro a quadro.

Peça nova: use os mesmos ajustes nos cartões e nos títulos, e ela já nasce obedecendo a todos os estilos.

## Criar um estilo novo
1. Copie `estilos/mini-action/` para `estilos/<nome>/` e mude os números do `estilo.json`. Escreva no `README.md` dele quando usar e as regras.
2. `npm run estilo -- ver <nome>` e olhe a imagem: todas as peças mudam juntas.
3. Teste num vídeo de verdade: `npm run renderizar -- <Id> <saída> estilo=<nome> mudo` e a folha de contato. Perspectiva e brilho aumentam os cartões alguns pixels: confira as zonas do Instagram.
4. Mudou o motor para o estilo novo funcionar? Prove que os outros não mudaram: `npm run retrato -- tirar antes` (antes de mexer), `npm run retrato -- tirar depois` e `npm run retrato -- comparar antes depois`.
