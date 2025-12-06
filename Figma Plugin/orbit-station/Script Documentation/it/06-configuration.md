# Configurazione - Clara Tokens Plugin

> Documentazione file di configurazione TypeScript e Figma

[⬅️ Test Scripts](05-test-scripts.md) | [Indice](../README.md) | [➡️ Workflow Guide](99-workflow-guide.md)

---

## 📋 Indice

- [tsconfig.json](#tsconfigjson)
- [manifest.json](#manifestjson)
- [package.json](#packagejson)

---

## tsconfig.json

> Configurazione TypeScript compiler

**Percorso:** `/Figma Plugin/clara plugin/tsconfig.json`

### Configurazione completa

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "none",
    "lib": ["ES2017"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "removeComments": true
  },
  "include": ["src/main-figma.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Spiegazione opzioni

#### target: "ES2017"
- **Cosa fa:** Compila TypeScript → JavaScript ES2017
- **Perché:** Figma supporta ES2017
- **Non modificare:** Figma richiede almeno ES2017

#### module: "none"
- **Cosa fa:** NO module system (no AMD, CommonJS, ESM)
- **Perché:** Figma richiede file JavaScript singolo senza import/export
- **Critico:** Senza questo, il plugin non funziona in Figma

#### lib: ["ES2017"]
- **Cosa fa:** Include type definitions per ES2017 APIs
- **Include:** Promise, async/await, Object.entries, Array.includes, etc.

#### outDir: "./dist"
- **Cosa fa:** Directory output per file compilati
- **Output:** `dist/main-figma.js`
- **Modificabile:** Sì, ma aggiorna anche script npm

#### rootDir: "./src"
- **Cosa fa:** Root directory per sorgenti TypeScript
- **Preserva:** Struttura directory in output

#### strict: true
- **Cosa fa:** Abilita tutte le opzioni strict TypeScript
- **Include:**
  - `strictNullChecks`: null/undefined espliciti
  - `strictFunctionTypes`: Type checking funzioni rigoroso
  - `strictBindCallApply`: bind/call/apply type-safe
  - `noImplicitAny`: Errore su `any` implicito
  - `noImplicitThis`: Errore su `this` implicito

#### sourceMap: false
- **Cosa fa:** NON genera .map files
- **Perché:** Riduce dimensione output (~50%)
- **Debug:** Cambia a `true` per debugging

#### removeComments: true
- **Cosa fa:** Rimuove commenti nel JavaScript output
- **Riduzione:** ~10-15% dimensione file
- **Debug:** Cambia a `false` per preservare commenti

#### include: ["src/main-figma.ts"]
- **Cosa fa:** Specifica entry point
- **Importante:** Solo main-figma.ts, non main.ts
- **Modificabile:** Per switchare a versione modulare

### Modifiche comuni

**Abilitare source maps (debug):**
```json
{
  "compilerOptions": {
    "sourceMap": true,
    "removeComments": false
  }
}
```

**Cambiare target ES version:**
```json
{
  "compilerOptions": {
    "target": "ES2020",  // ES2020 features
    "lib": ["ES2020"]
  }
}
```

**Output directory diversa:**
```json
{
  "compilerOptions": {
    "outDir": "./build"  // Invece di ./dist
  }
}
```

Ricorda di aggiornare `package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc && cp build/main-figma.js code.js"
  }
}
```

---

## manifest.json

> Manifest Figma plugin

**Percorso:** `/Figma Plugin/clara plugin/manifest.json`

### Configurazione completa

```json
{
  "name": "Clara Tokens",
  "id": "1495722115809572711",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "capabilities": ["inspect"],
  "permissions": ["teamlibrary"],
  "editorType": ["figma", "dev"],
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": [
      "fonts.googleapis.com",
      "fonts.gstatic.com"
    ]
  }
}
```

### Spiegazione campi

#### name: "Clara Tokens"
- **Cosa fa:** Nome visualizzato in Figma
- **Modificabile:** Sì
- **Visibile:** Menu plugin, marketplace

#### id: "1495722115809572711"
- **Cosa fa:** ID univoco plugin
- **Modificabile:** NO - assegnato da Figma
- **Importante:** Identifica plugin per aggiornamenti

#### api: "1.0.0"
- **Cosa fa:** Versione Figma Plugin API
- **Valori:** "1.0.0" (current)
- **Non modificare:** Usa versione corrente API

#### main: "code.js"
- **Cosa fa:** Entry point codice plugin
- **Deve:** Esistere nella root del plugin
- **Generato da:** `npm run build`

#### ui: "ui.html"
- **Cosa fa:** File HTML per UI del plugin
- **Opzionale:** Può essere omesso per plugin senza UI
- **Dimensione:** ~450KB (contiene inline CSS e JS)

#### capabilities: ["inspect"]
- **Cosa fa:** Abilita inspect mode
- **Permette:** Leggere proprietà nodi selezionati
- **Opzioni:**
  - `"inspect"`: Read node properties
  - `"codegen"`: Generate code from selection

#### permissions: ["teamlibrary"]
- **Cosa fa:** Richiede accesso Team Libraries
- **Critico per:** LibraryManager class
- **Senza:** Import da librerie esterne fallisce

**Altre permissions disponibili:**
- `"activeusers"`: Vedere utenti attivi
- `"filelinks"`: Creare link a file/nodi
- `"fullscreen"`: Modalità fullscreen

#### editorType: ["figma", "dev"]
- **Cosa fa:** Dove il plugin funziona
- **Valori:**
  - `"figma"`: Figma Design
  - `"figjam"`: FigJam
  - `"dev"`: Dev Mode
- **Multipli:** Plugin funziona in tutti i tipi specificati

#### documentAccess: "dynamic-page"
- **Cosa fa:** Livello accesso al documento
- **Opzioni:**
  - `"current-page"`: Solo pagina corrente
  - `"dynamic-page"`: Può switchare pagine
- **Usato per:** Accedere variabili cross-page

#### networkAccess
- **Cosa fa:** Permette richieste network
- **allowedDomains:** Lista domini autorizzati
- **Usato per:** Caricare Google Fonts (se necessario)

### Modifiche comuni

**Aggiungere permission:**
```json
{
  "permissions": [
    "teamlibrary",
    "activeusers",  // Nuovo
    "filelinks"     // Nuovo
  ]
}
```

**Cambiare editor type:**
```json
{
  "editorType": ["figjam"]  // Solo FigJam
}
```

**Aggiungere domini network:**
```json
{
  "networkAccess": {
    "allowedDomains": [
      "fonts.googleapis.com",
      "api.myservice.com"  // Nuovo
    ]
  }
}
```

**Rimuovere UI:**
```json
{
  "main": "code.js"
  // Rimuovi "ui": "ui.html"
}
```

---

## package.json

> Configurazione npm e dipendenze

**Percorso:** `/Figma Plugin/clara plugin/package.json`

### Configurazione completa

```json
{
  "name": "clara-tokens",
  "version": "1.0.0",
  "description": "Figma plugin for managing design tokens",
  "main": "code.js",
  "scripts": {
    "build": "tsc && cp dist/main-figma.js code.js",
    "dev": "tsc --watch",
    "watch": "tsc --watch",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist"
  },
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@figma/plugin-typings": "^1.90.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "typescript": "^5.2.0"
  }
}
```

### Spiegazione sezioni

#### scripts
Vedi [NPM Scripts documentation](01-npm-scripts.md)

#### devDependencies

**@figma/plugin-typings**
- **Cosa fa:** Type definitions per Figma Plugin API
- **Include:** `figma`, `PluginAPI`, `SceneNode`, etc.
- **Versione:** Mantieni aggiornato (~ogni 2-3 mesi)
- **Critico:** Senza questo, TypeScript non conosce `figma.*`

**typescript**
- **Cosa fa:** TypeScript compiler
- **Versione:** 5.0+
- **Update:** Testa prima di aggiornare major versions

**eslint + @typescript-eslint**
- **Cosa fa:** Linting e code quality
- **Configurazione:** `.eslintrc.json` o inline in package.json

### Modifiche comuni

**Aggiungere dependency:**
```bash
npm install --save-dev jest @types/jest
```

```json
{
  "devDependencies": {
    // ... existing
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "scripts": {
    // ... existing
    "test": "jest"
  }
}
```

**Aggiungere runtime dependency:**
```bash
npm install lodash
```

⚠️ **Attenzione:** Runtime dependencies aumentano dimensione bundle

**Bump version:**
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
```

---

## Link Utili

- [📖 NPM Scripts](01-npm-scripts.md) - Comandi npm dettagliati
- [📖 Workflow Guide](99-workflow-guide.md) - Processo sviluppo
- [🔗 TypeScript tsconfig](https://www.typescriptlang.org/tsconfig)
- [🔗 Figma Plugin Manifest](https://www.figma.com/plugin-docs/manifest/)

---

**Ultima modifica:** 2025-01-16 | [⬅️ Test Scripts](05-test-scripts.md) | [➡️ Workflow Guide](99-workflow-guide.md)
