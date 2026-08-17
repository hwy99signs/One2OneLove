export const LIVE_COMMUNITY_ROOMS = [
  {
    slug: "vent-room",
    name: "Vent Room",
    description: "Say what you need to say — without turning people into targets.",
    topic: "When you need to vent about your relationship, what do you actually want from the other person: advice, validation, or just somebody to listen?",
    accent: "rose",
    activeCount: null,
  },
  {
    slug: "modern-dating-unfiltered",
    name: "Modern Dating Unfiltered",
    description: "The good, the confusing, the funny, and the exhausting parts of dating now.",
    topic: "Has modern dating made people more selective — or just more afraid to commit?",
    accent: "violet",
    activeCount: null,
  },
  {
    slug: "love-talk",
    name: "Love Talk",
    description: "Connection, communication, affection, intimacy, and the everyday work of loving well.",
    topic: "What is one small thing your partner can do that makes you feel genuinely loved?",
    accent: "sky",
    activeCount: null,
  },
  {
    slug: "marriage-matters",
    name: "Marriage Matters",
    description: "For the conversations married people are actually having behind closed doors.",
    topic: "Should married couples combine all of their money, keep some separate, or does it depend on the marriage?",
    accent: "amber",
    activeCount: null,
  },
  {
    slug: "starting-over",
    name: "Starting Over",
    description: "Dating again, rebuilding confidence, healing, and figuring out what comes next.",
    topic: "How do you know when you are actually ready to date again instead of just trying to stop feeling lonely?",
    accent: "emerald",
    activeCount: null,
  },
];

export function getLiveCommunityRoom(slug) {
  return LIVE_COMMUNITY_ROOMS.find((room) => room.slug === slug) || LIVE_COMMUNITY_ROOMS[2];
}

export function getRoomActivityLabel(room) {
  if (typeof room.activeCount === "number" && room.activeCount > 0) {
    return `${room.activeCount} chatting now`;
  }

  return null;
}
