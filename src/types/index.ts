export interface QuizAnswer {
  question: string
  answer: string
}

export interface AlterEgoCharacter {
  character_name: string
  actor_name: string
  film_of_origin: string
  year: number
  description: string
  tmdb_search_queries: string[]
  vibe_tags: string[]
  /** Subtle "why this is you" line tying the viewer to the character. */
  match_line?: string
}

export interface TMDBMovie {
  id: number
  title: string
  original_title?: string
  release_date?: string
  poster_path: string | null
  backdrop_path?: string | null
  overview?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
}

export interface TMDBSearchResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface TheaterMovie {
  id: number
  title: string
  year: string
  poster_path: string | null
  added_at: number
  /** Whether the user has marked this film as watched. */
  watched?: boolean
  /** User rating, 1–5. Implies watched. */
  rating?: number
  /** Timestamp the film was first marked watched. */
  watched_at?: number
}

export interface QuizQuestion {
  id: number
  prompt: string
  prompt_film_head?: string
  options: { letter: 'A' | 'B' | 'C'; text: string }[]
}

export interface DirectorAnswer {
  question: string
  answer: string
}

export interface DirectorPick {
  title: string
  year: number
  tmdb_search: string
  director_name: string
  runtime_minutes: number
  personal_reason: string
  vibe_tags: string[]
}

export interface TMDBVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime?: number | null
  credits?: {
    crew?: TMDBCrewMember[]
  }
}
