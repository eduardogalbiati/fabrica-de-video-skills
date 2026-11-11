import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { clamp, ease } from "./util";

// v1 → v2 → v3 … cada etapa aparecendo mais rápido, com uma curva que sobe acelerando por trás.
export const LinhaVersoes: React.FC<{ acento: string; top: number; atrasos?: number[] }> = ({
  acento,
  top,
  atrasos = [0, 1, 1.6, 1.95, 2.15],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = atrasos.length;
  const x0 = ds.space[4] + 50; // rótulos centrados nos pontos: folga para não invadir a margem
  const x1 = 1080 - ds.space[4] - 70;
  const passo = (x1 - x0) / (n - 1);
  const curvaP = interpolate(frame, [0, (atrasos[n - 1] + 0.5) * fps], [0, 1], { ...ease });
  const base = top + 120;
  const alturaCurva = 200;
  // curva exponencial
  const pts = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    return `${x0 + (x1 - x0) * t},${base - alturaCurva * (Math.exp(3.2 * t) - 1) / (Math.exp(3.2) - 1)}`;
  }).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={960} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke={`${acento}88`} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - curvaP} />
      </svg>
      {atrasos.map((a, i) => {
        const t = a * fps;
        const op = interpolate(frame, [t, t + 6], [0, 1], clamp);
        const ultimo = i === n - 1;
        return (
          <div key={i}>
            {i > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: x0 + passo * (i - 1) + 60,
                  top: base + 60,
                  width: passo - 120,
                  height: 4,
                  backgroundColor: ds.inkMuted,
                  transformOrigin: "left",
                  scale: `${interpolate(frame, [t - 4, t + 2], [0, 1], clamp)} 1`,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: x0 + passo * i,
                top: base + 30,
                translate: "-50% 0px",
                ...tipo.statXl,
                fontSize: 56,
                color: i >= n - 2 ? acento : ds.ink,
                opacity: op,
                scale: interpolate(frame, [t, t + 6], [0.6, 1], clamp),
              }}
            >
              v{i + 1}
              {ultimo ? "…" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
};
