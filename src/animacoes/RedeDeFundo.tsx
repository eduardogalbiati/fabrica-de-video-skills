import { random } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { ds } from "./tema";

// Fundo "rede" dos estilos: pontos espalhados que derivam devagar, ligados por linhas finas quando ficam perto.
// Bem apagada, na cor do texto secundário da marca, para ficar atrás de tudo. Quem escolhe é o estilo (fundo.tipo = "rede").
export const RedeDeFundo: React.FC<{ semente: string; altura: number; pontos?: number; deriva?: number }> = ({ semente, altura, pontos = 46, deriva = 22 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const n = Math.max(0, Math.min(90, Math.round((pontos * altura) / 1920)));
  const nos = Array.from({ length: n }, (_, i) => {
    const vx = 0.12 + random(`${semente}-vx-${i}`) * 0.18;
    const vy = 0.1 + random(`${semente}-vy-${i}`) * 0.16;
    const fase = random(`${semente}-f-${i}`) * Math.PI * 2;
    return {
      x: random(`${semente}-x-${i}`) * 1080 + Math.sin(t * vx * 2 * Math.PI * 0.25 + fase) * deriva,
      y: random(`${semente}-y-${i}`) * altura + Math.cos(t * vy * 2 * Math.PI * 0.25 + fase) * deriva,
      r: 1.6 + random(`${semente}-r-${i}`) * 2,
      o: 0.25 + random(`${semente}-o-${i}`) * 0.3,
    };
  });
  const LIGA = 230;
  const linhas: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
  for (let i = 0; i < nos.length; i++) {
    for (let j = i + 1; j < nos.length; j++) {
      const d = Math.hypot(nos[i].x - nos[j].x, nos[i].y - nos[j].y);
      if (d < LIGA) linhas.push({ x1: nos[i].x, y1: nos[i].y, x2: nos[j].x, y2: nos[j].y, o: (1 - d / LIGA) * 0.22 });
    }
  }
  return (
    <svg width={1080} height={altura} style={{ position: "absolute", inset: 0 }}>
      {linhas.map((l, i) => (
        <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={ds.inkMuted} strokeWidth={1.2} opacity={l.o} />
      ))}
      {nos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={ds.inkMuted} opacity={p.o} />
      ))}
    </svg>
  );
};
