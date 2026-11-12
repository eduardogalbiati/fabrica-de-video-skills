import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { comAlfa, destaqueEstilo } from "../animacoes/estilo";
import { ds, fonteDisplay, zonasReels } from "../animacoes/tema";
import { ease } from "./util";
import type { PosicaoLegenda } from "./LegendaQueimada";

// Legenda FLUIDA: de 1 a 3 palavras por vez, em letra de título grande, sem tarja. Cada palavra entra no instante
// em que é falada (sobe um pouco e aparece), e o bloco troca quando começa o próximo. A *palavra* entre asteriscos
// sai na cor do tema (no estilo palco, também em itálico). É a alternativa à LegendaQueimada (frases inteiras).
// Os blocos vêm de `npm run paginar -- legendas\<nome>.json "<vídeo>" fluida` (tempos em segundos).
export const blocoFluidoSchema = z.object({
  de: z.number(),
  ate: z.number(),
  palavras: z.array(z.object({ texto: z.string(), de: z.number() })),
});
export type BlocoFluido = z.infer<typeof blocoFluidoSchema>;

const ALTURA = zonasReels.legenda.y1 - zonasReels.legenda.y0;
const caixas: Record<PosicaoLegenda, { left: number; width: number; top: number }> = {
  faixa: { left: zonasReels.lateral, width: 1080 - 2 * zonasReels.lateral, top: zonasReels.legenda.y0 },
  "terco-superior": { left: zonasReels.lateral, width: 1080 - 2 * zonasReels.lateral, top: 260 },
  base: { left: zonasReels.lateral, width: zonasReels.botoes.x - zonasReels.lateral, top: 1920 - zonasReels.base - 40 - ALTURA },
};

export const LegendaFluida: React.FC<{
  blocos: BlocoFluido[];
  acento: string;
  posicao?: PosicaoLegenda;
  tamanho?: number;
  veu?: boolean; // um véu escuro e difuso atrás das palavras, para ler sobre fundo claro (não é sombra no texto)
  centroY?: number; // y do meio da legenda, se não for a `posicao` (rosto em tela cheia: logo abaixo do queixo)
}> = ({ blocos, acento, posicao = "faixa", tamanho = 70, veu = true, centroY }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const bloco = blocos.find((b) => t >= b.de && t < b.ate);
  if (!bloco) return null;
  const caixa = centroY ? { ...caixas.faixa, top: centroY - ALTURA / 2 } : caixas[posicao];
  return (
    <div style={{ position: "absolute", ...caixa, height: ALTURA, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {veu ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: Math.min(caixa.width, 260 + bloco.palavras.reduce((n, p) => n + p.texto.length, 0) * tamanho * 0.36),
            height: tamanho * 1.9,
            translate: "-50% -50%",
            borderRadius: 999,
            backgroundColor: comAlfa(ds.bg000, 0.42),
            filter: "blur(38px)",
          }}
        />
      ) : null}
      <div style={{ position: "relative", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: tamanho * 0.28, maxWidth: "100%" }}>
        {bloco.palavras.map((p, i) => {
          const desde = (t - p.de) * fps; // quadros desde que a palavra foi falada
          if (desde < 0) return null;
          const v = interpolate(desde, [0, 5], [0, 1], ease);
          const destaque = p.texto.startsWith("*") && p.texto.endsWith("*") && p.texto.length > 2;
          const texto = destaque ? p.texto.slice(1, -1) : p.texto;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: fonteDisplay,
                fontWeight: 800,
                fontSize: tamanho,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                color: ds.ink,
                opacity: v,
                translate: `0px ${interpolate(v, [0, 1], [tamanho * 0.22, 0]).toFixed(2)}px`,
                scale: interpolate(v, [0, 1], [0.92, 1]),
                ...(destaque ? destaqueEstilo(acento) : {}),
              }}
            >
              {texto}
            </span>
          );
        })}
      </div>
    </div>
  );
};
