import {
  computeTitrationPh,
  getIndicatorColorHex,
  INDICATORS,
  QUALITATIVE_SALTS,
  computeBohrTransition,
  computeVseprGeometry,
  computeHaberEquilibrium,
  computeElectrochemistry,
  ELECTRODE_COUPLES,
  computeStereochemistry,
  computeGrahamDiffusion
} from './chemistry/calculations.js';
import { CURRICULUM_MODULES } from './data/curriculum.js';
import { PRACTICAL_MATRIX_ROWS } from './data/practicalGuide.js';
import { SceneManager } from './engine/SceneManager.js';
import { AnalyticalPlotter } from './engine/AnalyticalPlotter.js';

const STORAGE_KEY = 'chemia_atelier_v1_progress';

function createDefaultLabState() {
  return {
    titration: {
      mode: 'strong_acid_strong_base',
      cAnalyte: 0.10,
      vAnalyte: 25.0,
      cTitrant: 0.10,
      vAdded: 18.0,
      indicator: 'phenolphthalein'
    },
    qualitative: {
      saltKey: 'CuSO4',
      cobaltGlass: false,
      addedFerrocyanide: true,
      addedAnionReagent: false,
      mysteryActive: false,
      mysteryTargetKey: 'FeCl3',
      mysterySolved: false,
      mysteryFeedback: ''
    },
    bohr: {
      atomicZ: 1,
      n1: 2,
      n2: 3
    },
    vsepr: {
      bp: 4,
      lp: 0
    },
    equilibrium: {
      tempC: 450,
      pressureAtm: 200,
      catalyst: true
    },
    electrochem: {
      mode: 'galvanic',
      anodeKey: 'Zn',
      cathodeKey: 'Cu',
      cAnode: 1.0,
      cCathode: 1.0,
      tempK: 298.15,
      currentAmp: 3.5,
      timeMin: 12.0
    },
    organic: {
      submode: 'geometric',
      configuration: 'cis',
      dPercent: 100,
      tubeLengthDm: 2.0,
      concGmL: 0.50
    },
    gaslaws: {
      acidGas: 'HCl',
      tubeLengthCm: 60.0,
      progress: 1.0,
      running: false,
      pressureAtm: 120,
      tempK: 300,
      amagatGas: 'CO2'
    }
  };
}

