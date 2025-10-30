# Clara WhiteLabel - Project Knowledge Base

## 📋 Project Overview

**Nome**: Clara WhiteLabel
**Cliente**: Mooney / MyCicero
**Scopo**: Sistema di design tokens multi-brand per applicazioni React Native

### Obiettivo Principale

Fornire al cliente Mooney/MyCicero un **JSON multi-brand** che funzioni sia per Figma che per sviluppo, gestendo tutte le personalizzazioni necessarie per una white label. Il nome "Clara" è stato scelto per semplicità e originalità come brand agnostico di default.

---

## 👥 Target Audience

**Designer** e **Developer** devono lavorare **1:1** con questo sistema:
- **Designer**: Creano e modificano token in Figma
- **Developer**: Importano JSON e generano codice React Native
- **Requisito**: Perfetta sincronizzazione bidirezionale Figma ↔ Code

---

## 🎨 Sistema Temi

### Temi Attuali (3)

1. **clara** - Tema default agnostico
   - Background: Dark (#1e1e1e - grey.950)
   - Accent: Violet (#8b5cf6 - violet.500)
   - Stile: Simile a Cursor/VS Code dark theme
   - Uso: Default per tutti i nuovi brand

2. **mooney** - Cliente specifico
   - Primary: Blue (#00587c - blue.700)
   - Secondary: Cyan (#00aec7 - cyan.500)
   - Accent: Yellow (#ffcf23 - yellow.600)

3. **atm** - Cliente specifico
   - Primary: Red (#dd0000 - red.500)
   - Secondary: Orange (#f48221 - orange.500)
   - Accent: Yellow (#fec627 - yellow.500)

### Scalabilità

- **Capacità massima**: 20 temi contemporaneamente (limite Figma Variables)
- **Architettura**: Pronta per aggiungere nuovi brand senza refactoring

---

## 🛠 Stack Tecnico

### Confermato

- **Frontend**: React Native (mobile)
- **Design**: Figma + Clara WhiteLabel plugin
- **Formato**: W3C Design Tokens (JSON)
- **Plugin**: Fork di Luckino → Clara WhiteLabel

### Probabile

- **Language**: TypeScript (da confermare)
- **Build system**: Da definire

---

## 🔄 Workflow Ideale

### Flusso Target (Bidirezionale)

```
┌─────────────────┐         ┌──────────────────┐
│                 │ Export  │                  │
│  Figma Design   │ ──────> │   JSON Tokens    │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
        ↑                            │
        │                            │ Import
        │ Import                     ↓
        │                   ┌──────────────────┐
        │                   │                  │
        └───────────────────│  React Native    │
          Export            │      Code        │
                            │                  │
                            └──────────────────┘
```

### Flusso Attuale

1. **Designer**: Figma → Export JSON (Clara WhiteLabel plugin)
2. **Developer**: Import JSON → Genera codice React Native
3. **Obiettivo**: Abilitare anche Code → Figma (bidirezionale completo)

### Note Importanti

- **SEMPRE** rispettare mapping Scope/Type per Figma Variables
- Export per codice usa funzioni esistenti del plugin Clara
- Import in Figma deve validare struttura JSON e alias

---

## 🏗 Architettura Token System

### Layer Hierarchy (3 livelli)

```
┌──────────────────────────────────────────┐
│         PRIMITIVES                        │
│  Raw values: colors 50-900, spacing,     │
│  radius, typography scales                │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         SEMANTIC                          │
│  Brand-aware: colors, spacing, radius,   │
│  shadow, typography (multi-mode)          │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         COMPONENTS                        │
│  Component-specific: button, input,      │
│  card, badge, etc. (reference semantic)  │
└──────────────────────────────────────────┘
```

### W3C Design Tokens Format

Ogni token ha:
- `$value`: Il valore (può essere stringa, numero, oggetto multi-mode)
- `$type`: Tipo per Figma Variables (color, spacing, fontSize, etc.)
- `$description`: Descrizione human-readable (opzionale ma consigliata)

### Multi-Mode Tokens

I semantic e component tokens usano oggetti multi-mode per supportare i 3 temi:

```json
{
  "semantic": {
    "colors": {
      "brand": {
        "primary": {
          "$value": {
            "clara": "{primitives.colors.violet.500}",
            "mooney": "{primitives.colors.blue.700}",
            "atm": "{primitives.colors.red.500}"
          },
          "$type": "color",
          "$description": "Primary brand color"
        }
      }
    }
  }
}
```

---

## 📐 Design Guidelines

### 1. Color Primitives

**Regola**: Tutte le palette devono avere scale **complete e consistenti 50-900**

- **50**: Lightest (backgrounds)
- **100-200**: Very light to light
- **300-400**: Light-medium to medium
- **500**: Primary/vibrant (punto di riferimento)
- **600-700**: Dark to deeper
- **800-900**: Very dark to darkest

**Palette attuali**:
- blue, cyan, yellow, grey, red, green, orange, purple, violet, pink
- grey ha valori custom: 250, 350, 650, 750, 950 (per GREYSCALE dal dev file)

### 2. Spacing System

**NO numeri**, **SI t-shirt sizing** senza troppi "x":

```
5xs, 4xs, 3xs, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl
```

- Baseline: 4px
- Semantic spacing è **theme-agnostic** (strutturale, non brand-specific)

### 3. Typography

**NO tag HTML** (h1, h2, h3) - React Native non li supporta

**SI scala semantica hybrid**:
- `display` (lg/md/sm) - Hero, page titles
- `title` (lg/md/sm) - Card titles, sections
- `body` (lg/md/sm) - Paragraph text
- `label` (lg/md/sm) - Form labels, helper text
- `ui` (button/link/input) - Interactive elements

### 4. Border Width

**Tipo corretto**: `strokeWidth` (non "dimension")

Mapping Figma:
- `strokeWidth` → `STROKE` scope
- Permette di usare borderWidth come Variables in Figma

### 5. Opacity

**NO opacity** - Lavorare solo con **HEX colors interi**

Motivo: Migliore compatibilità e prestazioni, evita problemi di rendering

### 6. Radius

Scale estesa (13 valori):
```
none, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, full
```

---

## 🔧 Figma Variables Integration

### Scope/Type Mapping

Riferimento: `/Users/mattia/Documents/Mattia/Progetti/Mooney/ClaraWhiteLabel/1756900008529 (1).png`

| JSON $type | Figma Scope |
|-----------|-------------|
| `strokeWidth` | `STROKE` |
| `spacing` | `GAP` |
| `size` | `WIDTH_HEIGHT` |
| `borderRadius` | `CORNER_RADIUS` |
| `opacity` | `LAYER_OPACITY` |
| `textColor` / `color` | `TEXT_COLOR` |
| `fontFamily` | `FONT_FAMILY` |
| `fontWeight` | `FONT_WEIGHT` |
| `fontSize` | `FONT_SIZE` |

### Plugin: Clara WhiteLabel

**Location**: `/Users/mattia/Documents/Mattia/Progetti/Mooney/ClaraWhiteLabel/`

**Storia**:
- Fork di Luckino plugin
- Rinominato "Clara WhiteLabel"
- Mantenute tutte le guide MD, API, scope/type management

**Funzionalità**:
- Import JSON → Figma Variables (max 20 modes)
- Export Figma Variables → JSON
- Alias resolution multi-mode
- Hex-to-RGB conversion
- Type/Scope validation

**Build**: `npm run build` (genera `code.js`)

---

## 📂 File Structure

```
Mooney/
├── .claude/
│   ├── session-notes.md          # Note di sessione per continuità
│   └── project-knowledge.md       # Questo file
├── items_iterazione_audit/
│   ├── whitelabel-tokens-atm.json # Token system principale
│   └── censimento 002/
│       └── theme-mooneygo-updated.json  # Reference dev file
└── ClaraWhiteLabel/              # Plugin Figma (fork Luckino)
    ├── src/
    ├── dist/
    ├── code.js                   # Build output
    └── [docs & guidelines]
```

---

## 🎯 Priorità Progetto

### 1. Velocità di Implementazione (MASSIMA)
- Must: Super rapida
- Import/Export deve essere immediato
- Zero friction tra Figma e Code

### 2. Flessibilità Brand (ALTA)
- Must: Supportare nuovi brand facilmente
- Nice: Scalare fino a 20 temi senza refactoring

### 3. Performance (MEDIA)
- Must: Essere veloci nell'esecuzione
- Nice: Ottimizzare bundle size

### 4. Consistenza Visiva (BASSA)
- Nice to have, ma non prioritaria rispetto a velocità/flessibilità

---

## 📚 Mapping da Dev File

### Reference File
`/Users/mattia/Documents/Mattia/Progetti/Mooney/items_iterazione_audit/censimento 002/theme-mooneygo-updated.json`

### Color Mapping

| Dev File | Primitives | Hex |
|----------|-----------|-----|
| GREYSCALE_1 | grey.100 | #f6f6f6 |
| GREYSCALE_2 | grey.250 | #dddddd |
| GREYSCALE_3 | grey.350 | #bbbbbb |
| GREYSCALE_4 | grey.600 | #787878 |
| GREYSCALE_5 | grey.700 | #4f4f4f |
| BLACK | grey.950 | #1e1e1e |
| MOONEYGO_PRIMARY_3 | blue.700 | #00587c |

### Component Reference

**UIButton** (dal dev file):
- roles: primary, secondary, tertiary
- Properties: borderColor, backgroundColor, textColor, borderWidth, textWeight
- States: disabled, highlighted (opacity based)

**UIText** (dal dev file):
- Styles: h1-h5, body1-2, subtitle1-2, button, caption, overline
- Mapping a fontSize primitives (2xs-4xl)

**QuickTag** (dal dev file):
- Variants: default, active, error, disabled
- Properties: background, text

---

## ✅ Stato Attuale (2025-10-30)

### Completato

1. ✅ **Primitive Colors** - Tutte le scale 50-900 complete
   - blue, cyan, yellow, red, green, orange, purple, pink, violet
   - grey con custom values (250, 350, 650, 750, 950)

2. ✅ **Semantic Colors** - Migrati a 3 temi
   - brand, surface, text, border, button, feedback

3. ✅ **Semantic Spacing/Radius/Shadow**
   - Spacing: theme-agnostic t-shirt sizing
   - Radius: 3 temi
   - Shadow: card shadow con strong variant per clara

4. ✅ **Primitives Updates**
   - T-shirt sizing spacing (5xs-4xl)
   - borderWidth con strokeWidth type
   - Extended radius scale
   - fontSize con mapping UIText
   - letterSpacing aggiunto

5. ✅ **Build Clara WhiteLabel Plugin** - Successful

### In Corso

- 📋 Semantic Typography (hybrid scale: display/title/body/label/ui)
- 📋 9 Component Tokens (input, card, badge, checkbox, switch, tab, accordion, tag, typography)

### Prossimi Step

1. Implementare semantic typography (Option C hybrid)
2. Creare i 9 component tokens rimanenti
3. Test completo import/export Figma ↔ Code
4. Validazione con team sviluppo

---

## 🚨 Regole Importanti

### DO's ✅

1. **Sempre** usare scale colori 50-900 complete
2. **Sempre** usare t-shirt sizing per spacing (5xs-4xl)
3. **Sempre** usare `strokeWidth` type per borderWidth
4. **Sempre** fornire `$description` chiare
5. **Sempre** usare alias references nei semantic/components
6. **Sempre** supportare i 3 temi (clara, mooney, atm)
7. **Sempre** validare JSON syntax prima del commit
8. **Sempre** buildare plugin dopo modifiche al codice

### DON'Ts ❌

1. **Mai** usare opacity - solo HEX interi
2. **Mai** usare tag HTML (h1, h2) in typography
3. **Mai** usare numeri per spacing (spacing.1, spacing.2)
4. **Mai** usare "dimension" type per borderWidth
5. **Mai** creare temi oltre i 20 (limite Figma)
6. **Mai** riferire direttamente primitives da components (usare semantic)
7. **Mai** esagerare con le "x" nel naming (XXXXS ❌, 5xs ✅)
8. **Mai** fare commit senza richiesta esplicita dell'utente

---

## 🔗 Link Utili

- **Figma Variables Docs**: Standard W3C Design Tokens
- **React Native Styling**: https://reactnative.dev/docs/colors
- **Tailwind Colors**: Riferimento per scale colori consistenti
- **Shadcn**: Ispirazione per grey scale

---

## 👤 User Preferences

- **Comunicazione**: Diretta e concisa
- **Commit**: Solo quando esplicitamente richiesto
- **Ottimizzazione**: Sempre preferita
- **Validazione**: Usa Gemini CLI come sub-agente quando possibile
- **Lingua**: Italiano preferito per comunicazione

---

*Ultimo aggiornamento: 2025-10-30*
*Versione: 1.0*
*Status: Production-ready (primitives & semantic colors)*
