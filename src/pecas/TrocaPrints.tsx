import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, clamp } from "./util";

// Prints trocando rápido (corte seco) numa moldura bg-200, com chips aparecendo por cima.
export const TrocaPrints: React.FC<{
  imagens: string[];
  segundosPorImagem?: number;
  chips?: { texto: string; em: number }[];
  acento: string;
  top: number;
  altura: number;
  saiEm?: number;
}> = ({ imagens, segundosPorImagem = 0.7, chips = [], acento, top, altura, saiEm }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.min(Math.floor(frame / (segundosPorImagem * fps)), imagens.length - 1);
  const entra = interpolate(frame, [0, 10], [0, 1], clamp);
  const sai = saiEm === undefined ? 1 : interpolate(frame, [saiEm, saiEm + 8], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top, height: altura, opacity: entra * sai }}>
      <div style={{ width: "100%", height: "100%", padding: 12, borderRadius: ds.radius.lg, backgroundColor: ds.bg200 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: ds.radius.lg - 12, overflow: "hidden", backgroundColor: "#fff" }}>
          <Img
            src={staticFile(imagens[idx])}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top left",
              scale: interpolate(frame, [0, 120], [1, 1.05], clamp),
            }}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -36, display: "flex", justifyContent: "center", gap: 16 }}>
        {chips.map((c, i) => (
          <div
            key={i}
            style={{
              padding: "14px 26px",
              borderRadius: ds.radius.pill,
              backgroundColor: ds.bg100,
              border: `1px solid ${ds.line}`,
              ...tipo.chapter,
              fontSize: 28,
              color: ds.ink,
              ...aparece(frame, c.em, 10, 16),
            }}
          >
            {c.texto} <span style={{ color: acento }}>✓</span>
          </div>
        ))}
      </div>
    </div>
  );
};
