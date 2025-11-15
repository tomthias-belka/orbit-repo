# Token Naming Conversion Rules

## Overview

Questo documento definisce le regole di conversione automatica tra i nomi dei token del Dev JSON (flat, UPPER_SNAKE_CASE) e Clara Whitelabel (hierarchical, camelCase).

## Principi Generali

### 1. Struttura: Flat → Hierarchical

**Dev JSON** usa dot-notation flat:
```
colors.MOONEYGO_PRIMARY_3
spacings.SPACING_MD
borderRadii.RADIUS_XL
```

**Clara Whitelabel** usa gerarchia annidata:
```json
{
  "semantic": {
    "brand": {
      "core": {
        "main": {...}
      }
    }
  }
}
```

### 2. Case Convention: UPPER_SNAKE → camelCase

**Dev JSON**: `UPPER_SNAKE_CASE`
- `MOONEYGO_PRIMARY_3`
- `CAR_RENTAL_DARK`
- `MILANO_M_1`

**Clara Whitelabel**: `camelCase` per chiavi multi-word
- `core.main`
- `carRental.dark`
- `milanoM1`

**Eccezioni**:
- Token numerici: `01`, `02`, `50` (illustrations, maps)
- Token alfabetici semplici: `xs`, `md`, `lg` (spacing, radius)
- Combinazioni alfanumeriche: `white-70`, `white-80` (maps)

### 3. Prefissi Brand → Brand-Agnostic

**Dev JSON**: usa prefissi brand-specific
- `MOONEYGO_*`
- `ATM_*` (se presenti)

**Clara Whitelabel**: usa nomi semantici generici
- `brand.core.*`
- `brand.alt.*`
- `brand.accent.*`

I valori brand-specific sono gestiti tramite **modes**:
```json
{
  "semantic.brand.core.main": {
    "$value": {
      "clara": "{global.colors.ocean.70}",
      "mooney": "{global.colors.ottanio.100}",
      "atm": "{global.colors.orange.400}",
      "comersud": "{global.colors.ocean.100}"
    }
  }
}
```

### 4. Suffissi Varianti → Modes o Nesting

**Dev JSON**: usa suffissi per varianti
- `_DARK`, `_MEDIUM`, `_LIGHT`
- `_OPACITY_20`, `_OPACITY_79`
- `_1`, `_2`, `_3`

**Clara Whitelabel**: usa nesting gerarchico
```json
// Varianti Dark/Medium/Light
"mobility.bus": {
  "dark": {...},
  "medium": {...},
  "light": {...}
}

// Varianti numeriche
"brand.core": {
  "main": {...},     // PRIMARY_3
  "light": {...},    // PRIMARY_2
  "soft": {...}      // PRIMARY_1
}
```

## Regole di Conversione Specifiche

### Colors

#### Brand Colors

| Dev JSON | Clara Path | Note |
|----------|------------|------|
| `MOONEYGO_PRIMARY_1` | `semantic.brand.core.soft` | Variante più chiara |
| `MOONEYGO_PRIMARY_2` | `semantic.brand.core.light` | Variante chiara |
| `MOONEYGO_PRIMARY_3` | `semantic.brand.core.main` | Colore principale |
| `MOONEYGO_SECONDARY_1` | `semantic.brand.alt.soft` | |
| `MOONEYGO_SECONDARY_2` | `semantic.brand.alt.light` | |
| `MOONEYGO_SECONDARY_3` | `semantic.brand.alt.main` | |
| `MOONEYGO_ACCENT_1` | `semantic.brand.accent.light` | |
| `MOONEYGO_ACCENT_2` | `semantic.brand.accent.main` | |

#### Greyscale

| Dev JSON | Clara Path | Valore |
|----------|------------|--------|
| `GREYSCALE_1` | `global.colors.greyscale.1` | #f6f6f6 |
| `GREYSCALE_2` | `global.colors.greyscale.2` | #DDDDDD |
| `GREYSCALE_3` | `global.colors.greyscale.3` | #BBBBBB |
| `GREYSCALE_4` | `global.colors.greyscale.4` | #787878 |
| `GREYSCALE_5` | `global.colors.greyscale.5` | #4f4f4f |

