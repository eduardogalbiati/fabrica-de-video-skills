import { AbsoluteFill } from "remotion";
import { estilo } from "./estilo";
import { PalcoDeFundo } from "./PalcoDeFundo";
import { RedeDeFundo } from "./RedeDeFundo";
import { ds, estrelas, marca, tipo, zonasReels as z } from "./tema";

// Fundo na cor de fundo da marca. O desenho por cima é do ESTILO (fundo.tipo):
//   "estrelas" (mini-action) estrelas sutis paradas, se a marca permitir (fundo.estrelas)
//   "rede"                   pontos e linhas que derivam devagar
//   "palco"                  piso quadriculado em perspectiva, luz de cima e partículas desfocadas
//   "liso"                   nada
export const FundoNoite: React.FC<{ semente?: string; altura?: number }> = ({ semente = "ceu", altura = 1920 }) => (
  <AbsoluteFill style={{ backgroundColor: ds.bg000 }}>
    {estilo.fundo?.tipo === "rede" ? (
      <RedeDeFundo semente={semente} altura={altura} pontos={estilo.fundo.pontos} deriva={estilo.fundo.deriva} />
    ) : estilo.fundo?.tipo === "palco" ? (
      <PalcoDeFundo semente={semente} altura={altura} particulas={estilo.fundo.particulas} />
    ) : estilo.fundo?.tipo === "liso" ? null : (
      <svg width={1080} height={altura} style={{ position: "absolute", inset: 0 }}>
        {estrelas(semente, 50, 1080, altura).map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={e.r} fill={ds.ink} opacity={e.o} />
        ))}
      </svg>
    )}
  </AbsoluteFill>
);

// Assinatura fixa: "<site da marca> · <seção>" no canto inferior esquerdo (acima da zona do Instagram)
export const Assinatura: React.FC<{ secao: string; bottom?: number }> = ({ secao, bottom = ds.zonaInferior }) => (
  <div style={{ position: "absolute", left: ds.space[4], bottom, ...tipo.bodySm, color: ds.inkMuted }}>
    {marca.site} · {secao}
  </div>
);

// Canto superior direito: "CAP. NN" ou nome do pilar. Fica logo abaixo da zona de cima: em y 160, onde ficava
// até 2026-11-12, o botão "+" do app cobria o fim do texto.
export const Canto: React.FC<{ texto: string; top?: number }> = ({ texto, top = z.topo }) =>
  texto ? (
    <div style={{ position: "absolute", right: ds.space[4], top, ...tipo.chapter, color: ds.inkMuted }}>{texto}</div>
  ) : null;

// Guia visual (só para conferir no Studio): vermelho = coberto pelo Instagram, verde = faixa da legenda.
export const GuiaZonaSegura: React.FC = () => {
  const vermelho = "rgba(229, 72, 77, 0.35)";
  const rotulo: React.CSSProperties = { position: "absolute", ...tipo.chapter, fontSize: 24, color: "#fff" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: z.topo, backgroundColor: vermelho }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: z.base, backgroundColor: vermelho }} />
      <div style={{ position: "absolute", left: 0, top: z.topo, bottom: z.base, width: z.lateral, backgroundColor: "rgba(229, 72, 77, 0.18)" }} />
      <div style={{ position: "absolute", right: 0, top: z.topo, bottom: z.base, width: z.lateral, backgroundColor: "rgba(229, 72, 77, 0.18)" }} />
      <div
        style={{
          position: "absolute",
          left: z.botoes.x,
          right: 0,
          top: z.botoes.y0,
          height: 1920 - z.base - z.botoes.y0,
          backgroundColor: vermelho,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: z.legenda.x0,
          top: z.legenda.y0,
          width: z.legenda.x1 - z.legenda.x0,
          height: z.legenda.y1 - z.legenda.y0,
          border: "4px dashed #3ddc84",
          backgroundColor: "rgba(61, 220, 132, 0.12)",
        }}
      />
      <div style={{ ...rotulo, left: 24, top: 60 }}>TOPO · INTERFACE</div>
      <div style={{ ...rotulo, left: 24, bottom: 140 }}>BASE · LEGENDA DO POST E PERFIL</div>
      <div style={{ ...rotulo, left: z.botoes.x + 10, top: z.botoes.y0 + 10, width: 140, fontSize: 20 }}>BOTÕES</div>
      <div style={{ ...rotulo, left: z.legenda.x0 + 16, top: z.legenda.y0 + 12, color: "#3ddc84" }}>LEGENDA AQUI</div>
    </AbsoluteFill>
  );
};
