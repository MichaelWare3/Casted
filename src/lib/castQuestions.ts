// Quick "describe yourself" questions for Cast Me. Each option carries weighted
// traits (from the shared trait vocabulary in casting.ts). The matcher aggregates
// the chosen options into a profile and finds the closest film character.

export interface CastOption {
  label: string
  traits: Record<string, number>
}

export interface CastQuestion {
  id: number
  prompt: string
  options: CastOption[]
}

export const CAST_QUESTIONS: CastQuestion[] = [
  {
    id: 1,
    prompt: 'How are you feeling right now?',
    options: [
      { label: 'Light and good', traits: { joyful: 3, calm: 1 } },
      { label: 'Heavy, a little sad', traits: { melancholy: 3, wounded: 1 } },
      { label: 'Angry or on edge', traits: { angry: 3, intense: 2 } },
      { label: 'Tired and worn', traits: { weary: 3, melancholy: 1 } },
    ],
  },
  {
    id: 2,
    prompt: 'What’s your energy like?',
    options: [
      { label: 'Still and watchful', traits: { calm: 2, controlled: 2, solitary: 1 } },
      { label: 'Coiled and intense', traits: { intense: 3, controlled: 1 } },
      { label: 'Always moving', traits: { impulsive: 3, free: 1 } },
      { label: 'Warm and easygoing', traits: { joyful: 2, social: 1, tender: 1 } },
    ],
  },
  {
    id: 3,
    prompt: 'When everything goes wrong, you:',
    options: [
      { label: 'Go quiet and strategize', traits: { controlled: 3, cerebral: 2, calm: 1 } },
      { label: 'Charge straight in', traits: { fearless: 3, impulsive: 2 } },
      { label: 'Improvise and adapt', traits: { free: 2, impulsive: 2, cerebral: 1 } },
      { label: 'Lean on the people you trust', traits: { loyal: 3, social: 2, tender: 1 } },
    ],
  },
  {
    id: 4,
    prompt: 'What drives you most?',
    options: [
      { label: 'Love and connection', traits: { romantic: 3, tender: 2 } },
      { label: 'Power and achievement', traits: { ambitious: 3, dark: 1 } },
      { label: 'Freedom and adventure', traits: { free: 3, rebellious: 1 } },
      { label: 'Truth and understanding', traits: { cerebral: 3, principled: 1 } },
      { label: 'Loyalty and protecting others', traits: { loyal: 3, protective: 2 } },
    ],
  },
  {
    id: 5,
    prompt: 'Among people, you’re:',
    options: [
      { label: 'The lone wolf', traits: { solitary: 3, free: 1 } },
      { label: 'Loyal to a chosen few', traits: { loyal: 3, principled: 1 } },
      { label: 'The magnetic center', traits: { magnetic: 3, social: 2 } },
      { label: 'The quiet observer', traits: { solitary: 2, cerebral: 2 } },
    ],
  },
  {
    id: 6,
    prompt: 'What do people misread about you?',
    options: [
      { label: 'My intensity', traits: { intense: 3, magnetic: 1 } },
      { label: 'My coldness', traits: { controlled: 2, dark: 2, solitary: 1 } },
      { label: 'My recklessness', traits: { impulsive: 3, rebellious: 2 } },
      { label: 'My need for control', traits: { controlled: 3, ambitious: 1 } },
      { label: 'My soft heart', traits: { tender: 3, wounded: 1 } },
    ],
  },
]
