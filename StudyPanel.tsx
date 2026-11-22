import {
  ArrowRight,
  Check,
  HelpCircle,
  Heart,
  Lightbulb,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {LEVEL_NAMES, UNIT_NAMES} from './constants';
import {
  isWordMastered,
  pickWeightedVocab,
  StudyMode,
  WordMastery,
} from './storage';
import {gameAudio, shuffle} from './utils/helper';
import {getVocabPool, VOCABULARY, VocabItem} from './vocabulary';

export interface RoundSummary {
  mode: StudyMode;
  level: 1 | 2 | 3;
  unit: 1 | 2 | 3 | 'ALL';
  scoreEarned: number;
  xpEarned: number;
  correctCount: number;
  totalAttempts: number;
  maxStreak: number;
  treatsEarned: {biscuits: number; bubbles: number; flasks: number};
  failed: boolean;
}

interface StudyPanelProps {
  mode: StudyMode;
  level: 1 | 2 | 3;
  unit: 1 | 2 | 3 | 'ALL';
  mastery: Record<string, WordMastery>;
  startingHearts: number;
  roundQuestionsCount: number;
  matchPairsCount: number;
  basePoints: number;
  streakBonus: number;
  xpPerCorrect: number;
  isPaused: boolean;
  onWordResult: (
    vocabId: string,
    correct: boolean,
    ptsDelta: number,
    xpDelta: number,
    needsPracticeFlag?: boolean,
    energyDelta?: number,
  ) => void;
  onBonusTreat: (kind: 'biscuit' | 'bubbles' | 'flask') => void;
  onCompleteRound: (summary: RoundSummary) => void;
  onExit: (didAttempt?: boolean) => void;
}

interface TileItem {
  id: string;
  char: string;
  used: boolean;
}

function buildPuzzleTiles(word: string, level: 1 | 2 | 3): TileItem[] {
  const letters = word
    .toUpperCase()
    .split('')
    .filter((ch) => /[A-Z]/.test(ch));
  const extraCount = level === 1 ? 0 : level === 2 ? 2 : 4;
  const alphabet = 'ETAOINSHRDLUCMFWGYPBVKJXQZ';
  const pool = [...letters];
  for (let i = 0; i < extraCount; i++) {
    pool.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return shuffle(pool).map((char, idx) => ({
    id: `tile_${idx}_${char}`,
    char,
    used: false,
  }));
}

export const StudyPanel: React.FC<StudyPanelProps> = ({
  mode,
  level,
  unit,
  mastery,
  startingHearts,
  roundQuestionsCount,
  matchPairsCount,
  basePoints,
  streakBonus,
  xpPerCorrect,
  isPaused,
  onWordResult,
  onBonusTreat,
  onCompleteRound,
  onExit,
}) => {
  const pool = useMemo(() => {
    const filtered = getVocabPool(level, unit);
    return filtered.length > 0 ? filtered : VOCABULARY;
  }, [level, unit]);

  const roundItems = useMemo(
    () => pickWeightedVocab(pool, mastery, roundQuestionsCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, level, unit],
  );

  const [hearts, setHearts] = useState(startingHearts);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [scoreEarned, setScoreEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [treatsEarned, setTreatsEarned] = useState({
    biscuits: 0,
    bubbles: 0,
    flasks: 0,
  });
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong';
    text: string;
  } | null>(null);

  // Flashcard Quiz (MC) state
  const [mcOptions, setMcOptions] = useState<VocabItem[]>([]);
  const [mcSelectedId, setMcSelectedId] = useState<string | null>(null);
  const [mcLocked, setMcLocked] = useState(false);
  const [mcShake, setMcShake] = useState(false);
  const mcAdvanceTimerRef = useRef<number | null>(null);
  const mcAdvanceFnRef = useRef<(() => void) | null>(null);

  // Match mode state
  const [matchWave, setMatchWave] = useState(0);
  const [matchPairs, setMatchPairs] = useState<VocabItem[]>([]);
  const [shuffledZh, setShuffledZh] = useState<VocabItem[]>([]);
  const [selectedEnId, setSelectedEnId] = useState<string | null>(null);
  const [selectedZhId, setSelectedZhId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [shakePair, setShakePair] = useState<boolean>(false);

  // Blanks mode state
  const [blanksTyped, setBlanksTyped] = useState('');
  const [blanksOptions, setBlanksOptions] = useState<VocabItem[]>([]);
  const [blanksLocked, setBlanksLocked] = useState(false);
  const [showBlanksHint, setShowBlanksHint] = useState(false);
  const [blanksHintRevealed, setBlanksHintRevealed] = useState(false);

  // Puzzle mode state
  const [puzzleSlots, setPuzzleSlots] = useState<Array<string | null>>([]);
  const [puzzleSlotTileIds, setPuzzleSlotTileIds] = useState<
    Array<string | null>
  >([]);
  const [puzzleTiles, setPuzzleTiles] = useState<TileItem[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [puzzleLocked, setPuzzleLocked] = useState(false);
  const [puzzleShake, setPuzzleShake] = useState(false);

  const currentWord = roundItems[index] ?? pool[0];

  const awardTreatForStreak = useCallback(
    (nextStreak: number) => {
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        const roll = (nextStreak / 3) % 3;
        const kind: 'biscuit' | 'bubbles' | 'flask' =
          roll === 1 ? 'biscuit' : roll === 2 ? 'bubbles' : 'flask';
        onBonusTreat(kind);
        gameAudio.playCoinPickup();
        setTreatsEarned((prev) => ({
          biscuits: prev.biscuits + (kind === 'biscuit' ? 1 : 0),
          bubbles: prev.bubbles + (kind === 'bubbles' ? 1 : 0),
          flasks: prev.flasks + (kind === 'flask' ? 1 : 0),
        }));
      }
    },
    [onBonusTreat],
  );

  const finishRound = useCallback(
    (
      failed: boolean,
      finalScore = scoreEarned,
      finalXp = xpEarned,
      finalCorrect = correctCount,
      finalAttempts = attemptsCount,
      finalMaxStreak = maxStreak,
      finalTreats = treatsEarned,
    ) => {
      onCompleteRound({
        mode,
        level,
        unit,
        scoreEarned: finalScore,
        xpEarned: finalXp,
        correctCount: finalCorrect,
        totalAttempts: finalAttempts,
        maxStreak: finalMaxStreak,
        treatsEarned: finalTreats,
        failed,
      });
    },
    [
      attemptsCount,
      correctCount,
      level,
      maxStreak,
      mode,
      onCompleteRound,
      scoreEarned,
      treatsEarned,
      unit,
      xpEarned,
    ],
  );

  // Setup Match board wave
  useEffect(() => {
    if (mode !== 'MATCH') return;
    const count = Math.min(matchPairsCount, pool.length);
    const waveItems = pickWeightedVocab(pool, mastery, count);
    // Ensure unique IDs in board
    const uniqueMap = new Map<string, VocabItem>();
    for (const w of waveItems) uniqueMap.set(w.id, w);
    for (const w of shuffle(pool)) {
      if (uniqueMap.size >= count) break;
      uniqueMap.set(w.id, w);
    }
    const boardItems = Array.from(uniqueMap.values());
    setMatchPairs(boardItems);
    setShuffledZh(shuffle(boardItems));
    setMatchedIds(new Set());
    setSelectedEnId(null);
    setSelectedZhId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, matchWave, level, unit]);

  // Setup Flashcard Quiz (MC) options when word changes
  useEffect(() => {
    if (mode !== 'FLASHCARDS' || !currentWord) return;
    if (mcAdvanceTimerRef.current !== null) {
      window.clearTimeout(mcAdvanceTimerRef.current);
      mcAdvanceTimerRef.current = null;
    }
    mcAdvanceFnRef.current = null;

    const chosen: VocabItem[] = [currentWord];
    const usedZh = new Set<string>([currentWord.zh]);

    const addCandidates = (list: VocabItem[]) => {
      for (const item of shuffle(list)) {
        if (chosen.length >= 4) break;
        if (item.id === currentWord.id || usedZh.has(item.zh)) continue;
        usedZh.add(item.zh);
        chosen.push(item);
      }
    };

    // Priority 1: same Unit & same Level
    addCandidates(
      VOCABULARY.filter(
        (w) => w.unit === currentWord.unit && w.level === currentWord.level,
      ),
    );
    // Priority 2: same Unit across levels
    if (chosen.length < 4) {
      addCandidates(VOCABULARY.filter((w) => w.unit === currentWord.unit));
    }
    // Priority 3: any remaining vocabulary
    if (chosen.length < 4) {
      addCandidates(VOCABULARY);
    }

    setMcOptions(shuffle(chosen));
    setMcSelectedId(null);
    setMcLocked(false);
    setMcShake(false);
    setFeedback(null);
  }, [mode, index, currentWord]);

  useEffect(() => {
    return () => {
      if (mcAdvanceTimerRef.current !== null) {
        window.clearTimeout(mcAdvanceTimerRef.current);
        mcAdvanceTimerRef.current = null;
      }
    };
  }, []);

  // Setup Blanks options when word changes (hide hint by default on every new question)
  useEffect(() => {
    if (mode !== 'BLANKS' || !currentWord) return;
    const distractors = shuffle(
      pool.filter((w) => w.id !== currentWord.id),
    ).slice(0, 3);
    setBlanksOptions(shuffle([currentWord, ...distractors]));
    setBlanksTyped('');
    setBlanksLocked(false);
    setShowBlanksHint(false);
    setBlanksHintRevealed(false);
    setFeedback(null);
  }, [mode, index, currentWord, pool]);

  // Setup Puzzle slots & tiles when word changes
  useEffect(() => {
    if (mode !== 'PUZZLE' || !currentWord) return;
    const chars = currentWord.en.split('');
    setPuzzleSlots(chars.map((c) => (/[A-Za-z]/.test(c) ? null : c)));
    setPuzzleSlotTileIds(chars.map(() => null));
    setPuzzleTiles(buildPuzzleTiles(currentWord.en, level));
    setUsedHint(false);
    setPuzzleLocked(false);
    setPuzzleShake(false);
    setFeedback(null);
  }, [mode, index, currentWord, level]);

  // Flashcard Quiz (MC) handler
  const handleMcSelect = useCallback(
    (opt: VocabItem) => {
      if (mcLocked || !currentWord || isPaused) return;
      setMcLocked(true);
      setMcSelectedId(opt.id);

      const isRight = opt.id === currentWord.id || opt.zh === currentWord.zh;
      const nextAttempts = attemptsCount + 1;
      setAttemptsCount(nextAttempts);

      let nextScore = scoreEarned;
      let nextXp = xpEarned;
      let nextCorrect = correctCount;
      let nextStreak = streak;
      let nextMaxStreak = maxStreak;
      let nextHearts = hearts;
      let nextTreats = treatsEarned;

      if (isRight) {
        gameAudio.playConfirmSelect();
        nextStreak = streak + 1;
        nextMaxStreak = Math.max(maxStreak, nextStreak);
        const pts = basePoints + (nextStreak - 1) * streakBonus;
        const xp = xpPerCorrect;
        nextScore = scoreEarned + pts;
        nextXp = xpEarned + xp;
        nextCorrect = correctCount + 1;

        setStreak(nextStreak);
        setMaxStreak(nextMaxStreak);
        setScoreEarned(nextScore);
        setXpEarned(nextXp);
        setCorrectCount(nextCorrect);
        setFeedback({
          type: 'correct',
          text: `Correct! +${pts} pts (+${xp} XP)`,
        });
        onWordResult(currentWord.id, true, pts, xp, false, 0);

        if (nextStreak > 0 && nextStreak % 3 === 0) {
          const roll = (nextStreak / 3) % 3;
          const kind: 'biscuit' | 'bubbles' | 'flask' =
            roll === 1 ? 'biscuit' : roll === 2 ? 'bubbles' : 'flask';
          nextTreats = {
            biscuits: treatsEarned.biscuits + (kind === 'biscuit' ? 1 : 0),
            bubbles: treatsEarned.bubbles + (kind === 'bubbles' ? 1 : 0),
            flasks: treatsEarned.flasks + (kind === 'flask' ? 1 : 0),
          };
          awardTreatForStreak(nextStreak);
        }
      } else {
        gameAudio.playErrorBuzz();
        setMcShake(true);
        window.setTimeout(() => setMcShake(false), 420);
        nextHearts = hearts - 1;
        nextStreak = 0;
        setHearts(nextHearts);
        setStreak(0);
        setFeedback({
          type: 'wrong',
          text: `Incorrect! Correct meaning: ${currentWord.zh}`,
        });
        onWordResult(currentWord.id, false, 0, 0, true);
      }

      const advanceNow = () => {
        if (mcAdvanceTimerRef.current !== null) {
          window.clearTimeout(mcAdvanceTimerRef.current);
          mcAdvanceTimerRef.current = null;
        }
        mcAdvanceFnRef.current = null;
        if (nextHearts <= 0) {
          finishRound(
            true,
            nextScore,
            nextXp,
            nextCorrect,
            nextAttempts,
            nextMaxStreak,
            nextTreats,
          );
        } else if (index + 1 >= roundItems.length) {
          finishRound(
            false,
            nextScore,
            nextXp,
            nextCorrect,
            nextAttempts,
            nextMaxStreak,
            nextTreats,
          );
        } else {
          setIndex((i) => i + 1);
        }
      };

      mcAdvanceFnRef.current = advanceNow;
      mcAdvanceTimerRef.current = window.setTimeout(
        advanceNow,
        isRight ? 950 : 1250,
      );
    },
    [
      attemptsCount,
      awardTreatForStreak,
      basePoints,
      correctCount,
      currentWord,
      finishRound,
      hearts,
      index,
      isPaused,
      maxStreak,
      mcLocked,
      onWordResult,
      roundItems.length,
      scoreEarned,
      streak,
      streakBonus,
      treatsEarned,
      xpEarned,
      xpPerCorrect,
    ],
  );

  // Match evaluation
  useEffect(() => {
    if (mode !== 'MATCH' || !selectedEnId || !selectedZhId) return;
    if (selectedEnId === selectedZhId) {
      gameAudio.playConfirmSelect();
      const nextMatched = new Set(matchedIds);
      nextMatched.add(selectedEnId);
      setMatchedIds(nextMatched);
      setSelectedEnId(null);
      setSelectedZhId(null);

      const nextStreak = streak + 1;
      const nextMaxStreak = Math.max(maxStreak, nextStreak);
      const pts = basePoints + (nextStreak - 1) * streakBonus;
      const xp = xpPerCorrect;
      const nextScore = scoreEarned + pts;
      const nextXp = xpEarned + xp;
      const nextCorrect = correctCount + 1;
      const nextAttempts = attemptsCount + 1;

      setStreak(nextStreak);
      setMaxStreak(nextMaxStreak);
      setScoreEarned(nextScore);
      setXpEarned(nextXp);
      setCorrectCount(nextCorrect);
      setAttemptsCount(nextAttempts);
      setFeedback({type: 'correct', text: `+${pts} pts!`});

      onWordResult(selectedEnId, true, pts, xp, false, 0);
      awardTreatForStreak(nextStreak);

      if (nextMatched.size >= matchPairs.length) {
        setTimeout(() => {
          if (matchWave >= 1) {
            finishRound(
              false,
              nextScore,
              nextXp,
              nextCorrect,
              nextAttempts,
              nextMaxStreak,
            );
          } else {
            setMatchWave((w) => w + 1);
            setFeedback(null);
          }
        }, 420);
      }
    } else {
      gameAudio.playErrorBuzz();
      setShakePair(true);
      const nextHearts = hearts - 1;
      const nextAttempts = attemptsCount + 1;
      setHearts(nextHearts);
      setStreak(0);
      setAttemptsCount(nextAttempts);
      setFeedback({type: 'wrong', text: 'Mismatch! Try again'});
      onWordResult(selectedEnId, false, 0, 0, true);

      setTimeout(() => {
        setShakePair(false);
        setSelectedEnId(null);
        setSelectedZhId(null);
        if (nextHearts <= 0) {
          finishRound(true, scoreEarned, xpEarned, correctCount, nextAttempts);
        }
      }, 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnId, selectedZhId]);

  // Blanks submission
  const submitBlanks = useCallback(
    (answerText: string) => {
      if (blanksLocked || !currentWord || isPaused) return;
      const cleanGuess = answerText.trim().toLowerCase();
      if (!cleanGuess) return;
      const isRight = cleanGuess === currentWord.en.trim().toLowerCase();
      setBlanksLocked(true);
      const nextAttempts = attemptsCount + 1;
      setAttemptsCount(nextAttempts);

      if (isRight) {
        gameAudio.playConfirmSelect();
        const nextStreak = streak + 1;
        const nextMaxStreak = Math.max(maxStreak, nextStreak);
        const noHintBonus = !blanksHintRevealed ? 25 : 0;
        const noHintXp = !blanksHintRevealed ? 5 : 0;
        const pts = basePoints + (nextStreak - 1) * streakBonus + noHintBonus;
        const xp = xpPerCorrect + noHintXp;
        const nextScore = scoreEarned + pts;
        const nextXp = xpEarned + xp;
        const nextCorrect = correctCount + 1;

        setStreak(nextStreak);
        setMaxStreak(nextMaxStreak);
        setScoreEarned(nextScore);
        setXpEarned(nextXp);
        setCorrectCount(nextCorrect);
        setFeedback({
          type: 'correct',
          text: `Correct! +${pts} pts${noHintBonus > 0 ? ' (No-Hint +25 pts / +5 XP!)' : ''}`,
        });
        onWordResult(currentWord.id, true, pts, xp, false, 0);
        awardTreatForStreak(nextStreak);

        setTimeout(() => {
          if (index + 1 >= roundItems.length) {
            finishRound(
              false,
              nextScore,
              nextXp,
              nextCorrect,
              nextAttempts,
              nextMaxStreak,
            );
          } else {
            setIndex((i) => i + 1);
          }
        }, 700);
      } else {
        gameAudio.playErrorBuzz();
        const nextHearts = hearts - 1;
        setHearts(nextHearts);
        setStreak(0);
        setFeedback({
          type: 'wrong',
          text: `Answer: ${currentWord.en} (${currentWord.zh})`,
        });
        onWordResult(currentWord.id, false, 0, 0, true);

        setTimeout(() => {
          if (nextHearts <= 0) {
            finishRound(true, scoreEarned, xpEarned, correctCount, nextAttempts);
          } else if (index + 1 >= roundItems.length) {
            finishRound(false, scoreEarned, xpEarned, correctCount, nextAttempts);
          } else {
            setIndex((i) => i + 1);
          }
        }, 1050);
      }
    },
    [
      attemptsCount,
      awardTreatForStreak,
      basePoints,
      blanksLocked,
      correctCount,
      currentWord,
      finishRound,
      hearts,
      index,
      isPaused,
      maxStreak,
      onWordResult,
      blanksHintRevealed,
      roundItems.length,
      scoreEarned,
      streak,
      streakBonus,
      xpEarned,
      xpPerCorrect,
    ],
  );

  // Puzzle helpers
  const placePuzzleLetter = useCallback(
    (char: string, tileId?: string) => {
      if (puzzleLocked || !currentWord || isPaused) return;
      const emptyIdx = puzzleSlots.findIndex((s) => s === null);
      if (emptyIdx === -1) return;

      const upperChar = char.toUpperCase();
      let chosenTile: TileItem | undefined;
      if (tileId) {
        chosenTile = puzzleTiles.find((t) => t.id === tileId && !t.used);
      } else {
        chosenTile = puzzleTiles.find(
          (t) => !t.used && t.char === upperChar,
        );
      }
      if (!chosenTile) return;

      gameAudio.playCrispClick();
      const nextSlots = [...puzzleSlots];
      nextSlots[emptyIdx] = chosenTile.char;
      const nextTileIds = [...puzzleSlotTileIds];
      nextTileIds[emptyIdx] = chosenTile.id;
      setPuzzleSlots(nextSlots);
      setPuzzleSlotTileIds(nextTileIds);
      setPuzzleTiles((prev) =>
        prev.map((t) => (t.id === chosenTile!.id ? {...t, used: true} : t)),
      );
    },
    [isPaused, puzzleLocked, puzzleSlotTileIds, puzzleSlots, puzzleTiles, currentWord],
  );

  const removeLastPuzzleLetter = useCallback(() => {
    if (puzzleLocked || !currentWord || isPaused) return;
    let lastFilled = -1;
    for (let i = puzzleSlots.length - 1; i >= 0; i--) {
      if (/[A-Za-z]/.test(currentWord.en[i]) && puzzleSlots[i] !== null) {
        lastFilled = i;
        break;
      }
    }
    if (lastFilled === -1) return;
    const tileId = puzzleSlotTileIds[lastFilled];
    gameAudio.playCrispClick();
    const nextSlots = [...puzzleSlots];
    nextSlots[lastFilled] = null;
    const nextTileIds = [...puzzleSlotTileIds];
    nextTileIds[lastFilled] = null;
    setPuzzleSlots(nextSlots);
    setPuzzleSlotTileIds(nextTileIds);
    if (tileId) {
      setPuzzleTiles((prev) =>
        prev.map((t) => (t.id === tileId ? {...t, used: false} : t)),
      );
    }
  }, [currentWord, isPaused, puzzleLocked, puzzleSlotTileIds, puzzleSlots]);

  const handlePuzzleHint = useCallback(() => {
    if (puzzleLocked || !currentWord || isPaused) return;
    const emptyIdx = puzzleSlots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;
    const neededChar = currentWord.en[emptyIdx].toUpperCase();
    const matchingTile = puzzleTiles.find(
      (t) => !t.used && t.char === neededChar,
    );
    setUsedHint(true);
    gameAudio.playPowerupChime();
    const nextSlots = [...puzzleSlots];
    nextSlots[emptyIdx] = neededChar;
    const nextTileIds = [...puzzleSlotTileIds];
    nextTileIds[emptyIdx] = matchingTile ? matchingTile.id : null;
    setPuzzleSlots(nextSlots);
    setPuzzleSlotTileIds(nextTileIds);
    if (matchingTile) {
      setPuzzleTiles((prev) =>
        prev.map((t) => (t.id === matchingTile.id ? {...t, used: true} : t)),
      );
    }
  }, [currentWord, isPaused, puzzleLocked, puzzleSlotTileIds, puzzleSlots, puzzleTiles]);

  const submitPuzzle = useCallback(() => {
    if (puzzleLocked || !currentWord || isPaused) return;
    if (puzzleSlots.some((s) => s === null)) {
      gameAudio.playErrorBuzz();
      setPuzzleShake(true);
      setTimeout(() => setPuzzleShake(false), 350);
      return;
    }
    const guess = puzzleSlots.join('').toLowerCase();
    const target = currentWord.en.toLowerCase();
    const nextAttempts = attemptsCount + 1;
    setAttemptsCount(nextAttempts);

    if (guess === target) {
      setPuzzleLocked(true);
      gameAudio.playConfirmSelect();
      const nextStreak = streak + 1;
      const nextMaxStreak = Math.max(maxStreak, nextStreak);
      const hintPenalty = usedHint ? 0.75 : 1;
      const pts = Math.round(
        (basePoints + (nextStreak - 1) * streakBonus) * hintPenalty,
      );
      const xp = xpPerCorrect;
      const nextScore = scoreEarned + pts;
      const nextXp = xpEarned + xp;
      const nextCorrect = correctCount + 1;

      setStreak(nextStreak);
      setMaxStreak(nextMaxStreak);
      setScoreEarned(nextScore);
      setXpEarned(nextXp);
      setCorrectCount(nextCorrect);
      setFeedback({type: 'correct', text: `Solved! +${pts} pts`});
      onWordResult(currentWord.id, true, pts, xp, false, 0);
      awardTreatForStreak(nextStreak);

      setTimeout(() => {
        if (index + 1 >= roundItems.length) {
          finishRound(
            false,
            nextScore,
            nextXp,
            nextCorrect,
            nextAttempts,
            nextMaxStreak,
          );
        } else {
          setIndex((i) => i + 1);
        }
      }, 750);
    } else {
      gameAudio.playErrorBuzz();
      setPuzzleShake(true);
      const nextHearts = hearts - 1;
      setHearts(nextHearts);
      setStreak(0);
      setFeedback({
        type: 'wrong',
        text: nextHearts <= 0 ? `Word: ${currentWord.en}` : 'Not quite! Check spelling',
      });
      onWordResult(currentWord.id, false, 0, 0, true);

      setTimeout(() => {
        setPuzzleShake(false);
        if (nextHearts <= 0) {
          finishRound(true, scoreEarned, xpEarned, correctCount, nextAttempts);
        }
      }, 650);
    }
  }, [
    attemptsCount,
    awardTreatForStreak,
    basePoints,
    correctCount,
    currentWord,
    finishRound,
    hearts,
    index,
    isPaused,
    maxStreak,
    onWordResult,
    puzzleLocked,
    puzzleSlots,
    roundItems.length,
    scoreEarned,
    streak,
    streakBonus,
    usedHint,
    xpEarned,
    xpPerCorrect,
  ]);

  // Keyboard shortcuts for study modes
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === 'Escape') return; // Handled by global pause

      if (mode === 'FLASHCARDS') {
        const keyLower = e.key.toLowerCase();
        const choiceIdx =
          e.key === '1' || keyLower === 'a'
            ? 0
            : e.key === '2' || keyLower === 'b'
              ? 1
              : e.key === '3' || keyLower === 'c'
                ? 2
                : e.key === '4' || keyLower === 'd'
                  ? 3
                  : -1;
        if (choiceIdx >= 0 && !mcLocked && mcOptions[choiceIdx]) {
          e.preventDefault();
          handleMcSelect(mcOptions[choiceIdx]);
        } else if (
          (e.key === 'Enter' || e.key === ' ') &&
          mcLocked &&
          mcAdvanceFnRef.current
        ) {
          e.preventDefault();
          mcAdvanceFnRef.current();
        }
        return;
      }

      if (mode === 'BLANKS') {
        const isTypingInInput =
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement;
        if (
          !isTypingInInput &&
          (e.key === 'h' || e.key === 'H') &&
          !e.ctrlKey &&
          !e.metaKey &&
          !blanksLocked
        ) {
          e.preventDefault();
          gameAudio.playCrispClick();
          setShowBlanksHint((prev) => {
            const next = !prev;
            if (next) setBlanksHintRevealed(true);
            return next;
          });
        }
        return;
      }

      if (mode === 'PUZZLE') {
        if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          placePuzzleLetter(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          removeLastPuzzleLetter();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          submitPuzzle();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    blanksLocked,
    handleMcSelect,
    isPaused,
    mcLocked,
    mcOptions,
    mode,
    placePuzzleLetter,
    removeLastPuzzleLetter,
    submitPuzzle,
  ]);

  const modeLabel =
    mode === 'FLASHCARDS'
      ? 'Flashcards (MC) · 選擇題閃卡'
      : mode === 'MATCH'
        ? 'Translation Match · 英漢配對'
        : mode === 'BLANKS'
          ? 'Fill in the Blanks · 科學填空'
          : 'Word Puzzle · 單字拼圖';

  return (
    <div className="absolute inset-0 z-20 bg-slate-900/55 backdrop-blur-xs overflow-y-auto touch-auto">
      <div className="min-h-full flex flex-col items-center p-2 sm:p-4">
        <div className="m-auto w-full max-w-2xl bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl shadow-[0_10px_0_#1E293B] p-4 sm:p-6 flex flex-col gap-4">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#E2E8F0] pb-3">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
              {LEVEL_NAMES[level].en} ·{' '}
              {unit === 'ALL' ? 'All Units' : UNIT_NAMES[unit].en}
            </span>
            <h2 className="text-sm sm:text-lg font-extrabold text-[#1E293B]">
              {modeLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1 bg-rose-50 border-2 border-rose-300 px-2.5 py-1 rounded-xl"
              aria-label={`Hearts: ${hearts}`}>
              {Array.from({length: startingHearts}).map((_, idx) => (
                <Heart
                  key={idx}
                  size={16}
                  className={
                    idx < hearts
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-300'
                  }
                />
              ))}
            </div>

            <div className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-300">
              Streak: {streak}
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                onExit(attemptsCount > 0);
              }}
              className="min-w-[48px] min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-1">
              <X size={16} />
              Exit
            </button>
          </div>
        </div>

        {/* Progress & Feedback Strip */}
        <div className="flex items-center justify-between gap-2 text-xs font-bold">
          <span className="text-slate-600">
            {mode === 'MATCH'
              ? `Board ${matchWave + 1} / 2 · Matched ${matchedIds.size}/${matchPairs.length}`
              : `Card ${index + 1} / ${roundItems.length}`}
          </span>
          <span className="text-emerald-700">
            Round Score: +{scoreEarned} pts (+{xpEarned} XP)
          </span>
        </div>

        {feedback && (
          <div
            className={`px-3 py-2 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 ${
              feedback.type === 'correct'
                ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                : 'bg-rose-100 border-rose-500 text-rose-900'
            }`}>
            {feedback.type === 'correct' ? (
              <Check size={16} />
            ) : (
              <X size={16} />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* MODE 1: FLASHCARD QUIZ (MC) */}
        {mode === 'FLASHCARDS' && currentWord && (() => {
          const wordMastery = mastery[currentWord.id];
          const mastered = isWordMastered(wordMastery);
          const masteryTag = mastered
            ? 'Mastered ★'
            : wordMastery
              ? `Practicing (${wordMastery.correct}/2)`
              : 'New Term';
          const choiceLetters = ['A', 'B', 'C', 'D'];

          return (
            <div className="flex flex-col gap-4">
              <div
                className={`w-full rounded-2xl border-4 border-[#1E293B] bg-amber-50 p-5 flex flex-col items-center justify-center text-center shadow-[0_6px_0_#D97706] ${
                  mcShake ? 'animate-bounce' : ''
                }`}>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                  <span className="text-[11px] font-extrabold bg-white border border-[#1E293B] px-2.5 py-0.5 rounded-full text-slate-700">
                    Lv.{currentWord.level} · Unit {currentWord.unit}:{' '}
                    {UNIT_NAMES[currentWord.unit].en}
                  </span>
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                      mastered
                        ? 'bg-emerald-200 border-emerald-600 text-emerald-900'
                        : wordMastery
                          ? 'bg-amber-200 border-amber-600 text-amber-950'
                          : 'bg-sky-100 border-sky-400 text-sky-900'
                    }`}>
                    {masteryTag}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-[#1E293B] my-1">
                  {currentWord.en}
                </div>
                <span className="text-xs font-bold text-slate-600">
                  Choose the correct Traditional Chinese meaning · 選擇正確的中文意思
                </span>

                {mcLocked && (
                  <p className="mt-3 text-xs sm:text-sm font-bold text-slate-700 bg-white/80 border border-amber-300 rounded-xl px-3 py-2 max-w-lg leading-relaxed">
                    {currentWord.sentence.replace('___', currentWord.en)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mcOptions.map((opt, optIdx) => {
                  const isCorrectOpt =
                    opt.id === currentWord.id || opt.zh === currentWord.zh;
                  const isSelected = opt.id === mcSelectedId;
                  let cardClass =
                    'bg-white hover:bg-amber-100 border-[#1E293B] text-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5';

                  if (mcLocked) {
                    if (isCorrectOpt) {
                      cardClass =
                        'bg-emerald-200 border-emerald-600 text-emerald-950 shadow-[0_3px_0_#059669]';
                    } else if (isSelected) {
                      cardClass =
                        'bg-rose-200 border-rose-600 text-rose-950 shadow-[0_3px_0_#E11D48]';
                    } else {
                      cardClass =
                        'bg-slate-100 border-slate-300 text-slate-400 opacity-70';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={mcLocked}
                      onClick={() => handleMcSelect(opt)}
                      className={`min-h-[58px] px-4 py-2.5 rounded-xl border-2 font-black text-sm sm:text-base flex items-center justify-between gap-2 transition-all ${cardClass}`}>
                      <div className="flex items-center gap-2.5 text-left">
                        <span className="w-7 h-7 rounded-lg border-2 border-[#1E293B] bg-amber-100 text-[#1E293B] text-xs font-black flex items-center justify-center shrink-0">
                          {choiceLetters[optIdx]}
                        </span>
                        <span>{opt.zh}</span>
                      </div>
                      {mcLocked && isCorrectOpt && (
                        <Check
                          size={18}
                          className="text-emerald-700 shrink-0"
                        />
                      )}
                      {mcLocked && isSelected && !isCorrectOpt && (
                        <X size={18} className="text-rose-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {mcLocked && (
                <button
                  type="button"
                  onClick={() => mcAdvanceFnRef.current?.()}
                  className="min-h-[48px] w-full rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-black text-sm flex items-center justify-center gap-2 shadow-[0_3px_0_#1E293B]">
                  <span>
                    {hearts <= 0 || index + 1 >= roundItems.length
                      ? 'Continue'
                      : 'Next Question (Enter)'}
                  </span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          );
        })()}

        {/* MODE 2: TRANSLATION MATCH */}
        {mode === 'MATCH' && (
          <div
            className={`grid grid-cols-2 gap-3 ${shakePair ? 'animate-pulse' : ''}`}>
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-extrabold uppercase text-slate-500 text-center">
                English
              </div>
              {matchPairs.map((item) => {
                const isMatched = matchedIds.has(item.id);
                const isSelected = selectedEnId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setSelectedEnId(item.id);
                    }}
                    className={`min-h-[48px] px-3 py-2 rounded-xl border-2 font-bold text-xs sm:text-sm text-left transition-all ${
                      isMatched
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700 opacity-50'
                        : isSelected
                          ? 'bg-sky-200 border-[#1E293B] text-[#1E293B] -translate-y-0.5 shadow-[0_3px_0_#1E293B]'
                          : 'bg-white border-slate-300 hover:border-[#1E293B] text-[#1E293B]'
                    }`}>
                    {item.en}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-extrabold uppercase text-slate-500 text-center">
                繁體中文
              </div>
              {shuffledZh.map((item) => {
                const isMatched = matchedIds.has(item.id);
                const isSelected = selectedZhId === item.id;
                return (
                  <button
                    key={`zh_${item.id}`}
                    type="button"
                    disabled={isMatched}
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setSelectedZhId(item.id);
                    }}
                    className={`min-h-[48px] px-3 py-2 rounded-xl border-2 font-bold text-xs sm:text-sm text-left transition-all ${
                      isMatched
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700 opacity-50'
                        : isSelected
                          ? 'bg-amber-200 border-[#1E293B] text-[#1E293B] -translate-y-0.5 shadow-[0_3px_0_#1E293B]'
                          : 'bg-white border-slate-300 hover:border-[#1E293B] text-[#1E293B]'
                    }`}>
                    {item.zh}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 3: FILL IN THE BLANKS */}
        {mode === 'BLANKS' && currentWord && (
          <div className="flex flex-col gap-4">
            <div className="bg-sky-50 border-2 border-[#1E293B] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase text-sky-800">
                  Science Context Clue · 科學例句填空
                </span>
                <button
                  type="button"
                  disabled={blanksLocked}
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setShowBlanksHint((prev) => {
                      const next = !prev;
                      if (next) setBlanksHintRevealed(true);
                      return next;
                    });
                  }}
                  aria-pressed={showBlanksHint}
                  className={`min-h-[48px] px-3.5 rounded-xl border-2 border-[#1E293B] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_2px_0_#1E293B] active:translate-y-0.5 transition-colors disabled:opacity-50 ${
                    showBlanksHint
                      ? 'bg-amber-300 hover:bg-amber-200 text-[#1E293B]'
                      : 'bg-white hover:bg-amber-100 text-[#1E293B]'
                  }`}>
                  <Lightbulb
                    size={15}
                    className={
                      showBlanksHint ? 'text-amber-700' : 'text-amber-500'
                    }
                  />
                  <span>
                    {showBlanksHint
                      ? 'Hide Hint (H) · 隱藏提示'
                      : 'Show Hint (H) · 顯示提示'}
                  </span>
                </button>
              </div>

              {showBlanksHint ? (() => {
                const maskedClue = currentWord.en
                  .split('')
                  .map((ch, idx) => {
                    if (!/[A-Za-z]/.test(ch)) return ch;
                    return idx === 0 ? ch.toUpperCase() : '_';
                  })
                  .join(' ');
                const letterCount = currentWord.en.replace(/[^A-Za-z]/g, '').length;
                return (
                  <div className="bg-amber-100 border-2 border-amber-400 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-black text-amber-950">
                    <span>中文提示: {currentWord.zh}</span>
                    <span className="font-mono text-[11px] font-extrabold bg-white/85 border border-amber-400 px-2 py-0.5 rounded-lg text-[#1E293B]">
                      {maskedClue} ({letterCount} letters)
                    </span>
                  </div>
                );
              })() : (
                <div className="bg-white/75 border border-dashed border-sky-300 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-600">
                  <span>
                    Hint hidden — challenge yourself! (Click Show Hint if needed)
                  </span>
                  {!blanksHintRevealed && (
                    <span className="text-emerald-700 font-extrabold">
                      ★ No-hint bonus: +25 pts / +5 XP
                    </span>
                  )}
                </div>
              )}

              <p className="text-base sm:text-lg font-bold text-[#1E293B] leading-relaxed">
                {currentWord.sentence.split('___').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="inline-block min-w-[96px] border-b-4 border-emerald-600 text-center text-emerald-700 font-extrabold px-2">
                        {blanksTyped || '______'}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitBlanks(blanksTyped);
              }}
              className="flex gap-2">
              <input
                type="text"
                value={blanksTyped}
                disabled={blanksLocked}
                onChange={(e) => setBlanksTyped(e.target.value)}
                placeholder="Type English term or tap an option below..."
                className="flex-1 min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={blanksLocked || !blanksTyped.trim()}
                className="min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 font-extrabold text-sm shadow-[0_3px_0_#1E293B]">
                Check
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {blanksOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={blanksLocked}
                  onClick={() => submitBlanks(opt.en)}
                  className="min-h-[50px] px-4 py-2 rounded-xl border-2 border-[#1E293B] bg-white hover:bg-amber-100 font-extrabold text-sm text-left flex items-center justify-between shadow-[0_3px_0_#1E293B] active:translate-y-0.5">
                  <span>{opt.en}</span>
                  <Sparkles size={14} className="text-amber-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 4: WORD PUZZLE */}
        {mode === 'PUZZLE' && currentWord && (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border-2 border-[#1E293B] rounded-2xl p-4 text-center flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase text-amber-800">
                Spell the English Science Term
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#1E293B]">
                {currentWord.zh}
              </div>
              <div className="text-xs text-slate-600">
                {currentWord.sentence.replace('___', '______')}
              </div>
            </div>

            {/* Target Letter Slots */}
            <div
              className={`flex flex-wrap items-center justify-center gap-1.5 py-2 ${puzzleShake ? 'animate-bounce' : ''}`}>
              {currentWord.en.split('').map((origChar, slotIdx) => {
                const isAlpha = /[A-Za-z]/.test(origChar);
                if (!isAlpha) {
                  return (
                    <div
                      key={slotIdx}
                      className="w-5 h-10 flex items-center justify-center font-black text-lg text-slate-500">
                      {origChar === ' ' ? '·' : origChar}
                    </div>
                  );
                }
                const filled = puzzleSlots[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className={`w-9 h-11 sm:w-10 sm:h-12 rounded-lg border-2 flex items-center justify-center font-black text-base sm:text-lg ${
                      filled
                        ? 'bg-emerald-100 border-[#1E293B] text-[#1E293B] shadow-[0_2px_0_#1E293B]'
                        : 'bg-white border-dashed border-slate-400 text-slate-300'
                    }`}>
                    {filled || '_'}
                  </div>
                );
              })}
            </div>

            {/* Scrambled Letter Tiles */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {puzzleTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={tile.used || puzzleLocked}
                  onClick={() => placePuzzleLetter(tile.char, tile.id)}
                  className={`min-w-[48px] min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] font-black text-base transition-all ${
                    tile.used
                      ? 'bg-slate-200 text-slate-400 border-slate-300 opacity-40'
                      : 'bg-amber-200 hover:bg-amber-300 text-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5'
                  }`}>
                  {tile.char}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePuzzleHint}
                disabled={puzzleLocked}
                className="min-h-[48px] px-3.5 rounded-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Lightbulb size={16} className="text-amber-600" />
                Hint
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setPuzzleTiles((prev) => shuffle(prev));
                }}
                disabled={puzzleLocked}
                className="min-h-[48px] px-3.5 rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Shuffle size={16} />
                Shuffle
              </button>
              <button
                type="button"
                onClick={removeLastPuzzleLetter}
                disabled={puzzleLocked}
                className="min-h-[48px] px-3.5 rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <HelpCircle size={16} />
                Undo
              </button>
              <button
                type="button"
                onClick={submitPuzzle}
                disabled={puzzleLocked}
                className="min-h-[48px] px-5 rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_3px_0_#1E293B]">
                <Check size={16} />
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