class ChemiaAtelierApp {
  constructor() {
    this.route = 'overview';
    this.activeModuleId = 'titration';
    this.activeConsoleTab = 'controls';
    this.state = createDefaultLabState();

    this.progress = this._loadProgress();
    this.sceneManager = null;
    this.plotter = null;
    this.toastTimeout = null;
    this.diffusionTimer = null;

    this._initDOM();
    this._renderOverviewCatalogue();
    this._renderPracticalReference();
    this._renderFullAssessment();
    this._updateLedgerHeader();

    // Check URL hash for direct studio entry (used by game.html & deep links)
    if (window.location.hash.startsWith('#studio')) {
      const parts = window.location.hash.split(':');
      if (parts[1] && CURRICULUM_MODULES.some((m) => m.id === parts[1])) {
        this.activeModuleId = parts[1];
      }
      this.navigate('studio');
    }
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          stamps: parsed.stamps || {},
          quiz: parsed.quiz || {}
        };
      }
    } catch {
      // Ignore storage access errors in restricted sandboxes
    }
    return { stamps: {}, quiz: {} };
  }

  _saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      // Ignore storage quota/privacy restrictions
    }
    this._updateLedgerHeader();
  }

  _updateLedgerHeader() {
    const stampCount = Object.keys(this.progress.stamps).length;
    const correctMcq = Object.entries(this.progress.quiz).filter(([modId, choice]) => {
      const mod = CURRICULUM_MODULES.find((m) => m.id === modId);
      return mod && mod.quiz.answerIdx === choice;
    }).length;

    const elStamps = document.getElementById('header-stamps-count');
    const elQuiz = document.getElementById('header-quiz-score');
    if (elStamps) elStamps.textContent = `${stampCount} / 24`;
    if (elQuiz) elQuiz.textContent = `${correctMcq} / 8`;
  }

  _initDOM() {
    // Primary route tabs
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.route));
    });

    document.getElementById('brand-home-btn')?.addEventListener('click', () => this.navigate('overview'));
    document.getElementById('hero-enter-lab-btn')?.addEventListener('click', () => this.navigate('studio'));
    document.getElementById('hero-open-practical-btn')?.addEventListener('click', () => this.navigate('practical'));

    document.querySelectorAll('[data-launch-module]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeModuleId = btn.dataset.launchModule;
        this.navigate('studio');
      });
    });

    // Studio module bar chips
    const bar = document.getElementById('studio-module-bar');
    if (bar) {
      bar.innerHTML = CURRICULUM_MODULES.map(
        (m) => `
          <button type="button" class="module-chip ${m.id === this.activeModuleId ? 'active' : ''}" data-mod="${m.id}" role="tab">
            <span class="chip-num">${m.num}</span>
            <span>${m.shortTitle}</span>
          </button>
        `
      ).join('');
      bar.querySelectorAll('.module-chip').forEach((chip) => {
        chip.addEventListener('click', () => this.selectModule(chip.dataset.mod));
      });
    }

    // Camera preset toolbar
    document.querySelectorAll('.vp-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.vp-tool-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.sceneManager?.setCameraPreset(btn.dataset.cam);
      });
    });

    // Console drawer tabs
    document.querySelectorAll('.console-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeConsoleTab = tab.dataset.ctab;
        document.querySelectorAll('.console-tab').forEach((t) => t.classList.toggle('active', t === tab));
        document.querySelectorAll('.console-section').forEach((sec) => {
          sec.classList.toggle('active', sec.id === `csec-${this.activeConsoleTab}`);
        });
        if (this.activeConsoleTab === 'controls') {
          requestAnimationFrame(() => this._refreshSimulation(false));
        }
      });
    });

    document.getElementById('reset-bench-btn')?.addEventListener('click', () => {
      const fresh = createDefaultLabState();
      this.state[this.activeModuleId] = fresh[this.activeModuleId];
      this._renderModuleConsole();
      this._refreshSimulation(true);
    });

    document.getElementById('reset-progress-btn')?.addEventListener('click', () => {
      this.progress = { stamps: {}, quiz: {} };
      this._saveProgress();
      this._renderOverviewCatalogue();
      this._renderFullAssessment();
      if (this.route === 'studio') this._renderModuleConsole();
    });

    // Continuous diffusion animation timer for Module 08
    this.diffusionTimer = setInterval(() => {
      const gs = this.state.gaslaws;
      if (gs.running && gs.progress < 1.0) {
        gs.progress = Math.min(1.0, +(gs.progress + 0.04).toFixed(3));
        if (gs.progress >= 1.0) gs.running = false;
        if (this.route === 'studio' && this.activeModuleId === 'gaslaws') {
          this._refreshSimulation(true);
        }
      }
    }, 80);
  }

  navigate(route) {
    this.route = route;
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b.dataset.route === route));
    document.querySelectorAll('.app-view').forEach((v) => v.classList.remove('active'));
    document.getElementById(`view-${route}`)?.classList.add('active');

    if (route === 'studio') {
      if (!this.sceneManager) {
        const mount = document.getElementById('webgl-mount');
        this.sceneManager = new SceneManager(mount);
      }
      if (!this.plotter) {
        this.plotter = new AnalyticalPlotter(document.getElementById('scientific-plotter'));
      }
      this.selectModule(this.activeModuleId);
      requestAnimationFrame(() => {
        this.sceneManager?._handleResize();
        this._refreshSimulation(false);
      });
    } else if (route === 'overview') {
      this._renderOverviewCatalogue();
    } else if (route === 'assessment') {
      this._renderFullAssessment();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  selectModule(modId) {
    this.activeModuleId = modId;
    document.querySelectorAll('.module-chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.mod === modId);
    });
    document.querySelectorAll('.vp-tool-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.cam === 'default');
    });

    if (this.sceneManager) {
      this.sceneManager.setModule(modId);
    }
    this._renderModuleConsole();
    this._refreshSimulation(true);
  }

  _computeActiveModule(modId = this.activeModuleId) {
    if (modId === 'titration') {
      const st = this.state.titration;
      const res = computeTitrationPh(st);
      const colorHex = getIndicatorColorHex(res.pH, st.indicator);
      return { ...res, colorHex };
    }
    if (modId === 'qualitative') {
      const st = this.state.qualitative;
      const activeKey = st.mysteryActive ? st.mysteryTargetKey : st.saltKey;
      const salt = QUALITATIVE_SALTS[activeKey] || QUALITATIVE_SALTS.CuSO4;
      return { salt };
    }
    if (modId === 'bohr') {
      return computeBohrTransition(this.state.bohr);
    }
    if (modId === 'vsepr') {
      return computeVseprGeometry(this.state.vsepr.bp, this.state.vsepr.lp);
    }
    if (modId === 'equilibrium') {
      return computeHaberEquilibrium(this.state.equilibrium);
    }
    if (modId === 'electrochem') {
      return computeElectrochemistry(this.state.electrochem);
    }
    if (modId === 'organic') {
      return computeStereochemistry(this.state.organic);
    }
    return computeGrahamDiffusion({
      gas1Key: 'NH3',
      gas2Key: this.state.gaslaws.acidGas,
      tubeLengthCm: this.state.gaslaws.tubeLengthCm,
      pressureAtm: this.state.gaslaws.pressureAtm,
      tempK: this.state.gaslaws.tempK,
      amagatGas: this.state.gaslaws.amagatGas
    });
  }

  _refreshSimulation(checkStamps = true) {
    const mod = CURRICULUM_MODULES.find((m) => m.id === this.activeModuleId);
    if (!mod) return;
    const calc = this._computeActiveModule(this.activeModuleId);

    // 1. Update 3D Scene & 2D Plotter
    this.sceneManager?.syncState(this.activeModuleId, this.state, calc);
    this.plotter?.render(this.activeModuleId, this.state, calc);

    // 2. Update Viewport Glass Equation HUD & Telemetry Readouts
    document.getElementById('vp-curriculum-tag').textContent = `${mod.num} · ${mod.nctbTag}`;
    document.getElementById('vp-equation-math').textContent = mod.equationText;

    const statusBadge = document.getElementById('vp-status-badge');
    const telemetryEl = document.getElementById('vp-telemetry-cells');
    const { badgeText, badgeKind, cells } = this._buildTelemetrySummary(this.activeModuleId, calc);

    statusBadge.textContent = badgeText;
    statusBadge.className = `vp-status-flag ${badgeKind || ''}`;
    telemetryEl.innerHTML = cells
      .map(
        (c) => `
          <div class="readout-cell">
            <span class="readout-k">${c.k}</span>
            <span class="readout-v">${c.v}</span>
          </div>
        `
      )
      .join('');

    // 3. Evaluate Practical Stamps
    if (checkStamps) {
      this._evaluateStamps(this.activeModuleId, calc);
    }
  }

  _buildTelemetrySummary(modId, calc) {
    if (modId === 'titration') {
      const st = this.state.titration;
      const nearEq = Math.abs(st.vAdded - calc.vEq) <= 0.16;
      return {
        badgeText: nearEq ? 'Equivalence Endpoint Reached' : `${calc.region.toUpperCase()} SOLUTION`,
        badgeKind: nearEq ? 'good' : '',
        cells: [
          { k: 'Measured pH', v: calc.pH.toFixed(2) },
          { k: 'Titrant Added', v: `${st.vAdded.toFixed(2)} mL` },
          { k: 'Equivalence V_eq', v: `${calc.vEq.toFixed(2)} mL` },
          { k: 'Indicator', v: INDICATORS[st.indicator].name.split(' ')[0] }
        ]
      };
    }
    if (modId === 'qualitative') {
      const st = this.state.qualitative;
      const salt = calc.salt;
      return {
        badgeText: st.mysteryActive ? 'Mystery Unknown Salt Active' : `${salt.formula} (${salt.cation})`,
        badgeKind: st.mysteryActive ? 'warn' : 'good',
        cells: [
          { k: 'Flame View', v: st.cobaltGlass ? salt.cobaltFlameName.split('(')[0] : salt.nakedFlameName },
          { k: 'Filter', v: st.cobaltGlass ? 'Cobalt Glass ON' : 'Naked Eye' },
          { k: 'Tube A (Ferro.)', v: st.addedFerrocyanide ? 'Precipitated' : 'Clear' },
          { k: 'Tube B (Anion)', v: st.addedAnionReagent ? 'Precipitated' : 'Clear' }
        ]
      };
    }
    if (modId === 'bohr') {
      return {
        badgeText: `${calc.series} Series · ${calc.band}`,
        badgeKind: calc.band === 'Visible' ? 'good' : '',
        cells: [
          { k: 'Transition', v: `n=${calc.n2} -> n=${calc.n1}` },
          { k: 'Wavelength', v: `${calc.wavelengthNm.toFixed(2)} nm` },
          { k: 'Photon Energy', v: `${calc.energyEv.toFixed(2)} eV` },
          { k: 'Ion Charge', v: `Z = ${this.state.bohr.atomicZ}` }
        ]
      };
    }
    if (modId === 'vsepr') {
      return {
        badgeText: `${calc.geometry} · ${calc.hybridization}`,
        badgeKind: 'good',
        cells: [
          { k: 'Bond Angle', v: `${calc.bondAngle}°` },
          { k: 'Hybridization', v: calc.hybridization },
          { k: 'Pairs (BP / LP)', v: `${this.state.vsepr.bp} BP / ${this.state.vsepr.lp} LP` },
          { k: 'NCTB Example', v: calc.example }
        ]
      };
    }
    if (modId === 'equilibrium') {
      const st = this.state.equilibrium;
      return {
        badgeText: st.catalyst ? 'Fe + Mo Catalyst Bed Active' : 'Uncatalyzed Slow Kinetics',
        badgeKind: st.catalyst ? 'good' : 'warn',
        cells: [
          { k: 'NH3 Eq. Yield', v: `${calc.yieldPct.toFixed(1)} %` },
          { k: 'Temperature', v: `${st.tempC} °C` },
          { k: 'Pressure', v: `${st.pressureAtm} atm` },
          { k: 'E_a Barrier', v: `${calc.activationBarrierKj} kJ/mol` }
        ]
      };
    }
    if (modId === 'electrochem') {
      const st = this.state.electrochem;
      if (st.mode === 'galvanic') {
        return {
          badgeText: calc.spontaneous ? 'Spontaneous Galvanic Cell (Delta G < 0)' : 'Non-Spontaneous Polarity',
          badgeKind: calc.spontaneous ? 'good' : 'warn',
          cells: [
            { k: 'Cell EMF (E)', v: `${calc.eCell >= 0 ? '+' : ''}${calc.eCell.toFixed(3)} V` },
            { k: 'Standard E0', v: `${calc.e0Cell.toFixed(2)} V` },
            { k: 'Couple', v: `${st.anodeKey} | ${st.cathodeKey}` },
            { k: 'Delta G', v: `${calc.deltaGKj.toFixed(1)} kJ/mol` }
          ]
        };
      }
      return {
        badgeText: 'DC Faraday Electroplating Active',
        badgeKind: 'good',
        cells: [
          { k: 'Plated Mass W', v: `${calc.depositedMassG.toFixed(3)} g` },
          { k: 'Charge Q', v: `${Math.round(calc.chargeCoulombs)} C` },
          { k: 'Current I', v: `${st.currentAmp.toFixed(1)} A` },
          { k: 'Cathode Metal', v: st.cathodeKey }
        ]
      };
    }
    if (modId === 'organic') {
      const st = this.state.organic;
      if (st.submode === 'geometric') {
        return {
          badgeText: calc.isomerName,
          badgeKind: calc.dipoleDebye === 0 ? 'good' : '',
          cells: [
            { k: 'Net Dipole mu', v: `${calc.dipoleDebye.toFixed(2)} D` },
            { k: 'Boiling Point', v: `${calc.boilingPointC} °C` },
            { k: 'Melting Point', v: `${calc.meltingPointC} °C` },
            { k: 'Pi Rotation', v: 'Restricted' }
          ]
        };
      }
      return {
        badgeText: calc.opticalStatus,
        badgeKind: Math.abs(calc.observedRotationDeg) < 0.02 ? 'good' : '',
        cells: [
          { k: 'Observed alpha', v: `${calc.observedRotationDeg >= 0 ? '+' : ''}${calc.observedRotationDeg.toFixed(2)}°` },
          { k: '(+)-d / (-)-l', v: `${st.dPercent}% / ${100 - st.dPercent}%` },
          { k: 'Enantiomeric ee', v: `${calc.eePercent}%` },
          { k: 'Tube l', v: `${st.tubeLengthDm.toFixed(1)} dm` }
        ]
      };
    }

    const st = this.state.gaslaws;
    return {
      badgeText: st.progress >= 0.95 ? `${calc.productFormula} White Ring Formed` : 'Gases Diffusing Along Tube',
      badgeKind: st.progress >= 0.95 ? 'good' : '',
      cells: [
        { k: 'Ring from NH3', v: `${calc.x1Cm.toFixed(2)} cm` },
        { k: 'Rate Ratio r1/r2', v: `${calc.rateRatio.toFixed(3)}` },
        { k: `Z (${st.amagatGas})`, v: calc.zFactor.toFixed(3) },
        { k: 'Progress', v: `${Math.round(st.progress * 100)}%` }
      ]
    };
  }

  _evaluateStamps(modId, calc) {
    const award = (id, label) => {
      if (!this.progress.stamps[id]) {
        this.progress.stamps[id] = Date.now();
        this._saveProgress();
        this._showToast(`Stamp Verified: ${label}`, 'Saved permanently in laboratory ledger.');
        this._renderStampsTab();
      }
    };

    if (modId === 'titration') {
      const st = this.state.titration;
      if (st.mode === 'strong_acid_strong_base' && Math.abs(st.vAdded - calc.vEq) <= 0.16) {
        award('titration-1', 'Neutralization Endpoint (pH = 7.00)');
      }
      if (st.mode === 'weak_acid_strong_base' && calc.pH >= 4.68 && calc.pH <= 4.80) {
        award('titration-2', 'Acetate Half-Equivalence Buffer (pH = 4.74)');
      }
      if (
        st.mode === 'weak_acid_strong_base' &&
        st.indicator === 'phenolphthalein' &&
        calc.pH >= 8.30 &&
        calc.pH <= 9.25
      ) {
        award('titration-3', 'Phenolphthalein Basic Equivalence');
      }
    } else if (modId === 'qualitative') {
      const st = this.state.qualitative;
      if (!st.mysteryActive && st.saltKey === 'KCl' && st.cobaltGlass) {
        award('qualitative-1', 'Cobalt Glass Potassium Verification');
      }
      if (!st.mysteryActive && st.saltKey === 'FeCl3' && st.addedFerrocyanide) {
        award('qualitative-2', 'Prussian Blue Ferric Confirmation');
      }
      if (st.mysterySolved) {
        award('qualitative-3', 'Mystery Salt Detective Solved');
      }
    } else if (modId === 'bohr') {
      const st = this.state.bohr;
      if (st.atomicZ === 1 && calc.n1 === 2 && calc.n2 === 3) {
        award('bohr-1', 'Balmer H-Alpha Red Line (656.5 nm)');
      }
      if (st.atomicZ === 1 && calc.n1 === 1 && calc.n2 === 2) {
        award('bohr-2', 'Lyman Ultraviolet Transition (121.6 nm)');
      }
      if (st.atomicZ === 2 && calc.energyEv > 35.0) {
        award('bohr-3', 'He+ Ion High-Energy Spectrum');
      }
    } else if (modId === 'vsepr') {
      const st = this.state.vsepr;
      if (st.bp === 2 && st.lp === 2) award('vsepr-1', 'Bent Water Compression (104.5°)');
      if (st.bp === 3 && st.lp === 1) award('vsepr-2', 'Trigonal Pyramidal Ammonia (107.0°)');
      if (st.bp === 4 && st.lp === 2) award('vsepr-3', 'Square Planar XeF4 (sp3d2)');
    } else if (modId === 'equilibrium') {
      const st = this.state.equilibrium;
      if (st.tempC >= 440 && st.tempC <= 460 && st.pressureAtm >= 190 && st.pressureAtm <= 210 && st.catalyst) {
        award('equilibrium-1', 'Optimal Industrial Haber Compromise');
      }
      if (calc.yieldPct > 55.0) {
        award('equilibrium-2', 'High-Yield Compression (> 55% NH3)');
      }
      if (calc.yieldPct < 8.0) {
        award('equilibrium-3', 'High-Temperature Thermal Dissociation');
      }
    } else if (modId === 'electrochem') {
      const st = this.state.electrochem;
      if (st.mode === 'galvanic' && st.anodeKey === 'Zn' && st.cathodeKey === 'Cu' && Math.abs(calc.eCell - 1.1) < 0.015) {
        award('electrochem-1', 'Standard Daniell Cell (+1.100 V)');
      }
      if (st.mode === 'galvanic' && calc.eCell > 3.0) {
        award('electrochem-2', 'High-Voltage Mg | Ag Couple (> 3.0 V)');
      }
      if (st.mode === 'faraday' && calc.depositedMassG >= 1.0) {
        award('electrochem-3', 'Faraday Electroplating (>= 1.00 g)');
      }
    } else if (modId === 'organic') {
      const st = this.state.organic;
      if (st.submode === 'geometric' && st.configuration === 'trans') {
        award('organic-1', 'Trans-Alkene Zero Dipole Symmetry');
      }
      if (st.submode === 'optical' && st.dPercent === 50) {
        award('organic-2', 'Racemic Optical Compensation (0.00°)');
      }
      if (st.submode === 'optical' && Math.abs(calc.observedRotationDeg) >= 5.0) {
        award('organic-3', 'Pure Enantiomer Polarimetry (>= 5.0°)');
      }
    } else if (modId === 'gaslaws') {
      const st = this.state.gaslaws;
      if (st.acidGas === 'HCl' && Math.abs(st.tubeLengthCm - 60) < 0.5 && st.progress >= 0.98) {
        award('gaslaws-1', 'Classic NH4Cl White Ring at 35.65 cm');
      }
      if (st.acidGas === 'HBr' && calc.x1Cm > 40.0 && st.progress >= 0.98) {
        award('gaslaws-2', 'Heavy Bromide Shift (NH3 + HBr > 40 cm)');
      }
      if (st.amagatGas === 'CO2' && calc.zFactor < 0.85) {
        award('gaslaws-3', 'CO2 Negative Compressibility Dip (Z < 0.85)');
      }
    }
  }

  _showToast(title, detail) {
    const el = document.getElementById('bench-toast');
    if (!el) return;
    document.getElementById('bench-toast-title').textContent = title;
    document.getElementById('bench-toast-detail').textContent = detail;
    el.classList.add('show', 'hit');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* =========================================================================
     CONSOLE RENDERING (CONTROLS, STAMPS, THEORY)
     ========================================================================= */
  _renderModuleConsole() {
    this._renderControlsTab();
    this._renderStampsTab();
    this._renderTheoryTab();
  }

  _sliderHTML({ id, label, val, min, max, step, unit = '' }) {
    const formatted = Number(step) < 0.1 ? Number(val).toFixed(2) : Number(step) < 1 ? Number(val).toFixed(1) : val;
    return `
      <div class="instrument-control">
        <div class="control-top">
          <span class="control-name">${label}</span>
          <span class="control-val-group">
            <button type="button" class="vernier-step" data-step-target="${id}" data-step-dir="-1" aria-label="Decrease ${label}">-</button>
            <span class="control-readout" id="ro-${id}">${formatted}${unit ? ' ' + unit : ''}</span>
            <button type="button" class="vernier-step" data-step-target="${id}" data-step-dir="1" aria-label="Increase ${label}">+</button>
          </span>
        </div>
        <input type="range" class="tactile-range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" />
      </div>
    `;
  }

  _bindSlider(id, min, max, step, unit, onChange) {
    const input = document.getElementById(id);
    const readout = document.getElementById(`ro-${id}`);
    if (!input) return;

    const apply = (rawVal) => {
      const clamped = Math.max(min, Math.min(max, +Number(rawVal).toFixed(4)));
      input.value = clamped;
      const formatted = step < 0.1 ? clamped.toFixed(2) : step < 1 ? clamped.toFixed(1) : clamped;
      if (readout) readout.textContent = `${formatted}${unit ? ' ' + unit : ''}`;
      onChange(clamped);
      this._refreshSimulation(true);
    };

    input.addEventListener('input', () => apply(input.value));
    document.querySelectorAll(`[data-step-target="${id}"]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.stepDir);
        apply(Number(input.value) + dir * step);
      });
    });
  }

  _renderControlsTab() {
    const mount = document.getElementById('dynamic-controls-mount');
    if (!mount) return;
    const modId = this.activeModuleId;

    if (modId === 'titration') {
      const st = this.state.titration;
      mount.innerHTML = `
        <div class="preset-row">
          <button type="button" class="btn btn-outline btn-sm ${st.mode === 'strong_acid_strong_base' ? 'btn-primary' : ''}" data-tit-mode="strong_acid_strong_base">HCl + NaOH</button>
          <button type="button" class="btn btn-outline btn-sm ${st.mode === 'weak_acid_strong_base' ? 'btn-primary' : ''}" data-tit-mode="weak_acid_strong_base">CH3COOH + NaOH</button>
          <button type="button" class="btn btn-outline btn-sm ${st.mode === 'strong_acid_weak_base' ? 'btn-primary' : ''}" data-tit-mode="strong_acid_weak_base">HCl + NH4OH</button>
        </div>
        <div class="preset-row">
          <button type="button" class="btn btn-outline btn-sm ${st.indicator === 'phenolphthalein' ? 'btn-primary' : ''}" data-ind="phenolphthalein">Phenolphthalein</button>
          <button type="button" class="btn btn-outline btn-sm ${st.indicator === 'methylOrange' ? 'btn-primary' : ''}" data-ind="methylOrange">Methyl Orange</button>
          <button type="button" class="btn btn-outline btn-sm ${st.indicator === 'bromothymolBlue' ? 'btn-primary' : ''}" data-ind="bromothymolBlue">Bromothymol</button>
        </div>
        ${this._sliderHTML({ id: 'tit-vadded', label: 'Burette Titrant Added (V_t)', val: st.vAdded, min: 0, max: 50, step: 0.05, unit: 'mL' })}
        ${this._sliderHTML({ id: 'tit-ca', label: 'Analyte Molarity (C_a)', val: st.cAnalyte, min: 0.05, max: 0.25, step: 0.01, unit: 'M' })}
        <div class="action-bar">
          <button type="button" class="btn btn-action btn-sm" id="btn-drop-005">+0.05 mL Drop</button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-drop-100">+1.00 mL Stream</button>
        </div>
      `;

      mount.querySelectorAll('[data-tit-mode]').forEach((b) => {
        b.addEventListener('click', () => {
          st.mode = b.dataset.titMode;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      mount.querySelectorAll('[data-ind]').forEach((b) => {
        b.addEventListener('click', () => {
          st.indicator = b.dataset.ind;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      this._bindSlider('tit-vadded', 0, 50, 0.05, 'mL', (v) => {
        st.vAdded = v;
        this.sceneManager?.triggerDrop();
      });
      this._bindSlider('tit-ca', 0.05, 0.25, 0.01, 'M', (v) => {
        st.cAnalyte = v;
      });
      document.getElementById('btn-drop-005')?.addEventListener('click', () => {
        st.vAdded = Math.min(50, +(st.vAdded + 0.05).toFixed(2));
        this.sceneManager?.triggerDrop();
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
      document.getElementById('btn-drop-100')?.addEventListener('click', () => {
        st.vAdded = Math.min(50, +(st.vAdded + 1.0).toFixed(2));
        this.sceneManager?.triggerDrop();
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
    } else if (modId === 'qualitative') {
      const st = this.state.qualitative;
      const calc = this._computeActiveModule('qualitative');
      const saltKeys = Object.keys(QUALITATIVE_SALTS);

      mount.innerHTML = `
        <div class="preset-row">
          ${saltKeys
            .map(
              (k) => `
            <button type="button" class="btn btn-outline btn-sm ${!st.mysteryActive && st.saltKey === k ? 'btn-primary' : ''}" data-salt="${k}">
              ${k}
            </button>
          `
            )
            .join('')}
        </div>
        <div class="action-bar">
          <button type="button" class="btn ${st.cobaltGlass ? 'btn-primary' : 'btn-outline'} btn-sm" id="btn-cobalt-toggle">
            ${st.cobaltGlass ? 'Cobalt Glass: ON' : 'Toggle Cobalt Glass'}
          </button>
          <button type="button" class="btn ${st.mysteryActive ? 'btn-action' : 'btn-outline'} btn-sm" id="btn-mystery-salt">
            ${st.mysteryActive ? 'Mystery Salt Active' : 'Start Mystery Salt'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" id="btn-ferro-test">+ K4[Fe(CN)6] Test</button>
          <button type="button" class="btn btn-outline btn-sm" id="btn-anion-test">+ AgNO3 / BaCl2 Test</button>
        </div>
        <div class="reagent-card">
          <div><strong>Tube A (Cation Test):</strong> ${st.addedFerrocyanide ? calc.salt.ferrocyanidePpt : 'Awaiting reagent'}</div>
          <div style="margin-top:0.25rem;"><strong>Tube B (Anion Test):</strong> ${st.addedAnionReagent ? calc.salt.anionTest : 'Awaiting reagent'}</div>
        </div>
        ${
          st.mysteryActive
            ? `
          <div class="instrument-control">
            <div class="control-name" style="margin-bottom:0.4rem;">Identify Unknown Mystery Salt:</div>
            <div class="preset-row">
              ${saltKeys
                .map((k) => `<button type="button" class="btn btn-outline btn-sm" data-guess="${k}">${k}</button>`)
                .join('')}
            </div>
            ${st.mysteryFeedback ? `<div style="margin-top:0.4rem; font-size:0.78rem; color:var(--accent-primary); font-weight:600;">${st.mysteryFeedback}</div>` : ''}
          </div>
        `
            : ''
        }
      `;

      mount.querySelectorAll('[data-salt]').forEach((b) => {
        b.addEventListener('click', () => {
          st.mysteryActive = false;
          st.saltKey = b.dataset.salt;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      document.getElementById('btn-cobalt-toggle')?.addEventListener('click', () => {
        st.cobaltGlass = !st.cobaltGlass;
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
      document.getElementById('btn-ferro-test')?.addEventListener('click', () => {
        st.addedFerrocyanide = true;
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
      document.getElementById('btn-anion-test')?.addEventListener('click', () => {
        st.addedAnionReagent = true;
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
      document.getElementById('btn-mystery-salt')?.addEventListener('click', () => {
        const pool = saltKeys.filter((k) => k !== st.mysteryTargetKey);
        st.mysteryTargetKey = pool[Math.floor(Math.random() * pool.length)];
        st.mysteryActive = true;
        st.mysteryFeedback = 'Run flame + wet reagent tests above, then select formula below.';
        st.addedFerrocyanide = false;
        st.addedAnionReagent = false;
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
      mount.querySelectorAll('[data-guess]').forEach((b) => {
        b.addEventListener('click', () => {
          if (b.dataset.guess === st.mysteryTargetKey) {
            st.mysterySolved = true;
            st.mysteryFeedback = `Correct! Unknown salt confirmed as ${st.mysteryTargetKey}.`;
          } else {
            st.mysteryFeedback = `Not ${b.dataset.guess} — re-check Cobalt flame & Tube A/B precipitates.`;
          }
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
    } else if (modId === 'bohr') {
      const st = this.state.bohr;
      mount.innerHTML = `
        <div class="preset-row">
          <button type="button" class="btn btn-outline btn-sm" data-bohr="1,2,3">Balmer H-alpha (656 nm)</button>
          <button type="button" class="btn btn-outline btn-sm" data-bohr="1,2,4">Balmer H-beta (486 nm)</button>
          <button type="button" class="btn btn-outline btn-sm" data-bohr="1,1,2">Lyman UV (122 nm)</button>
          <button type="button" class="btn btn-outline btn-sm" data-bohr="2,1,2">He+ Ion (Z=2)</button>
        </div>
        ${this._sliderHTML({ id: 'bohr-n1', label: 'Lower Quantum Shell (n1)', val: st.n1, min: 1, max: 5, step: 1 })}
        ${this._sliderHTML({ id: 'bohr-n2', label: 'Upper Quantum Shell (n2)', val: st.n2, min: 2, max: 6, step: 1 })}
        ${this._sliderHTML({ id: 'bohr-z', label: 'Atomic Number Z (1=H, 2=He+, 3=Li2+)', val: st.atomicZ, min: 1, max: 3, step: 1 })}
        <button type="button" class="btn btn-action btn-sm" id="btn-emit-photon">Trigger Quantized Photon Jump</button>
      `;

      mount.querySelectorAll('[data-bohr]').forEach((b) => {
        b.addEventListener('click', () => {
          const [z, n1, n2] = b.dataset.bohr.split(',').map(Number);
          st.atomicZ = z;
          st.n1 = n1;
          st.n2 = n2;
          this.sceneManager?.triggerPhoton();
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      this._bindSlider('bohr-n1', 1, 5, 1, '', (v) => {
        st.n1 = v;
        if (st.n2 <= st.n1) st.n2 = st.n1 + 1;
        this.sceneManager?.triggerPhoton();
        this._renderControlsTab();
      });
      this._bindSlider('bohr-n2', 2, 6, 1, '', (v) => {
        st.n2 = Math.max(st.n1 + 1, v);
        this.sceneManager?.triggerPhoton();
      });
      this._bindSlider('bohr-z', 1, 3, 1, '', (v) => {
        st.atomicZ = v;
        this.sceneManager?.triggerPhoton();
      });
      document.getElementById('btn-emit-photon')?.addEventListener('click', () => {
        this.sceneManager?.triggerPhoton();
        this._refreshSimulation(true);
      });
    } else if (modId === 'vsepr') {
      const st = this.state.vsepr;
      mount.innerHTML = `
        <div class="preset-row">
          <button type="button" class="btn btn-outline btn-sm" data-vsepr="2,0">BeCl2 (180°)</button>
          <button type="button" class="btn btn-outline btn-sm" data-vsepr="3,0">BF3 (120°)</button>
          <button type="button" class="btn btn-outline btn-sm" data-vsepr="4,0">CH4 (109.5°)</button>
          <button type="button" class="btn btn-outline btn-sm" data-vsepr="3,1">NH3 (107°)</button>
          <button type="button" class="btn btn-outline btn-sm" data-vsepr="2,2">H2O (104.5°)</button>
          <button type="button" class="btn btn-outline btn-sm" data-vsepr="4,2">XeF4 (90°)</button>
        </div>
        ${this._sliderHTML({ id: 'vsepr-bp', label: 'Bonding Electron Pairs (BP)', val: st.bp, min: 2, max: 6, step: 1 })}
        ${this._sliderHTML({ id: 'vsepr-lp', label: 'Non-Bonding Lone Pairs (LP)', val: st.lp, min: 0, max: 3, step: 1 })}
      `;

      mount.querySelectorAll('[data-vsepr]').forEach((b) => {
        b.addEventListener('click', () => {
          const [bp, lp] = b.dataset.vsepr.split(',').map(Number);
          st.bp = bp;
          st.lp = lp;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      this._bindSlider('vsepr-bp', 2, 6, 1, '', (v) => {
        st.bp = v;
        if (st.bp + st.lp > 6) st.lp = 6 - st.bp;
        this._renderControlsTab();
      });
      this._bindSlider('vsepr-lp', 0, 3, 1, '', (v) => {
        st.lp = Math.min(v, 6 - st.bp);
        this._renderControlsTab();
      });
    } else if (modId === 'equilibrium') {
      const st = this.state.equilibrium;
      mount.innerHTML = `
        <div class="preset-row">
          <button type="button" class="btn btn-outline btn-sm" data-eq="450,200,1">Industrial Haber (450 °C, 200 atm)</button>
          <button type="button" class="btn btn-outline btn-sm" data-eq="340,350,1">High Compression (340 °C, 350 atm)</button>
        </div>
        ${this._sliderHTML({ id: 'eq-temp', label: 'Reactor Temperature (T)', val: st.tempC, min: 300, max: 650, step: 10, unit: '°C' })}
        ${this._sliderHTML({ id: 'eq-press', label: 'Total Gas Pressure (P)', val: st.pressureAtm, min: 50, max: 400, step: 10, unit: 'atm' })}
        <button type="button" class="btn ${st.catalyst ? 'btn-primary' : 'btn-outline'} btn-sm" id="btn-cat-toggle">
          ${st.catalyst ? 'Porous Fe + Mo Catalyst: ENABLED' : 'Porous Fe + Mo Catalyst: REMOVED'}
        </button>
      `;

      mount.querySelectorAll('[data-eq]').forEach((b) => {
        b.addEventListener('click', () => {
          const [t, p, c] = b.dataset.eq.split(',').map(Number);
          st.tempC = t;
          st.pressureAtm = p;
          st.catalyst = Boolean(c);
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      this._bindSlider('eq-temp', 300, 650, 10, '°C', (v) => { st.tempC = v; });
      this._bindSlider('eq-press', 50, 400, 10, 'atm', (v) => { st.pressureAtm = v; });
      document.getElementById('btn-cat-toggle')?.addEventListener('click', () => {
        st.catalyst = !st.catalyst;
        this._renderControlsTab();
        this._refreshSimulation(true);
      });
    } else if (modId === 'electrochem') {
      const st = this.state.electrochem;
      const metals = Object.keys(ELECTRODE_COUPLES);
      mount.innerHTML = `
        <div class="action-bar">
          <button type="button" class="btn ${st.mode === 'galvanic' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ec-mode="galvanic">Galvanic (Nernst EMF)</button>
          <button type="button" class="btn ${st.mode === 'faraday' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ec-mode="faraday">Faraday Electrolysis</button>
        </div>
        <div class="preset-row">
          <span style="font-size:0.74rem; color:var(--ink-muted); align-self:center;">Anode:</span>
          ${metals.map((m) => `<button type="button" class="btn btn-outline btn-sm ${st.anodeKey === m ? 'btn-primary' : ''}" data-anode="${m}">${m}</button>`).join('')}
        </div>
        <div class="preset-row">
          <span style="font-size:0.74rem; color:var(--ink-muted); align-self:center;">Cathode:</span>
          ${metals.map((m) => `<button type="button" class="btn btn-outline btn-sm ${st.cathodeKey === m ? 'btn-primary' : ''}" data-cathode="${m}">${m}</button>`).join('')}
        </div>
        ${
          st.mode === 'galvanic'
            ? `
          ${this._sliderHTML({ id: 'ec-canode', label: 'Anode Ion Molarity [M_a]', val: st.cAnode, min: 0.01, max: 2.0, step: 0.05, unit: 'M' })}
          ${this._sliderHTML({ id: 'ec-ccathode', label: 'Cathode Ion Molarity [M_c]', val: st.cCathode, min: 0.01, max: 2.0, step: 0.05, unit: 'M' })}
        `
            : `
          ${this._sliderHTML({ id: 'ec-amp', label: 'Electrolysis Current (I)', val: st.currentAmp, min: 0.5, max: 10.0, step: 0.5, unit: 'A' })}
          ${this._sliderHTML({ id: 'ec-time', label: 'Deposition Duration (t)', val: st.timeMin, min: 1.0, max: 30.0, step: 1.0, unit: 'min' })}
        `
        }
      `;

      mount.querySelectorAll('[data-ec-mode]').forEach((b) => {
        b.addEventListener('click', () => {
          st.mode = b.dataset.ecMode;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      mount.querySelectorAll('[data-anode]').forEach((b) => {
        b.addEventListener('click', () => {
          st.anodeKey = b.dataset.anode;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      mount.querySelectorAll('[data-cathode]').forEach((b) => {
        b.addEventListener('click', () => {
          st.cathodeKey = b.dataset.cathode;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      if (st.mode === 'galvanic') {
        this._bindSlider('ec-canode', 0.01, 2.0, 0.05, 'M', (v) => { st.cAnode = v; });
        this._bindSlider('ec-ccathode', 0.01, 2.0, 0.05, 'M', (v) => { st.cCathode = v; });
      } else {
        this._bindSlider('ec-amp', 0.5, 10.0, 0.5, 'A', (v) => { st.currentAmp = v; });
        this._bindSlider('ec-time', 1.0, 30.0, 1.0, 'min', (v) => { st.timeMin = v; });
      }
    } else if (modId === 'organic') {
      const st = this.state.organic;
      mount.innerHTML = `
        <div class="action-bar">
          <button type="button" class="btn ${st.submode === 'geometric' ? 'btn-primary' : 'btn-outline'} btn-sm" data-org-sub="geometric">Geometric (Cis/Trans)</button>
          <button type="button" class="btn ${st.submode === 'optical' ? 'btn-primary' : 'btn-outline'} btn-sm" data-org-sub="optical">Optical Polarimeter</button>
        </div>
        ${
          st.submode === 'geometric'
            ? `
          <div class="action-bar">
            <button type="button" class="btn ${st.configuration === 'cis' ? 'btn-action' : 'btn-outline'} btn-sm" data-cfg="cis">cis-1,2-dichloroethene</button>
            <button type="button" class="btn ${st.configuration === 'trans' ? 'btn-action' : 'btn-outline'} btn-sm" data-cfg="trans">trans-1,2-dichloroethene</button>
          </div>
          <div class="reagent-card">
            <strong>Pi-Bond Rigidity:</strong> Sideways 2p-2p overlap prevents room-temperature C=C rotation, isolating distinct cis (polar, mu = 1.90 D) and trans (non-polar, mu = 0.00 D) diastereomers.
          </div>
        `
            : `
          <div class="preset-row">
            <button type="button" class="btn btn-outline btn-sm" data-d="100">Pure (+)-d (100%)</button>
            <button type="button" class="btn btn-outline btn-sm" data-d="50">Racemic (+/-) 50:50</button>
            <button type="button" class="btn btn-outline btn-sm" data-d="0">Pure (-)-l (0%)</button>
          </div>
          ${this._sliderHTML({ id: 'org-d', label: '(+)-d Enantiomer Fraction', val: st.dPercent, min: 0, max: 100, step: 5, unit: '%' })}
          ${this._sliderHTML({ id: 'org-l', label: 'Polarimeter Tube Length (l)', val: st.tubeLengthDm, min: 0.5, max: 3.0, step: 0.1, unit: 'dm' })}
          ${this._sliderHTML({ id: 'org-c', label: 'Solution Concentration (c)', val: st.concGmL, min: 0.1, max: 1.0, step: 0.05, unit: 'g/mL' })}
        `
        }
      `;

      mount.querySelectorAll('[data-org-sub]').forEach((b) => {
        b.addEventListener('click', () => {
          st.submode = b.dataset.orgSub;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      mount.querySelectorAll('[data-cfg]').forEach((b) => {
        b.addEventListener('click', () => {
          st.configuration = b.dataset.cfg;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      mount.querySelectorAll('[data-d]').forEach((b) => {
        b.addEventListener('click', () => {
          st.dPercent = Number(b.dataset.d);
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      if (st.submode === 'optical') {
        this._bindSlider('org-d', 0, 100, 5, '%', (v) => { st.dPercent = v; });
        this._bindSlider('org-l', 0.5, 3.0, 0.1, 'dm', (v) => { st.tubeLengthDm = v; });
        this._bindSlider('org-c', 0.1, 1.0, 0.05, 'g/mL', (v) => { st.concGmL = v; });
      }
    } else if (modId === 'gaslaws') {
      const st = this.state.gaslaws;
      mount.innerHTML = `
        <div class="preset-row">
          <span style="font-size:0.74rem; color:var(--ink-muted); align-self:center;">Right Plug:</span>
          ${['HCl', 'HBr', 'HI']
            .map((g) => `<button type="button" class="btn btn-outline btn-sm ${st.acidGas === g ? 'btn-primary' : ''}" data-acid="${g}">${g}</button>`)
            .join('')}
        </div>
        <button type="button" class="btn btn-action btn-sm" id="btn-release-plugs">
          Release NH3 + ${st.acidGas} Cotton Plugs
        </button>
        ${this._sliderHTML({ id: 'gas-len', label: 'Glass Tube Length (L)', val: st.tubeLengthCm, min: 40, max: 100, step: 5, unit: 'cm' })}
        <div class="preset-row">
          <span style="font-size:0.74rem; color:var(--ink-muted); align-self:center;">Amagat Gas:</span>
          ${['H2', 'N2', 'CH4', 'CO2']
            .map((g) => `<button type="button" class="btn btn-outline btn-sm ${st.amagatGas === g ? 'btn-primary' : ''}" data-amagat="${g}">${g}</button>`)
            .join('')}
        </div>
        ${this._sliderHTML({ id: 'gas-p', label: 'Amagat Pressure (P)', val: st.pressureAtm, min: 1, max: 400, step: 5, unit: 'atm' })}
      `;

      mount.querySelectorAll('[data-acid]').forEach((b) => {
        b.addEventListener('click', () => {
          st.acidGas = b.dataset.acid;
          st.progress = 1.0;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      mount.querySelectorAll('[data-amagat]').forEach((b) => {
        b.addEventListener('click', () => {
          st.amagatGas = b.dataset.amagat;
          this._renderControlsTab();
          this._refreshSimulation(true);
        });
      });
      document.getElementById('btn-release-plugs')?.addEventListener('click', () => {
        st.progress = 0.04;
        st.running = true;
        this._refreshSimulation(true);
      });
      this._bindSlider('gas-len', 40, 100, 5, 'cm', (v) => { st.tubeLengthCm = v; });
      this._bindSlider('gas-p', 1, 400, 5, 'atm', (v) => { st.pressureAtm = v; });
    }
  }

  _renderStampsTab() {
    const mount = document.getElementById('dynamic-stamps-mount');
    const mod = CURRICULUM_MODULES.find((m) => m.id === this.activeModuleId);
    if (!mount || !mod) return;

    mount.innerHTML = mod.challenges
      .map((ch, idx) => {
        const done = Boolean(this.progress.stamps[ch.id]);
        return `
          <div class="challenge-plate ${done ? 'verified' : ''}">
            <div class="challenge-head">
              <span>STAMP 0${idx + 1}</span>
              <strong>${done ? 'VERIFIED' : 'PENDING'}</strong>
            </div>
            <div class="challenge-title">${ch.title}</div>
            <div class="challenge-desc">${ch.desc}</div>
            <div class="challenge-hint"><strong>Method:</strong> ${ch.hint}</div>
          </div>
        `;
      })
      .join('');
  }

  _renderTheoryTab() {
    const mount = document.getElementById('dynamic-theory-mount');
    const mod = CURRICULUM_MODULES.find((m) => m.id === this.activeModuleId);
    if (!mount || !mod) return;

    const savedAns = this.progress.quiz[mod.id];
    mount.innerHTML = `
      ${mod.guide
        .map(
          (g) => `
        <div class="guide-note">
          <h4>${g.heading}</h4>
          <p>${g.body}</p>
        </div>
      `
        )
        .join('')}

      <table class="glossary-table" style="margin:0.85rem 0 1.1rem;">
        <thead>
          <tr><th>Symbol</th><th>Physical Quantity</th><th>Unit</th></tr>
        </thead>
        <tbody>
          ${mod.glossary.map((gl) => `<tr><td><code>${gl.sym}</code></td><td>${gl.name}</td><td>${gl.unit}</td></tr>`).join('')}
        </tbody>
      </table>

      <div class="quiz-box">
        <span class="eyebrow-label" style="margin-bottom:0.35rem;">Board Exam Check</span>
        <p style="font-size:0.86rem; font-weight:600;">${mod.quiz.question}</p>
        ${mod.quiz.options
          .map((opt, idx) => {
            let cls = '';
            if (savedAns !== undefined) {
              if (idx === mod.quiz.answerIdx) cls = 'correct';
              else if (idx === savedAns) cls = 'wrong';
            }
            return `<button type="button" class="quiz-option ${cls}" data-qidx="${idx}">${String.fromCharCode(65 + idx)}. ${opt}</button>`;
          })
          .join('')}
        ${
          savedAns !== undefined
            ? `<p style="margin-top:0.6rem; font-size:0.79rem; color:var(--ink-secondary);"><strong>Explanation:</strong> ${mod.quiz.explanation}</p>`
            : ''
        }
      </div>
    `;

    mount.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.progress.quiz[mod.id] = Number(btn.dataset.qidx);
        this._saveProgress();
        this._renderTheoryTab();
      });
    });
  }

  /* =========================================================================
     OVERVIEW CATALOGUE, PRACTICAL REFERENCE & FULL ASSESSMENT
     ========================================================================= */
  _renderOverviewCatalogue() {
    const list = document.getElementById('overview-apparatus-list');
    if (!list) return;

    list.innerHTML = CURRICULUM_MODULES.map((m) => {
      const doneCount = m.challenges.filter((c) => this.progress.stamps[c.id]).length;
      return `
        <div class="apparatus-row" role="listitem" data-open-bench="${m.id}">
          <div class="row-num">${m.num}</div>
          <div class="row-title-group">
            <h3>${m.title}</h3>
            <span class="row-discipline">${m.nctbTag}</span>
          </div>
          <div class="row-summary">${m.summary}</div>
          <div class="row-formula">${m.equationText}</div>
          <div class="row-cta">
            <span class="stamp-badge ${doneCount === 3 ? 'complete' : ''}">${doneCount}/3 Stamps</span>
            <span class="btn btn-outline btn-sm">Open</span>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('[data-open-bench]').forEach((row) => {
      row.addEventListener('click', () => {
        this.activeModuleId = row.dataset.openBench;
        this.navigate('studio');
      });
    });
  }

  _renderPracticalReference() {
    const boardBody = document.getElementById('practical-board-tbody');
    if (boardBody) {
      boardBody.innerHTML = PRACTICAL_MATRIX_ROWS.map(
        (r) => `
          <tr>
            <td><span class="severity-tag">${r.code}</span></td>
            <td><strong>${r.paper}</strong></td>
            <td>${r.title}</td>
            <td><strong>${r.marks}</strong></td>
            <td>${r.reagents}</td>
            <td>${r.criterion}</td>
          </tr>
        `
      ).join('');
    }

    const saltBody = document.getElementById('salt-reference-tbody');
    if (saltBody) {
      saltBody.innerHTML = Object.values(QUALITATIVE_SALTS)
        .map(
          (s) => `
          <tr>
            <td><strong>${s.formula}</strong><br/><span style="font-size:0.75rem; color:var(--ink-muted);">${s.name}</span></td>
            <td><code>${s.cation}</code> / <code>${s.anion}</code></td>
            <td>${s.nakedFlameName} (${s.wavelengthNm} nm)</td>
            <td>${s.cobaltFlameName}</td>
            <td>${s.ferrocyanidePpt}</td>
            <td>${s.anionTest}</td>
          </tr>
        `
        )
        .join('');
    }

    const monoMount = document.getElementById('monograph-list-mount');
    if (monoMount) {
      monoMount.innerHTML = CURRICULUM_MODULES.map(
        (m) => `
          <article class="monograph-entry">
            <div>
              <span class="eyebrow-label">${m.num} · ${m.nctbTag}</span>
              <h4 style="font-family:var(--font-serif); font-size:1.2rem; margin-bottom:0.45rem;">${m.title}</h4>
              <div class="row-formula" style="display:inline-block; margin-bottom:0.7rem;">${m.equationText}</div>
              <div>
                <button type="button" class="btn btn-primary btn-sm" data-mono-open="${m.id}">Open ${m.num} Workbench</button>
              </div>
            </div>
            <div>
              ${m.guide
                .map(
                  (g) => `
                <div class="guide-note">
                  <h4>${g.heading}</h4>
                  <p>${g.body}</p>
                </div>
              `
                )
                .join('')}
            </div>
          </article>
        `
      ).join('');

      monoMount.querySelectorAll('[data-mono-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.activeModuleId = btn.dataset.monoOpen;
          this.navigate('studio');
        });
      });
    }
  }

  _renderFullAssessment() {
    const mount = document.getElementById('full-assessment-mount');
    if (!mount) return;

    mount.innerHTML = CURRICULUM_MODULES.map((mod) => {
      const savedAns = this.progress.quiz[mod.id];
      return `
        <div class="quiz-box" style="background:var(--bg-plate);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
            <span class="eyebrow-label" style="margin:0;">${mod.num} · ${mod.shortTitle}</span>
            <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--ink-muted);">${mod.nctbTag}</span>
          </div>
          <p style="font-size:0.9rem; font-weight:600; min-height:3.2em;">${mod.quiz.question}</p>
          ${mod.quiz.options
            .map((opt, idx) => {
              let cls = '';
              if (savedAns !== undefined) {
                if (idx === mod.quiz.answerIdx) cls = 'correct';
                else if (idx === savedAns) cls = 'wrong';
              }
              return `<button type="button" class="quiz-option ${cls}" data-full-mod="${mod.id}" data-full-idx="${idx}">${String.fromCharCode(65 + idx)}. ${opt}</button>`;
            })
            .join('')}
          ${
            savedAns !== undefined
              ? `<p style="margin-top:0.65rem; font-size:0.8rem; color:var(--ink-secondary); border-top:1px solid var(--border-subtle); padding-top:0.5rem;"><strong>Board Rationale:</strong> ${mod.quiz.explanation}</p>`
              : ''
          }
        </div>
      `;
    }).join('');

    mount.querySelectorAll('[data-full-mod]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.progress.quiz[btn.dataset.fullMod] = Number(btn.dataset.fullIdx);
        this._saveProgress();
        this._renderFullAssessment();
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.chemiaApp = new ChemiaAtelierApp();
});
