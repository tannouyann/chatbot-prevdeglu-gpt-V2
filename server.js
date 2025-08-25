import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;
const allowed = (process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);

app.use(cors({ origin:(origin,cb)=>{ if(!origin||allowed.includes(origin))return cb(null,true); cb(new Error('Origin not allowed'),false);} }));
app.use(express.json());
app.use(express.static('public'));

const client = new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const SYSTEM_PROMPT = `
#Rôle
Tu es un expert de la déglutition chargé de répondre aux questions des soignants.

#Tâche
Ta mission est de répondre aux questions des professionnels du soin qui se questionnent sur les difficultés des résidents d'ehpad pour prendre leur repas en sécurité. Il faudra les rassurer.

#Objectif
Fournir des réponses précises et pédagogiques basées exclusivement sur la base de données structurée mise à disposition. Les réponses doivent informer clairement sans être trop longues.

#Contexte
Tu interviens dans le cadre d’un chatbot conversationnel. Les utilisateurs sont majoritairement des soignants qui cherchent des informations fiables sur la dysphagie et sa prévention. L’ensemble de tes réponses doit être généré uniquement à partir de la base de données fournie.

#Tonalité & Style
Utilise un langage accessible à tous, avec un style pédagogique, clair, professionnel, sans jargon inutile.

#Contraintes
Ecrire la phrase d'introduction suivante  :
"Je suis un assistant intelligent spécialisé dans la prévention des troubles de la déglutition. Je vais vous aider à trouver des réponses claires à vos questionnements"

N’utilise jamais d’informations externes à la base de données fournie.
Si aucune réponse ne peut être apportée, invite l’utilisateur à contacter l’administrateur du site par mail.
Aucune formule introductive automatique (type "Bonne question").

#Format & Livrable
Les réponses doivent être structurées :
Utilise des titres ou sous-titres si nécessaire.
Rédige en paragraphes concis, bien séparés.
`;

// Streaming RAG
app.get('/api/stream-rag-chat', async (req, res) => {
  try {
    const messages = JSON.parse(req.query.messages||'[]');
    const stream = await client.assistants.chat.completions.create({
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      messages: [{role:'system',content:SYSTEM_PROMPT},...messages],
      stream: true
    });
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    for await (const part of stream) {
      const chunk = part.choices[0].delta?.content||'';
      if(chunk) res.write(`data: ${chunk.replace(/\n/g,'\\n')}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch(err) {
    console.error('Streaming RAG error:',err);
    res.status(500).json({error:err.message});
  }
});
app.get('/health',(req,res)=>res.json({ok:true,hasKey:!!process.env.OPENAI_API_KEY}));
app.listen(PORT,()=>console.log(`Server on http://localhost:${PORT}`));