**Note**: Diverso da `gray.*` (scale 5-700) e `grey.*` (scale 5-600)

#### Feedback Colors

| Dev JSON | Clara Path |
|----------|------------|
| `FEEDBACK_SUCCESS` | `semantic.colors.feedback.success` |
| `FEEDBACK_SUCCESS_DARK` | `semantic.colors.feedback.success` (mode-specific) |
| `FEEDBACK_WARNING` | `semantic.colors.feedback.warning` |
| `FEEDBACK_ERROR` | `semantic.colors.feedback.error` |
| `FEEDBACK_INFO` | `semantic.colors.feedback.info` |

#### Mobility Colors

**Pattern**: `MOBILITY_{CATEGORY}_{VARIANT}` → `semantic.colors.specific.mobility.{category}.{variant}`

Conversione naming:
1. Rimuovi prefisso `MOBILITY_`
2. Converti in camelCase
3. Lowercase per variant (dark, medium, light)

Esempi:

| Dev JSON | Clara Path |
|----------|------------|
| `MOBILITY_BUS_DARK` | `semantic.colors.specific.mobility.bus.dark` |
| `MOBILITY_CAR_RENTAL_DARK` | `semantic.colors.specific.mobility.carRental.dark` |
| `MOBILITY_CHARGING_STATION_DARK` | `semantic.colors.specific.mobility.chargingStation.dark` |
| `MOBILITY_GARAGE_TELEPASS_DARK` | `semantic.colors.specific.mobility.garageTelepass.dark` |
| `MOBILITY_INFO_POINT_DARK` | `semantic.colors.specific.mobility.infoPoint.dark` |

**Regole camelCase specifiche**:
- `CAR_RENTAL` → `carRental`
- `CHARGING_STATION` → `chargingStation`
- `GARAGE_TELEPASS` → `garageTelepass`
- `INFO_POINT` → `infoPoint`

#### Metro Colors

**Pattern**: `METRO_{CITY}_{LINE}` → `semantic.colors.specific.metro.{city}{line}`

| Dev JSON | Clara Path | Note |
|----------|------------|------|
| `METRO_MILANO_M_1` | `semantic.colors.specific.metro.milanoM1` | Rimuovi underscore |
| `METRO_MILANO_M_2` | `semantic.colors.specific.metro.milanoM2` | |
| `METRO_ROMA_MEA` | `semantic.colors.specific.metro.romaMea` | lowercase 'Mea' |
| `METRO_NAPOLI_1` | `semantic.colors.specific.metro.napoli1` | |
| `METRO_TORINO_1` | `semantic.colors.specific.metro.torino1` | |

#### Opacity Variants

**Pattern**: `{COLOR}_OPACITY_{VALUE}` → `rgba({color}, {global.opacity.{value}})`

| Dev JSON | Clara Implementation |
|----------|---------------------|
| `MOONEYGO_PRIMARY_3_OPACITY_79` | `rgba(#00587C, {global.opacity.79})` |
| `MOONEYGO_WHITE_OPACITY_90` | `rgba(#ffffff, {global.opacity.90})` |
| `WHITE_LOW_OPACITY` | `rgba(#ffffff, {global.opacity.70})` |
| `MOONEYGO_DANGER_OPACITY_20` | `rgba({danger.color}, {global.opacity.20})` |

### Spacing

**Pattern**: `SPACING_{SIZE}` → `global.spacing.{size}`

Conversione size naming:

| Dev JSON Size | Clara Size | Valore |
|---------------|------------|--------|
| `XXXXS` | `5xs` | 2px |
| `XXXS` | `4xs` | 3px |
| `XXS` | `3xs` | 4px |
| `XS` | `2xs` | 8px |
| `S` | `xs` | 12px |
| `M` | `sm` | 16px |
| `L` | `md` | 20px |
| `XL` | `lg` | 24px |
| `XXL` | `xl` | 28px |
| `XXXL` | `2xl` | 32px |
| `XXXXL` | `3xl` | 42px |
| `XXXXXL` | `4xl` | 50px |

