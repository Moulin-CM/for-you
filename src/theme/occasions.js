// Occasion + recipient metadata. All copy defaults to warm, platonic tones.

export const OCCASIONS = {
  friendship: {
    id: 'friendship',
    label: 'Friendship Day',
    themeClass: 'theme-friendship',
    kicker: 'Happy Friendship Day',
    heroTitle: (name) => `To ${name || 'my friend'},`,
    lede: 'For every laugh, every rant survived together, every ordinary day you made a little brighter.',
    ornament: 'sun',
    defaultSignoff: 'always in your corner,',
    surprisesHeading: 'A few things I want you to know',
    galleryHeading: 'A little photo album of us',
    games: { album: 'bloom', message: 'stars' },
  },
  rakhi: {
    id: 'rakhi',
    label: 'Rakshabandhan',
    themeClass: 'theme-rakhi',
    kicker: 'Happy Rakshabandhan',
    heroTitle: (name) => `For ${name || 'my sister'},`,
    lede: 'A promise wrapped in a thread — I am here, I have always been, and I always will be.',
    ornament: 'thread',
    defaultSignoff: 'your (annoying but proud) sibling,',
    surprisesHeading: 'Little things I never say out loud',
    galleryHeading: 'Some moments I want to keep',
    games: { album: 'rakhi', message: 'sweetsBox' },
  },
  birthday: {
    id: 'birthday',
    label: 'Birthday',
    themeClass: 'theme-birthday',
    kicker: 'Happy Birthday',
    heroTitle: (name) => `Happiest Birthday, ${name || 'you'}!`,
    lede: 'One more trip around the sun for someone the world is genuinely lucky to have.',
    ornament: 'confetti',
    defaultSignoff: 'wishing you the softest year,',
    surprisesHeading: 'Wishes for your year ahead',
    galleryHeading: 'A tiny gallery of you',
    games: { album: 'candles', message: 'giftbox' },
  },
}

export const RECIPIENTS = {
  bestie: {
    id: 'bestie',
    label: 'Bestie',
    helperText: 'A close female friend — chosen family.',
  },
  'office-bestie': {
    id: 'office-bestie',
    label: 'Office Bestie',
    helperText: 'Your work sanity-keeper. Kept a bit more mellow by default.',
  },
  sister: {
    id: 'sister',
    label: 'Sister',
    helperText: 'Sister by blood.',
  },
  'sister-from-another': {
    id: 'sister-from-another',
    label: 'Sister from another mother',
    helperText: 'The friend who became family.',
  },
}

export const DEFAULT_OCCASION = 'friendship'
export const DEFAULT_RECIPIENT = 'bestie'

export function getOccasion(id) {
  return OCCASIONS[id] || OCCASIONS[DEFAULT_OCCASION]
}
export function getRecipient(id) {
  return RECIPIENTS[id] || RECIPIENTS[DEFAULT_RECIPIENT]
}
