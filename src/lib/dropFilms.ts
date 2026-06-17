export interface DropFilm {
  tmdb_id: number
  title: string
  year: number
  mood_tags: string[]
}

const dropFilms: DropFilm[] = [
  { tmdb_id: 1048522, title: 'Fremont', year: 2023, mood_tags: ['Quiet', 'Beautiful', 'Indie'] },
  { tmdb_id: 220289, title: 'Coherence', year: 2013, mood_tags: ['Mind-Bending', 'Sci-Fi', 'Unsettling'] },
  { tmdb_id: 491584, title: 'Burning', year: 2018, mood_tags: ['Slow Burn', 'Korean', 'Haunting'] },
  { tmdb_id: 293670, title: 'The Wailing', year: 2016, mood_tags: ['Thriller', 'Dark', 'Korean Cinema'] },
  { tmdb_id: 11830, title: 'Tampopo', year: 1985, mood_tags: ['Japanese', 'Warm', 'Delicious'] },
  { tmdb_id: 5511, title: 'Le Samouraï', year: 1967, mood_tags: ['French', 'Cool', 'Iconic'] },
  { tmdb_id: 29698, title: 'Ratcatcher', year: 1999, mood_tags: ['Lyrical', 'Devastating', 'Scottish'] },
  { tmdb_id: 11235, title: 'Local Hero', year: 1983, mood_tags: ['Quiet', 'Charming', 'Timeless'] },
  { tmdb_id: 18421, title: 'Climates', year: 2006, mood_tags: ['Turkish', 'Intimate', 'Stunning'] },
  { tmdb_id: 11490, title: 'The Child', year: 2005, mood_tags: ['Belgian', 'Raw', 'Dardenne'] },
  { tmdb_id: 31032, title: 'The Death of Mr. Lazarescu', year: 2005, mood_tags: ['Romanian', 'Dark Comedy', 'European'] },
  { tmdb_id: 505192, title: 'Shoplifters', year: 2018, mood_tags: ['Japanese', 'Tender', 'Heartbreaking'] },
  { tmdb_id: 60243, title: 'A Separation', year: 2011, mood_tags: ['Iranian', 'Tense', 'Masterpiece'] },
  { tmdb_id: 3782, title: 'Ikiru', year: 1952, mood_tags: ['Japanese', 'Life-Changing', 'Kurosawa'] },
  { tmdb_id: 14273, title: 'Dark Days', year: 2000, mood_tags: ['Documentary', 'NYC', 'Unforgettable'] },
  { tmdb_id: 11216, title: 'Cinema Paradiso', year: 1988, mood_tags: ['Nostalgic', 'Italian', 'Beautiful'] },
  { tmdb_id: 782, title: 'Gattaca', year: 1997, mood_tags: ['Sci-Fi', 'Elegant', 'Essential'] },
  { tmdb_id: 42188, title: 'Never Let Me Go', year: 2010, mood_tags: ['Sci-Fi', 'Emotional', 'Underseen'] },
  { tmdb_id: 503919, title: 'The Lighthouse', year: 2019, mood_tags: ['Psychological', 'Intense', 'Art House'] },
  { tmdb_id: 77, title: 'Memento', year: 2000, mood_tags: ['Thriller', 'Psychological', 'Brilliant'] },
  { tmdb_id: 666277, title: 'Past Lives', year: 2023, mood_tags: ['Romance', 'Quiet', 'Heartbreaking'] },
  { tmdb_id: 414453, title: 'Columbus', year: 2017, mood_tags: ['Architectural', 'Tender', 'Indie'] },
  { tmdb_id: 370755, title: 'Paterson', year: 2016, mood_tags: ['Quiet', 'Poetic', 'Routine'] },
  { tmdb_id: 428449, title: 'A Ghost Story', year: 2017, mood_tags: ['Meditative', 'Strange', 'Haunting'] },
  { tmdb_id: 965150, title: 'Aftersun', year: 2022, mood_tags: ['Memory', 'Devastating', 'A24'] },
  { tmdb_id: 394117, title: 'The Florida Project', year: 2017, mood_tags: ['Tender', 'Magical', 'American'] },
  { tmdb_id: 502033, title: 'Sound of Metal', year: 2019, mood_tags: ['Drama', 'Sensory', 'Powerful'] },
  { tmdb_id: 635731, title: 'Pig', year: 2021, mood_tags: ['Quiet', 'Unexpected', 'Tender'] },
  { tmdb_id: 615643, title: 'Minari', year: 2020, mood_tags: ['Family', 'Tender', 'American'] },
  { tmdb_id: 565310, title: 'The Farewell', year: 2019, mood_tags: ['Family', 'Bittersweet', 'Funny'] },
]

export default dropFilms

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0)
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor((now - start) / 86_400_000)
}

export function getDailySeed(date: Date = new Date()): number {
  return date.getFullYear() * 1000 + dayOfYear(date)
}

export function getFallbackDrop(seed: number = getDailySeed()): DropFilm {
  return dropFilms[seed % dropFilms.length]
}
