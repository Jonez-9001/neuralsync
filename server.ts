import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini Client with 'aistudio-build' User-Agent
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Scientific Research & Search Grounding Endpoint
app.post('/api/research', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured in the workspace secrets. Please configure it in Settings > Secrets.' 
      });
    }

    // Call Gemini with Google Search Grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the NeuralSync 40 AI Research Assistant, an authority in neuroscience, cognitive focus, brainwave entrainment (particularly 40Hz Gamma waves), and high-performance flow states. 
Your objective is to answer user queries with objective, scientific information grounded in live search facts.
- Present scientific explanations clearly, with professional composure.
- Incorporate citation link numbers matching the sources you draw from.
- At the end of your response, naturally connect the findings back to NeuralSync 40's risk-free protocol available on this landing page as the ultimate pre-engineered tool for achieving these precise states. Do not over-sell, just maintain an inviting, logical tone.`,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({
      text,
      groundingMetadata,
    });
  } catch (error: any) {
    console.error('Gemini Research Grounding Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch grounded search data' });
  }
});

// Vite Middleware Integration
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeuralSync 40 Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
