import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { comAlfa } from "../animacoes/estilo";
import { ds, fonteBody, fonteDisplay, fonteMono } from "../animacoes/tema";
import { ease } from "../pecas/util";

// Recorte de papel: a pessoa vira um adesivo recortado (borda clara e sombra), sobre tiras de papel rasgado,
// com uma palavra em letras recortadas embaixo. Anda "aos trancos" (2 quadros por passo), como stop-motion.
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada>.
//   em: quadro em que o papel rasga e a pessoa cola;  letras: a palavra das letras recortadas (curta)
//   letrasEm, letrasPasso: quadros depois de `em` em que a primeira letra chega e entre uma letra e outra
//   (cena curta: 4 e 2, para a palavra inteira chegar a tempo)
export const RecortePapel: React.FC<{
  pessoa: React.ReactNode;
  acento: string;
  em: number;
  letras?: string;
  giro?: number;
  letrasTop?: number;
  letrasEm?: number;
  letrasPasso?: number;
}> = ({ pessoa, acento, em, letras, giro = -2, letrasTop = 1190, letrasEm = 14, letrasPasso = 4 }) => {
  const frameReal = useCurrentFrame();
  const frame = em + Math.floor((frameReal - em) / 2) * 2; // stop-motion
  const rasga = interpolate(frame, [em, em + 10], [0, 1], ease);
  const cola = interpolate(frame, [em + 4, em + 12], [0, 1], ease);
  const borda = 7;
  const rasgado = (semente: string, y0: number, y1: number) => {
    const pontos: string[] = [];
    for (let x = 0; x <= 1080; x += 36) pontos.push(`${x},${y0 + (random(`${semente}-a-${x}`) - 0.5) * 34}`);
    for (let x = 1080; x >= 0; x -= 36) pontos.push(`${x},${y1 + (random(`${semente}-b-${x}`) - 0.5) * 34}`);
    return pontos.join(" ");
  };
  const fontes = [fonteDisplay, fonteMono, fonteBody];
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: ds.bg100 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <polygon points={rasgado("papel-1", 420, 1240)} fill={ds.ink} transform={`translate(${((1 - rasga) * -1100).toFixed(0)} 0) rotate(-3 540 830)`} />
        <polygon points={rasgado("papel-2", 760, 1010)} fill={acento} transform={`translate(${((1 - rasga) * 1100).toFixed(0)} 0) rotate(4 540 880)`} />
      </svg>
      <AbsoluteFill
        style={{
          opacity: cola,
          scale: interpolate(cola, [0, 1], [0.92, 1]),
          rotate: `${giro}deg`,
          filter: [
            `drop-shadow(${borda}px 0 0 ${ds.ink})`,
            `drop-shadow(-${borda}px 0 0 ${ds.ink})`,
            `drop-shadow(0 ${borda}px 0 ${ds.ink})`,
            `drop-shadow(0 -${borda}px 0 ${ds.ink})`,
            "drop-shadow(0 18px 22px rgba(0, 0, 0, 0.45))",
          ].join(" "),
        }}
      >
        {pessoa}
      </AbsoluteFill>
      {letras ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: letrasTop, display: "flex", justifyContent: "center", gap: 10 }}>
          {letras.split("").map((l, i) => {
            const chega = interpolate(frame, [em + letrasEm + i * letrasPasso, em + letrasEm + 6 + i * letrasPasso], [0, 1], ease);
            const tipoDaCaixa = i % 3;
            return (
              <div
                key={i}
                style={{
                  minWidth: 92,
                  padding: "6px 14px",
                  textAlign: "center",
                  fontFamily: fontes[i % fontes.length],
                  fontWeight: tipoDaCaixa === 1 ? 700 : 800,
                  fontSize: 88,
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  color: tipoDaCaixa === 0 ? ds.bg000 : tipoDaCaixa === 1 ? ds.ink : ds.bg000,
                  backgroundColor: tipoDaCaixa === 0 ? ds.ink : tipoDaCaixa === 1 ? ds.bg000 : acento,
                  rotate: `${((random(`letra-${i}`) - 0.5) * 12).toFixed(1)}deg`,
                  translate: `0px ${((random(`letra-y-${i}`) - 0.5) * 18).toFixed(1)}px`,
                  boxShadow: `0 8px 14px ${comAlfa(ds.bg000, 0.4)}`,
                  opacity: chega,
                  scale: interpolate(chega, [0, 1], [1.3, 1]),
                }}
              >
                {l}
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
