import { interpolate, useCurrentFrame } from "remotion";
import { cartao, comAlfa, flutua } from "../animacoes/estilo";
import { ds, tipo } from "../animacoes/tema";
import { aparece, clamp, ease } from "./util";

// Janela de uma sessão com um agente de IA no terminal: pedidos digitados, ferramentas rodando, saídas,
// perguntas com botões e um menu de comandos que abre ao digitar "/". O conteúdo rola sozinho, como um terminal.
// Serve para "pedi para a IA", "a IA rodou", "ela perguntou antes de seguir".
// Todo texto precisa ser real (comando que existe, saída que saiu, resposta que a IA deu de verdade).
//   linhas[i].tipo   "voce" (pedido; `anexo` = arquivo junto) | "ia" (resposta) | "ferramenta" (`nome` + `texto`; roda até `fimEm`)
//                    | "saida" (resultado da ferramenta; quebre linhas com \n) | "pergunta" (`opcoes`; `escolha` fica marcada em `escolhaEm`)
//   linhas[i].em     frame em que a linha entra, contado do início da cena (na ordem)
//   digitando        o que aparece sendo digitado na caixa de baixo: { texto, de, ate?, letrasPorQuadro? }
//   menu             lista que abre acima da caixa (ex.: comandos do "/"): { itens: [{ nome, descricao }], em, ate, destaque? }
//   trabalhando      intervalos em que aparece "trabalhando…" com os segundos: [{ de, ate }]
//   abas             abas no topo da janela: { rotulos, ativa } (ativa = -1 para nenhuma)
export type LinhaAgente =
  | { tipo: "voce"; texto: string; em: number; anexo?: string }
  | { tipo: "ia"; texto: string; em: number }
  | { tipo: "ferramenta"; nome: string; texto: string; em: number; fimEm?: number }
  | { tipo: "saida"; texto: string; em: number }
  | { tipo: "pergunta"; texto: string; em: number; opcoes?: string[]; escolha?: number; escolhaEm?: number };

const LARG_CORPO = 0.52; // largura média de um caractere do texto, em relação ao tamanho da fonte
const GAP = 16;

