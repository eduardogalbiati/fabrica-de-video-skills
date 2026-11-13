import { AbsoluteFill, interpolate } from "remotion";
import { useCurrentFrame, useVideoConfig } from "../relogio";
import { clamp } from "../pecas/util";

// ZOOMS DE EDIÇÃO: os quatro zooms "limpos" de quem edita vídeo de rosto, sem nada desenhado por cima
// (para o zoom com visor de câmera, use o ZoomCamera). Cada um envolve a cena, normalmente a <Gravacao>.
// As medidas (quanto aproxima e em quanto tempo) foram tiradas de um vídeo de referência sobre os 4 tipos de zoom:
//   ZoomIn     aproxima devagar durante a frase (1,00 → 1,14 em uns 4 s, em linha reta).
//              Para criar expectativa e levar a atenção a algo importante. É o de uso mais frequente.
//   PunchZoom  salto seco na palavra forte (1,13; um segundo salto, na palavra seguinte, empilha em 1,21).
//              Para dar impacto a uma fala ou a uma palavra.
//   ZoomOut    começa fechado no rosto (1,28) e abre devagar até 1,00, em uns 5 s.
//              Para revelar mais da cena e dar movimento sem trocar de tomada.
//   CrashZoom  salto bruto (1,40 em 2 quadros), que segura um instante.
//              Para quebra de padrão. Raro: uma ou duas vezes por vídeo, senão perde o impacto.
// Em todos:
//   foco   o ponto que fica parado, de 0 a 1. Use a LINHA DOS OLHOS (x do rosto, y dos olhos): assim o olhar
//          não sobe nem desce quando a imagem aproxima.
//   volta  sempre em corte seco, na frase seguinte: termine a cena (<Sequence>) ali, ou passe `ate`.
// Os quadros das props são contados do início da cena, como nos outros efeitos.
// Regra de uso: zoom não é o tempo todo. Deixe frases sem zoom entre um e outro.
export type FocoZoom = { x: number; y: number };
const OLHOS: FocoZoom = { x: 0.5, y: 0.4 };

