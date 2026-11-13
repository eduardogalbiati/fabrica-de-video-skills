import { AbsoluteFill, interpolate } from "remotion";
import { useCurrentFrame } from "../relogio";
import { FundoNoite } from "../animacoes/Base";
import { cartao, comAlfa } from "../animacoes/estilo";
import { ds, marca, tipo } from "../animacoes/tema";
import { ease } from "../pecas/util";

// Saindo do quadro: o vídeo encolhe e vira um post (cabeçalho, imagem, ícones), mas a cabeça da pessoa
// fica para fora da moldura, por cima do cabeçalho. Bom para "isso aqui não cabe num post".
// PRECISA DO RECORTE: `pessoa` = <PessoaRecortada> da mesma gravação, com o mesmo `inicio`.
//   em, duracao: quando o vídeo encolhe;  nome e legenda: o que aparece no post (padrão: o site da marca)
export const SaindoDoQuadro: React.FC<{
  gravacao: React.ReactNode;
  pessoa: React.ReactNode;
  acento: string;
  em: number;
  duracao?: number;
  nome?: string;
  legenda?: string;
}> = ({ gravacao, pessoa, acento, em, duracao = 18, nome = marca.site, legenda = "" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [em, em + duracao], [0, 1], ease);
  const chrome = interpolate(frame, [em + duracao * 0.6, em + duracao + 8], [0, 1], ease);
  // o vídeo vai para escala 0,72, com a imagem do post entre y 900 e 1430
  const alvo = { s: 0.72, x: 151, y: 230 };
  const s = 1 - (1 - alvo.s) * p;
  const tx = alvo.x * p;
  const ty = alvo.y * p;
  const transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`;
  const post = { x0: alvo.x, x1: alvo.x + 1080 * alvo.s, topo: 800, img0: 900, img1: 1430, fim: 1510 };
  // recorte da imagem do post, que fecha aos poucos durante o encolhimento. O clip-path vale nas medidas da
  // camada ANTES da escala: a janela na tela (L, T, R, B) é convertida para elas.
  const L = post.x0 * p;
  const T = post.img0 * p;
  const R = 1080 - (1080 - post.x1) * p;
  const B = 1920 - (1920 - post.img1) * p;
  const local = { l: (L - tx) / s, t: (T - ty) / s, r: (R - tx) / s, b: (B - ty) / s };
  const corteImagem = `inset(${local.t.toFixed(1)}px ${(1080 - local.r).toFixed(1)}px ${(1920 - local.b).toFixed(1)}px ${local.l.toFixed(1)}px round ${((18 * p) / s).toFixed(1)}px)`;
  // a pessoa: presa nas laterais e embaixo da imagem, livre em cima (é assim que a cabeça sai do quadro)
  const cortePessoa = `inset(0px ${(1080 - local.r).toFixed(1)}px ${(1920 - local.b).toFixed(1)}px ${local.l.toFixed(1)}px)`;
  const camada: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0px 0px", transform };
  const icone = (d: string) => (
    <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={ds.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: p }}>
        <FundoNoite semente="quadro" />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: post.x0 - 4,
          top: post.topo,
          width: post.x1 - post.x0 + 8,
          height: post.fim - post.topo,
          borderRadius: ds.radius.md,
          backgroundColor: ds.bg100,
          border: `2px solid ${ds.line}`,
          opacity: chrome,
          ...cartao(acento),
        }}
      />
      <div style={{ ...camada, clipPath: corteImagem }}>{gravacao}</div>
      <div style={{ position: "absolute", left: post.x0 + 20, top: post.topo + 22, display: "flex", alignItems: "center", gap: 16, opacity: chrome }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: acento }} />
        <div style={{ ...tipo.bodySm, fontSize: 28, fontWeight: 600, color: ds.ink }}>{nome}</div>
        <div style={{ padding: "4px 16px", borderRadius: 10, border: `2px solid ${comAlfa(ds.ink, 0.3)}`, ...tipo.bodySm, fontSize: 22, color: ds.ink }}>Seguir</div>
      </div>
      <div style={{ position: "absolute", left: post.x0 + 20, top: post.img1 + 18, right: 1080 - post.x1 + 20, display: "flex", alignItems: "center", gap: 26, opacity: chrome }}>
        {icone("M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z")}
        {icone("M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z")}
        {icone("M22 3 11 14M22 3l-7 19-4-8-8-4 19-7z")}
        {legenda ? <div style={{ flex: 1, textAlign: "right", ...tipo.bodySm, fontSize: 24, color: ds.inkMuted, whiteSpace: "nowrap", overflow: "hidden" }}>{legenda}</div> : null}
      </div>
      <div style={{ ...camada, clipPath: cortePessoa }}>{pessoa}</div>
    </AbsoluteFill>
  );
};
