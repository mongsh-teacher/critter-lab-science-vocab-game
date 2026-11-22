import {SpriteConfig} from './utils/helper';

/**
 * Configuration for Critter Lab.
 */
export const CONFIG = {
  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },
  title: {
    value: 'Critter Lab',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Theme Colors & Typography
  backgroundColor: {
    value: '#F5EFE6',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#10B981',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  secondaryColor: {
    value: '#F59E0B',
    type: 'color',
    label: 'Secondary Color',
    group: 'THEME',
  },
  accentColor: {
    value: '#38BDF8',
    type: 'color',
    label: 'Accent Color',
    group: 'THEME',
  },
  dangerColor: {
    value: '#F43F5E',
    type: 'color',
    label: 'Danger Color',
    group: 'THEME',
  },
  inkColor: {
    value: '#1E293B',
    type: 'color',
    label: 'Ink Color',
    group: 'THEME',
  },
  fontFamily: {
    value: '"Nunito", "Noto Sans TC", sans-serif',
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },
  pixelFontFamily: {
    value: '"Press Start 2P", monospace',
    type: 'string',
    label: 'Pixel Font Family',
    group: 'THEME',
  },

  // Audio
  defaultMusicVolume: {
    value: 0.3,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Gameplay Rules & Tuning
  startingHearts: {
    value: 3,
    type: 'number',
    label: 'Starting Quiz Hearts',
    group: 'Rules',
  },
  roundQuestionsCount: {
    value: 6,
    type: 'number',
    label: 'Questions Per Round',
    group: 'Rules',
  },
  matchPairsCount: {
    value: 6,
    type: 'number',
    label: 'Match Pairs Per Board',
    group: 'Rules',
  },
  basePointsPerCorrect: {
    value: 100,
    type: 'number',
    label: 'Base Points Per Correct',
    group: 'Rules',
  },
  streakBonusPoints: {
    value: 25,
    type: 'number',
    label: 'Streak Bonus Points',
    group: 'Rules',
  },
  xpPerCorrect: {
    value: 20,
    type: 'number',
    label: 'Companion XP Per Correct',
    group: 'Rules',
  },
  statDecayIntervalSec: {
    value: 1,
    type: 'number',
    label: 'Care Decay Interval (s)',
    group: 'Rules',
  },
  hungerDecayPerSec: {
    value: 1.5,
    type: 'number',
    label: 'Hunger Decay Per Second',
    group: 'Rules',
  },
  happinessDecayPerSec: {
    value: 1.3,
    type: 'number',
    label: 'Happiness Decay Per Second',
    group: 'Rules',
  },
  energyDecayPerSec: {
    value: 1.2,
    type: 'number',
    label: 'Energy Decay Per Second',
    group: 'Rules',
  },
  lowStatThreshold: {
    value: 30,
    type: 'number',
    label: 'Low Stat Warning Threshold',
    group: 'Rules',
  },
  criticalStatThreshold: {
    value: 15,
    type: 'number',
    label: 'Critical Sad Stat Threshold',
    group: 'Rules',
  },
  studyRoundHungerDrain: {
    value: 4,
    type: 'number',
    label: 'Study Round Hunger Drain',
    group: 'Rules',
  },
  studyRoundEnergyDrain: {
    value: 3,
    type: 'number',
    label: 'Study Round Energy Drain',
    group: 'Rules',
  },
  studyRoundHappinessDrain: {
    value: 2,
    type: 'number',
    label: 'Study Round Happiness Drain',
    group: 'Rules',
  },
  xpStage2Threshold: {
    value: 100,
    type: 'number',
    label: 'Stage 2 Evolution XP',
    group: 'Rules',
  },
  xpStage3Threshold: {
    value: 250,
    type: 'number',
    label: 'Stage 3 Evolution XP',
    group: 'Rules',
  },
  xpStage4Threshold: {
    value: 500,
    type: 'number',
    label: 'Stage 4 Evolution XP',
    group: 'Rules',
  },

  // Sanctuary Physics
  companionSpeed: {
    value: 240,
    type: 'number',
    label: 'Companion Walk Speed',
    group: 'Physics',
  },
  companionJumpVel: {
    value: -520,
    type: 'number',
    label: 'Companion Jump Velocity',
    group: 'Physics',
  },
  companionGravity: {
    value: 1500,
    type: 'number',
    label: 'Companion Gravity',
    group: 'Physics',
  },
  deskFloorY: {
    value: 632,
    type: 'number',
    label: 'Desk Surface Y',
    group: 'Physics',
  },

  // Assets Dimensions & Aspect Ratios (derived strictly from read_assets_metadata)
  assetSanctuaryBgAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Sanctuary BG Aspect Ratio',
    group: 'ASSETS',
  },
  assetSanctuaryBgWidth: {
    value: 1376,
    type: 'number',
    label: 'Sanctuary BG Width',
    group: 'ASSETS',
  },
  assetSanctuaryBgHeight: {
    value: 768,
    type: 'number',
    label: 'Sanctuary BG Height',
    group: 'ASSETS',
  },
  assetEggAspectRatio: {
    value: 454 / 620,
    type: 'number',
    label: 'Sprout Egg Aspect Ratio',
    group: 'ASSETS',
  },
  assetEggHeight: {
    value: 170,
    type: 'number',
    label: 'Sprout Egg Draw Height',
    group: 'ASSETS',
  },
  assetSproutlingAspectRatio: {
    value: 556 / 609,
    type: 'number',
    label: 'Mint Sproutling Aspect Ratio',
    group: 'ASSETS',
  },
  assetSproutlingHeight: {
    value: 185,
    type: 'number',
    label: 'Mint Sproutling Draw Height',
    group: 'ASSETS',
  },
  assetLynxFrameSize: {
    value: 512,
    type: 'number',
    label: 'Flask Lynx Frame Size',
    group: 'ASSETS',
  },
  assetLynxDrawSize: {
    value: 220,
    type: 'number',
    label: 'Flask Lynx Draw Size',
    group: 'ASSETS',
  },
  assetScholarFrameSize: {
    value: 512,
    type: 'number',
    label: 'Starlight Scholar Frame Size',
    group: 'ASSETS',
  },
  assetScholarDrawSize: {
    value: 235,
    type: 'number',
    label: 'Starlight Scholar Draw Size',
    group: 'ASSETS',
  },
  assetBiscuitAspectRatio: {
    value: 700 / 598,
    type: 'number',
    label: 'Star Biscuit Aspect Ratio',
    group: 'ASSETS',
  },
  assetBiscuitHeight: {
    value: 64,
    type: 'number',
    label: 'Star Biscuit Draw Height',
    group: 'ASSETS',
  },
  assetBubblesAspectRatio: {
    value: 752 / 445,
    type: 'number',
    label: 'Bubble Soap Aspect Ratio',
    group: 'ASSETS',
  },
  assetBubblesHeight: {
    value: 58,
    type: 'number',
    label: 'Bubble Soap Draw Height',
    group: 'ASSETS',
  },
  assetFlaskToyAspectRatio: {
    value: 701 / 660,
    type: 'number',
    label: 'Bouncy Toy Ball Aspect Ratio',
    group: 'ASSETS',
  },
  assetFlaskToyHeight: {
    value: 66,
    type: 'number',
    label: 'Bouncy Toy Ball Draw Height',
    group: 'ASSETS',
  },
  assetStarBadgeAspectRatio: {
    value: 332 / 598,
    type: 'number',
    label: 'Scholar Medal Aspect Ratio',
    group: 'ASSETS',
  },
  assetStarBadgeHeight: {
    value: 64,
    type: 'number',
    label: 'Scholar Medal Draw Height',
    group: 'ASSETS',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

export type ConfigKey = keyof typeof CONFIG;

export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

export const PRESETS = {};

export const TOTAL_LEVELS = 3;

export const CARE_ITEM_PRICES = {
  biscuit: 15,
  bubbles: 15,
  flask: 20,
} as const;

export const EVOLUTION_STAGES = [
  {
    stage: 1,
    name: 'Baby',
    zhName: '幼年期',
    minXp: 0,
    tagline: 'Cozy & curious — study to help your baby critter grow!',
  },
  {
    stage: 2,
    name: 'Young',
    zhName: '成長期',
    minXp: 100,
    tagline: 'Bouncy young buddy sporting a fresh lab ribbon!',
  },
  {
    stage: 3,
    name: 'Teen',
    zhName: '少年期',
    minXp: 250,
    tagline: 'Goggles on! Ready for bilingual science experiments.',
  },
  {
    stage: 4,
    name: 'Adult Scholar',
    zhName: '成年學者',
    minXp: 500,
    tagline: 'Lab coat & scholar specs — master of science wisdom!',
  },
] as const;

export const UNIT_NAMES: Record<1 | 2 | 3, {en: string; zh: string}> = {
  1: {en: 'Introducing Science', zh: '認識科學'},
  2: {en: 'Water', zh: '水'},
  3: {en: 'Looking at Living Things', zh: '觀察生物'},
};

export const LEVEL_NAMES: Record<1 | 2 | 3, {en: string; zh: string}> = {
  1: {en: 'Level 1 · Easy', zh: '初級'},
  2: {en: 'Level 2 · Medium', zh: '中級'},
  3: {en: 'Level 3 · Hard', zh: '高級'},
};
