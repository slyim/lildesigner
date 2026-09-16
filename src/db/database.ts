// Minimal Supabase schema types for this project's tables + RPCs.
// Hand-written in the shape `supabase gen types` would emit, so every
// query stays typechecked without the full codegen toolchain.
export interface ZelvaDB {
  public: {
    Tables: {
      page_stats: {
        Row: { id: string; views: number; likes: number; link_clicks: number };
        Insert: { id: string; views?: number; likes?: number; link_clicks?: number };
        Update: { id?: string; views?: number; likes?: number; link_clicks?: number };
        Relationships: [];
      };
      comments: {
        Row: {
          id: number;
          parent_id: number | null;
          name: string;
          body: string;
          likes: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          parent_id?: number | null;
          name: string;
          body: string;
          likes?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          parent_id?: number | null;
          name?: string;
          body?: string;
          likes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_stat: {
        Args: { stat_name: string };
        Returns: { views: number; likes: number; link_clicks: number };
      };
      increment_comment_likes: {
        Args: { comment_id: number };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
