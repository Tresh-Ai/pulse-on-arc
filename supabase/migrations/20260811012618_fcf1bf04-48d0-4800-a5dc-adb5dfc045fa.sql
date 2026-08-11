REVOKE ALL ON FUNCTION public.on_position_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_position() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_post_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_post_like_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.on_follow_insert() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated;