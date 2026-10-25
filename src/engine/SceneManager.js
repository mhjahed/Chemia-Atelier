import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Daylight European Analytical Chemistry 3D Studio Engine (Three.js)
 * Implements calibrated 3D apparatus across all 8 NCTB SSC & HSC benches.
 */
export class SceneManager {
  constructor(mountEl) {
    this.mountEl = mountEl;
    this.activeModule = 'titration';
    this.animFrame = null;
    this.clock = new THREE.Clock();
    this.needsContinuousAnim = true;
    this.dropTimer = 0;
    this.photonTimer = 0;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF3F1EC);

    const w = mountEl.clientWidth || 800;
    const h = mountEl.clientHeight || 540;

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 2.5, 7.2);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    mountEl.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 14.0;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.target.set(0, 1.35, 0);

    this._setupLightingAndBench();
    this.moduleGroup = new THREE.Group();
    this.scene.add(this.moduleGroup);

    this.refs = {};
    this._buildModuleScene('titration');

    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);

    this._startLoop();
  }

  _setupLightingAndBench() {
    const hemi = new THREE.HemisphereLight(0xFFFFFF, 0xDFDBD0, 1.35);
    this.scene.add(hemi);

    const dirKey = new THREE.DirectionalLight(0xFFFDF8, 1.55);
    dirKey.position.set(5.5, 9.0, 6.5);
    this.scene.add(dirKey);

    const dirRim = new THREE.DirectionalLight(0xD8E8EC, 0.72);
    dirRim.position.set(-6.0, 4.5, -5.0);
    this.scene.add(dirRim);

    // Laboratory ceramic benchtop slab
    const benchGeo = new THREE.BoxGeometry(11.5, 0.28, 6.2);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0xEAE6DC,
      roughness: 0.55,
      metalness: 0.04
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, -0.14, 0);
    this.scene.add(bench);

    // Brass front trim strip
    const trimGeo = new THREE.BoxGeometry(11.52, 0.06, 0.06);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xA47E3B,
      roughness: 0.32,
      metalness: 0.72
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, -0.02, 3.11);
    this.scene.add(trim);

    // Subtle calibration grid on benchtop
    const grid = new THREE.GridHelper(10, 20, 0xC8C3B6, 0xDCD8CC);
    grid.position.y = 0.004;
    grid.scale.z = 0.56;
    this.scene.add(grid);
  }

  _glassMat(opacity = 0.24, tint = 0xE8F3F5) {
    return new THREE.MeshStandardMaterial({
      color: tint,
      transparent: true,
      opacity,
      roughness: 0.07,
      metalness: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  _brassMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xB08A43,
      roughness: 0.30,
      metalness: 0.78
    });
  }

  _ironMat() {
    return new THREE.MeshStandardMaterial({
      color: 0x2B3038,
      roughness: 0.52,
      metalness: 0.45
    });
  }

  _clearGroup(group) {
    while (group.children.length > 0) {
      const child = group.children.pop();
      if (child.children && child.children.length) {
        this._clearGroup(child);
      }
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
  }

  setModule(moduleId) {
    if (this.activeModule === moduleId && Object.keys(this.refs).length > 0) return;
    this.activeModule = moduleId;
    this._buildModuleScene(moduleId);
    this.setCameraPreset('default');
  }

  setCameraPreset(preset) {
    const map = {
      titration: { pos: [0, 2.35, 9.15], target: [0, 2.08, 0] },
      qualitative: { pos: [0.1, 2.15, 6.4], target: [0.1, 1.32, 0] },
      bohr: { pos: [0, 2.65, 7.6], target: [0, 1.95, 0] },
      vsepr: { pos: [0.35, 2.25, 6.6], target: [0, 1.72, 0] },
      equilibrium: { pos: [0, 2.45, 7.0], target: [0, 1.5, 0] },
      electrochem: { pos: [0, 2.35, 7.15], target: [0, 1.45, 0] },
      organic: { pos: [0, 2.25, 6.8], target: [0, 1.5, 0] },
      gaslaws: { pos: [0, 2.05, 6.9], target: [0, 1.35, 0] }
    };
    const base = map[this.activeModule] || { pos: [0, 2.5, 7.2], target: [0, 1.5, 0] };
    const w = this.mountEl?.clientWidth || 800;
    const h = this.mountEl?.clientHeight || 540;
    const portraitZoom = w < 640 ? 1.28 : 1.0;

    if (preset === 'top') {
      this.camera.position.set(0, 7.6 * portraitZoom, 1.2);
      this.controls.target.set(base.target[0], base.target[1] * 0.6, base.target[2]);
    } else if (preset === 'close') {
      this.camera.position.set(base.pos[0] * 0.6, base.pos[1] * 0.88, base.pos[2] * 0.68 * portraitZoom);
      this.controls.target.set(...base.target);
    } else if (preset === 'side') {
      this.camera.position.set(5.6 * portraitZoom, base.pos[1], 3.2 * portraitZoom);
      this.controls.target.set(...base.target);
    } else {
      const yOffset = w < 640 ? 0.35 : 0;
      this.camera.position.set(base.pos[0], base.pos[1] + yOffset, base.pos[2] * portraitZoom);
      this.controls.target.set(base.target[0], base.target[1] + yOffset * 0.75, base.target[2]);
    }
    this.controls.update();
  }

  triggerDrop() {
    this.dropTimer = 0.65;
  }

  triggerPhoton() {
    this.photonTimer = 1.0;
  }

  _buildModuleScene(moduleId) {
    this._clearGroup(this.moduleGroup);
    this.refs = {};

    if (moduleId === 'titration') this._buildTitrationBench();
    else if (moduleId === 'qualitative') this._buildQualitativeBench();
    else if (moduleId === 'bohr') this._buildBohrBench();
    else if (moduleId === 'vsepr') this._buildVseprBench();
    else if (moduleId === 'equilibrium') this._buildEquilibriumBench();
    else if (moduleId === 'electrochem') this._buildElectrochemBench();
    else if (moduleId === 'organic') this._buildOrganicBench();
    else if (moduleId === 'gaslaws') this._buildGasLawsBench();
  }

  /* =========================================================================
     01. ACID-BASE TITRATION BENCH
     ========================================================================= */
  _buildTitrationBench() {
    const g = this.moduleGroup;
    const iron = this._ironMat();
    const brass = this._brassMat();
    const glass = this._glassMat(0.25);

    // Retort stand base + rod + clamp
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.3), iron);
    base.position.set(-0.65, 0.06, -0.1);
    g.add(base);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.35, 20), brass);
    rod.position.set(-1.25, 2.22, -0.1);
    g.add(rod);

    const clampArm = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.07, 0.07), brass);
    clampArm.position.set(-0.62, 2.95, 0);
    g.add(clampArm);

    // White porcelain tile + magnetic stirrer plate
    const stirrer = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.22, 1.45),
      new THREE.MeshStandardMaterial({ color: 0xF8F7F4, roughness: 0.25, metalness: 0.05 })
    );
    stirrer.position.set(0, 0.11, 0);
    g.add(stirrer);

    // Conical Erlenmeyer Flask (frustum + neck + rim)
    const flaskOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.66, 1.05, 36, 1, true), glass);
    flaskOuter.position.set(0, 0.75, 0);
    g.add(flaskOuter);

    const flaskBottom = new THREE.Mesh(new THREE.CircleGeometry(0.65, 36), glass);
    flaskBottom.rotation.x = Math.PI / 2;
    flaskBottom.position.set(0, 0.23, 0);
    g.add(flaskBottom);

    const flaskNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.42, 32, 1, true), glass);
    flaskNeck.position.set(0, 1.48, 0);
    g.add(flaskNeck);

    const flaskRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.022, 12, 32),
      this._glassMat(0.48)
    );
    flaskRim.rotation.x = Math.PI / 2;
    flaskRim.position.set(0, 1.69, 0);
    g.add(flaskRim);

    // Analyte + indicator solution inside conical flask
    const analyteMat = new THREE.MeshStandardMaterial({
      color: 0xDCEAF7,
      transparent: true,
      opacity: 0.78,
      roughness: 0.15
    });
    const analyteLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.62, 0.42, 32), analyteMat);
    analyteLiquid.position.set(0, 0.45, 0);
    g.add(analyteLiquid);

    // Magnetic PTFE stir bar inside flask
    const stirBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.038, 0.22, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 })
    );
    stirBar.rotation.z = Math.PI / 2;
    stirBar.position.set(0, 0.27, 0);
    g.add(stirBar);

    // Graduated 50 mL Glass Burette above flask
    const buretteTube = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 2.05, 28, 1, true), glass);
    buretteTube.position.set(0, 3.05, 0);
    g.add(buretteTube);

    // Graduation rings along burette
    for (let i = 0; i <= 10; i++) {
      const tick = new THREE.Mesh(
        new THREE.TorusGeometry(0.097, 0.005, 6, 24),
        new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0x134E4A : 0x525A65 })
      );
      tick.rotation.x = Math.PI / 2;
      tick.position.set(0, 2.15 + i * 0.175, 0);
      g.add(tick);
    }

    // Titrant column inside burette
    const titrantMat = new THREE.MeshStandardMaterial({
      color: 0xCBE3EC,
      transparent: true,
      opacity: 0.72,
      roughness: 0.12
    });
    const buretteLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 1.75, 24), titrantMat);
    buretteLiquid.position.set(0, 3.02, 0);
    g.add(buretteLiquid);

    // Stopcock body + handle + nozzle tip
    const stopcock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0x134E4A, roughness: 0.35 })
    );
    stopcock.rotation.z = Math.PI / 2;
    stopcock.position.set(0, 1.98, 0);
    g.add(stopcock);

    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.018, 0.22, 16), glass);
    tip.position.set(0, 1.84, 0);
    g.add(tip);

    // Falling droplet sphere
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x9BD0E8, roughness: 0.1 })
    );
    drop.position.set(0, 1.7, 0);
    drop.visible = false;
    g.add(drop);

    this.refs = { analyteLiquid, analyteMat, buretteLiquid, stirBar, drop, stopcock };
  }

  /* =========================================================================
     02. QUALITATIVE SALT & COBALT GLASS FLAME LAB
     ========================================================================= */
  _buildQualitativeBench() {
    const g = this.moduleGroup;
    const brass = this._brassMat();
    const glass = this._glassMat(0.26);

    // Left: Brass Bunsen Burner
    const burnerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 28), brass);
    burnerBase.position.set(-1.35, 0.06, 0);
    g.add(burnerBase);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 1.05, 24), brass);
    barrel.position.set(-1.35, 0.64, 0);
    g.add(barrel);

    // Inner blue reducing cone
    const innerCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.85 })
    );
    innerCone.position.set(-1.35, 1.37, 0);
    g.add(innerCone);

    // Outer cation emission flame mantle
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xFFB703,
      transparent: true,
      opacity: 0.78
    });
    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.05, 28), outerFlameMat);
    outerFlame.position.set(-1.35, 1.68, 0);
    g.add(outerFlame);

    // Glass handle + Platinum wire loop + salt bead in flame
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.1, 16),
      this._glassMat(0.55)
    );
    handle.rotation.z = 0.22;
    handle.position.set(-2.35, 1.25, 0);
    g.add(handle);

    const ptWire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.65, 12),
      new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9, roughness: 0.15 })
    );
    ptWire.rotation.z = Math.PI / 2 - 0.12;
    ptWire.position.set(-1.68, 1.42, 0);
    g.add(ptWire);

    // Swinging Blue Cobalt Silicate Glass Filter Frame in front of flame
    const filterGroup = new THREE.Group();
    filterGroup.position.set(-1.35, 1.62, 0.85);
    const filterFrame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.12, 0.045), brass);
    // Cutout frame look using thin glass pane in front
    filterFrame.scale.set(1, 0.08, 1);
    filterFrame.position.y = -0.54;
    filterGroup.add(filterFrame);

    const topFrame = filterFrame.clone();
    topFrame.position.y = 0.54;
    filterGroup.add(topFrame);

    const cobaltPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 1.02, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x1D4ED8,
        transparent: true,
        opacity: 0.52,
        roughness: 0.06,
        depthWrite: false
      })
    );
    filterGroup.add(cobaltPane);
    g.add(filterGroup);

    // Right: Oak Analytical Test-Tube Rack + 2 Test Tubes (Tube A = Cation, Tube B = Anion)
    const oakMat = new THREE.MeshStandardMaterial({ color: 0x9C6F44, roughness: 0.62 });
    const rackBottom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.72), oakMat);
    rackBottom.position.set(1.25, 0.06, 0);
    g.add(rackBottom);

    const rackTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.09, 0.72), oakMat);
    rackTop.position.set(1.25, 1.12, 0);
    g.add(rackTop);

    [-0.92, 0.92].forEach((dx) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.64), oakMat);
      post.position.set(1.25 + dx, 0.58, 0);
      g.add(post);
    });

    const buildTube = (x) => {
      const tubeWall = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.55, 24, 1, true), glass);
      tubeWall.position.set(x, 0.95, 0);
      g.add(tubeWall);

      const tubeCap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass);
      tubeCap.position.set(x, 0.18, 0);
      g.add(tubeCap);

      const solMat = new THREE.MeshStandardMaterial({
        color: 0xE2E8F0,
        transparent: true,
        opacity: 0.68,
        roughness: 0.14
      });
      const sol = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.78, 22), solMat);
      sol.position.set(x, 0.62, 0);
      g.add(sol);

      const pptMat = new THREE.MeshStandardMaterial({
        color: 0xF8FAFC,
        roughness: 0.75
      });
      const ppt = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.132, 0.28, 22), pptMat);
      ppt.position.set(x, 0.34, 0);
      ppt.visible = false;
      g.add(ppt);

      return { sol, solMat, ppt, pptMat };
    };

    const tubeA = buildTube(0.82);
    const tubeB = buildTube(1.68);

    this.refs = { outerFlame, outerFlameMat, innerCone, filterGroup, tubeA, tubeB };
  }

  /* =========================================================================
     03. BOHR QUANTUM ORBITS & RYDBERG PHOTON BENCH
     ========================================================================= */
  _buildBohrBench() {
    const g = this.moduleGroup;
    const center = new THREE.Vector3(0, 2.05, 0);

    // Pedestal stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.14, 28), this._brassMat());
    stand.position.set(0, 0.07, 0);
    g.add(stand);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.98, 16), this._brassMat());
    stem.position.set(0, 1.06, 0);
    g.add(stem);

    // Nucleus cluster
    const nucleus = new THREE.Group();
    nucleus.position.copy(center);
    const protonMat = new THREE.MeshStandardMaterial({ color: 0xB83A2D, roughness: 0.28 });
    const neutronMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.35 });
    const offsets = [
      [0, 0, 0], [0.09, 0.07, 0.05], [-0.08, 0.06, -0.04], [0.05, -0.08, 0.06]
    ];
    offsets.forEach((o, idx) => {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 18), idx % 2 === 0 ? protonMat : neutronMat);
      sp.position.set(...o);
      nucleus.add(sp);
    });
    g.add(nucleus);

    // 6 Quantized concentric orbital rings
    const rings = [];
    for (let n = 1; n <= 6; n++) {
      const radius = 0.36 + n * 0.27;
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x94A3B8,
        roughness: 0.35,
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 12, 64), ringMat);
      ring.position.copy(center);
      ring.rotation.x = 0.32;
      g.add(ring);
      rings.push({ n, radius, mesh: ring, mat: ringMat });
    }

    // Orbiting quantized electron sphere
    const electron = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x134E4A, emissive: 0x0F766E, emissiveIntensity: 0.45, roughness: 0.2 })
    );
    g.add(electron);

    // Emitted sinusoidal photon wave line
    const wavePoints = [];
    for (let i = 0; i <= 60; i++) {
      wavePoints.push(new THREE.Vector3(i * 0.05, Math.sin(i * 0.7) * 0.11, 0));
    }
    const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePoints);
    const waveMat = new THREE.LineBasicMaterial({ color: 0xE11D48, linewidth: 2 });
    const photonWave = new THREE.Line(waveGeo, waveMat);
    photonWave.position.copy(center);
    g.add(photonWave);

    this.refs = { center, nucleus, rings, electron, photonWave, waveMat };
  }

  /* =========================================================================
     04. VSEPR 3D MOLECULAR GEOMETRY & LONE PAIRS
     ========================================================================= */
  _buildVseprBench() {
    const g = this.moduleGroup;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.74, 0.12, 28), this._brassMat());
    base.position.set(0, 0.06, 0);
    g.add(base);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.75, 16), this._brassMat());
    post.position.set(0, 0.92, 0);
    g.add(post);

    const moleculeGroup = new THREE.Group();
    moleculeGroup.position.set(0, 1.85, 0);
    g.add(moleculeGroup);

    this.refs = { moleculeGroup, lastVseprKey: '' };
  }

  _rebuildVseprGeometry(bp, lp, calc) {
    const key = `${bp}-${lp}`;
    if (this.refs.lastVseprKey === key) return;
    this.refs.lastVseprKey = key;

    const mg = this.refs.moleculeGroup;
    this._clearGroup(mg);

    // Central atom
    const central = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0x134E4A, roughness: 0.28, metalness: 0.15 })
    );
    mg.add(central);

    // Compute accurate 3D unit vectors for bonds vs lone pairs
    const bondDirs = [];
    const loneDirs = [];
    const deg = (d) => (d * Math.PI) / 180;

    if (bp === 2 && lp === 0) {
      bondDirs.push([1, 0, 0], [-1, 0, 0]);
    } else if (bp === 3 && lp === 0) {
      for (let i = 0; i < 3; i++) bondDirs.push([Math.cos((i * 2 * Math.PI) / 3), 0, Math.sin((i * 2 * Math.PI) / 3)]);
    } else if (bp === 2 && lp === 1) {
      const half = deg(119 / 2);
      bondDirs.push([Math.sin(half), -Math.cos(half), 0], [-Math.sin(half), -Math.cos(half), 0]);
      loneDirs.push([0, 1, 0]);
    } else if (bp === 4 && lp === 0) {
      const t = 1 / Math.sqrt(3);
      bondDirs.push([t, t, t], [-t, -t, t], [-t, t, -t], [t, -t, -t]);
    } else if (bp === 3 && lp === 1) {
      // Trigonal pyramidal (107 deg)
      loneDirs.push([0, 1, 0]);
      const phi = deg(109.5 + 1.8);
      for (let i = 0; i < 3; i++) {
        const az = (i * 2 * Math.PI) / 3;
        bondDirs.push([Math.sin(phi) * Math.cos(az), Math.cos(phi), Math.sin(phi) * Math.sin(az)]);
      }
    } else if (bp === 2 && lp === 2) {
      // Bent H2O (104.5 deg) in XY plane + 2 lone pairs in YZ plane
      const halfB = deg(104.5 / 2);
      bondDirs.push([Math.sin(halfB), -Math.cos(halfB), 0], [-Math.sin(halfB), -Math.cos(halfB), 0]);
      const halfL = deg(114 / 2);
      loneDirs.push([0, Math.cos(halfL), Math.sin(halfL)], [0, Math.cos(halfL), -Math.sin(halfL)]);
    } else if (bp + lp === 5) {
      // Trigonal bipyramidal: equatorial first for lone pairs!
      const eq = [
        [1, 0, 0],
        [-0.5, 0, Math.sqrt(3) / 2],
        [-0.5, 0, -Math.sqrt(3) / 2]
      ];
      const ax = [[0, 1, 0], [0, -1, 0]];
      for (let i = 0; i < lp; i++) loneDirs.push(eq[i]);
      for (let i = lp; i < 3; i++) bondDirs.push(eq[i]);
      ax.forEach((a) => bondDirs.push(a));
    } else {
      // Steric 6 (Octahedral, Square Pyramidal, Square Planar)
      const axes = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
      if (lp === 0) axes.forEach((a) => bondDirs.push(a));
      else if (lp === 1) {
        axes.slice(0, 5).forEach((a) => bondDirs.push(a));
        loneDirs.push(axes[5]);
      } else {
        axes.slice(0, 4).forEach((a) => bondDirs.push(a));
        loneDirs.push(axes[4], axes[5]);
      }
    }

    const bondLen = 1.28;
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.3, metalness: 0.35 });
    const ligandMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.25 });

    bondDirs.forEach((dir) => {
      const v = new THREE.Vector3(...dir).normalize();
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, bondLen, 16), stickMat);
      stick.position.copy(v).multiplyScalar(bondLen * 0.5);
      stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
      mg.add(stick);

      const atom = new THREE.Mesh(new THREE.SphereGeometry(0.20, 24, 24), ligandMat);
      atom.position.copy(v).multiplyScalar(bondLen);
      mg.add(atom);
    });

    // Translucent golden-amber pear-shaped Lone-Pair orbitals + dual electron dots
    const lobeMat = new THREE.MeshStandardMaterial({
      color: 0xD97706,
      transparent: true,
      opacity: 0.38,
      roughness: 0.12,
      depthWrite: false
    });
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xB83A2D });

    loneDirs.forEach((dir) => {
      const v = new THREE.Vector3(...dir).normalize();
      const lobeGroup = new THREE.Group();
      lobeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);

      const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.30, 24, 24), lobeMat);
      lobe.scale.set(0.82, 1.45, 0.82);
      lobe.position.y = 0.62;
      lobeGroup.add(lobe);

      [-0.08, 0.08].forEach((ox) => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), dotMat);
        dot.position.set(ox, 0.68, 0);
        lobeGroup.add(dot);
      });

      mg.add(lobeGroup);
    });
  }

  /* =========================================================================
     05. HABER CATALYTIC REACTOR & LE CHATELIER EQUILIBRIUM
     ========================================================================= */
  _buildEquilibriumBench() {
    const g = this.moduleGroup;
    const brass = this._brassMat();
    const glass = this._glassMat(0.24);

    // Reactor chamber cylinder with movable compression piston at top
    const floorPlate = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.18, 36), this._ironMat());
    floorPlate.position.set(0, 0.09, 0);
    g.add(floorPlate);

    // Heating coil ring on base
    const heaterMat = new THREE.MeshStandardMaterial({
      color: 0xB83A2D,
      emissive: 0x991B1B,
      emissiveIntensity: 0.35,
      roughness: 0.4
    });
    const heaterRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.06, 12, 40), heaterMat);
    heaterRing.rotation.x = Math.PI / 2;
    heaterRing.position.set(0, 0.22, 0);
    g.add(heaterRing);

    // Porous Fe + Mo Catalyst Bed spheres
    const catGroup = new THREE.Group();
    const catMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.72, metalness: 0.55 });
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2;
      const rad = 0.25 + (i % 4) * 0.27;
      const pellet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085), catMat);
      pellet.position.set(Math.cos(angle) * rad, 0.26, Math.sin(angle) * rad);
      catGroup.add(pellet);
    }
    g.add(catGroup);

    // Borosilicate reactor cylinder
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 2.55, 40, 1, true), glass);
    wall.position.set(0, 1.46, 0);
    g.add(wall);

    // Movable heavy brass compression piston head
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 0.16, 36), brass);
    piston.position.set(0, 2.4, 0);
    g.add(piston);

    // 32 gas molecules (dynamically switched between reactant N2/H2 and product NH3)
    const particles = [];
    const n2Mat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.25 });
    const h2Mat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.25 });
    const nh3Mat = new THREE.MeshStandardMaterial({ color: 0xB83A2D, roughness: 0.22 });

    for (let i = 0; i < 32; i++) {
      const pGroup = new THREE.Group();
      const sphereMain = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), n2Mat);
      const sphereSub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), h2Mat);
      sphereSub.position.set(0.11, 0.04, 0);
      pGroup.add(sphereMain, sphereSub);

      pGroup.position.set(
        (Math.random() - 0.5) * 1.8,
        0.5 + Math.random() * 1.6,
        (Math.random() - 0.5) * 1.8
      );
      g.add(pGroup);
      particles.push({
        group: pGroup,
        sphereMain,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.3,
          (Math.random() - 0.5) * 1.5
        ),
        n2Mat,
        h2Mat,
        nh3Mat
      });
    }

    this.refs = { catGroup, piston, heaterMat, particles };
  }

  /* =========================================================================
     06. DANIELL GALVANIC CELL & FARADAY ELECTROLYSIS BENCH
     ========================================================================= */
  _buildElectrochemBench() {
    const g = this.moduleGroup;
    const glass = this._glassMat(0.25);
    const brass = this._brassMat();

    const makeBeaker = (x, liquidColor, plateColor) => {
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.48, 32, 1, true), glass);
      outer.position.set(x, 0.76, 0);
      g.add(outer);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.02, 10, 32), this._glassMat(0.45));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 1.5, 0);
      g.add(rim);

      const liqMat = new THREE.MeshStandardMaterial({
        color: liquidColor,
        transparent: true,
        opacity: 0.66,
        roughness: 0.14
      });
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.06, 30), liqMat);
      liq.position.set(x, 0.55, 0);
      g.add(liq);

      const plateMat = new THREE.MeshStandardMaterial({
        color: plateColor,
        roughness: 0.32,
        metalness: 0.75
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.42, 0.06), plateMat);
      plate.position.set(x + (x < 0 ? -0.22 : 0.22), 1.05, 0);
      g.add(plate);

      return { liq, liqMat, plate, plateMat };
    };

    const leftCell = makeBeaker(-1.35, 0xE2E8F0, 0x94A3B8);   // Anode (Zn / Mg)
    const rightCell = makeBeaker(1.35, 0x2563EB, 0xB85D38);   // Cathode (Cu / Ag)

    // Inverted U-Tube KCl Salt Bridge connecting both beakers
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.92, 0.75, 0),
      new THREE.Vector3(-0.85, 1.82, 0),
      new THREE.Vector3(0, 2.02, 0),
      new THREE.Vector3(0.85, 1.82, 0),
      new THREE.Vector3(0.92, 0.75, 0)
    ]);
    const saltBridge = new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 40, 0.095, 16, false),
      this._glassMat(0.42, 0xF1F5F9)
    );
    g.add(saltBridge);

    // Overhead wire arch + central brass Voltmeter / DC Power unit
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.57, 1.76, 0),
      new THREE.Vector3(-1.2, 2.75, 0),
      new THREE.Vector3(0, 2.85, 0),
      new THREE.Vector3(1.2, 2.75, 0),
      new THREE.Vector3(1.57, 1.76, 0)
    ]);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 36, 0.022, 10, false), brass);
    g.add(wire);

    const meterBox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.56, 0.22), brass);
    meterBox.position.set(0, 2.86, 0);
    g.add(meterBox);

    const meterFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xFAF9F5 })
    );
    meterFace.position.set(0, 2.86, 0.115);
    g.add(meterFace);

    // Drifting electrons along external wire
    const electrons = [];
    const eMat = new THREE.MeshBasicMaterial({ color: 0x134E4A });
    for (let i = 0; i < 7; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), eMat);
      g.add(dot);
      electrons.push({ mesh: dot, phase: i / 7 });
    }

    this.refs = { leftCell, rightCell, wireCurve, electrons };
  }

  /* =========================================================================
     07. ORGANIC STEREOCHEMISTRY (CIS-TRANS & OPTICAL POLARIMETER)
     ========================================================================= */
  _buildOrganicBench() {
    const g = this.moduleGroup;

    // Group A: Geometric Cis/Trans 1,2-dichloroethene model
    const alkeneGroup = new THREE.Group();
    alkeneGroup.position.set(0, 1.65, 0);
    g.add(alkeneGroup);

    const cMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3 });
    const hMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.25 });
    const clMat = new THREE.MeshStandardMaterial({ color: 0x1F6E4A, roughness: 0.25 });
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.3 });

    const cLeft = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), cMat);
    cLeft.position.set(-0.68, 0, 0);
    const cRight = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), cMat);
    cRight.position.set(0.68, 0, 0);
    alkeneGroup.add(cLeft, cRight);

    // Double bond bars (sigma + pi)
    [-0.08, 0.08].forEach((dy) => {
      const db = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.36, 16), stickMat);
      db.rotation.z = Math.PI / 2;
      db.position.set(0, dy, 0);
      alkeneGroup.add(db);
    });

    // Left substituents (fixed: Cl top-left, H bottom-left)
    const addSub = (parent, fromX, toX, toY, isCl) => {
      const from = new THREE.Vector3(fromX, 0, 0);
      const to = new THREE.Vector3(toX, toY, 0);
      const dir = new THREE.Vector3().subVectors(to, from);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, dir.length(), 14), stickMat);
      bar.position.copy(from).addScaledVector(dir, 0.5);
      bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      parent.add(bar);

      const sp = new THREE.Mesh(new THREE.SphereGeometry(isCl ? 0.25 : 0.15, 22, 22), isCl ? clMat : hMat);
      sp.position.copy(to);
      parent.add(sp);
      return { bar, sp };
    };

    addSub(alkeneGroup, -0.68, -1.35, 0.78, true);
    addSub(alkeneGroup, -0.68, -1.35, -0.78, false);

    // Right substituent pivot (rotates 0 deg for cis, 180 deg around X for trans!)
    const rightPivot = new THREE.Group();
    addSub(rightPivot, 0.68, 1.35, 0.78, true);
    addSub(rightPivot, 0.68, 1.35, -0.78, false);
    alkeneGroup.add(rightPivot);

    // Net Dipole Arrow above alkene
    const dipoleArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0.35, 0),
      1.05,
      0xB83A2D,
      0.24,
      0.16
    );
    alkeneGroup.add(dipoleArrow);

    // Group B: Biot Optical Polarimeter + Chiral Enantiomers
    const polarGroup = new THREE.Group();
    polarGroup.visible = false;
    g.add(polarGroup);

    // Sample glass polarimeter tube along X axis
    const sampleTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 3.2, 28, 1, true),
      this._glassMat(0.32, 0xE0F2FE)
    );
    sampleTube.rotation.z = Math.PI / 2;
    sampleTube.position.set(0, 1.35, 0);
    polarGroup.add(sampleTube);

    // Polarizer disc (left) + rotatable Analyzer disc (right)
    const polarizer = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.06, 32), this._brassMat());
    polarizer.rotation.z = Math.PI / 2;
    polarizer.position.set(-2.05, 1.35, 0);
    polarGroup.add(polarizer);

    const analyzerGroup = new THREE.Group();
    analyzerGroup.position.set(2.05, 1.35, 0);
    const analyzerDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.06, 32), this._brassMat());
    analyzerDisc.rotation.z = Math.PI / 2;
    const slitBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.98, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xB83A2D })
    );
    analyzerGroup.add(analyzerDisc, slitBar);
    polarGroup.add(analyzerGroup);

    // Plane-polarized light wave ribbon twisting inside tube
    const ribbonPts = [];
    for (let i = 0; i <= 60; i++) ribbonPts.push(new THREE.Vector3(-2.0 + (i / 60) * 4.0, 1.35, 0));
    const ribbonGeo = new THREE.BufferGeometry().setFromPoints(ribbonPts);
    const ribbonLine = new THREE.Line(
      ribbonGeo,
      new THREE.LineBasicMaterial({ color: 0xD97706, linewidth: 2 })
    );
    polarGroup.add(ribbonLine);

    this.refs = { alkeneGroup, rightPivot, dipoleArrow, polarGroup, analyzerGroup, ribbonLine };
  }

  /* =========================================================================
     08. GRAHAM'S DIFFUSION TUBE & NH4Cl SMOKE RING BENCH
     ========================================================================= */
  _buildGasLawsBench() {
    const g = this.moduleGroup;
    const brass = this._brassMat();
    const glass = this._glassMat(0.24);

    // Twin brass retort stands holding horizontal glass diffusion tube
    [-2.1, 2.1].forEach((x) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.9), this._ironMat());
      foot.position.set(x, 0.05, 0);
      g.add(foot);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.52, 16), brass);
      post.position.set(x, 0.81, 0);
      g.add(post);
    });

    // Horizontal calibrated glass diffusion tube (width = 4.8 world units mapped to 0..L cm)
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 4.8, 32, 1, true), glass);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 1.52, 0);
    g.add(tube);

    // Ruler scale ticks along glass tube
    for (let i = 0; i <= 10; i++) {
      const tick = new THREE.Mesh(
        new THREE.TorusGeometry(0.244, 0.006, 6, 24),
        new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0x134E4A : 0x64748B })
      );
      tick.rotation.y = Math.PI / 2;
      tick.position.set(-2.2 + i * 0.44, 1.52, 0);
      g.add(tick);
    }

    // Left cotton plug soaked in NH3 (blue-tinted neck) + Right cotton plug soaked in HX (amber-red neck)
    const leftPlug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.28, 20),
      new THREE.MeshStandardMaterial({ color: 0x3B82F6, roughness: 0.85 })
    );
    leftPlug.rotation.z = Math.PI / 2;
    leftPlug.position.set(-2.32, 1.52, 0);
    g.add(leftPlug);

    const rightPlug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.28, 20),
      new THREE.MeshStandardMaterial({ color: 0xB83A2D, roughness: 0.85 })
    );
    rightPlug.rotation.z = Math.PI / 2;
    rightPlug.position.set(2.32, 1.52, 0);
    g.add(rightPlug);

    // Translucent diffusing gas fronts
    const nh3Cloud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.20, 1.0, 20),
      new THREE.MeshBasicMaterial({ color: 0x60A5FA, transparent: true, opacity: 0.22, depthWrite: false })
    );
    nh3Cloud.rotation.z = Math.PI / 2;
    nh3Cloud.position.set(-2.2, 1.52, 0);
    g.add(nh3Cloud);

    const hxCloud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.20, 1.0, 20),
      new THREE.MeshBasicMaterial({ color: 0xF87171, transparent: true, opacity: 0.22, depthWrite: false })
    );
    hxCloud.rotation.z = Math.PI / 2;
    hxCloud.position.set(2.2, 1.52, 0);
    g.add(hxCloud);

    // Crystallized solid white NH4Cl / NH4Br ring!
    const whiteRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.055, 16, 36),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.35, emissive: 0xE2E8F0, emissiveIntensity: 0.25 })
    );
    whiteRing.rotation.y = Math.PI / 2;
    whiteRing.position.set(0.4, 1.52, 0);
    whiteRing.visible = false;
    g.add(whiteRing);

    this.refs = { nh3Cloud, hxCloud, whiteRing };
  }

  /* =========================================================================
     SYNCHRONIZE STATE + CALCULATIONS TO 3D SCENE
     ========================================================================= */
  syncState(moduleId, state, calc) {
    if (this.activeModule !== moduleId) {
      this.setModule(moduleId);
    }

    if (moduleId === 'titration' && this.refs.analyteLiquid) {
      this.refs.analyteMat.color.set(calc.colorHex || '#DCEAF7');
      const volScale = 0.72 + (state.titration.vAdded / 50) * 0.65;
      this.refs.analyteLiquid.scale.y = volScale;
      this.refs.analyteLiquid.position.y = 0.24 + 0.21 * volScale;

      const remFrac = Math.max(0.06, 1 - state.titration.vAdded / 50);
      this.refs.buretteLiquid.scale.y = remFrac;
      this.refs.buretteLiquid.position.y = 2.14 + (1.75 * remFrac) * 0.5;
    } else if (moduleId === 'qualitative' && this.refs.outerFlame) {
      const st = state.qualitative;
      const salt = calc.salt;
      this.refs.filterGroup.position.x = st.cobaltGlass ? -1.35 : -2.65;
      this.refs.filterGroup.position.z = st.cobaltGlass ? 0.85 : -0.45;

      const flameHex = st.cobaltGlass ? salt.cobaltFlameHex : salt.nakedFlameHex;
      this.refs.outerFlameMat.color.set(flameHex);
      this.refs.outerFlameMat.opacity = st.cobaltGlass && salt.key === 'NaCl' ? 0.14 : 0.82;

      // Wet Test Tube A (Cation + K4[Fe(CN)6])
      this.refs.tubeA.solMat.color.set(salt.solutionHex);
      this.refs.tubeA.ppt.visible = Boolean(st.addedFerrocyanide);
      this.refs.tubeA.pptMat.color.set(salt.ferrocyanideHex);

      // Wet Test Tube B (Anion + AgNO3 / BaCl2)
      this.refs.tubeB.solMat.color.set(salt.solutionHex);
      this.refs.tubeB.ppt.visible = Boolean(st.addedAnionReagent);
      this.refs.tubeB.pptMat.color.set(salt.anionPptHex);
    } else if (moduleId === 'bohr' && this.refs.rings) {
      this.refs.rings.forEach((r) => {
        const isLower = r.n === calc.n1;
        const isUpper = r.n === calc.n2;
        r.mat.color.set(isLower ? '#134E4A' : isUpper ? '#B83A2D' : '#94A3B8');
        r.mat.opacity = isLower || isUpper ? 0.95 : 0.35;
      });
      this.refs.waveMat.color.set(calc.photonHex);
      this.refs.activeBohr = calc;
    } else if (moduleId === 'vsepr' && this.refs.moleculeGroup) {
      this._rebuildVseprGeometry(state.vsepr.bp, state.vsepr.lp, calc);
    } else if (moduleId === 'equilibrium' && this.refs.piston) {
      const st = state.equilibrium;
      this.refs.catGroup.visible = Boolean(st.catalyst);
      // Piston compresses downward as pressure increases 50 -> 400 atm
      const pFrac = (st.pressureAtm - 50) / 350;
      this.refs.piston.position.y = 2.55 - pFrac * 0.85;
      this.refs.heaterMat.emissiveIntensity = 0.12 + ((st.tempC - 300) / 350) * 0.85;
      this.refs.activeEquilibrium = { st, calc };
    } else if (moduleId === 'electrochem' && this.refs.leftCell) {
      const st = state.electrochem;
      this.refs.leftCell.liqMat.color.set(calc.anode.ionColor);
      this.refs.leftCell.plateMat.color.set(calc.anode.metalColor);
      this.refs.rightCell.liqMat.color.set(calc.cathode.ionColor);
      this.refs.rightCell.plateMat.color.set(calc.cathode.metalColor);

      const plateBoost = st.mode === 'faraday' ? 1 + Math.min(1.6, calc.depositedMassG * 0.32) : 1.0;
      this.refs.rightCell.plate.scale.z = plateBoost;
      this.refs.rightCell.plate.scale.x = 1 + (plateBoost - 1) * 0.35;
      this.refs.activeElectro = { st, calc };
    } else if (moduleId === 'organic' && this.refs.alkeneGroup) {
      const st = state.organic;
      const isGeo = st.submode === 'geometric';
      this.refs.alkeneGroup.visible = isGeo;
      this.refs.polarGroup.visible = !isGeo;

      if (isGeo) {
        this.refs.rightPivot.rotation.x = st.configuration === 'cis' ? 0 : Math.PI;
        this.refs.dipoleArrow.visible = calc.dipoleDebye > 0.05;
      } else {
        const rotRad = (calc.observedRotationDeg * 3.5 * Math.PI) / 180;
        this.refs.analyzerGroup.rotation.x = rotRad;

        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const frac = i / 60;
          const x = -2.0 + frac * 4.0;
          const twist = frac * rotRad;
          const amp = Math.sin(frac * Math.PI * 6) * 0.24;
          pts.push(new THREE.Vector3(x, 1.35 + Math.cos(twist) * amp, Math.sin(twist) * amp));
        }
        this.refs.ribbonLine.geometry.setFromPoints(pts);
      }
    } else if (moduleId === 'gaslaws' && this.refs.whiteRing) {
      const st = state.gaslaws;
      const prog = Math.max(0, Math.min(1, st.progress));
      const ringFrac = calc.x1Cm / st.tubeLengthCm; // 0..1 from left (-2.2) to right (+2.2)
      const targetX = -2.2 + ringFrac * 4.4;

      const nh3Len = Math.max(0.05, prog * (ringFrac * 4.4));
      this.refs.nh3Cloud.scale.y = nh3Len;
      this.refs.nh3Cloud.position.x = -2.2 + nh3Len * 0.5;

      const hxLen = Math.max(0.05, prog * ((1 - ringFrac) * 4.4));
      this.refs.hxCloud.scale.y = hxLen;
      this.refs.hxCloud.position.x = 2.2 - hxLen * 0.5;

      this.refs.whiteRing.position.x = targetX;
      this.refs.whiteRing.visible = prog >= 0.92;
      const pulse = 0.85 + prog * 0.3;
      this.refs.whiteRing.scale.set(pulse, pulse, pulse);
    }
  }

  _startLoop() {
    const step = () => {
      this.animFrame = requestAnimationFrame(step);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.elapsedTime;

      this.controls.update();

      if (this.activeModule === 'titration' && this.refs.stirBar) {
        this.refs.stirBar.rotation.y += dt * 9.5;
        if (this.dropTimer > 0) {
          this.dropTimer -= dt;
          const frac = 1 - Math.max(0, this.dropTimer) / 0.65;
          this.refs.drop.visible = true;
          this.refs.drop.position.y = 1.72 - frac * 1.15;
        } else if (this.refs.drop) {
          this.refs.drop.visible = false;
        }
      } else if (this.activeModule === 'qualitative' && this.refs.outerFlame) {
        const flicker = 1 + Math.sin(elapsed * 19) * 0.045 + Math.cos(elapsed * 11) * 0.03;
        this.refs.outerFlame.scale.set(1, flicker, 1);
      } else if (this.activeModule === 'bohr' && this.refs.electron && this.refs.activeBohr) {
        const b = this.refs.activeBohr;
        const rLower = 0.36 + b.n1 * 0.27;
        const rUpper = 0.36 + b.n2 * 0.27;
        if (this.photonTimer > 0) this.photonTimer = Math.max(0, this.photonTimer - dt * 1.3);
        const radius = rLower + (rUpper - rLower) * this.photonTimer;
        const ang = elapsed * (3.2 / Math.max(1, b.n1));
        this.refs.electron.position.set(
          Math.cos(ang) * radius,
          2.05 + Math.sin(ang) * radius * Math.sin(0.32),
          Math.sin(ang) * radius * Math.cos(0.32)
        );
        this.refs.photonWave.visible = true;
        this.refs.photonWave.position.x = (elapsed * 1.6) % 1.4;
      } else if (this.activeModule === 'vsepr' && this.refs.moleculeGroup) {
        this.refs.moleculeGroup.rotation.y = Math.sin(elapsed * 0.45) * 0.35;
      } else if (this.activeModule === 'equilibrium' && this.refs.particles && this.refs.activeEquilibrium) {
        const { st, calc } = this.refs.activeEquilibrium;
        const ceilY = this.refs.piston.position.y - 0.14;
        const speedMul = (0.65 + (st.tempC - 300) / 300) * (st.catalyst ? 1.35 : 0.85);
        const nh3Count = Math.round((calc.yieldPct / 100) * this.refs.particles.length);

        this.refs.particles.forEach((p, idx) => {
          p.sphereMain.material = idx < nh3Count ? p.nh3Mat : idx % 2 === 0 ? p.n2Mat : p.h2Mat;
          p.group.position.addScaledVector(p.vel, dt * speedMul);
          if (Math.abs(p.group.position.x) > 1.05) p.vel.x *= -1;
          if (Math.abs(p.group.position.z) > 1.05) p.vel.z *= -1;
          if (p.group.position.y > ceilY) {
            p.group.position.y = ceilY;
            p.vel.y = -Math.abs(p.vel.y);
          }
          if (p.group.position.y < 0.38) {
            p.group.position.y = 0.38;
            p.vel.y = Math.abs(p.vel.y);
          }
        });
      } else if (this.activeModule === 'electrochem' && this.refs.electrons && this.refs.wireCurve) {
        const dir = this.refs.activeElectro?.st?.mode === 'faraday' ? -0.28 : 0.24;
        this.refs.electrons.forEach((el) => {
          const u = ((el.phase + elapsed * dir) % 1 + 1) % 1;
          const pt = this.refs.wireCurve.getPointAt(u);
          el.mesh.position.copy(pt);
        });
      }

      this.renderer.render(this.scene, this.camera);
    };
    step();
  }

  _handleResize() {
    if (!this.mountEl) return;
    const w = this.mountEl.clientWidth || 800;
    const h = this.mountEl.clientHeight || 540;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this._onResize);
    this._clearGroup(this.moduleGroup);
    this.renderer.dispose();
  }
}
