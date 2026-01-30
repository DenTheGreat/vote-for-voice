-- Create whitelist table for allowed users
CREATE TABLE IF NOT EXISTS allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by TEXT
);

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON allowed_users(email);

-- Enable RLS on whitelist
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read whitelist (to check their own access)
CREATE POLICY "Users can check their own whitelist status"
  ON allowed_users FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Create voice_messages table (stores transcriptions with audio references)
CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  audio_file TEXT NOT NULL UNIQUE,
  duration REAL,
  language TEXT,
  language_probability REAL,
  message_datetime TIMESTAMP WITH TIME ZONE,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster sorting by votes
CREATE INDEX IF NOT EXISTS idx_voice_messages_votes ON voice_messages(votes DESC);

-- Create index for audio file lookups
CREATE INDEX IF NOT EXISTS idx_voice_messages_audio_file ON voice_messages(audio_file);

-- Create votes table (for tracking individual votes)
CREATE TABLE IF NOT EXISTS vote_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID REFERENCES voice_messages(id) ON DELETE CASCADE,
  loser_id UUID REFERENCES voice_messages(id) ON DELETE CASCADE,
  voter_email TEXT,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vote records
CREATE INDEX IF NOT EXISTS idx_vote_records_voted_at ON vote_records(voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_vote_records_voter ON vote_records(voter_email);

-- Enable Row Level Security
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users only
CREATE POLICY "Allow authenticated read access on voice_messages"
  ON voice_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on vote_records"
  ON vote_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on vote_records"
  ON vote_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on voice_messages"
  ON voice_messages FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to atomically increment votes
CREATE OR REPLACE FUNCTION increment_votes(message_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE voice_messages
  SET votes = votes + 1
  WHERE id = message_id;
END;
$$;

-- Create function to check if user is whitelisted
CREATE OR REPLACE FUNCTION is_user_whitelisted(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_users WHERE email = user_email
  );
END;
$$;
