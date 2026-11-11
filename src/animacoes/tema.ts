// Tokens do estúdio. A MARCA (cores, temas, fontes, site, nome) vem da pasta marca\ na raiz do estúdio;
// o que é do MOTOR (tamanhos de texto, espaços, cantos, zonas do Instagram) fica aqui.
// Use SEMPRE estes tokens; nunca cores, fontes, nomes ou sites escritos direto numa peça.
import { random } from "remotion";
import { z } from "zod";
import { fonteBody, fonteDisplay, fonteMono } from "../../marca/fontes";
import dadosDaMarca from "../../marca/marca.json";
import dadosDoEstilo from "../../estilos/ativo";

export { fonteBody, fonteDisplay, fonteMono };

// Dados da marca que não são cor nem fonte: marca.site (assinatura), marca.pessoa (tarja de nome), marca.encerramento.
export const marca = dadosDaMarca;

// Tema escuro (padrão de todo vídeo)
export const ds = {
  bg000: marca.cores.bg000, // fundo de tudo
  bg100: marca.cores.bg100, // cartões, tarjas, lower-third
  bg200: marca.cores.bg200, // fundo de barra de progresso, moldura do PiP
  ink: marca.cores.ink, // texto principal
  inkMuted: marca.cores.inkMuted, // secundário, assinatura, capítulo
  line: marca.cores.line, // hairlines e bordas de cartão
  danger: marca.cores.danger, // só para marcar erro
  space: { 1: 16, 2: 32, 3: 64, 4: 96, 5: 160 },
  radius: { sm: 8, md: 20, lg: 40, pill: 999 },
  zonaInferior: 320, // área coberta pela interface do Instagram em 1080×1920
};

// Zonas do Reels (1080×1920) cobertas pela interface do Instagram — nada importante pode ficar nelas.
export const zonasReels = {
  topo: 160, // "Reels", câmera, abas
  base: 320, // legenda do post, nome do perfil, música
  lateral: 96, // margem lateral
  botoes: { x: 930, y0: 1080, y1: 1920 }, // coluna de curtir/comentar/compartilhar à direita
  legenda: { x0: 96, x1: 930, y0: 985, y1: 1125 }, // faixa recomendada para a legenda (logo abaixo da divisão)
};

// Um acento por vídeo, definido pelo tema da marca (no código, o prop `pilar`). Os temas vêm de marca.json.
export type Pilar = keyof typeof marca.temas;
export const pilarSchema = z.enum(Object.keys(marca.temas) as [Pilar, ...Pilar[]]);
// Tema usado nos exemplos e valores padrão do motor (nunca escreva "blog" ou outro nome de tema numa peça do motor)
export const PILAR_PADRAO: Pilar = pilarSchema.parse(marca.temaPadrao);

// textoNoBotao pode ser o nome de uma cor da marca ("bg000", "ink") ou um #hex
const corDaMarca = (valor: string) => (marca.cores as Record<string, string>)[valor] ?? valor;
export const pilares = Object.fromEntries(
  Object.entries(marca.temas).map(([chave, t]) => [chave, { acento: t.acento, soft: t.soft, nome: t.nome, textoNoBotao: corDaMarca(t.textoNoBotao) }]),
) as Record<Pilar, { acento: string; soft: string; nome: string; textoNoBotao: string }>;

// Estilos de texto (tamanhos para quadro de 1080px de largura)
export const tipo = {
  hookXl: { fontFamily: fonteDisplay, fontSize: 88, lineHeight: 0.95, fontWeight: 800, letterSpacing: "-0.02em" },
  hookLg: { fontFamily: fonteDisplay, fontSize: 64, lineHeight: 1.0, fontWeight: 800, letterSpacing: "-0.015em" },
  titleMd: { fontFamily: fonteDisplay, fontSize: 44, lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.01em" },
  eyebrow: { fontFamily: fonteDisplay, fontSize: 22, lineHeight: 1.2, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" },
  bodyLg: { fontFamily: fonteBody, fontSize: 34, lineHeight: 1.35, fontWeight: 400 },
  captionVideo: { fontFamily: fonteBody, fontSize: 40, lineHeight: 1.25, fontWeight: 600 },
  bodySm: { fontFamily: fonteBody, fontSize: 24, lineHeight: 1.4, fontWeight: 400 },
  statXl: { fontFamily: fonteMono, fontSize: 120, lineHeight: 1.0, fontWeight: 700 },
  chapter: { fontFamily: fonteMono, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" },
  code: { fontFamily: fonteMono, fontSize: 26, lineHeight: 1.5, fontWeight: 400 },
} as const satisfies Record<string, React.CSSProperties>;

// O único efeito permitido: halo difuso na cor do pilar, atrás do título
export const glow = (acento: string): React.CSSProperties => ({ boxShadow: `0 0 120px 20px ${acento}55` });

// Estrelas sutis (pontos de ink a 20–40%, no máximo 60), estáticas. A marca pode desligar (fundo.estrelas).
export const estrelas = (semente: string, n = 50, largura = 1080, altura = 1920) =>
  Array.from({ length: marca.fundo.estrelas ? Math.min(n, 60) : 0 }, (_, i) => ({
    x: random(`${semente}-x-${i}`) * largura,
    y: random(`${semente}-y-${i}`) * altura,
    r: 1.5 + random(`${semente}-r-${i}`) * 1.5,
    o: 0.2 + random(`${semente}-o-${i}`) * 0.2,
  }));

// Curva "suave e decidida" usada nas entradas
// (vem do ESTILO ativo, estilos/ativo.ts; no mini-action é [0.16, 1, 0.3, 1]. O resto do estilo: animacoes/estilo.ts)
export const SUAVE = dadosDoEstilo.movimento.curva as unknown as readonly [number, number, number, number];
