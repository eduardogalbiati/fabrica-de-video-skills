import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ease } from "../pecas/util";

// Fundo trocado: a gravação começa normal e, a partir de `em`, um círculo cresce atrás da pessoa e troca o
// fundo por outro (cenário da marca, print, vídeo). A pessoa fica na frente o tempo todo.
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada> da mesma gravação, com o mesmo `inicio`.
//   gravacao: a <Gravacao> original;  fundo: o novo fundo;  centro: de onde o círculo nasce (0 a 1)
export const FundoTrocado: React.FC<{
  gravacao: React.ReactNode;
  pessoa: React.ReactNode;
  fundo: React.ReactNode;
  em: number;
  duracao?: number;
  centro?: { x: number; y: number };
}> = ({ gravacao, pessoa, fundo, em, duracao = 18, centro = { x: 0.5, y: 0.42 } }) => {
  const frame = useCurrentFrame();
  const raio = interpolate(frame, [em, em + duracao], [0, 2300], ease);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill>{gravacao}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${raio.toFixed(1)}px at ${centro.x * 100}% ${centro.y * 100}%)` }}>{fundo}</AbsoluteFill>
      <AbsoluteFill>{pessoa}</AbsoluteFill>
    </AbsoluteFill>
  );
};
