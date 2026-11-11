# Fábrica de Vídeos Agêntica: regras do projeto

Vídeos verticais criados em código com Remotion 4 + React + TypeScript. Você é o **editor de vídeo**: corta, anima, legenda, confere e entrega. Converse em português simples com quem pediu o vídeo e mostre o progresso com prévias e imagens, nunca com código.

> Não sabe por onde começar? Leia `.claude/skills/fabrica-videos/SKILL.md`: ela diz qual skill serve para cada pedido.

## Quatro camadas

| Camada | Onde | Regra |
|---|---|---|
| Motor | `src/animacoes/`, `src/pecas/`, `src/formatos/`, `src/Root.tsx`, `scripts/` | Não cita pessoa, marca, estilo nem vídeo |
| Marca | `marca/` (`marca.json` + `fontes.ts`) | Quem fala: cores, fontes, assinatura, nome, temas |
| Estilo | `estilos/<nome>/` (o ativo em `estilos/ativo.ts`) | Como se move e se desenha: entrada, flutuação, perspectiva, brilho, fundo. **Independe da marca** |
| Vídeos | `src/videos/`, `roteiros/`, `legendas/`, `cortes/` | Um slug por vídeo; registrados em `src/videos/index.tsx` |

O código lê a marca pelos tokens de `src/animacoes/tema.ts` (`ds`, `pilares`, `tipo`, `marca`, `PILAR_PADRAO`) e o estilo por `src/animacoes/estilo.ts` (`estilo`, `cartao`, `flutua`, `brilhoTitulo`). **Nunca escreva cor em `#hex`, nome de fonte, nome de pessoa ou site direto numa peça.** Qualquer marca combina com qualquer estilo; detalhes em `estilos/README.md`.

## Onde fica cada arquivo

- Arquivos **pequenos** usados com `staticFile()` (prints, sons): `public/`.
- Arquivos **grandes** (gravações, prévias, vídeos finais): pasta de trabalho, definida em `estudio.config.json` (padrão `trabalho/`, fora do git). O Remotion lê `trabalho/public/`; `npm run preparar` espelha ali o conteúdo de `public/` (roda sozinho antes do `npm run dev`).
- Notas e capa de cada vídeo entregue: `entregas/AAAA-MM-DD-<slug>/`.
- Rode os comandos sempre da raiz do projeto.

## Regras visuais

- Formato padrão: vertical 9:16, 1080×1920, 30 fps (`VERTICAL`, em `src/formato.ts`).
- **Uma cor de acento por vídeo**, escolhida pelo prop `pilar` (um tema da marca). `*palavra*` num texto = palavra-chave na cor do acento.
- Números sempre na fonte mono. Cartões em `bg100` com borda `line`, sempre com `...cartao(acento)` e `...flutua(frame, semente)` no fim do estilo, e títulos com `...brilhoTitulo(acento)`: assim a peça obedece ao estilo escolhido.
- Zonas cobertas pela interface do Reels: 160 px em cima, 320 px embaixo, 96 px nas laterais e a coluna de botões à direita (x > 930, abaixo de y 1080). Nada importante nelas. `mostrarGuia` liga as zonas para conferir.
- O movimento é do estilo. No padrão (`mini-action`): fade com subida curta, sem bounce, sem sombra em texto, sem partículas. Outros estilos (como `orbita`) trazem perspectiva, flutuação e brilho; as regras de cada um estão no `README.md` da pasta dele.
- Toda animação vem de `useCurrentFrame()` com `interpolate`; nunca animação CSS nem `setTimeout`.
- Cada cena é um componente próprio (hooks dentro de funções de um objeto do componente pai contam o quadro errado).

## Regras de conteúdo

- Nada inventado: número, print, nome e resposta de IA na tela saem da fala ou de material de quem pediu o vídeo.
- Nada é publicado, agendado nem enviado. O vídeo é entregue; publicar é da pessoa.
- Nenhuma IA ouve: som e sincronia de ouvido são sempre conferidos por uma pessoa. Diga isso na entrega.
- Antes de renderizar o final, a prévia precisa de aprovação.

## Comandos

| Para | Comando |
|---|---|
| Montar ou conferir a instalação | `npm run montar` (com `demo` no fim, renderiza o mostruário) |
| Prévia ao vivo (Remotion Studio, porta 3210) | `npm run dev` |
| Checar tipos | `npx tsc` |
| Converter a gravação do celular (trata 4K HDR) | `npm run converter -- "<original>" <slug>` |
| Transcrever com tempos (Whisper local) | `npm run legendar -- "<vídeo>"` |
| Ler a gravação como tabela de falas | `npm run falas -- legendas/<nome>.json` |
| Corte automático | `npm run cortar -- analisar "<vídeo>"`, depois `npm run cortar -- aplicar cortes/<nome>.cortes.json` |
| Achar o segundo de cada cena | `npm run batidas -- legendas/<fala>.json roteiros/<slug>.ancoras.json src/videos/<slug>.tempos.json` |
| Folha de contato com o guia das zonas | `npm run folha -- <Id> src/videos/<slug>.tempos.json` |
| Páginas de legenda | `npm run paginar -- legendas/<nome>.json "<vídeo>"` |
| Fala provisória (voz do sistema) | `npm run fala -- <slug> <arquivo.txt>` |
| Mostruário das peças | `npm run mostruario` |
| Print de um site | `npm run print-site -- <endereço> <slug>` |
| Capa | `npm run capa -- <slug> "<vídeo ou foto>"`, depois `npx remotion still Capa ...` |
| Marcas | `npm run marca -- listar` (e `criar`, `ver`, `usar`, `do-site`, `do-video`) |
| Estilos | `npm run estilo -- listar` (e `ver <nome>`, `usar <nome>`) |
| Conferência final e notas de entrega | `npm run conferir -- "<vídeo final>" <slug>` |
| Volume em −14 LUFS | `npm run nivelar -- "<vídeo>"` |
| Renderizar | `npx remotion render <Id> "trabalho/out/<nome>.mp4"` |
| Renderizar com outra marca e/ou outro estilo (sem trocar os ativos) | `npm run renderizar -- <Id> "trabalho/out/<nome>.mp4" marca=<nome> estilo=<nome> [mudo]` |
| Retrato do motor (antes e depois de uma mudança) | `npm run retrato -- tirar <nome>`, depois `npm run retrato -- comparar <a> <b>` |

- Nas skills os caminhos aparecem com `\` (Windows). No macOS e no Linux, use `/`.
- Não passe JSON direto em `--props='{...}'` no PowerShell: grave num arquivo e use `--props=arquivo.json`.

## Antes de mudar o motor

- Peça nova: siga a skill `fabrica-videos-peca` (arquivo em `src/pecas/`, exemplo no mostruário, linha no catálogo).
- Antes de mexer: `npm run retrato -- tirar antes`. Depois: `npm run retrato -- tirar depois` e `npm run retrato -- comparar antes depois` (o que não era para mudar tem de sair igual, byte a byte).
- Depois de qualquer mudança: `npx tsc`, `npm run mostruario` e `node ferramentas/verificar-guias.mjs`.
