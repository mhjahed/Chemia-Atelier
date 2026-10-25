/**
 * Calibrated Chemistry Computation Core (Chemia Atelier v1.0)
 * Exact physical, analytical, inorganic, electro- and organic chemistry models
 * aligned with Bangladesh NCTB SSC (Class 9-10) & HSC (Class 11-12, 1st & 2nd Paper).
 */

export const CHEM_CONSTANTS = {
  R_GAS: 8.3144626,         // J/(mol·K)
  FARADAY: 96485.332,       // C/mol
  RYDBERG_M: 1.0967758e7,   // m^-1 (Hydrogen Rydberg constant)
  PLANCK_H: 6.62607015e-34, // J·s
  SPEED_C: 2.99792458e8,    // m/s
  AVOGADRO: 6.02214076e23
};

// ============================================================================
// MODULE 01: ACID-BASE TITRATION & EQUIVALENCE CURVE ENGINE
// ============================================================================
export const INDICATORS = {
  phenolphthalein: {
    name: 'Phenolphthalein (pH 8.2 – 10.0)',
    lowPh: 8.2,
    highPh: 10.0,
    range: [8.2, 10.0],
    acidHex: '#DCEAF7',   // Water-clear glass tint
    midHex: '#F79AC0',    // Pale rose endpoint tint
    baseHex: '#D61F69'    // Vivid magenta-pink
  },
  methylOrange: {
    name: 'Methyl Orange (pH 3.1 – 4.4)',
    lowPh: 3.1,
    highPh: 4.4,
    range: [3.1, 4.4],
    acidHex: '#D93829',   // Coral red
    midHex: '#F58A27',    // Endpoint peach-orange
    baseHex: '#F2C94C'    // Clear yellow
  },
  bromothymolBlue: {
    name: 'Bromothymol Blue (pH 6.0 – 7.6)',
    lowPh: 6.0,
    highPh: 7.6,
    range: [6.0, 7.6],
    acidHex: '#ECC94B',   // Yellow
    midHex: '#2F9E66',    // Neutral emerald green
    baseHex: '#1D63B8'    // Alkaline blue
  }
};
INDICATORS['methyl-orange'] = INDICATORS.methylOrange;
INDICATORS.bromothymol = INDICATORS.bromothymolBlue;

function lerpHex(hexA, hexB, t) {
  const clampT = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) * (1 - clampT) + ((b >> 16) & 255) * clampT);
  const g = Math.round(((a >> 8) & 255) * (1 - clampT) + ((b >> 8) & 255) * clampT);
  const bl = Math.round((a & 255) * (1 - clampT) + (b & 255) * clampT);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

export function getIndicatorColorHex(ph, indicatorKey = 'phenolphthalein') {
  const ind = INDICATORS[indicatorKey] || INDICATORS.phenolphthalein;
  if (ph <= ind.lowPh) return ind.acidHex;
  if (ph >= ind.highPh) return ind.baseHex;
  const ratio = (ph - ind.lowPh) / (ind.highPh - ind.lowPh);
  return ratio < 0.5
    ? lerpHex(ind.acidHex, ind.midHex, ratio * 2)
    : lerpHex(ind.midHex, ind.baseHex, (ratio - 0.5) * 2);
}

