// tslint:disable
/* eslint-disable */
import {
  Award,
  BookOpen,
  Check,
  Gamepad2,
  HelpCircle,
  Home,
  Menu,
  Package,
  Play,
  Plus,
  RotateCw,
  Shuffle,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  CARE_ITEM_PRICES,
  EVOLUTION_STAGES,
  getConfig,
  LEVEL_NAMES,
  TOTAL_LEVELS,
  UNIT_NAMES,
} from './constants';
import {
  CareAnimationKind,
  CritterPortrait,
  CritterSpeciesId,
  drawPixelCompanion,
  getCompanionMoodState,
  getCritterSpecies,
  getSpeciesStageLabel,
  pickRandomSpeciesId,
} from './critters';
import {RankingModal} from './RankingModal';
import {
  CompanionProfile,
  countMasteredWords,
  createDefaultProfile,
  getCompanionStage,
  loadSaveData,
  persistSaveData,
  SaveData,
  StudyMode,
} from './storage';
import {RoundSummary, StudyPanel} from './StudyPanel';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  clamp,
  createFixedStepper,
  drawAsset,
  drawBackground,
  GameState,
  gameAudio,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  useAssets,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  usePlaygroundResume,
  useRpc,
} from './utils/usePlayground';
import {VOCABULARY} from './vocabulary';

const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_sanctuary.mp3';

interface CustomWindow extends Window {
  canHandleBackKey?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'heart' | 'star' | 'bubble' | 'confetti' | 'crumb' | 'foam' | 'note';
}

interface CarePropAnim {
  kind: 'biscuit' | 'bubbles';
  startX: number;
  startY: number;
  x: number;
  y: number;
  scale: number;
  rot: number;
}

interface BouncyBallSim {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  scale: number;
  batted: boolean;
  life: number;
  maxLife: number;
}

interface CompanionSim {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number | null;
  facingRight: boolean;
  isGrounded: boolean;
  squashX: number;
  squashY: number;
  wanderTimer: number;
  petCooldown: number;
  bubbleText: string | null;
  bubbleTimer: number;
  careAction: CareAnimationKind;
  careTimer: number;
  careDuration: number;
  careStepAccum: number;
  careBurstDone: boolean;
}

