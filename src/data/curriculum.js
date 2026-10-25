/**
 * NCTB SSC (Class 9-10) & HSC (Class 11-12, 1st & 2nd Paper) Chemistry Curriculum Data
 * Structured for Chemia Atelier v1.0
 */

export const CURRICULUM_MODULES = [
  {
    id: 'titration',
    num: '01',
    shortTitle: 'Titration',
    title: 'Acid-Base Burette Titration & Indicator Physics',
    discipline: 'Quantitative Volumetric Analysis',
    nctbTag: 'SSC Ch. 9 · HSC 2nd Paper Ch. 3',
    summary: 'Standardize 25.0 mL analyte solutions drop by drop from a 50 mL graduated burette, tracking equivalence pH jumps and indicator colour intervals.',
    equationText: 'pH = -log[H+]  ·  V_eq = (C_a · V_a) / C_t',
    photo: './media/hero-titration-bench.jpg',
    photoCaption: 'Graduated glass burette in brass clamp stand over pale rose Phenolphthalein endpoint.',
    glossary: [
      { sym: 'V_t', name: 'Added Titrant Volume', unit: 'mL' },
      { sym: 'C_a, C_t', name: 'Analyte & Titrant Molarity', unit: 'M (mol/L)' },
      { sym: 'V_eq', name: 'Equivalence Volume', unit: 'mL' },
      { sym: 'pK_in', name: 'Indicator Transition Constant', unit: 'dimensionless' }
    ],
    guide: [
      {
        heading: 'Choosing the Correct Indicator on HSC Board Practicals',
        body: 'An indicator functions accurately only when its transition pH range lies entirely inside the steep vertical inflection of the titration curve. Phenolphthalein (pH 8.2–10.0) detects weak acid vs strong base (CH3COOH + NaOH, equivalence pH ~8.72), whereas Methyl Orange (pH 3.1–4.4) detects strong acid vs weak base (HCl + NH4OH, equivalence pH ~5.28).'
      },
      {
        heading: 'Henderson-Hasselbalch Half-Equivalence Buffer',
        body: 'In CH3COOH + NaOH titration, adding half the stoichiometric base (V_t = 0.5 · V_eq) converts half the weak acid into CH3COONa, forming an optimal buffer where pH = pK_a = 4.74.'
      }
    ],
    challenges: [
      {
        id: 'titration-1',
        title: 'Neutralization Endpoint (pH = 7.00)',
        desc: 'In Strong Acid + Strong Base (0.10 M HCl vs 0.10 M NaOH), stop the burette within +/- 0.15 mL of V_eq = 25.00 mL.',
        hint: 'Use the +0.05 mL Drop button as you approach 24.80 mL until pH jumps sharply to 7.00.'
      },
      {
        id: 'titration-2',
        title: 'Acetate Half-Equivalence Buffer (pH = 4.74)',
        desc: 'Switch to Weak Acid + Strong Base (CH3COOH + NaOH) and titrate to half-equivalence (pH between 4.68 and 4.80).',
        hint: 'Select Preset "CH3COOH + NaOH" and dispense 12.50 mL of 0.10 M NaOH.'
      },
      {
        id: 'titration-3',
        title: 'Phenolphthalein Basic Equivalence Match',
        desc: 'Select Phenolphthalein indicator in CH3COOH + NaOH mode and hit the faint rose equivalence zone (pH 8.30 to 9.20).',
        hint: 'Dispense exactly 25.00 mL of 0.10 M NaOH into 25.0 mL of 0.10 M CH3COOH with Phenolphthalein selected.'
      }
    ],
    quiz: {
      question: 'Which acid-base titration CANNOT be accurately standardized using Phenolphthalein (transition range pH 8.2 - 10.0)?',
      options: [
        'HCl + NaOH (Strong Acid vs Strong Base)',
        'CH3COOH + NaOH (Weak Acid vs Strong Base)',
        'HCl + NH4OH (Strong Acid vs Weak Base)',
        'H2C2O4 + NaOH (Oxalic Acid vs Sodium Hydroxide)'
      ],
      answerIdx: 2,
      explanation: 'In HCl + NH4OH, ammonium ion hydrolysis makes the equivalence solution acidic (pH ~5.28). Phenolphthalein changes colour far above the equivalence jump (pH 8.2-10.0); Methyl Orange (pH 3.1-4.4) is required.'
    }
  },
  {
    id: 'qualitative',
    num: '02',
    shortTitle: 'Salt & Flame',
    title: 'Qualitative Salt Identification & Cobalt Glass Flame Lab',
    discipline: 'Inorganic Qualitative Practical (25 Marks)',
    nctbTag: 'HSC 1st Paper Ch. 2 Practical',
    summary: 'Identify unknown inorganic cations and anions using platinum-wire Bunsen flame emission, Blue Cobalt Glass filtration, and wet test-tube precipitates.',
    equationText: 'Cu2+ + K4[Fe(CN)6] -> Cu2[Fe(CN)6] (s)  ·  Ag+ + Cl- -> AgCl (s)',
    photo: './media/flame-qualitative-rack.jpg',
    photoCaption: 'Analytical precipitates in wooden rack beside brass Bunsen burner and porcelain mortar.',
    glossary: [
      { sym: 'lambda', name: 'Characteristic Emission Wavelength', unit: 'nm' },
      { sym: 'Co-Glass', name: 'Blue Cobalt Silicate Filter', unit: 'absorbs 589 nm Na+' },
      { sym: 'K4[Fe(CN)6]', name: 'Potassium Ferrocyanide Reagent', unit: 'aq' },
      { sym: 'BaCl2 / AgNO3', name: 'Halide / Sulfate Reagent', unit: 'aq' }
    ],
    guide: [
      {
        heading: 'Role of Blue Cobalt Glass in K+ Detection',
        body: 'Trace sodium impurities emit intense 589 nm golden-yellow light that masks pale violet potassium (K+) emission. Blue cobalt silicate glass strongly absorbs yellow light around 589 nm while transmitting crimson-violet K+ rays.'
      },
      {
        heading: 'Confirmatory Wet Tests for Transition Cations',
        body: 'Adding potassium ferrocyanide K4[Fe(CN)6] produces a diagnostic reddish-brown precipitate Cu2[Fe(CN)6] with Cu2+ ions and an intense Prussian blue precipitate Fe4[Fe(CN)6]3 with ferric Fe3+ ions.'
      }
    ],
    challenges: [
      {
        id: 'qualitative-1',
        title: 'Cobalt Glass Potassium Verification',
        desc: 'Load KCl (Potassium Chloride) into the platinum loop AND engage the Blue Cobalt Glass filter to reveal crimson-violet emission.',
        hint: 'Select Salt "KCl" and click "Toggle Cobalt Glass" so the blue filter swings into the viewing axis.'
      },
      {
        id: 'qualitative-2',
        title: 'Prussian Blue Ferric Confirmation',
        desc: 'Select FeCl3 and dispense Potassium Ferrocyanide K4[Fe(CN)6] into Test Tube A to precipitate Prussian Blue.',
        hint: 'Select Salt "FeCl3" and click "+ K4[Fe(CN)6] Test".'
      },
      {
        id: 'qualitative-3',
        title: 'Mystery Salt Detective Solved',
        desc: 'Enter Mystery Salt Mode, inspect the flame + wet precipitates, and correctly identify the hidden salt formula.',
        hint: 'Click "Start Mystery Salt", run both wet reagent buttons + flame check, then pick the matching salt formula.'
      }
    ],
    quiz: {
      question: 'When aqueous potassium ferrocyanide K4[Fe(CN)6] is added to a solution containing Cu2+ ions, what diagnostic precipitate forms?',
      options: [
        'Curdy white precipitate soluble in NH4OH',
        'Deep Prussian blue precipitate',
        'Reddish-brown precipitate of Cu2[Fe(CN)6]',
        'Brick-red precipitate only after boiling'
      ],
      answerIdx: 2,
      explanation: '2Cu2+(aq) + [Fe(CN)6]4-(aq) -> Cu2[Fe(CN)6](s), an unmistakable reddish-brown gelatinous precipitate taught as the primary confirmatory test for Cu2+ in HSC Practical Chemistry.'
    }
  },
  {
    id: 'bohr',
    num: '03',
    shortTitle: 'Bohr Spectra',
    title: 'Bohr Quantum Orbits & Rydberg Line Spectra',
    discipline: 'Atomic Structure & Quantum Emission',
    nctbTag: 'SSC Ch. 3 · HSC 1st Paper Ch. 2',
    summary: 'Trigger quantized electron jumps between principal shells (n = 1 to 6) and inspect exact Lyman (UV), Balmer (Visible), and Paschen (IR) spectral lines.',
    equationText: '1 / lambda = R_H · Z^2 · (1/n1^2 - 1/n2^2)',
    photo: './media/molecular-models-bench.jpg',
    photoCaption: 'Calibrated atomic and stereochemical models with brass vernier instrumentation.',
    glossary: [
      { sym: 'n1, n2', name: 'Lower & Upper Quantum Shells', unit: 'integer' },
      { sym: 'R_H', name: 'Rydberg Constant (109,677)', unit: 'cm^-1' },
      { sym: 'Delta E', name: 'Emitted Photon Energy', unit: 'eV' },
      { sym: 'lambda', name: 'Vacuum Emission Wavelength', unit: 'nm' }
    ],
    guide: [
      {
        heading: 'Lyman, Balmer, and Paschen Series Boundaries',
        body: 'In hydrogen (Z = 1), transitions ending at n1 = 1 fall in the Ultraviolet (Lyman series, <= 121.6 nm); transitions ending at n1 = 2 produce the four visible Balmer lines (656.5 nm red, 486.3 nm cyan, 434.2 nm blue, 410.3 nm violet); transitions to n1 = 3 lie in the Infrared (Paschen series).'
      },
      {
        heading: 'UV Fluorescence Security Ink Application (HSC Ch. 2)',
        body: 'Near-UV photons (365 nm) excite phosphor security fibres in Bangladesh Taka banknotes to higher electronic states; non-radiative relaxation followed by visible emission confirms authenticity without damaging paper.'
      }
    ],
    challenges: [
      {
        id: 'bohr-1',
        title: 'Balmer H-Alpha Red Line (656.5 nm)',
        desc: 'Configure Hydrogen (Z = 1) for the first visible Balmer transition (n2 = 3 -> n1 = 2) and emit photon.',
        hint: 'Set Z = 1, Lower Shell n1 = 2, Upper Shell n2 = 3.'
      },
      {
        id: 'bohr-2',
        title: 'Lyman Ultraviolet Transition (121.6 nm)',
        desc: 'Configure Hydrogen for the fundamental Lyman-alpha transition (n2 = 2 -> n1 = 1).',
        hint: 'Lower Shell n1 = 1, Upper Shell n2 = 2 (Z = 1).'
      },
      {
        id: 'bohr-3',
        title: 'He+ Ion High-Energy Spectrum',
        desc: 'Increase nuclear charge to Helium ion He+ (Z = 2) with Delta E > 35 eV.',
        hint: 'Set Z = 2 (He+), n1 = 1, and n2 >= 2 (since E scales with Z^2 = 4, 2->1 yields 40.8 eV).'
      }
    ],
    quiz: {
      question: 'An electron in a Hydrogen atom jumps from the 4th orbit (n2 = 4) to the 2nd orbit (n1 = 2). Which spectral series and colour region does the emitted radiation belong to?',
      options: [
        'Lyman series — Ultraviolet',
        'Balmer series — Visible Blue-Green (486.3 nm)',
        'Paschen series — Near Infrared',
        'Brackett series — Far Infrared'
      ],
      answerIdx: 1,
      explanation: 'Any downward jump in Hydrogen terminating at n1 = 2 belongs to the Balmer series. Using 1/lambda = R_H(1/4 - 1/16) = 3R_H/16 yields lambda = 486.27 nm (H-beta cyan/blue-green visible light).'
    }
  },
  {
    id: 'vsepr',
    num: '04',
    shortTitle: 'VSEPR 3D',
    title: 'VSEPR Molecular Geometry, Lone Pairs & Hybridization',
    discipline: 'Chemical Bonding & Orbital Geometry',
    nctbTag: 'SSC Ch. 5 · HSC 1st Paper Ch. 3',
    summary: 'Manipulate bonding pairs (BP) and diffuse translucent lone-pair orbitals (LP) around a central atom to observe sp -> sp3d2 hybridization and bond-angle compression.',
    equationText: 'Repulsion: LP-LP > LP-BP > BP-BP  ·  X = BP + LP',
    photo: './media/molecular-models-bench.jpg',
    photoCaption: '3D tetrahedral and trigonal carbon-nitrogen ball-and-stick models.',
    glossary: [
      { sym: 'BP', name: 'Sigma Bonding Pairs', unit: 'count (2-6)' },
      { sym: 'LP', name: 'Non-Bonding Lone Pairs', unit: 'count (0-3)' },
      { sym: 'X', name: 'Steric Number (Hybrid Orbitals)', unit: 'sp to sp3d2' },
      { sym: 'theta', name: 'Observed Bond Angle', unit: 'deg' }
    ],
    guide: [
      {
        heading: 'Why CH4 (109.5 deg) > NH3 (107 deg) > H2O (104.5 deg)',
        body: 'All three molecules share steric number X = 4 (sp3 hybridization), yet each non-bonding lone pair is held by only ONE nucleus rather than two. Its electron cloud spreads wider near the central atom, compressing adjacent bonding pairs by ~2.5 deg per lone pair.'
      },
      {
        heading: 'Axial vs Equatorial Placement in sp3d (X = 5)',
        body: 'In trigonal bipyramidal electron arrangement (e.g. SF4, ClF3, XeF2), lone pairs ALWAYS occupy equatorial positions (120 deg apart) to minimize costly 90 deg interactions.'
      }
    ],
    challenges: [
      {
        id: 'vsepr-1',
        title: 'Bent Water Compression (104.5 deg)',
        desc: 'Configure H2O geometry (2 Bonding Pairs, 2 Lone Pairs, sp3) and verify the compressed 104.5 deg bond angle.',
        hint: 'Set Bonding Pairs = 2 and Lone Pairs = 2 (or click Preset "H2O").'
      },
      {
        id: 'vsepr-2',
        title: 'Trigonal Pyramidal Ammonia (107.0 deg)',
        desc: 'Configure NH3 geometry (3 Bonding Pairs, 1 Lone Pair, sp3).',
        hint: 'Set Bonding Pairs = 3 and Lone Pairs = 1 (or click Preset "NH3").'
      },
      {
        id: 'vsepr-3',
        title: 'Square Planar Xenon Tetrafluoride (sp3d2)',
        desc: 'Build octahedral electron geometry with trans-axial lone pairs: 4 Bonding Pairs + 2 Lone Pairs (XeF4, 90.0 deg).',
        hint: 'Set Bonding Pairs = 4 and Lone Pairs = 2 (or click Preset "XeF4").'
      }
    ],
    quiz: {
      question: 'Although CH4, NH3, and H2O all exhibit sp3 hybridization on their central atom, why is the H-O-H bond angle in water (104.5 deg) smaller than H-N-H in ammonia (107 deg)?',
      options: [
        'Oxygen is larger than Nitrogen so H atoms move closer',
        'Water contains two lone pairs causing severe LP-LP repulsion that compresses bonding pairs further',
        'Water undergoes sp2 hybridization in the liquid phase',
        'Hydrogen bonding increases covalent bond length to 180 deg'
      ],
      answerIdx: 1,
      explanation: 'Oxygen in H2O carries 2 lone pairs whereas Nitrogen in NH3 carries 1 lone pair. Because LP-LP > LP-BP > BP-BP repulsion, two lone pairs compress the O-H bonding orbitals down to 104.5 deg.'
    }
  },
  {
    id: 'equilibrium',
    num: '05',
    shortTitle: 'Le Chatelier',
    title: 'Haber Catalytic Reactor & Le Chatelier Equilibrium',
    discipline: 'Chemical Kinetics & Equilibrium',
    nctbTag: 'SSC Ch. 7 · HSC 1st Paper Ch. 4',
    summary: 'Operate a pressurized N2 + 3H2 <=> 2NH3 reactor across temperature (300–650 C), pressure (50–400 atm), and porous Fe catalyst to balance equilibrium yield against rate.',
    equationText: 'N2(g) + 3H2(g) <=> 2NH3(g)  ·  Delta H = -92.4 kJ/mol',
    photo: './media/hero-titration-bench.jpg',
    photoCaption: 'Quantitative control of reaction stoichiometry and equilibrium concentration.',
    glossary: [
      { sym: 'T', name: 'Reactor Temperature', unit: 'deg C / K' },
      { sym: 'P', name: 'Total Gas Pressure', unit: 'atm' },
      { sym: 'K_p', name: 'Equilibrium Constant (Partial Press.)', unit: 'atm^-2' },
      { sym: 'E_a', name: 'Activation Energy Barrier', unit: 'kJ/mol' }
    ],
    guide: [
      {
        heading: 'Why Industrial Plants Compromise at 450 C and 200 atm',
        body: 'Because ammonia synthesis is exothermic (Delta H = -92.4 kJ/mol) and reduces gas moles from 4 to 2, low temperature and high pressure maximize yield. However, below 400 C the triple bond N===N breaks too slowly even on iron catalyst, so plants run around 450 C and 200 atm.'
      },
      {
        heading: 'Effect of Iron Catalyst + Mo Promoter on K_p',
        body: 'Finely divided Iron lowers the activation energy barrier equally for forward and reverse pathways. Equilibrium is reached far faster, while equilibrium percentage yield and K_p remain strictly unchanged.'
      }
    ],
    challenges: [
      {
        id: 'equilibrium-1',
        title: 'Optimal Industrial Haber Compromise',
        desc: 'Set reactor conditions to the classic industrial compromise window: T = 440–460 C, P = 190–210 atm, WITH Fe Catalyst enabled.',
        hint: 'Click Preset "Industrial Haber (450 C, 200 atm)" or adjust Temperature = 450 C, Pressure = 200 atm, Catalyst ON.'
      },
      {
        id: 'equilibrium-2',
        title: 'High-Yield Compression (> 55% NH3)',
        desc: 'Apply Le Chatelier’s Principle to drive equilibrium NH3 yield above 55.0%.',
        hint: 'Lower temperature below 360 C and compress pressure above 300 atm.'
      },
      {
        id: 'equilibrium-3',
        title: 'High-Temperature Thermal Dissociation (< 8% NH3)',
        desc: 'Demonstrate exothermic shift to the left by heating above 580 C at low pressure (< 80 atm) so NH3 drops below 8%.',
        hint: 'Set Temperature >= 600 C and Pressure <= 70 atm.'
      }
    ],
    quiz: {
      question: 'For the exothermic reaction N2(g) + 3H2(g) <=> 2NH3(g) (Delta H = -92.4 kJ/mol), what happens when finely divided Fe catalyst is added at constant T and P?',
      options: [
        'K_p increases and ammonia yield doubles',
        'Equilibrium shifts right while forward activation energy rises',
        'Equilibrium is reached faster with zero change in equilibrium yield or K_p',
        'Delta H becomes endothermic'
      ],
      answerIdx: 2,
      explanation: 'A catalyst lowers the activation energy of both forward and reverse reactions by the exact same amount, accelerating attainment of equilibrium without altering Delta H or K_p.'
    }
  },
  {
    id: 'electrochem',
    num: '06',
    shortTitle: 'Electrochem',
    title: 'Daniell Galvanic Cell (Nernst EMF) & Faraday Electrolysis',
    discipline: 'Electrochemistry & Quantitative Plating',
    nctbTag: 'SSC Ch. 8 · HSC 2nd Paper Ch. 4',
    summary: 'Measure non-standard galvanic cell EMF across Zn, Cu, Ag, and Mg electrodes via a KCl U-tube salt bridge, or switch to DC Faraday electrolysis to weigh plated cathode metal.',
    equationText: 'E_cell = E0_cell - (RT / nF) ln Q  ·  W = (M · I · t) / (n · F)',
    photo: './media/electrochemistry-cell.jpg',
    photoCaption: 'Classical CuSO4 / ZnSO4 Daniell galvanic cell with KCl salt bridge reading +1.10 V.',
    glossary: [
      { sym: 'E_cell', name: 'Electromotive Force (EMF)', unit: 'V' },
      { sym: 'Q', name: 'Reaction Quotient [Anode]/[Cathode]', unit: 'ratio' },
      { sym: 'F', name: 'Faraday Constant (96,485)', unit: 'C / mol e-' },
      { sym: 'W', name: 'Cathode Plated Metal Mass', unit: 'g' }
    ],
    guide: [
      {
        heading: 'Standard Daniell Cell & Why Glass/Porcelain Containers Persist',
        body: 'In Zn | Zn2+(1.0 M) || Cu2+(1.0 M) | Cu, zinc oxidizes at the anode (-0.76 V) while Cu2+ reduces at the cathode (+0.34 V), giving E0_cell = +1.10 V. Conversely, storing CuSO4 in a zinc vessel causes spontaneous displacement (E0 > 0) and corrodes the container.'
      },
      {
        heading: 'Faraday’s First Law of Electrolysis',
        body: 'Depositing 1 mole of divalent metal (Cu2+, n = 2) requires 2 Faradays = 192,970 Coulombs of charge: W = (M · I · t) / (n · 96485).'
      }
    ],
    challenges: [
      {
        id: 'electrochem-1',
        title: 'Standard Daniell Cell (+1.100 V)',
        desc: 'Configure Zn Anode (1.00 M) + Cu Cathode (1.00 M) in Galvanic mode to measure E_cell = +1.100 V.',
        hint: 'Click Preset "Standard Daniell (1.10 V)" or set Anode = Zn, Cathode = Cu, both at 1.00 M.'
      },
      {
        id: 'electrochem-2',
        title: 'High-Voltage Mg | Ag Galvanic Couple (> 3.0 V)',
        desc: 'Select Magnesium (Mg) anode and Silver (Ag) cathode to generate a cell EMF exceeding +3.00 V.',
        hint: 'Set Anode = Mg (-2.37 V) and Cathode = Ag (+0.80 V) -> E0 = +3.17 V.'
      },
      {
        id: 'electrochem-3',
        title: 'Faraday Electroplating (>= 1.00 g Deposited)',
        desc: 'Switch to Faraday Electrolysis mode and electroplate at least 1.00 g of metal onto the cathode.',
        hint: 'Switch Mode to "Faraday Electrolysis", set Current I >= 4.0 A and Time t >= 15 min on Cu or Ag.'
      }
    ],
    quiz: {
      question: 'How many grams of metallic Copper (M = 63.55 g/mol) deposit at the cathode when a 5.0 A current passes through aqueous CuSO4 for 965 seconds? (F = 96,500 C/mol)',
      options: [
        '0.794 g',
        '1.589 g',
        '3.178 g',
        '6.355 g'
      ],
      answerIdx: 1,
      explanation: 'For Cu2+ + 2e- -> Cu, n = 2. Using W = (M · I · t) / (n · F) = (63.55 × 5.0 × 965) / (2 × 96500) = 63.55 × 5 / 200 = 1.589 g.'
    }
  },
  {
    id: 'organic',
    num: '07',
    shortTitle: 'Stereochem',
    title: 'Organic Cis-Trans Isomers & Optical Chiral Polarimeter',
    discipline: 'Organic Stereochemistry & Polarimetry',
    nctbTag: 'SSC Ch. 11 · HSC 2nd Paper Ch. 2',
    summary: 'Compare restricted C=C pi-bond dipole geometry in cis/trans alkenes, then pass plane-polarized sodium D-line light through d-, l-, and racemic (+/-) lactic acid.',
    equationText: 'alpha_obs = [alpha]_D · l · c · ee  ·  Racemic (50:50) -> 0.00 deg',
    photo: './media/molecular-models-bench.jpg',
    photoCaption: 'Non-superimposable tetrahedral carbon enantiomers beside stereochemical notes.',
    glossary: [
      { sym: 'mu', name: 'Net Molecular Dipole Moment', unit: 'Debye (D)' },
      { sym: '[alpha]_D', name: 'Specific Rotation (589 nm)', unit: 'deg·mL/(g·dm)' },
      { sym: 'l', name: 'Polarimeter Tube Length', unit: 'dm (1 dm = 10 cm)' },
      { sym: 'ee', name: 'Enantiomeric Excess |%d - %l|', unit: '%' }
    ],
    guide: [
      {
        heading: 'Why Cis-Trans Melting & Boiling Points Diverge',
        body: 'In cis-1,2-dichloroethene, both polar C-Cl vectors point to the same side (mu = 1.90 D), raising intermolecular dipole attraction and boiling point (60.3 C). In trans-1,2-dichloroethene, opposing C-Cl vectors cancel to mu = 0.00 D, yet higher symmetry packs tighter in crystals.'
      },
      {
        heading: 'External Compensation in Racemic (+/-) Mixtures',
        body: 'An equimolar 50% (+)-enantiomer and 50% (-)-enantiomer mixture cancels clockwise and counter-clockwise optical rotation molecule for molecule (alpha_obs = 0.00 deg), making racemic lactic acid optically inactive.'
      }
    ],
    challenges: [
      {
        id: 'organic-1',
        title: 'Trans-Alkene Zero Dipole Symmetry (mu = 0.00 D)',
        desc: 'Inspect trans-1,2-dichloroethene in Geometric mode and verify exact dipole cancellation (mu = 0.00 D).',
        hint: 'Ensure Submode = "Geometric (Cis/Trans)" and switch Configuration to "trans-isomer".'
      },
      {
        id: 'organic-2',
        title: 'Racemic Optical Compensation (0.00 deg)',
        desc: 'Switch to Optical Polarimeter mode and balance (+)-d and (-)-l enantiomers at 50:50 so alpha_obs = 0.00 deg.',
        hint: 'Switch Submode to "Optical Polarimeter" and set d-Enantiomer % to 50%.'
      },
      {
        id: 'organic-3',
        title: 'Pure Enantiomer Polarimetry (|alpha| >= 5.0 deg)',
        desc: 'Achieve an optical rotation magnitude |alpha_obs| of at least 5.0 deg in the polarimeter tube.',
        hint: 'In Optical Polarimeter mode, set d% to 100% (or 0%), Tube Length l = 2.0 dm, and Concentration c >= 0.70 g/mL.'
      }
    ],
    quiz: {
      question: 'Why is a racemic mixture (+/-)-lactic acid optically inactive toward plane-polarized light?',
      options: [
        'Lactic acid contains no asymmetric chiral carbon atom',
        'Internal compensation due to an internal plane of symmetry (meso form)',
        'External compensation: equal moles of (+) and (-) enantiomers cancel rotation equally',
        'Rapid pi-bond rotation converts lactic acid into an achiral ketone'
      ],
      answerIdx: 2,
      explanation: 'Lactic acid CH3-CH(OH)-COOH contains one chiral carbon, so no meso form exists. A 50:50 (+/-) racemic mixture is optically inactive strictly through external intermolecular compensation.'
    }
  },
  {
    id: 'gaslaws',
    num: '08',
    shortTitle: 'Gas & Diffusion',
    title: 'Graham’s Diffusion Tube & Amagat Real-Gas Z Curves',
    discipline: 'Environmental & Physical Gas Chemistry',
    nctbTag: 'HSC 2nd Paper Ch. 1',
    summary: 'Release NH3(g) and HCl/HBr/HI(g) plugs simultaneously at opposite ends of a 60 cm glass tube to watch white ammonium halide smoke crystallize at the exact Graham distance.',
    equationText: 'r1 / r2 = sqrt(M2 / M1)  ·  Z = (P · V) / (n · R · T)',
    photo: './media/flame-qualitative-rack.jpg',
    photoCaption: 'Gas diffusion and phase precipitation verification bench.',
    glossary: [
      { sym: 'r1 / r2', name: 'Relative Effusion / Diffusion Rate', unit: 'ratio' },
      { sym: 'M1, M2', name: 'Molar Masses of Diffusing Gases', unit: 'g/mol' },
      { sym: 'x_ring', name: 'White Ring Position from NH3 End', unit: 'cm' },
      { sym: 'Z', name: 'Compressibility Factor (PV / nRT)', unit: '1.00 = Ideal' }
    ],
    guide: [
      {
        heading: 'Classic HSC Glass-Tube NH3 + HCl Calculation',
        body: 'Ammonia (M1 = 17.03 g/mol) is much lighter than hydrogen chloride (M2 = 36.46 g/mol), so r_NH3 / r_HCl = sqrt(36.46 / 17.03) = 1.463. In a 60.0 cm glass tube, white NH4Cl solid forms 35.65 cm from the NH3 plug and 24.35 cm from the HCl plug.'
      },
      {
        heading: 'Amagat Curves & Real Gas Deviations (Z != 1)',
        body: 'Hydrogen (H2) and Helium show Z > 1 at all room-temperature pressures because tiny van der Waals attraction "a" is outweighed by finite molecular volume "b". CO2 dips sharply below Z = 1 at moderate pressures before rising at extreme compression.'
      }
    ],
    challenges: [
      {
        id: 'gaslaws-1',
        title: 'Classic NH4Cl White Ring at 35.65 cm',
        desc: 'Release NH3 + HCl in a 60.0 cm tube and run the diffusion clock until the white NH4Cl ring crystallizes.',
        hint: 'Ensure Acid Gas = HCl, Tube Length = 60 cm, and click "Release Gas Plugs" until progress reaches 100%.'
      },
      {
        id: 'gaslaws-2',
        title: 'Heavy Bromide Shift (NH3 + HBr > 40 cm)',
        desc: 'Replace HCl with heavier HBr (80.91 g/mol) in a >= 60 cm tube and complete ring formation past 40.0 cm.',
        hint: 'Select Acid Gas "HBr" and click "Release Gas Plugs" to watch NH4Br form at 68.5% of tube length.'
      },
      {
        id: 'gaslaws-3',
        title: 'CO2 Negative Compressibility Dip (Z < 0.85)',
        desc: 'Select CO2 on the Amagat Compressibility analyzer between 80 and 220 atm to observe strong intermolecular attraction (Z < 0.85).',
        hint: 'Select Amagat Gas "CO2" and adjust Pressure P between 100 atm and 200 atm at 300 K.'
      }
    ],
    quiz: {
      question: 'Cotton plugs soaked in concentrated NH3 (M = 17) and HCl (M = 36.5) are inserted simultaneously at opposite ends of a 100 cm glass tube. How far from the NH3 end will the white NH4Cl ring first appear?',
      options: [
        '31.8 cm from the NH3 end',
        '50.0 cm (exact midpoint)',
        '59.4 cm from the NH3 end',
        '68.2 cm from the NH3 end'
      ],
      answerIdx: 2,
      explanation: 'r_NH3 / r_HCl = sqrt(36.5 / 17.0) = 1.465. Therefore x / (100 - x) = 1.465 -> 2.465x = 146.5 -> x = 59.4 cm from the lighter NH3 end.'
    }
  }
];
