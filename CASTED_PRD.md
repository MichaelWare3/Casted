# CASTED — Product Requirements Document
### Version 1.0 | Demo Build | AI-Powered Movie Identity & Recommendation Platform

---

## 🎬 WHAT WE'RE BUILDING

**CASTED** is a dark-cinema AI movie recommendation web app with a signature feature no platform has ever built: **The Alter Ego** — a cinematic personality experience that assigns users a famous film character based on how they answer 5 unexpected questions, then delivers hyper-personalized movie recommendations from that character's world.

The site has two modes, a warm and hype personality, and is designed to be screenshot-worthy, shareable, and feel like nothing else on the internet.

**Tagline:** *"Find yourself in film."*
**Demo build** — no auth, no database, no payments. Pure front-end experience powered by TMDB API + Claude AI.

---

## 🧱 TECH STACK

| Layer | Technology |
|---|---|
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| AI Brain | Claude API (`claude-sonnet-4-6`) via Anthropic |
| Movie Data | TMDB API (free — themoviedb.org) |
| Trailers | YouTube embed (via TMDB video endpoint) |
| Animations | Framer Motion |
| Fonts | Google Fonts — `Playfair Display` (display) + `Inter` (body) |
| Deployment | Vercel |
| Icons | Lucide React |

---

## 🎨 VISUAL IDENTITY

**Aesthetic:** Dark cinema. Think: a vintage movie palace at midnight. Film grain. Gold light bleeding through darkness.

### Color Palette
```
--casted-black:    #0A0A0B   (near-true black, main background)
--casted-dark:     #111114   (card backgrounds)
--casted-charcoal: #1C1C21   (elevated surfaces)
--casted-gold:     #C9A84C   (primary accent — spotlight gold)
--casted-amber:    #E8B84B   (hover states, highlights)
--casted-cream:    #F2ECD8   (primary text on dark)
--casted-muted:    #6B6B7A   (secondary text, labels)
--casted-red:      #C0392B   (danger, dramatic moments)
```

### Typography
- **Display:** `Playfair Display` — italic, dramatic, cinematic weight for titles and reveals
- **Body:** `Inter` — clean, readable, modern for UI elements
- **Accent:** `Playfair Display SC` (small caps) for labels, section headers

### Signature Design Elements
- **Film grain overlay** — subtle CSS noise texture across entire app (CSS pseudo-element, low opacity)
- **Vignette edges** — soft dark falloff on hero sections
- **Gold spotlight glow** — radial gradient behind key CTAs and reveal moments
- **Poster card style** — movie cards with sharp corners, gold border on hover, poster-ratio aspect
- **Cinematic transitions** — Framer Motion fade + slight upward drift between pages/steps

---

## 📁 SITE ARCHITECTURE

```
/ (Homepage)
├── Hero Section — Animated tagline + dual mode entry
├── Mode Toggle — "Just Watch" vs "Film Head"
└── CTA → Enter Alter Ego

/alter-ego (The WOW Feature)
├── Step 1–5: Interview Questions (animated, one at a time)
├── Loading: Cinematic "Developing your character..." screen
└── Reveal: Your Alter Ego character + 6 movie recommendations

/director (Director's Chair — AI Interview)
├── Conversational AI flow (3–5 questions)
├── Claude picks one perfect film for tonight
└── Film detail card with trailer embed

/drop (The Daily Drop)
├── Mystery film of the day
├── Cryptic clue (not the title)
└── Reveal button → full film card

/theater (Your Theater — Watchlist)
├── Marquee-style saved films display
└── Local storage only (demo build)
```

---

## ⭐ FEATURE 1: THE ALTER EGO (BUILD THIS FIRST)

This is the entire soul of CASTED. Build this feature completely before anything else.

### How It Works

**Step 1 — The Interview (5 Questions)**

Display one question at a time. Full screen. Dramatic. Each question has 3 answer options styled as large clickable tiles. No progress bar — feels like a scene unfolding, not a quiz.

**The 5 Questions + Options:**

```
Q1: "It's 2am. Where are you?"
  A) Alone at a window, city below me
  B) In a crowd but somehow invisible
  C) Exactly where I'm supposed to be

Q2: "Someone wrongs you. What happens next?"
  A) I remember everything and say nothing
  B) I confront it — right now, directly
  C) I disappear and let time handle it

Q3: "Pick the one that feels like you tonight:"
  A) A cigarette left burning in an ashtray
  B) A door slightly open in a dark hallway
  C) A street light flickering back on

Q4: "What do you want from a movie tonight?"
  A) To feel something I can't name
  B) To escape completely
  C) To see someone fight back

Q5: "Last question. Pick a texture:"
  A) Worn leather
  B) Cold glass
  C) Rough concrete
```

**Step 2 — The Loading Screen**