type CareItemKind = 'biscuit' | 'bubbles' | 'flask';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();

  // --- GLOBAL PAUSE STATE ---
  const lastCancelRef = useRef(false);

  // --- PLAYGROUND SDK INTEGRATION ---
  const {sdk, isReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // --- GOOGLE FONTS INJECTION ---
  useEffect(() => {
    const id = 'critter-lab-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&family=Nunito:wght@600;700;800;900&family=Press+Start+2P&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // --- ASSETS ---
  const ASSETS_MANIFEST: Record<string, string> = {
    sanctuary_bg: 'assets/images/sanctuary_bg.png',
    item_biscuit: 'assets/images/item_biscuit.png',
    item_bubbles: 'assets/images/item_bubbles.png',
    item_flask_toy: 'assets/images/item_flask_toy.png',
    ui_star_badge: 'assets/images/ui_star_badge.png',
  };
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;
  const deskFloorY = getConfig('deskFloorY') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // Initialize audio volumes from config
  useEffect(() => {
    gameAudio.setVolume(getConfig('defaultSfxVolume'));
  }, []);

  // --- LOCAL PERSISTENCE & COMPANION PROFILE ---
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const saveDataRef = useRef(saveData);
  saveDataRef.current = saveData;

  const activeProfile: CompanionProfile = useMemo(() => {
    return (
      saveData.profiles[saveData.activeProfileId] ??
      Object.values(saveData.profiles)[0] ??
      createDefaultProfile('Explorer')
    );
  }, [saveData]);

  const activeProfileRef = useRef(activeProfile);
  activeProfileRef.current = activeProfile;

  useEffect(() => {
    persistSaveData(saveData);
  }, [saveData]);

  const companionStage = getCompanionStage(activeProfile.xp);
  const companionStageRef = useRef(companionStage);
  companionStageRef.current = companionStage;

  const activeSpecies = useMemo(
    () => getCritterSpecies(activeProfile.speciesId),
    [activeProfile.speciesId],
  );
  const activeStageLabel = useMemo(
    () => getSpeciesStageLabel(activeProfile.speciesId, companionStage),
    [activeProfile.speciesId, companionStage],
  );

  const moodState = useMemo(
    () =>
      getCompanionMoodState(
        activeProfile.hunger,
        activeProfile.happiness,
        activeProfile.energy,
      ),
    [activeProfile.hunger, activeProfile.happiness, activeProfile.energy],
  );

  const lowMoodBannerText = useMemo(() => {
    if (!moodState.isSad) return null;
    const parts: string[] = [];
    if (moodState.isTired) parts.push('tired');
    if (moodState.isHungry) parts.push('hungry');
    if (moodState.isLonely) parts.push('lonely');
    const feeling =
      parts.length > 0 ? parts.join(' & ') : 'low on energy';
    return `Feeling ${feeling} — study to earn XP & care for ${activeProfile.companionName}!`;
  }, [moodState, activeProfile.companionName]);

  const masteredCount = useMemo(
    () => countMasteredWords(activeProfile.mastery),
    [activeProfile.mastery],
  );

  // --- SUB-VIEWS & OVERLAY STATE ---
  const [subView, setSubView] = useState<'SANCTUARY' | 'STUDY'>('SANCTUARY');
  const [studyMode, setStudyMode] = useState<StudyMode>('FLASHCARDS');
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [selectedUnit, setSelectedUnit] = useState<1 | 2 | 3 | 'ALL'>('ALL');
  const [isStudySelectorOpen, setIsStudySelectorOpen] = useState(false);
  const [isCareShopOpen, setIsCareShopOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [evolvedNotice, setEvolvedNotice] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [titleNewProfileName, setTitleNewProfileName] = useState('');
  const [titleCandidateSpecies, setTitleCandidateSpecies] =
    useState<CritterSpeciesId>(() => {
      const existing = Object.values(saveData.profiles).map((p) => p.speciesId);
      return pickRandomSpeciesId(existing);
    });

  // Audio toggles (Menu-only per html_shared_features)
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const isAnyModalOpen =
    isGameMenuOpen ||
    isHowToPlayOpen ||
    isStudySelectorOpen ||
    isCareShopOpen ||
    isRankingOpen ||
    roundSummary !== null;

  // --- PLAYGROUND SAVE/RESUME ---
  // Do not remove: Playground save/resume
  const {initialLevel, initialScore, persistenceEnabled, autoStartPending} =
    usePlaygroundResume({
      isReady,
      assetsReady,
      onAutoStart: () => {
        if (gameStateRef.current.status === 'START') {
          initGame();
        }
      },
    });

  const clampedStartLevel = Math.max(
    1,
    Math.min(initialLevel || 1, TOTAL_LEVELS),
  ) as 1 | 2 | 3;
  const startScore = initialScore;

  const levelStartScoreRef = useRef(startScore);
  const prevLevelRef = useRef<number>(clampedStartLevel);
  const runWonRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: startScore,
    level: clampedStartLevel,
    lives: getConfig('startingHearts'),
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    setSelectedLevel(clampedStartLevel);
  }, [clampedStartLevel]);

  useEffect(() => {
    if (gameState.level !== prevLevelRef.current) {
      prevLevelRef.current = gameState.level;
      levelStartScoreRef.current = gameStateRef.current.score;
    }
  }, [gameState.level]);

  useEffect(() => {
    if (gameState.status === 'VICTORY') {
      runWonRef.current = true;
    }
  }, [gameState.status]);

  useEffect(() => {
    const canHandleBackKey = gameState.status !== 'START';
    (window as CustomWindow).canHandleBackKey = canHandleBackKey;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PLAYGROUND_CAN_HANDLE_BACK_KEY',
          value: canHandleBackKey,
        },
        '*',
      );
    }
  }, [gameState.status]);

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Virtual touch controls state (Mobile only)
  const virtualInputRef = useRef({left: false, right: false, jump: false});

  // --- CANVAS SIMULATION REFS ---
  const companionRef = useRef<CompanionSim>({
    x: canvasWidth / 2,
    y: deskFloorY,
    vx: 0,
    vy: 0,
    targetX: null,
    facingRight: true,
    isGrounded: true,
    squashX: 1,
    squashY: 1,
    wanderTimer: 2.5,
    petCooldown: 0,
    bubbleText: null,
    bubbleTimer: 0,
    careAction: 'none',
    careTimer: 0,
    careDuration: 2.4,
    careStepAccum: 0,
    careBurstDone: false,
  });

  const particlesRef = useRef<Particle[]>([]);
  const carePropRef = useRef<CarePropAnim | null>(null);
  const bouncyBallRef = useRef<BouncyBallSim>({
    active: false,
    x: canvasWidth / 2,
    y: deskFloorY - 120,
    vx: 0,
    vy: 0,
    rot: 0,
    vRot: 0,
    scale: 1,
    batted: false,
    life: 0,
    maxLife: 2.6,
  });
  const decayTimerRef = useRef(0);
  const statDrainCarryRef = useRef({hunger: 0, happiness: 0, energy: 0});
  const wasPointerDownRef = useRef(false);
  const wasJumpPressedRef = useRef(false);

  const spawnParticles = useCallback(
    (
      cx: number,
      cy: number,
      kind: Particle['kind'],
      count: number,
      color?: string,
    ) => {
      const palette =
        kind === 'heart'
          ? ['#FB7185', '#F43F5E', '#FDA4AF']
          : kind === 'bubble'
            ? ['#38BDF8', '#7DD3FC', '#BAE6FD']
            : kind === 'confetti' || kind === 'note'
              ? ['#10B981', '#F59E0B', '#38BDF8', '#FB7185']
              : kind === 'crumb'
                ? ['#FBBF24', '#F59E0B', '#FDE68A']
                : kind === 'foam'
                  ? ['#FFFFFF', '#E0F2FE', '#BAE6FD']
                  : ['#FBBF24', '#FDE68A', '#34D399'];

      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * Math.random();
        const speed =
          kind === 'foam'
            ? 25 + Math.random() * 65
            : 70 + Math.random() * 190;
        const maxLife = kind === 'foam' ? 0.85 : 1.3;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 44,
          y: cy - 20 + (Math.random() - 0.5) * 32,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 60,
          vy:
            kind === 'foam'
              ? -20 - Math.random() * 45
              : Math.sin(angle) * speed - 40,
          life: maxLife * (0.65 + Math.random() * 0.35),
          maxLife,
          size:
            kind === 'confetti' || kind === 'crumb'
              ? 6 + Math.random() * 5
              : kind === 'foam'
                ? 11 + Math.random() * 9
                : 11 + Math.random() * 6,
          color: color ?? palette[i % palette.length],
          kind,
        });
      }
    },
    [],
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    if (!evolvedNotice) return;
    const t = setTimeout(() => setEvolvedNotice(null), 4500);
    return () => clearTimeout(t);
  }, [evolvedNotice]);

  // --- CENTRALIZED LIFECYCLE FUNCTIONS ---
  const resetSanctuaryEntities = useCallback(() => {
    companionRef.current = {
      x: canvasWidth / 2,
      y: deskFloorY,
      vx: 0,
      vy: 0,
      targetX: null,
      facingRight: true,
      isGrounded: true,
      squashX: 1,
      squashY: 1,
      wanderTimer: 2.0,
      petCooldown: 0,
      bubbleText: 'Ready to study!',
      bubbleTimer: 2.5,
      careAction: 'none',
      careTimer: 0,
      careDuration: 2.4,
      careStepAccum: 0,
      careBurstDone: false,
    };
    particlesRef.current = [];
    carePropRef.current = null;
    bouncyBallRef.current.active = false;
    decayTimerRef.current = 0;
    statDrainCarryRef.current = {hunger: 0, happiness: 0, energy: 0};
  }, [canvasWidth, deskFloorY]);

  const startRun = useCallback(
    (level: number, score: number) => {
      const clampedLv = Math.max(1, Math.min(level, TOTAL_LEVELS)) as 1 | 2 | 3;
      levelStartScoreRef.current = score;
      prevLevelRef.current = clampedLv;
      runWonRef.current = false;
      setSelectedLevel(clampedLv);
      setSubView('SANCTUARY');
      setIsStudySelectorOpen(false);
      setIsCareShopOpen(false);
      setIsRankingOpen(false);
      setIsGameMenuOpen(false);
      setIsHowToPlayOpen(false);
      setRoundSummary(null);
      setEvolvedNotice(null);
      resetSanctuaryEntities();

      setGameState({
        status: 'PLAYING',
        level: clampedLv,
        score,
        lives: getConfig('startingHearts'),
      });

      console.log('GAME_STARTED');
      if (sdk) {
        sdk.startGame();
      }
    },
    [resetSanctuaryEntities, sdk],
  );

  const initGame = useCallback(() => {
    gameAudio.resume();
    if (persistenceEnabled && !runWonRef.current) {
      startRun(gameStateRef.current.level, levelStartScoreRef.current);
    } else {
      startRun(1, 0);
    }
  }, [startRun, persistenceEnabled]);

  const resetGame = useCallback(() => {
    gameAudio.resume();
    startRun(1, 0);
  }, [startRun]);

  usePlaygroundGameLifecycle(gameState, sdk);

  // Audio stingers on terminal state
  useEffect(() => {
    if (gameState.status === 'GAME_OVER') {
      gameAudio.playDefeatMotif();
    } else if (gameState.status === 'VICTORY') {
      gameAudio.playVictoryFanfare();
    }
  }, [gameState.status]);

  // Auto-start when ?autoplay is in URL
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  // --- COMPANION CARE ACTIONS & XP CARE SHOP ---
  const updateActiveProfile = useCallback(
    (updater: (p: CompanionProfile) => CompanionProfile) => {
      setSaveData((prev) => {
        const curr = prev.profiles[prev.activeProfileId];
        if (!curr) return prev;
        const nextProf = updater(curr);
        return {
          ...prev,
          profiles: {
            ...prev.profiles,
            [prev.activeProfileId]: {
              ...nextProf,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    [],
  );

  const checkAndTriggerEvolution = useCallback(
    (prevXp: number, nextXp: number, speciesId: CritterSpeciesId) => {
      const prevStage = getCompanionStage(prevXp);
      const nextStage = getCompanionStage(nextXp);
      if (nextStage > prevStage) {
        const stageLabel = getSpeciesStageLabel(speciesId, nextStage);
        gameAudio.playLevelUpStinger();
        setEvolvedNotice(
          `Grew to Stage ${nextStage}: ${stageLabel.en} (${stageLabel.zh})!`,
        );
        spawnParticles(
          companionRef.current.x,
          companionRef.current.y - 100,
          'confetti',
          28,
        );
      }
    },
    [spawnParticles],
  );

  const applyCareEffect = useCallback(
    (kind: CareItemKind) => {
      const comp = companionRef.current;
      comp.targetX = null;
      comp.careStepAccum = 0;
      comp.careBurstDone = false;

      if (kind === 'biscuit') {
        gameAudio.playPotionGulp();
        gameAudio.playCoinPickup();
        comp.careAction = 'feeding';
        comp.careDuration = 2.4;
        comp.careTimer = 2.4;
        comp.vx = 0;
        bouncyBallRef.current.active = false;
        const startX = comp.x + (comp.facingRight ? 155 : -155);
        const startY = comp.y - 210;
        carePropRef.current = {
          kind: 'biscuit',
          startX,
          startY,
          x: startX,
          y: startY,
          scale: 1,
          rot: 0,
        };
        spawnParticles(comp.x, comp.y - 85, 'heart', 6);
        comp.bubbleText = 'Yum! 好好吃!';
        comp.bubbleTimer = 2.3;
      } else if (kind === 'bubbles') {
        gameAudio.playPowerupChime();
        comp.careAction = 'cleaning';
        comp.careDuration = 2.45;
        comp.careTimer = 2.45;
        comp.vx = 0;
        bouncyBallRef.current.active = false;
        carePropRef.current = {
          kind: 'bubbles',
          startX: comp.x - 80,
          startY: comp.y - 165,
          x: comp.x - 80,
          y: comp.y - 165,
          scale: 1,
          rot: 0,
        };
        spawnParticles(comp.x, comp.y - 85, 'foam', 8);
        comp.bubbleText = 'So fresh! 亮晶晶!';
        comp.bubbleTimer = 2.3;
      } else {
        gameAudio.playRetroJump();
        gameAudio.playConfirmSelect();
        comp.careAction = 'playing';
        comp.careDuration = 2.6;
        comp.careTimer = 2.6;
        carePropRef.current = null;

        const spawnRight = comp.x < canvasWidth / 2;
        const spawnX = clamp(
          comp.x + (spawnRight ? 200 : -200),
          200,
          canvasWidth - 200,
        );
        comp.facingRight = spawnX >= comp.x;
        bouncyBallRef.current = {
          active: true,
          x: spawnX,
          y: deskFloorY - 230,
          vx: spawnRight ? -150 : 150,
          vy: -110,
          rot: 0,
          vRot: spawnRight ? -7 : 7,
          scale: 1,
          batted: false,
          life: 2.75,
          maxLife: 2.75,
        };
        spawnParticles(comp.x, comp.y - 90, 'note', 5);
        comp.bubbleText = 'Fun! 玩球球!';
        comp.bubbleTimer = 2.4;
      }
    },
    [canvasWidth, deskFloorY, spawnParticles],
  );

  const handleCareAction = useCallback(
    (kind: CareItemKind) => {
      const prof = activeProfileRef.current;
      const count =
        kind === 'biscuit'
          ? prof.biscuits
          : kind === 'bubbles'
            ? prof.bubbles
            : prof.flasks;
      const price = CARE_ITEM_PRICES[kind];
      const itemLabel =
        kind === 'biscuit'
          ? 'Star Biscuit'
          : kind === 'bubbles'
            ? 'Bubble Soap'
            : 'Bouncy Toy Ball';

      if (count > 0) {
        const prevXp = prof.xp;
        updateActiveProfile((p) => ({
          ...p,
          biscuits: kind === 'biscuit' ? Math.max(0, p.biscuits - 1) : p.biscuits,
          bubbles: kind === 'bubbles' ? Math.max(0, p.bubbles - 1) : p.bubbles,
          flasks: kind === 'flask' ? Math.max(0, p.flasks - 1) : p.flasks,
          hunger: kind === 'biscuit' ? clamp(p.hunger + 25, 0, 100) : p.hunger,
          energy: kind === 'bubbles' ? clamp(p.energy + 25, 0, 100) : p.energy,
          happiness:
            kind === 'flask' ? clamp(p.happiness + 25, 0, 100) : p.happiness,
          xp: p.xp + 5,
        }));
        applyCareEffect(kind);
        checkAndTriggerEvolution(prevXp, prevXp + 5, prof.speciesId);
      } else if (prof.spendableXp >= price) {
        // Inventory is 0 -> Buy & use immediately with Spendable XP!
        const prevXp = prof.xp;
        updateActiveProfile((p) => ({
          ...p,
          spendableXp: Math.max(0, p.spendableXp - price),
          hunger: kind === 'biscuit' ? clamp(p.hunger + 25, 0, 100) : p.hunger,
          energy: kind === 'bubbles' ? clamp(p.energy + 25, 0, 100) : p.energy,
          happiness:
            kind === 'flask' ? clamp(p.happiness + 25, 0, 100) : p.happiness,
          xp: p.xp + 5,
        }));
        applyCareEffect(kind);
        showToast(`Bought & used ${itemLabel} (-${price} Spendable XP)!`);
        checkAndTriggerEvolution(prevXp, prevXp + 5, prof.speciesId);
      } else {
        gameAudio.playErrorBuzz();
        showToast(
          `Need ${price} Spendable XP for ${itemLabel} — study in the Lab!`,
        );
      }
    },
    [
      applyCareEffect,
      checkAndTriggerEvolution,
      showToast,
      updateActiveProfile,
    ],
  );

  const handleBuyCareItem = useCallback(
    (kind: CareItemKind, quantity = 1, useImmediately = false) => {
      const prof = activeProfileRef.current;
      const unitPrice = CARE_ITEM_PRICES[kind];
      const totalCost = unitPrice * quantity;
      const itemLabel =
        kind === 'biscuit'
          ? 'Star Biscuit'
          : kind === 'bubbles'
            ? 'Bubble Soap'
            : 'Bouncy Toy Ball';

      if (prof.spendableXp < totalCost) {
        gameAudio.playErrorBuzz();
        showToast(`Need ${totalCost} Spendable XP to buy ${quantity}x ${itemLabel}!`);
        return;
      }

      const prevXp = prof.xp;
      const addInventory = useImmediately ? quantity - 1 : quantity;

      updateActiveProfile((p) => ({
        ...p,
        spendableXp: Math.max(0, p.spendableXp - totalCost),
        biscuits: p.biscuits + (kind === 'biscuit' ? addInventory : 0),
        bubbles: p.bubbles + (kind === 'bubbles' ? addInventory : 0),
        flasks: p.flasks + (kind === 'flask' ? addInventory : 0),
        hunger:
          useImmediately && kind === 'biscuit'
            ? clamp(p.hunger + 25, 0, 100)
            : p.hunger,
        energy:
          useImmediately && kind === 'bubbles'
            ? clamp(p.energy + 25, 0, 100)
            : p.energy,
        happiness:
          useImmediately && kind === 'flask'
            ? clamp(p.happiness + 25, 0, 100)
            : p.happiness,
        xp: useImmediately ? p.xp + 5 : p.xp,
      }));

      if (useImmediately) {
        applyCareEffect(kind);
        showToast(`Bought & used ${itemLabel} (-${totalCost} XP)!`);
        checkAndTriggerEvolution(prevXp, prevXp + 5, prof.speciesId);
      } else {
        gameAudio.playCoinPickup();
        showToast(`Bought +${quantity} ${itemLabel} (-${totalCost} XP)!`);
      }
    },
    [
      applyCareEffect,
      checkAndTriggerEvolution,
      showToast,
      updateActiveProfile,
    ],
  );

  // --- STUDY CALLBACKS ---
  const handleWordResult = useCallback(
    (
      vocabId: string,
      correct: boolean,
      ptsDelta: number,
      xpDelta: number,
      needsPracticeFlag?: boolean,
      _energyDelta = 0,
    ) => {
      const prevXp = activeProfileRef.current.xp;
      const speciesId = activeProfileRef.current.speciesId;

      updateActiveProfile((p) => {
        const oldM = p.mastery[vocabId] ?? {
          attempts: 0,
          correct: 0,
          needsPractice: false,
        };
        return {
          ...p,
          xp: p.xp + xpDelta,
          spendableXp: p.spendableXp + xpDelta,
          totalScore: p.totalScore + ptsDelta,
          totalAttempts: p.totalAttempts + 1,
          totalCorrect: p.totalCorrect + (correct ? 1 : 0),
          mastery: {
            ...p.mastery,
            [vocabId]: {
              attempts: oldM.attempts + 1,
              correct: oldM.correct + (correct ? 1 : 0),
              needsPractice:
                needsPracticeFlag !== undefined
                  ? needsPracticeFlag
                  : !correct,
            },
          },
        };
      });

      if (ptsDelta > 0) {
        setGameState((prev) => {
          const newScore = prev.score + ptsDelta;
          console.log('SCORE_UPDATED', newScore);
          return {...prev, score: newScore};
        });
      }

      checkAndTriggerEvolution(prevXp, prevXp + xpDelta, speciesId);
    },
    [checkAndTriggerEvolution, updateActiveProfile],
  );

  const handleBonusTreat = useCallback(
    (kind: CareItemKind) => {
      updateActiveProfile((p) => ({
        ...p,
        biscuits: p.biscuits + (kind === 'biscuit' ? 1 : 0),
        bubbles: p.bubbles + (kind === 'bubbles' ? 1 : 0),
        flasks: p.flasks + (kind === 'flask' ? 1 : 0),
      }));
    },
    [updateActiveProfile],
  );

  const handleCompleteRound = useCallback(
    (summary: RoundSummary) => {
      const accuracy =
        summary.totalAttempts > 0
          ? Math.round((summary.correctCount / summary.totalAttempts) * 100)
          : 100;

      // Award completion treat on successful rounds + apply study effort consumption dip
      const bonusBiscuit = !summary.failed ? 1 : 0;
      const hungerDip = -getConfig('studyRoundHungerDrain');
      const energyDip = -getConfig('studyRoundEnergyDrain');
      const happinessDelta = !summary.failed
        ? -getConfig('studyRoundHappinessDrain')
        : -getConfig('studyRoundHappinessDrain') * 2;

      setSaveData((prev) => {
        const curr = prev.profiles[prev.activeProfileId];
        if (!curr) return prev;
        const nextProf: CompanionProfile = {
          ...curr,
          biscuits: curr.biscuits + bonusBiscuit,
          hunger: clamp(Number((curr.hunger + hungerDip).toFixed(1)), 0, 100),
          energy: clamp(Number((curr.energy + energyDip).toFixed(1)), 0, 100),
          happiness: clamp(
            Number((curr.happiness + happinessDelta).toFixed(1)),
            0,
            100,
          ),
          bestStreak: Math.max(curr.bestStreak, summary.maxStreak),
          updatedAt: Date.now(),
        };
        const record = {
          id: `run_${Date.now()}`,
          profileId: curr.id,
          profileName: curr.profileName,
          speciesId: curr.speciesId,
          mode: summary.mode,
          level: summary.level,
          unit: summary.unit,
          score: summary.scoreEarned,
          accuracy,
          maxStreak: summary.maxStreak,
          masteredCount: countMasteredWords(curr.mastery),
          timestamp: Date.now(),
        };
        return {
          ...prev,
          profiles: {...prev.profiles, [curr.id]: nextProf},
          runs: [record, ...prev.runs].slice(0, 80),
        };
      });

      if (summary.failed) {
        setSubView('SANCTUARY');
        setGameState((prev) => ({
          ...prev,
          status: 'GAME_OVER',
          lives: 0,
        }));
      } else {
        gameAudio.playPowerupChime();
        setRoundSummary({
          ...summary,
          treatsEarned: {
            ...summary.treatsEarned,
            biscuits: summary.treatsEarned.biscuits + bonusBiscuit,
          },
        });
        setSubView('SANCTUARY');
        spawnParticles(
          companionRef.current.x,
          companionRef.current.y - 90,
          'confetti',
          22,
        );
      }
    },
    [spawnParticles],
  );

  // --- 60 FPS SANCTUARY UPDATE & DRAW ---
  const update = (dt: number) => {
    if (
      gameStateRef.current.status !== 'PLAYING' ||
      isGameMenuOpen ||
      isHowToPlayOpen
    ) {
      return;
    }

    const comp = companionRef.current;
    const prof = activeProfileRef.current;
    const mood = getCompanionMoodState(
      prof.hunger,
      prof.happiness,
      prof.energy,
    );
    const isSad = mood.isSad;

    // Active passive care stat consumption (paused during care animations & modals)
    if (!isAnyModalOpen && comp.careAction === 'none') {
      const studyRateMultiplier = subView === 'STUDY' ? 0.5 : 1;
      decayTimerRef.current += dt;
      const decayInterval = getConfig('statDecayIntervalSec');
      if (decayTimerRef.current >= decayInterval) {
        decayTimerRef.current -= decayInterval;
        const carry = statDrainCarryRef.current;
        carry.hunger +=
          getConfig('hungerDecayPerSec') * decayInterval * studyRateMultiplier;
        carry.happiness +=
          getConfig('happinessDecayPerSec') *
          decayInterval *
          studyRateMultiplier;
        carry.energy +=
          getConfig('energyDecayPerSec') * decayInterval * studyRateMultiplier;

        const drainH = Math.floor(carry.hunger);
        const drainHap = Math.floor(carry.happiness);
        const drainE = Math.floor(carry.energy);
        carry.hunger -= drainH;
        carry.happiness -= drainHap;
        carry.energy -= drainE;

        if (drainH > 0 || drainHap > 0 || drainE > 0) {
          updateActiveProfile((p) => ({
            ...p,
            hunger: Math.max(0, Math.round(p.hunger) - drainH),
            happiness: Math.max(0, Math.round(p.happiness) - drainHap),
            energy: Math.max(0, Math.round(p.energy) - drainE),
          }));
        }
      }
    }

    // Cooldowns & bubble timer
    if (comp.petCooldown > 0) comp.petCooldown = Math.max(0, comp.petCooldown - dt);
    if (comp.bubbleTimer > 0) {
      comp.bubbleTimer = Math.max(0, comp.bubbleTimer - dt);
      if (comp.bubbleTimer <= 0) comp.bubbleText = null;
    }

    // Smooth squash-and-stretch recovery
    comp.squashX += (1 - comp.squashX) * Math.min(1, dt * 12);
    comp.squashY += (1 - comp.squashY) * Math.min(1, dt * 12);

    const canControlSanctuary =
      subView === 'SANCTUARY' &&
      !isStudySelectorOpen &&
      !isCareShopOpen &&
      !isRankingOpen &&
      roundSummary === null;

    const input = inputRef.current;
    const walkSpeed = getConfig('companionSpeed');
    const jumpVel = getConfig('companionJumpVel');
    const gravity = getConfig('companionGravity');
    const minDeskX = 160;
    const maxDeskX = canvasWidth - 160;

    // Bouncy Toy Ball physics (active during & briefly after play animation)
    const ball = bouncyBallRef.current;
    if (ball.active) {
      ball.life -= dt;
      if (ball.life <= 0) {
        ball.active = false;
      } else {
        const ballRadius = getConfig('assetFlaskToyHeight') * 0.44;
        ball.vy += 1280 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.rot += ball.vRot * dt;
        ball.scale += (1 - ball.scale) * Math.min(1, dt * 14);

        if (ball.y >= deskFloorY - ballRadius) {
          ball.y = deskFloorY - ballRadius;
          if (Math.abs(ball.vy) > 150) {
            gameAudio.playHoverMicroTone();
            ball.scale = 1.18;
          }
          ball.vy = -Math.max(220, Math.abs(ball.vy) * 0.76);
          ball.vx *= 0.94;
        }
        if (ball.x <= minDeskX - 20) {
          ball.x = minDeskX - 20;
          ball.vx = Math.abs(ball.vx);
          ball.vRot = Math.abs(ball.vRot);
        } else if (ball.x >= maxDeskX + 20) {
          ball.x = maxDeskX + 20;
          ball.vx = -Math.abs(ball.vx);
          ball.vRot = -Math.abs(ball.vRot);
        }
      }
    }

    // Active Care Animation state machine
    if (comp.careAction !== 'none') {
      comp.careTimer -= dt;
      comp.careStepAccum += dt;
      const progress = clamp(1 - comp.careTimer / comp.careDuration, 0, 1);

      if (comp.careAction === 'feeding') {
        comp.vx *= Math.max(0, 1 - dt * 14);
        const mouthX = comp.x + (comp.facingRight ? 26 : -26);
        const mouthY = comp.y - 96;
        if (carePropRef.current && carePropRef.current.kind === 'biscuit') {
          const prop = carePropRef.current;
          if (progress < 0.34) {
            const t = progress / 0.34;
            prop.x = prop.startX + (mouthX - prop.startX) * t;
            prop.y =
              prop.startY +
              (mouthY - prop.startY) * t -
              Math.sin(t * Math.PI) * 55;
            prop.rot = t * 0.35;
            prop.scale = 1;
          } else {
            const chewT = clamp((progress - 0.34) / 0.58, 0, 1);
            prop.x = mouthX;
            prop.y = mouthY + Math.sin(progress * Math.PI * 16) * 4;
            prop.rot = Math.sin(progress * Math.PI * 12) * 0.2;
            prop.scale = Math.max(0.05, 1 - chewT);
          }
        }
        if (progress > 0.3 && progress < 0.92) {
          const chewBeat = Math.sin(progress * Math.PI * 14);
          comp.squashX = 1 + chewBeat * 0.08;
          comp.squashY = 1 - chewBeat * 0.08;
          if (comp.careStepAccum >= 0.28) {
            comp.careStepAccum = 0;
            spawnParticles(mouthX, mouthY, 'crumb', 4);
            spawnParticles(comp.x, comp.y - 125, 'heart', 2);
            gameAudio.playCrispClick();
          }
        }
      } else if (comp.careAction === 'cleaning') {
        comp.vx *= Math.max(0, 1 - dt * 14);
        if (carePropRef.current && carePropRef.current.kind === 'bubbles') {
          const prop = carePropRef.current;
          if (progress < 0.72) {
            prop.x = comp.x + Math.sin(progress * Math.PI * 8) * 48;
            prop.y = comp.y - 92 + Math.cos(progress * Math.PI * 16) * 18;
            prop.rot = Math.sin(progress * Math.PI * 8) * 0.25;
            prop.scale = 1;
          } else {
            prop.scale = Math.max(0, 1 - (progress - 0.72) / 0.25);
          }
        }
        if (progress < 0.72 && comp.careStepAccum >= 0.14) {
          comp.careStepAccum = 0;
          spawnParticles(comp.x, comp.y - 78, 'foam', 4);
        }
        if (progress >= 0.72 && !comp.careBurstDone) {
          comp.careBurstDone = true;
          comp.vy = -370;
          comp.isGrounded = false;
          comp.squashX = 0.85;
          comp.squashY = 1.2;
          gameAudio.playPowerupChime();
          spawnParticles(comp.x, comp.y - 90, 'bubble', 14);
          spawnParticles(comp.x, comp.y - 105, 'star', 10);
        }
      } else if (comp.careAction === 'playing') {
        if (ball.active) {
          const dx = ball.x - comp.x;
          if (Math.abs(dx) > 4) {
            comp.facingRight = dx >= 0;
          }
          if (!ball.batted && Math.abs(dx) > 36) {
            comp.vx = Math.sign(dx) * walkSpeed * 1.45;
          } else {
            comp.vx *= Math.max(0, 1 - dt * 10);
          }

          if (!comp.careBurstDone && (Math.abs(dx) <= 72 || progress > 0.42)) {
            comp.careBurstDone = true;
            comp.vy = -460;
            comp.isGrounded = false;
            comp.squashX = 0.82;
            comp.squashY = 1.24;
            ball.batted = true;
            ball.vy = -520;
            ball.vx = (comp.facingRight ? 1 : -1) * 320;
            ball.vRot = comp.facingRight ? 14 : -14;
            ball.scale = 1.25;
            gameAudio.playConfirmSelect();
            gameAudio.playCoinPickup();
            spawnParticles(ball.x, ball.y, 'note', 6);
            spawnParticles(ball.x, ball.y, 'confetti', 14);
          }
        } else {
          comp.vx *= Math.max(0, 1 - dt * 10);
        }
      }

      if (comp.careTimer <= 0) {
        if (comp.careAction === 'feeding') {
          spawnParticles(comp.x, comp.y - 110, 'heart', 5);
        }
        comp.careAction = 'none';
        comp.careTimer = 0;
        carePropRef.current = null;
      }
    }

    // Pointer interaction on sanctuary canvas
    if (canControlSanctuary && input) {
      const pointerDown = input.pointer.down;
      if (pointerDown && !wasPointerDownRef.current) {
        const px = clamp(input.pointer.x, minDeskX, maxDeskX);
        const py = input.pointer.y;
        const dist = Math.hypot(px - comp.x, py - (comp.y - 90));
        if (dist < 115 && comp.petCooldown <= 0) {
          // Pet companion! (Weary tiny reaction when sad/low-energy; joyful hop when healthy)
          comp.petCooldown = 0.55;
          comp.targetX = null;
          if (isSad && comp.careAction === 'none') {
            comp.squashX = 1.08;
            comp.squashY = 0.92;
            comp.bubbleText = '*sigh*... need care!';
            comp.bubbleTimer = 2.0;
            gameAudio.playHoverMicroTone();
            spawnParticles(comp.x, comp.y - 95, 'heart', 2);
            updateActiveProfile((p) => ({
              ...p,
              happiness: clamp(p.happiness + 2, 0, 100),
            }));
          } else {
            comp.vy = jumpVel * 0.65;
            comp.isGrounded = false;
            comp.squashX = 1.22;
            comp.squashY = 0.82;
            comp.bubbleText = 'Hehe! ♥';
            comp.bubbleTimer = 1.8;
            gameAudio.playConfirmSelect();
            spawnParticles(comp.x, comp.y - 100, 'heart', 6);
            updateActiveProfile((p) => ({
              ...p,
              happiness: clamp(p.happiness + 3, 0, 100),
            }));
          }
        } else if (isSad && comp.careAction === 'none') {
          // Stay resting still when low on stats instead of walking across the desk
          comp.targetX = null;
          comp.squashX = 1.05;
          comp.squashY = 0.95;
          comp.bubbleText = 'Too tired to walk...';
          comp.bubbleTimer = 2.0;
          gameAudio.playHoverMicroTone();
        } else {
          comp.careAction = 'none';
          carePropRef.current = null;
          comp.targetX = px;
          gameAudio.playCrispClick();
        }
      }
      wasPointerDownRef.current = pointerDown;
    } else if (input) {
      wasPointerDownRef.current = input.pointer.down;
    }

    // Horizontal movement (disabled when sad & not in an active care animation)
    let moveDir = 0;
    if (canControlSanctuary && input) {
      if (input.actions.left || virtualInputRef.current.left) moveDir -= 1;
      if (input.actions.right || virtualInputRef.current.right) moveDir += 1;

      const jumpPressed = input.actions.up || virtualInputRef.current.jump;
      if (jumpPressed && !wasJumpPressedRef.current && comp.isGrounded) {
        if (isSad && comp.careAction === 'none') {
          // Weary tiny nudge reaction instead of hopping
          comp.squashX = 1.07;
          comp.squashY = 0.93;
          if (!comp.bubbleText) {
            comp.bubbleText = 'Low energy... feed/care!';
            comp.bubbleTimer = 2.0;
          }
          gameAudio.playHoverMicroTone();
        } else {
          comp.vy = jumpVel;
          comp.isGrounded = false;
          comp.squashX = 0.85;
          comp.squashY = 1.2;
          gameAudio.playRetroJump();
        }
      }
      wasJumpPressedRef.current = jumpPressed;
    }

    if (isSad && comp.careAction === 'none') {
      // Stationary resting posture when sad/tired
      comp.targetX = null;
      comp.vx *= Math.max(0, 1 - dt * 12);
      if (moveDir !== 0) {
        comp.facingRight = moveDir > 0;
        if (!comp.bubbleText) {
          comp.squashX = 1.05;
          comp.squashY = 0.95;
          comp.bubbleText = 'Too tired... need care!';
          comp.bubbleTimer = 2.0;
        }
      }
    } else if (moveDir !== 0) {
      comp.careAction = 'none';
      carePropRef.current = null;
      comp.targetX = null;
      comp.vx = moveDir * walkSpeed;
    } else if (comp.careAction === 'none') {
      if (comp.targetX !== null) {
        const diff = comp.targetX - comp.x;
        if (Math.abs(diff) < 10) {
          comp.targetX = null;
          comp.vx = 0;
        } else {
          comp.vx = Math.sign(diff) * walkSpeed;
        }
      } else {
        // Gentle cozy autonomous wandering (only when healthy & energetic)
        comp.wanderTimer -= dt;
        if (comp.wanderTimer <= 0) {
          comp.wanderTimer = 2.8 + Math.random() * 3.5;
          if (Math.random() < 0.7) {
            comp.targetX = minDeskX + Math.random() * (maxDeskX - minDeskX);
          }
        }
        comp.vx *= Math.max(0, 1 - dt * 10);
      }
    }

    if (comp.vx > 0.5) comp.facingRight = true;
    else if (comp.vx < -0.5) comp.facingRight = false;

    comp.x = clamp(comp.x + comp.vx * dt, minDeskX, maxDeskX);

    // Vertical physics
    if (!comp.isGrounded) {
      comp.vy += gravity * dt;
      comp.y += comp.vy * dt;
      if (comp.y >= deskFloorY) {
        comp.y = deskFloorY;
        comp.vy = 0;
        comp.isGrounded = true;
        comp.squashX = 1.18;
        comp.squashY = 0.84;
      }
    }

    // Mood thought bubble reminders
    if (!comp.bubbleText && isSad && comp.careAction === 'none') {
      if (mood.isHungry) {
        comp.bubbleText = 'Hungry... 好餓~';
      } else if (mood.isTired) {
        comp.bubbleText = 'So tired... 沒精神';
      } else {
        comp.bubbleText = 'Feeling sad... 抱抱';
      }
      comp.bubbleTimer = 3.2;
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'confetti' || p.kind === 'crumb') p.vy += 320 * dt;
      else if (p.kind === 'bubble' || p.kind === 'foam') p.vy -= 30 * dt;
      return true;
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawBackground(
      ctx,
      assets['sanctuary_bg'],
      canvasWidth,
      canvasHeight,
      getConfig('backgroundColor'),
    );

    const comp = companionRef.current;
    const stage = companionStageRef.current;
    const prof = activeProfileRef.current;
    const mood = getCompanionMoodState(
      prof.hunger,
      prof.happiness,
      prof.energy,
    );
    const isSad = mood.isSad;

    // Ground shadow
    const heightAboveDesk = Math.max(0, deskFloorY - comp.y);
    const shadowScale = Math.max(0.45, 1 - heightAboveDesk / 260);
    ctx.save();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.24)';
    ctx.beginPath();
    ctx.ellipse(
      comp.x,
      deskFloorY + 6,
      Math.max(0, (54 + stage * 6) * shadowScale),
      Math.max(0, 14 * shadowScale),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    const nowSec = performance.now() / 1000;
    const isMoving = Math.abs(comp.vx) > 15;
    const walkHop =
      isMoving && comp.isGrounded && !(isSad && comp.careAction === 'none')
        ? Math.abs(Math.sin(nowSec * 12)) * 11
        : 0;

    // Procedural Pixel-Art Companion (Same species growing consistently across Stages 1–4!)
    const basePixelSize = stage === 1 ? 7.5 : stage === 2 ? 8 : stage === 3 ? 8.5 : 9;
    const careProgress =
      comp.careAction !== 'none' && comp.careDuration > 0
        ? clamp(1 - comp.careTimer / comp.careDuration, 0, 1)
        : 0;
    ctx.save();
    if (isSad && comp.careAction === 'none') {
      ctx.globalAlpha = 0.94;
      if ('filter' in ctx) {
        ctx.filter = 'saturate(0.62) brightness(0.94)';
      }
    }
    drawPixelCompanion(ctx, {
      speciesId: prof.speciesId,
      stage,
      centerX: comp.x,
      bottomY: comp.y - walkHop,
      pixelSize: basePixelSize,
      facingRight: comp.facingRight,
      squashX: comp.squashX,
      squashY: comp.squashY,
      isMoving,
      isGrounded: comp.isGrounded,
      isSulking: isSad,
      animTime: nowSec,
      careAction: comp.careAction,
      careProgress,
    });
    ctx.restore();

    // Floating sad/tired icon indicator above companion when stats are low
    if (isSad && comp.careAction === 'none') {
      const iconY = comp.y - (132 + stage * 18) + Math.sin(nowSec * 2.1) * 4;
      const iconX = comp.x + 56;
      const badgeSymbol = mood.isTired
        ? 'zZz'
        : mood.isHungry
          ? '🍪?'
          : '💧';
      ctx.save();
      ctx.fillStyle = '#FFFDF7';
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(iconX - 22, iconY - 16, 44, 30, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.font = '800 14px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeSymbol, iconX, iconY);
      ctx.restore();
    }

    // Active Feed / Clean Care Prop (Star Biscuit or Bubble Soap)
    const prop = carePropRef.current;
    if (prop && prop.scale > 0.02) {
      const assetKey =
        prop.kind === 'biscuit' ? 'item_biscuit' : 'item_bubbles';
      const h =
        prop.kind === 'biscuit'
          ? getConfig('assetBiscuitHeight')
          : getConfig('assetBubblesHeight');
      const aspect =
        prop.kind === 'biscuit'
          ? getConfig('assetBiscuitAspectRatio')
          : getConfig('assetBubblesAspectRatio');
      const w = h * aspect;

      ctx.save();
      ctx.translate(prop.x, prop.y);
      ctx.rotate(prop.rot);
      ctx.scale(prop.scale, prop.scale);
      drawAsset(
        ctx,
        assets[assetKey],
        -w / 2,
        -h / 2,
        w,
        h,
        (c) => {
          c.fillStyle = prop.kind === 'biscuit' ? '#FBBF24' : '#38BDF8';
          c.fillRect(-w / 2, -h / 2, w, h);
        },
      );
      ctx.restore();
    }

    // Active Bouncy Toy Ball Prop (during Play)
    const ball = bouncyBallRef.current;
    if (ball.active) {
      const ballAlpha = clamp(ball.life / 0.35, 0, 1);
      const bh = getConfig('assetFlaskToyHeight');
      const bw = bh * getConfig('assetFlaskToyAspectRatio');
      const ballHeightAboveDesk = Math.max(0, deskFloorY - (ball.y + bh * 0.44));
      const ballShadowScale = Math.max(0.35, 1 - ballHeightAboveDesk / 260);

      // Toy Ball Shadow on desk
      ctx.save();
      ctx.globalAlpha = ballAlpha * 0.25;
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(
        ball.x,
        deskFloorY + 4,
        Math.max(0, 26 * ballShadowScale),
        Math.max(0, 7 * ballShadowScale),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // Toy Ball Sprite
      ctx.save();
      ctx.globalAlpha = ballAlpha;
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rot);
      ctx.scale(ball.scale, 2 - ball.scale);
      drawAsset(
        ctx,
        assets['item_flask_toy'],
        -bw / 2,
        -bh / 2,
        bw,
        bh,
        (c) => {
          c.fillStyle = '#FB7185';
          c.beginPath();
          c.arc(0, 0, Math.max(0, bw * 0.45), 0, Math.PI * 2);
          c.fill();
        },
      );
      ctx.restore();
    }

    // Particles
    for (const p of particlesRef.current) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.kind === 'bubble') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * 0.65), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'foam') {
        ctx.strokeStyle = '#7DD3FC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * 0.72), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'heart') {
        ctx.font = `bold ${Math.round(p.size * 1.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('♥', p.x, p.y);
      } else if (p.kind === 'star') {
        ctx.font = `bold ${Math.round(p.size * 1.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('★', p.x, p.y);
      } else if (p.kind === 'note') {
        ctx.font = `bold ${Math.round(p.size * 1.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('♪', p.x, p.y);
      } else if (p.kind === 'crumb') {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      }
      ctx.restore();
    }

    // Mood / Reaction Thought Bubble
    if (comp.bubbleText) {
      ctx.save();
      const bx = comp.x;
      const by = comp.y - (180 + stage * 22);
      ctx.font = '800 18px "Nunito", "Noto Sans TC", sans-serif';
      const metrics = ctx.measureText(comp.bubbleText);
      const padX = 18;
      const bw = Math.max(120, metrics.width + padX * 2);
      const bh = 42;
      ctx.fillStyle = '#FFFDF7';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.bubbleText, bx, by);
      ctx.restore();
    }
  };

  // --- MAIN GAME LOOP ---
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  const toggleMenuRef = useRef<() => void>(() => {});
  toggleMenuRef.current = () => {
    const currentStatus = gameStateRef.current.status;
    if (isHowToPlayOpen) {
      setIsHowToPlayOpen(false);
      return;
    }
    if (isRankingOpen) {
      setIsRankingOpen(false);
      return;
    }
    if (isCareShopOpen) {
      setIsCareShopOpen(false);
      return;
    }
    if (isStudySelectorOpen) {
      setIsStudySelectorOpen(false);
      return;
    }
    if (currentStatus === 'PLAYING') {
      setIsGameMenuOpen((prev) => !prev);
    } else if (currentStatus === 'START') {
      exitChat({}).catch(() => {});
    } else if (
      ['GAME_OVER', 'VICTORY', 'LEVEL_COMPLETE'].includes(currentStatus)
    ) {
      setGameState((prev) => ({...prev, status: 'START'}));
    }
  };

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          toggleMenuRef.current();
        }
        lastCancelRef.current = cancelPressed;
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isMusicPlaying =
    gameState.status === 'PLAYING' && !isGameMenuOpen && !isHowToPlayOpen;

  const currentStageInfo = EVOLUTION_STAGES[companionStage - 1];
  const nextStageInfo =
    EVOLUTION_STAGES.find((s) => s.stage === companionStage + 1) ?? null;
  const xpProgressPct = nextStageInfo
    ? clamp(
        Math.round(
          ((activeProfile.xp - currentStageInfo.minXp) /
            (nextStageInfo.minXp - currentStageInfo.minXp)) *
            100,
        ),
        0,
        100,
      )
    : 100;

  const startStudyRound = (mode: StudyMode) => {
    gameAudio.playConfirmSelect();
    setStudyMode(mode);
    setGameState((prev) => ({...prev, level: selectedLevel}));
    setIsStudySelectorOpen(false);
    setSubView('STUDY');
  };

  const triggerGraduationVictory = () => {
    setRoundSummary(null);
    setSubView('SANCTUARY');
    setGameState((prev) => ({
      ...prev,
      level: TOTAL_LEVELS,
      status: 'VICTORY',
    }));
  };

  const titleCandidate = getCritterSpecies(titleCandidateSpecies);

  return (
    <div
      style={{fontFamily: getConfig('fontFamily')}}
      className="fixed inset-0 w-screen h-screen overflow-hidden touch-none flex flex-col bg-[#F5EFE6] text-[#1E293B] select-none">
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#F5EFE6] text-[#1E293B]">
          <div
            style={{fontFamily: getConfig('pixelFontFamily')}}
            className="text-sm sm:text-base animate-pulse">
            Loading Critter Lab...
          </div>
        </div>
      )}

      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
        volume={getConfig('defaultMusicVolume')}
      />

      {/* TOP DEDICATED HUD BAR (Never overlaps canvas; Menu button strictly top-right) */}
      <header className="w-full bg-[#FFFDF7] border-b-4 border-[#1E293B] px-2 py-1.5 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0">
        {/* Left: Companion Badge, Spendable XP, Growth XP Bar, Vital Meters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-emerald-100 border-2 border-[#1E293B] rounded-xl px-2 py-1">
            <Sparkles size={14} className="text-emerald-700 shrink-0" />
            <span className="text-xs font-black truncate max-w-[100px]">
              {activeProfile.companionName}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-900 hidden sm:inline">
              ({activeSpecies.enName})
            </span>
            <span className="text-[10px] font-extrabold bg-[#1E293B] text-amber-300 px-1.5 py-0.5 rounded-md">
              Lv.{companionStage}
            </span>
          </div>

          {/* Score & Spendable XP */}
          <div className="flex items-center gap-1.5 bg-white border-2 border-[#1E293B] rounded-xl px-2 py-1 text-xs font-black">
            <span>Pts: {gameState.score}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              gameAudio.playCrispClick();
              setIsCareShopOpen(true);
            }}
            title="Spendable XP — Buy Food, Soap & Toys without losing Growth XP!"
            className="flex items-center gap-1 bg-amber-300 hover:bg-amber-200 border-2 border-[#1E293B] rounded-xl px-2.5 py-1 text-xs font-black shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
            <Star size={13} className="fill-amber-600 text-[#1E293B]" />
            <span>{activeProfile.spendableXp} XP</span>
          </button>

          {/* Growth XP Progress Bar */}
          <div
            title="Growth XP never decreases when shopping!"
            className="flex items-center gap-1.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl px-2 py-1 text-[10px] sm:text-xs font-black text-emerald-900">
            <span>
              Growth: {activeProfile.xp}
              {nextStageInfo ? `/${nextStageInfo.minXp}` : ' MAX'}
            </span>
            <div className="w-12 sm:w-16 h-2.5 bg-emerald-200 rounded-full overflow-hidden border border-emerald-700">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{width: `${xpProgressPct}%`}}
              />
            </div>
          </div>

          {/* Mini Care Bars with Low-Stat Coral-Red Warning */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  key: 'hunger',
                  icon: '🍪',
                  label: 'Food / Hunger',
                  value: activeProfile.hunger,
                  isLow: moodState.isHungry,
                  barColor: 'bg-amber-500',
                },
                {
                  key: 'happiness',
                  icon: '♥',
                  label: 'Happiness / Heart',
                  value: activeProfile.happiness,
                  isLow: moodState.isLonely,
                  barColor: 'bg-rose-400',
                },
                {
                  key: 'energy',
                  icon: '⚡',
                  label: 'Energy',
                  value: activeProfile.energy,
                  isLow: moodState.isTired,
                  barColor: 'bg-sky-500',
                },
              ] as const
            ).map((stat) => {
              const isCrit = stat.value <= getConfig('criticalStatThreshold');
              return (
                <div
                  key={stat.key}
                  title={`${stat.label}: ${Math.round(stat.value)}%${stat.isLow ? ' (Low! Needs care)' : ''}`}
                  className={`flex items-center gap-1 rounded-xl border-2 px-2 py-1 text-[10px] font-black transition-colors ${
                    isCrit
                      ? 'bg-rose-200 border-rose-600 text-rose-900 animate-pulse'
                      : stat.isLow
                        ? 'bg-rose-100 border-rose-500 text-rose-700 animate-pulse'
                        : 'bg-slate-100 border-slate-300 text-[#1E293B]'
                  }`}>
                  <span>{stat.icon}</span>
                  <div className="w-7 sm:w-9 h-2 bg-white/80 rounded-full overflow-hidden border border-[#1E293B]/30">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stat.isLow ? 'bg-rose-500' : stat.barColor
                      }`}
                      style={{width: `${clamp(stat.value, 0, 100)}%`}}
                    />
                  </div>
                  <span>{Math.round(stat.value)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Exclusive Top-Right Menu Button */}
        <div className="ml-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              gameAudio.playCrispClick();
              setIsGameMenuOpen((prev) => !prev);
            }}
            aria-label="Open Game Menu"
            className="min-w-[48px] min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-amber-300 hover:bg-amber-200 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_0_#1E293B]">
            <Menu size={18} />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* MAIN PLAYFIELD (60 FPS Sanctuary Canvas + Contextual Overlays) */}
      {assetsReady && (
        <main className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-[#E8DFD1]">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            }}
            className="h-auto max-w-full max-h-full shadow-xl"
          />

          {/* Subtle Transient Toast */}
          {toastMsg && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#1E293B] text-amber-300 px-4 py-2 rounded-xl border-2 border-amber-300 font-extrabold text-xs shadow-lg text-center max-w-[90%]">
              {toastMsg}
            </div>
          )}

          {/* Low-Mood / Sad Companion Status Banner (Non-obstructive top strip) */}
          {lowMoodBannerText &&
            !toastMsg &&
            gameState.status === 'PLAYING' &&
            subView === 'SANCTUARY' &&
            !isAnyModalOpen && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-rose-50/95 text-rose-900 px-4 py-1.5 rounded-xl border-2 border-rose-500 font-extrabold text-xs shadow-md text-center max-w-[92%]">
                {lowMoodBannerText}
              </div>
            )}

          {/* Evolution Banner */}
          {evolvedNotice && (
            <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 text-white px-5 py-2.5 rounded-2xl border-4 border-[#1E293B] font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 text-center">
              <Sparkles size={18} className="shrink-0" />
              <span>{evolvedNotice}</span>
            </div>
          )}

          {/* Mobile Unconditional Sanctuary Touch Controls */}
          {isMobile &&
            gameState.status === 'PLAYING' &&
            subView === 'SANCTUARY' &&
            !isAnyModalOpen && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 px-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Move Left"
                    onPointerDown={() => {
                      virtualInputRef.current.left = true;
                    }}
                    onPointerUp={() => {
                      virtualInputRef.current.left = false;
                    }}
                    onPointerLeave={() => {
                      virtualInputRef.current.left = false;
                    }}
                    onPointerCancel={() => {
                      virtualInputRef.current.left = false;
                    }}
                    className="pointer-events-auto touch-none w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-[#FFFDF7]/90 font-black text-base shadow-[0_3px_0_#1E293B] active:translate-y-0.5">
                    ◀
                  </button>
                  <button
                    type="button"
                    aria-label="Move Right"
                    onPointerDown={() => {
                      virtualInputRef.current.right = true;
                    }}
                    onPointerUp={() => {
                      virtualInputRef.current.right = false;
                    }}
                    onPointerLeave={() => {
                      virtualInputRef.current.right = false;
                    }}
                    onPointerCancel={() => {
                      virtualInputRef.current.right = false;
                    }}
                    className="pointer-events-auto touch-none w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-[#FFFDF7]/90 font-black text-base shadow-[0_3px_0_#1E293B] active:translate-y-0.5">
                    ▶
                  </button>
                </div>

                <button
                  type="button"
                  aria-label="Hop"
                  onPointerDown={() => {
                    virtualInputRef.current.jump = true;
                  }}
                  onPointerUp={() => {
                    virtualInputRef.current.jump = false;
                  }}
                  onPointerLeave={() => {
                    virtualInputRef.current.jump = false;
                  }}
                  onPointerCancel={() => {
                    virtualInputRef.current.jump = false;
                  }}
                  className="pointer-events-auto touch-none w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-emerald-300/95 font-black text-xs shadow-[0_3px_0_#1E293B] active:translate-y-0.5">
                  HOP
                </button>
              </div>
            )}

          {/* Active Study Mode Panel */}
          {gameState.status === 'PLAYING' && subView === 'STUDY' && (
            <StudyPanel
              mode={studyMode}
              level={selectedLevel}
              unit={selectedUnit}
              mastery={activeProfile.mastery}
              startingHearts={getConfig('startingHearts')}
              roundQuestionsCount={getConfig('roundQuestionsCount')}
              matchPairsCount={getConfig('matchPairsCount')}
              basePoints={getConfig('basePointsPerCorrect')}
              streakBonus={getConfig('streakBonusPoints')}
              xpPerCorrect={getConfig('xpPerCorrect')}
              isPaused={isGameMenuOpen || isHowToPlayOpen}
              onWordResult={handleWordResult}
              onBonusTreat={handleBonusTreat}
              onCompleteRound={handleCompleteRound}
              onExit={(didAttempt) => {
                if (didAttempt) {
                  updateActiveProfile((p) => ({
                    ...p,
                    hunger: clamp(p.hunger - 2, 0, 100),
                    energy: clamp(p.energy - 2, 0, 100),
                    happiness: clamp(p.happiness - 1, 0, 100),
                  }));
                }
                setSubView('SANCTUARY');
              }}
            />
          )}
        </main>
      )}

      {/* BOTTOM DEDICATED CARE & STUDY ACTION DOCK */}
      {assetsReady && gameState.status === 'PLAYING' && subView === 'SANCTUARY' && (
        <footer className="w-full bg-[#FFFDF7] border-t-4 border-[#1E293B] px-2 py-2 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0">
          {/* Care Item Action + Quick-Buy Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Feed Biscuit */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleCareAction('biscuit')}
                className="min-h-[48px] px-2.5 py-1 rounded-l-xl border-2 border-[#1E293B] bg-amber-100 hover:bg-amber-200 flex items-center gap-1.5 font-extrabold text-xs shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
                <img
                  src="assets/images/item_biscuit.png"
                  alt="Star Biscuit"
                  className="w-6 h-5 object-contain"
                />
                <span>
                  {activeProfile.biscuits > 0
                    ? `Feed (${activeProfile.biscuits})`
                    : `Feed · ${CARE_ITEM_PRICES.biscuit} XP`}
                </span>
              </button>
              <button
                type="button"
                aria-label="Buy Star Biscuit"
                onClick={() => handleBuyCareItem('biscuit', 1, false)}
                title={`Buy 1 Star Biscuit (${CARE_ITEM_PRICES.biscuit} XP)`}
                className="min-h-[48px] px-2 rounded-r-xl border-y-2 border-r-2 border-[#1E293B] bg-amber-300 hover:bg-amber-200 font-black text-[11px] flex items-center gap-0.5 shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
                <Plus size={12} />
                <span>{CARE_ITEM_PRICES.biscuit}</span>
              </button>
            </div>

            {/* Clean Bubbles */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleCareAction('bubbles')}
                className="min-h-[48px] px-2.5 py-1 rounded-l-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 flex items-center gap-1.5 font-extrabold text-xs shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
                <img
                  src="assets/images/item_bubbles.png"
                  alt="Bubble Soap"
                  className="w-6 h-4 object-contain"
                />
                <span>
                  {activeProfile.bubbles > 0
                    ? `Clean (${activeProfile.bubbles})`
                    : `Clean · ${CARE_ITEM_PRICES.bubbles} XP`}
                </span>
              </button>
              <button
                type="button"
                aria-label="Buy Bubble Soap"
                onClick={() => handleBuyCareItem('bubbles', 1, false)}
                title={`Buy 1 Bubble Soap (${CARE_ITEM_PRICES.bubbles} XP)`}
                className="min-h-[48px] px-2 rounded-r-xl border-y-2 border-r-2 border-[#1E293B] bg-sky-300 hover:bg-sky-200 font-black text-[11px] flex items-center gap-0.5 shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
                <Plus size={12} />
                <span>{CARE_ITEM_PRICES.bubbles}</span>
              </button>
            </div>

            {/* Play Bouncy Toy Ball */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleCareAction('flask')}
                className="min-h-[48px] px-2.5 py-1 rounded-l-xl border-2 border-[#1E293B] bg-rose-100 hover:bg-rose-200 flex items-center gap-1.5 font-extrabold text-xs shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
                <img
                  src="assets/images/item_flask_toy.png"
                  alt="Bouncy Toy Ball"
                  className="w-6 h-6 object-contain"
                />
                <span>
                  {activeProfile.flasks > 0
                    ? `Play (${activeProfile.flasks})`
                    : `Play · ${CARE_ITEM_PRICES.flask} XP`}
                </span>
              </button>
              <button
                type="button"
                aria-label="Buy Bouncy Toy Ball"
                onClick={() => handleBuyCareItem('flask', 1, false)}
                title={`Buy 1 Bouncy Toy Ball (${CARE_ITEM_PRICES.flask} XP)`}
                className="min-h-[48px] px-2 rounded-r-xl border-y-2 border-r-2 border-[#1E293B] bg-rose-300 hover:bg-rose-200 font-black text-[11px] flex items-center gap-0.5 shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
                <Plus size={12} />
                <span>{CARE_ITEM_PRICES.flask}</span>
              </button>
            </div>

            {/* Care Shop Drawer Trigger */}
            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsCareShopOpen(true);
              }}
              className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-amber-200 hover:bg-amber-300 font-black text-xs flex items-center gap-1.5 shadow-[0_2px_0_#1E293B] active:translate-y-0.5">
              <Package size={15} />
              <span>Care Shop</span>
            </button>
          </div>

          {/* Study & Ranking Buttons */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {companionStage === 4 && (
              <button
                type="button"
                onClick={triggerGraduationVictory}
                className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-amber-300 hover:bg-amber-200 font-black text-xs flex items-center gap-1.5 shadow-[0_2px_0_#1E293B]">
                <Award size={16} />
                <span>Graduate!</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsRankingOpen(true);
              }}
              className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-extrabold text-xs flex items-center gap-1.5 shadow-[0_2px_0_#1E293B]">
              <img
                src="assets/images/ui_star_badge.png"
                alt="Ranking"
                className="w-4 h-6 object-contain"
              />
              <span>Ranking ({masteredCount}/{VOCABULARY.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playConfirmSelect();
                setIsStudySelectorOpen(true);
              }}
              className="min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_3px_0_#1E293B] active:translate-y-0.5">
              <BookOpen size={16} />
              <span>Study Lab</span>
            </button>
          </div>
        </footer>
      )}

      {/* XP CARE SHOP MODAL */}
      {isCareShopOpen && gameState.status === 'PLAYING' && (
        <MenuOverlay tone="neutral" zIndex={36}>
          <div className="w-full max-w-lg bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl p-5 shadow-[0_10px_0_#1E293B] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black">
                  Sanctuary Care Shop · 寵物商店
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  Spend earned XP on care supplies — Growth XP never decreases!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsCareShopOpen(false);
                }}
                className="min-w-[48px] min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-slate-100 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-2 text-xs font-black">
              <div className="bg-amber-100 border-2 border-[#1E293B] rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Spendable XP:</span>
                <span className="text-amber-900 flex items-center gap-1">
                  <Star size={14} className="fill-amber-500 text-[#1E293B]" />
                  {activeProfile.spendableXp}
                </span>
              </div>
              <div className="bg-emerald-100 border-2 border-[#1E293B] rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Growth XP:</span>
                <span className="text-emerald-900">
                  {activeProfile.xp}
                  {nextStageInfo ? `/${nextStageInfo.minXp}` : ' MAX'}
                </span>
              </div>
            </div>

            {/* Shop Items */}
            <div className="flex flex-col gap-2.5">
              {(
                [
                  {
                    kind: 'biscuit' as const,
                    name: 'Star Biscuit · 星星餅乾',
                    effect: '+25 Hunger · +5 Growth XP',
                    img: 'assets/images/item_biscuit.png',
                    owned: activeProfile.biscuits,
                    price: CARE_ITEM_PRICES.biscuit,
                    bg: 'bg-amber-50',
                  },
                  {
                    kind: 'bubbles' as const,
                    name: 'Bubble Soap · 泡泡香皂',
                    effect: '+25 Energy/Clean · +5 Growth XP',
                    img: 'assets/images/item_bubbles.png',
                    owned: activeProfile.bubbles,
                    price: CARE_ITEM_PRICES.bubbles,
                    bg: 'bg-sky-50',
                  },
                  {
                    kind: 'flask' as const,
                    name: 'Bouncy Toy Ball · 彈跳玩具球',
                    effect: '+25 Happiness · +5 Growth XP',
                    img: 'assets/images/item_flask_toy.png',
                    owned: activeProfile.flasks,
                    price: CARE_ITEM_PRICES.flask,
                    bg: 'bg-rose-50',
                  },
                ]
              ).map((item) => {
                const canAfford1 = activeProfile.spendableXp >= item.price;
                const canAfford3 = activeProfile.spendableXp >= item.price * 3;
                return (
                  <div
                    key={item.kind}
                    className={`p-3 rounded-xl border-2 border-[#1E293B] ${item.bg} flex flex-wrap items-center justify-between gap-2`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-10 h-10 object-contain shrink-0"
                      />
                      <div>
                        <div className="font-black text-xs sm:text-sm">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-bold text-slate-600">
                          {item.effect} · Owned: {item.owned}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        disabled={!canAfford1}
                        onClick={() => handleBuyCareItem(item.kind, 1, false)}
                        className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-white hover:bg-amber-100 disabled:opacity-40 font-black text-xs">
                        +1 ({item.price} XP)
                      </button>
                      <button
                        type="button"
                        disabled={!canAfford3}
                        onClick={() => handleBuyCareItem(item.kind, 3, false)}
                        className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-amber-200 hover:bg-amber-300 disabled:opacity-40 font-black text-xs">
                        +3 ({item.price * 3} XP)
                      </button>
                      <button
                        type="button"
                        disabled={!canAfford1}
                        onClick={() => handleBuyCareItem(item.kind, 1, true)}
                        className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 font-black text-xs">
                        Buy &amp; Use
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* STUDY MODE SELECTOR MODAL */}
      {isStudySelectorOpen && gameState.status === 'PLAYING' && (
        <MenuOverlay tone="neutral" zIndex={35}>
          <div className="w-full max-w-lg bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl p-5 shadow-[0_10px_0_#1E293B] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-black">
                  Select Study Lab Mode
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Earn Spendable &amp; Growth XP for {activeProfile.companionName}{' '}
                  ({xpProgressPct}% to{' '}
                  {nextStageInfo
                    ? `${nextStageInfo.name} ${activeSpecies.enName}`
                    : 'Max Stage'}
                  )
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStudySelectorOpen(false)}
                className="min-w-[48px] min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-slate-100 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {/* Level Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase text-slate-500">
                Difficulty Level
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setSelectedLevel(lv);
                    }}
                    className={`min-h-[48px] px-2 rounded-xl border-2 border-[#1E293B] font-extrabold text-xs flex flex-col items-center justify-center ${
                      selectedLevel === lv
                        ? 'bg-amber-300 shadow-[0_3px_0_#1E293B]'
                        : 'bg-white hover:bg-slate-50'
                    }`}>
                    <span>{LEVEL_NAMES[lv].en}</span>
                    <span className="text-[10px] text-slate-700">
                      {LEVEL_NAMES[lv].zh}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase text-slate-500">
                Science Unit
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setSelectedUnit('ALL');
                  }}
                  className={`min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] font-extrabold text-xs text-left ${
                    selectedUnit === 'ALL'
                      ? 'bg-emerald-300 shadow-[0_3px_0_#1E293B]'
                      : 'bg-white hover:bg-slate-50'
                  }`}>
                  All Units · 全部單元
                </button>
                {([1, 2, 3] as const).map((un) => (
                  <button
                    key={un}
                    type="button"
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setSelectedUnit(un);
                    }}
                    className={`min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] font-extrabold text-xs text-left ${
                      selectedUnit === un
                        ? 'bg-emerald-300 shadow-[0_3px_0_#1E293B]'
                        : 'bg-white hover:bg-slate-50'
                    }`}>
                    U{un}: {UNIT_NAMES[un].en}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Study Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => startStudyRound('FLASHCARDS')}
                className="min-h-[68px] p-3 rounded-xl border-2 border-[#1E293B] bg-amber-100 hover:bg-amber-200 text-left shadow-[0_3px_0_#1E293B] flex flex-col justify-center">
                <div className="font-black text-sm">
                  1. Flashcards (MC) · 選擇題閃卡
                </div>
                <div className="text-[11px] font-bold text-slate-700">
                  Choose the right 中文 meaning (A–D)
                </div>
              </button>

              <button
                type="button"
                onClick={() => startStudyRound('MATCH')}
                className="min-h-[68px] p-3 rounded-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 text-left shadow-[0_3px_0_#1E293B] flex flex-col justify-center">
                <div className="font-black text-sm">
                  2. Translation Match · 配對
                </div>
                <div className="text-[11px] font-bold text-slate-700">
                  Connect English &amp; 中文 pairs
                </div>
              </button>

              <button
                type="button"
                onClick={() => startStudyRound('BLANKS')}
                className="min-h-[68px] p-3 rounded-xl border-2 border-[#1E293B] bg-emerald-100 hover:bg-emerald-200 text-left shadow-[0_3px_0_#1E293B] flex flex-col justify-center">
                <div className="font-black text-sm">
                  3. Fill in Blanks · 科學填空
                </div>
                <div className="text-[11px] font-bold text-slate-700">
                  Type or pick missing terms
                </div>
              </button>

              <button
                type="button"
                onClick={() => startStudyRound('PUZZLE')}
                className="min-h-[68px] p-3 rounded-xl border-2 border-[#1E293B] bg-rose-100 hover:bg-rose-200 text-left shadow-[0_3px_0_#1E293B] flex flex-col justify-center">
                <div className="font-black text-sm">
                  4. Word Puzzle · 單字拼圖
                </div>
                <div className="text-[11px] font-bold text-slate-700">
                  Unscramble letter tiles + Hints
                </div>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ROUND SUMMARY MODAL */}
      {roundSummary && gameState.status === 'PLAYING' && (
        <MenuOverlay tone="victory" zIndex={36}>
          <div className="w-full max-w-md bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl p-6 shadow-[0_10px_0_#1E293B] flex flex-col items-center gap-4 text-center">
            <img
              src="assets/images/ui_star_badge.png"
              alt="Round Complete"
              className="w-12 h-20 object-contain"
            />
            <h2 className="text-2xl font-black text-emerald-700">
              Study Round Complete!
            </h2>
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-extrabold">
              <div>Score Earned: +{roundSummary.scoreEarned}</div>
              <div>Spendable &amp; Growth XP: +{roundSummary.xpEarned}</div>
              <div>
                Accuracy:{' '}
                {roundSummary.totalAttempts > 0
                  ? Math.round(
                      (roundSummary.correctCount / roundSummary.totalAttempts) *
                        100,
                    )
                  : 100}
                %
              </div>
              <div>Max Streak: {roundSummary.maxStreak}</div>
            </div>

            <div className="text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-2 rounded-xl w-full">
              Streak &amp; Round Drops: +{roundSummary.treatsEarned.biscuits}{' '}
              Biscuits · +{roundSummary.treatsEarned.bubbles} Bubbles · +
              {roundSummary.treatsEarned.flasks} Toy Balls
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setRoundSummary(null);
                  setEvolvedNotice(null);
                }}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-black text-sm shadow-[0_3px_0_#1E293B]">
                Return to Sanctuary
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = roundSummary.mode;
                  setRoundSummary(null);
                  setEvolvedNotice(null);
                  startStudyRound(m);
                }}
                className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-amber-200 hover:bg-amber-300 font-extrabold text-sm">
                Study Another Round
              </button>
              {companionStage === 4 && (
                <button
                  type="button"
                  onClick={triggerGraduationVictory}
                  className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-sky-200 hover:bg-sky-300 font-black text-sm">
                  Celebrate Scholar Victory!
                </button>
              )}
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* RANKING & MASTERY MODAL */}
      {isRankingOpen && (
        <RankingModal
          saveData={saveData}
          activeProfile={activeProfile}
          onSelectProfile={(id) =>
            setSaveData((prev) => ({...prev, activeProfileId: id}))
          }
          onCreateProfile={(pName, cName, spId) => {
            const existing = (Object.values(
              saveData.profiles,
            ) as CompanionProfile[]).map((p) => p.speciesId);
            const np = createDefaultProfile(pName, cName, spId, existing);
            setSaveData((prev) => ({
              ...prev,
              activeProfileId: np.id,
              profiles: {...prev.profiles, [np.id]: np},
            }));
          }}
          onUpdateNames={(pName, cName) => {
            updateActiveProfile((p) => ({
              ...p,
              profileName: pName.trim() || p.profileName,
              companionName: cName.trim() || p.companionName,
            }));
          }}
          onImportSave={(imported) => setSaveData(imported)}
          onClose={() => setIsRankingOpen(false)}
        />
      )}

      {/* MANDATORY GAME MENU OVERLAY */}
      {isGameMenuOpen && gameState.status === 'PLAYING' && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl p-6 shadow-[0_10px_0_#1E293B] flex flex-col items-center gap-3">
            <h2
              style={{fontFamily: getConfig('pixelFontFamily')}}
              className="text-lg sm:text-xl text-[#1E293B] mb-2 text-center">
              LAB MENU
            </h2>

            <button
              type="button"
              autoFocus
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
              }}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-black text-base flex items-center justify-center gap-2 shadow-[0_3px_0_#1E293B]">
              <Play size={18} />
              Resume
            </button>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  const muted = gameAudio.toggleMute();
                  setIsSfxMuted(muted);
                }}
                className="min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                {isSfxMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                SFX: {isSfxMuted ? 'Off' : 'On'}
              </button>

              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsMusicMuted((m) => !m);
                }}
                className="min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                {isMusicMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                Music: {isMusicMuted ? 'Off' : 'On'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
                startRun(
                  gameStateRef.current.level,
                  levelStartScoreRef.current,
                );
              }}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-amber-200 hover:bg-amber-300 font-extrabold text-sm flex items-center justify-center gap-2">
              <RotateCw size={16} />
              Try Level Again
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(true);
              }}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 font-extrabold text-sm flex items-center justify-center gap-2">
              <HelpCircle size={16} />
              How to Play
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
                setIsHowToPlayOpen(false);
                setIsStudySelectorOpen(false);
                setIsCareShopOpen(false);
                setIsRankingOpen(false);
                setRoundSummary(null);
                setSubView('SANCTUARY');
                setGameState((prev) => ({...prev, status: 'START'}));
              }}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-rose-100 hover:bg-rose-200 font-extrabold text-sm flex items-center justify-center gap-2">
              <Home size={16} />
              Quit to Menu
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY OVERLAY */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-md bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl p-6 shadow-[0_10px_0_#1E293B] flex flex-col gap-3">
            <h2
              style={{fontFamily: getConfig('pixelFontFamily')}}
              className="text-base sm:text-lg text-[#1E293B] text-center">
              HOW TO PLAY
            </h2>
            <ul className="text-xs sm:text-sm font-bold text-slate-700 space-y-2 leading-relaxed">
              <li>
                <strong>1. Sanctuary Desk:</strong>{' '}
                {isMobile
                  ? 'Tap the desk or use the on-screen buttons'
                  : 'Click the desk or use Arrow Keys / A-D'}{' '}
                to move {activeProfile.companionName}, or tap your{' '}
                {activeSpecies.enName} to pet it!
              </li>
              <li>
                <strong>2. Study Lab (4 Modes):</strong> Choose Level 1–3 and
                Unit 1–3 to practice bilingual English &amp; 繁體中文 science
                vocabulary via Flashcards (MC), Matching, Blanks, and Word
                Puzzles.
              </li>
              <li>
                <strong>3. XP Care Shop &amp; Care Animations:</strong> Study
                answers earn both <strong>Growth XP</strong> (evolution) and{' '}
                <strong>Spendable XP</strong>! Keep Food, Heart, and Energy
                healthy—if stats drop below 30%, your critter gets sad and rests
                still until you feed Star Biscuits (15 XP), scrub with Bubble
                Soap (15 XP), or play Bouncy Toy Ball (20 XP)!
              </li>
              <li>
                <strong>4. 20 Critters &amp; Aligned Growth:</strong> Every
                profile adopts one of 20 random pixel animals that grows from
                Baby → Young → Teen → Adult Scholar!
              </li>
            </ul>
            <button
              type="button"
              autoFocus
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(false);
              }}
              className="min-h-[48px] w-full mt-2 rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-black text-sm flex items-center justify-center gap-2 shadow-[0_3px_0_#1E293B]">
              <Check size={18} />
              Close
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* START / TITLE SCREEN */}
      {gameState.status === 'START' && !autoStartPending && assetsReady && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-md bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-3xl p-5 sm:p-6 shadow-[0_12px_0_#1E293B] flex flex-col items-center gap-3.5">
            <div className="flex items-center gap-2 bg-emerald-100 border-2 border-[#1E293B] px-3 py-1 rounded-full text-[11px] font-black text-emerald-900">
              <Gamepad2 size={14} />
              <span>Bilingual Science · 20 Critters · XP Care Shop</span>
            </div>

            <h1
              style={{fontFamily: getConfig('pixelFontFamily')}}
              className="text-2xl sm:text-3xl text-[#1E293B] text-center leading-snug">
              CRITTER LAB
            </h1>

            {/* Active Companion Preview Card */}
            <div className="w-full bg-emerald-50 border-2 border-[#1E293B] rounded-2xl p-3.5 flex items-center gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                <CritterPortrait
                  speciesId={activeProfile.speciesId}
                  stage={companionStage}
                  size={74}
                />
              </div>
              <div className="text-left min-w-0">
                <div className="inline-block text-[10px] font-black uppercase tracking-wider bg-amber-200 border border-[#1E293B] px-2 py-0.5 rounded-full mb-1">
                  Buddy: {activeSpecies.enName} · {activeSpecies.zhName}
                </div>
                <div className="font-black text-sm truncate">
                  {activeProfile.profileName}&apos;s {activeProfile.companionName}
                </div>
                <div className="text-xs font-extrabold text-emerald-700">
                  Stage {companionStage}: {activeStageLabel.en} (
                  {activeStageLabel.zh})
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                  Mastered: {masteredCount}/{VOCABULARY.length} · Spendable:{' '}
                  {activeProfile.spendableXp} XP
                </div>
              </div>
            </div>

            {/* New Profile Adoption Card (Random Mystery Critter + Re-roll before Adopting) */}
            <div className="w-full bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-amber-400 flex items-center justify-center shrink-0">
                    <CritterPortrait
                      speciesId={titleCandidateSpecies}
                      stage={1}
                      size={36}
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-black text-amber-900">
                      Mystery Critter: Baby {titleCandidate.enName} (
                      {titleCandidate.zhName})
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">
                      Adopt a random animal for a new learner profile!
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setTitleCandidateSpecies((curr) =>
                      pickRandomSpeciesId([curr]),
                    );
                  }}
                  title="Re-roll Mystery Critter"
                  className="min-w-[48px] min-h-[48px] px-2.5 rounded-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 font-extrabold text-[11px] flex items-center justify-center gap-1 shrink-0">
                  <Shuffle size={14} />
                  <span>Roll</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={titleNewProfileName}
                  onChange={(e) => setTitleNewProfileName(e.target.value)}
                  placeholder="New learner name (optional)..."
                  className="flex-1 min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-white text-xs font-bold"
                />
                <button
                  type="button"
                  disabled={!titleNewProfileName.trim()}
                  onClick={() => {
                    const existing = (Object.values(
                      saveData.profiles,
                    ) as CompanionProfile[]).map((p) => p.speciesId);
                    const np = createDefaultProfile(
                      titleNewProfileName,
                      titleCandidate.defaultPetName,
                      titleCandidate.id,
                      existing,
                    );
                    setSaveData((prev) => ({
                      ...prev,
                      activeProfileId: np.id,
                      profiles: {...prev.profiles, [np.id]: np},
                    }));
                    setTitleNewProfileName('');
                    setTitleCandidateSpecies(
                      pickRandomSpeciesId([...existing, titleCandidate.id]),
                    );
                    gameAudio.playConfirmSelect();
                  }}
                  className="min-h-[48px] px-3.5 rounded-xl border-2 border-[#1E293B] bg-amber-300 hover:bg-amber-200 disabled:opacity-40 font-black text-xs flex items-center gap-1">
                  <Plus size={14} />
                  <span>Adopt</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={initGame}
              autoFocus
              data-testid="start-button"
              className="min-h-[54px] w-full bg-emerald-400 hover:bg-emerald-300 text-[#1E293B] px-6 py-3 rounded-2xl border-4 border-[#1E293B] font-black text-base sm:text-lg shadow-[0_5px_0_#1E293B] active:translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <Play size={22} />
              ENTER SANCTUARY
            </button>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 font-extrabold text-xs flex items-center justify-center gap-1.5">
                <HelpCircle size={16} />
                How to Play
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsRankingOpen(true);
                }}
                className="min-h-[48px] rounded-xl border-2 border-[#1E293B] bg-amber-100 hover:bg-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5">
                <Trophy size={16} />
                Ranking Board
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* GAME OVER OVERLAY (Triggered on 0 Hearts in Scored Quiz) */}
      {gameState.status === 'GAME_OVER' && (
        <Overlay
          title="OUT OF HEARTS!"
          description={`Score: ${gameState.score} · Keep practicing & try again!`}
          actionLabel="TRY AGAIN"
          onAction={initGame}
          icon={<RotateCw size={22} />}
          tone="danger">
          <button
            type="button"
            onClick={() => {
              setSubView('SANCTUARY');
              setGameState((prev) => ({
                ...prev,
                status: 'PLAYING',
                lives: getConfig('startingHearts'),
              }));
            }}
            className="mt-4 min-h-[48px] px-6 py-2.5 rounded-full bg-amber-300 text-[#1E293B] font-extrabold text-sm hover:bg-amber-200 border-2 border-[#1E293B]">
            Return to Sanctuary
          </button>
        </Overlay>
      )}

      {/* VICTORY OVERLAY */}
      {gameState.status === 'VICTORY' && (
        <Overlay
          title="ADULT SCHOLAR!"
          description={`Final Score: ${gameState.score} · ${activeProfile.companionName} (${activeSpecies.enName}) Mastered ${masteredCount}/${VOCABULARY.length} Terms!`}
          actionLabel="PLAY AGAIN"
          onAction={resetGame}
          icon={<RotateCw size={22} />}
          tone="victory">
          <button
            type="button"
            onClick={() => {
              setSubView('SANCTUARY');
              setGameState((prev) => ({
                ...prev,
                status: 'PLAYING',
              }));
            }}
            className="mt-4 min-h-[48px] px-6 py-2.5 rounded-full bg-amber-300 text-[#1E293B] font-extrabold text-sm hover:bg-amber-200 border-2 border-[#1E293B]">
            Keep Exploring Sanctuary
          </button>
        </Overlay>
      )}
    </div>
  );
}
