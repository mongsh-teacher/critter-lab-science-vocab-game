import React, {useEffect, useRef} from 'react';
import {EVOLUTION_STAGES} from './constants';

export type CritterSpeciesId =
  | 'cat'
  | 'puppy'
  | 'rabbit'
  | 'fox'
  | 'hamster'
  | 'panda'
  | 'bear'
  | 'penguin'
  | 'duck'
  | 'owl'
  | 'frog'
  | 'turtle'
  | 'hedgehog'
  | 'red_panda'
  | 'koala'
  | 'otter'
  | 'squirrel'
  | 'fawn'
  | 'capybara'
  | 'alpaca';

export interface CritterPalette {
  body: string;
  bodyShade: string;
  belly: string;
  accent: string;
  earInner: string;
  cheek: string;
  accessory: string;
}

export interface CritterTraits {
  earType:
    | 'pointed'
    | 'floppy'
    | 'long'
    | 'round'
    | 'tiny_round'
    | 'tuft'
    | 'none';
  tailType:
    | 'curl'
    | 'wag'
    | 'puff'
    | 'bushy'
    | 'nub'
    | 'flipper'
    | 'flat'
    | 'none';
  snoutType: 'whiskers' | 'muzzle' | 'beak' | 'wide' | 'frog' | 'nose';
  special:
    | 'calico'
    | 'spots'
    | 'eye_patches'
    | 'mask'
    | 'shell'
    | 'quills'
    | 'wings'
    | 'antlers'
    | 'yuzu'
    | 'wool'
    | 'bib'
    | 'cheek_pouches'
    | 'belly_stripe'
    | 'none';
}

export interface CritterSpecies {
  id: CritterSpeciesId;
  enName: string;
  zhName: string;
  defaultPetName: string;
  personality: string;
  palette: CritterPalette;
  traits: CritterTraits;
}

