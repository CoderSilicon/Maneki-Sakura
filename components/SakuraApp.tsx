'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { RetroWindow } from '@/components/RetroWindow';
import { ToastContainer } from '@/components/ToastContainer';
import { ZenModeView } from '@/components/ZenModeView';
import { useToast } from '@/hooks/useToast';
import {
  playGrowthChime,
  playMatsuriFanfare,
  playMilestoneChime,
} from '@/lib/audio';
import { MatsuriRenderer } from '@/lib/matsuri';
import { SkyRenderer } from '@/lib/sky';
import {
  addGoldenRing,
  addMilestone,
  getDefaultState,
  getStage,
  getStageProgress,
  isBirthdayToday,
  loadState,
  resetState,
  saveState,
} from '@/lib/storage';
import { TreeRenderer } from '@/lib/tree-renderer';
import type { BlossomType, SakuraState } from '@/lib/types';
import { blossomIcon, formatDate } from '@/lib/utils';

export function SakuraApp() {
  const [state, setState] = useState<SakuraState>(getDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [matsuriActive, setMatsuriActive] = useState(false);
  const [zenActive, setZenActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [treeHidden, setTreeHidden] = useState(false);
  const [milestoneHidden, setMilestoneHidden] = useState(false);
  const [growthFlash, setGrowthFlash] = useState(false);
  const [clock, setClock] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [blossomType, setBlossomType] = useState<BlossomType>('knowledge');
  const [settingsDraft, setSettingsDraft] = useState(getDefaultState().settings);

  const { toasts, showToast } = useToast();

  const skyCanvasRef = useRef<HTMLCanvasElement>(null);
  const treeCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksCanvasRef = useRef<HTMLCanvasElement>(null);
  const treeRendererRef = useRef<TreeRenderer | null>(null);
  const skyRendererRef = useRef<SkyRenderer | null>(null);
  const matsuriRendererRef = useRef<MatsuriRenderer | null>(null);

  const stage = getStage(state.xp);

  const activateMatsuri = useCallback(
    (current: SakuraState) => {
      setMatsuriActive(true);
      addGoldenRing(current);
      if (current.settings.soundEnabled) playMatsuriFanfare();
      showToast('🎆 祭 Matsuri! Happy Birthday — Golden Bloom activated!', 'matsuri');
    },
    [showToast],
  );

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setSettingsDraft(loaded.settings);
    setHydrated(true);

    const daysSince = (Date.now() - loaded.lastVisit) / (1000 * 60 * 60 * 24);
    if (daysSince > 0.5) {
      setTimeout(() => {
        showToast(
          `Welcome back${loaded.settings.name ? `, ${loaded.settings.name}` : ''}! Your tree awaits you. 🌸`,
        );
      }, 500);
    }

    if (isBirthdayToday(loaded.settings.birthday)) {
      setMatsuriActive(true);
      addGoldenRing(loaded);
    }
  }, [showToast]);

  useEffect(() => {
    if (!hydrated || !skyCanvasRef.current) return;
    const renderer = new SkyRenderer(skyCanvasRef.current);
    skyRendererRef.current = renderer;
    renderer.start();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !treeCanvasRef.current || zenActive) return;

    if (!treeRendererRef.current) {
      treeRendererRef.current = new TreeRenderer(treeCanvasRef.current);
    }
    treeRendererRef.current.setState(state, stage.id, matsuriActive);

    return () => {
      if (treeRendererRef.current?._raf) {
        cancelAnimationFrame(treeRendererRef.current._raf);
        treeRendererRef.current._raf = undefined;
        treeRendererRef.current = null;
      }
    };
  }, [hydrated, zenActive]);

  useEffect(() => {
    if (treeRendererRef.current && !zenActive) {
      treeRendererRef.current.updateRefs(state, stage.id, matsuriActive);
    }
  }, [state, stage.id, matsuriActive, zenActive]);

  useEffect(() => {
    if (!hydrated || !fireworksCanvasRef.current) return;

    if (matsuriActive) {
      const renderer = new MatsuriRenderer(fireworksCanvasRef.current);
      matsuriRendererRef.current = renderer;
      renderer.start();
      return () => renderer.stop();
    }

    matsuriRendererRef.current?.stop();
    matsuriRendererRef.current = null;
  }, [hydrated, matsuriActive]);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleMilestoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    const title = milestoneTitle.trim();
    if (!title) return;

    const next = structuredClone(state);
    const milestone = addMilestone(next, title, blossomType);
    if (!milestone) return;

    setState(next);
    treeRendererRef.current?.triggerGrowth();
    setGrowthFlash(true);
    setTimeout(() => setGrowthFlash(false), 800);

    if (next.settings.soundEnabled) {
      playMilestoneChime(blossomType);
      setTimeout(() => playGrowthChime(), 400);
    }

    const labels = { knowledge: 'Knowledge', health: 'Health', life: 'Life' };
    showToast(`🌸 +${milestone.xp} XP — ${labels[blossomType]} blossom planted!`, 'success');
    setMilestoneTitle('');
  };

  const handleSettingsSave = () => {
    const next = {
      ...state,
      settings: { ...settingsDraft },
    };
    saveState(next);
    setState(next);
    setSettingsOpen(false);

    if (isBirthdayToday(next.settings.birthday)) {
      activateMatsuri(next);
    } else {
      setMatsuriActive(false);
    }
    showToast('Settings saved! ⚙', 'success');
  };

  const handleReset = () => {
    if (!confirm('Reset all data? Your tree will again be aseedling.')) return;
    const fresh = resetState();
    setState(fresh);
    setSettingsDraft(fresh.settings);
    setMatsuriActive(false);
    if (treeRendererRef.current) {
      treeRendererRef.current.setState(fresh, 'seedling', false);
    }
    showToast('Forgotten all data. Tree is now a seedling. 🌱');
  };

  if (!hydrated) {
    return <div className="sakura-app loading-screen">🌸 Loading ...</div>;
  }

  return (
    <div className="sakura-app">
      <canvas ref={skyCanvasRef} className="sky-canvas" />

      {matsuriActive && (
        <div className="matsuri-overlay">
          <canvas ref={fireworksCanvasRef} className="fireworks-canvas" />
        </div>
      )}

      <div className="desktop">
        <header className="desktop-header">
          <div className="logo">Maneki Sakura</div>
          <nav className="desktop-nav">
            <button type="button" className="retro-btn" onClick={() => setZenActive(true)}>
              禅 Zen
            </button>
            <button
              type="button"
              className="retro-btn"
              onClick={() => {
                setSettingsDraft(state.settings);
                setSettingsOpen(true);
              }}
            >
              Settings
            </button>
          </nav>
          <div className="clock">{clock}</div>
        </header>

        {!treeHidden && (
          <RetroWindow
            className="window-tree"
            bodyClassName="tree-body"
            icon="🌸"
            title="spp.exe"
            onClose={() => setTreeHidden(true)}
          >
            <>
              <canvas ref={treeCanvasRef} className="tree-canvas" />
              {growthFlash && <div className="growth-flash active" />}
              <div className="tree-stats">
                <div className="stat-row">
                  <span className="stat-label">Stage:</span>
                  <span className="stat-value">{stage.name}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">XP:</span>
                  <span className="stat-value">{state.xp}</span>
                  <div className="xp-bar">
                    <div className="xp-fill" style={{ width: `${getStageProgress(state.xp) * 100}%` }} />
                  </div>
                </div>
                <div className="blossom-counts">
                  <span className="blossom-badge knowledge" title="Knowledge">
                    📘 {state.blossoms.knowledge}
                  </span>
                  <span className="blossom-badge health" title="Health">
                    💚 {state.blossoms.health}
                  </span>
                  <span className="blossom-badge life" title="Life">
                    ✨ {state.blossoms.life}
                  </span>
                </div>
              </div>
            </>
          </RetroWindow>
        )}

        {!milestoneHidden && (
          <RetroWindow
            className="window-milestone"
            icon="📝"
            title="The Fertilizer — Milestone Log"
            onClose={() => setMilestoneHidden(true)}
          >
            <form className="milestone-form" onSubmit={handleMilestoneSubmit}>
              <label className="form-label" htmlFor="milestone-title">
                What did you achieve?
              </label>
              <input
                id="milestone-title"
                type="text"
                className="retro-input"
                placeholder="e.g. Finished a book, ran 5km..."
                maxLength={120}
                required
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
              />
              <span className="form-label">Blossom Type</span>
              <div className="blossom-picker">
                {(['knowledge', 'health', 'life'] as BlossomType[]).map((type) => (
                  <label key={type} className="blossom-option">
                    <input
                      type="radio"
                      name="blossom-type"
                      value={type}
                      checked={blossomType === type}
                      onChange={() => setBlossomType(type)}
                    />
                    <span className={`blossom-chip ${type}`}>
                      {blossomIcon(type)}{' '}
                      {type === 'knowledge' ? 'Knowledge' : type === 'health' ? 'Health' : 'Life Milestone'}
                    </span>
                  </label>
                ))}
              </div>
              <button type="submit" className="retro-btn primary">
                🌱 Plant Achievement
              </button>
            </form>
            <div className="milestone-history">
              <h3 className="history-title">Recent Growth</h3>
              <ul className="milestone-list">
                {state.milestones.length === 0 ? (
                  <li className="empty-msg">No milestones yet — plant your first achievement! 🌱</li>
                ) : (
                  state.milestones.slice(0, 15).map((m) => (
                    <li key={m.id} className={`milestone-item ${m.type}`}>
                      <span className="milestone-icon">{blossomIcon(m.type)}</span>
                      <div className="milestone-info">
                        <span className="milestone-title">{m.title}</span>
                        <span className="milestone-meta">
                          +{m.xp} XP · {formatDate(m.date)}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </RetroWindow>
        )}

        {settingsOpen && (
          <RetroWindow
            className="window-settings"
            icon="⚙"
            title="Settings.sys"
            onClose={() => setSettingsOpen(false)}
          >
            <label className="form-label" htmlFor="setting-name">
              Your Name
            </label>
            <input
              id="setting-name"
              type="text"
              className="retro-input"
              placeholder="Your name"
              value={settingsDraft.name}
              onChange={(e) => setSettingsDraft((s) => ({ ...s, name: e.target.value }))}
            />
            <label className="form-label" htmlFor="setting-birthday">
              Birthday (for Matsuri events)
            </label>
            <input
              id="setting-birthday"
              type="date"
              className="retro-input"
              value={settingsDraft.birthday}
              onChange={(e) => setSettingsDraft((s) => ({ ...s, birthday: e.target.value }))}
            />
            <label className="form-label checkbox-label">
              <input
                type="checkbox"
                checked={settingsDraft.soundEnabled}
                onChange={(e) => setSettingsDraft((s) => ({ ...s, soundEnabled: e.target.checked }))}
              />
              Enable 8-bit sound effects
            </label>
            <button type="button" className="retro-btn primary" onClick={handleSettingsSave}>
              Save Settings
            </button>
            <hr className="retro-divider" />
            <button type="button" className="retro-btn danger" onClick={handleReset}>
              Reset All Data
            </button>
          </RetroWindow>
        )}
      </div>

      <ZenModeView
        active={zenActive}
        state={state}
        stageId={stage.id}
        matsuri={matsuriActive}
        onExit={() => {
          setZenActive(false);
          if (treeCanvasRef.current) {
            treeRendererRef.current = new TreeRenderer(treeCanvasRef.current);
            treeRendererRef.current.setState(state, stage.id, matsuriActive);
          }
        }}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
