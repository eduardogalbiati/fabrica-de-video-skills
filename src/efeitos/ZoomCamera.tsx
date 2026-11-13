import { AbsoluteFill, interpolate } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { comAlfa } from "../animacoes/estilo";
import { ds, tipo, zonasReels } from "../animacoes/tema";
import { clamp } from "../pecas/util";
import { presenca } from "./Gravacao";

// Zoom de câmera: a imagem aproxima em degraus, como o zoom digital de uma câmera, e aparece a tela do
// visor (cantos do quadro, REC com o tempo, régua do zoom). Bom para "presta atenção nisso".
//   children: a cena (normalmente a <Gravacao>)
//   de, ate:  quadros em que o zoom entra e sai (ate opcional: fica até o fim)
//   escala:   o zoom final (1.35 = 1,35×);  foco: ponto do zoom, de 0 a 1
//   relogio:  segundo mostrado no REC quando o zoom começa
export const ZoomCamera: React.FC<{
  children: React.ReactNode;
  acento: string;
  de: number;
  ate?: number;
  escala?: number;
  foco?: { x: number; y: number };
  relogio?: number;
  rotulo?: string;
}> = ({ children, acento, de, ate, escala = 1.35, foco = { x: 0.5, y: 0.42 }, relogio = 0, rotulo = "REC" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = interpolate(frame, [de, de + 9], [0, 1], clamp);
  const sai = ate === undefined ? 1 : interpolate(frame, [ate, ate + 6], [1, 0], clamp);
  // degraus de 0,05×, como o zoom digital
  const bruto = 1 + (escala - 1) * Math.min(entra, sai);
  const z = Math.round(bruto * 20) / 20;
  const hud = presenca(frame, de, ate, 4);
  const segundos = relogio + Math.max(0, frame - de) / fps;
  const tempo = `${String(Math.floor(segundos / 3600)).padStart(2, "0")}:${String(Math.floor((segundos % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(segundos % 60)).padStart(2, "0")}`;
  const pisca = Math.floor(frame / 15) % 2 === 0;
  // quadro de foco: dentro das zonas livres, longe da coluna de botões. O REC fica logo abaixo da zona de cima
  // (em y 200, onde ficava até 2026-11-12, encostava na seta de voltar do app) e o quadro começa abaixo dele.
  const q = { x0: 150, x1: zonasReels.botoes.x - 20, y0: zonasReels.topo + 100, y1: 1440 };
  const canto = 72;
  const linha = `5px solid ${comAlfa(ds.ink, 0.92)}`;
  const regua = { x0: 300, x1: 780, y: 1520 };
  const pos = interpolate(z, [1, 2], [regua.x0, regua.x1], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: z, transformOrigin: `${foco.x * 100}% ${foco.y * 100}%` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ opacity: hud }}>
        {[
          { left: q.x0, top: q.y0, borderLeft: linha, borderTop: linha },
          { left: q.x1 - canto, top: q.y0, borderRight: linha, borderTop: linha },
          { left: q.x0, top: q.y1 - canto, borderLeft: linha, borderBottom: linha },
          { left: q.x1 - canto, top: q.y1 - canto, borderRight: linha, borderBottom: linha },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", width: canto, height: canto, ...c }} />
        ))}
        <div style={{ position: "absolute", left: ds.space[4] + 24, top: zonasReels.topo + 20, display: "flex", alignItems: "center", gap: 14, ...tipo.chapter, fontSize: 28, color: ds.ink }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: acento, opacity: pisca ? 1 : 0.25 }} />
          <span>{rotulo}</span>
          <span style={{ color: comAlfa(ds.ink, 0.75) }}>{tempo}</span>
        </div>
        <div style={{ position: "absolute", left: regua.x0, top: regua.y, width: regua.x1 - regua.x0, height: 3, backgroundColor: comAlfa(ds.ink, 0.45) }} />
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: regua.x0 + ((regua.x1 - regua.x0) * i) / 10, top: regua.y - (i % 5 === 0 ? 14 : 8), width: 3, height: i % 5 === 0 ? 31 : 19, backgroundColor: comAlfa(ds.ink, 0.55) }} />
        ))}
        <div style={{ position: "absolute", left: pos, top: regua.y - 22, width: 6, height: 47, translate: "-50% 0px", borderRadius: 3, backgroundColor: acento }} />
        <div style={{ position: "absolute", left: pos, top: regua.y - 76, translate: "-50% 0px", ...tipo.chapter, fontSize: 30, color: ds.ink }}>{`${z.toFixed(2).replace(".", ",")}×`}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
