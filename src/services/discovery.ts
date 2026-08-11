import { supabase } from "@/integrations/supabase/client";
import type { TrendingTopic } from "@/types";

/** Trending tags computed from the tags on real posts in the last 14 days. */
export async function listTrendingTags(limit = 8): Promise<TrendingTopic[]> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("tags, like_count, reply_count, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);

  const counts = new Map<string, { posts: number; engagement: number }>();
  for (const row of (data ?? []) as {
    tags: string[] | null;
    like_count: number;
    reply_count: number;
  }[]) {
    for (const raw of row.tags ?? []) {
      const tag = raw.replace(/^#/, "").trim();
      if (!tag) continue;
      const entry = counts.get(tag) ?? { posts: 0, engagement: 0 };
      entry.posts += 1;
      entry.engagement += (row.like_count ?? 0) + (row.reply_count ?? 0);
      counts.set(tag, entry);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].posts + b[1].engagement - (a[1].posts + a[1].engagement))
    .slice(0, limit)
    .map(([tag, stat], index) => ({
      id: tag,
      tag,
      category: index < 3 ? "Trending now" : "On Pulse",
      posts: stat.posts,
      change: stat.engagement,
    }));
}
