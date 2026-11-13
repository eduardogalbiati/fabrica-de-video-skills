import { AbsoluteFill, interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { comAlfa } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { ease } from "../pecas/util";

// Varredura antes/depois: um fio de luz atravessa a tela e, por onde passa, troca a versão "antes" pela
// "depois" (gravação crua → tratada, sem efeito → com efeito). Os rótulos ficam abaixo da faixa da legenda.
//   antes, depois: as duas cenas (para um "antes" rápido da mesma gravação: <Gravacao filtro={FILTRO_CRU} />)
//   em, duracao:   quadro em que a luz começa a atravessar e quantos quadros leva
export const VarreduraAntesDepois: React.FC<{
  antes: React.ReactNode;
  depois: React.ReactNode;
  acento: string;
  em: number;
  duracao?: number;
  rotuloAntes?: string;
  rotuloDepois?: string;
  rotuloTop?: number;
}> = ({ antes, depois, acento, em, duracao = 26, rotuloAntes = "antes", rotuloDepois = "depois", rotuloTop = 1170 }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [em, em + duracao], [-40, 1120], ease);
  const passando = interpolate(frame, [em - 4, em, em + duracao, em + duracao + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pilula = (texto: string, lado: "left" | "right", visivel: number, destaque: boolean): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        [lado]: ds.space[4] + (lado === "right" ? 1080 - 930 - ds.space[4] : 0),
        top: rotuloTop,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 26px",
        borderRadius: ds.radius.pill,
        backgroundColor: comAlfa(ds.bg000, 0.78),
        border: `2px solid ${destaque ? acento : comAlfa(ds.ink, 0.2)}`,
        ...tipo.chapter,
        fontSize: 28,
        color: ds.ink,
        opacity: visivel,
      }}
    >
      {destaque ? <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: acento }} /> : null}
      {texto}
    </div>
  );
  const fim = interpolate(frame, [em + duracao - 6, em + duracao + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill>{antes}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0px ${Math.max(0, 1080 - x).toFixed(1)}px 0px 0px)` }}>{depois}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x - 3,
          top: 0,
          width: 6,
          height: 1920,
          backgroundColor: ds.ink,
          opacity: passando,
          boxShadow: `0 0 28px 8px ${comAlfa(acento, 0.55)}, 0 0 90px 30px ${comAlfa(acento, 0.22)}`,
        }}
      />
      {pilula(rotuloAntes, "right", 1 - fim, false)}
      {pilula(rotuloDepois, "left", interpolate(frame, [em + 6, em + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), true)}
    </AbsoluteFill>
  );
};
