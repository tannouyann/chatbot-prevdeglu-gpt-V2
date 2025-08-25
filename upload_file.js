import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';

async function main() {
  const client = new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const path = 'docs/base documentaire des fiches actions.docx';
  console.log(`Uploading ${path}…`);
  const up = await client.files.create({ file: fs.createReadStream(path), purpose: 'document' });
  console.log('File ID =',up.id);
}

main().catch(console.error);
