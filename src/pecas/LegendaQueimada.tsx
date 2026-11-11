import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { ds, tipo, zonasReels } from "../animacoes/tema";
import { Destaque } from "./util";

// Legenda queimada no padrão do design system: frases inteiras (no máximo 2 linhas), fonte de texto da marca em peso 600 a 40 px,
// tarja bg-000 com cantos de 8 px, UMA palavra-chave por frase na cor do pilar (*palavra*).
// Sem animação palavra a palavra: a página troca em corte seco.
// As páginas vêm de `npm run paginar` (tempos em segundos, na linha do tempo do vídeo).
export const paginaLegendaSchema = z.object({ de: z.number(), ate: z.number(), texto: z.string() });
export type PaginaLegenda = z.infer<typeof paginaLegendaSchema>;

// faixa = logo abaixo da divisão da tela dividida (y 985–1125); terco-superior = vídeo de rosto em tela cheia;
// base = acima da zona de baixo do Instagram.
export const posicaoLegendaSchema = z.enum(["faixa", "terco-superior", "base"]);
export type PosicaoLegenda = z.infer<typeof posicaoLegendaSchema>;

const ALTURA = zonasReels.legenda.y1 - zonasReels.legenda.y0;
const caixas: Record<PosicaoLegenda, { left: number; width: number; top: number }> = {
  faixa: { left: zonasReels.legenda.x0, width: zonasReels.legenda.x1 - zonasReels.legenda.x0, top: zonasReels.legenda.y0 },
  "terco-superior": { left: zonasReels.lateral, width: 1080 - 2 * zonasReels.lateral, top: 260 },
  base: { left: zonasReels.lateral, width: zonasReels.botoes.x - zonasReels.lateral, top: 1920 - zonasReels.base - 40 - ALTURA },
};

export const LegendaQueimada: React.FC<{ paginas: PaginaLegenda[]; acento: string; posicao?: PosicaoLegenda }> = ({
  paginas,
  acento,
  posicao = "faixa",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pagina = paginas.find((p) => t >= p.de && t < p.ate);
  if (!pagina) return null;
  return (
    <div style={{ position: "absolute", ...caixas[posicao], height: ALTURA, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          ...tipo.captionVideo,
          color: ds.ink,
          backgroundColor: ds.bg000,
          borderRadius: ds.radius.sm,
          padding: "12px 24px",
          maxWidth: "100%",
          textAlign: "center",
          textWrap: "balance",
        }}
      >
        <Destaque texto={pagina.texto} acento={acento} />
      </div>
    </div>
  );
};