After Q5, full black screen. Animated film reel or grain texture. Text fades in:
*"Developing your character..."*
Then: *"Scanning 10,000 films..."*
Then: *"You've been CASTED."*
Duration: ~3 seconds. Pure theater.

**Step 3 — The Reveal**

Cinematic full-screen reveal. Big Playfair Display italic text:

```
Tonight, you are

VINCENT VEGA
```

Followed by a one-line character description in the site's warm, hype voice:
*"Charismatic, unpredictable, living completely in the moment. You don't plan the night — you become it."*

Then: 6 movie recommendation cards pulled from TMDB based on the character mapped by Claude AI.

### Claude AI Logic for Alter Ego

Send answers to Claude API with this system prompt:

```
You are the AI brain of CASTED, a cinematic personality platform.
Based on the user's 5 answers, do two things:

1. Assign them ONE iconic film character from cinema history. 
   Choose from characters with strong, recognizable personalities.
   Examples: Vincent Vega, Ellen Ripley, Amélie Poulain, Travis Bickle, 
   The Dude, Clarice Starling, Tyler Durden, Marge Gunderson, 
   Ennis Del Mar, Annalise Keating, Maximus, Jules Winnfield,
   Lara Croft, Leon the Professional, Lisbeth Salander, etc.
   Pick the character that genuinely matches the answer pattern.

2. Return a JSON object with this exact structure:
{
  "character_name": "Vincent Vega",
  "film_of_origin": "Pulp Fiction",
  "year": 1994,
  "description": "Charismatic, unpredictable, living completely in the moment. You don't plan the night — you become it.",
  "tmdb_search_queries": ["Pulp Fiction", "Goodfellas", "Drive", "Collateral", "Heat", "The Departed"],
  "vibe_tags": ["Cool", "Unpredictable", "Stylish", "Night Energy"]
}

tmdb_search_queries should be 6 films that match the CHARACTER's energy and world —
not just films from the same genre. Think thematically and emotionally.
Return ONLY the JSON object. No explanation.
```

Use the `tmdb_search_queries` to fetch real movies from TMDB API and display as recommendation cards.

---

## ⭐ FEATURE 2: DIRECTOR'S CHAIR

A conversational AI that picks ONE perfect film for you tonight through a short interview. Warmer and more casual than the Alter Ego — this is your movie nerd friend talking to you.

### Flow

Claude asks 3–4 questions conversationally (text chat style, but styled cinematically):
- *"Who are you watching with tonight?"*
- *"Last movie you loved — what was it?"*
- *"What do you NOT want to feel tonight?"*
- *"How much time do you have?"*

Then Claude returns ONE film pick with:
- Title, year, poster (TMDB)
- A personal reason *why* this film for *you* tonight (warm, specific, hype)
- Runtime, rating
- Embedded YouTube trailer (via TMDB video API)
- Where to stream it (static suggestion — e.g., "Check Netflix or Prime")

### Claude System Prompt for Director's Chair

```
You are the Director — the AI movie expert behind CASTED. 
Your personality: warm, genuinely excited about film, 
specific and surprising in your picks. You feel like the coolest 
film nerd friend someone has. You never recommend the obvious choice.

After receiving the user's answers, pick ONE perfect film for tonight.
Return this JSON:
{
  "title": "Lost in Translation",
  "year": 2003,
  "tmdb_search": "Lost in Translation 2003",
  "personal_reason": "You said you want to feel something quiet tonight. This film doesn't try to explain itself — it just sits next to you.",
  "vibe_tags": ["Quiet", "Late Night", "Solo Watch"],
  "director": "Sofia Coppola",
  "runtime_minutes": 102
}
Return ONLY the JSON. No explanation.
```

---

## ⭐ FEATURE 3: THE DAILY DROP

A mystery film drops every day at midnight. Users don't see the title — they get a cryptic clue and a visual mood board (poster blurred or gradient placeholder).

### Implementation
- Pick today's film based on the current date (deterministic — same film all day for everyone)
- Pull a curated list of 30 films (one per day cycling) — hardcode these into the app
- Show: cryptic clue, genre tags, runtime, year — but NOT the title
- "Reveal" button animates the title in with a dramatic Framer Motion reveal
- After reveal: show poster, trailer embed, full info

### Example Drop Entry
```javascript
{
  date_index: 0, // day 0 of the cycle
  tmdb_id: 13, // Forrest Gump
  clue: "A box of something sweet. A bench. A lifetime of not knowing where you'll end up.",
  mood_tags: ["Heartwarming", "Epic", "American Classic"]
}
```

---

## ⭐ FEATURE 4: DUAL MODE (JUST WATCH / FILM HEAD)

A toggle in the nav and on the homepage switches the entire site personality.