export const JanelaAgente: React.FC<{
  titulo: string;
  linhas: LinhaAgente[];
  acento: string;
  top: number;
  altura: number;
  left?: number;
  largura?: number;
  inicio?: number;
  abas?: { rotulos: string[]; ativa: number };
  digitando?: { texto: string; de: number; ate?: number; letrasPorQuadro?: number }[];
  menu?: { itens: { nome: string; descricao: string }[]; em: number; ate: number; destaque?: number };
  trabalhando?: { de: number; ate: number }[];
  corTextoNoBotao?: string;
  fps?: number;
}> = ({ titulo, linhas, acento, top, altura, left = ds.space[4], largura = 1080 - 2 * ds.space[4], inicio = 0, abas, digitando = [], menu, trabalhando = [], corTextoNoBotao = ds.bg000, fps = 30 }) => {
  const frame = useCurrentFrame();
  const BARRA = 60;
  const ABAS = abas ? 64 : 0;
  const CAIXA = 84;
  const STATUS = 40;
  const PAD = 28;
  const corpoTop = BARRA + ABAS + 18;
  const corpoBase = altura - 24 - CAIXA - STATUS - 8;
  const corpoAltura = corpoBase - corpoTop;
  const larguraTexto = largura - 2 * PAD;

  const linhasDe = (texto: string, tamanho: number, espaco: number) => Math.max(1, Math.ceil((texto.length * tamanho * LARG_CORPO) / espaco));
  const alturaDe = (l: LinhaAgente) => {
    switch (l.tipo) {
      case "voce":
        return linhasDe(l.texto, 32, larguraTexto - 74) * 42 + 28 + (l.anexo ? 58 : 0);
      case "ia":
        return linhasDe(l.texto, 32, larguraTexto - 30) * 43;
      case "ferramenta":
        return 44;
      case "saida":
        return l.texto.split("\n").length * 36;
      case "pergunta":
        return 48 + linhasDe(l.texto, 32, larguraTexto - 110) * 42 + (l.opcoes?.length ? 68 : 0);
    }
  };
  const alturas = linhas.map(alturaDe);
  const posicoes: number[] = [];
  const rolagens: number[] = [];
  let acumulado = 0;
  linhas.forEach((_, i) => {
    posicoes.push(acumulado);
    acumulado += alturas[i] + GAP;
    rolagens.push(Math.max(0, acumulado - GAP - corpoAltura));
  });
  let ultima = -1;
  linhas.forEach((l, i) => {
    if (frame >= l.em) ultima = i;
  });
  const rolagem =
    ultima < 0 ? 0 : (ultima > 0 ? rolagens[ultima - 1] : 0) + (rolagens[ultima] - (ultima > 0 ? rolagens[ultima - 1] : 0)) * interpolate(frame, [linhas[ultima].em, linhas[ultima].em + 10], [0, 1], ease);

  const segmento = [...digitando].reverse().find((d) => frame >= d.de && (d.ate === undefined || frame < d.ate));
  const digitadoTodo = segmento ? segmento.texto.slice(0, Math.max(0, Math.floor((frame - segmento.de) * (segmento.letrasPorQuadro ?? 1.6)))) : "";
  // na caixa aparece o fim do que está sendo digitado, como num terminal
  const cabe = Math.floor((largura - 2 * PAD - 100) / (30 * LARG_CORPO));
  const digitado = digitadoTodo.length > cabe ? `…${digitadoTodo.slice(-(cabe - 1))}` : digitadoTodo;
  const cursor = Math.floor(frame / 8) % 2 === 0;
  const ocupado = trabalhando.find((t) => frame >= t.de && frame < t.ate);
  const menuAberto = menu && frame >= menu.em && frame < menu.ate;

  const linha = (l: LinhaAgente, i: number) => {
    if (frame < l.em - 1) return null;
    const base: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: posicoes[i], ...aparece(frame, l.em, 10, 12) };
    if (l.tipo === "voce")
      return (
        <div key={i} style={base}>
          <div style={{ display: "flex", gap: 16, padding: "14px 20px", borderRadius: ds.radius.md - 4, backgroundColor: ds.bg200, ...tipo.bodyLg, fontSize: 32, lineHeight: 1.3, color: ds.ink }}>
            <span style={{ ...tipo.code, fontSize: 32, color: acento }}>›</span>
            <span>{l.texto}</span>
          </div>
          {l.anexo ? (
            <div style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: ds.radius.sm, border: `1px solid ${ds.line}`, ...tipo.code, fontSize: 22, color: ds.inkMuted }}>{l.anexo}</div>
          ) : null}
        </div>
      );
    if (l.tipo === "ia")
      return (
        <div key={i} style={{ ...base, display: "flex", gap: 14, ...tipo.bodyLg, fontSize: 32, lineHeight: 1.35, color: ds.ink }}>
          <span style={{ flex: "none", width: 12, height: 12, marginTop: 16, borderRadius: 6, backgroundColor: ds.ink }} />
          <span>{l.texto}</span>
        </div>
      );
    if (l.tipo === "ferramenta") {
      const rodando = frame < (l.fimEm ?? l.em + 20);
      return (
        <div key={i} style={{ ...base, display: "flex", alignItems: "center", gap: 14, height: 44, whiteSpace: "nowrap", overflow: "hidden" }}>
          <span style={{ flex: "none", width: 14, height: 14, borderRadius: 7, backgroundColor: rodando ? acento : ds.inkMuted, opacity: rodando ? 0.55 + 0.45 * Math.abs(Math.sin(frame / 6)) : 1 }} />
          <span style={{ ...tipo.code, fontSize: 25, fontWeight: 700, color: ds.ink }}>{l.nome}</span>
          <span style={{ ...tipo.code, fontSize: 25, color: ds.inkMuted, overflow: "hidden", textOverflow: "ellipsis" }}>{l.texto}</span>
        </div>
      );
    }
    if (l.tipo === "saida")
      return (
        <div key={i} style={{ ...base, display: "flex", gap: 14, paddingLeft: 8 }}>
          <span style={{ ...tipo.code, fontSize: 24, lineHeight: 1.5, color: ds.inkMuted }}>⎿</span>
          <span style={{ ...tipo.code, fontSize: 24, lineHeight: 1.5, color: ds.inkMuted, whiteSpace: "pre" }}>{l.texto}</span>
        </div>
      );
    const escolhida = l.escolhaEm !== undefined && frame >= l.escolhaEm ? l.escolha : undefined;
    return (
      <div key={i} style={{ ...base, padding: "22px 24px", borderRadius: ds.radius.md - 4, border: `2px solid ${comAlfa(acento, 0.8)}`, backgroundColor: comAlfa(acento, 0.08) }}>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <span style={{ flex: "none", width: 40, height: 40, borderRadius: 20, border: `3px solid ${acento}`, display: "flex", alignItems: "center", justifyContent: "center", ...tipo.code, fontSize: 24, fontWeight: 700, color: acento }}>?</span>
          <span style={{ ...tipo.bodyLg, fontSize: 32, lineHeight: 1.3, fontWeight: 600, color: ds.ink }}>{l.texto}</span>
        </div>
        {l.opcoes?.length ? (
          <div style={{ display: "flex", gap: 14, marginTop: 16, marginLeft: 58 }}>
            {l.opcoes.map((o, j) => {
              const marcada = escolhida === j;
              return (
                <span
                  key={o}
                  style={{
                    padding: "8px 22px",
                    borderRadius: ds.radius.pill,
                    border: `2px solid ${marcada ? acento : ds.line}`,
                    backgroundColor: marcada ? acento : "transparent",
                    ...tipo.code,
                    fontSize: 24,
                    color: marcada ? corTextoNoBotao : ds.inkMuted,
                  }}
                >
                  {o}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: largura,
        height: altura,
        borderRadius: ds.radius.lg - 12,
        backgroundColor: ds.bg100,
        border: `2px solid ${ds.line}`,
        overflow: "hidden",
        ...aparece(frame, inicio, 14, 40),
        ...cartao(acento),
        ...flutua(frame, `janela-${titulo}`, fps),
      }}
    >
      <div style={{ height: BARRA, display: "flex", alignItems: "center", gap: 10, padding: "0 24px", backgroundColor: ds.bg200 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: ds.inkMuted, opacity: 0.5 }} />
        ))}
        <span style={{ flex: 1, textAlign: "center", marginRight: 66, ...tipo.code, fontSize: 22, color: ds.inkMuted }}>{titulo}</span>
      </div>
      {abas ? (
        <div style={{ height: ABAS, display: "flex", gap: 10, alignItems: "center", padding: "0 20px", borderBottom: `1px solid ${ds.line}` }}>
          {abas.rotulos.map((r, i) => (
            <span
              key={r}
              style={{
                padding: "8px 18px",
                borderRadius: ds.radius.sm,
                backgroundColor: i === abas.ativa ? comAlfa(acento, 0.16) : "transparent",
                border: `1px solid ${i === abas.ativa ? comAlfa(acento, 0.7) : "transparent"}`,
                ...tipo.code,
                fontSize: 22,
                color: i === abas.ativa ? ds.ink : ds.inkMuted,
              }}
            >
              {r}
            </span>
          ))}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: PAD, right: PAD, top: corpoTop, height: corpoAltura, overflow: "hidden", maskImage: "linear-gradient(to bottom, transparent 0, black 36px)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -rolagem }}>{linhas.map(linha)}</div>
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 24 + CAIXA + 6, height: STATUS, display: "flex", alignItems: "center", gap: 12, opacity: ocupado ? 1 : 0, ...tipo.code, fontSize: 22, color: ds.inkMuted }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: acento, opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 5)) }} />
        trabalhando{".".repeat(1 + (Math.floor(frame / 8) % 3))} {ocupado ? Math.floor((frame - ocupado.de) / fps) : 0} s
      </div>
      {menuAberto && menu ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            right: PAD,
            bottom: 24 + CAIXA + 10,
            padding: 12,
            borderRadius: ds.radius.md - 4,
            backgroundColor: ds.bg200,
            border: `1px solid ${ds.line}`,
            opacity: interpolate(frame, [menu.em, menu.em + 6, menu.ate - 4, menu.ate], [0, 1, 1, 0], clamp),
          }}
        >
          {menu.itens.map((it, i) => (
            <div
              key={it.nome}
              style={{
                display: "flex",
                gap: 18,
                alignItems: "baseline",
                height: 42,
                padding: "0 12px",
                borderRadius: ds.radius.sm,
                backgroundColor: menu.destaque === i ? comAlfa(acento, 0.18) : "transparent",
                opacity: interpolate(frame, [menu.em + i * 2, menu.em + i * 2 + 6], [0, 1], clamp),
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ ...tipo.code, fontSize: 24, color: menu.destaque === i ? acento : ds.ink, lineHeight: "42px" }}>{it.nome}</span>
              <span style={{ ...tipo.bodySm, fontSize: 21, color: ds.inkMuted, overflow: "hidden", textOverflow: "ellipsis" }}>{it.descricao}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: PAD - 8,
          right: PAD - 8,
          bottom: 24,
          height: CAIXA,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 22px",
          borderRadius: ds.radius.md - 4,
          border: `2px solid ${segmento ? comAlfa(acento, 0.6) : ds.line}`,
          backgroundColor: ds.bg000,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ ...tipo.code, fontSize: 30, color: acento }}>›</span>
        <span style={{ ...tipo.bodyLg, fontSize: 30, color: ds.ink, overflow: "hidden" }}>{digitado}</span>
        <span style={{ width: 3, height: 34, backgroundColor: acento, opacity: cursor ? 1 : 0, marginLeft: -8 }} />
      </div>
    </div>
  );
};
