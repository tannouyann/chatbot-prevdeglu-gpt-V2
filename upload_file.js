import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const path = 'docs/mon-guide-de-deglutition.pdf';
  console.log(`Uploading ${path}…`);
  const up = await client.files.create({
    file: fs.createReadStream(path),
    purpose: 'document'
  });
  console.log('✅ File uploaded. File ID =', up.id);
}

main().catch(console.error);
