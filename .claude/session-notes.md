# Clara WhiteLabel - Note di Sessione

## 🎯 Stato Attuale del Progetto

### ✅ Completato - SESSIONE CORRENTE (2025-11-04):

#### **RIORGANIZZAZIONE PLUGIN E ICON SET** 🔄

**Attività**:
- ✅ Spostato plugin Clara in nuova struttura: `Figma Plugin/clara plugin/`
- ✅ Aggiunto icon set separato: `Figma Plugin/clara icon set/`
- ✅ Mantenuto file output ufficiale: `clara-tokens.json` nella root
- ✅ Cleanup file obsoleti: rimossi file temporanei e vecchi JSON di test
- ✅ Aggiornamento documentazione di sessione

**Nuova Struttura Directory**:
```
Mooney/
├── Figma Plugin/
│   ├── clara plugin/          (plugin Figma Clara Tokens - ex ClaraPlugin)
│   └── clara icon set/         (set di icone SVG per il sistema)
├── clara-tokens.json           (OUTPUT UFFICIALE - sempre pronto per import)
├── json-dev/                   (file JSON di sviluppo)
├── items_iterazione_audit/     (censimenti e audit storici)
└── .claude/                    (project knowledge + session notes)
```

**Stato Progetto Confermato**:
- ✅ Plugin Clara Tokens: GitHub-free, completamente autonomo
- ✅ Primitives: Completi (colors, spacing, radius, typography scales)
- ✅ Semantic Colors: Completi per 3 temi (clara, mooney, atm)
- ⏳ Semantic Typography: TODO (hybrid scale display/title/body/label/ui)
- ⏳ Component Tokens: 1/10 completati (solo button)

**File Output Ufficiale**: `clara-tokens.json` - pronto per import Figma

**Prossimi Obiettivi Prioritari**:
1. Semantic Typography - Hybrid Scale (ALTA priorità)
2. Component Tokens - 9 componenti rimanenti (MEDIA priorità)

---

### ✅ Completato - SESSIONE PRECEDENTE (2025-10-31):

#### **RIMOZIONE COMPLETA GITHUB DAL PLUGIN FIGMA CLARA** 🎊

**Motivazione**: Rimozione di tutte le feature logiche, accessi di rete ed elementi relativi a GitHub dal plugin ClaraPlugin.

**File Eliminati Completamente**:
- ❌ `ClaraPlugin/src/types/github.ts`
- ❌ `ClaraPlugin/src/utils/githubApi.ts`

**File Modificati**:

1. **manifest.json** ✅
   - Rimosso completamente `networkAccess` (api.github.com, fonts.googleapis.com, fonts.gstatic.com)
   - Plugin ora privo di qualsiasi accesso esterno

2. **Backend TypeScript** (100% pulito) ✅

   **src/types/plugin.ts:**
   - Rimossi 4 UIMessageType: `github-upload`, `github-config-save`, `github-config-load`, `github-config-clear`
   - Rimossa interface `GitHubConfig` completa

   **src/types/index.ts:**
   - Rimossi export `github.js`
   - Rimossi tutti re-export GitHubConfig types

   **src/utils/index.ts:**
   - Rimossi 6 export funzioni: `uploadToGitHub`, `uploadMultipleFilesToGitHub`, `validateGitHubConfig`, `generateFileName`, `parseRepositoryUrl`, `testGitHubConnection`
   - Rimossi 3 type export: `GitHubConfig`, `GitHubUploadResult`, `GitHubFileInfo`

   **src/main-figma.ts:**
   - Rimossi 9 MESSAGE_TYPES GitHub dal const
   - Rimossi 6 case statements GitHub dal message handler
   - Rimosse 5 funzioni async handler complete:
     - `handleLoadGitHubConfig()`
     - `handleSaveGitHubConfig(msg)`
     - `handleClearGitHubConfig()`
     - `handleTestGitHubConnection(msg)`
     - `handleUploadToGitHub(msg)`
   - Rimosso parametro `github` da `handleExportTextStyles()`

3. **Frontend UI** (100% pulito) ✅

   **ui.html - Statistiche Finali:**
   - 📏 **11,752 righe → 10,711 righe** (-1,041 righe, -8.9%)
   - 💾 **482 KB → 422 KB** (-60 KB, -12.4%)
   - 🔍 **117+ riferimenti GitHub → 0** (-100%)

   **Rimozioni Effettuate:**
   - ✂️ Rimosse 3 sezioni HTML complete "GitHub Integration Section" (JSON, CSS, Text Styles)
   - ✂️ Rimossi 3 pulsanti "Push to GitHub" dai menu Get Code
   - ✂️ Rimosse 16+ funzioni JavaScript:
     - `handleGitHubTestResult()`
     - `handleGitHubConfigResult()`
     - `uploadTextStylesToGitHub()`
     - `getGitHubConfig()`
     - `validateGitHubConfig()`
     - `loadSavedGitHubConfig()`
     - `saveGitHubConfig()`
     - `clearSavedGitHubConfig()`
     - `testGitHubConnection()`
     - `handleGitHubUpload()`
     - `initGitHubEventListeners()`
     - `initGitHubSync()`
     - `saveGitHubConfigToStorage()`
     - `applyGitHubConfigToAllTabs()`
     - `performGitHubUpload()`
     - `uploadToGitHub()`
   - ✂️ Rimossi 8 case statements dal message handler switch
   - ✂️ Rimossa tutta la logica button visibility per GitHub
   - ✂️ Rimossi tutti event listeners GitHub
   - ✂️ Rimossa costante `GITHUB_PATTERNS`
   - ✂️ Rimossi commenti e riferimenti GitHub

**Validazione Finale:**
- ✅ **Build TypeScript: SUCCESS** (0 errori, 0 warning)
- ✅ **Code.js generation: SUCCESS**
- ✅ **Riferimenti GitHub rimasti: 0** (grep conferma)
- ✅ **Network access: 0 domini**

**Tools Utilizzati:**
- Python scripts per rimozione massiva (remove_github_js.py)
- sed per rimozioni precise di sezioni HTML
- Edit tool per modifiche chirurgiche TypeScript
- Gemini CLI come sub-agente per validazione

**Risultato**: Plugin completamente autonomo, zero dipendenze esterne, zero accessi di rete, pronto per distribuzione sicura.

---

### ✅ Completato in Sessioni Precedenti:

1. **Primitive Colors - Scale Complete 50-900**
   - Tutti i colori ora hanno scale consistenti da 50 (lightest) a 900 (darkest)
   - blue, cyan, yellow, red, green, orange, purple, pink, violet
   - grey con valori custom: 250, 350, 650, 750, 950
   - Ogni valore ha descrizioni chiare

2. **Semantic Tokens - Migrazione a 3 Temi**
   - Ridotto da 5 temi (mooney, corporate, creative, eco, atm) a 3 temi:
     - **clara**: tema agnostico dark (background #1e1e1e, accent violet #8b5cf6)
     - **mooney**: tema blue (#00587c)
     - **atm**: tema red (#dd0000)

3. **Semantic Colors Completati**:
   - brand (primary/secondary/accent)
   - surface (primary/secondary/tertiary) - clara usa dark backgrounds
   - text (primary/secondary/inverse) - clara usa light text
   - border (primary/secondary/focus)
   - button (hover, disabled)
   - feedback (success/warning/error/info + light variants)

4. **Semantic Spacing/Radius/Shadow**:
   - Spacing: theme-agnostic con t-shirt sizing (5xs-4xl)
   - Radius: 3 temi (clara/mooney/atm)
   - Shadow: card shadow con stronger shadow per clara dark mode

5. **Primitives Updates**:
   - T-shirt sizing per spacing: 5xs, 4xs, 3xs, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl
   - borderWidth con strokeWidth type (per Figma Variables)
   - Extended radius scale (13 valori)
   - fontSize con mapping a UIText
   - letterSpacing aggiunto

---

## 📋 TODO per Prossima Sessione

### 1. Semantic Typography - Hybrid Scale (Option C) ⚠️ PRIORITÀ ALTA

**Obiettivo**: Rimuovere h1/h2/h3 (non adatti a React Native) e implementare la scala semantic hybrid approvata.

**Struttura da implementare**:

```json
"semantic": {
  "typography": {
    "display": {
      "lg": { fontSize, fontWeight, lineHeight, letterSpacing },
      "md": { ... },
      "sm": { ... }
    },
    "title": {
      "lg": { ... },
      "md": { ... },
      "sm": { ... }
    },
    "body": {
      "lg": { ... },
      "md": { ... },
      "sm": { ... }
    },
    "label": {
      "lg": { ... },
      "md": { ... },
      "sm": { ... }
    },
    "ui": {
      "button": { ... },
      "link": { ... },
      "input": { ... }
    }
  }
}
```

**Mapping dai primitives**:
- display.lg: fontSize 4xl (40px), tight lineHeight, tight letterSpacing
- display.md: fontSize 3xl (32px)
- display.sm: fontSize 2xl (24px)
- title.lg: fontSize xl (20px)
- title.md: fontSize lg (18px)
- title.sm: fontSize base (16px)
- body.lg: fontSize base (16px), normal lineHeight
- body.md: fontSize sm (14px)
- body.sm: fontSize xs (12px)
- label.lg: fontSize sm (14px)
- label.md: fontSize xs (12px)
- label.sm: fontSize 2xs (10px)
- ui.button: fontSize sm (14px), bold weight
- ui.link: fontSize sm (14px), normal weight
- ui.input: fontSize base (16px), normal weight

**Temi**: Clara può usare fontFamily diversa se necessario, altrimenti theme-agnostic.

---

### 2. Component Tokens - 9 Componenti da Creare ⚠️ PRIORITÀ MEDIA

**Già esistente**:
- ✅ button (primary, secondary, disabled)

**Da creare**:

#### 2.1 Input
```json
"input": {
  "background": "{semantic.colors.surface.primary}",
  "border": "{semantic.colors.border.primary}",
  "borderFocus": "{semantic.colors.border.focus}",
  "text": "{semantic.colors.text.primary}",
  "placeholder": "{semantic.colors.text.secondary}",
  "radius": "{semantic.radius.input}",
  "borderWidth": "{primitives.borderWidth.thin}",
  "padding": "{semantic.spacing.component.md}",
  "disabled": { ... }
}
```

#### 2.2 Card
```json
"card": {
  "background": "{semantic.colors.surface.secondary}",
  "border": "{semantic.colors.border.secondary}",
  "radius": "{semantic.radius.card}",
  "shadow": "{semantic.shadow.card}",
  "padding": "{semantic.spacing.component.lg}"
}
```

#### 2.3 Badge
```json
"badge": {
  "success": { background, text },
  "error": { background, text },
  "warning": { background, text },
  "info": { background, text },
  "radius": "{semantic.radius.badge}",
  "padding": "{semantic.spacing.component.xs}"
}
```

#### 2.4 Checkbox
```json
"checkbox": {
  "unchecked": { background, border },
  "checked": { background, border, checkmark },
  "disabled": { ... },
  "radius": "{primitives.radius.xs}",
  "size": "20px"
}
```

#### 2.5 Switch
```json
"switch": {
  "on": { background, knob },
  "off": { background, knob },
  "disabled": { ... }
}
```

#### 2.6 Tab
```json
"tab": {
  "selected": { background, text, border },
  "unselected": { background, text, border },
  "hover": { ... }
}
```

#### 2.7 Accordion
```json
"accordion": {
  "expanded": { background, text, icon },
  "collapsed": { background, text, icon }
}
```

#### 2.8 Tag (QuickTag dal dev file)
```json
"tag": {
  "default": { background, text },
  "active": { background, text },
  "error": { background, text },
  "disabled": { background, text }
}
```

#### 2.9 Typography Component
```json
"typography": {
  "display": "{semantic.typography.display}",
  "title": "{semantic.typography.title}",
  "body": "{semantic.typography.body}",
  "label": "{semantic.typography.label}",
  "ui": "{semantic.typography.ui}"
}
```

**Note**:
- Tutti i componenti devono supportare i 3 temi (clara, mooney, atm)
- Usare alias ai semantic tokens, non direttamente ai primitives
- Verificare con dev file `theme-mooneygo-updated.json` per UIButton, QuickTag, UIText come reference

---

## 🔧 Riferimenti Tecnici

### File Paths:
- **Token output ufficiale**: `/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json` ⭐
- Token development: `/Users/mattia/Documents/Mattia/Progetti/Mooney/json-dev/`
- Dev reference: `/Users/mattia/Documents/Mattia/Progetti/Mooney/items_iterazione_audit/censimento 002/theme-mooneygo-updated.json`
- **Clara plugin**: `/Users/mattia/Documents/Mattia/Progetti/Mooney/Figma Plugin/clara plugin/` ⚠️ AGGIORNATO
- **Clara icon set**: `/Users/mattia/Documents/Mattia/Progetti/Mooney/Figma Plugin/clara icon set/` 🆕
- Luckino plugin (reference): `/Users/mattia/Documents/Mattia/Figma/Luckino/plugin`

### Figma Variable Scopes:
- strokeWidth → STROKE
- spacing → GAP
- size → WIDTH_HEIGHT
- borderRadius → CORNER_RADIUS
- opacity → LAYER_OPACITY
- textColor → TEXT_COLOR
- fontFamily → FONT_FAMILY
- fontWeight → FONT_WEIGHT
- fontSize → FONT_SIZE

### Decisioni Chiave:
1. NO opacity - solo HEX colors interi
2. T-shirt sizing (5xs-4xl) senza troppi "x"
3. React Native focus - no h1/h2 HTML tags
4. 3 temi: clara (default agnostic dark), mooney, atm
5. Clara = dark theme con violet accent come Cursor/VS Code
6. borderWidth usa strokeWidth type per Figma Variables
7. **Plugin SENZA GitHub** - zero network access, zero dipendenze esterne

### Color Primitives Mapping:
- Clara primary: violet.500 (#8b5cf6)
- Mooney primary: blue.700 (#00587c)
- ATM primary: red.500 (#dd0000)
- GREYSCALE_1-5 dal dev → grey.100, grey.250, grey.350, grey.600, grey.700
- BLACK dal dev → grey.950 (#1e1e1e)

---

## 🚀 Prossimi Passi Immediati

1. ✅ Build Clara WhiteLabel plugin
2. ✅ Test import con il JSON aggiornato
3. ✅ /init - Interview e documentazione progetto
4. ✅ **Rimozione completa GitHub dal plugin** (COMPLETATO 2025-10-31)
5. ⏳ Semantic typography (prossima sessione)
6. ⏳ Component tokens (prossima sessione)

---

## 💡 Note dall'Utente

- "essendo whitelabel, il colore e la ui del tema di default dovrà essere agnostico"
- "non fare nessun commit se non chiaramente richiesto da me"
- "cerca di ottimizzare il più possibile"
- "rimuovi tutte le feature logiche, access network ed elementi relative a Github" ✅ FATTO
- User preferisce essere conciso e diretto
- Usa Gemini CLI come sub-agente per testing/validazione

---

## 📊 Metriche Plugin ClaraPlugin

**Build Status**: ✅ SUCCESS (TypeScript 0 errors, 0 warnings)

**Codebase Size**:
- ui.html: 10,711 righe (422 KB)
- TypeScript src/: ~5,200 righe
- Compiled code.js: generato automaticamente

**Features**:
- ✅ Import JSON tokens
- ✅ Export JSON (simple & advanced)
- ✅ Export CSS/SCSS
- ✅ Text Styles extraction
- ✅ Preview import
- ✅ Collection management
- ❌ GitHub integration (RIMOSSO)
- ❌ Network access (RIMOSSO)

**Security**:
- 🔒 Zero network access
- 🔒 Zero external API calls
- 🔒 Zero credential storage
- 🔒 Plugin completamente autonomo

---

## 📈 Storico Sessioni

**2025-11-04**:
- Mattina: Recap completo sessioni + aggiornamento documentazione
- Sera: Riorganizzazione plugin Clara (spostato in `Figma Plugin/clara plugin/`), aggiunto icon set separato, cleanup file obsoleti
**2025-10-31**: Rimozione completa GitHub dal plugin ClaraPlugin
**2025-10-30**: Primitives colors, semantic colors, spacing/radius/shadow completati
**2025-10-29**: Migrazione a 3 temi (clara/mooney/atm), setup iniziale token system

---

*Ultimo aggiornamento: 2025-11-04*
*File tokens: clara-tokens.json (output ufficiale)*
*Plugin: ClaraPlugin (GitHub-free version)*
*Status: Plugin ✅ | Primitives ✅ | Semantic ✅ (colors only) | Components ⏳ | Typography ⏳*
