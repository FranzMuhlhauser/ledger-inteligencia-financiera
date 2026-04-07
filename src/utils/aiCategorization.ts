import { GoogleGenAI } from '@google/genai';

interface SpaceSuggestion {
  spaceId: string | null;
  confidence: number;
  reason: string;
}

// Declare Vite env types
declare global {
  interface ImportMetaEnv {
    VITE_GEMINI_API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const AI_CATEGORIZATION_PROMPT = `Eres un asistente de categorización de facturas. Tu tarea es sugerir el espacio (categoría) más apropiado para una factura basándote en su descripción, proveedor y tipo de documento.

ESPACIOS DISPONIBLES:
{spaces}

FACTURA A CATEGORIZAR:
- Proveedor: {proveedor}
- Descripción: {descripcion}
- Tipo de documento: {tipoDocumento}
- Valor Neto: \${valorNeto}

Instrucciones:
1. Analiza la información de la factura
2. Sugiere el espacio más apropiado de la lista disponible
3. Si ningún espacio es apropiado, sugiere null
4. Proporciona una breve razón para tu sugerencia
5. Indica tu nivel de confianza (0-100)

Responde SOLO en formato JSON como este:
{
  "spaceId": "id_del_espacio" o null,
  "confidence": 85,
  "reason": "Razón breve de la sugerencia"
}`;

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY no está configurada. La auto-categorización con IA no estará disponible.');
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function suggestSpaceForInvoice(
  proveedor: string,
  descripcion: string,
  tipoDocumento: string,
  valorNeto: number,
  spaces: Array<{ id: string; nombre: string; icono: string; color: string }>
): Promise<SpaceSuggestion> {
  const client = getAIClient();

  // Si no hay cliente de IA o espacios, devolver null
  if (!client || spaces.length === 0) {
    return {
      spaceId: null,
      confidence: 0,
      reason: 'IA no disponible o sin espacios configurados',
    };
  }

  // Formatear espacios para el prompt
  const spacesText = spaces.map(s => `- ID: ${s.id}, Nombre: ${s.nombre}`).join('\n');

  // Reemplazar placeholders en el prompt
  const prompt = AI_CATEGORIZATION_PROMPT
    .replace('{spaces}', spacesText)
    .replace('{proveedor}', proveedor)
    .replace('{descripcion}', descripcion || 'Sin descripción')
    .replace('{tipoDocumento}', tipoDocumento)
    .replace('{valorNeto}', valorNeto.toString());

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text.trim();

    // Intentar parsear la respuesta JSON
    try {
      const suggestion: SpaceSuggestion = JSON.parse(text);

      // Validar que el spaceId existe en los espacios disponibles
      if (suggestion.spaceId && !spaces.some(s => s.id === suggestion.spaceId)) {
        console.warn(`IA sugirió un spaceId inexistente: ${suggestion.spaceId}`);
        return {
          spaceId: null,
          confidence: 0,
          reason: 'Sugerencia inválida de la IA',
        };
      }

      return suggestion;
    } catch (parseError) {
      console.error('Error al parsear respuesta de IA:', text);
      return {
        spaceId: null,
        confidence: 0,
        reason: 'Error al procesar la respuesta de la IA',
      };
    }
  } catch (error) {
    console.error('Error al llamar a la API de Gemini:', error);
    return {
      spaceId: null,
      confidence: 0,
      reason: 'Error en la llamada a la IA',
    };
  }
}

// Función para auto-categorización silenciosa (sin mostrar UI)
export async function autoCategorizeInvoice(
  proveedor: string,
  descripcion: string,
  tipoDocumento: string,
  valorNeto: number,
  spaces: Array<{ id: string; nombre: string; icono: string; color: string }>
): Promise<string | null> {
  const suggestion = await suggestSpaceForInvoice(proveedor, descripcion, tipoDocumento, valorNeto, spaces);

  // Solo sugerir si la confianza es mayor a 70%
  if (suggestion.confidence >= 70 && suggestion.spaceId) {
    return suggestion.spaceId;
  }

  return null;
}
