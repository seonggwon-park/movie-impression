# 여운

Deployed demo: [https://movie-impression-ihvaenxcg-seonggwon-park-s-projects.vercel.app/](https://movie-impression-ihvaenxcg-seonggwon-park-s-projects.vercel.app/)

여운 is a movie impression archive where users record the emotions and short impressions that remain after watching a film. The product focuses on 감상, mood, and personal memory instead of formal reviews or rating-first movie criticism.

## Current MVP Status

- Cinematic landing page
- Movie browsing page
- Movie detail page
- Lightweight impression creation form
- Personal archive page
- Placeholder data only

Supabase, TMDb, authentication, and persistent saving are not implemented yet.

## Planned Features

- Supabase database
- Authentication
- Saving impressions
- TMDb movie search
- Real emotion statistics

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JavaScript client
- Vercel
- Planned: Supabase database, authentication, TMDb API

## Supabase Environment Setup

Supabase is configured at the client level, but the current MVP still uses placeholder data. To prepare local environment variables, copy `.env.example` to `.env.local` and fill in your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not commit `.env.local`; it is already ignored by git.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app locally.
