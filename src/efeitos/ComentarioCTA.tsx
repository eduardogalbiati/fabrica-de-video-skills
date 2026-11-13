import { interpolate, spring } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { cartao, comAlfa } from "../animacoes/estilo";
import { ds, fonteDisplay, marca, tipo } from "../animacoes/tema";
import { clamp, ease } from "../pecas/util";
import { presenca } from "./Gravacao";

// Comentário com chamada: a caixa de comentário aparece, a palavra-chave é digitada e enviada, ganha um
// coração e a resposta chega com o botão do link. É o fecho "comenta X que eu te mando".
// Só o visual: mandar a mensagem de verdade é com quem publica.
//   top:  topo da caixa (padrão: logo abaixo da faixa da legenda)
//   em:   quadro em que a caixa aparece; a digitação, o envio e a resposta vêm em seguida
export const ComentarioCTA: React.FC<{
  palavra: string;
  acento: string;
  corTexto: string;
  em: number;
  top?: number;
  placeholder?: string;
  resposta?: string;
  botao?: string;
  voce?: string;
}> = ({ palavra, acento, corTexto, em, top = 1150, placeholder = "Adicione um comentário…", resposta = "Te mandei o link", botao = "Abrir link", voce = "você" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const digita = { de: em + 10, ate: em + 10 + palavra.length * 3 };
  const enviaEm = digita.ate + 8;
  const respostaEm = enviaEm + 18;
  const n = Math.round(interpolate(frame, [digita.de, digita.ate], [0, palavra.length], clamp));
  const enviado = frame >= enviaEm;
  const caixa = presenca(frame, em, undefined, 10);
  const coracao = spring({ frame: frame - enviaEm - 6, fps, config: { damping: 12, stiffness: 200 } });
  const chega = interpolate(frame, [respostaEm, respostaEm + 12], [0, 1], ease);
  const iniciais = marca.pessoa.nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const largura = 930 - ds.space[4];
  return (
    <div style={{ position: "absolute", left: ds.space[4], top, width: largura }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 20,
          height: 104,
          padding: "0 18px",
          boxSizing: "border-box",
          borderRadius: ds.radius.pill,
          backgroundColor: comAlfa(ds.bg100, 0.94),
          border: `2px solid ${enviado ? comAlfa(acento, 0.8) : ds.line}`,
          opacity: caixa,
          translate: `0px ${interpolate(caixa, [0, 1], [24, 0])}px`,
          width: enviado ? interpolate(frame, [enviaEm, enviaEm + 10], [largura, largura * 0.7], ease) : largura,
          ...cartao(acento),
        }}
      >
        <div style={{ width: 68, height: 68, flex: "none", borderRadius: 34, backgroundColor: ds.bg200, display: "flex", alignItems: "center", justifyContent: "center", ...tipo.chapter, fontSize: 20, color: ds.inkMuted }}>
          {enviado ? voce : ""}
        </div>
        <div style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden" }}>
          {n === 0 ? (
            <span style={{ ...tipo.bodyLg, fontSize: 32, color: ds.inkMuted }}>{placeholder}</span>
          ) : (
            <span style={{ fontFamily: fonteDisplay, fontWeight: 800, fontSize: 52, letterSpacing: "0.02em", color: ds.ink }}>{palavra.slice(0, n)}</span>
          )}
        </div>
        {!enviado ? (
          <div style={{ width: 68, height: 68, flex: "none", borderRadius: 34, backgroundColor: n >= palavra.length ? acento : ds.bg200, display: "flex", alignItems: "center", justifyContent: "center", ...tipo.chapter, fontSize: 30, color: n >= palavra.length ? corTexto : ds.inkMuted }}>
            ↑
          </div>
        ) : null}
        {enviado ? (
          <div style={{ position: "absolute", right: -14, top: -18, width: 46, height: 46, borderRadius: 23, backgroundColor: ds.ink, display: "flex", alignItems: "center", justifyContent: "center", scale: Math.max(0, coracao) }}>
            <svg width={26} height={24} viewBox="0 0 24 22">
              <path d="M12 21 C 5 15, 1 11, 1 6.5 C 1 3.4 3.4 1 6.4 1 C 8.6 1 10.6 2.2 12 4 C 13.4 2.2 15.4 1 17.6 1 C 20.6 1 23 3.4 23 6.5 C 23 11 19 15 12 21 Z" fill={acento} />
            </svg>
          </div>
        ) : null}
      </div>
      <div style={{ position: "relative", marginLeft: 90, marginTop: 26, opacity: chega, translate: `0px ${interpolate(chega, [0, 1], [20, 0])}px` }}>
        <div style={{ position: "absolute", left: -56, top: -26, width: 40, height: 62, borderLeft: `3px solid ${comAlfa(ds.ink, 0.25)}`, borderBottom: `3px solid ${comAlfa(ds.ink, 0.25)}`, borderBottomLeftRadius: 20 }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "18px 26px 18px 18px", borderRadius: ds.radius.md, backgroundColor: comAlfa(ds.bg100, 0.94), border: `2px solid ${ds.line}`, ...cartao(acento) }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: acento, display: "flex", alignItems: "center", justifyContent: "center", ...tipo.chapter, fontSize: 22, color: corTexto }}>{iniciais}</div>
          <div>
            <div style={{ ...tipo.bodyLg, fontSize: 30, color: ds.ink }}>{resposta}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 10, padding: "8px 22px", borderRadius: ds.radius.pill, backgroundColor: acento, ...tipo.chapter, fontSize: 24, color: corTexto }}>
              ↗ {botao}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
