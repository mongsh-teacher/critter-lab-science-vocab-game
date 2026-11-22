import {EVOLUTION_STAGES} from './constants';
import {
  CRITTER_SPECIES,
  CritterSpeciesId,
  getCritterSpecies,
  pickRandomSpeciesId,
} from './critters';
import {VOCABULARY, VocabItem} from './vocabulary';

export type StudyMode = 'FLASHCARDS' | 'MATCH' | 'BLANKS' | 'PUZZLE';

export interface WordMastery {
  attempts: number;
  correct: number;
  needsPractice: boolean;
}

export interface CompanionProfile {
  id: string;
  profileName: string;
  companionName: string;
  speciesId: CritterSpeciesId;
  xp: number;
  spendableXp: number;
  hunger: number;
  happiness: number;
  energy: number;
  biscuits: number;
  bubbles: number;
  flasks: number;
  totalScore: number;
  bestStreak: number;
  totalAttempts: number;
  totalCorrect: number;
  mastery: Record<string, WordMastery>;
  updatedAt: number;
}

export interface LocalRunRecord {
  id: string;
  profileId: string;
  profileName: string;
  speciesId?: CritterSpeciesId;
  mode: StudyMode;
  level: 1 | 2 | 3;
  unit: 1 | 2 | 3 | 'ALL';
  score: number;
  accuracy: number;
  maxStreak: number;
  masteredCount: number;
  timestamp: number;
}

export interface SaveData {
  version: number;
  activeProfileId: string;
  profiles: Record<string, CompanionProfile>;
  runs: LocalRunRecord[];
}

const STORAGE_KEY = 'critter_lab_save_v1';

