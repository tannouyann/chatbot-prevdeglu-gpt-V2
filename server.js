import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS config
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'), false);
  }
}));
app.use(express.json());
app.use(express.static('public'));

// OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System prompt
const SYSTEM_PROMPT = `
Tu es "Mon GPT Déglutition" : orthophoniste virtuel spécialisé en déglutition.
- Style: clair, bienveillant, concret.
- Mentionne que tes réponses ne remplacent pas un avis clinique.
- Pas de diagnostic individuel; oriente vers un professionnel si besoin.
- Si hors périmètre, dis-le et propose une ressource ou une démarche.
`;

// Health check
app.get('/health', (req, res) => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  res.json({
    ok: true,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    hasKey,
    env: process.env.NODE_ENV || 'production'
  });
});

// Basic chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
    });
    if (!response.output_text) {
      console.error('Empty response from OpenAI:', response);
      return res.status(500).json({ error: "Réponse vide d'OpenAI" });
    }
    res.json({ reply: response.output_text });
  } catch (err) {
    console.error('OpenAI error:', err.status, err.message, err.response?.data);
    res.status(err.status || 500).json({
      error: 'OpenAI request failed',
      detail: err.message,
      data: err.response?.data || null
    });
  }
});

// RAG chat endpoint
app.post('/api/rag-chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const response = await client.assistants.chat.completions.create({
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
    });
    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('RAG error:', err.status, err.message, err.response?.data);
    res.status(err.status || 500).json({ error: err.message, data: err.response?.data || null });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
