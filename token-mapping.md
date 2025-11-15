# Token Mapping: Mooney Dev JSON → Clara Whitelabel

## Overview

Questo documento descrive la mappatura tra i token flat del file di sviluppo (`theme-mooneygo.json`) e la nuova struttura whitelabel gerarchica (`clara-tokens.json`). Il sistema supporta 4 brand tramite il sistema di modes W3C.

## Struttura Reale del Sistema

### Architettura a 3 Livelli

```
global (valori atomici, no modes)
  ├─ colors (palette complete)
  ├─ spacing (scale spazi)
  ├─ radius (scale raggi)
  └─ typography (atomici: fontfamily, fontsize, fontweight, lineheight, letterspacing)

semantic (ruoli semantici, 4 modes)
  ├─ brand (core, alt, accent, fontfamily, theme)
  ├─ colors (background, text, border, feedback, icon)
  ├─ specific (button, gradient, mobility, illustrations, maps, metro, means-of-transport-position)
  ├─ radius (brand, card, badge)
  ├─ spacing (component, layout)
  ├─ shadow (card)
  ├─ typography (display, title, body, label, ui)
  ├─ size (height)
  └─ booleans (view)

components (componenti specifici, 4 modes)
  ├─ button (primary, secondary, disabled, shared + variants/roles from UIButton)
  ├─ input (background, border, borderfocus, text, placeholder, padding, borderradius, fontsize)
  ├─ card (background, border, padding, borderradius, shadow)
  ├─ badge (success, error, warning, shared)
  ├─ accordion (roles: primary, secondary, tertiary + sections: titleSection, contentSection)
  ├─ tab (UITabBar - navigation tabs with icon/text support)
  ├─ modal (mixins.modals - modal system with backdrop, padding, typography)
  ├─ bottomSheet (mixins.bottomSheet - mobile bottom sheet with handle/shadow)
  ├─ dropdown (UILinkedCardCart.dropdown - dropdown/select styling)
  ├─ textInput (UITextInput - input fields with focus/error states)
  ├─ checkbox (UICheckbox - checkbox with states and size variants)
  ├─ radioToggle (UIRadioToggle - radio button/toggle component)
  └─ banner (UIBanner - banner component for notifications)
```

### Modes Supportati

Il sistema supporta **4 brand** tramite il meccanismo di modes W3C:

- **clara**: Brand Clara (nuovo)
- **mooney**: Brand Mooney (originale MooneyGo)
- **atm**: Brand ATM Milano
- **comersud**: Brand Comersud

## Global Tokens (Livello Atomico)

### Palette Colori

Il sistema include **26+ famiglie di colori** con scale da 5 a 600:

```
global.colors.neutral.{white|black|transparent}

global.colors.teal.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.gray.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700}
global.colors.grey.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.greyscale.{1,2,3,4,5}  ← NUOVO: mapping esplicito Dev JSON
global.colors.darkgray.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.turquoise.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.ottanio.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.ocean.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.blue.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.coral.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.orange.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.yellow.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.lemon.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.green.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
... + 13 famiglie aggiuntive (cocoa, coffee, ember, honeydew, indigo, jade, lime, mub, mustard, pink, purple, violet)
```

**Note importanti**:
- Numerazione: 5, 10, 20, 30... (NON 100-900)
- **Gray** ha un valore extra: `700`
- **Grey** vs **Gray**: due famiglie distinte (grey.5 è leggermente diverso da gray.5)
- **Greyscale** (1-5): mapping esplicito per Dev JSON GREYSCALE_1-5
- Le famiglie includono: teal (turchese), ottanio (blu petrolio), darkgray (grigio blu)

### Spacing Scale

```
global.spacing.{none,5xs,4xs,3xs,2xs,xs,sm,md,lg,xl,2xl,3xl,4xl}
```

Valori: 0, 2, 3, 4, 8, 12, 16, 20, 24, 28, 32, 42, 50 (px)

### Radius Scale

```
global.radius.{none,2xs,xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,full}
```

Valori: 0, 2, 4, 8, 10, 15, 16, 18, 20, 24, 30, 100, **200**, 9999 (px)

**Note**:
- **7xl (200px)**: aggiunto per mappare Dev JSON `borderRadii.XXXXXXL`
- **full (9999px)**: per elementi circolari (badge, avatar)

### Opacity Scale

```
global.opacity.{0,10,20,30,40,50,60,70,79,80,90,100}
```

Valori: 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, **0.79**, 0.8, 0.9, 1.0

