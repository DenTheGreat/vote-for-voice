# Database Setup

## Instructions

1. Go to https://app.supabase.com and create a new project
2. Wait for the project to be provisioned
3. Go to the SQL Editor in your project dashboard
4. Copy the contents of `schema.sql` and run it in the SQL editor
5. Go to Settings > API to get your project URL and anon key
6. Copy `.env.example` to `.env` and fill in your credentials
7. Configure Google OAuth (see Authentication section below)
8. Add users to the whitelist (see Managing Whitelist section below)
9. Run the seed script to add initial phrases:
   ```bash
   npm run seed
   ```

## Authentication

### Setting up Google OAuth

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. In Google Cloud Console (https://console.cloud.google.com):
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase Google provider settings

## Managing Whitelist

Only whitelisted users can access the application. Add users via SQL Editor:

```sql
-- Add a single user
INSERT INTO allowed_users (email, name, added_by)
VALUES ('user@example.com', 'User Name', 'admin');

-- Add multiple users
INSERT INTO allowed_users (email, name, added_by) VALUES
  ('user1@example.com', 'User One', 'admin'),
  ('user2@example.com', 'User Two', 'admin');

-- View all whitelisted users
SELECT * FROM allowed_users ORDER BY added_at DESC;

-- Remove a user
DELETE FROM allowed_users WHERE email = 'user@example.com';
```

## Tables

### allowed_users
- `id`: UUID primary key
- `email`: User's email address (unique)
- `name`: Optional display name
- `added_at`: When they were added
- `added_by`: Who added them

### phrases
- `id`: UUID primary key
- `text`: The phrase text (unique)
- `votes`: Number of votes received
- `created_at`: Timestamp

### vote_records
- `id`: UUID primary key
- `winner_id`: Reference to winning phrase
- `loser_id`: Reference to losing phrase
- `voted_at`: Timestamp
