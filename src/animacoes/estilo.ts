// ESTILO: o jeito de mover e de desenhar, independente da MARCA (cores, fontes, nome).
// Qualquer marca combina com qualquer estilo. O estilo ativo vem de estilos/ativo.ts; os estilos ficam em estilos/<nome>/.
// As peças chamam os ajustes abaixo DEPOIS do próprio estilo delas: num estilo que não mexe em nada
// (como o mini-action), cada ajuste devolve {} e a peça sai exatamente como era.
import type { CSSProperties } from "react";
import { random } from "remotion";
import dados from "../../estilos/ativo";
import { ds } from "./tema";

export type Estilo = {
  nome: string;
  descricao: string;
  movimento: {
    curva: number[]; // curva das entradas (cubic-bezier)
    entrada: { duracao: number; subida: number; escala?: number; desfoque?: number }; // referência: 14 quadros e 24 px
  };
  flutuacao?: { amplitude: number; inclinacao: number; ciclo: number; perspectiva?: number }; // px, graus, segundos, px
  fundo?: { tipo: "estrelas" | "rede" | "palco" | "liso"; pontos?: number; deriva?: number; particulas?: number };
  cartao?: { brilho?: number; transparencia?: number; bordaNoAcento?: boolean; bordaClara?: boolean; sombra?: number; realce?: number };
  halo?: number; // multiplica a intensidade do halo
  brilhoTitulo?: number; // 0 = sem brilho no título
  destaque?: "cor" | "italico"; // como a *palavra* em destaque aparece: só na cor do acento, ou também em itálico
};

export const estilo = dados as Estilo;

// "#rrggbb" + transparência (0 a 1). Cor em outro formato volta como está.
export const comAlfa = (cor: string, alfa: number) =>
  /^#[0-9a-f]{6}$/i.test(cor) ? `${cor}${Math.round(Math.max(0, Math.min(1, alfa)) * 255).toString(16).padStart(2, "0")}` : cor;

// Superfície de cartão: brilho na borda, borda na cor do acento ou clara, fundo translúcido, sombra embaixo e
// um fio de luz na borda de cima. `base` = a cor de fundo do cartão.
export const cartao = (acento: string, base: string = ds.bg100): CSSProperties => {
  const c = estilo.cartao;
  if (!c || (!c.brilho && !c.transparencia && !c.bordaNoAcento && !c.bordaClara && !c.sombra && !c.realce)) return {};
  const r: CSSProperties = {};
  if (c.transparencia) r.backgroundColor = comAlfa(base, 1 - c.transparencia);
  if (c.bordaNoAcento) r.borderColor = comAlfa(acento, 0.75);
  else if (c.bordaClara) r.borderColor = comAlfa(ds.ink, 0.16);
  const sombras: string[] = [];
  if (c.brilho) sombras.push(`0 0 ${Math.round(48 * c.brilho)}px ${comAlfa(acento, 0.5 * c.brilho)}`, `inset 0 0 ${Math.round(28 * c.brilho)}px ${comAlfa(acento, 0.14 * c.brilho)}`);
  if (c.sombra) sombras.push(`0 ${Math.round(36 * c.sombra)}px ${Math.round(80 * c.sombra)}px rgba(0, 0, 0, ${(0.55 * c.sombra).toFixed(2)})`);
  if (c.realce) sombras.push(`inset 0 2px 0 ${comAlfa(ds.ink, 0.12 * c.realce)}`);
  if (sombras.length) r.boxShadow = sombras.join(", ");
  return r;
};

// Estilo da *palavra* em destaque (o mini-action só pinta na cor do acento).
export const destaqueEstilo = (acento: string): CSSProperties =>
  estilo.destaque === "italico" ? { color: acento, fontStyle: "italic", fontWeight: 500 } : { color: acento };

// Flutuação: inclinação em perspectiva e um vai e vem lento, diferente para cada `semente`.
export const flutua = (frame: number, semente: string, fps = 30): CSSProperties => {
  const f = estilo.flutuacao;
  if (!f || (!f.amplitude && !f.inclinacao)) return {};
  const fase = random(`${semente}-fase`) * Math.PI * 2;
  const lado = random(`${semente}-lado`) < 0.5 ? -1 : 1;
  const t = ((frame / fps) * 2 * Math.PI) / f.ciclo + fase;
  const giroY = lado * f.inclinacao * (0.8 + 0.2 * Math.sin(t * 0.5));
  const giroX = f.inclinacao * 0.3 * Math.sin(t);
  const sobe = f.amplitude * Math.sin(t);
  return { transform: `perspective(${f.perspectiva ?? 1400}px) rotateY(${giroY.toFixed(3)}deg) rotateX(${giroX.toFixed(3)}deg) translateY(${sobe.toFixed(2)}px)` };
};

// Brilho do título na cor do acento (o mini-action não tem: sombra em texto é proibida nele).
export const brilhoTitulo = (acento: string): CSSProperties => {
  const b = estilo.brilhoTitulo;
  return b ? { textShadow: `0 0 ${Math.round(32 * b)}px ${comAlfa(acento, 0.6 * b)}` } : {};
};