| | Just Watch Mode | Film Head Mode |
|---|---|---|
| Language | Casual, fast, fun | Cinephile, layered, specific |
| Alter Ego questions | Same questions, more casual framing | Same questions, more poetic framing |
| Rec cards | Title, poster, vibe tags, rating | Title, director, year, themes, cinematographer |
| Director's Chair | "What's the vibe tonight?" | "What are you trying to feel cinematically?" |
| Color accent | Warm amber | Deep gold |

Store mode in React state (no persistence needed for demo).

---

## ⭐ FEATURE 5: YOUR THEATER (WATCHLIST)

Styled like a vintage movie palace marquee. Films saved via the "Add to Theater" button on any recommendation card.

- Store in `localStorage` (demo build)
- Display as large vintage poster cards in a horizontal scroll
- Header: **"NOW PLAYING IN YOUR THEATER"** in marquee-style all-caps Playfair Display
- Each card: poster, title, year, remove button

---

## 🎞️ TMDB API INTEGRATION

**Base URL:** `https://api.themoviedb.org/3`
**Free API key:** Register at themoviedb.org (free tier, no credit card)
**Image Base:** `https://image.tmdb.org/t/p/w500{poster_path}`

### Key Endpoints to Use
```
Search movie:     GET /search/movie?query={title}&api_key={key}
Movie details:    GET /movie/{id}?api_key={key}
Movie videos:     GET /movie/{id}/videos?api_key={key}  (gets YouTube trailer key)
Trending today:   GET /trending/movie/day?api_key={key}
```

### Environment Variables (.env)
```
VITE_TMDB_API_KEY=your_tmdb_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
```

---

## 🗂️ COMPONENT ARCHITECTURE

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          — Logo, mode toggle, Theater link
│   │   └── FilmGrainOverlay.tsx — CSS grain texture (fixed, full-screen)
│   ├── alter-ego/
│   │   ├── AlterEgoQuiz.tsx    — Question flow controller
│   │   ├── QuestionCard.tsx    — Single question + 3 answer tiles
│   │   ├── LoadingReveal.tsx   — "Developing your character..." screen
│   │   └── EgoReveal.tsx       — Character + 6 recs reveal screen
│   ├── director/
│   │   ├── DirectorChat.tsx    — Conversational question flow
│   │   └── FilmPick.tsx        — Single film recommendation card w/ trailer
│   ├── drop/
│   │   └── DailyDrop.tsx       — Mystery film of the day
│   ├── theater/
│   │   └── YourTheater.tsx     — Watchlist marquee display
│   └── shared/
│       ├── MovieCard.tsx       — Reusable poster card component
│       ├── TrailerModal.tsx    — YouTube embed modal
│       └── ModeToggle.tsx      — Just Watch / Film Head toggle
├── pages/
│   ├── Home.tsx
│   ├── AlterEgo.tsx
│   ├── Director.tsx
│   ├── Drop.tsx
│   └── Theater.tsx
├── hooks/
│   ├── useTMDB.ts              — TMDB API calls
│   ├── useClaude.ts            — Claude API calls
│   └── useTheater.ts           — localStorage watchlist
├── lib/
│   ├── tmdb.ts                 — TMDB API utility functions
│   ├── claude.ts               — Claude API utility functions
│   └── dropFilms.ts            — Hardcoded daily drop film list (30 films)
├── types/
│   └── index.ts                — TypeScript interfaces
└── styles/
    └── globals.css             — Film grain, vignette, custom scrollbar
```

---

## 📐 PAGE-BY-PAGE SPECS

### Homepage (`/`)
- **Hero:** Full viewport. Dark background. Film grain overlay. Center: `CASTED` in massive Playfair Display italic. Below: tagline *"Find yourself in film."*
- **Entry CTA:** Two large buttons — `[ Discover Your Alter Ego ]` `[ Just Pick Me Something ]`
- **Mode toggle:** Top right of nav — pill toggle `Just Watch | Film Head`
- **Below fold:** Brief animated showcase of 3 trending films from TMDB (poster cards, no text heavy)
- **NO hero video** — the grain texture and typography IS the hero

### Alter Ego Page (`/alter-ego`)
- Full black background, no nav during quiz
- Questions appear one at a time with Framer Motion fade-in
- Answer tiles: large, dark bordered, gold glow on hover, click locks in answer
- After Q5: automatic transition to loading screen → reveal
- Reveal page: character name massive on screen, description, then 6 cards below
- Share button: *"I'm [Character] tonight"* → copies text to clipboard

### Director's Chair (`/director`)
- Chat-style UI but cinematic — dark bubbles, gold text for Director's messages
- Director speaks first: *"Welcome. I'm going to find your film for tonight."*
- 3-4 questions, user types or selects quick-reply chips
- Loading: *"Consulting the archives..."*
- Film reveal: full card with trailer button

---

## 🎭 SITE VOICE & COPY GUIDE

CASTED speaks like your most enthusiastic, knowledgeable film friend. These rules govern every line of copy:

- **Warm but not cringe.** Excited, not corporate.
- **Specific, not vague.** Not *"great film"* — *"the kind of film that sits with you for three days."*
- **Never say "algorithm."** Say *"the archives"* or *"our instincts"* or *"the reel."*
- **Hype the user.** Make them feel like their taste is cool, even if they only watch Marvel.
- **Film grain everything.** Even error states get cinematic copy: *"The reel snapped. Try again."*

### Example Copy Moments
```
Loading states:
  "Scanning the archives..."
  "Rolling film..."  
  "Developing your character..."
  "Consulting the Director..."

