import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Sequence, useCurrentFrame, useVideoConfig } from "../relogio";
import { z } from "zod";
import { Assinatura, Canto, FundoNoite } from "./Base";
import { ds, glow, PILAR_PADRAO, pilares, pilarSchema, SUAVE, tipo } from "./tema";

// Frases que entram palavra por palavra. *palavra* = cor do pilar (a palavra-chave).
export const textoImpactoSchema = z.object({
  pilar: pilarSchema,
  eyebrow: z.string(),
  canto: z.string(),
  frases: z.array(z.string()),
  segundosPorFrase: z.number().min(0.5).max(10),
});
type Props = z.infer<typeof textoImpactoSchema>;
const ease = { easing: Easing.bezier(...SUAVE), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Frase: React.FC<{ texto: string; duracao: number; acento: string }> = ({ texto, duracao, acento }) => {
  const frame = useCurrentFrame();
  // separa em palavras, mantendo o destaque de trechos *com várias palavras*
  const palavras = texto
    .split(/(\*[^*]+\*)/)
    .flatMap((trecho) =>
      trecho.startsWith("*") ? trecho.slice(1, -1).split(" ").map((p) => ({ p, chave: true })) : trecho.split(" ").map((p) => ({ p, chave: false })),
    )
    .filter((w) => w.p);
  const saida = interpolate(frame, [duracao - 8, duracao], [1, 0], ease);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${ds.space[4]}px`, opacity: saida }}>
      <div style={{ ...tipo.hookXl, color: ds.ink, display: "flex", flexWrap: "wrap", gap: "0 22px" }}>
        {palavras.map(({ p, chave }, i) => {
          const t = interpolate(frame, [i * 3, i * 3 + 12], [0, 1], ease);
          return (
            <span key={i} style={{ color: chave ? acento : ds.ink, opacity: t, translate: `0px ${interpolate(t, [0, 1], [30, 0])}px` }}>
              {p}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const TextoImpacto: React.FC<Props> = ({ pilar, eyebrow, canto, frases, segundosPorFrase }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { acento, soft, nome } = pilares[pilar];
  const duracao = Math.round(segundosPorFrase * fps);
  return (
    <AbsoluteFill>
      <FundoNoite semente="impacto" />
      {/* glow atrás do título */}
      <div style={{ position: "absolute", left: 240, top: 860, width: 600, height: 200, borderRadius: 999, backgroundColor: acento, filter: "blur(90px)", opacity: 0.35 * 0.8 }} />
      <div
        style={{ position: "absolute", left: ds.space[4], top: 700, ...tipo.eyebrow, color: soft, opacity: interpolate(frame, [0, 12], [0, 1], ease) }}
      >
        {eyebrow}
      </div>
      <Canto texto={canto || nome} />
      {frases.map((f, i) => (
        <Sequence key={i} from={i * duracao} durationInFrames={duracao} name={`Frase ${i + 1}`}>
          <Frase texto={f} duracao={duracao} acento={acento} />
        </Sequence>
      ))}
      <Assinatura secao={nome} />
    </AbsoluteFill>
  );
};

export const textoImpactoPadrao: Props = {
  pilar: PILAR_PADRAO,
  eyebrow: pilares[PILAR_PADRAO].nome,
  canto: "",
  frases: ["Sua frase de *impacto* entra aqui", "Uma ideia por *frase*", "A palavra-chave fica em *destaque*"],
  segundosPorFrase: 2.2,
};
