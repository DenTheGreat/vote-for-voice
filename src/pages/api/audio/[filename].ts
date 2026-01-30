import type { APIRoute } from 'astro';
import * as fs from 'fs';
import * as path from 'path';

const TELEGRAM_DATA_PATH = import.meta.env.TELEGRAM_DATA_PATH || process.env.TELEGRAM_DATA_PATH;
const VOICE_MESSAGES_PATH = path.join(TELEGRAM_DATA_PATH, 'voice_messages');

export const GET: APIRoute = async ({ params, request }) => {
  const { filename } = params;

  if (!filename) {
    return new Response('Filename required', { status: 400 });
  }

  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(VOICE_MESSAGES_PATH, sanitizedFilename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return new Response('Audio file not found', { status: 404 });
  }

  // Read the file
  const fileBuffer = fs.readFileSync(filePath);
  const stat = fs.statSync(filePath);

  // Handle range requests for audio seeking
  const range = request.headers.get('range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    const chunk = fileBuffer.slice(start, end + 1);

    return new Response(chunk, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': 'audio/ogg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/ogg',
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
};
