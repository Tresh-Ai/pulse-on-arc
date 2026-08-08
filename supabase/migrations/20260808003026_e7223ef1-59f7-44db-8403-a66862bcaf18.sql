-- POSTS
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'standard' CHECK (kind IN ('standard','image','chart','prediction','poll','announcement')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  image_url text,
  chart_symbol text,
  community_id text,
  prediction_id text,
  tags text[] NOT NULL DEFAULT '{}',
  like_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX posts_author_idx ON public.posts (author_id);
CREATE INDEX posts_parent_idx ON public.posts (parent_id);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are publicly viewable" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Members create their own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Members update their own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Members delete their own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER posts_touch_updated_at BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LIKES
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT ON public.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are publicly viewable" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Members like as themselves" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members remove their own likes" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- BOOKMARKS
CREATE TABLE public.post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_bookmarks TO authenticated;
GRANT ALL ON public.post_bookmarks TO service_role;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view their own bookmarks" ON public.post_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members create their own bookmarks" ON public.post_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members remove their own bookmarks" ON public.post_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FOLLOWS
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are publicly viewable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Members follow as themselves" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Members unfollow as themselves" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('like','reply','follow','mention','system')),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COUNTER + NOTIFICATION TRIGGERS
CREATE OR REPLACE FUNCTION public.on_post_like_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id
      RETURNING author_id INTO owner;
    IF owner IS NOT NULL AND owner <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, kind, post_id)
      VALUES (owner, NEW.user_id, 'like', NEW.post_id);
    END IF;
    RETURN NEW;
  ELSE
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;
CREATE TRIGGER post_likes_change AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.on_post_like_change();

CREATE OR REPLACE FUNCTION public.on_post_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE public.posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_id
        RETURNING author_id INTO owner;
      IF owner IS NOT NULL AND owner <> NEW.author_id THEN
        INSERT INTO public.notifications (user_id, actor_id, kind, post_id, body)
        VALUES (owner, NEW.author_id, 'reply', NEW.id, left(NEW.body, 140));
      END IF;
    END IF;
    RETURN NEW;
  ELSE
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE public.posts SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$;
CREATE TRIGGER posts_change AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.on_post_change();

CREATE OR REPLACE FUNCTION public.on_follow_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, kind)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$;
CREATE TRIGGER follows_insert AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.on_follow_insert();

-- increment views without granting broad updates
CREATE OR REPLACE FUNCTION public.increment_post_views(_post_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = _post_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_post_views(uuid) TO anon, authenticated;