import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { clamp, ease } from "./util";

// Print de um site dentro de uma moldura de navegador, com rolagem, zoom e destaque de clique.
// O print vem de `npm run print-site` (fica em public/<slug>/) ou de um print enviado por quem pediu o vídeo.
//   rolagem: desloca o print para cima, de `de` até `ate` (em px do print já na largura da moldura)
//   zoom:    aproxima até `escala`, com o foco em (x, y) de 0 a 1 dentro da área visível
//   clique:  círculo discreto na cor do pilar em (x, y) px da área visível, a partir do frame `em`
// Regra do design system: destaque de clique é círculo ou zoom, nunca seta colorida.
export const TelaSite: React.FC<{
  imagem: string;
  url: string;
  acento: string;
  top: number;
  altura: number;
  left?: number;
  largura?: number;
  inicio?: number;
  rolagem?: { de: number; ate: number; inicio: number; duracao: number };
  zoom?: { escala: number; x: number; y: number; inicio: number; duracao: number };
  clique?: { x: number; y: number; em: number };
}> = ({ imagem, url, acento, top, altura, left = ds.space[4], largura = 1080 - 2 * ds.space[4], inicio = 0, rolagem, zoom, clique }) => {
  const frame = useCurrentFrame();
  const BARRA = 64;
  const y = rolagem ? interpolate(frame, [rolagem.inicio, rolagem.inicio + rolagem.duracao], [rolagem.de, rolagem.ate], ease) : 0;
  const escala = zoom ? interpolate(frame, [zoom.inicio, zoom.inicio + zoom.duracao], [1, zoom.escala], ease) : 1;
  const anel = clique ? interpolate(frame, [clique.em, clique.em + 10, clique.em + 26], [0, 1, 0.55], clamp) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: largura,
        height: altura,
        borderRadius: ds.radius.md,
        backgroundColor: ds.bg100,
        border: `2px solid ${ds.line}`,
        overflow: "hidden",
        opacity: interpolate(frame, [inicio, inicio + 10], [0, 1], clamp),
        translate: `0px ${interpolate(frame, [inicio, inicio + 12], [20, 0], ease)}px`,
      }}
    >
      <div style={{ height: BARRA, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", backgroundColor: ds.bg200 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: ds.inkMuted, opacity: 0.5 }} />
        ))}
        <div style={{ marginLeft: 14, flex: 1, padding: "8px 20px", borderRadius: ds.radius.pill, backgroundColor: ds.bg000, ...tipo.code, fontSize: 24, color: ds.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
          {url}
        </div>
      </div>
      <div style={{ position: "relative", height: altura - BARRA, overflow: "hidden", backgroundColor: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, scale: escala, transformOrigin: zoom ? `${zoom.x * 100}% ${zoom.y * 100}%` : "50% 50%" }}>
          <Img src={staticFile(imagem)} style={{ position: "absolute", left: 0, top: 0, width: "100%", translate: `0px ${-y}px` }} />
        </div>
        {clique ? (
          <div
            style={{
              position: "absolute",
              left: clique.x,
              top: clique.y,
              width: 96,
              height: 96,
              translate: "-50% -50%",
              borderRadius: 999,
              border: `5px solid ${acento}`,
              backgroundColor: `${acento}22`,
              opacity: anel,
              scale: interpolate(frame, [clique.em, clique.em + 10], [1.5, 1], clamp),
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
