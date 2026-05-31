# 여운

Deployed demo: [https://movie-impression-ihvaenxcg-seonggwon-park-s-projects.vercel.app/](https://movie-impression-ihvaenxcg-seonggwon-park-s-projects.vercel.app/)

여운 is a movie impression archive where users record the emotions and short impressions that remain after watching a film. The product focuses on 감상, mood, and personal memory instead of formal reviews or rating-first movie criticism.

## Current MVP Status

- Cinematic landing page
- Movie browsing page with TMDb movie search
- Movie detail page with emotion distribution
- Lightweight impression creation form
- Personal archive page
- Basic email/password authentication
- Supabase-backed impression saving
- Local movie upsert from selected TMDb search results

## Planned Features

- TMDb movie search inside the impression form
- Better movie metadata sync
- Edit/delete saved impressions
- Real booking links per movie
- Curated critic review management

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JavaScript client
- TMDb API
- Vercel

## Environment Setup

Copy `.env.example` to `.env.local` and fill in the local values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
TMDB_API_KEY=your-tmdb-api-key
```

`TMDB_API_KEY` is used only by server-side route handlers and should not use the `NEXT_PUBLIC_` prefix. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the browser. The movie upsert API uses it to write through Supabase RLS. Never commit `.env.local`; it is already ignored by git.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app locally.
