// Fontes da marca neutra de exemplo: Inter para títulos e texto, JetBrains Mono para números e código.
import { loadFont as loadDisplay } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadDisplay("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const fonteDisplay = inter;
export const fonteBody = inter;
export const fonteMono = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
