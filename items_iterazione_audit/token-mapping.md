# Token Mapping: Mooney → Whitelabel

## Overview

Questo documento descrive la mappatura automatica tra i token brand-specific di Mooney e la nuova struttura whitelabel generica.

## Strategia di Mappatura

### Principio Base
**ELIMINARE** tutti i nomi brand-specific (MOONEYGO_*, Semantic/MooneyGo) e sostituirli con **nomi generici** basati su ruolo semantico.

### Pattern Identificati

Dall'analisi automatica sono stati identificati i seguenti pattern nei token Mooney:

```json
{
  "PRIMARY": 52 token,
  "SECONDARY": 3 token,
  "ACCENT": 2 token,
  "GREY": 17 token,
  "BLUE": 7 token,
  "YELLOW": 3 token,
  "FEEDBACK": 6 token (SUCCESS, WARNING, DANGER),
  "MOBILITY": 40+ token (specifici dominio trasporti),
  "ATAC": 6 token (specifici integrazione ATAC)
}
```

## Mappature Dettagliate

### 1. Brand Colors (Identità Principale)

| Token Mooney Original | Token Whitelabel | Valore Mooney | Note |
|----------------------|------------------|---------------|------|
| `MOONEYGO_PRIMARY_3` | `semantic.colors.brand.primary` | #00587C | Blu primario Mooney |
| `MOONEYGO_PRIMARY_2` | `primitives.colors.blue.350` | #4D8AA3 | Blu medio (70% opacity) |
| `MOONEYGO_PRIMARY_1` | `primitives.colors.blue.100` | #E6EEF2 | Blu chiaro (10% opacity) |
| `MOONEYGO_SECONDARY_3` | `semantic.colors.brand.secondary` | #00AEC7 | Turchese primario |
| `MOONEYGO_SECONDARY_2` | `primitives.colors.cyan.200` | #99DFE9 | Turchese medio |
| `MOONEYGO_SECONDARY_1` | `primitives.colors.cyan.100` | #E6F7F9 | Turchese chiaro |
| `MOONEYGO_ACCENT_2` | `primitives.colors.yellow.700` | #EDA900 | Giallo scuro |
| `MOONEYGO_ACCENT_1` | `semantic.colors.brand.accent` | #FFC627 | Giallo primario |

### 2. Greyscale (Scala Grigi)

| Token Mooney | Token Whitelabel | Valore | Uso |
|--------------|------------------|--------|-----|
| `WHITE` | `primitives.colors.neutral.white` | #FFFFFF | Bianco puro |
| `GREYSCALE_1` / `MOONEYGO_GREY1` | `primitives.colors.grey.100` | #F6F6F6 | Background chiaro |
| `GREYSCALE_2` / `MOONEYGO_GREY2` | `primitives.colors.grey.200` | #ECECEC | Background secondario |
| `GREYSCALE_3` / `MOONEYGO_GREY4` | `primitives.colors.grey.400` | #BBBBBB | Bordi, separatori |
| `GREYSCALE_4` / `MOONEYGO_GREY5` | `primitives.colors.grey.500` | #787878 | Testo secondario |
| `GREYSCALE_5` | `primitives.colors.grey.600` | #4F4F4F | Testo grigio scuro |
| `BLACK` / `MOONEYGO_GREY10` | `primitives.colors.grey.900` | #1E1E1E | Testo primario |

### 3. Feedback Colors (Stati e Notifiche)

