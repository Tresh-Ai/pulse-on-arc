import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as social from "@/services/social";

/**
 * Mutations for the social graph. Everything writes to the backend and then
 * refreshes the affected caches, so the UI always reflects stored state.
 */

function useSocialMutation<TInput>(fn: (input: TInput) => Promise<unknown>, keys: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of keys) void queryClient.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    },
  });
}

export function useToggleLike() {
  return useSocialMutation(
    ({ postId, liked }: { postId: string; liked: boolean }) => social.setLike(postId, liked),
    ["feed", "post", "bookmarks", "profile"],
  );
}

export function useToggleBookmark() {
  return useSocialMutation(
    ({ postId, saved }: { postId: string; saved: boolean }) => social.setBookmark(postId, saved),
    ["feed", "post", "bookmarks", "profile"],
  );
}

export function useToggleFollow() {
  return useSocialMutation(
    ({ userId, following }: { userId: string; following: boolean }) =>
      social.setFollow(userId, following),
    ["feed", "profile", "suggested-users"],
  );
}

export function useCreatePost() {
  return useSocialMutation(
    (input: social.NewPost) => social.createPost(input),
    ["feed", "post", "profile", "bookmarks"],
  );
}

export function useDeletePost() {
  return useSocialMutation((id: string) => social.deletePost(id), [
    "feed",
    "post",
    "profile",
    "bookmarks",
  ]);
}

export function useMarkNotificationsRead() {
  return useSocialMutation(() => social.markNotificationsRead(), ["notifications"]);
}
