import { Link } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import type { Community, Prediction, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";
import { cn, formatCompact, formatUsd, timeRemaining } from "@/lib/utils";

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  const resolved = prediction.status === "resolved";
  return (
    <Link
      to={"/app/predictions/$predictionId" as never}
      params={{ predictionId: prediction.id } as never}
      className="block border-b border-border px-4 py-4 transition-colors hover:bg-elevated/25 sm:px-5"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge className="rounded-full bg-elevated text-[11px] font-medium text-foreground">
          {prediction.category}
        </Badge>
        {resolved ? (
          <Badge
            className={cn(
              "rounded-full text-[11px]",
              prediction.outcome === "yes"
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
            )}
          >
            Resolved {prediction.outcome?.toUpperCase()}
          </Badge>
        ) : (
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {timeRemaining(prediction.endsAt)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="size-3" /> {formatCompact(prediction.participants)}
        </span>
      </div>

      <h3 className="mt-2 text-[15px] font-bold leading-snug">{prediction.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{prediction.description}</p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-success transition-[width] duration-200"
          style={{ width: `${prediction.yesPercent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-success">YES {prediction.yesPercent}%</span>
        <span className="text-muted-foreground">
          {formatUsd(prediction.pool, { compact: true })} pool
        </span>
        <span className="font-semibold text-destructive">NO {100 - prediction.yesPercent}%</span>
      </div>
    </Link>
  );
}

export function UserRow({ user, showBio = true }: { user: User; showBio?: boolean }) {
  const app = useApp();
  const following = app.isFollowing(user);
  return (
    <div className="flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-elevated/25 sm:px-5">
      <Link to={"/app/u/$handle" as never} params={{ handle: user.username } as never}>
        <Avatar className="size-11">
          <AvatarImage src={user.avatar} alt="" />
          <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <Link
            to={"/app/u/$handle" as never}
            params={{ handle: user.username } as never}
            className="min-w-0 flex-1"
          >
            <p className="truncate text-[15px] font-bold">{user.displayName}</p>
            <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
          </Link>
          <Button
            size="sm"
            variant={following ? "outline" : "default"}
            onClick={() => app.toggleFollow(user.id)}
          >
            {following ? "Following" : "Follow"}
          </Button>
        </div>
        {showBio ? <p className="mt-1 line-clamp-2 text-sm">{user.bio}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatCompact(user.followers)} followers · {user.predictionAccuracy}% accuracy
        </p>
      </div>
    </div>
  );
}

export function CommunityCard({ community }: { community: Community }) {
  const app = useApp();
  const joined = app.isJoined(community.id, community.joined);
  return (
    <article className="surface-card overflow-hidden transition-transform duration-200 hover:-translate-y-1">
      <Link
        to={"/app/communities/$slug" as never}
        params={{ slug: community.slug } as never}
        className="block"
      >
        <img src={community.banner} alt="" className="h-24 w-full object-cover" loading="lazy" />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <img
              src={community.icon}
              alt=""
              className="size-10 rounded-2xl border border-border"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate font-bold">{community.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatCompact(community.members)} members · {community.onlineNow} online
              </p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{community.tagline}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Button
          className="w-full"
          variant={joined ? "outline" : "gradient"}
          onClick={() => app.toggleJoin(community.id)}
        >
          {joined ? "Joined" : "Join community"}
        </Button>
      </div>
    </article>
  );
}
