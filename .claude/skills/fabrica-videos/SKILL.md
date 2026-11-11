---
name: fabrica-videos
description: Porta de entrada da Fábrica de Vídeos Agêntica. Use quando a pessoa pedir qualquer coisa de vídeo (editar, cortar, legendar, animar, fazer um Reels, Shorts ou TikTok, capa, mudar o visual) sem dizer qual skill quer, ou quando perguntar o que a Fábrica faz.
---

# /fabrica-videos — por onde começar

Você é o **editor de vídeo**. Esta skill só escolhe a skill certa; o passo a passo está em cada uma. Antes da primeira tarefa da sessão, leia `CLAUDE.md` na raiz do projeto.

## O que a pessoa quer → qual skill

| Ela diz | Skill |
|---|---|
| "gravei isso, monta", "edita esse vídeo", manda uma gravação pedindo um reel | `fabrica-videos-rapido` |
| "quero um reel sobre X", pede roteiro, ainda não gravou | `fabrica-videos-reels` |
| "limpa", "corta as pausas", "tira os erros" | `fabrica-videos-corte` |
| "põe legenda", "legenda esse vídeo" | `fabrica-videos-legendas` |
| "que animação dá para pôr?", "quero um gráfico aqui", "cria uma peça" | `fabrica-videos-peca` |
| "mostra o site X", cita um site ou produto | `fabrica-videos-print-site` |
| "quero outro formato", "rosto em tela cheia", "tutorial sem fala" | `fabrica-videos-formatos` |
| "faz a capa" | `fabrica-videos-capa` |
| "tá pronto?", "fecha", "confere" | `fabrica-videos-entrega` |
| "muda as cores", "cria a minha marca", primeira vez usando | `fabrica-videos-marca` |
| "mais futurista", "com movimento", "mais calmo", "outro estilo" (o jeito de mover, não as cores) | `fabrica-videos-marca`, seção "Marca e estilo são separados" (estilos em `estilos/`) |

Se o pedido cabe em duas, pergunte em uma frase. Se não cabe em nenhuma (juntar dois vídeos, trocar trilha), faça direto com o FFmpeg e deixe o comando anotado nas notas de entrega.

## Primeira vez neste computador

1. **Antes de baixar qualquer coisa, conte à pessoa o que será baixado e espere o ok.** Rode `npm run montar -- explicar`: ele só mostra a lista, com o que já está no computador e o espaço livre. Em resumo:

   | O quê | Em disco | Quando baixa |
   |---|---|---|
   | Dependências do projeto | ~0,9 GB | Na instalação |
   | Navegador interno do Remotion | ~0,3 GB (131 MB de download) | No primeiro render |
   | Modelo de transcrição (Whisper) | ~4 GB | Só na primeira transcrição de uma fala |

   Tudo fica dentro de `node_modules`, na pasta do projeto: nada é instalado no sistema, e apagar essa pasta desfaz a instalação.
2. Com o ok: `npm run montar -- demo` instala, confere e termina renderizando o mostruário.
3. A marca ativa é a `neutra`. Ofereça `fabrica-videos-marca` antes do primeiro vídeo: leva poucos minutos e muda tudo de uma vez.
4. Mostre `docs/mostruario.jpg` para a pessoa ver o que existe.
5. **Antes da primeira transcrição** (corte, legenda ou sincronizar com a fala), avise de novo dos ~4 GB do modelo e espere o ok. O próprio comando avisa quando vai baixar.

## Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Não achei o navegador interno" | O Remotion ainda não baixou o navegador dele | Rode um render qualquer (`npm run mostruario`) |
| O vídeo ou o print não aparece no render | O arquivo não está em `trabalho/public/` | `npm run preparar`, ou salve o arquivo grande direto lá |
| Erro de tema (`pilar`) ao abrir um vídeo antigo | A marca ativa mudou e o tema daquele vídeo não existe mais | Ajuste o `pilar` do vídeo para um tema da marca atual |
| A cor da gravação do iPhone saiu lavada | Vídeo HDR convertido sem tratamento | Use `npm run converter`, que trata o HDR |
| A legenda trocou um nome | O Whisper erra nome próprio | Corrija no `.legenda.json`; não use nome próprio como âncora |
| Volume com AVISO na conferência | O render sai mais baixo que o padrão das redes | `npm run nivelar -- "<vídeo>"` |
| Uma animação não aparece | Hook chamado fora de um componente de cena | Cada cena é um componente próprio com `useCurrentFrame()` |
| A transcrição para logo no começo, com erro de WebGPU | O computador não oferece WebGPU (placa de vídeo ou driver) | Avise a pessoa: animações, capa e print de site seguem funcionando; corte automático, legenda e sincronização com a fala não. Não instale nada para contornar sem ela pedir |

## Regras que valem para todas

- Aprovação antes de cada salto: roteiro, storyboard, prévia. Não renderize o final sem a prévia aprovada.
- Nada inventado na tela. Nada publicado. Som é sempre conferido por uma pessoa.
- Arquivo grande fica em `trabalho/`, nunca dentro de `public/` do projeto.
