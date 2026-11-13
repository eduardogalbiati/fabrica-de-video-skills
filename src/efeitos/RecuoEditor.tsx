import { AbsoluteFill, interpolate, random } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { FundoNoite } from "../animacoes/Base";
import { cartao, comAlfa } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { clamp, ease } from "../pecas/util";

// Recuo para o editor: a câmera recua e o vídeo vira uma janela dentro do editor, com checklist à
// esquerda, lista de efeitos à direita e, abaixo da faixa da legenda, a linha do tempo com a onda e a
// agulha andando. Bom para "e foi assim que eu fiz este vídeo" ou para mostrar o bastidor.
//   children:  a cena que recua (normalmente a <Gravacao>)
//   em:        quadro em que o recuo começa;  duracao: quadros do recuo
//   clipes:    blocos da linha do tempo, em segundos de uma linha de `total` segundos
//   onda:      amostras de 0 a 1 (opcional; sem elas, uma onda de exemplo)
export const RecuoEditor: React.FC<{
  children: React.ReactNode;
  acento: string;
  em: number;
  duracao?: number;
  titulo: string;
  checklist: { texto: string; marcaEm?: number }[];
  efeitos: string[];
  ativo?: number;
  clipes: { rotulo: string; de: number; ate: number }[];
  total: number;
  onda?: number[];
}> = ({ children, acento, em, duracao = 20, titulo, checklist, efeitos, ativo = 0, clipes, total, onda }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [em, em + duracao], [0, 1], ease);
  const alvo = { x: 324, y: 215, escala: 0.4 };
  const s = 1 - (1 - alvo.escala) * p;
  const resto = (atraso: number) => interpolate(frame, [em + duracao * 0.5 + atraso, em + duracao * 0.5 + atraso + 12], [0, 1], ease);
  const trilha = { x0: ds.space[4], x1: 984, y: 1150 };
  const largura = trilha.x1 - trilha.x0;
  const agulha = interpolate(frame, [em + duracao, em + duracao + 4 * fps], [0.08, 0.62], clamp);
  const segundos = agulha * total;
  const amostras = onda ?? Array.from({ length: 120 }, (_, i) => 0.15 + 0.8 * Math.abs(Math.sin(i * 0.7) * random(`onda-${i}`)));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: p }}>
        <FundoNoite semente="editor" />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 168, width: 1080, textAlign: "center", ...tipo.chapter, fontSize: 22, color: ds.inkMuted, opacity: resto(0) }}>
        {"●  ●  ●   "}
        {titulo}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformOrigin: "0px 0px",
          transform: `translate(${(alvo.x * p).toFixed(2)}px, ${(alvo.y * p).toFixed(2)}px) scale(${s.toFixed(4)})`,
          borderRadius: interpolate(p, [0, 1], [0, 46]),
          overflow: "hidden",
          outline: `${(5 * p).toFixed(1)}px solid ${comAlfa(ds.ink, 0.25 * p)}`,
        }}
      >
        {children}
      </div>
      {/* painéis laterais a partir de y 360: deixam livre a linha do contador de canto (y 290–340), abaixo da zona de cima do Instagram */}
      <div style={{ position: "absolute", left: ds.space[4], top: 360, width: 205, opacity: resto(2) }}>
        <div style={{ ...tipo.chapter, fontSize: 19, color: ds.inkMuted, marginBottom: 18 }}>checklist</div>
        {checklist.map((c, i) => {
          const feito = c.marcaEm !== undefined && frame >= c.marcaEm;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, opacity: resto(4 + i * 3) }}>
              <div style={{ width: 28, height: 28, flex: "none", borderRadius: 8, border: `2px solid ${feito ? acento : comAlfa(ds.ink, 0.35)}`, backgroundColor: feito ? acento : "transparent" }} />
              <div style={{ ...tipo.bodySm, fontSize: 23, color: feito ? ds.ink : ds.inkMuted }}>{c.texto}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 780, top: 360, width: 204, opacity: resto(3) }}>
        <div style={{ ...tipo.chapter, fontSize: 19, color: ds.inkMuted, marginBottom: 18 }}>efeitos</div>
        {efeitos.map((e, i) => (
          <div key={i} style={{ ...tipo.code, fontSize: 21, lineHeight: 1.25, marginBottom: 14, color: i === ativo ? acento : ds.inkMuted, opacity: resto(5 + i * 2) }}>
            {i === ativo ? "▸ " : "  "}
            {e}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: trilha.x0, top: trilha.y, width: largura, height: 260, opacity: resto(6) }}>
        <div style={{ position: "relative", height: 70, borderRadius: 12, backgroundColor: ds.bg100, border: `2px solid ${ds.line}`, ...cartao(acento) }}>
          {clipes.map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (c.de / total) * largura + 3,
                width: ((c.ate - c.de) / total) * largura - 6,
                top: 8,
                bottom: 8,
                borderRadius: 8,
                backgroundColor: i % 2 ? ds.bg200 : comAlfa(acento, 0.85),
                display: "flex",
                alignItems: "center",
                paddingLeft: 10,
                overflow: "hidden",
                ...tipo.chapter,
                fontSize: 17,
                color: i % 2 ? ds.ink : ds.bg000,
                whiteSpace: "nowrap",
              }}
            >
              {c.rotulo}
            </div>
          ))}
        </div>
        <svg width={largura} height={110} style={{ position: "absolute", left: 0, top: 86 }}>
          {amostras.map((a, i) => {
            const x = (i / amostras.length) * largura;
            const h = Math.max(4, a * 100);
            return <rect key={i} x={x} y={55 - h / 2} width={Math.max(2, largura / amostras.length - 2)} height={h} rx={1.5} fill={i / amostras.length < agulha ? acento : comAlfa(ds.ink, 0.35)} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: agulha * largura - 2, top: -12, width: 4, height: 222, borderRadius: 2, backgroundColor: ds.ink }} />
        <div style={{ position: "absolute", left: agulha * largura, top: 214, translate: "-50% 0px", ...tipo.chapter, fontSize: 24, color: ds.ink }}>
          {`${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(Math.floor(segundos % 60)).padStart(2, "0")}`}
        </div>
      </div>
    </AbsoluteFill>
  );
};
