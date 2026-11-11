---
name: fabrica-videos-print-site
description: Tira o print de um site ou produto e põe no vídeo numa moldura de navegador, com rolagem, zoom e destaque de clique. Use quando ele pedir para mostrar um site, app ou ferramenta no vídeo, ou quando a fala citar um site.
---

# /fabrica-videos-print-site — o site aparece quando ele é citado

Skill da **Fábrica de Vídeos Agêntica**. Tira o print de um site ou produto e põe no vídeo dentro de uma moldura de navegador, com rolagem, zoom e destaque de clique, no momento em que o cliente fala dele.

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto.

## Quando usar
- "Mostra o site X nessa parte", "põe o print do meu site", "quero a tela do produto aqui".
- No storyboard da skill `fabrica-videos-rapido` e da skill `fabrica-videos-reels`, sempre que a fala cita um site, app ou ferramenta.

## Passo a passo
1. **Capturar:** `npm run print-site -- <endereço> <slug> [nome] [celular|computador] [altura] [espera em ms]`
   - `celular` (padrão): layout de celular com 1080 px de largura. É o mais legível num vídeo vertical.
   - `computador`: layout de computador (1280 px), quando o que importa é a página como aparece no PC.
   - `altura`: quanto da página entra no print (padrão 1600 no celular). Para rolar bastante, use 3000 ou mais.
   - `espera`: tempo depois de carregar, para sites que animam ou montam o conteúdo depois (padrão 2500).
   O print vai para `public\<slug>\<nome>.png` (arquivo pequeno, fica no projeto) e para a pasta de trabalho.
2. **Olhar a imagem** antes de usar: aviso de cookies, pop-up, página de erro, dado pessoal. O print é sempre de visitante, sem login.
3. **Pôr no vídeo** com a peça `TelaSite` (`src\pecas\TelaSite.tsx`):
   ```tsx
   <TelaSite imagem="<slug>/<nome>.png" url="exemplo.com" acento={acento} top={260} altura={560}
     rolagem={{ de: 0, ate: 400, inicio: 20, duracao: 50 }}
     zoom={{ escala: 1.6, x: 0.5, y: 0.3, inicio: 70, duracao: 20 }}
     clique={{ x: 300, y: 250, em: 95 }} />
   ```
   - `rolagem`: sobe o print de `de` até `ate` (em px, com o print já na largura da moldura).
   - `zoom`: aproxima até `escala`, com o foco em `x` e `y` (de 0 a 1 dentro da área visível). Use para o número ou o botão ficar legível no celular.
   - `clique`: círculo discreto na cor do pilar, em px da área visível, a partir do quadro `em`.
4. **Conferir** na folha de contato (`npm run folha`): o número ou o botão que importa está legível? Nada cortado?

## Regras
- **Só site que o cliente indicou** ou que ele cita na fala. Site de terceiro (seguidor, cliente) só com a autorização que ele disser que tem.
- Todo número mostrado sai do print real. Se a nota mudou desde a gravação, avise: não edite a imagem.
- Destaque de clique é círculo ou zoom, nunca seta colorida.
- Dado pessoal na tela (e-mail, nome de terceiros, aba do navegador): recorte com `top`/`altura`/`rolagem` ou peça outro print.
- Print de tela logada (painel, conta dele): esta skill não faz. Peça o print ou a gravação de tela a ele.

## Limites conhecidos
- Não clica em nada: aviso de cookies e pop-up saem no print.
- É imagem parada: digitação, carregamento e resultado aparecendo pedem gravação de tela feita por ele (entra como vídeo no formato `TelaComRosto` ou `TutorialMudo`, ver a skill `fabrica-videos-formatos`).
- Alguns sites bloqueiam navegador automático e devolvem página de verificação. Nesse caso, peça o print a ele; não tente contornar.