function migrateProfile(
  raw: Partial<CompanionProfile> & {id: string},
): CompanionProfile {
  const validSpecies =
    raw.speciesId &&
    CRITTER_SPECIES.some((s) => s.id === raw.speciesId)
      ? raw.speciesId
      : pickRandomSpeciesId();
  const species = getCritterSpecies(validSpecies);
  const growthXp = typeof raw.xp === 'number' && !Number.isNaN(raw.xp) ? Math.max(0, raw.xp) : 0;
  const migratedSpendable =
    typeof raw.spendableXp === 'number' && !Number.isNaN(raw.spendableXp)
      ? Math.max(0, raw.spendableXp)
      : Math.max(30, growthXp);

  const rawUpdatedAt =
    typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now();
  const offlineMinutes = Math.max(0, (Date.now() - rawUpdatedAt) / 60000);
  // Apply capped offline stat consumption (1.5 pts/min, max 30 pts) so returning players still have a fun session
  const offlineDecay =
    offlineMinutes >= 1 ? Math.min(30, Math.floor(offlineMinutes * 1.5)) : 0;

  const baseHunger = typeof raw.hunger === 'number' ? raw.hunger : 80;
  const baseHappiness = typeof raw.happiness === 'number' ? raw.happiness : 80;
  const baseEnergy = typeof raw.energy === 'number' ? raw.energy : 85;

  return {
    id: raw.id,
    profileName:
      typeof raw.profileName === 'string' && raw.profileName.trim()
        ? raw.profileName.trim()
        : 'Explorer',
    companionName:
      typeof raw.companionName === 'string' && raw.companionName.trim()
        ? raw.companionName.trim()
        : species.defaultPetName,
    speciesId: validSpecies,
    xp: growthXp,
    spendableXp: migratedSpendable,
    hunger:
      offlineDecay > 0
        ? Math.max(Math.min(baseHunger, 10), Math.round(baseHunger - offlineDecay))
        : Math.max(0, Math.min(100, baseHunger)),
    happiness:
      offlineDecay > 0
        ? Math.max(
            Math.min(baseHappiness, 10),
            Math.round(baseHappiness - offlineDecay),
          )
        : Math.max(0, Math.min(100, baseHappiness)),
    energy:
      offlineDecay > 0
        ? Math.max(Math.min(baseEnergy, 10), Math.round(baseEnergy - offlineDecay))
        : Math.max(0, Math.min(100, baseEnergy)),
    biscuits: typeof raw.biscuits === 'number' ? raw.biscuits : 3,
    bubbles: typeof raw.bubbles === 'number' ? raw.bubbles : 3,
    flasks: typeof raw.flasks === 'number' ? raw.flasks : 2,
    totalScore: typeof raw.totalScore === 'number' ? raw.totalScore : 0,
    bestStreak: typeof raw.bestStreak === 'number' ? raw.bestStreak : 0,
    totalAttempts: typeof raw.totalAttempts === 'number' ? raw.totalAttempts : 0,
    totalCorrect: typeof raw.totalCorrect === 'number' ? raw.totalCorrect : 0,
    mastery:
      raw.mastery && typeof raw.mastery === 'object' ? raw.mastery : {},
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

export function createDefaultProfile(
  profileName = 'Explorer',
  companionName?: string,
  speciesId?: CritterSpeciesId,
  excludeSpecies: CritterSpeciesId[] = [],
): CompanionProfile {
  const chosenSpeciesId = speciesId ?? pickRandomSpeciesId(excludeSpecies);
  const species = getCritterSpecies(chosenSpeciesId);
  const id = `prof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    profileName: profileName.trim() || 'Explorer',
    companionName:
      companionName && companionName.trim()
        ? companionName.trim()
        : species.defaultPetName,
    speciesId: chosenSpeciesId,
    xp: 0,
    spendableXp: 30,
    hunger: 80,
    happiness: 80,
    energy: 85,
    biscuits: 3,
    bubbles: 3,
    flasks: 2,
    totalScore: 0,
    bestStreak: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    mastery: {},
    updatedAt: Date.now(),
  };
}

function applyOfflineStatDecay(prof: CompanionProfile): CompanionProfile {
  const now = Date.now();
  const elapsedSec = Math.max(0, (now - prof.updatedAt) / 1000);
  if (elapsedSec < 15) return prof;

  // Gentle offline decay (~2.4 pts/min), capped at 35 pts and floored at 15%
  // so returning players feel motivated to care/study without unfair lockout.
  const drain = Math.min(35, Math.floor(elapsedSec * 0.04));
  if (drain <= 0) return prof;

  return {
    ...prof,
    hunger:
      prof.hunger > 15 ? Math.max(15, prof.hunger - drain) : prof.hunger,
    happiness:
      prof.happiness > 15
        ? Math.max(15, prof.happiness - drain)
        : prof.happiness,
    energy:
      prof.energy > 15 ? Math.max(15, prof.energy - drain) : prof.energy,
    updatedAt: now,
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveData;
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.profiles &&
        Object.keys(parsed.profiles).length > 0
      ) {
        const migratedProfiles: Record<string, CompanionProfile> = {};
        for (const [k, prof] of Object.entries(parsed.profiles)) {
          if (prof && typeof prof === 'object') {
            migratedProfiles[k] = applyOfflineStatDecay(
              migrateProfile({...prof, id: k}),
            );
          }
        }
        const keys = Object.keys(migratedProfiles);
        if (keys.length > 0) {
          const activeId =
            parsed.activeProfileId && migratedProfiles[parsed.activeProfileId]
              ? parsed.activeProfileId
              : keys[0];
          return {
            version: 2,
            activeProfileId: activeId,
            profiles: migratedProfiles,
            runs: Array.isArray(parsed.runs) ? parsed.runs : [],
          };
        }
      }
    }
  } catch {
    // Fallback to clean save if localStorage unavailable or corrupted
  }
  const initialProfile = createDefaultProfile('Explorer');
  return {
    version: 2,
    activeProfileId: initialProfile.id,
    profiles: {[initialProfile.id]: initialProfile},
    runs: [],
  };
}

export function persistSaveData(data: SaveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private browsing storage errors
  }
}

export function getCompanionStage(xp: number): 1 | 2 | 3 | 4 {
  if (xp >= EVOLUTION_STAGES[3].minXp) return 4;
  if (xp >= EVOLUTION_STAGES[2].minXp) return 3;
  if (xp >= EVOLUTION_STAGES[1].minXp) return 2;
  return 1;
}

export function isWordMastered(m?: WordMastery): boolean {
  if (!m) return false;
  return m.correct >= 2 && !m.needsPractice;
}

export function countMasteredWords(
  mastery: Record<string, WordMastery>,
): number {
  let count = 0;
  for (const item of VOCABULARY) {
    if (isWordMastered(mastery[item.id])) count++;
  }
  return count;
}

export function pickWeightedVocab(
  pool: VocabItem[],
  mastery: Record<string, WordMastery>,
  count: number,
): VocabItem[] {
  if (pool.length === 0) return [];
  const scored = pool.map((item) => {
    const m = mastery[item.id];
    let weight = 3;
    if (m) {
      if (m.needsPractice) weight = 6;
      else if (m.correct === 0) weight = 4;
      else if (m.correct === 1) weight = 2.5;
      else weight = 1;
    }
    return {
      item,
      sortKey: Math.random() * weight,
    };
  });
  scored.sort((a, b) => b.sortKey - a.sortKey);
  const result: VocabItem[] = [];
  for (let i = 0; i < count; i++) {
    result.push(scored[i % scored.length].item);
  }
  return result;
}

export function parseImportedSaveJson(raw: string): SaveData | null {
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.profiles ||
      typeof parsed.profiles !== 'object'
    ) {
      return null;
    }
    const profileKeys = Object.keys(parsed.profiles);
    if (profileKeys.length === 0) return null;
    const validProfiles: Record<string, CompanionProfile> = {};
    for (const k of profileKeys) {
      const p = parsed.profiles[k];
      if (!p || typeof p.profileName !== 'string') continue;
      validProfiles[k] = migrateProfile({...p, id: k});
    }
    const validKeys = Object.keys(validProfiles);
    if (validKeys.length === 0) return null;
    const activeId =
      parsed.activeProfileId && validProfiles[parsed.activeProfileId]
        ? parsed.activeProfileId
        : validKeys[0];
    return {
      version: 2,
      activeProfileId: activeId,
      profiles: validProfiles,
      runs: Array.isArray(parsed.runs) ? parsed.runs.slice(0, 100) : [],
    };
  } catch {
    return null;
  }
}
