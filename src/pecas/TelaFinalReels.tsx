import { AbsoluteFill } from "remotion";
import { useCurrentFrame } from "../relogio";
import { Assinatura, FundoNoite } from "../animacoes/Base";
import { ds, tipo } from "../animacoes/tema";
import { aparece, Destaque, Halo } from "./util";

// Tela final de série (tela cheia, 1080×1920): título + dois espaços 9:16 vazios para colar reels no aplicativo de edição.
// Padrão de uso em séries: um espaço aponta para o próximo capítulo (o último volta ao primeiro) e o outro para o reels que deu origem à série.
// Entra no lugar do `Encerramento` de 2 s, logo depois da fala, por 4 s.
// Uso: <TelaFinalReels acento soft serie="Série <nome>" secao={pilares[pilar].nome} titulo="Assista *também*" espacos={[{rotulo, titulo}, {rotulo, titulo}]} marcacao />
const M = ds.space[4];

// Tela final em tela cheia: dois espaços 9:16 vazios para colar os reels no aplicativo de edição.
// Ficam dentro da área livre: abaixo de 160, acima de 1600, entre 96 e 930 (coluna de botões).
const ESPACO = { largura: 400, altura: 711, top: 560, vao: 34 };

export const TelaFinalReels: React.FC<{
  acento: string;
  soft: string;
  serie: string;
  secao: string;
  titulo: string;
  espacos: { rotulo: string; titulo: string }[];
  marcacao: boolean;
}> = ({ acento, soft, serie, secao, titulo, espacos, marcacao }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FundoNoite semente={`fim-${serie}`} />
      <Halo x={400} y={330} w={620} h={220} cor={acento} intensidade={0.22} />
      <div style={{ position: "absolute", left: M, top: 200, ...tipo.eyebrow, fontSize: 26, color: soft, ...aparece(frame, 0, 10) }}>{serie}</div>
      <div style={{ position: "absolute", left: M, right: M, top: 250, ...tipo.hookLg, fontSize: 84, color: ds.ink, ...aparece(frame, 2, 10) }}>
        <Destaque texto={titulo} acento={acento} />
      </div>
      {espacos.slice(0, 2).map((e, i) => {
        const x = M + i * (ESPACO.largura + ESPACO.vao);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: ESPACO.top - 112, width: ESPACO.largura, ...aparece(frame, 6 + i * 4, 10) }}>
            <div style={{ ...tipo.chapter, fontSize: 24, color: ds.inkMuted }}>{e.rotulo}</div>
            <div style={{ ...tipo.titleMd, fontSize: 38, color: ds.ink, marginTop: 8, height: 46, whiteSpace: "nowrap" }}>{e.titulo}</div>
            <div
              style={{
                marginTop: 20,
                width: ESPACO.largura,
                height: ESPACO.altura,
                boxSizing: "border-box",
                borderRadius: ds.radius.md,
                backgroundColor: ds.bg100,
                border: `2px dashed ${ds.inkMuted}66`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 24,
              }}
            >
              {marcacao ? (
                <>
                  <svg width={84} height={84} viewBox="0 0 84 84">
                    <circle cx={42} cy={42} r={40} fill="none" stroke={ds.inkMuted} strokeWidth={2} opacity={0.6} />
                    <path d="M34 26 L60 42 L34 58 Z" fill={ds.inkMuted} opacity={0.6} />
                  </svg>
                  <div style={{ ...tipo.chapter, fontSize: 22, color: ds.inkMuted, textAlign: "center", lineHeight: 1.5 }}>
                    espaço do reels
                    <br />
                    400 × 711
                  </div>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
      <Assinatura secao={secao} bottom={ds.zonaInferior + 60} />
    </AbsoluteFill>
  );
};