export const CRITTER_SPECIES: CritterSpecies[] = [
  {
    id: 'cat',
    enName: 'Cat',
    zhName: '小貓',
    defaultPetName: 'Mochi',
    personality: 'Curious whisker-twitching lab assistant!',
    palette: {
      body: '#FDBA74',
      bodyShade: '#F59E0B',
      belly: '#FFFBEB',
      accent: '#92400E',
      earInner: '#FDA4AF',
      cheek: '#FB7185',
      accessory: '#10B981',
    },
    traits: {
      earType: 'pointed',
      tailType: 'curl',
      snoutType: 'whiskers',
      special: 'calico',
    },
  },
  {
    id: 'puppy',
    enName: 'Puppy',
    zhName: '小狗',
    defaultPetName: 'Biscuit',
    personality: 'Tail-wagging helper who loves spelling!',
    palette: {
      body: '#FCD34D',
      bodyShade: '#D97706',
      belly: '#FEF3C7',
      accent: '#78350F',
      earInner: '#F59E0B',
      cheek: '#FDA4AF',
      accessory: '#38BDF8',
    },
    traits: {
      earType: 'floppy',
      tailType: 'wag',
      snoutType: 'muzzle',
      special: 'spots',
    },
  },
  {
    id: 'rabbit',
    enName: 'Rabbit',
    zhName: '小兔',
    defaultPetName: 'Clover',
    personality: 'Springy-eared note-taker with speedy hops!',
    palette: {
      body: '#FFF1F2',
      bodyShade: '#FECDD3',
      belly: '#FFFFFF',
      accent: '#FB7185',
      earInner: '#FDA4AF',
      cheek: '#FB7185',
      accessory: '#A855F7',
    },
    traits: {
      earType: 'long',
      tailType: 'puff',
      snoutType: 'whiskers',
      special: 'none',
    },
  },
  {
    id: 'fox',
    enName: 'Fox',
    zhName: '小狐狸',
    defaultPetName: 'Ember',
    personality: 'Clever puzzle-solver with a fluffy tail!',
    palette: {
      body: '#FB923C',
      bodyShade: '#EA580C',
      belly: '#FFF7ED',
      accent: '#431407',
      earInner: '#FED7AA',
      cheek: '#FDBA74',
      accessory: '#0EA5E9',
    },
    traits: {
      earType: 'pointed',
      tailType: 'bushy',
      snoutType: 'muzzle',
      special: 'bib',
    },
  },
  {
    id: 'hamster',
    enName: 'Hamster',
    zhName: '倉鼠',
    defaultPetName: 'Pip',
    personality: 'Round cheek-pouch snacker who adores flashcards!',
    palette: {
      body: '#FDE68A',
      bodyShade: '#F59E0B',
      belly: '#FFFBEB',
      accent: '#B45309',
      earInner: '#FDA4AF',
      cheek: '#FB7185',
      accessory: '#EC4899',
    },
    traits: {
      earType: 'tiny_round',
      tailType: 'nub',
      snoutType: 'whiskers',
      special: 'cheek_pouches',
    },
  },
  {
    id: 'panda',
    enName: 'Panda',
    zhName: '熊貓',
    defaultPetName: 'Bao',
    personality: 'Calm bamboo-munching science observer!',
    palette: {
      body: '#F8FAFC',
      bodyShade: '#E2E8F0',
      belly: '#FFFFFF',
      accent: '#1E293B',
      earInner: '#334155',
      cheek: '#FDA4AF',
      accessory: '#10B981',
    },
    traits: {
      earType: 'round',
      tailType: 'puff',
      snoutType: 'muzzle',
      special: 'eye_patches',
    },
  },
  {
    id: 'bear',
    enName: 'Bear',
    zhName: '小熊',
    defaultPetName: 'Honey',
    personality: 'Cozy study buddy with big warm hugs!',
    palette: {
      body: '#D97706',
      bodyShade: '#B45309',
      belly: '#FEF3C7',
      accent: '#78350F',
      earInner: '#FDE68A',
      cheek: '#FB7185',
      accessory: '#EF4444',
    },
    traits: {
      earType: 'round',
      tailType: 'nub',
      snoutType: 'muzzle',
      special: 'none',
    },
  },
  {
    id: 'penguin',
    enName: 'Penguin',
    zhName: '企鵝',
    defaultPetName: 'Pebble',
    personality: 'Waddling water-unit specialist!',
    palette: {
      body: '#334155',
      bodyShade: '#1E293B',
      belly: '#F8FAFC',
      accent: '#F59E0B',
      earInner: '#64748B',
      cheek: '#FDA4AF',
      accessory: '#38BDF8',
    },
    traits: {
      earType: 'none',
      tailType: 'flipper',
      snoutType: 'beak',
      special: 'wings',
    },
  },
  {
    id: 'duck',
    enName: 'Duck',
    zhName: '小鴨',
    defaultPetName: 'Sunny',
    personality: 'Cheerful splashing experimenter!',
    palette: {
      body: '#FDE047',
      bodyShade: '#EAB308',
      belly: '#FEF9C3',
      accent: '#F97316',
      earInner: '#FACC15',
      cheek: '#FB7185',
      accessory: '#0EA5E9',
    },
    traits: {
      earType: 'none',
      tailType: 'nub',
      snoutType: 'beak',
      special: 'wings',
    },
  },
  {
    id: 'owl',
    enName: 'Owl',
    zhName: '貓頭鷹',
    defaultPetName: 'Hoot',
    personality: 'Night-owl vocabulary collector!',
    palette: {
      body: '#A78BFA',
      bodyShade: '#7C3AED',
      belly: '#EDE9FE',
      accent: '#F59E0B',
      earInner: '#C4B5FD',
      cheek: '#F472B6',
      accessory: '#FBBF24',
    },
    traits: {
      earType: 'tuft',
      tailType: 'nub',
      snoutType: 'beak',
      special: 'wings',
    },
  },
  {
    id: 'frog',
    enName: 'Frog',
    zhName: '青蛙',
    defaultPetName: 'Sprout',
    personality: 'Bouncy pond biologist who loves water words!',
    palette: {
      body: '#4ADE80',
      bodyShade: '#16A34A',
      belly: '#DCFCE7',
      accent: '#14532D',
      earInner: '#86EFAC',
      cheek: '#FB7185',
      accessory: '#F59E0B',
    },
    traits: {
      earType: 'none',
      tailType: 'none',
      snoutType: 'frog',
      special: 'none',
    },
  },
  {
    id: 'turtle',
    enName: 'Turtle',
    zhName: '烏龜',
    defaultPetName: 'Shelly',
    personality: 'Steady thinker with a patterned lab shell!',
    palette: {
      body: '#86EFAC',
      bodyShade: '#22C55E',
      belly: '#FEF9C3',
      accent: '#15803D',
      earInner: '#4ADE80',
      cheek: '#FB7185',
      accessory: '#0284C7',
    },
    traits: {
      earType: 'none',
      tailType: 'nub',
      snoutType: 'wide',
      special: 'shell',
    },
  },
  {
    id: 'hedgehog',
    enName: 'Hedgehog',
    zhName: '刺蝟',
    defaultPetName: 'Bramble',
    personality: 'Spiky-backed explorer with a gentle heart!',
    palette: {
      body: '#FED7AA',
      bodyShade: '#FDBA74',
      belly: '#FFFBEB',
      accent: '#78350F',
      earInner: '#FDA4AF',
      cheek: '#FB7185',
      accessory: '#10B981',
    },
    traits: {
      earType: 'tiny_round',
      tailType: 'none',
      snoutType: 'nose',
      special: 'quills',
    },
  },
  {
    id: 'red_panda',
    enName: 'Red Panda',
    zhName: '小熊貓',
    defaultPetName: 'Rusty',
    personality: 'Ring-tailed acrobat who excels at matching!',
    palette: {
      body: '#EA580C',
      bodyShade: '#C2410C',
      belly: '#431407',
      accent: '#FFF7ED',
      earInner: '#FFFFFF',
      cheek: '#FFFBEB',
      accessory: '#14B8A6',
    },
    traits: {
      earType: 'round',
      tailType: 'bushy',
      snoutType: 'muzzle',
      special: 'mask',
    },
  },
  {
    id: 'koala',
    enName: 'Koala',
    zhName: '無尾熊',
    defaultPetName: 'Euca',
    personality: 'Chill leaf-snacking scientist!',
    palette: {
      body: '#CBD5E1',
      bodyShade: '#94A3B8',
      belly: '#F8FAFC',
      accent: '#334155',
      earInner: '#F8FAFC',
      cheek: '#FDA4AF',
      accessory: '#10B981',
    },
    traits: {
      earType: 'round',
      tailType: 'none',
      snoutType: 'nose',
      special: 'none',
    },
  },
  {
    id: 'otter',
    enName: 'Otter',
    zhName: '水獺',
    defaultPetName: 'Ripple',
    personality: 'Playful pebble-juggler from the river lab!',
    palette: {
      body: '#B45309',
      bodyShade: '#92400E',
      belly: '#FDE68A',
      accent: '#451A03',
      earInner: '#FCD34D',
      cheek: '#FB7185',
      accessory: '#38BDF8',
    },
    traits: {
      earType: 'tiny_round',
      tailType: 'flat',
      snoutType: 'whiskers',
      special: 'bib',
    },
  },
  {
    id: 'squirrel',
    enName: 'Squirrel',
    zhName: '松鼠',
    defaultPetName: 'Acorn',
    personality: 'Quick-witted collector of science facts!',
    palette: {
      body: '#F59E0B',
      bodyShade: '#B45309',
      belly: '#FEF3C7',
      accent: '#78350F',
      earInner: '#FDE68A',
      cheek: '#FB7185',
      accessory: '#10B981',
    },
    traits: {
      earType: 'pointed',
      tailType: 'bushy',
      snoutType: 'whiskers',
      special: 'belly_stripe',
    },
  },
  {
    id: 'fawn',
    enName: 'Fawn',
    zhName: '小鹿',
    defaultPetName: 'Hazel',
    personality: 'Graceful meadow watcher of living things!',
    palette: {
      body: '#F59E0B',
      bodyShade: '#D97706',
      belly: '#FFFBEB',
      accent: '#78350F',
      earInner: '#FDE68A',
      cheek: '#FDA4AF',
      accessory: '#22C55E',
    },
    traits: {
      earType: 'pointed',
      tailType: 'nub',
      snoutType: 'muzzle',
      special: 'antlers',
    },
  },
  {
    id: 'capybara',
    enName: 'Capybara',
    zhName: '水豚',
    defaultPetName: 'Yuzu',
    personality: 'Zen desk companion with a citrus friend!',
    palette: {
      body: '#D97706',
      bodyShade: '#92400E',
      belly: '#FDE68A',
      accent: '#451A03',
      earInner: '#F59E0B',
      cheek: '#FDA4AF',
      accessory: '#F97316',
    },
    traits: {
      earType: 'tiny_round',
      tailType: 'none',
      snoutType: 'wide',
      special: 'yuzu',
    },
  },
  {
    id: 'alpaca',
    enName: 'Alpaca',
    zhName: '羊駝',
    defaultPetName: 'Cloud',
    personality: 'Fluffy wool-coated thinker who loves puzzles!',
    palette: {
      body: '#FAF5FF',
      bodyShade: '#E9D5FF',
      belly: '#FFFFFF',
      accent: '#A855F7',
      earInner: '#FBCFE8',
      cheek: '#F472B6',
      accessory: '#EC4899',
    },
    traits: {
      earType: 'pointed',
      tailType: 'puff',
      snoutType: 'muzzle',
      special: 'wool',
    },
  },
];

