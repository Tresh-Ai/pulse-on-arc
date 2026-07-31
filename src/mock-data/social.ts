import type { AppNotification, Conversation, Message } from "@/types";
import { mediaUrl } from "@/lib/identity";
import { currentUser, users } from "./users";
import { agoMinutes, createRng, intBetween } from "./random";

const rng = createRng("notifications");

export const notifications: AppNotification[] = [
  {
    id: "n_1",
    kind: "like",
    actor: users[0],
    title: "liked your post",
    body: "Running a small prediction desk for a season taught me more about market structure...",
    at: agoMinutes(6),
    read: false,
    href: "/post/po_me_1",
  },
  {
    id: "n_2",
    kind: "prediction",
    title: "Market closing soon",
    body: "Stablecoin supply doubling closes in under 48 hours. Your NO position is currently ahead.",
    at: agoMinutes(22),
    read: false,
    href: "/predictions/p_3",
  },
  {
    id: "n_3",
    kind: "reply",
    actor: users[9],
    title: "replied to your post",
    body: "Stake weighted accuracy is the only metric I trust now.",
    at: agoMinutes(48),
    read: false,
    href: "/post/po_me_1",
  },
  {
    id: "n_4",
    kind: "follow",
    actor: users[3],
    title: "started following you",
    body: "Reading blocks so you do not have to.",
    at: agoMinutes(96),
    read: false,
    href: "/u/onchain_ops",
  },
  {
    id: "n_5",
    kind: "mention",
    actor: users[1],
    title: "mentioned you",
    body: "Agree with @you on sizing. The desk that survives is the one that sizes for the bad week.",
    at: agoMinutes(140),
    read: true,
    href: "/post/po_2",
  },
  {
    id: "n_6",
    kind: "community",
    actor: users[5],
    title: "invited you to DeFi Desk",
    body: "Yield, risk, and liquidity. 41 people you follow are members.",
    at: agoMinutes(260),
    read: true,
    href: "/communities/defi",
  },
  {
    id: "n_7",
    kind: "announcement",
    title: "Season two starts Monday",
    body: "Scoring switches to stake weighted accuracy and creator rooms get their own bracket.",
    at: agoMinutes(320),
    read: true,
    href: "/leaderboards",
  },
  {
    id: "n_8",
    kind: "prediction",
    title: "Market resolved YES",
    body: "ARC testnet validator count passed 250. Your position returned 640 USDC.",
    at: agoMinutes(1400),
    read: true,
    href: "/predictions/p_7",
  },
  {
    id: "n_9",
    kind: "like",
    actor: users[13],
    title: "liked your chart",
    body: "Thirty day performance on the settlement basket.",
    at: agoMinutes(1520),
    read: true,
    href: "/post/po_me_2",
  },
  {
    id: "n_10",
    kind: "follow",
    actor: users[17],
    title: "started following you",
    body: "Hunting real yield. Allergic to emissions.",
    at: agoMinutes(2100),
    read: true,
    href: "/u/yieldyara",
  },
];

const THREADS: { participantIndex: number; messages: [string, string][] }[] = [
  {
    participantIndex: 0,
    messages: [
      ["them", "Did you see the settled volume print this morning?"],
      ["me", "Yes, and fees stayed flat which is the actual story."],
      ["them", "Exactly what I put in the post. Want to co-author the follow up with the corridor data?"],
      ["me", "Send me the raw series and I will run the normalisation."],
      ["them", "Uploading now. It is one CSV per corridor, seven days each."],
    ],
  },
  {
    participantIndex: 1,
    messages: [
      ["them", "Your invalidation framing got quoted three times today."],
      ["me", "Good. It is the least glamorous idea I have and the most useful."],
      ["them", "Come on the Friday room and say it louder."],
    ],
  },
  {
    participantIndex: 9,
    messages: [
      ["me", "Question on the season two scoring change."],
      ["them", "Go ahead."],
      ["me", "Is stake weighted accuracy computed at entry or at resolution?"],
      ["them", "At entry. Otherwise late adds distort the weighting."],
    ],
  },
  {
    participantIndex: 4,
    messages: [
      ["them", "Rotation poll is at 41 percent for ARC ecosystem."],
      ["me", "That tracks with the bridge volume."],
    ],
  },
  {
    participantIndex: 12,
    messages: [
      ["them", "Two more remittance partners moved to test traffic."],
      ["me", "Same day close?"],
      ["them", "Same day. Their ops lead almost cried."],
    ],
  },
  {
    participantIndex: 7,
    messages: [
      ["them", "Sent you the queueing write up draft."],
      ["me", "Reading it tonight."],
    ],
  },
];

export const conversations: Conversation[] = THREADS.map((thread, i) => {
  const participant = users[thread.participantIndex]!;
  const last = thread.messages[thread.messages.length - 1]!;
  return {
    id: `cv_${i + 1}`,
    participant,
    lastMessage: last[1],
    lastAt: agoMinutes(intBetween(4, 2600, rng)),
    unread: i < 2 ? intBetween(1, 4, rng) : 0,
    typing: i === 0,
  };
});

export const messages: Message[] = THREADS.flatMap((thread, i) => {
  const conversationId = `cv_${i + 1}`;
  const participant = users[thread.participantIndex]!;
  const total = thread.messages.length;
  return thread.messages.map((entry, mi) => {
    const [who, body] = entry;
    const message: Message = {
      id: `${conversationId}_m${mi}`,
      conversationId,
      senderId: who === "me" ? currentUser.id : participant.id,
      body,
      at: agoMinutes((total - mi) * intBetween(7, 60, rng)),
      read: true,
    };
    if (i === 0 && mi === total - 1) {
      message.attachment = {
        type: "chart",
        url: mediaUrl("dm-chart", "Corridor volume, 7d"),
        caption: "corridor-volume-7d.csv preview",
      };
    }
    return message;
  });
});
