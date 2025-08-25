import 'dotenv/config';
import OpenAI from 'openai';

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fileId = process.env.OPENAI_FILE_ID;
  console.log('Creating assistant with file', fileId);
  const assistant = await client.assistants.create({
    name: 'Chatbot expert prévention des troubles de la déglutition',
    description: 'Assistant intelligent qui répond aux questions sur la prévention des troubles de la déglutition.',
    files: [{ file: fileId }]
  });
  console.log('Assistant created. Assistant ID =', assistant.id);
}

main().catch(console.error);
