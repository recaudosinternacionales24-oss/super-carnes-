
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

// Always use the API key directly from process.env.API_KEY without fallbacks
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInventoryAdvice = async (products: Product[], sales: Sale[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza el siguiente inventario y ventas de "Super Carnes" y da 3 consejos cortos en español para mejorar la rentabilidad. 
      Inventario: ${JSON.stringify(products.map(p => ({ n: p.name, s: p.stock })))}
      Ventas recientes: ${JSON.stringify(sales.slice(-5).map(s => ({ t: s.total })))}`,
      config: {
        systemInstruction: "Eres un experto en logística de distribución de carnes en Colombia.",
        temperature: 0.7,
      }
    });
    // Accessing .text property directly as per GenerateContentResponse definition
    return response.text;
  } catch (error) {
    console.error("Error fetching AI advice:", error);
    return "No se pudo obtener el análisis de IA en este momento.";
  }
};
