import { interpolate, useCurrentFrame } from "remotion";
import { ds, tipo } from "../animacoes/tema";
import { aparece, Destaque, ease } from "./util";

// modo "riscar": "Melhorada por" / "uma pessoa" (riscado) → "outra IA" sobe no lugar.
// modo "somar": o primeiro termo fica (esmaece) e o substituto aparece embaixo ("não só… mas também…").
// No substituto, *palavra* = cor do acento.
export const TextoRiscado: React.FC<{
  prefixo: string;
  riscado: string;
  substituto: string;
  acento: string;
  top: number;
  riscaEm: number;
  trocaEm: number;
  modo?: "riscar" | "somar";
  tamanho?: number;
}> = ({ prefixo, riscado, substituto, acento, top, riscaEm, trocaEm, modo = "riscar", tamanho = 110 }) => {
  const frame = useCurrentFrame();
  const risco = interpolate(frame, [riscaEm, riscaEm + 12], [0, 100], ease);
  const sai = interpolate(frame, [trocaEm, trocaEm + 10], [1, 0], ease);
  const entra = interpolate(frame, [trocaEm + 4, trocaEm + 18], [0, 1], ease);
  const grande = { ...tipo.hookXl, fontSize: tamanho, lineHeight: 1.0 };
  if (modo === "somar") {
    const esmaece = interpolate(frame, [trocaEm, trocaEm + 10], [1, 0.45], ease);
    return (
      <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top }}>
        <div style={{ ...grande, color: ds.ink, ...aparece(frame, 0) }}>{prefixo}</div>
        <div style={{ ...grande, color: ds.ink, opacity: esmaece, ...aparece(frame, riscaEm) }}>{riscado}</div>
        <div style={{ ...grande, color: ds.ink, ...aparece(frame, trocaEm, 14, 50) }}>
          <Destaque texto={substituto} acento={acento} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: ds.space[4], right: ds.space[4], top }}>
      <div style={{ ...grande, color: ds.ink, ...aparece(frame, 0) }}>{prefixo}</div>
      <div style={{ position: "relative", height: 130 }}>
        <div
          style={{
            position: "absolute",
            ...grande,
            color: ds.inkMuted,
            opacity: sai,
            translate: `0px ${interpolate(sai, [0, 1], [-60, 0])}px`,
            ...{ display: "inline-block" },
          }}
        >
          {riscado}
          <div style={{ position: "absolute", left: 0, top: "52%", height: 10, width: `${risco}%`, backgroundColor: ds.ink, borderRadius: 5 }} />
        </div>
        <div
          style={{
            position: "absolute",
            ...grande,
            color: acento,
            opacity: entra,
            translate: `0px ${interpolate(entra, [0, 1], [60, 0])}px`,
          }}
        >
          {substituto}
        </div>
      </div>
    </div>
  );
};
