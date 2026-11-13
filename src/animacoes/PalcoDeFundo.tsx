import { AbsoluteFill, random } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { comAlfa } from "./estilo";
import { ds } from "./tema";

// Fundo "palco" dos estilos: um piso quadriculado em perspectiva que some no horizonte e avança devagar,
// uma luz suave vinda de cima e partículas desfocadas subindo no ar. Tudo nas cores da marca (texto e fundo),
// bem apagado, para ficar atrás de tudo. Quem escolhe é o estilo (fundo.tipo = "palco").
export const PalcoDeFundo: React.FC<{ semente: string; altura: number; particulas?: number }> = ({ semente, altura, particulas = 16 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const horizonte = Math.round(altura * 0.6);
  const fundoDoPiso = altura - horizonte;
  const centro = 540;

  // linhas que vêm do horizonte para quem olha (verticais do piso)
  const verticais = Array.from({ length: 23 }, (_, i) => i - 11).map((i) => ({ x1: centro + i * 14, x2: centro + i * 150 }));
  // linhas que atravessam o piso, mais juntas perto do horizonte, andando para a frente
  const QUANTAS = 12;
  const avanco = (t * 0.18) % 1;
  const horizontais = Array.from({ length: QUANTAS }, (_, k) => {
    const p = (k + avanco) / QUANTAS; // 0 = horizonte, 1 = pé da tela
    return { y: horizonte + fundoDoPiso * p * p, o: 0.04 + 0.16 * p };
  });

  const n = Math.max(0, Math.min(40, Math.round((particulas * altura) / 1920)));
  const pontos = Array.from({ length: n }, (_, i) => {
    const vel = 14 + random(`${semente}-pv-${i}`) * 22; // px por segundo, para cima
    const y0 = random(`${semente}-py-${i}`) * (altura + 80);
    return {
      x: random(`${semente}-px-${i}`) * 1080 + Math.sin(t * 0.4 + i) * 18,
      y: ((y0 - t * vel) % (altura + 80) + altura + 80) % (altura + 80) - 40,
      r: 3 + random(`${semente}-pr-${i}`) * 6,
      o: 0.12 + random(`${semente}-po-${i}`) * 0.22,
    };
  });

  return (
    <AbsoluteFill>
      {/* luz de cima */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 22%, ${comAlfa(ds.ink, 0.09)}, ${comAlfa(ds.ink, 0)} 70%)` }} />
      <svg width={1080} height={altura} style={{ position: "absolute", inset: 0 }}>
        {verticais.map((l, i) => (
          <line key={`v${i}`} x1={l.x1} y1={horizonte} x2={l.x2} y2={altura} stroke={ds.ink} strokeWidth={1.2} opacity={0.1} />
        ))}
        {horizontais.map((l, i) => (
          <line key={`h${i}`} x1={0} y1={l.y} x2={1080} y2={l.y} stroke={ds.ink} strokeWidth={1.2} opacity={l.o} />
        ))}
      </svg>
      {/* o piso some no escuro perto do horizonte */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: horizonte - 2,
          height: fundoDoPiso * 0.45,
          background: `linear-gradient(${ds.bg000}, ${comAlfa(ds.bg000, 0)})`,
        }}
      />
      {/* brilho fino na linha do horizonte */}
      <div style={{ position: "absolute", left: 140, right: 140, top: horizonte - 1, height: 2, background: `linear-gradient(90deg, ${comAlfa(ds.ink, 0)}, ${comAlfa(ds.ink, 0.18)}, ${comAlfa(ds.ink, 0)})` }} />
      {pontos.map((p, i) => (
        <div
          key={`p${i}`}
          style={{
            position: "absolute",
            left: p.x - p.r,
            top: p.y - p.r,
            width: p.r * 2,
            height: p.r * 2,
            borderRadius: 999,
            backgroundColor: ds.ink,
            opacity: p.o,
            filter: "blur(3px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
