---
name: fabrica-videos-marca
description: Cria a marca de uma pessoa para os vídeos (cores, fontes, assinatura, tarja de nome, temas e encerramento) por entrevista, a partir do site dela ou de um vídeo de referência, e mostra o mostruário para aprovar. Use quando alguém pedir os vídeos com as próprias cores ou a própria identidade, ou ao instalar a Fábrica para outra pessoa.
---

# /fabrica-videos-marca — criar a marca de uma pessoa

Skill da **Fábrica de Vídeos Agêntica**. Monta a **marca** de quem vai usar a Fábrica: cores, fontes, assinatura, nome e cargo da tarja, temas e encerramento. É o que faz os mesmos vídeos saírem com a cara de cada pessoa. O motor (peças, formatos, scripts) não muda.

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto. Antes, leia `marca\README.md` (o formato da marca).

## Quando usar
- "Cria a minha marca", "quero os vídeos com as minhas cores", "monta o visual de fulano".
- Na primeira vez que alguém instala a Fábrica.

## Três portas de entrada
Podem ser combinadas. Todas terminam no mesmo arquivo de respostas e no mesmo mostruário para aprovar.

### 1. Entrevista
Pergunte só o que falta, numa conversa curta:
1. **Assinatura:** o que aparece no canto dos vídeos (`@nome` ou o site).
2. **Nome e cargo** da tarja dos primeiros segundos.
3. **Fundo:** escuro ou claro (ou uma cor exata).
4. **Cor principal** (acento). Se a pessoa não tiver, proponha 3 e deixe escolher.
5. **Linhas editoriais** (temas): uma cor por assunto, se ela tiver mais de um. Uma só já serve.
6. **Fontes:** títulos, texto e números. Sem preferência: Inter, Inter e JetBrains Mono.
7. **Encerramento:** a frase e o CTA da tela final ("Me segue", "Comenta X").

### 2. A partir do site da pessoa
`npm run marca -- do-site <endereço>` lê o fundo, a cor do texto, as cores de botões e títulos, as fontes e as variáveis de cor do site. Use como ponto de partida das respostas. **Só o site da própria pessoa.**

### 3. A partir de um vídeo de referência
`npm run marca -- do-video "<arquivo>"` devolve o fundo provável, as cores vivas (candidatas a acento), os tons claros e uma folha de 12 quadros em `trabalho\out\estilo-<nome>.jpg`.
- Olhe a folha para o que os números não dizem: onde fica a legenda, o rosto, os cartões, se a letra é com ou sem serifa, se o ritmo é calmo ou rápido.
- **Precisa do arquivo.** Link de Instagram ou YouTube não serve: baixar automaticamente esbarra nos termos das plataformas e no bloqueio anti-robô. A pessoa manda o vídeo que tem direito de usar; não contorne.
- **Copia o estilo geral, não a identidade.** Cores, ritmo e posição de legenda podem inspirar. Logo, vinheta, personagem, fonte paga e bordão de outra pessoa não se copiam. Se o pedido for "igualzinho ao de fulano", explique isso e proponha a versão dela.

## Montar e aprovar
1. Escreva as respostas num `.json` (formato no topo de `scripts\marca.mjs`; exemplo em `marcas\aurora\respostas.json`). Só `assinatura` e `acento` são obrigatórios.
2. `npm run marca -- criar <nome> <respostas.json>` monta `marcas\<nome>\` (`marca.json` + `fontes.ts`), calcula os tons de fundo e de texto, confere se as fontes existem no Google Fonts e avisa quando uma cor tem pouco contraste. Corrija os avisos antes de seguir.
3. `npm run marca -- ver <nome>` gera `trabalho\out\mostruario-<nome>.jpg`: todas as peças com a marca nova, **sem trocar a marca ativa**.
4. Olhe a imagem e mostre à pessoa. Ajuste as respostas e repita até ela aprovar.
5. Só com a aprovação: `npm run marca -- usar <nome>` torna a marca ativa (a anterior fica guardada em `marcas\_anterior-<data>\`). Depois, `npx tsc`.

## Além das cores: a voz
A marca também tem regras de texto (o que a pessoa nunca diz, o CTA preferido, o tamanho das frases). Anote as da pessoa em `marcas\<nome>\voz.md` e siga nos roteiros. Esse arquivo ainda não é lido por script nenhum.

## Limites conhecidos
- As cores de fundo, cartão e texto secundário são calculadas a partir do fundo e do texto; para um ajuste fino, edite `marcas\<nome>\marca.json` à mão.
- Só fontes do Google Fonts. Fonte própria ou paga ainda não entra.
- A leitura do vídeo acha a cor mais viva de cada matiz, que costuma sair um pouco mais forte que a cor verdadeira da marca; a contagem de cortes não vê corte seco no mesmo enquadramento.
- Vídeos já feitos guardam o nome do tema (prop `pilar`): trocar a marca ativa por outra com temas de nomes diferentes exige ajustar esses vídeos.
