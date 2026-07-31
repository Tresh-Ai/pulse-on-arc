# ARC Social Trading Network - Phase 1 Frontend Prototype

Goal: a complete, production-quality interactive prototype of the ARC social trading platform. All data mocked. No backend, no blockchain, no auth service, no database.

## One stack correction

The PRD asks for Next.js App Router. This project runs on TanStack Start (React 19 + Vite) with file-based routing, which is fixed and cannot be swapped. Everything else in the PRD is respected exactly: TypeScript, Tailwind, shadcn/ui, Framer Motion, Lucide icons, React Hook Form + Zod, TanStack Query (already installed), and a mock service layer. Routes live in `src/routes/` instead of `app/`.

ARC context is pulled from the Arc documentation (Arc is Circle's USDC-native chain), so mock tokens, balances, and ecosystem naming stay realistic: USDC as the settlement asset, ARC ecosystem projects, testnet-style addresses. No SDK is installed in Phase 1.

Also: the "—" character will not appear in any copy anywhere.

## Design system (applied globally first)

- Dark mode first. Two-color soft gradient background top-left to bottom-right, `#4F46E5` to `#06B6D4`, with subtle noise and blur layers for depth.
- Surfaces: `#0F172A` primary, `#111827` secondary, `#1E293B` elevated. Cards float above the gradient.
- Text: white / `#CBD5E1` / `#94A3B8` / `#64748B`. Accents: indigo, cyan, plus success, warning, danger.
- Radii: cards 20px, buttons and inputs 14px, dialogs 24px, avatars full. Soft large-blur low-opacity shadows only.
- Inter typography, generous spacing, few borders, minimal glassmorphism, animations under 300ms.
- All values become semantic tokens in `src/styles.css`; components never hardcode hex or `text-white`.

## Architecture

```text
src/
  routes/            file-based pages
  components/ui/     shadcn primitives (restyled to tokens)
  components/layout/ app shell, sidebar, topbar, mobile tab bar
  features/<domain>/ feed, profile, communities, predictions,
                     leaderboards, notifications, messages, search,
                     wallet, token, creator, settings, auth, onboarding
  services/          mock service layer (async, latency, error simulation)
  mock-data/         users, posts, communities, predictions, messages, wallet...
  hooks/ lib/ types/ store/
```

Every list/detail view reads through the mock service layer with TanStack Query, so each screen has real loading, empty, error, and populated states. Swapping in a real API later means changing only `services/`.

## Build order (screen by screen)

**Milestone 1: foundation**
Design tokens, gradient shell, animation primitives, app shell (desktop sidebar, tablet collapsed rail, mobile bottom tabs), mock data generators and service layer, shared components (post card, prediction card, user card, avatar, stat block, skeletons, empty states, modals, drawers).

**Milestone 2: auth and onboarding**
Sign in, sign up, wallet connect (UI only), forgot password, verify email, with validation, loading and error states. Onboarding flow: username, avatar upload preview, bio, interests, suggested creators.

**Milestone 3: home feed**
Feed with Following / Trending / Latest / ARC / Markets / Predictions filters. Composer supporting all post types (standard, image, chart, prediction, poll, announcement). Like, reply, repost, bookmark, share, follow interactions with optimistic UI. Post detail with threaded replies.

**Milestone 4: profiles and communities**
Profile with banner, stats, reputation, prediction accuracy, trading performance, achievements, pinned post, portfolio preview, tabbed content. Community directory, community page with posts, pinned, members, moderators, leaderboard, prediction rooms.

**Milestone 5: prediction markets**
Browse and filter markets, create prediction wizard, prediction detail (YES/NO voting, pool, discussion, rules, participants, voting history, timeline, related posts, outcome status), personal prediction history and stats.

**Milestone 6: discovery and social utilities**
Leaderboards (Top Traders, Top Predictors, Top Creators, Highest Reputation, Most Active x Daily/Weekly/Monthly/All Time). Notifications with grouping and unread state. Messages: inbox, conversation list, DM thread, typing indicator, online status, media preview. Search across users, posts, predictions, communities, tokens, trending topics.

**Milestone 7: wallet, token, creator, settings**
Wallet: balance, assets, activity, deposit / withdraw / send / receive flows as mocked modals, transaction history. Token page: info, price chart, market cap, supply, utility, activity. Creator dashboard: followers, demo revenue, subscribers, performance, prediction stats, engagement, top content. Settings: profile, account, security, appearance, notifications, privacy, wallet, language, connected accounts.

**Milestone 8: polish pass**
Responsive audit at mobile/tablet/desktop, keyboard navigation and focus rings, ARIA labels, heading hierarchy, page transitions, skeleton timing, per-route SEO metadata, dead-link check, and a sweep confirming no "—" characters in copy.

## Notes

- Landing route `/` becomes the authenticated home feed of the prototype, with auth screens reachable at `/auth/*` so the sign-in and onboarding flows can be demoed.
- Session state is mocked in a client store; no real credentials, tokens, or persistence layer.
- Light mode is out of scope for Phase 1, per the PRD.
