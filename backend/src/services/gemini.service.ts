import type { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { getFirestore, isFirebaseConfigured } from '../config/firebaseAdmin';
import { ItemDocument, VALID_CATEGORIES, ItemCategory } from '../types/item.types';
import { DEFAULT_SEEDED_ITEMS } from './items.service';

export interface RecommendationResult {
  item: {
    itemId: string;
    title: string;
    category: string;
    rentalPrice: number;
    pricingModel: string;
    pickupLocation: string;
    photoURLs: string[];
    description: string;
  };
  estimatedCost: number;
  aiExplanation: string;
  confidenceScore: number;
}

export class GeminiService {
  private aiClient: GoogleGenAI | null = null;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      console.log('[GeminiService] GEMINI_API_KEY configured. AI client will initialize on demand.');
    } else {
      console.warn('[GeminiService] Notice: GEMINI_API_KEY is not configured. AI routes will use deterministic keyword fallback.');
    }
  }

  /**
   * Lazily loads the ES Module @google/genai without crashing CommonJS runtimes (e.g. Vercel Serverless).
   */
  private async getClient(): Promise<GoogleGenAI | null> {
    if (this.aiClient) return this.aiClient;
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '') {
      return null;
    }
    try {
      const dynamicImport = new Function('m', 'return import(m)');
      const { GoogleGenAI: GenAIClass } = (await dynamicImport('@google/genai')) as typeof import('@google/genai');
      this.aiClient = new GenAIClass({ apiKey: env.GEMINI_API_KEY });
      console.log('[GeminiService] Initialized GoogleGenAI with model:', this.modelName);
      return this.aiClient;
    } catch (err: any) {
      console.warn('[GeminiService] Warning: Failed to load GoogleGenAI. AI routes will use keyword fallback:', err?.message || err);
      return null;
    }
  }

  /**
   * Generates grounded natural-language rental recommendations.
   * Pulls real active items from Firestore, sends catalog to Gemini 1.5 Flash,
   * validates returned item IDs against reality, and falls back gracefully to keyword matching.
   */
  async getRecommendations(
    query: string,
    maxBudget?: number,
    durationDays: number = 1
  ): Promise<{ recommendations: RecommendationResult[]; fallback: boolean }> {
    let catalog: ItemDocument[] = [];
    if (isFirebaseConfigured()) {
      try {
        const db = getFirestore();
        const itemsSnap = await db.collection('items').where('isAvailable', '==', true).get();
        itemsSnap.forEach((doc) => {
          catalog.push(doc.data() as ItemDocument);
        });
      } catch (e) {
        // Fallback
      }
    }

    if (catalog.length === 0) {
      catalog = [...DEFAULT_SEEDED_ITEMS] as any;
    }

    // Try Gemini if client is ready
    const aiClient = await this.getClient();
    if (aiClient) {
      try {
        const inventoryContext = catalog.map((it) => ({
          itemId: it.itemId,
          title: it.title,
          category: it.category,
          rentalPrice: it.rentalPrice,
          pricingModel: it.pricingModel,
          pickupLocation: it.pickupLocation,
          description: it.description,
        }));

        const prompt = `
You are the recommendation engine for CampusCycle, a campus peer-to-peer equipment rental platform.
A university student is looking for equipment:
User Request: "${query}"
Max Budget: ${maxBudget ? '₹' + maxBudget : 'Not specified'}
Expected Duration: ${durationDays} days

CATALOG OF CURRENTLY AVAILABLE CAMPUS ITEMS:
${JSON.stringify(inventoryContext, null, 2)}

TASK:
1. Select the top matching items (maximum 4) that best fulfill the student's need and respect their budget.
2. Calculate estimated cost for the ${durationDays}-day duration based on the item's pricingModel and rate.
3. Provide a friendly, concise AI justification.

STRICT GROUNDING RULES:
- You may ONLY recommend items from the catalog above.
- NEVER invent, hallucinate, or alter an itemId.
- If no item matches, return an empty recommendations array.
- Respond with pure JSON in this format:
{
  "recommendations": [
    {
      "itemId": "exact itemId from catalog",
      "estimatedCost": number,
      "aiExplanation": "Why this item fits their request and budget",
      "confidenceScore": number (0.0 to 1.0)
    }
  ]
}
`;

        const response = await aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        if (parsed && Array.isArray(parsed.recommendations)) {
          const catalogMap = new Map<string, ItemDocument>(catalog.map((i) => [i.itemId, i]));
          const verified: RecommendationResult[] = [];

          for (const rec of parsed.recommendations) {
            // Anti-Hallucination verification: Must exist in Firestore catalog
            const realItem = catalogMap.get(rec.itemId);
            if (realItem) {
              verified.push({
                item: {
                  itemId: realItem.itemId,
                  title: realItem.title,
                  category: realItem.category,
                  rentalPrice: realItem.rentalPrice,
                  pricingModel: realItem.pricingModel,
                  pickupLocation: realItem.pickupLocation,
                  photoURLs: realItem.photoURLs || [],
                  description: realItem.description,
                },
                estimatedCost: Number(rec.estimatedCost) || realItem.rentalPrice,
                aiExplanation: rec.aiExplanation || 'Recommended based on your query.',
                confidenceScore: Math.min(Math.max(Number(rec.confidenceScore) || 0.8, 0), 1),
              });
            }
          }

          if (verified.length > 0) {
            return { recommendations: verified, fallback: false };
          }
        }
      } catch (geminiError: any) {
        console.warn('[GeminiService] Gemini call failed or timed out. Falling back to keyword engine:', geminiError?.message || geminiError);
      }
    }

    // Deterministic Keyword Fallback Engine
    return {
      recommendations: this.keywordFallbackSearch(query, catalog, maxBudget, durationDays),
      fallback: true,
    };
  }

  private keywordFallbackSearch(
    query: string,
    catalog: ItemDocument[],
    maxBudget?: number,
    durationDays: number = 1
  ): RecommendationResult[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored: Array<{ item: ItemDocument; score: number; matchReasons: string[] }> = [];

    for (const item of catalog) {
      let score = 0;
      const reasons: string[] = [];
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const catLower = item.category.toLowerCase();

      for (const token of tokens) {
        if (titleLower.includes(token)) {
          score += 3;
          reasons.push(`matches title keyword "${token}"`);
        }
        if (catLower.includes(token)) {
          score += 2;
          reasons.push(`in category "${item.category}"`);
        }
        if (descLower.includes(token)) {
          score += 1;
        }
      }

      if (maxBudget !== undefined && item.rentalPrice > maxBudget) {
        score -= 2; // Penalize over-budget
      }

      if (score > 0) {
        scored.push({ item, score, matchReasons: reasons });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map(({ item, score, matchReasons }) => {
      const estimatedCost = item.rentalPrice * durationDays;
      const explanation = matchReasons.length > 0
        ? `Found in campus inventory (${matchReasons.slice(0, 2).join(', ')}). Available at ${item.pickupLocation}.`
        : `Available equipment on campus matching your general search.`;

      return {
        item: {
          itemId: item.itemId,
          title: item.title,
          category: item.category,
          rentalPrice: item.rentalPrice,
          pricingModel: item.pricingModel,
          pickupLocation: item.pickupLocation,
          photoURLs: item.photoURLs || [],
          description: item.description,
        },
        estimatedCost,
        aiExplanation: explanation,
        confidenceScore: Math.min(0.5 + score * 0.1, 0.9),
      };
    });
  }

  /**
   * Generates an attractive listing description and infers catalog category from student notes.
   */
  async generateDescription(
    title: string,
    rawDetails: string,
    intendedPrice?: number
  ): Promise<{ suggestedCategory: ItemCategory; generatedDescription: string }> {
    const aiClient = await this.getClient();
    if (aiClient) {
      try {
        const prompt = `
You are an expert student assistant for CampusCycle, a campus peer-to-peer equipment rental community.
Help a student seller draft a clear, compelling listing description from their rough notes.

Title: "${title}"
Student Notes: "${rawDetails}"
Intended Price: ${intendedPrice ? '₹' + intendedPrice : 'Not specified'}

VALID CATALOG CATEGORIES:
${JSON.stringify(VALID_CATEGORIES)}

INSTRUCTIONS:
1. Select the single best matching category from the valid categories.
2. Polish the student notes into an organized, attractive listing description (approx. 2-4 sentences) highlighting item condition, specifications, included accessories, and friendly care instructions.
3. Respond in pure JSON:
{
  "suggestedCategory": "<one of the valid categories>",
  "generatedDescription": "<polished description text>"
}
`;

        const response = await aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        if (parsed && parsed.suggestedCategory && parsed.generatedDescription) {
          const category = VALID_CATEGORIES.includes(parsed.suggestedCategory)
            ? (parsed.suggestedCategory as ItemCategory)
            : this.inferCategoryFallback(title + ' ' + rawDetails);

          return {
            suggestedCategory: category,
            generatedDescription: parsed.generatedDescription.trim(),
          };
        }
      } catch (geminiError: any) {
        console.warn('[GeminiService] Gemini description generation failed, using rule-based fallback:', geminiError?.message || geminiError);
      }
    }

    // Deterministic Fallback
    const inferred = this.inferCategoryFallback(title + ' ' + rawDetails);
    const description = `${rawDetails.trim()} In great condition and ready for campus peer rental. Pickup and return handled smoothly on campus.`;

    return {
      suggestedCategory: inferred,
      generatedDescription: description,
    };
  }

  private inferCategoryFallback(text: string): ItemCategory {
    const lower = text.toLowerCase();
    if (lower.includes('calc') || lower.includes('casio') || lower.includes('ti-84')) return 'Calculators';
    if (lower.includes('lab') || lower.includes('coat') || lower.includes('goggle') || lower.includes('apron')) return 'Lab Gear';
    if (lower.includes('blazer') || lower.includes('suit') || lower.includes('coat') || lower.includes('tie') || lower.includes('formal')) return 'Formal Wear';
    if (lower.includes('book') || lower.includes('notes') || lower.includes('edition') || lower.includes('author')) return 'Textbooks & Notes';
    if (lower.includes('arduino') || lower.includes('pi') || lower.includes('cable') || lower.includes('charger') || lower.includes('monitor') || lower.includes('mouse') || lower.includes('multimeter')) return 'Tech & Electronics';
    return 'Other';
  }
}

export const geminiService = new GeminiService();
