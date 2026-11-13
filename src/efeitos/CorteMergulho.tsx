import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { ds } from "../animacoes/tema";

// Corte de mergulho: a câmera mergulha rápido no plano `de` (aproxima e borra) e sai já no plano `para`,
// que assenta vindo de perto. Esconde um corte seco (jump cut) e marca a troca de assunto.
//   em:       quadro do corte (o meio da transição)
//   duracao:  quadros da transição inteira (metade em cada plano)
//   foco:     ponto do mergulho, de 0 a 1 (padrão: o rosto, um pouco acima do centro)
export const CorteMergulho: React.FC<{
  de: React.ReactNode;
  para: React.ReactNode;
  em: number;
  duracao?: number;
  foco?: { x: number; y: number };
}> = ({ de, para, em, duracao = 12, foco = { x: 0.5, y: 0.42 } }) => {
  const frame = useCurrentFrame();
  const meia = duracao / 2;
  const entra = { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const sai = { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const antes = frame < em;
  const escala = antes ? interpolate(frame, [em - meia, em], [1, 2.6], entra) : interpolate(frame, [em, em + meia], [2.2, 1], sai);
  const borrao = antes ? interpolate(frame, [em - meia, em], [0, 18], entra) : interpolate(frame, [em, em + meia], [18, 0], sai);
  const clarao = interpolate(frame, [em - 2, em, em + 3], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: ds.bg000 }}>
      <AbsoluteFill style={{ scale: escala, transformOrigin: `${foco.x * 100}% ${foco.y * 100}%`, filter: borrao > 0.05 ? `blur(${borrao.toFixed(2)}px)` : undefined }}>
        {antes ? de : para}
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: ds.ink, opacity: clarao }} />
    </AbsoluteFill>
  );
};
