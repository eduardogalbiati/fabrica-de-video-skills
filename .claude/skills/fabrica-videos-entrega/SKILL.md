---
name: fabrica-videos-entrega
description: Conferência final e fechamento de um vídeo. Mede tamanho, codec, duração e volume, tira capa e folha de quadros, escreve as notas para refazer. Use quando ele pedir para fechar, conferir ou entregar um vídeo. Nunca publica.
---

# /fabrica-videos-entrega — conferir e fechar um vídeo

Skill da **Fábrica de Vídeos Agêntica**. É o último passo de qualquer vídeo: conferência técnica, capa, folha de quadros, notas para refazer e aviso a quem precisa saber. **Nunca publica, agenda nem envia.**

Você é o **editor de vídeo**. Comandos no terminal, na raiz do projeto.

## Quando usar
- "Fecha esse vídeo", "confere e entrega", "tá pronto?".
- No fim da skill `fabrica-videos-reels`, da skill `fabrica-videos-rapido` e da skill `fabrica-videos-legendas`.

## Passo a passo
1. **Medir:** `npm run conferir -- "<vídeo final>" <slug> [segundo da capa]`
   Cria (ou reaproveita) `entregas\AAAA-MM-DD-<slug>\` com `capa.jpg`, `folha-final.jpg` e `NOTAS.md`, e mostra a tabela: tamanho, fps, codec, duração, volume e pico.
2. **Corrigir o que deu AVISO:**
   - volume fora de −16 a −12 LUFS → `npm run nivelar -- "<vídeo>"` (gera `<nome>-14lufs.mp4`; passe esse a ser o final e confira de novo: a segunda conferência atualiza a tabela e o caminho do vídeo no `NOTAS.md`). Com a voz do iPhone o render sai perto de −20 LUFS, então isso é quase sempre necessário;
   - tamanho, fps ou codec errados → o render saiu da composição errada ou de outra ferramenta; refaça;
   - mais de 90 s → avise a ele: passa do limite do Reels.
3. **Olhar** `folha-final.jpg` e `capa.jpg`: cena preta, texto cortado, legenda fora do lugar, capa com olho fechado ou boca aberta. Capa ruim: rode de novo com outro segundo.
4. **Conferir o conteúdo:**
   - todo número e nome na tela bate com a fala e com a fonte;
   - se um fato mudou no caminho, mudou em todos os lugares (fala, tela, título, legenda do post e capa);
   - nada importante nas zonas do Instagram (160 px em cima, 320 px embaixo, 96 px nas laterais, botões à direita);
   - dados pessoais na tela (abas, e-mails, caminhos de pasta, custos): borrar ou avisar;
   - termina com o CTA combinado; a sugestão de legenda do post repete o mesmo CTA.
5. **Completar o `NOTAS.md`:** Id da composição e comando de render, gravação usada, enquadramento, o que mudou em relação ao roteiro e a sugestão de legenda do post.
6. **Arrumar a pasta de trabalho:** com o vídeo aprovado, mova a gravação de `trabalho\public\` para `trabalho\arquivo\AAAA-MM-DD-<slug>\` e anote o caminho novo em `NOTAS.md` (o Remotion copia a `public` inteira a cada render). Mova só as cópias convertidas que você gerou (`gravacao-<slug>.mp4` e `-limpa.mp4`); o original em `originais\` ficam onde estão. Escreva no `NOTAS.md` que, para renderizar de novo, a `-limpa.mp4` volta para a `public`.
7. **Avisar:**
   - o cliente, com o vídeo, a tabela e o que **só ele** pode conferir: o som, a sincronia de ouvido e a cor (nenhuma IA ouve);

## O que esta skill não decide
- Publicar: é do cliente.
