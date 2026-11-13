import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { z } from "zod";
import { FundoNoite } from "./Base";
import { ds, glow, marca, pilares, pilarSchema, SUAVE, tipo } from "./tema";

// Tela de encerramento (2 s): sempre o mesmo texto e duração — é a assinatura do canal.
export const encerramentoSchema = z.object({
  pilar: pilarSchema,
  frase: z.string(),
  cta: z.string(),
});
type Props = z.infer<typeof encerramentoSchema>;
const ease = { easing: Easing.bezier(...SUAVE), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Encerramento: React.FC<Props> = ({ pilar, frase, cta }) => {
  const frame = useCurrentFrame();
  const { acento, textoNoBotao } = pilares[pilar];
  const a = (t: number) => ({
    opacity: interpolate(frame, [t, t + 10], [0, 1], ease),
    translate: `0px ${interpolate(frame, [t, t + 10], [20, 0], ease)}px`,
  });
  return (
    <AbsoluteFill>
      <FundoNoite semente="fim" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: ds.space[2] }}>
        <div style={{ ...tipo.hookXl, color: ds.ink, letterSpacing: "-0.02em", ...a(0) }}>{marca.site}</div>
        <div style={{ ...tipo.bodyLg, color: ds.inkMuted, ...a(5) }}>{frase}</div>
        <div
          style={{
            marginTop: ds.space[1],
            padding: "22px 56px",
            borderRadius: ds.radius.pill,
            backgroundColor: acento,
            color: textoNoBotao,
            ...tipo.titleMd,
            ...glow(acento),
            ...a(10),
          }}
        >
          {cta}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// O encerramento padrão vem da marca (marca.json → encerramento)
export const encerramentoPadrao: Props = {
  pilar: pilarSchema.parse(marca.encerramento.tema),
  frase: marca.encerramento.frase,
  cta: marca.encerramento.cta,
};
