// Fontes da marca "Aurora (teste)" (Google Fonts). Gerado por npm run marca -- criar.
import { loadFont as loadTitulos } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadTexto } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";

const Titulos = loadTitulos("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
const Texto = loadTexto("normal", { weights: ["400","600"], subsets: ["latin", "latin-ext"] }).fontFamily;
const Mono = loadMono("normal", { weights: ["400","500"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const fonteDisplay = Titulos;
export const fonteBody = Texto;
export const fonteMono = Mono;
