export const rules = {
  version: 'v1.0.0',
  budgetMin: 15_000_000,
  budgetMax: 35_000_000,
  budgetOverrun: 0.02,
  overrunMinScoreGain: 5,
  otherSystemPower: 75,
  headroomFactor: 1.25,
  priceMaxAgeHours: 48,
  suspectLow: 0.65,
  suspectHigh: 1.5,
  verdictThreshold: 0.07,
  scoreTieThreshold: 0.01,
  games: ['Valorant', 'League of Legends', 'Counter-Strike 2', 'Cyberpunk 2077', 'Black Myth: Wukong'],
  retailers: ['KCCShop', 'MemoryZone', 'An Phát PC', 'GearVN', 'HACOM', 'Phong Vũ', 'Tiki Trading', 'Shopee Mall'],
  targetFps: { Valorant: 144, 'League of Legends': 144, 'Counter-Strike 2': 144, 'Cyberpunk 2077': 60, 'Black Myth: Wukong': 60 },
} as const;

export type Game = typeof rules.games[number];
export type Resolution = '1080p' | '1440p';
export type Priority = 'FPS' | 'Quiet' | 'Compact' | 'No-RGB';
