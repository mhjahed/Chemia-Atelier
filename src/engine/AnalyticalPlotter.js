import {
  computeTitrationPh,
  INDICATORS,
  computeHaberEquilibrium,
  computeGrahamDiffusion
} from '../chemistry/calculations.js';

/**
 * High-DPI 2D Scientific Analytical Plotter for Chemia Atelier.
 * Renders calibrated titration curves, atomic spectra, VSEPR angle diagrams,
 * Haber yield isotherms, Nernst/Faraday curves, polarimeter dials, and Amagat Z plots.
 */
export class AnalyticalPlotter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(moduleId, state, calc) {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(250, Math.floor(rect.width || 340));
    const h = Math.max(145, Math.floor(rect.height || 162));

    if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Warm archival drafting surface
    ctx.fillStyle = '#FAF9F5';
    ctx.fillRect(0, 0, w, h);

    // Fine 24px grid
    ctx.strokeStyle = '#EAE6DC';
    ctx.lineWidth = 1;
    for (let x = 36; x < w - 10; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, h - 22);
      ctx.stroke();
    }
    for (let y = 22; y < h - 20; y += 26) {
      ctx.beginPath();
      ctx.moveTo(36, y);
      ctx.lineTo(w - 12, y);
      ctx.stroke();
    }

    const pad = { l: 38, r: 14, t: 25, b: moduleId === 'vsepr' ? 31 : 24 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;

    if (moduleId === 'titration') {
      this._drawTitration(ctx, w, h, pad, pw, ph, state.titration, calc);
    } else if (moduleId === 'qualitative') {
      this._drawQualitativeSpectrum(ctx, w, h, pad, pw, ph, state.qualitative, calc);
    } else if (moduleId === 'bohr') {
      this._drawBohrSpectrum(ctx, w, h, pad, pw, ph, state.bohr, calc);
    } else if (moduleId === 'vsepr') {
      this._drawVseprAngles(ctx, w, h, pad, pw, ph, state.vsepr, calc);
    } else if (moduleId === 'equilibrium') {
      this._drawHaberIsotherm(ctx, w, h, pad, pw, ph, state.equilibrium, calc);
    } else if (moduleId === 'electrochem') {
      this._drawElectrochem(ctx, w, h, pad, pw, ph, state.electrochem, calc);
    } else if (moduleId === 'organic') {
      this._drawOrganic(ctx, w, h, pad, pw, ph, state.organic, calc);
    } else if (moduleId === 'gaslaws') {
      this._drawAmagat(ctx, w, h, pad, pw, ph, state.gaslaws, calc);
    }

    ctx.restore();
  }

  _drawAxes(ctx, w, h, pad, title, xLabel, yLabel) {
    const compact = w < 380;
    ctx.strokeStyle = '#6C7480';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, h - pad.b);
    ctx.lineTo(w - pad.r, h - pad.b);
    ctx.stroke();

    ctx.fillStyle = '#14181F';
    ctx.font = compact
      ? '600 9.5px -apple-system, BlinkMacSystemFont, sans-serif'
      : '600 10.5px -apple-system, BlinkMacSystemFont, sans-serif';
    const maxTitleChars = compact ? 34 : 52;
    const safeTitle = title.length > maxTitleChars ? `${title.slice(0, maxTitleChars - 1)}…` : title;
    ctx.fillText(safeTitle, 8, 14);

    ctx.fillStyle = '#6C7480';
    ctx.font = compact ? '9px monospace' : '9.5px monospace';
    ctx.fillText(xLabel, w - pad.r - ctx.measureText(xLabel).width, h - 6);

    ctx.save();
    ctx.translate(11, h - pad.b - 6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  _drawTitration(ctx, w, h, pad, pw, ph, st, calc) {
    const ind = INDICATORS[st.indicator] || INDICATORS.phenolphthalein;
    this._drawAxes(ctx, w, h, pad, `pH Curve (${ind.name})`, 'V_t (0-50 mL)', 'pH (0-14)');

    // Shaded active indicator pH window
    const yHigh = h - pad.b - (ind.range[1] / 14) * ph;
    const yLow = h - pad.b - (ind.range[0] / 14) * ph;
    ctx.fillStyle = 'rgba(19, 78, 74, 0.11)';
    ctx.fillRect(pad.l, yHigh, pw, Math.max(3, yLow - yHigh));

    // Equivalence vertical dashed line
    if (calc.vEq <= 50) {
      const xEq = pad.l + (calc.vEq / 50) * pw;
      ctx.strokeStyle = '#B83A2D';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xEq, pad.t);
      ctx.lineTo(xEq, h - pad.b);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Plot titration curve
    ctx.strokeStyle = '#134E4A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const v = (i / 100) * 50;
      const pt = computeTitrationPh({
        mode: st.mode,
        cAnalyte: st.cAnalyte,
        vAnalyte: st.vAnalyte,
        cTitrant: st.cTitrant,
        vAdded: v
      });
      const px = pad.l + (v / 50) * pw;
      const py = h - pad.b - (pt.pH / 14) * ph;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Live operating dot
    const cx = pad.l + (Math.min(50, st.vAdded) / 50) * pw;
    const cy = h - pad.b - (calc.pH / 14) * ph;
    ctx.fillStyle = '#B83A2D';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawQualitativeSpectrum(ctx, w, h, pad, pw, ph, st, calc) {
    this._drawAxes(ctx, w, h, pad, `Flame Emission (${st.cobaltGlass ? 'Cobalt Filter ON' : 'Naked Eye'})`, '380-780 nm', 'I(lambda)');

    // Soft spectral band background
    const bandY = pad.t + 10;
    const bandH = ph - 18;
    ctx.fillStyle = '#191D24';
    ctx.fillRect(pad.l + 4, bandY, pw - 8, bandH);

    // If cobalt glass active, draw blue transmission window & 589 nm block zone
    if (st.cobaltGlass) {
      const xBlock1 = pad.l + 4 + ((565 - 380) / 400) * (pw - 8);
      const xBlock2 = pad.l + 4 + ((615 - 380) / 400) * (pw - 8);
      ctx.fillStyle = 'rgba(30, 88, 190, 0.25)';
      ctx.fillRect(pad.l + 4, bandY, pw - 8, bandH);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(xBlock1, bandY, xBlock2 - xBlock1, bandH);
    }

    const salt = calc.salt;
    const wl = Math.min(770, Math.max(390, salt.wavelengthNm));
    const lx = pad.l + 4 + ((wl - 380) / 400) * (pw - 8);
    const attenuated = st.cobaltGlass && salt.key === 'NaCl';

    if (!attenuated) {
      ctx.strokeStyle = st.cobaltGlass ? salt.cobaltFlameHex : salt.nakedFlameHex;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lx, bandY + 4);
      ctx.lineTo(lx, bandY + bandH - 4);
      ctx.stroke();

      // Secondary K+ violet doublet at 404.4 nm
      if (salt.key === 'KCl') {
        const lx2 = pad.l + 4 + ((404.4 - 380) / 400) * (pw - 8);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx2, bandY + 4);
        ctx.lineTo(lx2, bandY + bandH - 4);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#FAF9F5';
    ctx.font = '10px monospace';
    ctx.fillText(
      attenuated ? '589 nm ABSORBED BY COBALT GLASS' : `Peak: ${salt.wavelengthNm} nm`,
      pad.l + 10,
      bandY + 16
    );
  }

  _drawBohrSpectrum(ctx, w, h, pad, pw, ph, st, calc) {
    this._drawAxes(ctx, w, h, pad, `Rydberg Spectrum (${calc.series} · ${calc.wavelengthNm.toFixed(1)} nm)`, 'UV | Vis | IR', 'n2 -> n1');

    const bandY = pad.t + 8;
    const bandH = ph - 16;
    ctx.fillStyle = '#181C24';
    ctx.fillRect(pad.l + 4, bandY, pw - 8, bandH);

    // Draw reference H Balmer lines + active transition line mapped logarithmically 80 -> 2000 nm
    const mapNm = (nm) => {
      const clamped = Math.max(80, Math.min(2000, nm));
      const t = (Math.log10(clamped) - Math.log10(80)) / (Math.log10(2000) - Math.log10(80));
      return pad.l + 6 + t * (pw - 12);
    };

    const refLines = [
      { nm: 121.6, col: 'rgba(139, 92, 246, 0.4)' },
      { nm: 410.3, col: 'rgba(124, 58, 237, 0.45)' },
      { nm: 434.2, col: 'rgba(79, 70, 229, 0.45)' },
      { nm: 486.3, col: 'rgba(6, 182, 212, 0.45)' },
      { nm: 656.5, col: 'rgba(225, 29, 72, 0.45)' },
      { nm: 1875.6, col: 'rgba(180, 83, 9, 0.4)' }
    ];
    for (const r of refLines) {
      const rx = mapNm(r.nm);
      ctx.strokeStyle = r.col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, bandY + 18);
      ctx.lineTo(rx, bandY + bandH - 4);
      ctx.stroke();
    }

    // Active line
    const ax = mapNm(calc.wavelengthNm);
    ctx.strokeStyle = calc.photonHex;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(ax, bandY + 4);
    ctx.lineTo(ax, bandY + bandH - 4);
    ctx.stroke();

    ctx.fillStyle = '#FAF9F5';
    ctx.font = '9.5px monospace';
    ctx.fillText(`Delta E = ${calc.energyEv.toFixed(2)} eV`, pad.l + 10, bandY + 14);
  }

  _drawVseprAngles(ctx, w, h, pad, pw, ph, st, calc) {
    this._drawAxes(ctx, w, h, pad, `${calc.geometry} (${calc.hybridization} · ${calc.bondAngle}°)`, '', 'Angle');

    const refs = [
      { label: 'BeCl2', angle: 180 },
      { label: 'BF3', angle: 120 },
      { label: 'CH4', angle: 109.5 },
      { label: 'NH3', angle: 107.0 },
      { label: 'H2O', angle: 104.5 },
      { label: 'SF6', angle: 90.0 }
    ];

    const colW = pw / refs.length;
    refs.forEach((r, idx) => {
      const bh = (r.angle / 185) * (ph - 12);
      const bx = pad.l + idx * colW + colW * 0.2;
      const by = h - pad.b - bh;
      const isMatch = Math.abs(r.angle - calc.bondAngle) < 0.6;
      ctx.fillStyle = isMatch ? '#134E4A' : '#CFCAC0';
      ctx.fillRect(bx, by, colW * 0.6, bh);

      ctx.fillStyle = '#14181F';
      ctx.font = '8.5px monospace';
      ctx.fillText(r.label, bx - 1, h - pad.b + 11);
    });
  }

  _drawHaberIsotherm(ctx, w, h, pad, pw, ph, st, calc) {
    this._drawAxes(ctx, w, h, pad, `Haber Yield at ${st.tempC} °C (${calc.yieldPct.toFixed(1)}% NH3)`, 'P (50-400 atm)', '% NH3');

    // Reference 450 C curve
    ctx.strokeStyle = '#B8B2A6';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const p = 50 + (i / 50) * 350;
      const r = computeHaberEquilibrium({ tempC: 450, pressureAtm: p, catalyst: true });
      const px = pad.l + (i / 50) * pw;
      const py = h - pad.b - (r.yieldPct / 100) * ph;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Active temperature isotherm
    ctx.strokeStyle = '#134E4A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const p = 50 + (i / 50) * 350;
      const r = computeHaberEquilibrium({ tempC: st.tempC, pressureAtm: p, catalyst: st.catalyst });
      const px = pad.l + (i / 50) * pw;
      const py = h - pad.b - (r.yieldPct / 100) * ph;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const cx = pad.l + ((st.pressureAtm - 50) / 350) * pw;
    const cy = h - pad.b - (calc.yieldPct / 100) * ph;
    ctx.fillStyle = '#B83A2D';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawElectrochem(ctx, w, h, pad, pw, ph, st, calc) {
    if (st.mode === 'galvanic') {
      this._drawAxes(ctx, w, h, pad, `Nernst EMF: E = ${calc.eCell.toFixed(3)} V`, 'log10(Q) [-3..+3]', 'E (V)');
      const midE = calc.e0Cell;
      const minE = midE - 0.16;
      const maxE = midE + 0.16;

      ctx.strokeStyle = '#134E4A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const logQ = -3 + (i / 40) * 6;
        const eVal = midE - (0.05916 / calc.nElectrons) * logQ;
        const px = pad.l + (i / 40) * pw;
        const py = h - pad.b - ((eVal - minE) / (maxE - minE)) * ph;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const curLogQ = Math.max(-3, Math.min(3, Math.log10(calc.qRatio)));
      const cx = pad.l + ((curLogQ + 3) / 6) * pw;
      const cy = h - pad.b - ((calc.eCell - minE) / (maxE - minE)) * ph;
      ctx.fillStyle = '#B83A2D';
      ctx.beginPath();
      ctx.arc(cx, Math.max(pad.t + 4, Math.min(h - pad.b - 4, cy)), 4.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      this._drawAxes(ctx, w, h, pad, `Faraday Deposition: W = ${calc.depositedMassG.toFixed(3)} g`, 'Time (0-30 min)', 'Mass (g)');
      const maxMass = Math.max(1.5, ((107.87 * st.currentAmp * 1800) / 96485) * 1.05);
      const metals = [
        { m: 107.87, n: 1, col: '#94A3B8', name: 'Ag' },
        { m: 63.546, n: 2, col: '#B83A2D', name: 'Cu' }
      ];
      for (const met of metals) {
        ctx.strokeStyle = met.col;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const mass = (met.m * st.currentAmp * (i * 60)) / (met.n * 96485);
          const px = pad.l + (i / 30) * pw;
          const py = h - pad.b - (mass / maxMass) * ph;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      const cx = pad.l + (st.timeMin / 30) * pw;
      const cy = h - pad.b - (calc.depositedMassG / maxMass) * ph;
      ctx.fillStyle = '#134E4A';
      ctx.beginPath();
      ctx.arc(cx, Math.max(pad.t + 4, cy), 4.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawOrganic(ctx, w, h, pad, pw, ph, st, calc) {
    const cx = w * 0.52;
    const cy = pad.t + ph * 0.52;
    const r = Math.min(pw, ph) * 0.42;

    if (st.submode === 'geometric') {
      this._drawAxes(ctx, w, h, pad, `${calc.isomerName} (mu = ${calc.dipoleDebye.toFixed(2)} D)`, 'Dipole Vector', 'C=C');
      ctx.strokeStyle = '#14181F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 3);
      ctx.lineTo(cx + 28, cy - 3);
      ctx.moveTo(cx - 28, cy + 3);
      ctx.lineTo(cx + 28, cy + 3);
      ctx.stroke();

      // Left C-Cl vector (always up-left)
      ctx.strokeStyle = '#1F6E4A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy);
      ctx.lineTo(cx - 50, cy - 28);
      ctx.stroke();

      // Right C-Cl vector (up-right for cis, down-right for trans)
      const ry = st.configuration === 'cis' ? cy - 28 : cy + 28;
      ctx.beginPath();
      ctx.moveTo(cx + 28, cy);
      ctx.lineTo(cx + 50, ry);
      ctx.stroke();

      if (calc.dipoleDebye > 0) {
        ctx.strokeStyle = '#B83A2D';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 16);
        ctx.lineTo(cx, cy - 34);
        ctx.stroke();
      }
    } else {
      this._drawAxes(ctx, w, h, pad, `Polarimeter Dial (${calc.observedRotationDeg >= 0 ? '+' : ''}${calc.observedRotationDeg.toFixed(2)}°)`, 'Analyzer', 'alpha');
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Reference vertical axis
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotated polarization plane (amplified x4 visually for small angles, labeled exact)
      const rad = ((calc.observedRotationDeg * 4) * Math.PI) / 180;
      ctx.strokeStyle = '#B83A2D';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx - Math.sin(rad) * r, cy + Math.cos(rad) * r);
      ctx.lineTo(cx + Math.sin(rad) * r, cy - Math.cos(rad) * r);
      ctx.stroke();
    }
  }

  _drawAmagat(ctx, w, h, pad, pw, ph, st, calc) {
    this._drawAxes(ctx, w, h, pad, `Amagat Curves: Z(${st.amagatGas}) = ${calc.zFactor.toFixed(3)}`, 'P (1-400 atm)', 'Z');

    // Ideal Z = 1.00 baseline (mapped Z in [0.6, 1.5])
    const mapZ = (z) => h - pad.b - ((Math.max(0.6, Math.min(1.5, z)) - 0.6) / 0.9) * ph;
    ctx.strokeStyle = '#94A3B8';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.l, mapZ(1.0));
    ctx.lineTo(w - pad.r, mapZ(1.0));
    ctx.stroke();
    ctx.setLineDash([]);

    const species = [
      { key: 'H2', col: '#0284C7' },
      { key: 'N2', col: '#64748B' },
      { key: 'CH4', col: '#D97706' },
      { key: 'CO2', col: '#134E4A' }
    ];

    for (const sp of species) {
      ctx.strokeStyle = sp.col;
      ctx.lineWidth = sp.key === st.amagatGas ? 2.6 : 1.25;
      ctx.beginPath();
      for (let i = 0; i <= 45; i++) {
        const p = 1 + (i / 45) * 399;
        const r = computeGrahamDiffusion({
          gas1Key: 'NH3',
          gas2Key: st.acidGas,
          tubeLengthCm: st.tubeLengthCm,
          pressureAtm: p,
          tempK: st.tempK,
          amagatGas: sp.key
        });
        const px = pad.l + (i / 45) * pw;
        const py = mapZ(r.zFactor);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    const cx = pad.l + ((st.pressureAtm - 1) / 399) * pw;
    const cy = mapZ(calc.zFactor);
    ctx.fillStyle = '#B83A2D';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