**Note**:
- Supporta opacity variants del Dev JSON (es. `MOONEYGO_PRIMARY_3_OPACITY_79`)
- **0.79**: valore specifico usato in alcuni tokens Dev JSON
- **0.70**: per `WHITE_LOW_OPACITY` e grey opacity variants
- **0.90**: per `MOONEYGO_WHITE_OPACITY_90`

**Uso**:
```json
// Esempio: creare colore con opacity
"overlay.primary": {
  "$value": "rgba(0, 88, 124, {global.opacity.79})",
  "$type": "color"
}
```

### Typography Atomics

```
global.typography.fontfamily.{manrope,mono,gotham,generalSans}
global.typography.fontsize.{2xs,xs,sm,base,lg,xl,2xl,3xl,4xl}
global.typography.fontweight.{normal,medium,semibold,bold}
global.typography.lineheight.{tight,snug,normal,relaxed}
global.typography.letterspacing.{tight,normal,wide,wider}
```

## Semantic Tokens (Livello Ruoli)

Tutti i token semantic hanno **4 modes** (clara, mooney, atm, comersud).

### Brand Identity

```
semantic.brand.core.{main|light|soft|dark|faded}
semantic.brand.alt.{main|soft|light|dark}
semantic.brand.accent.{main|soft|light|dark}
semantic.brand.fontfamily.brand
semantic.brand.theme
```

