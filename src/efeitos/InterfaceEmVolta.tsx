import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { cartao, comAlfa, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { clamp, ease } from "../pecas/util";
import { balanco, presenca } from "./Gravacao";

// Interface em volta: painéis de app flutuando em volta da pessoa, como se o trabalho acontecesse no ar.
// Bom para "pedi para a IA e ela fez": o pedido sendo digitado, o progresso, a linha do tempo, a prévia.
// Cada painel tem posição (x, y = canto de cima à esquerda), largura, quadro de entrada e, se quiser, de saída.
// O painel "texto" também serve de cartão de nome em volta da pessoa: `rotulo` (pequeno, em cima), `tamanho` e `forte`.
type Base = { x: number; y: number; largura: number; em: number; saiEm?: number };
export type Painel =
  | (Base & { tipo: "pedido"; rotulo?: string; texto: string; digita: { de: number; ate: number } })
  | (Base & { tipo: "progresso"; rotulo: string; de: number; ate: number; ateValor?: number })
  | (Base & { tipo: "linhaDoTempo"; rotulo?: string; quadros: number; imagens?: string[]; agulha?: { de: number; ate: number } })
  | (Base & { tipo: "previa"; rotulo?: string; texto: string; imagem?: string; aoVivo?: string })
  | (Base & { tipo: "texto"; texto: string; rotulo?: string; tamanho?: number; forte?: boolean });

const Rotulo: React.FC<{ texto: string; cor?: string }> = ({ texto, cor = ds.inkMuted }) => (
  <div style={{ ...tipo.chapter, fontSize: 20, color: cor, marginBottom: 12 }}>{texto}</div>
);

const Conteudo: React.FC<{ p: Painel; acento: string; frame: number }> = ({ p, acento, frame }) => {
  if (p.tipo === "pedido") {
    const n = Math.round(interpolate(frame, [p.digita.de, p.digita.ate], [0, p.texto.length], clamp));
    const cursor = Math.floor(frame / 12) % 2 === 0 && frame < p.digita.ate + 30;
    return (
      <>
        <Rotulo texto={p.rotulo ?? "pedido"} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, ...tipo.titleMd, fontSize: 34, color: ds.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
            {p.texto.slice(0, n)}
            <span style={{ opacity: cursor ? 1 : 0, color: acento }}>|</span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: n >= p.texto.length ? acento : ds.bg200, flex: "none" }} />
        </div>
      </>
    );
  }
  if (p.tipo === "progresso") {
    const fim = p.ateValor ?? 100;
    const v = interpolate(frame, [p.de, p.ate], [0, fim], ease);
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ ...tipo.bodySm, fontSize: 26, color: ds.ink }}>{p.rotulo}</div>
          <div style={{ ...tipo.chapter, fontSize: 30, color: acento }}>{`${Math.round(v)}%`}</div>
        </div>
        <div style={{ marginTop: 14, height: 10, borderRadius: 5, backgroundColor: ds.bg200, overflow: "hidden" }}>
          <div style={{ width: `${v}%`, height: "100%", borderRadius: 5, backgroundColor: acento }} />
        </div>
      </>
    );
  }
  if (p.tipo === "linhaDoTempo") {
    const largura = (p.largura - 44 - (p.quadros - 1) * 8) / p.quadros;
    const agulha = p.agulha ? interpolate(frame, [p.agulha.de, p.agulha.ate], [0, 1], clamp) : 0;
    return (
      <>
        <Rotulo texto={p.rotulo ?? "linha do tempo"} />
        <div style={{ position: "relative", display: "flex", gap: 8 }}>
          {Array.from({ length: p.quadros }, (_, i) => (
            <div key={i} style={{ width: largura, height: largura * 1.35, borderRadius: 6, overflow: "hidden", backgroundColor: i % 3 === 1 ? comAlfa(acento, 0.35) : ds.bg200, border: `1px solid ${ds.line}` }}>
              {p.imagens?.[i % p.imagens.length] ? <Img src={staticFile(p.imagens[i % p.imagens.length])} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            </div>
          ))}
          {p.agulha ? <div style={{ position: "absolute", left: `${agulha * 100}%`, top: -10, bottom: -10, width: 4, borderRadius: 2, backgroundColor: acento }} /> : null}
        </div>
      </>
    );
  }
  if (p.tipo === "previa") {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ ...tipo.chapter, fontSize: 20, color: ds.inkMuted }}>{p.rotulo ?? "prévia"}</div>
          {p.aoVivo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, ...tipo.chapter, fontSize: 18, color: acento }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: acento, opacity: Math.floor(frame / 15) % 2 ? 0.3 : 1 }} />
              {p.aoVivo}
            </div>
          ) : null}
        </div>
        <div style={{ position: "relative", height: (p.largura - 44) * 1.5, borderRadius: 12, overflow: "hidden", backgroundColor: ds.bg200 }}>
          {p.imagem ? <Img src={staticFile(p.imagem)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 18, ...tipo.hookLg, fontSize: 38, color: ds.ink, textAlign: "center" }}>{p.texto}</div>
        </div>
      </>
    );
  }
  // texto: só a frase (padrão) ou, com `rotulo`, `tamanho` e `forte`, um cartão de nome (rótulo pequeno + palavra grande)
  return (
    <>
      {p.rotulo ? <Rotulo texto={p.rotulo} /> : null}
      <div style={{ ...(p.forte ? { ...tipo.hookLg, lineHeight: 1.04 } : tipo.bodySm), fontSize: p.tamanho ?? 28, color: ds.ink }}>{p.texto}</div>
    </>
  );
};

export const InterfaceEmVolta: React.FC<{ paineis: Painel[]; acento: string }> = ({ paineis, acento }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {paineis.map((p, i) => {
        const v = presenca(frame, p.em, p.saiEm, 12);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.largura,
              padding: 22,
              boxSizing: "border-box",
              borderRadius: ds.radius.md,
              backgroundColor: ds.bg100,
              border: `2px solid ${ds.line}`,
              opacity: v,
              translate: `0px ${(interpolate(v, [0, 1], [26, 0]) + balanco(frame, i * 1.3, 5)).toFixed(2)}px`,
              scale: interpolate(v, [0, 1], [0.94, 1]),
              ...cartao(acento),
              ...flutua(frame, `painel-${i}`),
            }}
          >
            <Conteudo p={p} acento={acento} frame={frame} />
          </div>
        );
      })}
    </>
  );
};