export function computeTitrationPh(params = {}) {
  const modeKey = params.mode || params.systemKey || 'strong_acid_strong_base';
  const cAnalyte = params.cAnalyte ?? params.analyteMolarity ?? 0.10;
  const vA = Math.max(1, params.vAnalyte ?? params.analyteVolMl ?? 25.0);
  const cTitrant = params.cTitrant ?? params.titrantMolarity ?? 0.10;
  const vT = Math.max(0, params.vAdded ?? params.addedVolMl ?? 0.0);

  const totalVol = vA + vT;
  const molesAnalyte = (cAnalyte * vA) / 1000;
  const molesTitrant = (cTitrant * vT) / 1000;
  const eqVolMl = (cAnalyte * vA) / Math.max(0.001, cTitrant);

  let ph = 7.0;

  if (modeKey === 'strong_acid_strong_base') {
    // Analyte: HCl in flask, Titrant: NaOH from burette (classic rising pH curve 1 -> 13)
    const diff = molesAnalyte - molesTitrant;
    if (Math.abs(diff) < 1e-9) {
      ph = 7.0;
    } else if (diff > 0) {
      ph = -Math.log10(diff / (totalVol / 1000));
    } else {
      ph = 14 + Math.log10(-diff / (totalVol / 1000));
    }
  } else if (modeKey === 'strong-strong') {
    // Titrant HCl into NaOH analyte
    const diff = molesAnalyte - molesTitrant;
    if (Math.abs(diff) < 1e-9) ph = 7.0;
    else if (diff > 0) ph = 14 + Math.log10(diff / (totalVol / 1000));
    else ph = -Math.log10(-diff / (totalVol / 1000));
  } else if (modeKey === 'strong_acid_weak_base' || modeKey === 'strong-weakbase') {
    // Titrant HCl into NH4OH (pKb = 4.75 -> equivalence pH ~5.28)
    const pKb = 4.75;
    const kb = Math.pow(10, -pKb);
    if (vT <= 0.0001) {
      ph = 14 + Math.log10(Math.sqrt(kb * cAnalyte));
    } else if (molesTitrant < molesAnalyte - 1e-7) {
      const poh = pKb + Math.log10(molesTitrant / (molesAnalyte - molesTitrant));
      ph = 14 - poh;
    } else if (Math.abs(molesTitrant - molesAnalyte) <= 1e-7) {
      const cSalt = molesAnalyte / (totalVol / 1000);
      ph = -Math.log10(Math.sqrt((1e-14 / kb) * cSalt));
    } else {
      ph = -Math.log10((molesTitrant - molesAnalyte) / (totalVol / 1000));
    }
  } else {
    // 'weak_acid_strong_base' / 'strongbase-weakacid': NaOH into CH3COOH (pKa = 4.74)
    const pKa = 4.74;
    const ka = Math.pow(10, -pKa);
    if (vT <= 0.0001) {
      ph = -Math.log10(Math.sqrt(ka * cAnalyte));
    } else if (molesTitrant < molesAnalyte - 1e-7) {
      ph = pKa + Math.log10(molesTitrant / (molesAnalyte - molesTitrant));
    } else if (Math.abs(molesTitrant - molesAnalyte) <= 1e-7) {
      const cSalt = molesAnalyte / (totalVol / 1000);
      ph = 14 + Math.log10(Math.sqrt((1e-14 / ka) * cSalt));
    } else {
      ph = 14 + Math.log10((molesTitrant - molesAnalyte) / (totalVol / 1000));
    }
  }

  const clampedPh = Math.max(0.5, Math.min(13.6, ph));
  const region = Math.abs(clampedPh - 7.0) < 0.08 ? 'Neutral' : clampedPh < 7.0 ? 'Acidic' : 'Alkaline';

  return {
    ph: clampedPh,
    pH: clampedPh,
    eqVolMl,
    vEq: eqVolMl,
    volumeErrorMl: vT - eqVolMl,
    region
  };
}

// ============================================================================
// MODULE 02: QUALITATIVE SALT FLAME TEST & WET PRECIPITATE ENGINE
// ============================================================================
export const QUALITATIVE_SALTS = {
  NaCl: {
    key: 'NaCl',
    formula: 'NaCl',
    name: 'Sodium Chloride',
    cation: 'Na+',
    anion: 'Cl-',
    wavelengthNm: 589.0,
    nakedFlameName: 'Persistent Golden Yellow',
    nakedFlameHex: '#FFB703',
    cobaltFlameName: 'Nil (589 nm Absorbed)',
    cobaltFlameHex: '#25324C',
    solutionHex: '#E8F1F5',
    ferrocyanidePpt: 'No precipitate (clear colourless)',
    ferrocyanideHex: '#E8F1F5',
    anionTest: '+ AgNO3 -> Curdy white AgCl (soluble in NH4OH)',
    anionPptHex: '#F8FAFC'
  },
  KCl: {
    key: 'KCl',
    formula: 'KCl',
    name: 'Potassium Chloride',
    cation: 'K+',
    anion: 'Cl-',
    wavelengthNm: 766.5,
    nakedFlameName: 'Pale Lilac / Violet',
    nakedFlameHex: '#B87BFF',
    cobaltFlameName: 'Crimson-Violet (Transmitted)',
    cobaltFlameHex: '#D63384',
    solutionHex: '#E8F1F5',
    ferrocyanidePpt: 'No precipitate (clear colourless)',
    ferrocyanideHex: '#E8F1F5',
    anionTest: '+ AgNO3 -> Curdy white AgCl (soluble in NH4OH)',
    anionPptHex: '#F8FAFC'
  },
  CaCl2: {
    key: 'CaCl2',
    formula: 'CaCl2',
    name: 'Calcium Chloride',
    cation: 'Ca2+',
    anion: 'Cl-',
    wavelengthNm: 622.0,
    nakedFlameName: 'Brick Red',
    nakedFlameHex: '#E04F26',
    cobaltFlameName: 'Light Yellowish-Green',
    cobaltFlameHex: '#84CC16',
    solutionHex: '#E8F1F5',
    ferrocyanidePpt: 'White crystalline K2Ca[Fe(CN)6] ppt',
    ferrocyanideHex: '#F1F5F9',
    anionTest: '+ AgNO3 -> Curdy white AgCl ppt',
    anionPptHex: '#F8FAFC'
  },
  CuSO4: {
    key: 'CuSO4',
    formula: 'CuSO4',
    name: 'Copper(II) Sulfate',
    cation: 'Cu2+',
    anion: 'SO4 2-',
    wavelengthNm: 512.0,
    nakedFlameName: 'Bluish-Emerald Green',
    nakedFlameHex: '#10B981',
    cobaltFlameName: 'Sky Cyan Glow',
    cobaltFlameHex: '#06B6D4',
    solutionHex: '#38BDF8',
    ferrocyanidePpt: 'Reddish-Brown Cu2[Fe(CN)6] ppt',
    ferrocyanideHex: '#7F2B1D',
    anionTest: '+ BaCl2 -> Heavy white BaSO4 (insoluble in HCl)',
    anionPptHex: '#F8FAFC'
  },
  FeCl3: {
    key: 'FeCl3',
    formula: 'FeCl3',
    name: 'Iron(III) Chloride',
    cation: 'Fe3+',
    anion: 'Cl-',
    wavelengthNm: 585.0,
    nakedFlameName: 'Amber-Gold Sparkle',
    nakedFlameHex: '#EA8A2A',
    cobaltFlameName: 'Dim Grey-Amber',
    cobaltFlameHex: '#3B4252',
    solutionHex: '#FDE68A',
    ferrocyanidePpt: 'Intense Prussian Blue Fe4[Fe(CN)6]3 ppt',
    ferrocyanideHex: '#0B3B8C',
    anionTest: '+ AgNO3 -> Curdy white AgCl ppt',
    anionPptHex: '#F8FAFC'
  }
};

// ============================================================================
// MODULE 03: BOHR ATOM & RYDBERG SPECTRAL SERIES
// ============================================================================
export function computeBohrTransition(arg1 = 2, arg2 = 3, arg3 = 1) {
  let nLower = arg1;
  let nUpper = arg2;
  let atomicZ = arg3;
  if (typeof arg1 === 'object' && arg1 !== null) {
    nLower = arg1.n1 ?? 2;
    nUpper = arg1.n2 ?? 3;
    atomicZ = arg1.atomicZ ?? 1;
  }

  const n1 = Math.max(1, Math.min(5, Math.round(nLower)));
  const n2 = Math.max(n1 + 1, Math.min(7, Math.round(nUpper)));
  const waveNumberM = CHEM_CONSTANTS.RYDBERG_M * (atomicZ * atomicZ) * (1 / (n1 * n1) - 1 / (n2 * n2));
  const wavelengthNm = (1 / waveNumberM) * 1e9;
  const energyEv = 13.6 * (atomicZ * atomicZ) * (1 / (n1 * n1) - 1 / (n2 * n2));

  let series = 'Pfund';
  if (n1 === 1) series = 'Lyman';
  else if (n1 === 2) series = 'Balmer';
  else if (n1 === 3) series = 'Paschen';
  else if (n1 === 4) series = 'Brackett';

  const band = wavelengthNm < 380 ? 'Ultraviolet' : wavelengthNm <= 720 ? 'Visible' : 'Infrared';

  let colorHex = '#B83A2D';
  if (wavelengthNm < 380) colorHex = '#7C3AED';
  else if (wavelengthNm < 445) colorHex = '#4F46E5';
  else if (wavelengthNm < 500) colorHex = '#06B6D4';
  else if (wavelengthNm < 575) colorHex = '#10B981';
  else if (wavelengthNm < 620) colorHex = '#F59E0B';
  else if (wavelengthNm <= 720) colorHex = '#E11D48';

  return {
    n1,
    n2,
    wavelengthNm,
    waveNumberCm: waveNumberM / 100,
    energyEv,
    series,
    seriesName: `${series} Series (${band})`,
    band,
    colorHex,
    photonHex: colorHex,
    isVisible: wavelengthNm >= 380 && wavelengthNm <= 720
  };
}

