import { interpolate, useCurrentFrame } from "remotion";
import { cartao, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { aparece, ease } from "./util";

// Forma de onda de uma gravação perdendo os cortes: os trechos que saem ficam apagados, encolhem e somem,
// e os que ficam se juntam até ocupar a largura toda, com a duração contando de "antes" para "depois".
// Use com dados de verdade: `amostras` = intensidade do som (0 a 1) a cada `passo` segundos, tirada da gravação,
// e `fica` = os trechos que ficaram depois do corte (o `resultado.fica` do .cortes.json).
//   duracao   duração real da gravação em segundos (sem ela, conta pelas amostras)
//   rotulos   frases curtas embaixo dos cortes maiores, em duas linhas alternadas: [{ em: segundo, texto }]
//   juntaEm   frame em que os cortes começam a sumir (contado do início da cena); juntaPor = quantos quadros leva
export const OndaDeCorte: React.FC<{
  amostras: number[];
  passo: number;
  duracao?: number;
  fica: { de: number; ate: number }[];
  acento: string;
  top: number;
  altura: number;
  left?: number;
  largura?: number;
  inicio?: number;
  juntaEm: number;
  juntaPor?: number;
  rotulos?: { em: number; texto: string }[];
}> = ({ amostras, passo, duracao: duracaoReal, fica, acento, top, altura, left = ds.space[4], largura = 1080 - 2 * ds.space[4], inicio = 0, juntaEm, juntaPor = 30, rotulos = [] }) => {
  const frame = useCurrentFrame();
  const total = amostras.length * passo;
  const totalReal = duracaoReal ?? total;
  const mantido = fica.reduce((s, f) => s + (f.ate - f.de), 0);
  const p = interpolate(frame, [juntaEm, juntaEm + juntaPor], [0, 1], ease);
  const PAD = 24;
  const W = largura - 2 * PAD;
  const ROTULOS = rotulos.length ? 62 : 0; // duas linhas de rótulos embaixo da onda
  const ALTO = altura - 2 * PAD - 70 - ROTULOS; // espaço da onda (o resto é para a duração e os rótulos)
  const meio = PAD + 70 + ALTO / 2;
  // posição final de um instante: os trechos que ficam, colados um no outro, esticados na largura toda
  const xFinal = (s: number) => {
    let antes = 0;
    for (const f of fica) {
      if (s < f.de) return (antes / mantido) * W;
      if (s <= f.ate) return ((antes + s - f.de) / mantido) * W;
      antes += f.ate - f.de;
    }
    return W;
  };
  const ficaNo = (s: number) => fica.some((f) => s >= f.de && s <= f.ate);
  let caminhoFica = "";
  let caminhoSai = "";
  const largInicial = W / amostras.length;
  amostras.forEach((a, i) => {
    const s = i * passo;
    const fica_ = ficaNo(s);
    const x = (s / total) * W * (1 - p) + xFinal(s) * p;
    const larg = fica_ ? largInicial * (1 - p) + (passo / mantido) * W * p : largInicial * (1 - p);
    if (larg < 0.05) return;
    const h = Math.max(2, a * ALTO);
    const ret = `M${(PAD + x).toFixed(1)} ${(meio - h / 2).toFixed(1)}h${Math.max(0.6, larg * 0.7).toFixed(2)}v${h.toFixed(1)}h-${Math.max(0.6, larg * 0.7).toFixed(2)}z`;
    if (fica_) caminhoFica += ret;
    else caminhoSai += ret;
  });
  const duracao = totalReal * (1 - p) + mantido * p;
  const fmt = (v: number) => `${v.toFixed(1).replace(".", ",")} s`;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: largura,
        height: altura,
        borderRadius: ds.radius.md,
        backgroundColor: ds.bg100,
        border: `2px solid ${ds.line}`,
        overflow: "hidden",
        ...aparece(frame, inicio, 12, 20),
        ...cartao(acento),
        ...flutua(frame, "onda-de-corte"),
      }}
    >
      <div style={{ position: "absolute", left: PAD, top: PAD - 4, display: "flex", alignItems: "baseline", gap: 18 }}>
        <span style={{ ...tipo.statXl, fontSize: 52, color: p > 0.98 ? acento : ds.ink, fontVariantNumeric: "tabular-nums" }}>{fmt(duracao)}</span>
        <span style={{ ...tipo.chapter, fontSize: 22, color: ds.inkMuted }}>{p > 0.98 ? `${fmt(totalReal)} antes` : "gravação"}</span>
      </div>
      <svg width={largura} height={altura} style={{ position: "absolute", inset: 0 }}>
        <path d={caminhoSai} fill={ds.inkMuted} opacity={0.35 * (1 - p)} />
        <path d={caminhoFica} fill={acento} />
      </svg>
      {rotulos.map((r, i) => {
        const entra = inicio + 4 + i * 3;
        const sai = Math.max(entra + 7, juntaEm);
        return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: PAD + (r.em / total) * W,
            top: altura - PAD - (i % 2 === 0 ? 56 : 26),
            translate: (r.em / total) * W < 160 ? "0px 0px" : (r.em / total) * W > W - 160 ? "-100% 0px" : "-50% 0px",
            ...tipo.chapter,
            fontSize: 19,
            color: ds.inkMuted,
            whiteSpace: "nowrap",
            opacity: interpolate(frame, [entra, entra + 6, sai, sai + 10], [0, 1, 1, 0], ease),
          }}
        >
          {r.texto}
        </div>
        );
      })}
    </div>
  );
};
