# Piano di Ottimizzazione Clara Plugin per White Label Workflow

**Data**: 2025-11-03
**Status**: Piano Strategico
**Priorità**: Alta

---

## 📋 Contesto

Sistema white-label con **3 temi** (clara, mooney, atm) gestiti via **Figma Modes**.
Output finale: `clara-tokens.json` con **3 collections** (global, semantic, components).

### Problema Attuale
Workflow non ottimizzato per **frequent theme switching**:
- Import/export lenti (~30s)
- Nessun quick switching tra temi
- File JSON monolitico caricato completamente ogni volta
- Mancanza di caching e diff algorithm

### Esempio Struttura Multi-Mode
```json
"semantic": {
  "colors": {
    "brand": {
      "core": {
        "$value": {
          "clara": "{colors.pink.500}",
          "mooney": "{colors.blue.700}",
          "atm": "{colors.red.500}"
        },
        "$type": "color"
      }
    }
  }
}
```

---

## 🎯 Ottimizzazioni Proposte

### 1. **Ristrutturazione JSON - Massima Priorità** 🔥

**Problema**: File monolitico `clara-tokens.json` caricato completamente ad ogni import/export

**Soluzione**:
- Mantenere struttura a 3 livelli (global/semantic/components) ma ottimizzare multi-mode handling
- Implementare lazy loading per collections nel plugin
- Aggiungere metadata sezione per tracking theme changes

**Struttura JSON Ottimizzata**:
```json
{
  "$metadata": {
    "version": "1.0.0",
    "themes": ["clara", "mooney", "atm"],
    "lastModified": "2025-11-03T10:00:00Z",
    "collections": {
      "global": { "tokens": 241, "hasModesù: false },
      "semantic": { "tokens": 370, "hasModes": true },
      "components": { "tokens": 80, "hasModes": true }
    }
  },
  "global": { ... },
  "semantic": { ... },
  "components": { ... }
}
```

**File da modificare**:
- `clara-tokens.json`: Aggiungere sezione `$metadata` con versioning e theme info
- `src/classes/TokenProcessor.ts`: Implementare parsing selettivo per collection
- Implementare `MetadataManager` class per tracking changes

**Benefici**:
- Validazione pre-import più veloce
- Skip collections non modificate
- Versioning per compatibilità

---

### 2. **Theme Switcher UI - Alta Priorità** ⚡

**Problema**: No quick switching tra temi, serve re-import completo ogni volta

**Soluzione**:
- Aggiungere dropdown "Theme Switcher" nella UI principale
- Implementare live preview che cambia Figma Mode senza re-import
- Mostrare preview visivo dei 3 temi side-by-side

**Mockup UI**:
```
┌─────────────────────────────────────────┐
│  Theme Switcher                    [×]  │
├─────────────────────────────────────────┤
│  Current: mooney             [Switch ▼] │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │clara│  │mooney│ │ atm │            │
│  │ 🟣  │  │ 🔵  │  │ 🔴 │            │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  [Apply to Selection]  [Apply to Page] │
└─────────────────────────────────────────┘
```

**File da modificare**:
- `ui.html`: Aggiungere Theme Switcher panel (sezione dopo Import/Export)
- `src/main-figma.ts`: Aggiungere handler `SWITCH_THEME` message type
- Implementare funzione `switchFigmaMode(targetMode: string)` che aggiorna Mode attivo

**Codice Esempio**:
```typescript
// In main-figma.ts
async function switchFigmaMode(targetMode: string) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  for (const collection of collections) {
    const mode = collection.modes.find(m => m.name === targetMode);
    if (mode) {
      // Switch mode per selection o page
      figma.currentPage.setSharedPluginData('clara-plugin', 'activeMode', mode.modeId);
    }
  }

  figma.ui.postMessage({
    type: 'theme-switched',
    theme: targetMode
  });
}
```

**Benefici**:
- Theme switch in <1s (vs 30s re-import)
- Preview instant dei 3 temi
- UX simile a Figma Variables panel

---

### 3. **Performance - Import/Export Incrementale** 🚀

**Problema**: Ogni import ricrea tutte le variabili da zero (anche se non cambiate)

**Soluzione**:
- Implementare diff algorithm tra JSON e variabili Figma esistenti
- Caching via `figma.clientStorage` con hash-based validation
- Update solo token modificati (non full rebuild)

**Architettura Cache**:
```typescript
// CacheManager class
class CacheManager {
  async getCachedTokens(): Promise<CachedData | null> {
    const cached = await figma.clientStorage.getAsync('tokens-cache');
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedTokens(tokens: any, hash: string) {
    await figma.clientStorage.setAsync('tokens-cache', JSON.stringify({
      tokens,
      hash,
      timestamp: Date.now()
    }));
  }

  calculateHash(tokens: any): string {
    return btoa(JSON.stringify(tokens)).slice(0, 32);
  }
}
```

