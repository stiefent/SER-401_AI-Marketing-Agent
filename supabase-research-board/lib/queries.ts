// Read queries used by the demo page. Each one shows a different
// database feature the AI Marketing Agent will rely on.
import "server-only";
import { supabase } from "./supabase";

export const NICHES = ["gaming", "fitness", "education", "food"] as const;
export type Niche = (typeof NICHES)[number];

export type Creator = {
  id: number;
  handle: string;
  display_name: string;
  niche: Niche;
};

export type FormatStat = {
  format: string;
  shorts_analyzed: number;
  avg_cuts: number;
  avg_seconds: number;
  typical_pacing: string;
};

export type ShortWithAnalysis = {
  id: string;
  title: string;
  channel: string;
  duration_seconds: number;
  views: number | null;
  published_at: string;
  short_analyses: {
    hook: string;
    format: string;
    pacing: string;
    estimated_cuts: number;
    features: { takeaways?: string[] };
  } | null;
};

export type BoardItem = {
  note: string;
  saved_at: string;
  shorts: { id: string; title: string; channel: string; niche: Niche } | null;
};

export async function getCreators(): Promise<Creator[]> {
  const { data, error } = await supabase
    .from("creators")
    .select("id, handle, display_name, niche")
    .order("id");
  if (error) throw new Error(`Loading creators failed: ${error.message}`);
  return data;
}

// Market research: the database view groups every analyzed Short
// in a niche by its format.
export async function getNicheStats(niche: Niche): Promise<FormatStat[]> {
  const { data, error } = await supabase
    .from("niche_format_stats")
    .select("format, shorts_analyzed, avg_cuts, avg_seconds, typical_pacing")
    .eq("niche", niche)
    .order("shorts_analyzed", { ascending: false })
    .order("format");
  if (error) throw new Error(`Loading niche stats failed: ${error.message}`);
  return data;
}

// A join: each Short comes back with its AI analysis nested inside,
// using the foreign key from short_analyses to shorts.
export async function getTopShorts(niche: Niche): Promise<ShortWithAnalysis[]> {
  const { data, error } = await supabase
    .from("shorts")
    .select(
      "id, title, channel, duration_seconds, views, published_at, short_analyses (hook, format, pacing, estimated_cuts, features)"
    )
    .eq("niche", niche)
    .order("views", { ascending: false, nullsFirst: false })
    .limit(10);
  if (error) throw new Error(`Loading Shorts failed: ${error.message}`);
  return data as unknown as ShortWithAnalysis[];
}

// The creator's saved Shorts, newest first, joined to each Short's details.
export async function getBoard(creatorId: number): Promise<BoardItem[]> {
  const { data, error } = await supabase
    .from("research_board")
    .select("note, saved_at, shorts (id, title, channel, niche)")
    .eq("creator_id", creatorId)
    .order("saved_at", { ascending: false });
  if (error) throw new Error(`Loading research board failed: ${error.message}`);
  return data as unknown as BoardItem[];
}