**Regola**:
- `X` ripetuti → numero + `xs`
- Lettere singole → nomi standard (`xs`, `sm`, `md`, `lg`, `xl`)
- Multi-X → numero seguito da `xl`

### Border Radius

**Pattern**: `RADIUS_{SIZE}` → `global.radius.{size}`

| Dev JSON Size | Clara Size | Valore |
|---------------|------------|--------|
| `XXXXXXL` | `7xl` | 200px |
| `XXXXXL` | `6xl` | 100px |
| `XXXXL` | `5xl` | 30px |
| `XXXL` | `4xl` | 24px |
| `XXL` | `3xl` | 20px |
| `XL` | `2xl` | 18px |
| `L` | `xl` | 16px |
| `M` | `lg` | 15px |
| `S` | `md` | 10px |
| `XS` | `sm` | 8px |
| `XXS` | `xs` | 4px |
| `XXXS` | `2xs` | 2px |

**Note**: L/M/S del Dev JSON sono sfalsati rispetto alla scala standard Clara (lg/md/sm)

## Algoritmo di Conversione Automatica

### Step 1: Identificazione Categoria

```python
def identify_category(dev_token_name):
    """
    Identifica la categoria del token dal nome Dev JSON
    """
    prefix = dev_token_name.split('.')[0]

    categories = {
        'colors': 'color',
        'spacings': 'spacing',
        'borderRadii': 'borderRadius',
        'shadows': 'shadow',
        'fonts': 'typography',
        'mixins': 'mixin',
        'UI*': 'component'
    }

    return categories.get(prefix, 'unknown')
```

### Step 2: Rimozione Prefissi Brand

```python
def remove_brand_prefix(token_name):
    """
    Rimuove prefissi brand-specific
    """
    prefixes = ['MOONEYGO_', 'ATM_', 'COMERSUD_', 'CLARA_']

    for prefix in prefixes:
        if token_name.startswith(prefix):
            return token_name[len(prefix):]

    return token_name
```

### Step 3: Conversione Case

```python
def to_camel_case(snake_case_str):
    """
    Converte UPPER_SNAKE_CASE a camelCase
    """
    components = snake_case_str.lower().split('_')

    # Prima parola lowercase, resto capitalize
    return components[0] + ''.join(x.title() for x in components[1:])

# Esempi:
# CAR_RENTAL → carRental
# CHARGING_STATION → chargingStation
# MILANO_M_1 → milanoM1
```

### Step 4: Mappatura Gerarchia

```python
def map_to_hierarchy(dev_token_name, category):
    """
    Mappa token flat a path gerarchico
    """
    mapping = {
        'PRIMARY': 'semantic.brand.core',
        'SECONDARY': 'semantic.brand.alt',
        'ACCENT': 'semantic.brand.accent',
        'GREYSCALE': 'global.colors.greyscale',
        'FEEDBACK': 'semantic.colors.feedback',
        'MOBILITY': 'semantic.colors.specific.mobility',
        'METRO': 'semantic.colors.specific.metro',
        'SPACING': 'global.spacing',
        'RADIUS': 'global.radius'
    }

    # Trova pattern matching
    for pattern, path in mapping.items():
        if pattern in dev_token_name:
            return path

    return None
```

### Step 5: Gestione Varianti

```python
def map_variant(variant_suffix):
    """
    Mappa suffissi numerici a nomi semantici
    """
    brand_variants = {
        '1': 'soft',
        '2': 'light',
        '3': 'main'
    }

    mobility_variants = {
        'DARK': 'dark',
        'MEDIUM': 'medium',
        'LIGHT': 'light'
    }

    # Logica di decisione basata su contesto...
```

## Esempi Completi di Conversione

### Esempio 1: Brand Color

```
Input:  colors.MOONEYGO_PRIMARY_3
Step 1: Categoria = 'color'
Step 2: Rimuovi 'MOONEYGO_' → 'PRIMARY_3'
Step 3: Identifica pattern 'PRIMARY' → semantic.brand.core
Step 4: Mappa variante '3' → 'main'
Output: semantic.brand.core.main
```