Empty theater:
  "Your theater is dark. Let's change that."

Error state:
  "The reel snapped. Refresh and we'll try again."

After Alter Ego reveal:
  "This is your cinema tonight. Own it."
```

---

## 📋 BUILD PHASE ORDER FOR CLAUDE CODE

Follow this sequence exactly. Complete each phase before moving to the next.

```
PHASE 1 — Foundation
  [ ] Vite + React + TypeScript + Tailwind setup
  [ ] Install: framer-motion, lucide-react, react-router-dom
  [ ] Set up .env with TMDB + Anthropic API keys
  [ ] Create color palette in tailwind.config.ts
  [ ] FilmGrainOverlay component (CSS only, fixed position)
  [ ] Basic router setup (5 routes)

PHASE 2 — Alter Ego (THE WOW)
  [ ] QuestionCard component (question + 3 answer tiles)
  [ ] AlterEgoQuiz controller (step through 5 questions, collect answers)
  [ ] useClaude hook → send answers → get character JSON back
  [ ] LoadingReveal screen (animated text sequence)
  [ ] EgoReveal screen (character name + description)
  [ ] useTMDB hook → search the 6 film queries → return movie data
  [ ] MovieCard component (poster, title, year, vibe tags)
  [ ] "Add to Theater" button on MovieCard → useTheater hook
  [ ] Share button on reveal (copy to clipboard)

PHASE 3 — Homepage
  [ ] Hero section (CASTED logo, tagline, two CTAs)
  [ ] ModeToggle component (Just Watch / Film Head)
  [ ] Trending films row (TMDB /trending/movie/day)
  [ ] Navbar

PHASE 4 — Director's Chair
  [ ] DirectorChat UI (message bubbles, input)
  [ ] Question sequence (3-4 questions from Claude)
  [ ] Film pick reveal (FilmPick component)
  [ ] TrailerModal (YouTube embed via TMDB videos endpoint)

PHASE 5 — Daily Drop
  [ ] dropFilms.ts (hardcode 30 films with clues)
  [ ] Date-to-index logic (deterministic daily pick)
  [ ] DailyDrop page (clue display, blur effect, reveal button)

PHASE 6 — Your Theater
  [ ] useTheater hook (localStorage read/write)
  [ ] YourTheater page (marquee header, poster grid, remove button)

PHASE 7 — Polish
  [ ] Framer Motion page transitions
  [ ] Dual mode logic (pass mode through React context)
  [ ] Mobile responsiveness
  [ ] Film grain + vignette CSS refinement
  [ ] Copy pass (all UI text matches voice guide)
```

---

## 🔑 API KEYS NEEDED BEFORE BUILD

1. **TMDB API Key** — Free at: https://www.themoviedb.org/settings/api
   - Takes ~2 minutes, no credit card
   - Free tier: 40 requests/10 seconds (more than enough)

2. **Anthropic API Key** — https://console.anthropic.com
   - Used for Alter Ego character mapping + Director's Chair film picks
   - claude-sonnet-4-6 model

---

## 🚫 DEMO BUILD CONSTRAINTS

- No user authentication
- No database — localStorage only for watchlist
- No real streaming links (use "Check Netflix / Prime / Max" as static suggestion)
- No payments
- No user-generated reviews (Phase 2 of product roadmap)
- Mobile responsive but not a native app

---

## 🗺️ FUTURE ROADMAP (POST-DEMO)

These are NOT in scope for this build. Document them for the client conversation:

- User profiles + Supabase backend
- Social features: share your Alter Ego, follow friends' Theaters
- Real streaming availability via JustWatch API
- Weekly "Film Club" — CASTED picks one film the whole community watches
- Alter Ego history — see all your past characters
- CASTED Score — your evolving taste profile visualized
- Mobile app (React Native)

---

*PRD Version 1.0 — CASTED Demo Build*
*Stack: React + TypeScript + Vite + Tailwind + Framer Motion + TMDB API + Anthropic Claude API*
*Deployment: Vercel*
