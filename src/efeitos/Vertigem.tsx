import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { comAlfa } from "../animacoes/estilo";
import { ds } from "../animacoes/tema";

// Vertigem: a pessoa fica do mesmo tamanho enquanto o fundo mergulha atrás dela, como o "dolly zoom" do cinema.
// Bom para a virada do vídeo ("e aí caiu a ficha").
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada>. O `fundo` NÃO deve ser a própria gravação (a pessoa
// apareceria de novo, maior, atrás dela): use o <TunelDeFundo>, um cenário da marca ou outra imagem.
//   de, duracao: quando o mergulho acontece;  escalaDe → escalaAte: quanto o fundo aproxima
export const Vertigem: React.FC<{
  fundo: React.ReactNode;
  pessoa: React.ReactNode;
  de: number;
  duracao?: number;
  escalaDe?: number;
  escalaAte?: number;
  foco?: { x: number; y: number };
}> = ({ fundo, pessoa, de, duracao = 45, escalaDe = 1, escalaAte = 2.2, foco = { x: 0.5, y: 0.42 } }) => {
  const frame = useCurrentFrame();
  const curva = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const escala = interpolate(frame, [de, de + duracao], [escalaDe, escalaAte], curva);
  const sombra = interpolate(frame, [de, de + duracao], [0.15, 0.6], curva);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: ds.bg000 }}>
      <AbsoluteFill style={{ scale: escala, transformOrigin: `${foco.x * 100}% ${foco.y * 100}%` }}>{fundo}</AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${foco.x * 100}% ${foco.y * 100}%, transparent 35%, ${comAlfa(ds.bg000, sombra)} 100%)` }} />
      <AbsoluteFill>{pessoa}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// Túnel de molduras na cor da marca, para a vertigem (ou qualquer fundo que precise de profundidade).
export const TunelDeFundo: React.FC<{ acento: string; foco?: { x: number; y: number } }> = ({ acento, foco = { x: 0.5, y: 0.42 } }) => (
  <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
    {Array.from({ length: 16 }, (_, i) => {
      const s = Math.pow(1.28, i - 6); // de bem pequeno a maior que a tela
      const w = 900 * s;
      const h = 1500 * s;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: foco.x * 1080 - w / 2,
            top: foco.y * 1920 - h / 2,
            width: w,
            height: h,
            borderRadius: 40 * s,
            border: `${Math.max(1.5, 3 * s).toFixed(1)}px solid ${i % 4 === 1 ? comAlfa(acento, 0.55) : comAlfa(ds.ink, 0.1 + 0.02 * i)}`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);
