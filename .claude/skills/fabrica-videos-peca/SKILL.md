---
name: fabrica-videos-peca
description: Escolhe uma peça de animação da biblioteca (gráfico, barras, antes e depois, enquete, checklist, notificação, carimbo, chat de IA, terminal, tela de site) ou cria uma peça nova no padrão da marca. Use quando ele perguntar que animação dá para pôr, pedir para ver as peças ou pedir uma animação que ainda não existe.
---

# /fabrica-videos-peca — usar ou criar uma peça de animação

Skill da **Fábrica de Vídeos Agêntica**. Serve para duas coisas: escolher a peça certa da biblioteca para uma ideia, e criar uma peça nova quando nenhuma serve.

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto. Antes de escrever código, leia `CLAUDE.md` e, se as skills oficiais do Remotion estiverem instaladas, a `remotion-best-practices`.

## Quando usar
- "Que animação dá para pôr aqui?", "me mostra as peças", "quero um [gráfico, carimbo, chat…] nessa parte".
- "Cria uma peça de [algo que não existe]".

## 1. Usar uma peça que já existe
1. Abra `pecas.md` (na pasta da skill `fabrica-videos-peca`) (a tabela "Qual peça para o que ele disse") e olhe `docs\mostruario.jpg`. Se a animação vai sobre a gravação do rosto em tela cheia (zoom, painéis em volta, transição), procure na seção "Efeitos sobre a gravação" e em `docs\efeitos.jpg`. Um efeito novo vai em `src\efeitos\`, com exemplo no `src\MostruarioEfeitos.tsx`, e se confere com `npm run mostruario -- efeitos`.
2. Mostre a ele a imagem quando ele quiser escolher de olho.
3. Copie o exemplo da peça em `src\Mostruario.tsx` para a cena do vídeo e troque os dados pelos reais.

## 2. Criar uma peça nova
Só crie se nenhuma peça existente resolve com outras props.

1. **Combine com ele** o que a peça mostra e em que fala ela entra. Uma frase basta.
2. **Arquivo** `src\pecas\<Nome>.tsx`, no padrão das outras:
   - comentário no topo dizendo para que serve e o que cada prop faz;
   - props com dados (nunca texto fixo dentro da peça), mais `acento`, `top` e `inicio`;
   - posição absoluta dentro da área de 1080×960; margem lateral de 96 px (`ds.space[4]`);
   - só tokens de `src\animacoes\tema.ts` (`ds`, `tipo`, `pilares`); números em mono (`tipo.statXl`);
   - toda animação sai de `useCurrentFrame()` com `interpolate` (helpers `aparece`, `ease`, `clamp` em `util.tsx`); nada de animação CSS;
   - movimento sóbrio: fade com subida curta (o `aparece`); sem bounce, sem sombra em texto, sem gradiente;
   - para obedecer ao estilo escolhido (`estilos\README.md`): cartão com `...cartao(acento)` e `...flutua(frame, "<semente>")` no fim do estilo dele, título com `...brilhoTitulo(acento)` (de `src\animacoes\estilo.ts`). No estilo padrão esses ajustes não mudam nada.
3. **Exemplo no mostruário:** acrescente uma linha em `src\mostruario.tempos.json` (3 s depois da última, e some 3 em `duracaoFala`) e a entrada correspondente em `exemplos`, no `src\Mostruario.tsx`.
4. **Conferir:** `npx tsc` e `npm run mostruario`. Olhe `docs\mostruario.jpg`: a peça nova aparece inteira, dentro das margens e com o texto cabendo? Confira também noutro estilo: `npm run estilo -- ver orbita`.
5. **Catálogo:** uma linha na tabela de `pecas.md` (na pasta da skill `fabrica-videos-peca`).
6. Mostre a imagem a ele. Só depois use a peça no vídeo.

## Regras
- Não altere uma peça que já está em uso num vídeo de outra sessão: crie uma prop nova com valor padrão igual ao comportamento antigo.
- Dado na tela é dado real. Se a peça precisa de um número, ele vem da fala, de uma medição ou de uma fonte citada.