const Aproximado: React.FC<{ escala: number; foco: FocoZoom; borrao?: number; children: React.ReactNode }> = ({ escala, foco, borrao = 0, children }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <AbsoluteFill style={{ scale: escala, transformOrigin: `${foco.x * 100}% ${foco.y * 100}%`, filter: borrao > 0.05 ? `blur(${borrao.toFixed(2)}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

// Zoom-in: de `de` até `ate` (padrão: a cena inteira), a imagem vai de 1 até `escala`, em linha reta.
// Ritmo de referência: 3 a 4% por segundo. Frase de 4 s → 1,14; de 6 s → 1,20. Não passe de 1,25.
export const ZoomIn: React.FC<{ children: React.ReactNode; de?: number; ate?: number; escala?: number; foco?: FocoZoom }> = ({ children, de = 0, ate, escala = 1.14, foco = OLHOS }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fim = Math.max(de + 1, ate ?? durationInFrames);
  return (
    <Aproximado escala={interpolate(frame, [de, fim], [1, escala], clamp)} foco={foco}>
      {children}
    </Aproximado>
  );
};

// Zoom-out: a cena já abre fechada em `escala` e vai abrindo até 1, de `de` até `ate` (padrão: a cena inteira).
// Ritmo de referência: 5% por segundo. Frase de 5 s → começa em 1,28.
export const ZoomOut: React.FC<{ children: React.ReactNode; de?: number; ate?: number; escala?: number; foco?: FocoZoom }> = ({ children, de = 0, ate, escala = 1.28, foco = OLHOS }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fim = Math.max(de + 1, ate ?? durationInFrames);
  return (
    <Aproximado escala={interpolate(frame, [de, fim], [escala, 1], clamp)} foco={foco}>
      {children}
    </Aproximado>
  );
};

// Punch zoom: em cada quadro de `em`, a imagem salta para a escala seguinte de `escalas`, sem transição.
// `em` é o quadro em que a palavra forte COMEÇA. Um salto só: em={48}. Dois, empilhados: em={[48, 110]}.
// `ate`: quadro em que volta a 1, em corte seco (sem ele, fica até o fim da cena).
export const PunchZoom: React.FC<{ children: React.ReactNode; em: number | number[]; escalas?: number[]; ate?: number; foco?: FocoZoom }> = ({ children, em, escalas = [1.13, 1.21, 1.28], ate, foco = OLHOS }) => {
  const frame = useCurrentFrame();
  const saltos = (Array.isArray(em) ? em : [em]).filter((q) => frame >= q).length;
  const voltou = ate !== undefined && frame >= ate;
  const escala = voltou || saltos === 0 ? 1 : escalas[Math.min(saltos, escalas.length) - 1];
  return (
    <Aproximado escala={escala} foco={foco}>
      {children}
    </Aproximado>
  );
};

// Crash zoom: no quadro `em`, a imagem dispara até `escala` em `quadros` quadros (quase tudo já no primeiro),
// fica aproximada por `segura` quadros e volta a 1 em corte seco. `borrao` (px) borra só o disparo; 0 = sem borrão.
export const CrashZoom: React.FC<{ children: React.ReactNode; em: number; escala?: number; quadros?: number; segura?: number; borrao?: number; foco?: FocoZoom }> = ({
  children,
  em,
  escala = 1.4,
  quadros = 2,
  segura = 45,
  borrao = 0,
  foco = OLHOS,
}) => {
  const frame = useCurrentFrame();
  const dentro = frame >= em && frame < em + segura;
  const p = Math.min(1, (frame - em + 1) / Math.max(1, quadros));
  const v = dentro ? 1 - (1 - p) ** 3 : 0;
  return (
    <Aproximado escala={1 + (escala - 1) * v} foco={foco} borrao={dentro ? borrao * (1 - v) : 0}>
      {children}
    </Aproximado>
  );
};

// ---------- ROTEIRO DE ZOOMS: os mesmos quatro zooms num vídeo CONTÍNUO ----------
// Quando o vídeo não é cortado em cenas (a metade de baixo da tela dividida, um vídeo só com legenda), os zooms
// vêm numa lista, um por frase, com os quadros contados do começo do vídeo:
//   de, ate   a frase: onde o zoom começa e onde volta a 1, em corte seco (fora de qualquer frase da lista, fica em 1)
//   em        (punch e crash) o quadro em que a palavra forte começa; o punch aceita vários, que empilham
// Os padrões de escala são os mesmos dos componentes acima.
export type ZoomDaFala =
  | { tipo: "in"; de: number; ate: number; escala?: number }
  | { tipo: "out"; de: number; ate: number; escala?: number }
  | { tipo: "punch"; de: number; ate: number; em: number | number[]; escalas?: number[] }
  | { tipo: "crash"; de: number; ate: number; em: number; escala?: number; quadros?: number; borrao?: number };

// A escala (e o borrão) no quadro `frame`. `forca` encolhe ou aumenta todos os zooms de uma vez:
// 1 = como medido; 0,6 = 60% do caminho (bom quando o rosto já está fechado, como na tela dividida).
export const zoomNoQuadro = (frame: number, zooms: ZoomDaFala[], forca = 1): { escala: number; borrao: number } => {
  const z = zooms.find((q) => frame >= q.de && frame < q.ate);
  if (!z) return { escala: 1, borrao: 0 };
  let escala = 1;
  let borrao = 0;
  if (z.tipo === "in") escala = interpolate(frame, [z.de, Math.max(z.de + 1, z.ate)], [1, z.escala ?? 1.14], clamp);
  else if (z.tipo === "out") escala = interpolate(frame, [z.de, Math.max(z.de + 1, z.ate)], [z.escala ?? 1.28, 1], clamp);
  else if (z.tipo === "punch") {
    const escalas = z.escalas ?? [1.13, 1.21, 1.28];
    const saltos = (Array.isArray(z.em) ? z.em : [z.em]).filter((q) => frame >= q).length;
    escala = saltos === 0 ? 1 : escalas[Math.min(saltos, escalas.length) - 1];
  } else if (frame >= z.em) {
    const p = Math.min(1, (frame - z.em + 1) / Math.max(1, z.quadros ?? 2));
    const v = 1 - (1 - p) ** 3;
    escala = 1 + ((z.escala ?? 1.4) - 1) * v;
    borrao = (z.borrao ?? 0) * (1 - v);
  }
  return { escala: 1 + (escala - 1) * forca, borrao };
};

export const ZoomRoteiro: React.FC<{ children: React.ReactNode; zooms: ZoomDaFala[]; foco?: FocoZoom; forca?: number }> = ({ children, zooms, foco = OLHOS, forca = 1 }) => {
  const frame = useCurrentFrame();
  const { escala, borrao } = zoomNoQuadro(frame, zooms, forca);
  return (
    <Aproximado escala={escala} foco={foco} borrao={borrao}>
      {children}
    </Aproximado>
  );
};