// ============================================================================
// MODULE 04: VSEPR MOLECULAR GEOMETRY & LONE-PAIR REPULSION
// ============================================================================
const VSEPR_TABLE = {
  '2-0': { shape: 'Linear', hybridization: 'sp', idealAngle: 180.0, example: 'BeCl2 / CO2', polar: false },
  '3-0': { shape: 'Trigonal Planar', hybridization: 'sp2', idealAngle: 120.0, example: 'BF3 / BCl3', polar: false },
  '2-1': { shape: 'Bent (Angular)', hybridization: 'sp2', idealAngle: 117.5, example: 'SO2 / SnCl2', polar: true },
  '4-0': { shape: 'Tetrahedral', hybridization: 'sp3', idealAngle: 109.5, example: 'CH4 / CCl4', polar: false },
  '3-1': { shape: 'Trigonal Pyramidal', hybridization: 'sp3', idealAngle: 107.0, example: 'NH3 / PCl3', polar: true },
  '2-2': { shape: 'Bent (V-Shaped)', hybridization: 'sp3', idealAngle: 104.5, example: 'H2O / H2S', polar: true },
  '5-0': { shape: 'Trigonal Bipyramidal', hybridization: 'sp3d', idealAngle: 120.0, example: 'PCl5', polar: false },
  '4-1': { shape: 'Seesaw', hybridization: 'sp3d', idealAngle: 101.5, example: 'SF4', polar: true },
  '3-2': { shape: 'T-Shaped', hybridization: 'sp3d', idealAngle: 87.5, example: 'ClF3', polar: true },
  '2-3': { shape: 'Linear (Equatorial LP)', hybridization: 'sp3d', idealAngle: 180.0, example: 'XeF2 / I3-', polar: false },
  '6-0': { shape: 'Octahedral', hybridization: 'sp3d2', idealAngle: 90.0, example: 'SF6', polar: false },
  '5-1': { shape: 'Square Pyramidal', hybridization: 'sp3d2', idealAngle: 84.8, example: 'BrF5', polar: true },
  '4-2': { shape: 'Square Planar', hybridization: 'sp3d2', idealAngle: 90.0, example: 'XeF4', polar: false }
};

export function computeVseprGeometry(bondPairs = 4, lonePairs = 0) {
  const bp = Math.max(2, Math.min(6, Math.round(bondPairs)));
  const maxLp = Math.min(3, 6 - bp);
  const lp = Math.max(0, Math.min(maxLp, Math.round(lonePairs)));
  const stericNumber = bp + lp;
  const spec = VSEPR_TABLE[`${bp}-${lp}`] || VSEPR_TABLE['4-0'];

  return {
    bp,
    lp,
    stericNumber,
    ...spec,
    geometry: spec.shape,
    bondAngle: spec.idealAngle
  };
}

// ============================================================================
// MODULE 05: LE CHATELIER HABER EQUILIBRIUM REACTOR (N2 + 3H2 <=> 2NH3)
// ============================================================================
export function computeHaberEquilibrium(params = {}) {
  const temperatureC = params.tempC ?? params.temperatureC ?? 450;
  const pressureAtm = params.pressureAtm ?? 200;
  const catalystActive = params.catalyst ?? params.catalystActive ?? true;

  const tempK = temperatureC + 273.15;
  const logKp = 4590 / tempK - 9.85;
  const kp = Math.pow(10, logKp);
  const drive = Math.sqrt(kp) * pressureAtm;
  const nh3YieldPercent = Math.min(96.5, Math.max(1.2, (drive / (1.8 + drive)) * 100));

  const arrheniusRate = Math.exp(-5200 / tempK) * 1.4e4 * (catalystActive ? 8.5 : 1.0);
  const hourlySpaceYield = (nh3YieldPercent / 100) * Math.min(12, arrheniusRate) * (pressureAtm / 120);

  return {
    tempK,
    kp,
    nh3YieldPercent,
    yieldPct: nh3YieldPercent,
    activationBarrierKj: catalystActive ? 88 : 242,
    arrheniusRate,
    hourlySpaceYield
  };
}

