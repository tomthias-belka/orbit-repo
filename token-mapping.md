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
  ├─ button (primary, secondary, disabled, shared)
  ├─ input (background, border, borderfocus, text, placeholder, padding, borderradius, fontsize)
  ├─ card (background, border, padding, borderradius, shadow)
  └─ badge (success, error, warning, shared)
```

### Modes Supportati

Il sistema supporta **4 brand** tramite il meccanismo di modes W3C:

- **clara**: Brand Clara (nuovo)
- **mooney**: Brand Mooney (originale MooneyGo)
- **atm**: Brand ATM Milano
- **comersud**: Brand Comersud

## Global Tokens (Livello Atomico)

### Palette Colori

Il sistema include **13 famiglie di colori** con scale da 5 a 600:

```
global.colors.neutral.{white|black|transparent}

global.colors.teal.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600}
global.colors.gray.{5,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700}
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
```

**Note importanti**:
- Numerazione: 5, 10, 20, 30... (NON 100-900)
- Gray ha un valore extra: `700`
- Le famiglie includono: teal (turchese), ottanio (blu petrolio), darkgray (grigio blu)

### Spacing Scale

```
global.spacing.{none,5xs,4xs,3xs,2xs,xs,sm,md,lg,xl,2xl,3xl,4xl}
```

Valori: 0, 2, 3, 4, 8, 12, 16, 20, 24, 28, 32, 42, 50 (px)

### Radius Scale

```
global.radius.{none,2xs,xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,full}
```

Valori: 0, 2, 4, 8, 10, 15, 16, 18, 20, 24, 30, 100, 9999 (px)

### Typography Atomics

```
global.typography.fontfamily.{sans,mono,gotham}
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

Ora inclusi nel sistema base sotto `semantic.specific.mobility`:

```
semantic.specific.mobility.bus.{dark|medium|light}
semantic.specific.mobility.tram.{dark|medium|light}
semantic.specific.mobility.metro.{dark|medium|light}
semantic.specific.mobility.train.{dark|medium|light}
semantic.specific.mobility.harbor.{dark|medium|light}
semantic.specific.mobility.pullman.{dark|medium|light}
semantic.specific.mobility.taxi.{dark|medium|light}
semantic.specific.mobility.ncc.{dark|medium|light}
semantic.specific.mobility.sharing.{dark|medium|light}
semantic.specific.mobility.parking.{dark|medium|light}
semantic.specific.mobility.garage.{dark|medium|light}
semantic.specific.mobility.carRental.{dark|medium|light}
semantic.specific.mobility.chargingStation.{dark|medium|light}
semantic.specific.mobility.favorites.{dark|medium|light}
semantic.specific.mobility.walk.{dark|medium|light}
semantic.specific.mobility.ztl.{dark|medium|light}
semantic.specific.mobility.garageTelepass.{dark|medium|light}
semantic.specific.mobility.airports.{dark|medium|light}
semantic.specific.mobility.skipass.{dark|medium|light}
semantic.specific.mobility.pin.{dark|medium|light}
semantic.specific.mobility.infoPoint.{dark|medium|light}
semantic.specific.mobility.experience.{dark|medium|light}
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

31 colori per illustrazioni sotto `semantic.specific.illustrations.{01-31}`:

```
semantic.specific.illustrations.01  // #f3ad8b
semantic.specific.illustrations.02  // #cf663d
semantic.specific.illustrations.03  // {global.colors.teal.40} (aliasing!)
...
semantic.specific.illustrations.31  // #358551
```

#### Maps, Metro, Transport Position

```
semantic.specific.maps.{01-14,25,50,white-70,white-80}
semantic.specific.metro.{brescia1,catania1,genova1,milanoM1,milanoM2,milanoM3,milanoM4,milanoM5,napoli1,napoli6,romaMea,romaMeb,romaMec,torino1,torino2}
semantic.specific.meansOfTransportPosition.{bus10,bus30,harbor10,harbor30,pullman10,pullman30,train10,train30,tram10,tram30}
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
| `colors.GREYSCALE_*` | `global.colors.gray.*` | GREYSCALE_4 → gray.60 |
| `colors.FEEDBACK_*` | `semantic.colors.feedback.*` | FEEDBACK_SUCCESS → feedback.success |
| `colors.MOBILITY_*` | `semantic.specific.mobility.*` | MOBILITY_BUS_DARK → mobility.bus.dark |
| `colors.MOBILITY_CAR_RENTAL_*` | `semantic.specific.mobility.carRental.*` | CAR_RENTAL_DARK → carRental.dark |
| `colors.METRO_MILANO_M_1` | `semantic.specific.metro.milanoM1` | MILANO_M_1 → milanoM1 |
| `spacings.SPACING_*` | `global.spacing.*` | SPACING_MD → spacing.md |
| `borderRadii.RADIUS_*` | `global.radius.*` | RADIUS_MD → radius.md |

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