### Esempio 2: Mobility

```
Input:  colors.MOBILITY_CAR_RENTAL_DARK
Step 1: Categoria = 'color'
Step 2: Rimuovi 'MOBILITY_' → 'CAR_RENTAL_DARK'
Step 3: Identifica pattern 'MOBILITY' → semantic.colors.specific.mobility
Step 4: Estrai categoria 'CAR_RENTAL' → camelCase 'carRental'
Step 5: Estrai variant 'DARK' → lowercase 'dark'
Output: semantic.colors.specific.mobility.carRental.dark
```

### Esempio 3: Spacing

```
Input:  spacings.SPACING_XXXL
Step 1: Categoria = 'spacing'
Step 2: Rimuovi 'SPACING_' → 'XXXL'
Step 3: Converti size 'XXXL' → '2xl'
Output: global.spacing.2xl
```

### Esempio 4: Opacity Variant

```
Input:  colors.MOONEYGO_PRIMARY_3_OPACITY_79
Step 1: Categoria = 'color'
Step 2: Identifica pattern '_OPACITY_' → color with opacity
Step 3: Base color = 'MOONEYGO_PRIMARY_3' → semantic.brand.core.main
Step 4: Opacity value = '79' → global.opacity.79
Output: rgba({semantic.brand.core.main}, {global.opacity.79})
        O semantic token dedicato per override
```

## Edge Cases e Gestione Eccezioni

### 1. Token Non Mappabili

Alcuni token Dev JSON non hanno equivalenti diretti in Clara:

**Strategia**:
- Creare semantic token app-specific sotto `semantic.colors.specific.*`
- Documentare in `UNMAPPED_TOKENS.md`
- Valutare se sono veramente necessari o duplicati

Esempi:
```
MOONEYGO_EXTRA_COLOR_1
MOONEYGO_MAP_COLOR_1
AREAB_BACKGROUND_COLOR
ATAC_ACTIVATION_NORMAL_BG_COLOR
```

### 2. Componenti UI

Token UI component (UIButton, UITextInput, etc.) hanno struttura più complessa:

**Approccio Clara**:
- Mantieni componenti essenziali (button, input, card, badge)
- Usa aliasing massivo a semantic tokens
- App-specific components rimangono fuori dal whitelabel core

### 3. Typo e Inconsistenze

Dev JSON può contenere typo (es. `MOONEYGP_` invece di `MOONEYGO_`):

**Strategia**:
- Normalizza durante conversione
- Documenta inconsistenze trovate
- Mantieni traccia in changelog

## Validazione Post-Conversione

### Checklist

- [ ] Tutti i colori hex esistono in `global.colors` o sono hardcoded
- [ ] Nomi seguono camelCase convention
- [ ] Paths gerarchici corretti (`semantic.colors.specific.*`, non `semantic.specific.*`)
- [ ] Modes (clara, mooney, atm, comersud) hanno tutti i valori
- [ ] Aliasing usa sintassi corretta `{path.to.token}`
- [ ] Descrizioni ($description) documentano source mapping
- [ ] Token W3C compliant ($value, $type)

### Tool di Validazione

```bash
# Validazione JSON syntax
jq empty clara-tokens.json

# Verifica aliasing (tutti i reference devono esistere)
node scripts/validate-aliases.js

# Controllo naming convention
node scripts/validate-naming.js

# Export test (verifica che tutto sia importabile in Figma)
# Usa Luckino plugin manualmente
```

## Risorse

- [W3C Design Tokens Format](https://design-tokens.github.io/community-group/format/)
- [Figma Variables Naming Best Practices](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- Dev JSON Source: [json-dev/theme-mooneygo.json](json-dev/theme-mooneygo.json)
- Clara Tokens: [clara-tokens.json](clara-tokens.json)
- Token Mapping: [token-mapping.md](token-mapping.md)

---

**Versione**: 1.0.0
**Ultimo Aggiornamento**: 2025-01-15
**Maintainer**: Clara Design System Team