// ============================================================================
// MODULE 06: DANIELL GALVANIC CELL (NERNST) & FARADAY ELECTROPLATING
// ============================================================================
export const ELECTRODE_COUPLES = {
  Mg: { symbol: 'Mg', ion: 'Mg2+', e0: -2.37, n: 2, molarMass: 24.305, metalColor: '#CBD5E1', ionColor: '#E8F1F5' },
  Zn: { symbol: 'Zn', ion: 'Zn2+', e0: -0.76, n: 2, molarMass: 65.38, metalColor: '#94A3B8', ionColor: '#E8F1F5' },
  Cu: { symbol: 'Cu', ion: 'Cu2+', e0: 0.34, n: 2, molarMass: 63.546, metalColor: '#B85D38', ionColor: '#38BDF8' },
  Ag: { symbol: 'Ag', ion: 'Ag+', e0: 0.80, n: 1, molarMass: 107.868, metalColor: '#E2E8F0', ionColor: '#E8F1F5' }
};

export const GALVANIC_COUPLES = {
  'zn-cu': { anodeKey: 'Zn', cathodeKey: 'Cu' },
  'cu-ag': { anodeKey: 'Cu', cathodeKey: 'Ag' },
  'mg-cu': { anodeKey: 'Mg', cathodeKey: 'Cu' }
};

export function computeElectrochemistry(params = {}) {
  const mapped = params.coupleKey ? GALVANIC_COUPLES[params.coupleKey] : null;
  const anodeKey = params.anodeKey || mapped?.anodeKey || 'Zn';
  const cathodeKey = params.cathodeKey || mapped?.cathodeKey || 'Cu';

  const anode = ELECTRODE_COUPLES[anodeKey] || ELECTRODE_COUPLES.Zn;
  const cathode = ELECTRODE_COUPLES[cathodeKey] || ELECTRODE_COUPLES.Cu;

  const cAnode = Math.max(0.001, params.cAnode ?? params.anodeConcM ?? 1.0);
  const cCathode = Math.max(0.001, params.cCathode ?? params.cathodeConcM ?? 1.0);
  const tempK = params.tempK ?? params.temperatureK ?? 298.15;

  const nElectrons = anode.n === cathode.n ? anode.n : anode.n * cathode.n;
  const expAnode = nElectrons / anode.n;
  const expCathode = nElectrons / cathode.n;

  const e0Volts = cathode.e0 - anode.e0;
  const qReaction = Math.pow(cAnode, expAnode) / Math.pow(cCathode, expCathode);
  const eCell = e0Volts - ((CHEM_CONSTANTS.R_GAS * tempK) / (nElectrons * CHEM_CONSTANTS.FARADAY)) * Math.log(qReaction);
  const deltaGKj = (-nElectrons * CHEM_CONSTANTS.FARADAY * eCell) / 1000;

  // Faraday's First Law on active cathode: W = (M * I * t) / (n_cathode * F)
  const currentAmp = params.currentAmp ?? params.electrolysisCurrentAmp ?? 2.5;
  const timeSec = params.electrolysisTimeSec ?? (params.timeMin ?? 10) * 60;
  const coulombsPassed = currentAmp * timeSec;
  const platedGrams = (cathode.molarMass * coulombsPassed) / (cathode.n * CHEM_CONSTANTS.FARADAY);

  return {
    anode,
    cathode,
    nElectrons,
    e0Volts,
    e0Cell: e0Volts,
    nernstVolts: eCell,
    eCell,
    qReaction,
    qRatio: qReaction,
    deltaGKj,
    spontaneous: eCell > 0,
    platedGrams,
    depositedMassG: platedGrams,
    coulombsPassed,
    chargeCoulombs: coulombsPassed,
    cathodeMetal: cathode.symbol
  };
}