export const CRITTER_SPECIES_MAP: Record<CritterSpeciesId, CritterSpecies> =
  CRITTER_SPECIES.reduce(
    (acc, sp) => {
      acc[sp.id] = sp;
      return acc;
    },
    {} as Record<CritterSpeciesId, CritterSpecies>,
  );

export function getCritterSpecies(id?: string): CritterSpecies {
  if (id && id in CRITTER_SPECIES_MAP) {
    return CRITTER_SPECIES_MAP[id as CritterSpeciesId];
  }
  return CRITTER_SPECIES[0];
}

export function pickRandomSpeciesId(
  excludeIds: CritterSpeciesId[] = [],
): CritterSpeciesId {
  const excludedSet = new Set(excludeIds);
  const available = CRITTER_SPECIES.filter((s) => !excludedSet.has(s.id));
  const pool = available.length > 0 ? available : CRITTER_SPECIES;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function getSpeciesStageLabel(
  speciesId: CritterSpeciesId,
  stage: 1 | 2 | 3 | 4,
): {en: string; zh: string; stageTitle: string} {
  const sp = getCritterSpecies(speciesId);
  const st = EVOLUTION_STAGES[stage - 1];
  return {
    en: `${st.name} ${sp.enName}`,
    zh: `${st.zhName}${sp.zhName}`,
    stageTitle: st.name,
  };
}

export interface CompanionMoodState {
  isSad: boolean;
  isHungry: boolean;
  isTired: boolean;
  isLonely: boolean;
  avg: number;
}

export const LOW_STAT_THRESHOLD = 30;
export const LOW_AVG_THRESHOLD = 35;

export function getCompanionMoodState(
  hunger: number,
  happiness: number,
  energy: number,
): CompanionMoodState {
  const avg = (hunger + happiness + energy) / 3;
  const isHungry = hunger < LOW_STAT_THRESHOLD;
  const isLonely = happiness < LOW_STAT_THRESHOLD;
  const isTired = energy < LOW_STAT_THRESHOLD;
  const isSad = isHungry || isLonely || isTired || avg < LOW_AVG_THRESHOLD;
  return {isSad, isHungry, isTired, isLonely, avg};
}

export type CareAnimationKind = 'none' | 'feeding' | 'cleaning' | 'playing';

export interface PixelCompanionDrawOptions {
  speciesId: CritterSpeciesId;
  stage: 1 | 2 | 3 | 4;
  centerX: number;
  bottomY: number;
  pixelSize?: number;
  facingRight?: boolean;
  squashX?: number;
  squashY?: number;
  isMoving?: boolean;
  isGrounded?: boolean;
  isSulking?: boolean;
  animTime?: number;
  careAction?: CareAnimationKind;
  careProgress?: number;
}

/**
 * High-craft procedural pixel-art renderer that draws the exact same animal
 * species across all 4 aligned growth stages:
 *   Stage 1 (Baby): Tiny compact round proportions, huge sparkling eyes, stubby paws
 *   Stage 2 (Young): Taller upright proportions, clearer ears/tail, colored collar/ribbon
 *   Stage 3 (Teen): Agile explorer proportions, fuller features, brass goggles & scarf
 *   Stage 4 (Adult Scholar): Mature tall proportions, lush tail/antlers/crest, crisp lab coat & golden specs
 */
export function drawPixelCompanion(
  ctx: CanvasRenderingContext2D,
  opts: PixelCompanionDrawOptions,
): void {
  const {
    speciesId,
    stage,
    centerX,
    bottomY,
    pixelSize = 7,
    facingRight = true,
    squashX = 1,
    squashY = 1,
    isMoving = false,
    isGrounded = true,
    isSulking = false,
    animTime = 0,
    careAction = 'none',
    careProgress = 0,
  } = opts;

  const sp = getCritterSpecies(speciesId);
  const pal = sp.palette;
  const tr = sp.traits;
  const OUTLINE = '#1E293B';

  const isFeeding = careAction === 'feeding';
  const isCleaning = careAction === 'cleaning';
  const isPlaying = careAction === 'playing';
  const isSadIdle = isSulking && careAction === 'none';
  const isChomping = isFeeding && careProgress > 0.25 && Math.sin(animTime * 24) > 0;

  // Subtle & care-specific animations (much slower, lower amplitude when sad/tired)
  const breathY = isFeeding
    ? -Math.abs(Math.sin(animTime * 16)) * 0.65
    : isSadIdle
      ? Math.sin(animTime * 1.4) * 0.14
      : isGrounded && !isMoving
        ? Math.sin(animTime * 3.5) * 0.35
        : 0;
  const walkStep = isMoving && isGrounded && !isSadIdle ? Math.sin(animTime * 14) : 0;
  const tailWag = isSadIdle
    ? Math.sin(animTime * 1.2) * 0.25
    : Math.sin(
        animTime * (careAction !== 'none' ? 16 : isMoving ? 11 : 4.2),
      ) * (careAction !== 'none' ? 1.6 : 1.1);
  const blinkCycle = animTime % 3.6;
  const isBlinking = blinkCycle > 3.42 && !isSulking && careAction === 'none';

  // Cleaning shimmy/shake-off horizontal wiggle
  const shimmyOffsetX = isCleaning
    ? Math.sin(animTime * (careProgress > 0.7 ? 42 : 28)) *
      (careProgress > 0.7 ? 5.5 : 3.5)
    : 0;

  // Playful pounce somersault rotation when airborne during play
  const playFlipAngle =
    isPlaying && !isGrounded && careProgress > 0.25 && careProgress < 0.85
      ? Math.sin(((careProgress - 0.25) / 0.6) * Math.PI) * 0.42
      : 0;

  // Stage-aligned proportions (all in pixel-grid units)
  const headW = stage === 1 ? 11 : stage === 2 ? 12 : stage === 3 ? 13 : 14;
  const headH = stage === 1 ? 9 : stage === 2 ? 10 : stage === 3 ? 10 : 11;
  const bodyW = stage === 1 ? 9 : stage === 2 ? 10 : stage === 3 ? 11 : 12;
  const bodyH = stage === 1 ? 5 : stage === 2 ? 7 : stage === 3 ? 9 : 11;
  const legH = stage === 1 ? 2 : stage === 2 ? 3 : stage === 3 ? 3 : 4;

  // Center coordinates in grid space (0,0 = bottom-center feet)
  const headDroop = isSadIdle ? 1 : 0;
  const bodyBottom = -legH;
  const bodyTop = bodyBottom - bodyH;
  const headBottom = bodyTop + 1 + headDroop;
  const headTop = headBottom - headH + breathY;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(centerX + shimmyOffsetX, bottomY);
  if (!facingRight) ctx.scale(-1, 1);
  if (playFlipAngle !== 0) {
    const midY = -((bodyH + headH) * pixelSize) * 0.45;
    ctx.translate(0, midY);
    ctx.rotate(playFlipAngle);
    ctx.translate(0, -midY);
  }
  const postureX = isSadIdle ? 1.05 : 1;
  const postureY = isSadIdle ? 0.93 : 1;
  ctx.scale(squashX * postureX, squashY * postureY);

  const px = (
    gx: number,
    gy: number,
    gw: number,
    gh: number,
    color: string,
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(gx * pixelSize),
      Math.round(gy * pixelSize),
      Math.round(gw * pixelSize),
      Math.round(gh * pixelSize),
    );
  };

  // Helper to draw an outlined pixel box
  const box = (
    gx: number,
    gy: number,
    gw: number,
    gh: number,
    fill: string,
    shade?: string,
  ) => {
    px(gx - 1, gy, gw + 2, gh, OUTLINE);
    px(gx, gy - 1, gw, gh + 2, OUTLINE);
    px(gx, gy, gw, gh, fill);
    if (shade) {
      px(gx, gy + gh - 1, gw, 1, shade);
      px(gx, gy, 1, gh, shade);
    }
  };

  // --- 1. TAIL (Behind body, grows fuller per stage) ---
  const tailBaseX = -Math.floor(bodyW / 2) - 1;
  const tailBaseY = bodyBottom - 2 + (isSadIdle ? 1 : 0) + Math.round(tailWag * 0.5);
  const tailScale = stage;
  if (tr.tailType === 'curl') {
    box(tailBaseX - 2, tailBaseY - 1, 3, 2, pal.body);
    if (stage >= 2) box(tailBaseX - 3, tailBaseY - 3, 2, 3, pal.body);
    if (stage >= 3) px(tailBaseX - 3, tailBaseY - 4, 2, 2, pal.accent);
    if (stage === 4) px(tailBaseX - 2, tailBaseY - 5, 2, 1, pal.belly);
  } else if (tr.tailType === 'wag') {
    const wagY = Math.round(tailWag);
    box(tailBaseX - 2, tailBaseY - 1 + wagY, 2 + (stage >= 3 ? 1 : 0), 2, pal.body);
    if (stage >= 2) px(tailBaseX - 2, tailBaseY - 1 + wagY, 1, 1, pal.belly);
  } else if (tr.tailType === 'puff') {
    const s = stage >= 3 ? 3 : 2;
    box(tailBaseX - s, tailBaseY - s + 1, s, s, pal.belly);
  } else if (tr.tailType === 'bushy') {
    const tw = 2 + Math.floor(tailScale * 0.8);
    const th = 2 + tailScale;
    box(tailBaseX - tw, tailBaseY - th + 2, tw, th, pal.body, pal.bodyShade);
    px(tailBaseX - tw, tailBaseY - th + 2, Math.max(2, tw - 1), 2, pal.belly);
    if (speciesId === 'red_panda' && stage >= 2) {
      px(tailBaseX - tw + 1, tailBaseY - 1, tw - 1, 1, pal.belly);
      px(tailBaseX - tw + 1, tailBaseY - 3, tw - 1, 1, pal.belly);
    }
  } else if (tr.tailType === 'flat') {
    box(tailBaseX - (2 + stage), tailBaseY, 2 + stage, 2, pal.bodyShade);
  } else if (tr.tailType === 'nub') {
    box(tailBaseX - 1, tailBaseY - 1, 2, 2, pal.bodyShade);
  } else if (tr.tailType === 'flipper') {
    box(tailBaseX - 2, tailBaseY, 2, 2, pal.bodyShade);
  }

  // --- 2. SPECIAL BACK FEATURES (Turtle shell / Hedgehog quills) ---
  if (tr.special === 'shell') {
    const sw = bodyW + 2;
    const sh = bodyH + (stage >= 3 ? 2 : 1);
    box(-Math.floor(sw / 2) - 1, bodyTop, sw - 1, sh - 1, pal.accent);
    px(-Math.floor(sw / 2), bodyTop + 1, sw - 4, 2, '#FDE047');
    if (stage >= 3) {
      px(-Math.floor(sw / 2) + 1, bodyTop + 3, sw - 5, 1, '#4ADE80');
    }
  } else if (tr.special === 'quills') {
    const qw = bodyW + 2 + (stage >= 3 ? 1 : 0);
    box(-Math.floor(qw / 2) - 1, bodyTop - 1, qw - 2, bodyH + 1, pal.accent);
    px(-Math.floor(qw / 2) - 2, bodyTop + 1, 1, 2, pal.accent);
    if (stage >= 2) px(-Math.floor(qw / 2) - 2, bodyTop + 4, 1, 2, pal.accent);
  }

  // --- 3. LEGS / PAWS ---
  const leftFootOffset = isGrounded ? Math.round(walkStep) : -1;
  const rightFootOffset = isGrounded ? Math.round(-walkStep) : -1;
  const footColor =
    tr.snoutType === 'beak' ? pal.accent : pal.bodyShade;
  box(-3, bodyBottom + leftFootOffset * 0.4, 2, legH, footColor);
  box(2, bodyBottom + rightFootOffset * 0.4, 2, legH, footColor);

  // --- 4. TORSO / BODY ---
  const bx = -Math.floor(bodyW / 2);
  box(bx, bodyTop, bodyW, bodyH, pal.body, pal.bodyShade);

  // Belly patch
  const bellyW = Math.max(4, bodyW - 4);
  px(-Math.floor(bellyW / 2) + 1, bodyTop + 1, bellyW, bodyH - 2, pal.belly);

  // Calico / Fawn spots / Belly stripe
  if (tr.special === 'calico') {
    px(bx + 1, bodyTop + 1, 2, 2, pal.accent);
  } else if (tr.special === 'spots') {
    px(bx + 1, bodyTop + 1, 2, 2, pal.accent);
  } else if (tr.special === 'belly_stripe') {
    px(-1, bodyTop + 1, 3, bodyH - 2, pal.belly);
  } else if (tr.special === 'wool') {
    px(bx, bodyTop, bodyW, 2, '#FFFFFF');
    px(bx - 1, bodyTop + 1, 1, bodyH - 2, '#FFFFFF');
  }

  // Wings (Penguin, Duck, Owl)
  if (tr.special === 'wings') {
    const wingLen = stage === 1 ? 3 : stage === 2 ? 4 : stage === 3 ? 5 : 6;
    const flap = isGrounded ? 0 : -2;
    box(bx - 1, bodyTop + 1 + flap, 2, wingLen, pal.bodyShade);
    box(bx + bodyW - 1, bodyTop + 1 + flap, 2, wingLen, pal.bodyShade);
  } else {
    // Little arms/paws
    const armLen = stage === 1 ? 2 : stage === 2 ? 3 : 4;
    box(bx - 1, bodyTop + 1, 2, armLen, pal.body);
    box(bx + bodyW - 1, bodyTop + 1, 2, armLen, pal.body);
  }

  // --- 5. STAGE ACCESSORIES ON BODY (Consistent Growth!) ---
  if (stage === 2) {
    // Cute colored collar / ribbon
    px(bx, bodyTop, bodyW, 2, pal.accessory);
    px(0, bodyTop + 1, 2, 2, '#FDE047'); // Tiny bell / charm
  } else if (stage === 3) {
    // Explorer scarf
    px(bx - 1, bodyTop, bodyW + 2, 2, pal.accessory);
    px(1, bodyTop + 1, 2, 4, pal.accessory);
  } else if (stage === 4) {
    // Crisp Cream Scholar Laboratory Coat with emerald trim & golden medal
    px(bx - 1, bodyTop, 3, bodyH, '#FFFDF7');
    px(bx + bodyW - 2, bodyTop, 3, bodyH, '#FFFDF7');
    px(bx - 1, bodyTop, bodyW + 2, 1, '#10B981');
    px(bx, bodyTop + 2, 1, bodyH - 2, '#CBD5E1');
    px(bx + bodyW - 1, bodyTop + 2, 1, bodyH - 2, '#CBD5E1');
    // Golden scholar medal
    px(0, bodyTop + 1, 2, 2, '#FBBF24');
  }

  // --- 6. HEAD ---
  const hx = -Math.floor(headW / 2);
  box(hx, headTop, headW, headH, pal.body, pal.bodyShade);

  // Wool tuft on Alpaca head
  if (tr.special === 'wool') {
    box(hx + 2, headTop - 2, headW - 4, 2, '#FFFFFF');
  }

  // Yuzu fruit on Capybara head!
  if (tr.special === 'yuzu') {
    const yzSize = stage >= 3 ? 3 : 2;
    box(hx + 4, headTop - yzSize, yzSize, yzSize, '#FBBF24');
    px(hx + 5, headTop - yzSize - 1, 1, 1, '#22C55E');
  }

  // --- 7. EARS & ANTLERS (Droop downward when sad/low-energy) ---
  const earH = stage === 1 ? 2 : stage === 2 ? 3 : stage === 3 ? 4 : 5;
  const earDroopY = isSadIdle ? 1 : 0;
  if (tr.earType === 'pointed') {
    const effectiveEarH = isSadIdle ? Math.max(2, earH - 1) : earH;
    box(hx + 1, headTop - effectiveEarH + earDroopY, 3, effectiveEarH, pal.body);
    px(
      hx + 2,
      headTop - effectiveEarH + 1 + earDroopY,
      1,
      Math.max(1, effectiveEarH - 1),
      pal.earInner,
    );
    box(
      hx + headW - 4,
      headTop - effectiveEarH + earDroopY,
      3,
      effectiveEarH,
      pal.body,
    );
    px(
      hx + headW - 3,
      headTop - effectiveEarH + 1 + earDroopY,
      1,
      Math.max(1, effectiveEarH - 1),
      pal.earInner,
    );
  } else if (tr.earType === 'long') {
    if (isSadIdle) {
      // Sad drooped rabbit ears hanging down the sides
      const droopLen = earH + 2;
      box(hx - 2, headTop + 1, 2, droopLen, pal.body);
      px(hx - 1, headTop + 2, 1, droopLen - 2, pal.earInner);
      box(hx + headW, headTop + 1, 2, droopLen, pal.body);
      px(hx + headW, headTop + 2, 1, droopLen - 2, pal.earInner);
    } else {
      const rabbitH = earH + 3;
      box(hx + 2, headTop - rabbitH, 2, rabbitH, pal.body);
      px(hx + 2, headTop - rabbitH + 1, 1, rabbitH - 2, pal.earInner);
      box(hx + headW - 4, headTop - rabbitH, 2, rabbitH, pal.body);
      px(hx + headW - 4, headTop - rabbitH + 1, 1, rabbitH - 2, pal.earInner);
    }
  } else if (tr.earType === 'floppy') {
    const flopH = 3 + stage + earDroopY;
    box(hx - 2, headTop + 1 + earDroopY, 2, flopH, pal.accent);
    box(hx + headW, headTop + 1 + earDroopY, 2, flopH, pal.accent);
  } else if (tr.earType === 'round') {
    const ew = stage >= 3 ? 4 : 3;
    const roundColor = speciesId === 'panda' ? pal.accent : pal.body;
    box(hx, headTop - 2 + earDroopY, ew, 3, roundColor);
    box(hx + headW - ew, headTop - 2 + earDroopY, ew, 3, roundColor);
    if (speciesId !== 'panda') {
      px(hx + 1, headTop - 1 + earDroopY, ew - 2, 1, pal.earInner);
      px(hx + headW - ew + 1, headTop - 1 + earDroopY, ew - 2, 1, pal.earInner);
    }
  } else if (tr.earType === 'tiny_round') {
    box(hx + 1, headTop - 2 + earDroopY, 2, 2, pal.body);
    box(hx + headW - 3, headTop - 2 + earDroopY, 2, 2, pal.body);
  } else if (tr.earType === 'tuft') {
    box(hx + 1, headTop - 2 + earDroopY, 2, 2, pal.accent);
    box(hx + headW - 3, headTop - 2 + earDroopY, 2, 2, pal.accent);
  }

  // Fawn antlers (Stage 2+ small buds -> Stage 4 branching antlers!)
  if (tr.special === 'antlers' && stage >= 2) {
    px(hx + 3, headTop - 2, 1, 2, pal.accent);
    px(hx + headW - 4, headTop - 2, 1, 2, pal.accent);
    if (stage >= 3) {
      px(hx + 2, headTop - 4, 2, 2, pal.accent);
      px(hx + headW - 4, headTop - 4, 2, 2, pal.accent);
    }
    if (stage === 4) {
      px(hx + 1, headTop - 5, 2, 1, pal.accent);
      px(hx + headW - 3, headTop - 5, 2, 1, pal.accent);
    }
  }

  // --- 8. FACE MARKINGS ---
  if (tr.special === 'eye_patches') {
    // Panda black eye ovals
    px(hx + 2, headTop + 3, 3, 3, pal.accent);
    px(hx + headW - 5, headTop + 3, 3, 3, pal.accent);
  } else if (tr.special === 'mask') {
    // Red panda white brow + dark tear marks
    px(hx + 2, headTop + 2, 2, 1, pal.accent);
    px(hx + headW - 4, headTop + 2, 2, 1, pal.accent);
    px(hx + 2, headTop + 5, 2, 2, pal.belly);
    px(hx + headW - 4, headTop + 5, 2, 2, pal.belly);
  } else if (tr.special === 'calico') {
    px(hx + 1, headTop, 3, 3, pal.accent);
  } else if (tr.special === 'spots') {
    px(hx + 1, headTop + 1, 2, 2, pal.accent);
  }

  // Frog big eye bumps
  if (tr.snoutType === 'frog') {
    box(hx + 1, headTop - 2, 3, 3, pal.body);
    box(hx + headW - 4, headTop - 2, 3, 3, pal.body);
  }

  // --- 9. EYES (Stage 1 extra-cute huge eyes; happy care arcs, blinks & sulks) ---
  const eyeY = tr.snoutType === 'frog' ? headTop - 1 : headTop + 4;
  const eyeL = hx + 3;
  const eyeR = hx + headW - 4;
  const happyEyeColor = tr.special === 'eye_patches' ? '#FFFFFF' : OUTLINE;

  if (isFeeding) {
    // Happy closed-arc eyes (^ ^) while munching!
    px(eyeL - 1, eyeY + 1, 1, 1, happyEyeColor);
    px(eyeL, eyeY, 1, 1, happyEyeColor);
    px(eyeL + 1, eyeY + 1, 1, 1, happyEyeColor);
    px(eyeR, eyeY + 1, 1, 1, happyEyeColor);
    px(eyeR + 1, eyeY, 1, 1, happyEyeColor);
    px(eyeR + 2, eyeY + 1, 1, 1, happyEyeColor);
  } else if (isCleaning) {
    // Cheerful bath squint (> <) while being scrubbed!
    px(eyeL - 1, eyeY, 1, 1, happyEyeColor);
    px(eyeL, eyeY + 1, 1, 1, happyEyeColor);
    px(eyeL - 1, eyeY + 2, 1, 1, happyEyeColor);
    px(eyeR + 1, eyeY, 1, 1, happyEyeColor);
    px(eyeR, eyeY + 1, 1, 1, happyEyeColor);
    px(eyeR + 1, eyeY + 2, 1, 1, happyEyeColor);
  } else if (isSadIdle) {
    // Droopy sad eyebrows (/ \), half-lidded downcast eyes & sad tear glints
    const browColor = tr.special === 'eye_patches' ? '#CBD5E1' : OUTLINE;
    const lidColor = tr.special === 'eye_patches' ? '#94A3B8' : pal.bodyShade;
    // Left sad eyebrow (/)
    px(eyeL - 1, eyeY - 1, 1, 1, browColor);
    px(eyeL, eyeY - 2, 1, 1, browColor);
    // Right sad eyebrow (\)
    px(eyeR, eyeY - 2, 1, 1, browColor);
    px(eyeR + 1, eyeY - 1, 1, 1, browColor);
    // Half-lidded tired eyes
    px(eyeL - 1, eyeY, 3, 1, lidColor);
    px(eyeL, eyeY + 1, 2, 1, OUTLINE);
    px(eyeL - 1, eyeY + 1, 1, 1, OUTLINE);
    px(eyeR - 1, eyeY, 3, 1, lidColor);
    px(eyeR, eyeY + 1, 2, 1, OUTLINE);
    px(eyeR + 2, eyeY + 1, 1, 1, OUTLINE);
    // Teary droplets
    px(eyeL - 1, eyeY + 2, 1, 1, '#38BDF8');
    px(eyeR + 2, eyeY + 2, 1, 1, '#38BDF8');
  } else if (isBlinking) {
    px(eyeL, eyeY + 1, 2, 1, OUTLINE);
    px(eyeR, eyeY + 1, 2, 1, OUTLINE);
  } else if (tr.special === 'eye_patches') {
    px(eyeL, eyeY, 2, 2, '#FFFFFF');
    px(eyeL + 1, eyeY + 1, 1, 1, OUTLINE);
    px(eyeR, eyeY, 2, 2, '#FFFFFF');
    px(eyeR, eyeY + 1, 1, 1, OUTLINE);
  } else {
    const eyeSize = stage === 1 ? 2 : 2;
    px(eyeL, eyeY, eyeSize, eyeSize, OUTLINE);
    px(eyeL, eyeY, 1, 1, '#FFFFFF'); // Sparkle highlight
    px(eyeR, eyeY, eyeSize, eyeSize, OUTLINE);
    px(eyeR, eyeY, 1, 1, '#FFFFFF');
  }

  // Rosy Cheeks (muted when sad/tired, extra bright during care actions)
  const cheekW = tr.special === 'cheek_pouches' || careAction !== 'none' ? 2 : 2;
  const cheekColor = isSadIdle ? pal.bodyShade : pal.cheek;
  px(hx + 1, headTop + 6, cheekW, 1, cheekColor);
  px(hx + headW - 3, headTop + 6, cheekW, 1, cheekColor);

  // --- 10. SNOUT / BEAK / WHISKERS ---
  const noseX = Math.floor((hx + hx + headW) / 2);
  const noseY = headTop + 6;
  if (tr.snoutType === 'beak') {
    px(noseX - 1, noseY, 3, 2, pal.accent);
    if (isChomping) px(noseX - 1, noseY + 1, 3, 1, '#FB7185');
    else if (isSadIdle) {
      px(noseX - 1, noseY + 1, 3, 1, OUTLINE);
      px(noseX - 2, noseY + 2, 1, 1, OUTLINE);
      px(noseX + 2, noseY + 2, 1, 1, OUTLINE);
    }
  } else if (tr.snoutType === 'muzzle') {
    px(noseX - 2, noseY, 5, 3, pal.belly);
    px(noseX, noseY, 1, 1, OUTLINE);
    if (isChomping) {
      px(noseX - 1, noseY + 1, 3, 2, '#FB7185');
    } else if (isPlaying) {
      px(noseX - 1, noseY + 1, 3, 1, '#FB7185');
    } else if (isSadIdle) {
      px(noseX - 1, noseY + 1, 3, 1, OUTLINE);
      px(noseX - 2, noseY + 2, 1, 1, OUTLINE);
      px(noseX + 2, noseY + 2, 1, 1, OUTLINE);
    }
  } else if (tr.snoutType === 'wide') {
    px(noseX - 2, noseY, 5, 3, pal.bodyShade);
    px(noseX - 1, noseY + 1, 1, 1, OUTLINE);
    px(noseX + 1, noseY + 1, 1, 1, OUTLINE);
    if (isChomping) px(noseX - 1, noseY + 2, 3, 1, '#FB7185');
    else if (isSadIdle) {
      px(noseX - 1, noseY + 2, 3, 1, OUTLINE);
      px(noseX - 2, noseY + 3, 1, 1, OUTLINE);
      px(noseX + 2, noseY + 3, 1, 1, OUTLINE);
    }
  } else if (tr.snoutType === 'nose') {
    px(noseX - 1, noseY - 1, 3, 3, pal.accent);
    if (isChomping) px(noseX - 1, noseY + 2, 3, 1, '#FB7185');
    else if (isSadIdle) {
      px(noseX - 1, noseY + 2, 3, 1, OUTLINE);
      px(noseX - 2, noseY + 3, 1, 1, OUTLINE);
      px(noseX + 2, noseY + 3, 1, 1, OUTLINE);
    }
  } else if (tr.snoutType === 'frog') {
    if (isSadIdle) {
      px(noseX - 1, noseY + 1, 3, 1, OUTLINE);
      px(noseX - 2, noseY + 2, 1, 1, OUTLINE);
      px(noseX + 2, noseY + 2, 1, 1, OUTLINE);
    } else {
      px(noseX - 2, noseY + 1, 5, 1, OUTLINE);
    }
    if (isChomping) px(noseX - 1, noseY + 2, 3, 1, '#FB7185');
  } else {
    // Whiskers (Cat, Rabbit, Hamster, Otter, Squirrel)
    px(noseX, noseY, 1, 1, isSadIdle ? OUTLINE : pal.cheek);
    if (isChomping) {
      px(noseX - 1, noseY + 1, 3, 2, '#FB7185');
    } else if (isSadIdle) {
      // Inverted sad frown
      px(noseX - 1, noseY + 1, 3, 1, OUTLINE);
      px(noseX - 2, noseY + 2, 1, 1, OUTLINE);
      px(noseX + 2, noseY + 2, 1, 1, OUTLINE);
    } else {
      px(noseX - 1, noseY + 1, 3, 1, OUTLINE);
    }
    px(hx - 1, noseY, 2, 1, OUTLINE);
    px(hx + headW - 1, noseY, 2, 1, OUTLINE);
  }

  // --- 11. STAGE HEADGEAR (Stage 3 Brass Goggles / Stage 4 Golden Scholar Specs) ---
  if (stage === 3) {
    // Miniature brass study goggles resting on forehead!
    px(hx + 1, headTop + 1, headW - 2, 1, '#92400E');
    px(hx + 2, headTop, 3, 3, '#FBBF24');
    px(hx + 3, headTop + 1, 1, 1, '#BAE6FD');
    px(hx + headW - 5, headTop, 3, 3, '#FBBF24');
    px(hx + headW - 4, headTop + 1, 1, 1, '#BAE6FD');
  } else if (stage === 4) {
    // Golden scholar spectacles + mini mortarboard/scholar cap accent!
    px(eyeL - 1, eyeY, 3, 2, '#F59E0B');
    px(eyeL, eyeY, 2, 2, isBlinking || isSadIdle ? '#FDE68A' : OUTLINE);
    if (isSadIdle) {
      px(eyeL - 1, eyeY - 1, 1, 1, OUTLINE);
      px(eyeL, eyeY - 2, 1, 1, OUTLINE);
      px(eyeL, eyeY + 1, 2, 1, OUTLINE);
      px(eyeL - 1, eyeY + 2, 1, 1, '#38BDF8');
    } else if (!isBlinking) px(eyeL, eyeY, 1, 1, '#FFFFFF');

    px(eyeR - 1, eyeY, 3, 2, '#F59E0B');
    px(eyeR, eyeY, 2, 2, isBlinking || isSadIdle ? '#FDE68A' : OUTLINE);
    if (isSadIdle) {
      px(eyeR, eyeY - 2, 1, 1, OUTLINE);
      px(eyeR + 1, eyeY - 1, 1, 1, OUTLINE);
      px(eyeR, eyeY + 1, 2, 1, OUTLINE);
      px(eyeR + 2, eyeY + 2, 1, 1, '#38BDF8');
    } else if (!isBlinking) px(eyeR, eyeY, 1, 1, '#FFFFFF');

    px(eyeL + 2, eyeY, eyeR - (eyeL + 2), 1, '#F59E0B');

    // Tiny scholar cap tassel on top-center
    px(hx + 3, headTop - 2, headW - 6, 1, '#1E293B');
    px(hx + headW - 4, headTop - 1, 1, 2, '#FBBF24');
  }

  ctx.restore();
}

interface CritterPortraitProps {
  speciesId: CritterSpeciesId;
  stage: 1 | 2 | 3 | 4;
  size?: number;
  className?: string;
}

export const CritterPortrait: React.FC<CritterPortraitProps> = ({
  speciesId,
  stage,
  size = 64,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Scale pixel size proportionally so Baby through Adult Scholar fits cleanly
    const pxSize = Math.max(1.6, size / (stage === 1 ? 23 : stage === 2 ? 26 : stage === 3 ? 28 : 30));

    drawPixelCompanion(ctx, {
      speciesId,
      stage,
      centerX: size / 2,
      bottomY: size - Math.max(4, size * 0.08),
      pixelSize: pxSize,
      facingRight: true,
      isGrounded: true,
      animTime: 0,
    });
  }, [speciesId, stage, size]);

  return React.createElement('canvas', {
    ref: canvasRef,
    style: {width: size, height: size},
    className: `shrink-0 ${className}`,
  });
};