**Esempio mapping** (Mooney mode):
- `semantic.brand.core.main` → `{global.colors.ottanio.100}` (#00587C)
- `semantic.brand.alt.main` → `{global.colors.teal.80}` (#00AEC7)
- `semantic.brand.accent.main` → `{global.colors.yellow.100}` (#EDA900)

### Semantic Colors

```
semantic.colors.background.{muted|page|brand|disabled}
semantic.colors.text.{inverse|main|muted|disabled|brand}
semantic.colors.border.{main|muted|focus}
semantic.colors.feedback.{success|warning|error|info|successlight|warninglight|errorlight|infolight}
semantic.colors.icon.{main|muted|inverse|disabled}
```

### Domain-Specific Tokens

#### Mobility (Trasporti)

Ora inclusi nel sistema base sotto `semantic.colors.specific.mobility`:

```
semantic.colors.specific.mobility.bus.{dark|medium|light}
semantic.colors.specific.mobility.tram.{dark|medium|light}
semantic.colors.specific.mobility.metro.{dark|medium|light}
semantic.colors.specific.mobility.train.{dark|medium|light}
semantic.colors.specific.mobility.harbor.{dark|medium|light}
semantic.colors.specific.mobility.pullman.{dark|medium|light}
semantic.colors.specific.mobility.taxi.{dark|medium|light}
semantic.colors.specific.mobility.ncc.{dark|medium|light}
semantic.colors.specific.mobility.sharing.{dark|medium|light}
semantic.colors.specific.mobility.parking.{dark|medium|light}
semantic.colors.specific.mobility.garage.{dark|medium|light}
semantic.colors.specific.mobility.carRental.{dark|medium|light}
semantic.colors.specific.mobility.chargingStation.{dark|medium|light}
semantic.colors.specific.mobility.favorites.{dark|medium|light}
semantic.colors.specific.mobility.walk.{dark|medium|light}
semantic.colors.specific.mobility.ztl.{dark|medium|light}
semantic.colors.specific.mobility.garageTelepass.{dark|medium|light}
semantic.colors.specific.mobility.airports.{dark|medium|light}
semantic.colors.specific.mobility.skipass.{dark|medium|light}
semantic.colors.specific.mobility.pin.{dark|medium|light}
semantic.colors.specific.mobility.infoPoint.{dark|medium|light}
semantic.colors.specific.mobility.experience.{dark|medium|light}
```

**Strategia aliasing**:
- Se il colore esiste in `global.colors` → usa alias (es. `{global.colors.yellow.100}`)
- Se il colore NON esiste → usa hex hardcoded (es. `"#bd590d"`)

**Esempio**:
```json
"mobility.taxi.dark": {
  "$value": {
    "clara": "{global.colors.yellow.100}",  // Alias
    "mooney": "{global.colors.yellow.100}", // Alias
    "atm": "{global.colors.neutral.black}", // Alias
    "comersud": "{global.colors.yellow.100}" // Alias
  }
}

"mobility.bus.dark": {
  "$value": {
    "clara": "#bd590d",  // Hardcoded (non esiste in global)
    "mooney": "#bd590d",
    "atm": "#f06123",
    "comersud": "#bd590d"
  }
}
```

#### Illustrations

31 colori per illustrazioni sotto `semantic.colors.specific.illustrations.{01-31}`:

```
semantic.colors.specific.illustrations.01  // #f3ad8b
semantic.colors.specific.illustrations.02  // #cf663d
semantic.colors.specific.illustrations.03  // {global.colors.teal.40} (aliasing!)
...
semantic.colors.specific.illustrations.31  // #358551
```

#### Maps, Metro, Transport Position

```
semantic.colors.specific.maps.{01-14,25,50,white-70,white-80}
semantic.colors.specific.metro.{brescia1,catania1,genova1,milanoM1,milanoM2,milanoM3,milanoM4,milanoM5,napoli1,napoli6,romaMea,romaMeb,romaMec,torino1,torino2}
semantic.colors.specific.meansOfTransportPosition.{bus10,bus30,harbor10,harbor30,pullman10,pullman30,train10,train30,tram10,tram30}
```

## Mappatura Dev JSON → Clara Whitelabel

### Esempio: Colors

**Dev JSON (flat)**:
```json
"colors.MOONEYGO_PRIMARY_3": "#00587C"
```

**Clara Whitelabel (hierarchical)**:
```json
{
  "global": {
    "colors": {
      "ottanio": {
        "100": {
          "$value": "#00587C",
          "$type": "color"
        }
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

### Mapping Pattern Common

| Dev JSON Pattern | Clara Whitelabel | Example |
|------------------|------------------|---------|
| `colors.MOONEYGO_PRIMARY_*` | `semantic.brand.core.*` | PRIMARY_3 → core.main |
| `colors.MOONEYGO_SECONDARY_*` | `semantic.brand.alt.*` | SECONDARY_3 → alt.main |
| `colors.MOONEYGO_ACCENT_*` | `semantic.brand.accent.*` | ACCENT_1 → accent.light |
| `colors.GREYSCALE_1-5` | `global.colors.greyscale.1-5` | GREYSCALE_4 → greyscale.4 |
| `colors.FEEDBACK_*` | `semantic.colors.feedback.*` | FEEDBACK_SUCCESS → feedback.success |
| `colors.MOBILITY_*` | `semantic.colors.specific.mobility.*` | MOBILITY_BUS_DARK → mobility.bus.dark |
| `colors.MOBILITY_CAR_RENTAL_*` | `semantic.colors.specific.mobility.carRental.*` | CAR_RENTAL_DARK → carRental.dark |
| `colors.METRO_MILANO_M_1` | `semantic.colors.specific.metro.milanoM1` | MILANO_M_1 → milanoM1 |
| `colors.*_OPACITY_*` | `global.opacity.*` + rgba() | PRIMARY_3_OPACITY_79 → rgba(..., opacity.79) |
| `spacings.SPACING_*` | `global.spacing.*` | SPACING_MD → spacing.md |
| `borderRadii.RADIUS_*` | `global.radius.*` | RADIUS_MD → radius.md |
| `borderRadii.XXXXXXL` | `global.radius.7xl` | XXXXXXL → radius.7xl (200px) |

## Component Tokens

I component tokens sono alias ai semantic/global:

```json
{
  "components": {
    "button": {
      "primary": {
        "background": {
          "$value": "{semantic.brand.core.main}",  // Alias ai semantic
          "$type": "color"
        },
        "text": {
          "$value": "{semantic.colors.text.inverse}",
          "$type": "color"
        }
      }
    }
  }
}
```

## Vantaggi della Struttura Gerarchica

### Prima (Dev JSON - Flat)
❌ Nomi brand-specific ovunque
❌ Struttura piatta difficile da navigare
❌ No riutilizzo cross-brand
❌ Dot notation limitante

### Dopo (Clara Whitelabel - Hierarchical)
✅ **Nomi semantici generici** (brand.core.main)
✅ **Struttura gerarchica** (global → semantic → components)
✅ **4 brand supportati** tramite modes
✅ **Token aliasing** (riduce duplicazioni)
✅ **W3C Design Tokens compliant**
✅ **Domain-specific tokens inclusi** (mobility, illustrations, maps, metro)

## Compatibilità

### Figma
- ✅ Supporta fino a 4 modes per collection
- ✅ Alias syntax: `{path.to.token}`
- ✅ Importabile con Luckino plugin

### Luckino Plugin
- ✅ W3C Design Tokens format
- ✅ Tipografia atomizzata (no composite type)
- ✅ Shadows as CSS strings
- ✅ Supporta $description metadata

### Export Targets
- ✅ CSS Variables
- ✅ SCSS/LESS
- ✅ JavaScript/TypeScript objects
- ✅ Tailwind config
- ✅ React Native StyleSheet

## Note Tecniche

### Aliasing Strategy

Quando si aggiungono nuovi token semantici:

1. **Check global.colors**: Se l'hex esiste → usa alias
2. **Use hardcoded hex**: Se l'hex NON esiste → usa valore diretto
3. **Non modificare global**: Mai aggiungere colori a global.colors

**Esempio**:
```json
// ✅ Buono - hex esiste in global
"mobility.parking.dark": {
  "mooney": "{global.colors.ottanio.100}"  // #00587C
}

// ✅ Buono - hex non esiste in global
"mobility.bus.dark": {
  "mooney": "#bd590d"  // Hardcoded
}

// ❌ Sbagliato - non aggiungere a global
"global.colors.mobility-orange": {
  "10": {"$value": "#bd590d"}  // MAI FARE QUESTO
}
```

### Mode Mapping

Per i token domain-specific:
- `mooneygo` (source) → `mooney` (target)
- `clara` mode: usa valori `mooneygo` come fallback
- Alcuni token hanno valori diversi per brand (es. mobility.taxi è nero su ATM)

### Naming Convention: camelCase

**Tutti i nuovi token seguono la convenzione camelCase** per le chiavi:
- ✅ `carRental` (non car-rental)
- ✅ `chargingStation` (non charging-station)
- ✅ `garageTelepass` (non garage-telepass)
- ✅ `infoPoint` (non info-point)
- ✅ `meansOfTransportPosition` (non means-of-transport-position)
- ✅ `milanoM1` (non milano-m-1)
- ✅ `romaMea` (non roma-mea)
- ✅ `bus10`, `train30` (non bus-10, train-30)

**Eccezioni**:
- Token numerici sequenziali usano solo numeri: `01`, `02`, `03` (illustrations, maps)
- Maps con suffissi alfanumerici: `white-70`, `white-80` (mantenuti per chiarezza)

### Token Numerici

Illustrations e maps usano **naming numerico puro**:
- `illustrations.01`, `illustrations.02`, ... `illustrations.31`
- `maps.01`, `maps.02`, ... `maps.50`

Metro e transport usano **camelCase**:
- `metro.milanoM1`, `metro.milanoM2`, `metro.romaMea`, ecc.
- `meansOfTransportPosition.bus10`, `meansOfTransportPosition.harbor30`, ecc.

## Risorse

- [W3C Design Tokens Spec](https://design-tokens.github.io/community-group/format/)
- [Figma Variables API](https://www.figma.com/plugin-docs/api/properties/figma-variables/)
- Clara Tokens: `clara-tokens.json`
- Dev Source: `json-dev/theme-mooneygo.json`

---

**Data Aggiornamento**: 2025-01-04
**Versione Sistema**: v2.0.0
**Modes Supportati**: 4 (clara, mooney, atm, comersud)
**Tokens Totali**: ~450 (inclusi domain-specific: mobility, illustrations, maps, metro)
**Compatibilità**: Figma + Luckino + W3C Standard

---

## Component Tokens Import - 2025-11-15

### Nuovi Componenti Importati

Sono stati importati **10 nuovi component tokens** da `theme-mooneygo.json` alla collection `components` di `clara-tokens.json`:

#### 1. **accordion** (66 tokens)
- **Source**: `UIAccordion.*`
- **Struttura**: roles (primary, secondary, tertiary) + sections (titleSection, contentSection)
- **Proprietà**: backgroundColor, textColor, iconColor, textRole, textWeight, padding, border, margins
- **Note**: Componente accordion completo con varianti multiple

#### 2. **tab** (17 tokens)
- **Source**: `UITabBar.*`
- **Struttura**: Sistema navigazione tab
- **Proprietà**: backgroundColor, textColor, selectedTextColor, selectedUnderlineColor, iconSize, height
- **Note**: Supporto icon e text, stati selected/unselected

#### 3. **modal** (9 tokens)
- **Source**: `mixins.modals.*`
- **Struttura**: Sistema modale
- **Proprietà**: backgroundColor, backdropColor, backdropOpacity, padding, borderRadius, iconSize, textColor, titleFontRole
- **Note**: Include gestione backdrop e integrazione tipografica

#### 4. **bottomSheet** (10 tokens)
- **Source**: `mixins.bottomSheet.*`
- **Struttura**: Mobile bottom sheet
- **Proprietà**: backgroundColor, fullscreenBackgroundColor, highlightedBackgroundColor, borderRadius, handleColor, handleHeight, handleWidth, handleContainerHeight, handleBottomSpacing, shadow
- **Note**: Componente mobile-first con handle visibile

#### 5. **dropdown** (6 tokens)
- **Source**: `UILinkedCardCart.dropdown*`
- **Struttura**: Dropdown/Select styling
- **Proprietà**: TitleColor, IconColor, BackgroundColor, BorderColor, BorderRadius, BorderWidth
- **Note**: ⚠️ Naming inconsistente (PascalCase invece di camelCase)

#### 6. **textInput** (44 tokens)
- **Source**: `UITextInput.*`
- **Struttura**: roles (default, ghost, error-message)
- **Proprietà**: height, lineHeight, backgroundColor, border (all sides), borderColor, focusedBorderColor, errorBorderColor, textColor, padding, placeholderColor, textRole
- **Note**: Sistema completo con gestione focus ed errori

#### 7. **button** (40 tokens)
- **Source**: `UIButton.*`
- **Struttura**: roles (primary, secondary, tertiary, ghost, destructive) + variants (default, small, large)
- **Proprietà**: backgroundColor, textColor, borderColor, borderWidth, textWeight, padding, borderRadius, height
- **Note**: Sistema button completo con 5 ruoli + 3 size variants

#### 8. **checkbox** (20 tokens)
- **Source**: `UICheckbox.*`
- **Struttura**: status (unchecked, checked, disabled) + sizes (standard, big)
- **Proprietà**: borderColor, backgroundColor, icon, borderWidth, size
- **Note**: Stati completi + varianti dimensionali

#### 9. **radioToggle** (24 tokens)
- **Source**: `UIRadioToggle.*`
- **Struttura**: roles (primary, secondary)
- **Proprietà**: selectedBorderColor, selectedBackgroundColor, unselectedBorderColor, unselectedBackgroundColor, selectedTextColor, unselectedTextColor, disabledBorderColor, disabledBackgroundColor, borderWidth, borderRadius
- **Note**: Radio button / toggle component con 2 ruoli

#### 10. **banner** (30 tokens)
- **Source**: `UIBanner.*`
- **Struttura**: roles (default, info, warning, danger, success, special)
- **Proprietà**: backgroundColor, textColor, iconColor, textWeight, textRole, borderRadius, padding
- **Note**: Banner notifications con 6 varianti semantiche

### Statistiche Import

- **Componenti totali in clara-tokens.json**: 13 (4 preesistenti + 9 nuovi + 1 duplicato rimosso)
- **Token totali importati**: 266
- **Componenti preesistenti preservati**: badge (11), card (5), input (9)

### Problemi Identificati da Gemini

#### ⚠️ Alias Non Convertiti
Molti valori sono rimasti come stringhe hardcoded invece di essere convertiti in alias:
- `MOONEYGO_PRIMARY_3`, `MOONEYGO_GREY10`, `MOONEYGO_BLUE` → necessitano mapping a `{semantic.brand.*}`
- `BACKDROP_COLOR`, `TAG_STATUS_WARNING_DARK` → necessitano mapping appropriato
- Valori dimensionali `M`, `XS`, `S` → necessitano mapping a `{global.spacing.*}` o `{semantic.spacing.*}`

#### ❌ $type Inappropriati
Il campo `$type` è errato in molti token:
- `borderRadius` con valore `"M"` ha `$type: "color"` → dovrebbe essere `borderRadius` o `string`
- `textWeight` con valore `"regular"` ha `$type: "color"` → dovrebbe essere `fontWeight`
- `iconSize` con valore `30` ha `$type: "color"` → dovrebbe essere `dimension`
- `icon` con valore `"basic_general_check"` ha `$type: "color"` → dovrebbe essere `string` o `asset`

#### ⚠️ Naming Inconsistente
Il componente `dropdown` usa PascalCase (`TitleColor`, `BackgroundColor`) invece di camelCase come tutti gli altri componenti.

### Azioni Future Necessarie

1. **Correggere Alias**: Mappare tutti i valori hardcoded (es. `MOONEYGO_*`) agli alias corretti nel livello semantic/global
2. **Sanificare $type**: Correggere tutti i `$type` inappropriati
3. **Standardizzare Naming**: Convertire `dropdown` token names in camelCase
4. **Completare Mapping**: Aggiungere mapping esplicito per spacing tokens (`M`, `XS`, `S`, etc.)

### Script Utilizzato

File: `/Users/mattia/Documents/Mattia/Progetti/Mooney/json-dev/import-components-v2.py`

```python
# Estrae componenti da theme-mooneygo.json (flat structure)
# Converte in nested structure W3C con $value e $type
# Supporta conversione parziale alias (WHITE, BLACK, GREYSCALE_*, FEEDBACK_*)
```

