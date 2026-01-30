export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      allowed_users: {
        Row: {
          id: string
          email: string
          name: string | null
          added_at: string
          added_by: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          added_at?: string
          added_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          added_at?: string
          added_by?: string | null
        }
      }
      voice_messages: {
        Row: {
          id: string
          text: string
          audio_file: string
          duration: number | null
          language: string | null
          language_probability: number | null
          message_datetime: string | null
          votes: number
          created_at: string
          flagged_for_removal: boolean
          flagged_at: string | null
          flagged_by: string | null
        }
        Insert: {
          id?: string
          text: string
          audio_file: string
          duration?: number | null
          language?: string | null
          language_probability?: number | null
          message_datetime?: string | null
          votes?: number
          created_at?: string
          flagged_for_removal?: boolean
          flagged_at?: string | null
          flagged_by?: string | null
        }
        Update: {
          id?: string
          text?: string
          audio_file?: string
          duration?: number | null
          language?: string | null
          language_probability?: number | null
          message_datetime?: string | null
          votes?: number
          created_at?: string
          flagged_for_removal?: boolean
          flagged_at?: string | null
          flagged_by?: string | null
        }
      }
      vote_records: {
        Row: {
          id: string
          winner_id: string
          loser_id: string
          voter_email: string | null
          voted_at: string
        }
        Insert: {
          id?: string
          winner_id: string
          loser_id: string
          voter_email?: string | null
          voted_at?: string
        }
        Update: {
          id?: string
          winner_id?: string
          loser_id?: string
          voter_email?: string | null
          voted_at?: string
        }
      }
    }
  }
}
