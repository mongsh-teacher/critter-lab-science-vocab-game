import {
  Check,
  Download,
  Plus,
  Shuffle,
  Trophy,
  Upload,
  User,
  X,
} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {LEVEL_NAMES} from './constants';
import {
  CritterPortrait,
  CritterSpeciesId,
  getCritterSpecies,
  getSpeciesStageLabel,
  pickRandomSpeciesId,
} from './critters';
import {
  CompanionProfile,
  countMasteredWords,
  getCompanionStage,
  isWordMastered,
  parseImportedSaveJson,
  SaveData,
} from './storage';
import {gameAudio} from './utils/helper';
import {VOCABULARY} from './vocabulary';

interface RankingModalProps {
  saveData: SaveData;
  activeProfile: CompanionProfile;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (
    profileName: string,
    companionName?: string,
    speciesId?: CritterSpeciesId,
  ) => void;
  onUpdateNames: (profileName: string, companionName: string) => void;
  onImportSave: (imported: SaveData) => void;
  onClose: () => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  saveData,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onUpdateNames,
  onImportSave,
  onClose,
}) => {
  const [tab, setTab] = useState<'RANKING' | 'CHECKLIST' | 'BACKUP'>('RANKING');
  const [levelFilter, setLevelFilter] = useState<1 | 2 | 3 | 'ALL'>('ALL');
  const [unitFilter, setUnitFilter] = useState<1 | 2 | 3 | 'ALL'>('ALL');
  const [editProfileName, setEditProfileName] = useState(
    activeProfile.profileName,
  );
  const [editCompanionName, setEditCompanionName] = useState(
    activeProfile.companionName,
  );
  const [newProfileName, setNewProfileName] = useState('');
  const [candidateSpeciesId, setCandidateSpeciesId] =
    useState<CritterSpeciesId>(() => {
      const existing = (
        Object.values(saveData.profiles) as CompanionProfile[]
      ).map((p) => p.speciesId);
      return pickRandomSpeciesId(existing);
    });
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const candidateSpecies = getCritterSpecies(candidateSpeciesId);

  const rankedProfiles = useMemo(() => {
    return (Object.values(saveData.profiles) as CompanionProfile[])
      .map((p) => {
        const accuracy =
          p.totalAttempts > 0
            ? Math.round((p.totalCorrect / p.totalAttempts) * 100)
            : 0;
        const mastered = countMasteredWords(p.mastery);
        return {
          ...p,
          accuracy,
          mastered,
          stage: getCompanionStage(p.xp),
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore || b.mastered - a.mastered);
  }, [saveData.profiles]);

  const sortedRuns = useMemo(() => {
    return [...saveData.runs]
      .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
      .slice(0, 12);
  }, [saveData.runs]);

  const filteredVocab = useMemo(() => {
    return VOCABULARY.filter(
      (v) =>
        (levelFilter === 'ALL' || v.level === levelFilter) &&
        (unitFilter === 'ALL' || v.unit === unitFilter),
    );
  }, [levelFilter, unitFilter]);

  const masteredInFilter = useMemo(() => {
    return filteredVocab.filter((v) =>
      isWordMastered(activeProfile.mastery[v.id]),
    ).length;
  }, [filteredVocab, activeProfile.mastery]);

  const handleRerollCandidate = () => {
    gameAudio.playCrispClick();
    setCandidateSpeciesId((curr) => pickRandomSpeciesId([curr]));
  };

  const handleExportDownload = () => {
    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `critter_lab_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Backup JSON downloaded!');
    gameAudio.playConfirmSelect();
  };

  const handleImportSubmit = () => {
    const parsed = parseImportedSaveJson(importText);
    if (!parsed) {
      setStatusMsg('Invalid JSON backup format.');
      gameAudio.playErrorBuzz();
      return;
    }
    onImportSave(parsed);
    setImportText('');
    setStatusMsg('Progress restored from JSON backup!');
    gameAudio.playPowerupChime();
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/75 overflow-y-auto touch-auto">
      <div className="min-h-full flex flex-col items-center p-3 sm:p-6">
        <div className="m-auto w-full max-w-2xl bg-[#FFFDF7] text-[#1E293B] border-4 border-[#1E293B] rounded-2xl shadow-[0_10px_0_#1E293B] p-4 sm:p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <img
                src="assets/images/ui_star_badge.png"
                alt="Scholar Medal"
                className="w-8 h-12 object-contain"
              />
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#1E293B]">
                  Ranking &amp; Mastery Board
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Local Device Profiles, High Scores &amp; Science Vocabulary
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                onClose();
              }}
              className="min-w-[48px] min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-1">
              <X size={16} />
              Close
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['RANKING', 'Local Ranking'],
                ['CHECKLIST', 'Mastery Checklist'],
                ['BACKUP', 'Profiles & Backup'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  gameAudio.playCrispClick();
                  setTab(key);
                }}
                className={`min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] font-extrabold text-xs sm:text-sm transition-colors ${
                  tab === key
                    ? 'bg-amber-300 text-[#1E293B] shadow-[0_3px_0_#1E293B]'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: LOCAL RANKING */}
          {tab === 'RANKING' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-500" />
                  Saved Local Profiles
                </h3>
                <div className="flex flex-col gap-2">
                  {rankedProfiles.map((p, idx) => {
                    const stageLabel = getSpeciesStageLabel(p.speciesId, p.stage);
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border-2 flex flex-wrap items-center justify-between gap-2 ${
                          p.id === activeProfile.id
                            ? 'bg-emerald-50 border-emerald-500'
                            : 'bg-white border-slate-200'
                        }`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#1E293B] text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-slate-200 flex items-center justify-center shrink-0">
                            <CritterPortrait
                              speciesId={p.speciesId}
                              stage={p.stage}
                              size={42}
                            />
                          </div>
                          <div>
                            <div className="font-extrabold text-sm">
                              {p.profileName}{' '}
                              <span className="text-xs font-bold text-emerald-700">
                                ({p.companionName} · {stageLabel.en} ·{' '}
                                {stageLabel.zh})
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-500">
                              Accuracy: {p.accuracy}% · Best Streak:{' '}
                              {p.bestStreak} · Mastered: {p.mastered}/
                              {VOCABULARY.length}
                            </div>
                          </div>
                        </div>
                        <div className="font-black text-base text-amber-700">
                          {p.totalScore} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Top Recorded Study Runs
                </h3>
                {sortedRuns.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-500">
                    Complete a study round to record your first run!
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                    {sortedRuns.map((run, idx) => (
                      <div
                        key={run.id}
                        className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold">
                        <span>
                          #{idx + 1} {run.profileName} · {run.mode} (L{run.level}
                          )
                        </span>
                        <span className="text-slate-600">
                          {run.accuracy}% · Streak {run.maxStreak} ·{' '}
                          <strong className="text-emerald-700">
                            {run.score} pts
                          </strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MASTERY CHECKLIST */}
          {tab === 'CHECKLIST' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 1, 2, 3] as const).map((lv) => (
                    <button
                      key={`lv_${lv}`}
                      type="button"
                      onClick={() => setLevelFilter(lv)}
                      className={`min-h-[48px] px-3 rounded-lg border-2 text-xs font-extrabold ${
                        levelFilter === lv
                          ? 'bg-[#1E293B] text-white border-[#1E293B]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}>
                      {lv === 'ALL' ? 'All Levels' : LEVEL_NAMES[lv].en}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 1, 2, 3] as const).map((un) => (
                    <button
                      key={`un_${un}`}
                      type="button"
                      onClick={() => setUnitFilter(un)}
                      className={`min-h-[48px] px-3 rounded-lg border-2 text-xs font-extrabold ${
                        unitFilter === un
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}>
                      {un === 'ALL' ? 'All Units' : `Unit ${un}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center justify-between">
                <span>
                  Mastered in Filter: {masteredInFilter} / {filteredVocab.length}
                </span>
                <span>
                  {filteredVocab.length > 0
                    ? Math.round((masteredInFilter / filteredVocab.length) * 100)
                    : 0}
                  %
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredVocab.map((v) => {
                  const m = activeProfile.mastery[v.id];
                  const mastered = isWordMastered(m);
                  const practicing = Boolean(m && !mastered);
                  return (
                    <div
                      key={v.id}
                      className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        mastered
                          ? 'bg-emerald-50 border-emerald-300'
                          : practicing
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-white border-slate-200'
                      }`}>
                      <div>
                        <div className="font-extrabold text-[#1E293B]">
                          {v.en}
                        </div>
                        <div className="text-slate-600 font-bold">
                          {v.zh} · L{v.level} U{v.unit}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] shrink-0 ${
                          mastered
                            ? 'bg-emerald-500 text-white'
                            : practicing
                              ? 'bg-amber-300 text-[#1E293B]'
                              : 'bg-slate-200 text-slate-600'
                        }`}>
                        {mastered
                          ? 'Mastered'
                          : practicing
                            ? `${m?.correct ?? 0}/2`
                            : 'New'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILES & JSON BACKUP */}
          {tab === 'BACKUP' && (
            <div className="flex flex-col gap-4">
              {statusMsg && (
                <div className="px-3 py-2 rounded-xl bg-sky-100 border border-sky-300 text-sky-900 font-bold text-xs">
                  {statusMsg}
                </div>
              )}

              <div className="p-3 rounded-xl border-2 border-slate-200 bg-slate-50 flex flex-col gap-2">
                <span className="text-xs font-black uppercase text-slate-600">
                  Rename Active Profile &amp; Companion
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    placeholder="Learner Name"
                    className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-white text-sm font-bold"
                  />
                  <input
                    type="text"
                    value={editCompanionName}
                    onChange={(e) => setEditCompanionName(e.target.value)}
                    placeholder="Companion Name"
                    className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-white text-sm font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNames(editProfileName, editCompanionName);
                    setStatusMsg('Profile & companion names updated!');
                    gameAudio.playConfirmSelect();
                  }}
                  className="min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] bg-emerald-400 hover:bg-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 self-start">
                  <Check size={16} />
                  Save Names
                </button>
              </div>

              <div className="p-3 rounded-xl border-2 border-slate-200 bg-slate-50 flex flex-col gap-2.5">
                <span className="text-xs font-black uppercase text-slate-600">
                  Switch or Adopt a New Profile (20 Critters!)
                </span>
                <div className="flex flex-wrap gap-2">
                  {(Object.values(saveData.profiles) as CompanionProfile[]).map(
                    (p) => {
                      const sp = getCritterSpecies(p.speciesId);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectProfile(p.id);
                            setEditProfileName(p.profileName);
                            setEditCompanionName(p.companionName);
                            gameAudio.playCrispClick();
                          }}
                          className={`min-h-[48px] px-3 rounded-xl border-2 text-xs font-extrabold flex items-center gap-1.5 ${
                            p.id === activeProfile.id
                              ? 'bg-[#1E293B] text-amber-300 border-[#1E293B]'
                              : 'bg-white text-[#1E293B] border-slate-300'
                          }`}>
                          <User size={14} />
                          <span>
                            {p.profileName} ({sp.zhName})
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* New Profile with Mystery Critter Preview & Re-roll */}
                <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200 flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <CritterPortrait
                          speciesId={candidateSpeciesId}
                          stage={1}
                          size={44}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-800">
                          Mystery Buddy: Baby {candidateSpecies.enName} (
                          {candidateSpecies.zhName})
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          {candidateSpecies.personality}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRerollCandidate}
                      className="min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-sky-100 hover:bg-sky-200 font-extrabold text-xs flex items-center gap-1 shrink-0">
                      <Shuffle size={14} />
                      Re-roll
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="New student profile name..."
                      className="flex-1 min-h-[48px] px-3 rounded-xl border-2 border-[#1E293B] bg-white text-sm font-bold"
                    />
                    <button
                      type="button"
                      disabled={!newProfileName.trim()}
                      onClick={() => {
                        const adopted = candidateSpecies;
                        onCreateProfile(
                          newProfileName,
                          adopted.defaultPetName,
                          adopted.id,
                        );
                        setEditProfileName(newProfileName.trim());
                        setEditCompanionName(adopted.defaultPetName);
                        setNewProfileName('');
                        setCandidateSpeciesId(
                          pickRandomSpeciesId([adopted.id]),
                        );
                        setStatusMsg(
                          `Adopted Baby ${adopted.enName} (${adopted.zhName}) for new profile!`,
                        );
                        gameAudio.playConfirmSelect();
                      }}
                      className="min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] bg-amber-300 hover:bg-amber-200 disabled:opacity-40 font-extrabold text-xs flex items-center gap-1">
                      <Plus size={16} />
                      Adopt
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border-2 border-slate-200 bg-slate-50 flex flex-col gap-2">
                <span className="text-xs font-black uppercase text-slate-600">
                  JSON Export / Import Backup
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportDownload}
                    className="min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] bg-sky-200 hover:bg-sky-300 font-extrabold text-xs flex items-center gap-1.5">
                    <Download size={16} />
                    Export Save JSON
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported Save JSON here to restore..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-mono"
                />
                <button
                  type="button"
                  disabled={!importText.trim()}
                  onClick={handleImportSubmit}
                  className="min-h-[48px] px-4 rounded-xl border-2 border-[#1E293B] bg-amber-300 hover:bg-amber-200 disabled:opacity-40 font-extrabold text-xs flex items-center gap-1.5 self-start">
                  <Upload size={16} />
                  Import Backup JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