// ============================================================================
// MODULE 07: ORGANIC CIS-TRANS & CHIRAL OPTICAL POLARIMETER
// ============================================================================
export function computeStereochemistry(params = {}) {
  const mode = params.submode || params.mode || 'geometric';
  const isTrans = params.configuration ? params.configuration === 'trans' : Boolean(params.isTrans);
  const dPct = params.dPercent ?? params.dEnantiomerPercent ?? 100;
  const conc = params.concGmL ?? params.concGPerMl ?? 0.50;
  const tubeL = params.tubeLengthDm ?? 2.0;

  const eeFrac = (2 * dPct - 100) / 100; // -1.0 to +1.0
  const eePercent = Math.round(Math.abs(eeFrac) * 100);
  // Calibrated specific rotation of lactic acid salt solution at 589 nm D-line
  const specificRotation = 3.80;
  const observedRotationDeg = mode === 'optical' ? +(specificRotation * tubeL * conc * eeFrac).toFixed(3) : 0.0;
  const isRacemic = mode === 'optical' && Math.abs(eeFrac) < 0.02;

  return {
    isomerName: isTrans ? 'trans-1,2-Dichloroethene (Non-Polar)' : 'cis-1,2-Dichloroethene (Polar)',
    dipoleDebye: mode === 'geometric' ? (isTrans ? 0.0 : 1.90) : 1.98,
    boilingPointC: mode === 'geometric' ? (isTrans ? 47.5 : 60.3) : 122.0,
    meltingPointC: mode === 'geometric' ? (isTrans ? -50.0 : -80.5) : (isRacemic ? 18.0 : 53.0),
    enantiomericExcessPercent: eePercent,
    eePercent,
    isRacemic,
    opticalStatus: isRacemic
      ? 'Racemic (+/-) Optically Inactive (0.00°)'
      : observedRotationDeg > 0
        ? 'Dextrorotatory (+)-d Isomer'
        : 'Laevorotatory (-)-l Isomer',
    observedRotationDeg
  };
}

// ============================================================================
// MODULE 08: GRAHAM'S DIFFUSION TUBE & REAL GAS COMPRESSIBILITY (Z)
// ============================================================================
export const DIFFUSION_GASES = {
  NH3: { formula: 'NH3', molarMass: 17.031 },
  CH3NH2: { formula: 'CH3NH2', molarMass: 31.057 },
  HCl: { formula: 'HCl', molarMass: 36.461, product: 'NH4Cl(s)' },
  HBr: { formula: 'HBr', molarMass: 80.912, product: 'NH4Br(s)' },
  HI: { formula: 'HI', molarMass: 127.912, product: 'NH4I(s)' }
};

export function computeGrahamDiffusion(params = {}) {
  const k1 = (params.gas1Key || params.leftKey || 'NH3').toUpperCase();
  const k2 = (params.gas2Key || params.rightKey || 'HCl');
  const normK2 = k2 === 'hcl' ? 'HCl' : k2 === 'hbr' ? 'HBr' : k2 === 'hi' ? 'HI' : k2;

  const g1 = DIFFUSION_GASES[k1] || DIFFUSION_GASES.NH3;
  const g2 = DIFFUSION_GASES[normK2] || DIFFUSION_GASES.HCl;
  const tubeLengthCm = params.tubeLengthCm ?? 60.0;
  const pressureAtm = params.pressureAtm ?? 100.0;

  // r1 / r2 = sqrt(M2 / M1)
  const rateRatio = Math.sqrt(g2.molarMass / g1.molarMass);
  const distFromLeftCm = (tubeLengthCm * rateRatio) / (1 + rateRatio);
  const distFromRightCm = tubeLengthCm - distFromLeftCm;

  // Calibrated Amagat Compressibility factor curves Z = PV / nRT
  const zH2 = 1 + 0.00064 * pressureAtm;
  const zN2 = 1 - 0.00045 * pressureAtm + 0.0000042 * pressureAtm * pressureAtm;
  const zCH4 = 1 - 0.00145 * pressureAtm + 0.0000072 * pressureAtm * pressureAtm;
  const zCO2 = 1 - 0.0031 * pressureAtm + 0.0000115 * pressureAtm * pressureAtm;

  const zMap = { H2: zH2, N2: zN2, CH4: zCH4, CO2: zCO2 };
  const amagatGas = params.amagatGas || 'CO2';

  return {
    leftFormula: g1.formula,
    rightFormula: g2.formula,
    productName: g2.product,
    productFormula: g2.product,
    rateRatio,
    distFromLeftCm,
    x1Cm: distFromLeftCm,
    distFromRightCm,
    zH2,
    zN2,
    zCH4,
    zCO2,
    zFactor: zMap[amagatGas] ?? zCO2
  };
}