**Diff Algorithm**:
```typescript
// In VariableManager.ts
async diffTokens(newTokens: Token[], existingVars: Variable[]): Promise<Diff> {
  const diff = {
    toCreate: [],
    toUpdate: [],
    toDelete: [],
    unchanged: []
  };

  // Compare tokens by path and value
  for (const token of newTokens) {
    const existing = existingVars.find(v => v.name === token.name);

    if (!existing) {
      diff.toCreate.push(token);
    } else if (hasChanged(token, existing)) {
      diff.toUpdate.push({ token, variable: existing });
    } else {
      diff.unchanged.push(token);
    }
  }

  // Find deleted tokens
  for (const variable of existingVars) {
    if (!newTokens.find(t => t.name === variable.name)) {
      diff.toDelete.push(variable);
    }
  }

  return diff;
}
```

**File da modificare**:
- `src/classes/VariableManager.ts`: Aggiungere metodo `diffTokens()`
- Implementare `CacheManager` class per clientStorage
- Aggiungere progress indicators granulari (per operation type)

**Metriche Attese**:
- Import time: **30s → <5s** (con cache hit)
- Memory usage: **-40%** (lazy loading)
- Network: **0** (tutto locale)

---

### 4. **Gestione Temi - Mode Management** 🎨

**Problema**: Temi hardcoded nel JSON, difficile aggiungerne di nuovi

**Soluzione**:
- Auto-detect modes dal JSON `$value` object keys
- UI per aggiungere/rimuovere temi dinamicamente
- Export single-theme JSON per dev (solo mooney, solo atm, ecc.)

**Auto-Detect Modes**:
```typescript
// In TokenProcessor.ts
function detectThemesFromJSON(tokens: any): string[] {
  const themes = new Set<string>();

  function traverse(obj: any) {
    if (obj.$value && typeof obj.$value === 'object' && !Array.isArray(obj.$value)) {
      // Multi-mode token trovato
      Object.keys(obj.$value).forEach(key => themes.add(key));
    }

    if (typeof obj === 'object') {
      Object.values(obj).forEach(traverse);
    }
  }

  traverse(tokens);
  return Array.from(themes);
}
```

**Export Single Theme**:
```typescript
// In VariableExporter.ts
function exportSingleTheme(tokens: any, themeName: string): any {
  function transformToSingleValue(obj: any): any {
    if (obj.$value && typeof obj.$value === 'object' && obj.$value[themeName]) {
      return {
        ...obj,
        $value: obj.$value[themeName] // Estrai solo questo tema
      };
    }

    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, val]) => [key, transformToSingleValue(val)])
      );
    }

    return obj;
  }

  return transformToSingleValue(tokens);
}
```

**UI Theme Manager**:
```
┌─────────────────────────────────────────┐
│  Theme Manager                     [×]  │
├─────────────────────────────────────────┤
│  Active Themes (3):                     │
│  ✓ clara    [Edit] [Remove]            │
│  ✓ mooney   [Edit] [Remove]            │
│  ✓ atm      [Edit] [Remove]            │
│                                         │
│  [+ Add New Theme]                      │
│                                         │
│  Export Options:                        │
│  [ ] Export all themes (multi-mode)     │
│  [×] Export single theme:               │
│      Theme: [mooney ▼]                  │
│                                         │
│  [Export for Development]               │
└─────────────────────────────────────────┘
```

**File da modificare**:
- `src/classes/TokenProcessor.ts`: Implementare `detectThemesFromJSON()`
- `ui.html`: Aggiungere "Theme Manager" tab
- Implementare `exportSingleTheme()` in VariableExporter

**Benefici**:
- Aggiungere tema: da ~15 min → <2 min
- Export dev-ready senza multi-mode bloat
- Validazione automatica theme completeness

---

### 5. **UX Improvements - Visual Hierarchy** ✨

**Problema**: Feedback generico, no visual hierarchy tra Design vs Dev, no distinzione collections

**Soluzione**:
- Visual distinction: **Global** (blue), **Semantic** (green), **Components** (orange)
- Badge "Source of Truth" per Global tokens
- Preview import con color swatches prima di applicare
- Progress bar dettagliato (Collection > Variable > Mode)

**CSS Styling Collections**:
```css
/* Visual hierarchy per collections */
.collection-global {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-left: 4px solid #3b82f6;
}

.collection-semantic {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-left: 4px solid #22c55e;
}

.collection-components {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  border-left: 4px solid #f97316;
}

.badge-source-of-truth {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7em;
  font-weight: 700;
}
```

**Progress Indicators Granulari**:
```typescript
// In VariableManager.ts
async importWithProgress(collections: Collection[]) {
  const total = collections.reduce((sum, c) => sum + c.tokens.length, 0);
  let current = 0;

  for (const collection of collections) {
    figma.ui.postMessage({
      type: 'progress-update',
      phase: 'collection',
      name: collection.name,
      current: collections.indexOf(collection),
      total: collections.length
    });

    for (const token of collection.tokens) {
      // Import token...
      current++;

      if (current % 10 === 0) {
        figma.ui.postMessage({
          type: 'progress-update',
          phase: 'token',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        });
      }
    }
  }
}
```

**Preview Import con Swatches**:
```html
<!-- In ui.html -->
<div class="import-preview">
  <h3>Import Preview</h3>
  <div class="collection-preview">
    <span class="badge badge-global">Global</span>
    <span class="count">241 tokens</span>
    <div class="color-swatches">
      <div class="swatch" style="background: #0072ef"></div>
      <div class="swatch" style="background: #00aec7"></div>
      <div class="swatch" style="background: #fec627"></div>
      <!-- ... -->
    </div>
  </div>
</div>
```

**File da modificare**:
- `ui.html`: CSS styling per collection colors e badges
- `src/classes/ImportPreview.ts`: Migliorare preview con visual swatches
- Implementare progress indicators granulari in VariableManager

**Benefici**:
- Chiarezza Design vs Dev (come da audit)
- Visual feedback immediato durante import
- Riduzione errori (preview before commit)

---

## 📊 Implementazione Prioritaria

### Sprint 1 - Quick Wins (1-2 giorni)
**Focus**: Massimo impatto UX con minimo effort

1. ✅ **Theme Switcher UI**
   - Effort: 4h
   - Impact: Alto (eliminare 30s wait per switch)

2. ✅ **Auto-detect Modes**
   - Effort: 2h
   - Impact: Alto (sistema più flessibile)

3. ✅ **Visual Hierarchy**
   - Effort: 3h
   - Impact: Medio (migliora chiarezza)

**Deliverable**: Plugin con quick theme switching + UI migliorata

---

### Sprint 2 - Performance (2-3 giorni)
**Focus**: Ottimizzazioni backend e caching

4. ✅ **Cache System**
   - Effort: 6h
   - Impact: Alto (5x faster import)

5. ✅ **Diff Algorithm**
   - Effort: 8h
   - Impact: Alto (incremential updates)

6. ✅ **Export Single Theme**
   - Effort: 4h
   - Impact: Medio (necessario per dev workflow)

**Deliverable**: Plugin 5x più veloce + export dev-ready

---

### Sprint 3 - Advanced Features (3-4 giorni)
**Focus**: Features avanzate e refinement

7. ✅ **Metadata System**
   - Effort: 5h
   - Impact: Medio (versioning e tracking)

8. ✅ **Lazy Loading**
   - Effort: 6h
   - Impact: Basso (ottimizzazione memory)

9. ✅ **Advanced Preview**
   - Effort: 4h
   - Impact: Basso (visual refinement)

**Deliverable**: Plugin production-ready con tutte le features

---

## 🎯 Metriche di Successo

| Metrica | Attuale | Target | Miglioramento |
|---------|---------|--------|---------------|
| **Import time (first)** | ~30s | <10s | **3x faster** |
| **Import time (cached)** | ~30s | <5s | **6x faster** |
| **Theme switch** | ~30s | <1s | **30x faster** |
| **Export dev JSON** | N/A | <2s | **New feature** |
| **Add new theme** | ~15 min | <2 min | **7.5x faster** |
| **Memory usage** | 100% | 60% | **-40%** |
| **User clicks (switch)** | ~15 | 2 | **-87%** |

---

## 📂 File Chiave da Modificare

### Backend TypeScript
1. **`src/main-figma.ts`**
   - Aggiungere message handlers: `SWITCH_THEME`, `EXPORT_SINGLE_THEME`, `DETECT_THEMES`
   - Implementare `switchFigmaMode()` function

2. **`src/classes/VariableManager.ts`**
   - Aggiungere `diffTokens()` method
   - Implementare incremental update logic
   - Progress indicators granulari

3. **`src/classes/TokenProcessor.ts`**
   - Implementare `detectThemesFromJSON()`
   - Parsing selettivo per collection
   - Lazy loading logic

4. **`src/classes/VariableExporter.ts`**
   - Implementare `exportSingleTheme()`
   - Multi-format export (dev-ready)

5. **Nuovo: `src/classes/CacheManager.ts`**
   - Cache CRUD operations
   - Hash-based validation
   - Invalidation strategy

### Frontend UI
6. **`ui.html`**
   - Theme Switcher panel (HTML + CSS)
   - Theme Manager tab
   - Visual hierarchy styling
   - Progress indicators UI
   - Import preview con swatches

### Data Structure
7. **`clara-tokens.json`**
   - Aggiungere `$metadata` section
   - Versioning info
   - Theme tracking

---

## 🚀 Quick Start - Implementazione Immediata

### Fase 1: Theme Switcher (4h)

```typescript
// 1. Aggiungere in main-figma.ts
const MESSAGE_TYPES = {
  // ... existing
  SWITCH_THEME: 'switch-theme',
  GET_ACTIVE_THEMES: 'get-active-themes',
  THEMES_DATA: 'themes-data'
};

async function handleSwitchTheme(msg: any) {
  const targetTheme = msg.theme;
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  for (const collection of collections) {
    const mode = collection.modes.find(m => m.name === targetTheme);
    if (mode) {
      // Apply to current page
      figma.currentPage.setSharedPluginData('clara-plugin', 'activeMode', mode.modeId);
    }
  }

  figma.ui.postMessage({
    type: 'theme-switched',
    theme: targetTheme,
    success: true
  });
}
```

```html
<!-- 2. Aggiungere in ui.html -->
<div class="theme-switcher-panel">
  <h3>🎨 Quick Theme Switch</h3>
  <div class="theme-buttons">
    <button onclick="switchTheme('clara')" class="theme-btn theme-clara">
      Clara
    </button>
    <button onclick="switchTheme('mooney')" class="theme-btn theme-mooney">
      Mooney
    </button>
    <button onclick="switchTheme('atm')" class="theme-btn theme-atm">
      ATM
    </button>
  </div>
</div>

<script>
function switchTheme(themeName) {
  parent.postMessage({
    pluginMessage: {
      type: 'switch-theme',
      theme: themeName
    }
  }, '*');
}
</script>
```

### Test Quick Win
1. Build plugin: `npm run build`
2. Reload in Figma
3. Testare theme switching
4. Verificare <1s response time

---

## 🔗 Riferimenti

### Audit e Analisi
- [REPORT-WHITELABEL.md](items_iterazione_audit/REPORT-WHITELABEL.md) - Report sistema whitelabel
- [README-WHITELABEL.md](items_iterazione_audit/README-WHITELABEL.md) - Quick start guide
- [richiesta-miglioramento-presentazione-token.md](items_iterazione_audit/censimento 002/richiesta-miglioramento-presentazione-token.md) - UX guidelines Design vs Dev

### File Correnti
- [clara-tokens.json](clara-tokens.json) - Token system (3 collections, 3 themes)
- [ClaraPlugin/](ClaraPlugin/) - Plugin source code
- [project-knowledge.md](.claude/project-knowledge.md) - Project context
- [session-notes.md](.claude/session-notes.md) - Session tracking

### Tool Esterni
- **Gemini CLI**: Sub-agente per validazione e testing
- **Figma Variables API**: [Plugin API Docs](https://www.figma.com/plugin-docs/api/properties/figma-variables/)
- **W3C Design Tokens**: [Spec](https://design-tokens.github.io/community-group/format/)

---

## ✅ Action Items

### Immediate (Oggi)
- [ ] Review piano con team
- [ ] Prioritize Sprint 1 features
- [ ] Setup tracking per metriche (import time baseline)

### Short Term (Questa Settimana)
- [ ] Implementare Theme Switcher UI
- [ ] Auto-detect modes function
- [ ] Visual hierarchy CSS

### Medium Term (Prossime 2 Settimane)
- [ ] Cache system completo
- [ ] Diff algorithm
- [ ] Export single theme

### Long Term (Prossimo Mese)
- [ ] Metadata system
- [ ] Advanced preview
- [ ] Full performance optimization

---

**Documento creato**: 2025-11-03
**Ultima modifica**: 2025-11-03
**Versione**: 1.0.0
**Owner**: Mattia
**Status**: 📋 Planning → Pronto per implementazione

---

## 💬 Feedback da Gemini CLI

> "La riorganizzazione del JSON è il fondamento. Da lì, puoi ottimizzare il plugin per leggere questa nuova struttura in modo più intelligente e migliorare l'interfaccia utente per rendere il cambio di tema un'operazione rapida e indolore."

**Key Insights**:
1. ✅ Struttura 3-livelli è corretta (global/semantic/components)
2. ✅ Figma Modes come "Source of Truth"
3. ✅ Theme Switcher = quick win più impattante
4. ✅ Cache + Diff = performance boost massimo

---

## 🎉 Risultato Atteso

Plugin Clara ottimizzato per **frequent theme switching**:
- ⚡ **30x più veloce** per switch tema
- 🎨 **Instant preview** dei 3 temi
- 💾 **Cache intelligente** riduce import da 30s → 5s
- 📦 **Export dev-ready** single-theme JSON
- ✨ **UX migliorata** con visual hierarchy chiara

**ROI**: Workflow designer/dev migliorato drasticamente, time-to-market ridotto per nuovi brand.