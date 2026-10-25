# Chemia Atelier v1.0 — NCTB SSC & HSC Interactive 3D Chemistry Studio

An interactive daylight 3D chemistry & practical laboratory aligned with the **Bangladesh NCTB SSC (Class 9–10)** and **HSC (Class 11–12, 1st & 2nd Paper)** Chemistry curriculum.

## Eight Calibrated 3D Benches

- **01 Acid-Base Burette Titration Bench** (*SSC Ch. 9 · HSC 2nd Paper Ch. 3*): Drop-by-drop `0.05 mL` standardization across strong/weak acids & bases with real-time Phenolphthalein, Methyl Orange, and Bromothymol Blue indicator physics.
- **02 Qualitative Salt & Flame Test Lab** (*HSC 1st Paper Ch. 2 Practical*): Bunsen flame emission (`Na+`, `K+`, `Ca2+`, `Cu2+`, `Fe3+`), toggleable Blue Cobalt Silicate Glass filter, wet test-tube precipitates (`K4[Fe(CN)6]`, `AgNO3`, `BaCl2`), and Mystery Salt Detective solver.
- **03 Bohr Quantum Orbits & Rydberg Line Spectra** (*SSC Ch. 3 · HSC 1st Paper Ch. 2*): Electron shell transitions (`n = 1..6`), exact Lyman (UV), Balmer (Visible), and Paschen (IR) wavelengths, plus `He+` / `Li2+` scaling.
- **04 VSEPR 3D Molecular Geometry & Hybridization** (*SSC Ch. 5 · HSC 1st Paper Ch. 3*): Live `sp -> sp3d2` bonding pairs + translucent pear-shaped lone-pair orbitals showing `CH4 (109.5°) > NH3 (107.0°) > H2O (104.5°)`.
- **05 Le Chatelier Catalytic Equilibrium Reactor** (*SSC Ch. 7 · HSC 1st Paper Ch. 4*): Pressurized `N2 + 3H2 <=> 2NH3` chamber across `300–650 °C`, `50–400 atm`, and porous `Fe + Mo` catalyst bed.
- **06 Daniell Galvanic Cell & Faraday Electrolysis** (*SSC Ch. 8 · HSC 2nd Paper Ch. 4*): Nernst non-standard cell EMF (`Zn`, `Cu`, `Ag`, `Mg` + `KCl` salt bridge) and DC Faraday electroplating mass deposition (`W = ZIt`).
- **07 Organic Stereochemistry (`Cis-Trans` & Chiral Polarimeter)** (*SSC Ch. 11 · HSC 2nd Paper Ch. 2*): Restricted `C=C` geometric dipole cancellation (`1.90 D` vs `0.00 D`) and Biot optical polarimeter (`(+)-d`, `(-)-l`, and `50:50` racemic lactic acid).
- **08 Graham's Diffusion Tube & Real-Gas `Z` Curves** (*HSC 2nd Paper Ch. 1*): Counter-diffusing `NH3` + `HCl / HBr / HI` forming solid white `NH4X` rings at the exact Graham distance + Amagat `Z = PV / nRT` plots.

## Running Locally on Your PC (Node.js v22 LTS)

### Option A — Instant Zero-Install Launch (Pre-built `./release`)

1. Extract `chemia-atelier-v1.0.zip` to a folder.
2. Double-click **`run-on-windows.bat`** (Windows) or run **`./run-on-mac-linux.sh`** (macOS/Linux), or run:
   ```bash
   node serve-local.mjs
   ```
3. Your browser opens automatically at `http://127.0.0.1:4173`.

### Option B — Full Development & Unit Verification Mode

```bash
npm install
npm run verify:chemistry
npm run dev
```
