# Clara WhiteLabel - Note di Sessione

## 🎯 Stato Attuale del Progetto

### ✅ Completato in questa sessione:

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
- Token system: `/Users/mattia/Documents/Mattia/Progetti/Mooney/items_iterazione_audit/whitelabel-tokens-atm.json`
- Dev reference: `/Users/mattia/Documents/Mattia/Progetti/Mooney/items_iterazione_audit/censimento 002/theme-mooneygo-updated.json`
- Clara plugin: `/Users/mattia/Documents/Mattia/Progetti/Mooney/ClaraWhiteLabel/`
- Figma scope map: `/Users/mattia/Documents/Mattia/Progetti/Mooney/ClaraWhiteLabel/1756900008529 (1).png`

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
4. ⏳ Semantic typography (prossima sessione)
5. ⏳ Component tokens (prossima sessione)

---

## 💡 Note dall'Utente

- "essendo whitelabel, il colore e la ui del tema di default dovrà essere agnostico"
- "non fare nessun commit se non chiaramente richiesto da me"
- "cerca di ottimizzare il più possibile"
- User preferisce essere conciso e diretto
- Usa Gemini CLI come sub-agente per testing/validazione

---

*Ultimo aggiornamento: 2025-10-30*
*File tokens: whitelabel-tokens-atm.json*
*Status: Primitives ✅ | Semantic ✅ (colors only) | Components ⏳ | Typography ⏳*