| Token Mooney | Token Whitelabel | Valore | Uso |
|--------------|------------------|--------|-----|
| `FEEDBACK_SUCCESS_DARK` / `MOONEYGO_SUCCESS` | `semantic.colors.feedback.success` | #358551 | Successo |
| `FEEDBACK_SUCCESS_LIGHT` | `semantic.colors.feedback.success-light` | #EEF6E5 | Background successo |
| `FEEDBACK_WARNING_DARK` / `MOONEYGO_WARNING` | `semantic.colors.feedback.warning` | #F9A000 | Attenzione |
| `FEEDBACK_WARNING_LIGHT` | `semantic.colors.feedback.warning-light` | #FCF3E4 | Background warning |
| `FEEDBACK_ERROR_DARK` / `MOONEYGO_DANGER` | `semantic.colors.feedback.error` | #DD0000 | Errore/pericolo |
| `FEEDBACK_ERROR_LIGHT` | `semantic.colors.feedback.error-light` | #FBDBDB | Background errore |
| `FEEDBACK_INFO_DARK` | `semantic.colors.feedback.info` | #00AEC7 | Informazione |
| `FEEDBACK_INFO_LIGHT` | `semantic.colors.feedback.info-light` | #ECFBFD | Background info |

### 4. Component Tokens

| Token Mooney | Token Whitelabel | Mapping |
|--------------|------------------|---------|
| `colors.DISABLED_LIGHT` | `components.button.disabled.background` | #BBBBBB → grey.400 |
| `colors.DISABLED_DARK` | `components.button.disabled.text` | #444 → grey.600 |
| `Brand.button.default-bg` | `components.button.primary.background` | Alias a brand.primary |
| `Brand.button.default-label` | `components.button.primary.text` | Alias a text.inverse |
| `Brand.button.border-radius` | `components.button.shared.border-radius` | 8px → radius.md |

### 5. Token Specifici Dominio (Non Mappati)

Questi token sono specifici del dominio Mooney (trasporti, ATAC) e **NON sono inclusi** nel sistema whitelabel base:

- **MOBILITY_***: 40+ token (BUS, TRAM, METRO, PARKING, ecc.)
- **ATAC_***: 6 token specifici integrazione ATAC
- **TICKET_STATUS_***: 3 token per stati biglietti
- **TAG_STATUS_***: 6 token per tag stato

**Strategia**: Questi token dovrebbero essere in una **collezione separata** chiamata `mooney-domain` o `mooney-mobility`, da importare **dopo** il sistema base whitelabel.

## Algoritmo di Mappatura Automatica

L'algoritmo implementato segue questa logica:

```
1. IDENTIFICA CATEGORIA
   - Pattern: MOONEYGO_PRIMARY → "brand.primary"
   - Pattern: MOONEYGO_SECONDARY → "brand.secondary"
   - Pattern: MOONEYGO_ACCENT → "brand.accent"
   - Pattern: MOONEYGO_GREY* → "grey" palette
   - Pattern: FEEDBACK_* → "feedback" roles
   - Pattern: MOBILITY_* → "domain-specific" (esclusi da base)

2. DETERMINA LIVELLO
   - *_3 / *_DARK → semantic level (ruolo)
   - *_2 / *_MEDIUM → primitives level (scala)
   - *_1 / *_LIGHT → primitives level (scala)

3. GENERA PATH
   - Semantic: semantic.colors.{categoria}.{livello}
   - Primitive: primitives.colors.{famiglia}.{shade}
   - Component: components.{componente}.{proprietà}

4. ASSEGNA MODES
   - "mooney": valore originale Mooney
   - "corporate": valore generico (blu standard)
   - "creative": valore creativo (viola/rosa)
   - "eco": valore ecologico (verde)
```

## Esempi di Utilizzo

### Prima (Brand-Specific)
```json
{
  "colors.MOONEYGO_PRIMARY_3": "#00587C",
  "colors.MOONEYGO_SECONDARY_3": "#00AEC7",
  "colors.MOONEYGO_ACCENT_1": "#FFC627"
}
```

### Dopo (Whitelabel)
```json
{
  "semantic": {
    "colors": {
      "brand": {
        "primary": {
          "$value": {
            "mooney": "{primitives.colors.blue.700}",
            "corporate": "{primitives.colors.blue.700}",
            "creative": "{primitives.colors.purple.500}",
            "eco": "{primitives.colors.green.500}"
          },
          "$type": "color"
        }
      }
    }
  },
  "primitives": {
    "colors": {
      "blue": {
        "700": {
          "$value": "#00587C",
          "$type": "color"
        }
      }
    }
  }
}
```

