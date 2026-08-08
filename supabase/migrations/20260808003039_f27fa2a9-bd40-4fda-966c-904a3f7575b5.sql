DROP FUNCTION IF EXISTS public.increment_post_views(uuid);
REVOKE ALL ON FUNCTION public.on_post_like_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_post_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_follow_insert() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated;