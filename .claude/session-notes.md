# Orbit Design System - Note di Sessione

## 🎯 Stato Attuale del Progetto

### ✅ Completato - SESSIONE CORRENTE (2025-12-06):

#### **REBRANDING: Clara → Orbit Design System** 🚀

Il progetto è stato rinominato da "Clara WhiteLabel" a "Orbit Design System". La nuova struttura riflette un sistema di design tokens più maturo con:

**Nuova Struttura Directory**:
```
Mooney/
├── Figma Plugin/
│   ├── clara plugin/          (legacy - plugin Figma Clara Tokens)
│   └── orbit-station/         (NUOVO - plugin Orbit Station)
├── orbit-tokens/              (NUOVO - repository ufficiale tokens)
│   ├── pelican/               (tokens formato W3C DTCG)
│   │   ├── pelican.json       (token set completo ~120KB)
│   │   ├── pelican-component-tokens.json
│   │   ├── semantic-brand.json
│   │   └── README.md
│   └── split-tokens.js        (script per split tokens)
├── staging-tokens/            (tokens in staging per audit)
│   ├── orbit-audit.json       (~104KB)
│   └── orbit-audit-semantic.json (~62KB)
├── themeBuilder/              (app React/Vite per theme building)
├── items_iterazione_audit/    (censimenti e audit storici)
└── .claude/                   (project knowledge + session notes)
```

**Plugin Orbit Station** (`Figma Plugin/orbit-station/`):
- Plugin Figma completo per gestione tokens
- Supporta Team Library integration
- Network access: fonts.googleapis.com, fonts.gstatic.com, api.github.com
- Capacità: inspect, teamlibrary
- Build: TypeScript → code.js (~195KB)
- UI: ui.html (~494KB)

**Formato Tokens (W3C DTCG)**:
- Struttura: `global` → `colors` → `{palette}` → `{shade}` → `{$value, $type}`
- Palette colori: neutral, gray, teal, blue, red, green, yellow, orange, purple
- Scale: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300

**GitHub Repository** (orbit-tokens):
- Repository locale inizializzato con .git
- Pronto per push a `pluservice/orbit-design-system-tokens`
- ⚠️ RICORDA: Push manuale dall'utente, MAI da Claude

---

### ✅ Completato - SESSIONI PRECEDENTI:

#### **Library Support in Clara Plugin** (2025-12 early):
- Integrato supporto Team Library nel flusso import JSON
- Fix brand.theme onboarding bug
- Backup pre-refactoring theme panel

#### **Riorganizzazione Plugin e Icon Set** (2025-11-04):
- Spostato plugin Clara in `Figma Plugin/clara plugin/`
- Aggiunto icon set separato
- Cleanup file obsoleti

#### **Rimozione GitHub dal Plugin Clara** (2025-10-31):
- Plugin completamente autonomo
- Zero network access, zero dipendenze esterne
- 100% offline-capable

#### **Sistema Token Primitives e Semantic** (2025-10-29/30):
- Primitives: colors, spacing, radius, typography scales
- Semantic Colors: 3 temi (clara, mooney, atm)
- T-shirt sizing (5xs-4xl)

---

## 📋 TODO per Prossima Sessione

### 1. Semantic Typography - Hybrid Scale ⚠️ PRIORITÀ ALTA

**Struttura da implementare**:
```json
"semantic": {
  "typography": {
    "display": { "lg", "md", "sm" },
    "title": { "lg", "md", "sm" },
    "body": { "lg", "md", "sm" },
    "label": { "lg", "md", "sm" },
    "ui": { "button", "link", "input" }
  }
}
```

### 2. Component Tokens ⚠️ PRIORITÀ MEDIA

**Da completare**: input, card, badge, checkbox, switch, tab, accordion, tag

### 3. Orbit Station Plugin

- Completare features di import/export
- Validare integrazione con pelican.json
- Test con Team Libraries

### 4. ThemeBuilder App

- App React/Vite per visual theme building
- Integrazione con token format W3C

---

## 🔧 Riferimenti Tecnici

### File Paths:
- **Token ufficiali**: `/orbit-tokens/pelican/pelican.json` ⭐
- **Plugin Orbit**: `/Figma Plugin/orbit-station/`
- **Plugin Clara (legacy)**: `/Figma Plugin/clara plugin/`
- **ThemeBuilder**: `/themeBuilder/`
- **Staging**: `/staging-tokens/`

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
1. W3C DTCG format ($value, $type)
2. T-shirt sizing per spacing
3. React Native focus - no h1/h2 HTML tags
4. Scale numeriche (5-300) per colori
5. Repository GitHub: `pluservice/orbit-design-system-tokens`
6. Push SOLO manuale dall'utente

---

## 📈 Storico Sessioni

**2025-12-06**: Audit tokens, rebranding a Orbit Design System, nuova struttura progetto
**2025-12-05**: Library support integration, theme panel preparation
**2025-11-04**: Riorganizzazione plugin, cleanup
**2025-10-31**: Rimozione GitHub da Clara plugin
**2025-10-30**: Primitives e semantic colors completati
**2025-10-29**: Setup iniziale token system

---

## 💡 Note dall'Utente

- "non fare nessun commit se non chiaramente richiesto da me"
- Push SOLO manuale - su GitHub non deve essere visibile il lavoro di Claude
- Usa Gemini CLI come sub-agente per testing/validazione
- Repository cliente: `pluservice/orbit-design-system-tokens`

---

## 📝 REGOLA: Aggiornamento Session Notes

**OBBLIGATORIO dopo ogni grande modifica** - Claude DEVE aggiornare questo file con:

1. **Recap Pelican** - modifiche a `pelican.json`: cosa aggiunto/rimosso/modificato
2. **Cosa è andato bene ✅** - successi, problemi risolti, ottimizzazioni
3. **Cosa è andato male ❌** - bug, decisioni da rivedere, workaround
4. **Lezioni apprese 💡** - pattern da riutilizzare, errori da evitare

**Formato sessione:**
```
### Sessione YYYY-MM-DD
**Pelican:** [modifiche tokens]
**Bene:** [successi]
**Male:** [problemi]
**Lezioni:** [insights]
```

---

## 📊 Metriche Attuali

**Orbit Station Plugin**:
- code.js: ~195KB
- ui.html: ~494KB
- Build: TypeScript ✅

**Token Files**:
- pelican.json: ~120KB
- semantic-brand.json: ~98KB
- orbit-audit.json: ~104KB

---

*Ultimo aggiornamento: 2025-12-06*
*Sistema: Orbit Design System*
*Plugin: Orbit Station (nuovo) + Clara Plugin (legacy)*
*Status: Tokens ✅ | Plugin ✅ | Typography ⏳ | Components ⏳*
