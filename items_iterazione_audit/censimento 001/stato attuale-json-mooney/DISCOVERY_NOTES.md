# Design Tokens Conversion - Discovery Phase Notes

**Progetto**: Conversione Design Tokens Mooney (Flat JSON → W3C DTCG)
**Durata Prevista**: 4 mesi
**Fase Corrente**: Discovery & Pilot (Sessione 1)
**Data**: 27 Ottobre 2025

---

## 🎯 Obiettivo del Progetto

Convertire i design tokens esistenti (formato flat con dot notation) in formato W3C Design Tokens Community Group (DTCG) per:
- Importarli in Figma tramite plugin Tokens Studio (ex Figma Tokens)
- Gestire multi-brand themes (base + mooneygo + altri 2 brand futuri)
- Migliorare manutenibilità tramite sistema di alias/riferimenti

---

## 📊 Architettura Tokens Identificata

### Sistema Whitelabel Multi-Brand

```
theme-base.json (White Label Theme)
    ↓ extends & overrides
    ├─→ theme-mooneygo.json (Brand MooneyGo)
    ├─→ theme-brand3.json (futuro)
    └─→ theme-brand4.json (futuro)
```

### Struttura Token (3 Livelli)

**1. Primitive Tokens** (foundation layer):
- `colors.*` - Colori base (#hex, rgba)
- `spacings.*` - Dimensioni spacing (px)
- `borderRadii.*` - Border radius (px)
- `fonts.*` - Font family names

**2. Composite Tokens** (pattern layer):
- `shadows.*` - Box shadows (color, offset, blur, spread, opacity)
- `UIText.roles.*` - Typography (fontFamily, fontSize, lineHeight, letterSpacing, fontWeight)

**3. Component Tokens** (component layer):
- `UIMainHeader.*`, `UIButton.*`, `UIAccordion.*`, ecc.
- Proprietà: backgroundColor, textColor, borderColor, padding, ecc.

### Sistema Alias a 3 Livelli

```
Level 1 (Primitive):   colors.MOONEYGO_BLUE: "#00587C"
                              ↓ referenced by
Level 2 (Semantic):    colors.MOONEYGO_PRIMARY_3: "MOONEYGO_BLUE"
                              ↓ referenced by
Level 3 (Component):   UIMainHeader.roles.primary.textColor: "MOONEYGO_PRIMARY_3"
```

**Formato W3C alias**: `{colors.MOONEYGO_BLUE}` invece di `"MOONEYGO_BLUE"`

---

## 🛠 Lavoro Completato (Sessione 1)

### 1. Script di Conversione Creato

**File**: [`convert-to-w3c.js`](./convert-to-w3c.js)

**Funzionalità implementate**:
- ✅ Parser dot notation → nested JSON structure
- ✅ Type inference automatico (`$type`: color, dimension, shadow, typography, fontFamily)
- ✅ Aggregazione token compositi (shadows, typography)
- ✅ Reference resolver (alias → formato `{path}`)
- ✅ Gestione unità dimensionali (`px` per fontSize, lineHeight, ecc.)
- ✅ Output multi-formato (Option A + Option B)

**Pattern riconosciuti**:
```javascript
// Shadow composite
"shadows.{name}.shadowColor"
"shadows.{name}.shadowOffset.width"
"shadows.{name}.shadowOffset.height"
"shadows.{name}.shadowRadius"
"shadows.{name}.shadowOpacity"
→ Aggregati in: shadows.{name} { $type: "shadow", $value: { color, offsetX, offsetY, blur, spread } }

// Typography composite
"UIText.roles.{name}.fontFamily"
"UIText.roles.{name}.size"
"UIText.roles.{name}.lineHeight"
"UIText.roles.{name}.letterSpacing"
→ Aggregati in: UIText.roles.{name} { $type: "typography", $value: { fontFamily, fontSize, lineHeight, letterSpacing } }
```

### 2. Output Files Generati

**Option A - File Separati**:
- ✅ `theme-base-w3c.json` (2172 tokens → nested structure)
- ✅ `theme-mooneygo-w3c.json` (2226 tokens → nested structure)

**Option B - File Unificato Multi-Tema**:
- ✅ `themes-unified-w3c.json`
  - Struttura `$themes` con metadata (id, name, selectedTokenSets)
  - `base`: tutti i token del tema base
  - `mooneygo`: solo override rispetto a base

### 3. Validazione Gemini CLI

**Risultati**:
- ✅ Struttura W3C DTCG conforme allo standard
- ✅ Token compositi (shadow, typography) ben formati
- ✅ Multi-theme format corretto (Tokens Studio compatible)
- ✅ Alias `{path}` sintatticamente corretti

**Fix applicati**:
- ✅ Rimosso `$value` da gruppi vuoti (es. `UIText.colors`)
- ✅ Aggiunto unità `px` a `letterSpacing: 0` → `letterSpacing: "0px"`

---

## 📈 Statistiche Token

| Tema | Token Totali | Token Primitivi | Token Compositi | Token Brand-Specific |
|------|--------------|-----------------|------------------|----------------------|
| Base | 2172 | ~500 colors, spacings, borderRadii | ~100 shadows, typography | 0 |
| MooneyGo | 2226 | +54 overrides | Stessi + override | ~40 MOONEYGO_* |

**Differenze Base → MooneyGo**:
- Font: `"Default"` → `"Gotham"`
- BLACK: `#000000` → `#1E1E1E`
- GREYSCALE_1: `#eee` → `#f6f6f6`
- +40 nuovi token: `MOONEYGO_PRIMARY_3`, `MOONEYGO_BLUE`, `MOONEYGO_YELLOW`, ecc.
- ~150 componenti usano alias brand (es. `textColor: "MOONEYGO_BLUE"`)

---

## 🔍 Aree di Miglioramento Identificate

### Priorità Alta (Next Session)

1. **Aumentare uso alias**
   Molti valori duplicati (es. `#BBBBBB` ripetuto in 10+ shadow tokens)
   ```json
   // Prima
   "variant01": { "$value": { "color": "#BBBBBB" } }

   // Dopo (consigliato)
   "variant01": { "$value": { "color": "{colors.GREYSCALE_2}" } }
   ```

2. **Normalizzare naming convention**
   Mix di convenzioni: `SCREAMING_SNAKE_CASE` (WHITE), `camelCase` (dark02), `kebab-case` (variant-1)
   **Decisione da prendere**: Quale adottare per tutto il sistema?

3. **Testare import in Figma Tokens**
   Validare che i file generati si importino correttamente e che:
   - I temi siano switchabili
   - Gli alias vengano risolti
   - I token compositi funzionino

### Priorità Media

4. **Documentare token semantici**
   Creare layer semantico esplicito:
   ```
   color.text.primary → {colors.MOONEYGO_BLUE}
   color.text.secondary → {colors.GREYSCALE_4}
   ```

5. **Gestire font files**
   Attualmente: `fonts.Default.bold.fileName: "non-existing-font-file"`
   Da mappare a font reali o rimuovere se non necessari

6. **Token di animazione/duration**
   Non presenti nel sistema attuale - da aggiungere?

### Priorità Bassa

7. **Ottimizzare dimensione file unified**
   `themes-unified-w3c.json` contiene tutto il base + override
   Possibile ottimizzazione: solo diff in mooneygo

8. **Validatore automatico**
   Script che verifica:
   - Tutti gli alias puntano a token esistenti
   - Nessun riferimento circolare
   - Valori colore validi (regex hex/rgba)

---

## 🚀 Prossimi Step (Session 2-4)

### Session 2: Test & Refinement
- [ ] Importare `theme-mooneygo-w3c.json` in Figma Tokens plugin
- [ ] Verificare rendering componenti in Figma
- [ ] Identificare token mancanti o problematici
- [ ] Aumentare uso alias (refactoring guided)
- [ ] Decidere naming convention finale

### Session 3: Brand 3 & 4
- [ ] Ricevere/creare `theme-brand3.json` e `theme-brand4.json`
- [ ] Estendere script per supportare 4 temi
- [ ] Generare output unificato con 4 temi
- [ ] Testare switch tra temi in Figma

### Session 4: Documentation & Automation
- [ ] Creare documentazione per designer (come usare i token)
- [ ] Creare documentazione per developer (come estendere)
- [ ] Setup CI/CD per validazione automatica
- [ ] Script per sync Figma → codebase

---

## 📝 Note Tecniche

### Mapping React Native → W3C

| React Native Property | W3C DTCG Property |
|-----------------------|-------------------|
| `shadowOffset.width` | `offsetX` |
| `shadowOffset.height` | `offsetY` |
| `shadowRadius` | `blur` |
| `shadowOpacity` | *(integrato in color RGBA)* |
| `elevation` | *(Android only, omesso)* |

### W3C Types Usati

- `color` - Hex, RGB, RGBA, named colors
- `dimension` - Spacing, border radius, sizes (con `px`)
- `shadow` - Box shadow composito
- `typography` - Font composito
- `fontFamily` - Nome font (array di string)
- `fontWeight` - bold, regular, medium, ecc.

### Tool & Dependencies

- **Node.js**: Script conversione (`convert-to-w3c.js`)
- **Gemini CLI**: Validazione AI-assisted
- **Figma + Tokens Studio Plugin**: Target import
- **Standard**: [W3C DTCG Spec](https://tr.designtokens.org/format/)

---

## ⚠️ Issues & Blockers

### Risolti
- ✅ File troppo grandi (>25k tokens) → Risolto leggendo a chunk
- ✅ Gemini rate limit (429) → Normal, retry later
- ✅ Empty group `$value` → Fixed con post-processing

### Open
- ⚠️ Non testato import reale in Figma Tokens (next session)
- ⚠️ Plugin path `/Users/mattia/Documents/Mattia/Figma/Luckino/plugin` non analizzato per format esatto
- ⚠️ Naming convention inconsistente (da decidere standard)

---

## 🔗 File & Resources

### File Generati (Session 1)
```
/Users/mattia/Documents/Mattia/Progetti/Mooney/stato attuale-json-mooney/
├── theme-base.json                  [INPUT]
├── theme-mooneygo.json              [INPUT]
├── convert-to-w3c.js                [SCRIPT]
├── fix-conversion.js                [SCRIPT - post-processing]
├── theme-base-w3c.json              [OUTPUT A - Base]
├── theme-mooneygo-w3c.json          [OUTPUT A - MooneyGo]
├── themes-unified-w3c.json          [OUTPUT B - Unified]
└── DISCOVERY_NOTES.md               [QUESTO FILE]
```

### Useful Commands

```bash
# Esegui conversione
node convert-to-w3c.js theme-base.json theme-mooneygo.json

# Valida con Gemini
gemini "Analyze theme-mooneygo-w3c.json..."

# Conta token per categoria
cat theme-base.json | jq 'keys | group_by(split(".")[0]) | map({(.[0]): length}) | add'

# Trova tutti gli alias
grep -o '"\w\+":' theme-mooneygo.json | sort | uniq -c | sort -rn
```

---

## 💡 Insights & Lessons Learned

1. **W3C DTCG è flessibile ma preciso**
   Permette strutture nested arbitrarie ma richiede `$type` e `$value` precisi

2. **Token compositi richiedono aggregazione**
   Shadow e Typography vanno ricomposti da N chiavi flat → 1 token W3C

3. **Alias sono critici per scalabilità**
   Sistema whitelabel non funziona bene senza alias ben strutturati

4. **Tokens Studio ≠ W3C puro**
   `$themes` e `selectedTokenSets` sono estensioni Tokens Studio (ma standard de-facto)

5. **Validazione AI-assisted è preziosa**
   Gemini ha identificato issue (empty groups, letterSpacing units) che validator non avrebbe trovato

---

## 📚 Resources & Links

- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [W3C DTCG Format Spec](https://tr.designtokens.org/format/)
- [Tokens Studio (Figma Plugin)](https://tokens.studio/)
- [Tokens Studio Docs - Multi-theme](https://docs.tokens.studio/themes/themes-pro)

---

**Next Session TODO**:
1. Testare import reale in Figma Tokens
2. Verificare che il plugin path `/Users/mattia/Documents/Mattia/Figma/Luckino/plugin` corrisponda al formato usato
3. Refactoring alias guidato (iniziare da colors, poi shadows)
4. Decidere naming convention finale
5. Creare template per brand 3 e 4

**Per Claude (prossima sessione)**:
Questa è una fase **DISCOVERY** di un progetto lungo 4 mesi. Leggi questi notes prima di continuare il lavoro. Il focus è stato sulla conversione pilota di 2 temi (base + mooneygo). I prossimi step sono test reali in Figma e refactoring alias.