## Vantaggi della Nuova Struttura

### ✅ Prima dell'Upgrade (Brand-Specific)
- ❌ 100% token legati a "MOONEYGO"
- ❌ Impossibile riutilizzare per altri brand
- ❌ Refactoring completo richiesto per ogni nuovo brand
- ❌ Naming confuso (MOONEYGO_GREY17?)

### ✅ Dopo l'Upgrade (Whitelabel)
- ✅ 0% token brand-specific (solo nei modes)
- ✅ Riutilizzabile per 20+ brand immediatamente
- ✅ Aggiungere nuovo brand = aggiungere mode in `$value`
- ✅ Naming semantico chiaro (brand.primary, feedback.success)
- ✅ Segue best practice W3C Design Tokens
- ✅ Compatibile con Luckino plugin

## Migrazione Step-by-Step

### Fase 1: Import Primitives
```bash
# Import primitives collection (no modes)
# Contiene solo valori atomici
```

### Fase 2: Import Semantic
```bash
# Import semantic collection (con 4 modes)
# Contiene alias ai primitives
```

### Fase 3: Import Components
```bash
# Import components collection (con 4 modes)
# Contiene alias ai semantic
```

### Fase 4: (Opzionale) Import Domain-Specific
```bash
# Import mooney-mobility collection
# Contiene token specifici dominio Mooney
```

## Compatibilità

### Con Figma
- ✅ Supporta fino a 4 modes per collection (limite Figma)
- ✅ Usa sintassi alias Figma-compatibile: `{path.to.token}`
- ✅ Tutti i $type mappano a variabili Figma valide

### Con Luckino Plugin
- ✅ Formato W3C Design Tokens standard
- ✅ Tipografia atomizzata (no tipo composito `typography`)
- ✅ Ombre come stringhe CSS (`$type: "string"`)
- ✅ Spacing con unità px (`"8px"` → converti a float 8)
- ✅ Supporto `$description` per documentazione

### Con React Native / Web
- ✅ Esportabile come CSS variables
- ✅ Esportabile come SCSS/LESS
- ✅ Esportabile come JS objects
- ✅ Esportabile come Tailwind config

## Note Tecniche

### Gestione Opacity/Alpha
Token con opacity (es. `MOONEYGO_PRIMARY_3_OPACITY_79`) sono stati normalizzati:
- Valore RGBA conservato: `#00587CC9`
- Mappato a primitives con naming esplicito o come valore diretto

### Gestione Extra Colors
Token "EXTRA_COLOR" sono stati riallocati:
- `MOONEYGO_EXTRA_COLOR_1`: Mappato a `surface.tertiary`
- `MOONEYGO_EXTRA_COLOR_2`: Mappato a palette blue
- Naming generico per permettere riutilizzo

### Token non Mappati
Alcuni token legacy non hanno mapping diretto:
- `CIRCULAR_SLIDER_MAX_MINUTES`: Specifico componente, non incluso
- `MOONEYGP_MAP_BOTTOM_SHEET_80`: Typo nel nome, normalizzato
- Alcuni `MOBILITY_*`: Troppo specifici, vanno in collection separata

## Risorse

- [W3C Design Tokens Spec](https://design-tokens.github.io/community-group/format/)
- [Figma Variables API](https://www.figma.com/plugin-docs/api/properties/figma-variables/)
- [Luckino Plugin Docs](/Users/mattia/Documents/Mattia/Figma/Luckino/plugin/prompt%20md/DOCUMENTATION.md)

---

**Data Generazione**: 2025-10-29
**Versione Sistema**: v1.0.0
**Temi Supportati**: 4 (mooney, corporate, creative, eco)
**Tokens Totali**: ~350 (esclusi domain-specific)
**Compatibilità**: Figma + Luckino + W3C Standard
