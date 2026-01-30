import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const telegramDataPath = process.env.TELEGRAM_DATA_PATH;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

if (!telegramDataPath) {
  console.error('Missing TELEGRAM_DATA_PATH in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Transcription {
  text: string;
  language: string;
  language_probability: number;
  duration: number;
  datetime: string;
}

type TranscriptionsFile = Record<string, Transcription>;

function parseDateTime(datetime: string): Date | null {
  // Format: "24-12-2024 10:00:30"
  const match = datetime.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, day, month, year, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

async function seed() {
  console.log('Starting to seed the database with voice messages...');

  // Check if voice messages already exist
  const { data: existingMessages } = await supabase
    .from('voice_messages')
    .select('id')
    .limit(1);

  if (existingMessages && existingMessages.length > 0) {
    console.log('Database already has voice messages. Skipping seed.');
    console.log('If you want to re-seed, delete existing messages first.');
    return;
  }

  // Read transcriptions JSON
  const transcriptionsPath = path.join(telegramDataPath, 'mykyta_transcriptions.json');

  if (!fs.existsSync(transcriptionsPath)) {
    console.error(`Transcriptions file not found: ${transcriptionsPath}`);
    process.exit(1);
  }

  console.log(`Reading transcriptions from: ${transcriptionsPath}`);
  const transcriptionsJson = fs.readFileSync(transcriptionsPath, 'utf-8');
  const transcriptions: TranscriptionsFile = JSON.parse(transcriptionsJson);

  const audioFiles = Object.keys(transcriptions);
  console.log(`Found ${audioFiles.length} transcriptions`);

  // Prepare data for insertion
  const voiceMessages = audioFiles.map(audioFile => {
    const t = transcriptions[audioFile];
    const messageDate = parseDateTime(t.datetime);

    return {
      text: t.text,
      audio_file: audioFile,
      duration: t.duration,
      language: t.language,
      language_probability: t.language_probability,
      message_datetime: messageDate?.toISOString() || null,
      votes: 0
    };
  });

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < voiceMessages.length; i += batchSize) {
    const batch = voiceMessages.slice(i, i + batchSize);

    const { error } = await supabase
      .from('voice_messages')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${voiceMessages.length} voice messages...`);
  }

  console.log(`\nSuccessfully seeded ${inserted} voice messages!`);
  console.log('You can now start voting at http://localhost:4321/vote');
}

seed().catch(console.error);
