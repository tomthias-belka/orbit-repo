# Guida alla Migrazione Token: Dev JSON → Clara Whitelabel

**Versione**: 2.0.0
**Ultimo aggiornamento**: 2025-11-16
**Destinatari**: Team di sviluppatori che migrano a Clara Tokens

---

## Indice

1. [Avvio Rapido](#avvio-rapido)
2. [Architettura del Sistema](#architettura-del-sistema)
3. [Regole di Conversione](#regole-di-conversione)
4. [Catalogo Token](#catalogo-token)
5. [Copertura Migrazione](#copertura-migrazione)
6. [Esempi Pratici](#esempi-pratici)
7. [Validazione e Strumenti](#validazione-e-strumenti)

---

## Avvio Rapido

### Cos'è Clara Whitelabel?

Clara Tokens è un **sistema di design token brand-agnostic** che supporta **4 brand** (clara, mooney, atm, comersud) attraverso le modalità W3C Design Tokens.

### Migrazione a Colpo d'Occhio

| Dev JSON (Flat) | Clara Whitelabel (Gerarchico) |
|-----------------|-------------------------------|
| `colors.MOONEYGO_PRIMARY_3` | `semantic.brand.core.main` |
| `colors.MOBILITY_BUS_DARK` | `semantic.colors.specific.mobility.bus.dark` |
| `spacings.SPACING_MD` | `global.spacing.md` |
| `borderRadii.RADIUS_XL` | `global.radius.2xl` |

### Modifiche Principali

✅ **Flat → Gerarchico**: La notazione a punti diventa struttura nidificata
✅ **UPPER_SNAKE_CASE → camelCase**: Convenzione di naming moderna
✅ **Brand-specific → Generico**: `MOONEYGO_*` diventa `brand.core.*`
✅ **Supporto 4 Modalità**: Un token, 4 valori brand tramite modalità
✅ **Conforme W3C**: `$value`, `$type`, sintassi alias `{path.to.token}`

---

## Architettura del Sistema

### Gerarchia a 3 Livelli

```
┌─────────────────────────────────────────────────┐
│  GLOBAL (Atomici, Senza Modalità)               │
│  ├─ colors (23 famiglie, scale 5-600)           │
│  ├─ spacing (none, 5xs→4xl)                     │
│  ├─ radius (none, 2xs→7xl, full)                │
│  ├─ opacity (0→100, include 70, 79, 90)         │
│  └─ typography (fontfamily, fontsize, etc.)     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  SEMANTIC (Ruoli, 4 Modalità)                   │
│  ├─ brand (core, alt, accent, fontfamily)       │
│  ├─ colors (background, text, border, feedback) │
│  ├─ specific (mobility, metro, maps, etc.)      │
│  ├─ spacing (component, layout)                 │
│  ├─ typography (display, title, body, label)    │
│  └─ radius, shadow, size, booleans              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  COMPONENTS (Token UI, 4 Modalità)              │
│  ├─ button (primary, secondary, disabled, etc.) │
│  ├─ input (background, border, focus, error)    │
│  ├─ card, badge, accordion, tab, modal          │
│  ├─ textInput, checkbox, radioToggle, banner    │
│  └─ dropdown, bottomSheet                       │
└─────────────────────────────────────────────────┘
```

### 4 Modalità Brand

Ogni token semantic/component ha valori per:

- **clara**: Nuovo brand Clara (usa blu ocean)
- **mooney**: MooneyGo originale (usa ottanio/teal)
- **atm**: ATM Milano (usa arancione)
- **comersud**: Comersud (usa ocean)

**Esempio**:
```json
"semantic.brand.core.main": {
  "$value": {
    "clara": "{global.colors.ocean.70}",
    "mooney": "{global.colors.ottanio.100}",
    "atm": "{global.colors.orange.400}",
    "comersud": "{global.colors.ocean.100}"
  },
  "$type": "color"
}
```

---

## Regole di Conversione

### 1. Struttura: Flat → Gerarchico

**Prima (Dev JSON)**:
```json
{
  "colors.MOONEYGO_PRIMARY_3": "#00587C",
  "spacings.SPACING_MD": 20
}
```

**Dopo (Clara)**:
```json
{
  "global": {
    "colors": {
      "ottanio": {
        "100": {"$value": "#00587C", "$type": "color"}
      }
    }
  },
  "semantic": {
    "brand": {
      "core": {
        "main": {
          "$value": {
            "mooney": "{global.colors.ottanio.100}"
          },
          "$type": "color"
        }
      }
    }
  }
}
```

### 2. Naming: UPPER_SNAKE_CASE → camelCase

| Dev JSON | Clara | Regola |
|----------|-------|--------|
| `CAR_RENTAL` | `carRental` | Prima parola minuscola, resto maiuscolo |
| `CHARGING_STATION` | `chargingStation` | Rimuovi underscore |
| `MILANO_M_1` | `milanoM1` | Compatta multi-parola |
| `INFO_POINT` | `infoPoint` | camelCase standard |

**Eccezioni**:
- Sequenze numeriche: `01`, `02`, `50` (illustrazioni, mappe)
- Alfanumerici semplici: `xs`, `md`, `lg` (spacing, radius)
- Valori con trattino: `white-70`, `white-80` (mappe)

### 3. Prefissi Brand → Modalità

**Dev JSON**: Prefissi brand-specific
```json
"colors.MOONEYGO_PRIMARY_3": "#00587C",
"colors.ATM_PRIMARY_COLOR": "#FF6900"
```

**Clara**: Nomi generici + modalità
```json
"semantic.brand.core.main": {
  "$value": {
    "mooney": "{global.colors.ottanio.100}",
    "atm": "{global.colors.orange.400}"
  }
}
```

### 4. Suffissi Varianti → Nidificazione

**Dev JSON**: Suffissi per varianti
```
MOONEYGO_PRIMARY_1  (variante chiara)
MOONEYGO_PRIMARY_2  (variante più chiara)
MOONEYGO_PRIMARY_3  (variante principale)

MOBILITY_BUS_DARK
MOBILITY_BUS_MEDIUM
MOBILITY_BUS_LIGHT
```

**Clara**: Gerarchia nidificata
```json
"brand.core": {
  "soft": {},    // PRIMARY_1
  "light": {},   // PRIMARY_2
  "main": {}     // PRIMARY_3
}

"mobility.bus": {
  "dark": {},
  "medium": {},
  "light": {}
}
```

### 5. Regole Specifiche per Categoria

#### Colori Brand

| Pattern Dev JSON | Path Clara | Mapping Variante |
|------------------|------------|------------------|
| `MOONEYGO_PRIMARY_1` | `semantic.brand.core.soft` | Più chiaro |
| `MOONEYGO_PRIMARY_2` | `semantic.brand.core.light` | Chiaro |
| `MOONEYGO_PRIMARY_3` | `semantic.brand.core.main` | Principale |
| `MOONEYGO_SECONDARY_*` | `semantic.brand.alt.*` | Stesse varianti |
| `MOONEYGO_ACCENT_*` | `semantic.brand.accent.*` | Stesse varianti |

#### Greyscale

| Dev JSON | Valore Dev | Path Clara | Valore Clara | Corrispondenza |
|----------|------------|------------|--------------|----------------|
| `GREYSCALE_1` | #f6f6f6 | `global.colors.gray.7` | #f6f6f6 | ✅ Esatta |
| `GREYSCALE_2` | #dddddd | `global.colors.gray.25` | #dddddd | ✅ Esatta |
| `GREYSCALE_3` | #bbbbbb | `global.colors.gray.40` | #c0c0c0 | ⚠️ Simile (#bbbbbb vs #c0c0c0) |
| `GREYSCALE_4` | #787878 | `global.colors.gray.70` | #777777 | ⚠️ Simile (#787878 vs #777777) |
| `GREYSCALE_5` | #4f4f4f | `global.colors.gray.110` | #4f4f4f | ✅ Esatta |

**Note**:
- Clara non ha una famiglia `greyscale` separata - i valori sono integrati nella scala `gray`
- `GREYSCALE_1`, `GREYSCALE_2`, `GREYSCALE_5` hanno corrispondenze esatte (`gray.7`, `gray.25`, `gray.110`)
- `GREYSCALE_3` e `GREYSCALE_4` mappano a valori molto simili (differenza di 1 cifra hex)

#### Colori Feedback

| Dev JSON | Path Clara |
|----------|------------|
| `FEEDBACK_SUCCESS_DARK` | `semantic.colors.feedback.success` |
| `FEEDBACK_WARNING_DARK` | `semantic.colors.feedback.warning` |
| `FEEDBACK_ERROR_DARK` | `semantic.colors.feedback.error` |
| `FEEDBACK_INFO_DARK` | `semantic.colors.feedback.info` |
| `FEEDBACK_*_LIGHT` | `semantic.colors.feedback.*light` |

#### Colori Mobility

**Pattern**: `MOBILITY_{CATEGORY}_{VARIANT}` → `semantic.colors.specific.mobility.{category}.{variant}`

**Conversione camelCase**:
```
CAR_RENTAL → carRental
CHARGING_STATION → chargingStation
GARAGE_TELEPASS → garageTelepass
INFO_POINT → infoPoint
```

**Esempi**:

| Dev JSON | Path Clara |
|----------|------------|
| `MOBILITY_BUS_DARK` | `semantic.colors.specific.mobility.bus.dark` |
| `MOBILITY_CAR_RENTAL_MEDIUM` | `semantic.colors.specific.mobility.carRental.medium` |
| `MOBILITY_CHARGING_STATION_LIGHT` | `semantic.colors.specific.mobility.chargingStation.light` |

#### Colori Metro

**Pattern**: `METRO_{CITY}_{LINE}` → `semantic.colors.specific.metro.{city}{line}`

| Dev JSON | Path Clara | Nota |
|----------|------------|------|
| N/A | `semantic.colors.specific.metro.milanoM1` | Estensione Clara |
| N/A | `semantic.colors.specific.metro.milanoM2` | Estensione Clara |
| N/A | `semantic.colors.specific.metro.romaMea` | Estensione Clara |
| N/A | `semantic.colors.specific.metro.napoli1` | Estensione Clara |

⚠️ **Nota**: Clara ha 15 linee metro specifiche per città non presenti nel Dev JSON

#### Varianti Opacity

**Pattern**: `{COLOR}_OPACITY_{VALUE}` → usa `global.opacity.*`

| Dev JSON | Implementazione Clara |
|----------|----------------------|
| `MOONEYGO_PRIMARY_3_OPACITY_79` | `rgba(#00587C, {global.opacity.79})` |
| `WHITE_LOW_OPACITY` | `rgba(#ffffff, {global.opacity.70})` |
| `MOONEYGO_WHITE_OPACITY_90` | `rgba(#ffffff, {global.opacity.90})` |

#### Spacing

**Pattern**: `SPACING_{SIZE}` → `global.spacing.{size}`

**Mapping basato su valori pixel**:

| Dev JSON | Valore Dev (px) | Token Clara | Valore Clara (px) | Corrispondenza |
|----------|-----------------|-------------|-------------------|----------------|
| `NONE` | 0 | `none` | 0 | ✅ Esatta |
| `XXXXS` | 2 | `4xs` | 2 | ✅ Esatta |
| `XXXS` | 3 | N/A | - | ⚠️ **Nessuna corrispondenza** (usa `4xs: 2` o `3xs: 4`) |
| `XXS` | 4 | `3xs` | 4 | ✅ Esatta |
| `XS` | 8 | `2xs` | 8 | ✅ Esatta |
| `S` | 12 | `xs` | 12 | ✅ Esatta |
| `M` | 16 | `sm` | 16 | ✅ Esatta |
| `L` | 20 | `md` | 20 | ✅ Esatta |
| `XL` | 24 | `lg` | 24 | ✅ Esatta |
| `XXL` | 28 | `xl` | 28 | ✅ Esatta |
| `XXXL` | 32 | `2xl` | 32 | ✅ Esatta |
| `XXXXL` | 42 | `3xl` | 42 | ✅ Esatta |
| `XXXXXL` | 50 | `4xl` | 50 | ✅ Esatta |

⚠️ **Nota**: Clara ha anche `5xs: 1px` che non esiste nel Dev JSON.

**Strategia di Migrazione**:
- Mappa per **valore in pixel**, non per pattern di naming
- `SPACING_XXXS` (3px) non ha corrispondenza esatta → scegli `4xs` (2px) o `3xs` (4px) dopo revisione design

#### Border Radius

**Pattern**: `RADIUS_{SIZE}` → `global.radius.{size}`

**Mapping basato su valori pixel**:

| Dev JSON | Valore Dev (px) | Token Clara | Valore Clara (px) | Corrispondenza |
|----------|-----------------|-------------|-------------------|----------------|
| `NONE` | 0 | `none` | 0 | ✅ Esatta |
| `XXXS` | 2 | `2xs` | 2 | ✅ Esatta |
| `XXS` | 4 | `xs` | 4 | ✅ Esatta |
| `XS` | 8 | `sm` | 8 | ✅ Esatta |
| `S` | 10 | `md` | 10 | ✅ Esatta |
| `M` | 15 | N/A | - | ⚠️ **Nessuna corrispondenza** (usa `lg: 12` o `xl: 16`) |
| `L` | 16 | `xl` | 16 | ✅ Esatta |
| `XL` | 18 | `2xl` | 18 | ✅ Esatta |
| `XXL` | 20 | `3xl` | 20 | ✅ Esatta |
| `XXXL` | 24 | `4xl` | 24 | ✅ Esatta |
| `XXXXL` | 30 | N/A | - | ⚠️ **Nessuna corrispondenza** (usa `4xl: 24` o `5xl: 32`) |
| `XXXXXL` | 100 | N/A | - | ⚠️ **Nessuna corrispondenza** (usa `6xl: 48`) |
| `XXXXXXL` | 200 | N/A | - | ⚠️ **Nessuna corrispondenza** (max Clara è `6xl: 48`) |

⚠️ **Note**:
- Clara ha `lg: 12px` e `5xl: 32px` che non esistono nel Dev JSON
- Valori Dev JSON `15px`, `30px`, `100px`, `200px` non hanno corrispondenza esatta in Clara
- `full: 9999px` in Clara è per elementi circolari (badge, avatar)

**Strategia di Migrazione**:
- Mappa per **valore in pixel** dove possibile
- Per `RADIUS_M` (15px): Scegli `lg` (12px) o `xl` (16px) dopo revisione design
- Per `RADIUS_XXXXL` (30px): Scegli `4xl` (24px) o `5xl` (32px)
- Per `RADIUS_XXXXXL` (100px) e `RADIUS_XXXXXXL` (200px): Verifica se effettivamente usati. Considera `6xl` (48px) o valori hardcoded se necessario

---

## Catalogo Token

### Token Globali (Senza Modalità)

#### Famiglie Colori (23 totali)

Tutte le famiglie colori usano scala: `5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600`

**Token speciali**:
```
global.colors.neutral.{white|black|transparent}
```

**Famiglie core** (9):
```
global.colors.teal.*
global.colors.turquoise.*
global.colors.ottanio.*
global.colors.ocean.*
global.colors.blue.*
global.colors.coral.*
global.colors.orange.*
global.colors.yellow.*
global.colors.lemon.*
global.colors.green.*
```

**Famiglie Gray** (2):
```
global.colors.gray.{5-700}      ← Valore extra 700
global.colors.darkgray.{5-600}
```

**Palette estesa** (11):
```
cocoa, coffee, ember, indigo, jade, lime,
mustard, pink, purple, violet
```

✅ **Integrato**:
- `greyscale` → Ora parte della scala `gray` (vedi mapping GREYSCALE nella sezione Famiglie Colori)

❌ **Non in Clara**:
- `grey` (rimosso da Clara, usa `gray`)

#### Scala Spacing

```
global.spacing.{none|5xs|4xs|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl}
```
Valori: 0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 42, 50 (px)

⚠️ **Nota**: Dev JSON ha `SPACING_XXXS: 3px` che non ha corrispondenza esatta in Clara

#### Scala Radius

```
global.radius.{none|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|full}
```
Valori: 0, 2, 4, 8, 10, 12, 16, 18, 20, 24, 32, 48, 9999 (px)

⚠️ **Note**:
- Dev JSON ha `RADIUS_M: 15px`, `RADIUS_XXXXL: 30px`, `RADIUS_XXXXXL: 100px`, `RADIUS_XXXXXXL: 200px` senza corrispondenze esatte in Clara
- **full (9999px)**: per elementi circolari (badge, avatar)

#### Scala Opacity

```
global.opacity.{0|10|20|30|40|50|60|70|79|80|90|100}
```
Valori: 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.79, 0.8, 0.9, 1.0

⚠️ **Nota**: Valori speciali `70` (WHITE_LOW_OPACITY), `79`, `90` per compatibilità Dev JSON

#### Atomici Tipografia

```
global.typography.fontfamily.{manrope|mono|gotham|generalSans}
global.typography.fontsize.{2xs|xs|sm|base|lg|xl|2xl|3xl|4xl}
global.typography.fontweight.{normal|medium|semibold|bold}
global.typography.lineheight.{tight|snug|normal|relaxed}
global.typography.letterspacing.{tight|normal|wide|wider}
```

### Token Semantic (4 Modalità)

#### Identità Brand

```
semantic.brand.core.{main|light|soft|dark|faded}
semantic.brand.alt.{main|soft|light|dark}
semantic.brand.accent.{main|soft|light|dark}
semantic.brand.fontfamily.brand
semantic.brand.theme
```

**Esempio modalità Mooney**:
- `core.main` → `{global.colors.ottanio.100}` (#00587C)
- `alt.main` → `{global.colors.teal.80}` (#00AEC7)
- `accent.main` → `{global.colors.yellow.100}` (#EDA900)

#### Colori Semantic

```
semantic.colors.background.{muted|page|brand|disabled}
semantic.colors.text.{inverse|main|muted|disabled|brand}
semantic.colors.border.{main|muted|focus}
semantic.colors.feedback.{success|warning|error|info|successlight|warninglight|errorlight|infolight}
semantic.colors.icon.{main|muted|inverse|disabled}
```

#### Specifici Dominio: Mobility (22 categorie)

Tutti seguono pattern: `semantic.colors.specific.mobility.{category}.{dark|medium|light}`

**Categorie**:
```
bus, tram, metro, train, harbor, pullman, taxi, ncc,
sharing, parking, garage, carRental, chargingStation,
favorites, walk, ztl, garageTelepass, airports, skipass,
pin, infoPoint, experience
```

**Strategia aliasing**:
- Se hex esiste in `global.colors` → usa alias `{global.colors.yellow.100}`
- Se hex non esiste → hardcoded `"#bd590d"`

#### Specifici Dominio: Metro (15 linee)

```
semantic.colors.specific.metro.{
  brescia1, catania1, genova1,
  milanoM1, milanoM2, milanoM3, milanoM4, milanoM5,
  napoli1, napoli6,
  romaMea, romaMeb, romaMec,
  torino1, torino2
}
```

⚠️ **Nota**: Non nel Dev JSON, estensione Clara

#### Specifici Dominio: Illustrazioni (31 colori)

```
semantic.colors.specific.illustrations.{01-31}
```

Naming numerico: `01`, `02`, ... `31`

⚠️ **Nota**: Non nel Dev JSON, estensione Clara

#### Specifici Dominio: Mappe (18 colori)

```
semantic.colors.specific.maps.{01-14|25|50|white-70|white-80}
```

⚠️ **Nota**: Clara ha 50+ colori mappe vs 3 nel Dev JSON

#### Specifici Dominio: Transport Position

```
semantic.colors.specific.meansOfTransportPosition.{
  bus10, bus30, harbor10, harbor30,
  pullman10, pullman30, train10, train30,
  tram10, tram30
}
```

⚠️ **Nota**: Non nel Dev JSON, scopo poco chiaro (10 vs 30?)

### Token Component (4 Modalità)

Tutti i token component fanno alias a token semantic/global.

#### Button (40 token)

```
components.button.primary.{background|text|border|padding|borderRadius|height}
components.button.secondary.*
components.button.tertiary.*
components.button.ghost.*
components.button.destructive.*
components.button.disabled.*
components.button.shared.*
```

**Varianti**: default, small, large

#### Input (9+ token)

```
components.input.{background|border|borderfocus|text|placeholder|padding|borderradius|fontsize}
```

#### TextInput (44 token)

```
components.textInput.{default|ghost|error-message}.*
```

Proprietà: height, lineHeight, backgroundColor, border (tutti i lati), borderColor, focusedBorderColor, errorBorderColor, textColor, padding, placeholderColor, textRole

#### Card (5 token)

```
components.card.{background|border|padding|borderradius|shadow}
```

#### Badge (11 token)

```
components.badge.{success|error|warning|shared}.*
```

#### Accordion (66 token)

```
components.accordion.{primary|secondary|tertiary}.{titleSection|contentSection}.*
```

Proprietà: backgroundColor, textColor, iconColor, textRole, textWeight, padding, border, margins

#### Tab (17 token)

```
components.tab.{backgroundColor|textColor|selectedTextColor|selectedUnderlineColor|iconSize|height}
```

#### Modal (9 token)

```
components.modal.{backgroundColor|backdropColor|backdropOpacity|padding|borderRadius|iconSize|textColor|titleFontRole}
```

#### BottomSheet (10 token)

```
components.bottomSheet.{backgroundColor|fullscreenBackgroundColor|highlightedBackgroundColor|borderRadius|handleColor|handleHeight|handleWidth|handleContainerHeight|handleBottomSpacing|shadow}
```

#### Checkbox (20 token)

```
components.checkbox.{unchecked|checked|disabled}.{standard|big}.*
```

#### RadioToggle (24 token)

```
components.radioToggle.{primary|secondary}.*
```

#### Banner (30 token)

```
components.banner.{default|info|warning|danger|success|special}.*
```

#### Dropdown (6 token)

```
components.dropdown.{TitleColor|IconColor|BackgroundColor|BorderColor|BorderRadius|BorderWidth}
```

⚠️ **Nota**: Naming inconsistente (PascalCase vs camelCase)

---

## Copertura Migrazione

### Scorecard Migrazione

Questa scorecard fornisce una panoramica chiara di cosa fare per ogni categoria token:

| Categoria | Stato | Azione Richiesta | Note |
|----------|--------|------------------|------|
| **Primitive Core** | ✅ 100% | Verifica valori pixel usando tabelle mapping corrette | Colori, spacing, radius hanno corrispondenze dirette (con eccezioni notate) |
| **Identità Brand** | ✅ 100% | Sostituisci vecchi nomi con nuovi path semantic | `MOONEYGO_PRIMARY_*` → `semantic.brand.core.*` |
| **Colori Feedback** | ✅ 100% | Mapping diretto 1:1 | `FEEDBACK_SUCCESS` → `semantic.colors.feedback.success` |
| **Colori Mobility** | ✅ 100% | Applica regole conversione camelCase | `CAR_RENTAL` → `carRental` |
| **Tipografia** | ⚠️ Refactoring | Usa token atomici + combinazioni semantic | Mixin Dev JSON → tipografia semantic Clara |
| **Components (Core)** | ⚠️ Refactoring | Usa nuovi token component come base, ricostruisci styling | Mapping non 1:1. Button, input, card, badge coperti |
| **Components (Estesi)** | ⚠️ Selettivo | Valuta se necessari per whitelabel | Accordion, tab, modal, textInput, etc. aggiunti |
| **Token App-Specific** | ❌ Non Migrare | Mantieni nel codice applicazione | UITabBar, Screen*, ATAC_*, AREA_* rimangono app-specific |
| **Shadows** | 🟡 Copertura Minima | Usa `semantic.shadow.card` o definisci app-specific | Clara ha 1 shadow vs 54 nel Dev JSON |

### ✅ Completamente Coperti

| Categoria | Dev JSON | Clara | Stato |
|----------|----------|-------|-------|
| **Colori Brand** | 12 | 12 | ✅ Completo |
| **Greyscale** | 5 | 5 | ✅ Completo (integrato nella scala `gray`: 7, 25, 40, 70, 110) |
| **Feedback** | 8 | 8 | ✅ Completo |
| **Mobility** | 66 | 66 | ✅ Completo |
| **Spacing** | 13 | 13 | ✅ Completo (1 valore senza corrispondenza esatta) |
| **Radius** | 13 | 13 | ✅ Completo (4 valori senza corrispondenza esatta) |
| **Opacity** | ~10 | 12 | ✅ Completo |

### ⚠️ Parzialmente Coperti / Estesi

| Categoria | Dev JSON | Clara | Gap | Nota |
|----------|----------|-------|-----|------|
| **Metro** | 3 | 15 | -12 | Clara ha linee specifiche per città |
| **Mappe** | 3 | 50+ | -47 | Clara esteso |
| **Illustrazioni** | 0 | 31 | -31 | Clara esteso |
| **Transport Position** | 0 | 10 | -10 | Clara esteso |
| **Components** | 1800+ | 266 | +1534 | Approccio minimalista |

### ❌ Non Mappati (Intenzionale)

#### Token App-Specific

**Non inclusi in Clara Whitelabel** (rimangono app-specific):

```
AREAB_*, AREAC_*                  → Zone parcheggio Milano
ATAC_ACTIVATION_*                 → Sistema trasporti Roma
MOONEYGO_EXTRA_COLOR_*            → Utilizzo sconosciuto
MOONEYGO_MAP_COLOR_*              → Coperto da maps.*
MOONEYGO_GREY1-17                 → Investigare mapping a gray/grey
Token specifici Screen            → Troppo app-specific
Componenti navigazione (UITabBar) → Pattern app-specific
```

#### Token Component

**Dev JSON ha 50+ componenti UI**, Clara ha 13 componenti core.

**Strategia**: Clara mantiene approccio **minimalista** e **brand-agnostic**. Le app estendono con token custom.

**Non inclusi**:
- Componenti Screen (ScreenMyTickets, ScreenProfile, etc.)
- Navigazione complessa (UITabBar, UIHeader - ora parzialmente coperto)
- UI specifiche dominio (UIPin - specifico mappe)
- Feature app-specific

**Inclusi** (13 componenti):
- ✅ button, input, textInput, card, badge
- ✅ accordion, tab, modal, bottomSheet
- ✅ checkbox, radioToggle, banner, dropdown

### Metriche Copertura

```
Token totali Dev JSON:    ~2,226
Token totali Clara:       ~450
Copertura:                ~20%

✅ Atomici/Global:        100% coperti
✅ Semantic/Brand:        100% coperti
⚠️ Specifici dominio:     Estesi in Clara
❌ Componenti UI:         Minimalista (13/50+ componenti)
```

### Categorie Token Non Mappati

#### 1. Colori Utility (~30 token)

**Esempi**:
```
MOONEYGO_DANGER               → Verifica vs FEEDBACK_ERROR
MOONEYGO_GREEN                → Verifica vs FEEDBACK_SUCCESS
MOONEYGO_BLUE6-11             → Utilizzo sconosciuto
MOONEYGO_ORANGE2              → Utilizzo sconosciuto
```

**Azione**: 🔍 Grep codebase per verificare utilizzo, possibili duplicati

#### 2. Colori Mappe Extra

**Dev JSON**:
```
MOONEYGO_MAP_COLOR_1
MOONEYGO_MAP_COLOR_2
MOONEYGP_MAP_BOTTOM_SHEET_80  ← Typo: MOONEYGP
```

**Clara**: Ha 50+ colori mappe

**Azione**: 🔍 Documenta origine colori mappe Clara, verifica mapping

#### 3. Varianti Grey (17 token)

**Dev JSON**:
```
MOONEYGO_GREY1-17
```

Alcuni con opacity (es. `GREY8: "#F7F7F770"`)

**Azione**: 🔍 Analizza valori hex, mappa a scale gray/grey/greyscale o depreca

#### 4. Shadows (53+ token)

**Dev JSON**: 54 varianti shadow (line_up, line_down, platform-specific)

**Clara**: 1 token shadow (`semantic.shadow.card`)

**Azione**: 🟡 Valuta se sistema shadow necessita espansione per multi-brand

---

## Esempi Pratici

### Esempio 1: Colore Primario Brand

**Input**: `colors.MOONEYGO_PRIMARY_3`

**Passi**:
1. Categoria = `color`
2. Rimuovi prefisso `MOONEYGO_` → `PRIMARY_3`
3. Identifica pattern `PRIMARY` → `semantic.brand.core`
4. Mappa variante `3` → `main`

**Output**: `semantic.brand.core.main`

**Implementazione**:
```json
{
  "global": {
    "colors": {
      "ottanio": {
        "100": {"$value": "#00587C", "$type": "color"}
      }
    }
  },
  "semantic": {
    "brand": {
      "core": {
        "main": {
          "$value": {
            "clara": "{global.colors.ocean.70}",
            "mooney": "{global.colors.ottanio.100}",
            "atm": "{global.colors.orange.400}",
            "comersud": "{global.colors.ocean.100}"
          },
          "$type": "color"
        }
      }
    }
  }
}
```

### Esempio 2: Colore Mobility

**Input**: `colors.MOBILITY_CAR_RENTAL_DARK`

**Passi**:
1. Categoria = `color`
2. Rimuovi prefisso `MOBILITY_` → `CAR_RENTAL_DARK`
3. Pattern `MOBILITY` → `semantic.colors.specific.mobility`
4. Estrai categoria `CAR_RENTAL` → camelCase `carRental`
5. Estrai variante `DARK` → minuscolo `dark`

**Output**: `semantic.colors.specific.mobility.carRental.dark`

**Implementazione**:
```json
{
  "semantic": {
    "colors": {
      "specific": {
        "mobility": {
          "carRental": {
            "dark": {
              "$value": {
                "clara": "#FF7500",
                "mooney": "#FF7500",
                "atm": "#FF9900",
                "comersud": "#FF7500"
              },
              "$type": "color"
            }
          }
        }
      }
    }
  }
}
```

### Esempio 3: Spacing

**Input**: `spacings.SPACING_XXXL`

**Passi**:
1. Categoria = `spacing`
2. Rimuovi prefisso `SPACING_` → `XXXL`
3. Converti size `XXXL` → `2xl` (32px)

**Output**: `global.spacing.2xl`

**Implementazione**:
```json
{
  "global": {
    "spacing": {
      "2xl": {
        "$value": 32,
        "$type": "dimension"
      }
    }
  }
}
```

### Esempio 4: Variante Opacity

**Input**: `colors.MOONEYGO_PRIMARY_3_OPACITY_79`

**Passi**:
1. Categoria = `color`
2. Identifica pattern `_OPACITY_` → colore con opacity
3. Colore base = `MOONEYGO_PRIMARY_3` → `semantic.brand.core.main`
4. Valore opacity = `79` → `global.opacity.79`

**Output**: Crea token semantic o usa rgba

**Implementazione** (Opzione A - rgba inline):
```json
{
  "semantic": {
    "colors": {
      "overlay": {
        "primary": {
          "$value": {
            "mooney": "rgba(0, 88, 124, 0.79)"
          },
          "$type": "color"
        }
      }
    }
  }
}
```

**Implementazione** (Opzione B - Riferimento):
```json
{
  "semantic": {
    "colors": {
      "overlay": {
        "primary": {
          "$value": {
            "mooney": "rgba({semantic.brand.core.main}, {global.opacity.79})"
          },
          "$type": "color"
        }
      }
    }
  }
}
```

⚠️ **Nota**: Verifica se Figma/tooling supporta rgba con riferimenti token

### Esempio 5: Migrazione Completa Component

**Input**: Token UIButton Dev JSON
```json
{
  "UIButton.primary.background.color": "MOONEYGO_PRIMARY_3",
  "UIButton.primary.text.color": "WHITE",
  "UIButton.primary.borderRadius": "M",
  "UIButton.primary.padding.horizontal": "L"
}
```

**Output**: Token component Clara
```json
{
  "components": {
    "button": {
      "primary": {
        "background": {
          "$value": "{semantic.brand.core.main}",
          "$type": "color"
        },
        "text": {
          "$value": "{semantic.colors.text.inverse}",
          "$type": "color"
        },
        "borderRadius": {
          "$value": "{global.radius.lg}",
          "$type": "borderRadius"
        },
        "padding": {
          "$value": "{global.spacing.md}",
          "$type": "dimension"
        }
      }
    }
  }
}
```

**Mapping usati**:
- `MOONEYGO_PRIMARY_3` → `{semantic.brand.core.main}`
- `WHITE` → `{semantic.colors.text.inverse}`
- `M` (radius) → `{global.radius.lg}` (15px)
- `L` (spacing) → `{global.spacing.md}` (20px)

---

## Validazione e Strumenti

### Checklist Pre-Migrazione

- [ ] Tutti i colori hex esistono in `global.colors` o documentati come hardcoded
- [ ] Compreso sistema 4 modalità (clara, mooney, atm, comersud)
- [ ] Riviste tabelle mapping spacing/radius
- [ ] Identificati token app-specific (non migreranno)
- [ ] Backup file token attuali

### Checklist Post-Migrazione

- [ ] Tutti i valori hex colori verificati
- [ ] Naming segue convenzione camelCase
- [ ] Path corretti (`semantic.colors.specific.*` non `semantic.specific.*`)
- [ ] Tutte le 4 modalità hanno valori per ogni token semantic/component
- [ ] Aliasing usa sintassi corretta `{path.to.token}`
- [ ] Descrizioni ($description) documentano mapping sorgente
- [ ] Conforme W3C: `$value`, `$type` presenti
- [ ] Nessun typo (MOONEYGP → MOONEYGO)

### Comandi Validazione

```bash
# 1. Valida sintassi JSON
jq empty clara-tokens.json

# 2. Verifica tutti gli alias esistono (script custom)
node scripts/validate-aliases.js

# 3. Verifica convenzione naming (script custom)
node scripts/validate-naming.js

# 4. Test import in Figma
# Usa plugin Clara Tokens per importare e verificare

# 5. Verifica valori hex duplicati
jq '[.. | .["$value"]? | select(type == "string" and startswith("#"))] | group_by(.) | map({color: .[0], count: length}) | sort_by(.count) | reverse' clara-tokens.json
```

### Problemi Comuni

#### Problema 1: Alias Non Trovato

**Errore**: `{global.colors.ocean.150}` non esiste

**Soluzione**: Clara usa scala 5-600, non 100-900. Verifica tabella mapping:
- 150 (vecchio) → 40 o 50 (nuovo)
- 300 (vecchio) → 80 o 90 (nuovo)

#### Problema 2: $type Errato

**Problema**: Token `borderRadius` ha `$type: "color"`

**Soluzione**: Usa tipi W3C corretti:
- `color` → colori hex/rgba
- `dimension` → valori px
- `borderRadius` → valori radius
- `fontWeight` → valori weight
- `string` → valori testo

#### Problema 3: Modalità Manca Valore

**Errore**: Token ha `clara`, `mooney`, `atm` ma manca `comersud`

**Soluzione**: Ogni token semantic/component DEVE avere tutte le 4 modalità. Copia da `mooney` o `clara` come fallback.

#### Problema 4: Nidificazione Incorretta

**Errato**:
```json
"semantic.specific.mobility.bus.dark"
```

**Corretto**:
```json
"semantic.colors.specific.mobility.bus.dark"
```

**Regola**: Token specifici dominio sotto `semantic.colors.specific.*`

### Script Migrazione

#### Converti Dev JSON Flat → Clara Gerarchico

```python
# scripts/convert-dev-to-clara.py
# (pseudo-codice)

def convert_dev_token(dev_token_name, dev_value):
    category = identify_category(dev_token_name)

    # Rimuovi prefisso brand
    clean_name = remove_brand_prefix(dev_token_name)

    # Mappa a gerarchia Clara
    clara_path = map_to_hierarchy(clean_name, category)

    # Converti a camelCase
    clara_path = to_camel_case(clara_path)

    # Gestisci varianti
    variant = extract_variant(clean_name)
    clara_path = append_variant(clara_path, variant)

    # Verifica se valore esiste in global
    if is_global_color(dev_value):
        clara_value = alias_to_global(dev_value)
    else:
        clara_value = dev_value

    return {
        "path": clara_path,
        "value": clara_value,
        "original": dev_token_name
    }
```

### Target Export

I token Clara possono esportare in:

- ✅ **Figma Variables** (via plugin Clara Tokens)
- ✅ **CSS Variables** (`--semantic-brand-core-main`)
- ✅ **SCSS/LESS** (`$semantic-brand-core-main`)
- ✅ **JavaScript/TypeScript** (`tokens.semantic.brand.core.main`)
- ✅ **Tailwind Config** (`theme.colors.brand.core.main`)
- ✅ **React Native StyleSheet** (`tokens.semantic.brand.core.main`)

### Supporto e Risorse

- **Plugin Clara Tokens**: Plugin Figma per import/export
- **Spec W3C**: https://design-tokens.github.io/community-group/format/
- **Figma Variables**: https://help.figma.com/hc/en-us/articles/15339657135383
- **File Sorgente**:
  - Dev JSON: `json-dev/theme-mooneygo.json`
  - Clara Tokens: `clara-tokens.json`

---

## FAQ

### D: Perché solo 4 modalità invece di brand illimitati?

**R**: Figma attualmente supporta massimo 4 modalità per collection di variabili.

### D: Posso aggiungere il mio brand come 5a modalità?

**R**: No, per limitazione Figma. Considera di fare fork di Clara o creare collection separata.

### D: Se la mia app necessita token non in Clara?

**R**: Estendi Clara con token app-specific. Mantienili separati dal core whitelabel. Esempio: `app-specific.tokens.myFeature.*`

### D: Devo usare hex hardcoded o sempre alias a global?

**R**: **Preferisci aliasing**. Usa hardcoded solo se:
1. Colore non esiste in `global.colors`
2. È veramente usa-e-getta (non riutilizzabile)

### D: Come gestisco token platform-specific (iOS vs Android)?

**R**: Clara non supporta modalità platform. Opzioni:
1. Usa collection separate per token platform-specific
2. Gestisci a livello export (export CSS vs React Native)
3. Usa logica condizionale nel codice

### D: I 15 colori linee metro sono colori brand ufficiali?

**R**: 🔍 **Documentazione necessaria**. Verifica con autorità trasporti o team design.

### D: Cosa è successo ai token `greyscale` dal Dev JSON?

**R**: ✅ **Integrati**: I valori GREYSCALE ora fanno parte della scala `gray` di Clara.

**Mapping**:
- `GREYSCALE_1` (#f6f6f6) → `global.colors.gray.7` (corrispondenza esatta)
- `GREYSCALE_2` (#dddddd) → `global.colors.gray.25` (corrispondenza esatta)
- `GREYSCALE_3` (#bbbbbb) → `global.colors.gray.40` (molto simile: #c0c0c0)
- `GREYSCALE_4` (#787878) → `global.colors.gray.70` (molto simile: #777777)
- `GREYSCALE_5` (#4f4f4f) → `global.colors.gray.110` (corrispondenza esatta)

**Nota**: Clara non ha una famiglia `greyscale` separata. I valori GREYSCALE sono stati integrati nella scala `gray` principale con chiavi numeriche appropriate.

### D: Perché Clara usa `gray` invece di `grey`?

**R**: Clara usa spelling americano (`gray`) per consistenza. Non esiste famiglia `grey` nei token Clara - tutti i valori grayscale sono sotto `global.colors.gray.*`.

### D: Se un valore spacing/radius non ha corrispondenza esatta?

**R**: Succede per `SPACING_XXXS` (3px), `RADIUS_M` (15px), `RADIUS_XXXXL` (30px), etc.

**Strategia**:
1. Scegli il **valore più vicino** dalla scala Clara
2. Verifica impatto visivo con team design
3. Ricorda: Standardizzazione è l'obiettivo - piccole deviazioni sono previste e intenzionali
4. Documenta la decisione nelle note di migrazione

**Esempi**:
- `RADIUS_M` (15px) → Usa `lg` (12px) o `xl` (16px) - scegli dopo revisione UI
- `SPACING_XXXS` (3px) → Usa `4xs` (2px) o `3xs` (4px)

### D: Come gestisco le ombre?

**R**: Clara fornisce sistema shadow minimale:

**Disponibile**:
- `semantic.shadow.card` - Ombra card base

**Per altre esigenze shadow**:
1. Definisci token shadow app-specific nel tuo codebase
2. Usa valori shadow CSS/platform-specific direttamente nei componenti
3. Stiamo valutando un sistema shadow più completo per versioni future

**Dev JSON ha 54 varianti shadow** (platform-specific, direzionali). Queste sono intenzionalmente non in Clara whitelabel - sono troppo specifiche per piattaforme e casi d'uso.

### D: Posso rinominare i token Clara?

**R**: Sì, ma mantieni consistenza:
- Segui convenzione camelCase
- Mantieni struttura gerarchica
- Aggiorna tutti gli alias che referenziano token rinominati
- Documenta modifiche per il team

### D: E le differenze platform-specific (iOS vs Android)?

**R**: Clara non supporta modalità platform nel sistema token.

**Strategie**:
1. **Layer export**: Gestisci differenze platform durante export (es. export CSS vs React Native)
2. **Collection separate**: Crea estensioni token platform-specific
3. **Logica runtime**: Usa logica condizionale nel codice componenti

**Esempio**: Le ombre renderizzano diversamente su iOS (shadowOffset, shadowRadius) vs Android (elevation). Gestiscilo nella tua libreria componenti, non nei token.

---

## Changelog

### v2.0.0 (2025-11-16)
- ✅ Fusi MAPPING_RULES.md, token-mapping.md, UNMAPPED_TOKENS.md
- ✅ Aggiunti 10 nuovi token component (accordion, tab, modal, etc.)
- ✅ Aggiornate metriche copertura
- ✅ Aggiunta sezione esempi completa
- ✅ Aggiunti strumenti validazione e checklist

### v1.0.0 (2025-01-15)
- Documentazione iniziale divisa in 3 file

---

**Maintainer**: Clara Design System Team
**Contributori**: Team migrazione developer
**Licenza**: Solo uso interno
