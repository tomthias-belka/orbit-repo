# NPM Scripts - Clara Tokens Plugin

> Guida completa ai comandi npm disponibili per build, development e testing

[⬅️ Torna all'indice](../README.md) | [➡️ Script Principali](02-main-scripts.md)

---

## 📋 Indice

- [Overview](#overview)
- [Script Disponibili](#script-disponibili)
  - [npm run build](#npm-run-build)
  - [npm run dev](#npm-run-dev)
  - [npm run watch](#npm-run-watch)
  - [npm run lint](#npm-run-lint)
  - [npm run clean](#npm-run-clean)
- [Workflow Tipico](#workflow-tipico)
- [Troubleshooting](#troubleshooting)
- [Modificare gli Script](#modificare-gli-script)

---

## Overview

Gli script npm sono definiti nel file [`package.json`](../../Figma%20Plugin/clara%20plugin/package.json) e forniscono i comandi principali per lo sviluppo del plugin Clara Tokens.

**Percorso:** `/Figma Plugin/clara plugin/package.json`

### Script disponibili a colpo d'occhio

| Script | Comando | Uso Principale |
|--------|---------|----------------|
| `build` | `tsc && cp dist/main-figma.js code.js` | Build di produzione |
| `dev` | `tsc --watch` | Sviluppo con auto-rebuild |
| `watch` | `tsc --watch` | Alias di `dev` |
| `lint` | `eslint src/**/*.ts` | Code quality check |
| `clean` | `rm -rf dist` | Pulizia file compilati |

---

## Script Disponibili

### npm run build

**Comando completo:**
```bash
tsc && cp dist/main-figma.js code.js
```

#### Cosa fa

1. **Compila TypeScript** (`tsc`)
   - Legge configurazione da [`tsconfig.json`](../../Figma%20Plugin/clara%20plugin/tsconfig.json)
   - Compila tutti i file `.ts` in `src/`
   - Output in `dist/main-figma.js`
   - Target: ES2017
   - Module: none (richiesto da Figma)

2. **Copia in code.js** (`cp dist/main-figma.js code.js`)
   - Figma richiede che il codice plugin sia in `code.js`
   - Copia il file compilato dalla directory `dist/`
   - `code.js` è l'entry point definito in `manifest.json`

#### Quando usarlo

- ✅ Prima di testare il plugin in Figma
- ✅ Prima di committare modifiche
- ✅ Per build di produzione/release
- ✅ Dopo modifiche significative al codice

#### Output atteso

```bash
$ npm run build

> clara-tokens@1.0.0 build
> tsc && cp dist/main-figma.js code.js

# Nessun output = successo
# File generati:
# - dist/main-figma.js (~175KB)
# - code.js (copia di dist/main-figma.js)
```

#### Parametri configurabili

Modificabili in [`tsconfig.json`](../../Figma%20Plugin/clara%20plugin/tsconfig.json):

```json
{
  "compilerOptions": {
    "target": "ES2017",           // Versione JavaScript output
    "module": "none",              // NO module system (richiesto Figma)
    "outDir": "dist",              // Directory output
    "rootDir": "src",              // Directory sorgenti
    "strict": true,                // Strict type checking
    "skipLibCheck": true,          // Velocizza compilazione
    "forceConsistentCasingInFileNames": true
  }
}
```

#### Troubleshooting

**Errore: `Cannot find module`**
```bash
# Causa: Dipendenze mancanti
# Soluzione:
npm install
```

**Errore: `error TS2304: Cannot find name 'figma'`**
```bash
# Causa: Type definitions Figma mancanti
# Soluzione:
npm install --save-dev @figma/plugin-typings
```

**Errore: `cp: cannot stat 'dist/main-figma.js'`**
```bash
# Causa: Compilazione TypeScript fallita
# Soluzione: Controlla errori TypeScript sopra
# Verifica che src/main-figma.ts esista
```

**Warning: `"target": "ES2017" may produce code that doesn't work in older browsers`**
```
# OK - Figma supporta ES2017
# Ignorare questo warning
```

---

### npm run dev

**Comando completo:**
```bash
tsc --watch
```

#### Cosa fa

Avvia il TypeScript compiler in **modalità watch**:
- Compila il progetto inizialmente
- Rimane in esecuzione
- Ricompila automaticamente quando rileva modifiche ai file `.ts`
- Mostra errori di compilazione in tempo reale

#### Quando usarlo

- ✅ Durante lo sviluppo attivo
- ✅ Per vedere errori TypeScript in tempo reale
- ✅ Quando lavori su più file contemporaneamente

#### Output atteso

```bash
$ npm run dev

> clara-tokens@1.0.0 dev
> tsc --watch

[00:00:00] Starting compilation in watch mode...
[00:00:05] Found 0 errors. Watching for file changes.

# Il processo rimane in esecuzione
# Ogni volta che salvi un file .ts:
[00:01:23] File change detected. Starting incremental compilation...
[00:01:24] Found 0 errors. Compilation complete.
```

#### Workflow consigliato

```bash
# Terminal 1: Avvia watch mode
npm run dev

# Lascia girare, lavora sui file .ts in src/

# Terminal 2: Quando sei pronto per testare in Figma
npm run build  # Copia dist/main-figma.js in code.js
```

#### Importante

⚠️ **`npm run dev` NON copia automaticamente in `code.js`**

Per testare in Figma:
1. Salva modifiche (watch mode compila automaticamente)
2. Esegui `npm run build` per copiare in `code.js`
3. Ricarica plugin in Figma (Cmd+Option+P su Mac, Ctrl+Alt+P su Windows)

#### Shortcuts utili

**Interrompere watch mode:**
- Mac: `Cmd + C` nel terminal
- Windows/Linux: `Ctrl + C` nel terminal

**Riavviare watch mode:**
```bash
# Se watch mode si blocca:
Ctrl+C  # Interrompi
npm run dev  # Riavvia
```

#### Troubleshooting

**Watch mode non rileva modifiche:**
```bash
# Causa possibili:
# 1. Limite file system (Linux/Mac)
# 2. Editor che salva in modo non standard

# Soluzione:
# Riavvia watch mode
Ctrl+C
npm run dev
```

**Errori che persistono dopo fix:**
```bash
# Causa: Cache TypeScript
# Soluzione:
npm run clean
npm run dev
```

---

### npm run watch

**Comando completo:**
```bash
tsc --watch
```

#### Cosa fa

**Alias identico a `npm run dev`**

Fornito per compatibilità con altri progetti che usano `npm run watch` come convenzione.

#### Quando usarlo

- ✅ Preferenza personale su `dev`
- ✅ Compatibilità con documentazione che menziona `watch`

---

### npm run lint

**Comando completo:**
```bash
eslint src/**/*.ts
```

#### Cosa fa

Esegue **ESLint** su tutti i file TypeScript in `src/`:
- Controlla code style
- Rileva problemi comuni
- Enforza best practices TypeScript
- Identifica codice inutilizzato

#### Quando usarlo

- ✅ Prima di committare
- ✅ Dopo refactoring significativi
- ✅ Per code review self-check
- ✅ Prima di merge/PR

#### Output atteso

**Nessun problema:**
```bash
$ npm run lint

> clara-tokens@1.0.0 lint
> eslint src/**/*.ts

# Nessun output = tutto OK
```

**Con problemi:**
```bash
$ npm run lint

/path/to/src/main.ts
  45:7  error    'unusedVar' is assigned a value but never used  @typescript-eslint/no-unused-vars
  78:15 warning  Unexpected console statement                     no-console

✖ 2 problems (1 error, 1 warning)
```

#### Regole configurate

Le regole ESLint sono configurate tramite:
- `.eslintrc.json` (se presente)
- Inline nel `package.json`
- Plugin TypeScript (`@typescript-eslint/eslint-plugin`)

**Regole principali:**
- No unused variables
- No console.log in produzione
- Consistent code formatting
- TypeScript-specific rules

#### Fix automatici

ESLint può fixare alcuni problemi automaticamente:

```bash
# Fix automatico (modifica file)
npx eslint src/**/*.ts --fix

# Preview fix (senza modificare)
npx eslint src/**/*.ts --fix-dry-run
```

⚠️ **Attenzione:** `--fix` modifica i file direttamente

#### Ignorare specifici errori

**Inline ignore (singola linea):**
```typescript
// eslint-disable-next-line no-console
console.log('Debug message');
```

**Ignore block:**
```typescript
/* eslint-disable no-console */
console.log('Debug 1');
console.log('Debug 2');
/* eslint-enable no-console */
```

**Ignore file completo:**
```typescript
// All'inizio del file
/* eslint-disable */
```

#### Troubleshooting

**Errore: `ESLint not found`**
```bash
# Installa dipendenze
npm install
```

**Troppi errori legacy:**
```bash
# Opzione 1: Fix automatici
npx eslint src/**/*.ts --fix

# Opzione 2: Focus solo errori (ignora warnings)
npx eslint src/**/*.ts --quiet
```

**Performance lenta:**
```bash
# Limita scope
npx eslint src/main.ts  # Singolo file
npx eslint src/classes/*.ts  # Solo classi
```

---

### npm run clean

**Comando completo:**
```bash
rm -rf dist
```

#### Cosa fa

Rimuove completamente la directory `dist/`:
- Elimina tutti i file JavaScript compilati
- Pulisce cache di compilazione
- Forza rebuild completo al prossimo `npm run build`

#### Quando usarlo

- ✅ Quando build sembra corrotto
- ✅ Prima di build di produzione/release
- ✅ Quando `tsconfig.json` è modificato
- ✅ Per risolvere strani errori di compilazione
- ✅ Prima di commit importante (fresh build)

#### Output atteso

```bash
$ npm run clean

> clara-tokens@1.0.0 clean
> rm -rf dist

# Nessun output
# Directory dist/ rimossa
```

#### Workflow completo clean + build

```bash
# Pulizia completa e rebuild
npm run clean
npm run build

# Verifica
ls dist/  # Dovrebbe mostrare main-figma.js
ls -lh code.js  # Dovrebbe esistere
```

#### Importante

⚠️ **`clean` NON elimina `code.js`**

Se vuoi pulizia completa:
```bash
npm run clean
rm code.js
npm run build
```

#### Troubleshooting

**Errore: `rm: dist: No such file or directory`**
```
# Normale se dist/ non esiste
# Ignorare - non è un errore
```

**Permessi insufficienti (raro):**
```bash
# Se rm fallisce per permessi
sudo npm run clean  # Solo se necessario
```

---

## Workflow Tipico

### Sviluppo Feature Nuova

```bash
# 1. Setup iniziale
cd "Figma Plugin/clara plugin"
npm install

# 2. Avvia watch mode
npm run dev  # Terminal 1 - lascia girare

# 3. Lavora sui file .ts
# Modifica src/classes/TokenProcessor.ts
# Watch mode ricompila automaticamente

# 4. Test in Figma
npm run build  # Terminal 2 - copia in code.js
# Ricarica plugin in Figma

# 5. Verifica code quality
npm run lint

# 6. Fix eventuali problemi lint
npx eslint src/**/*.ts --fix

# 7. Build finale
npm run clean
npm run build

# 8. Test finale in Figma
# Ricarica plugin e verifica tutto funzioni
```

### Fix Bug Veloce

```bash
# 1. Modifica file
# Edit src/utils/colorUtils.ts

# 2. Build immediato
npm run build

# 3. Test in Figma
# Ricarica plugin

# 4. Lint check
npm run lint
```

### Release/Deploy

```bash
# 1. Pulizia completa
npm run clean
rm code.js

# 2. Fresh install dipendenze (opzionale)
rm -rf node_modules
npm install

# 3. Lint check
npm run lint

# 4. Build produzione
npm run build

# 5. Verifica dimensione
ls -lh code.js  # Dovrebbe essere ~175KB

# 6. Test completo in Figma
# Carica plugin e testa tutte le funzionalità

# 7. Commit
git add .
git commit -m "release: vX.Y.Z"
```

---

## Troubleshooting

### Build fallisce senza errori chiari

```bash
# 1. Pulizia completa
npm run clean
rm -rf node_modules
rm package-lock.json

# 2. Reinstalla dipendenze
npm install

# 3. Verifica TypeScript
npx tsc --version  # Dovrebbe essere 5.0+

# 4. Build con verbose
npx tsc --verbose

# 5. Rebuild
npm run build
```

### Watch mode non funziona

```bash
# 1. Verifica processo in esecuzione
ps aux | grep tsc

# 2. Killa processi vecchi
pkill -f "tsc --watch"

# 3. Riavvia clean
npm run dev
```

### Lint troppo lento

```bash
# 1. Lint solo file modificati
npx eslint src/main.ts

# 2. Cache ESLint
npx eslint src/**/*.ts --cache

# 3. Ignora node_modules (dovrebbe già)
# Verifica .eslintignore esista
```

### code.js non si aggiorna in Figma

```bash
# 1. Verifica build recente
ls -l code.js  # Controlla timestamp

# 2. Force rebuild
npm run clean
npm run build

# 3. Verifica dimensione
ls -lh code.js  # ~175KB

# 4. Hard reload Figma
# Mac: Cmd+Option+P poi "Reload"
# Windows: Ctrl+Alt+P poi "Reload"

# 5. Chiudi e riapri plugin
```

---

## Modificare gli Script

### Aggiungere nuovo script npm

**Modifica `package.json`:**

```json
{
  "scripts": {
    "build": "tsc && cp dist/main-figma.js code.js",
    "dev": "tsc --watch",
    "watch": "tsc --watch",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist",

    // Nuovo script: Build + auto-reload
    "build:watch": "tsc --watch && npm run copy",
    "copy": "cp dist/main-figma.js code.js",

    // Nuovo script: Test completo
    "test": "npm run lint && npm run build",

    // Nuovo script: Format automatico
    "format": "prettier --write src/**/*.ts"
  }
}
```

### Modificare target build

**Modifica `tsconfig.json`:**

```json
{
  "compilerOptions": {
    // Cambia versione JavaScript
    "target": "ES2020",  // Default: ES2017

    // Abilita source maps (debug)
    "sourceMap": true,  // Default: false

    // Output diverso
    "outDir": "build",  // Default: dist
  }
}
```

**Aggiorna script build:**
```json
{
  "scripts": {
    "build": "tsc && cp build/main-figma.js code.js"
  }
}
```

### Aggiungere pre-build hook

```json
{
  "scripts": {
    "prebuild": "npm run lint",  // Eseguito PRIMA di build
    "build": "tsc && cp dist/main-figma.js code.js",
    "postbuild": "ls -lh code.js"  // Eseguito DOPO build
  }
}
```

### Build multipli (dev vs prod)

```json
{
  "scripts": {
    "build:dev": "tsc --sourceMap && cp dist/main-figma.js code.js",
    "build:prod": "tsc --removeComments && cp dist/main-figma.js code.js"
  }
}
```

---

## Link Utili

- [📖 Script Principali](02-main-scripts.md) - Entry points e architettura
- [📖 Configurazione](06-configuration.md) - Dettagli tsconfig.json
- [📖 Workflow Guide](99-workflow-guide.md) - Processo sviluppo completo
- [🔗 TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [🔗 ESLint Documentation](https://eslint.org/docs/latest/)

---

**Ultima modifica:** 2025-01-16 | [⬅️ Indice](../README.md) | [➡️ Script Principali](02-main-scripts.md)
