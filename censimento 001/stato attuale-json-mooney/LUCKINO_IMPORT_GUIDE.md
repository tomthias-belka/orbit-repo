# Guida Import Tokens in Luckino

**Progetto**: Mooney Design Tokens per Luckino
**Data**: 27 Ottobre 2025
**Output Generato**: `mooney-tokens.json` + `mooney-variables.tokens.json`

---

## 📁 File Generati

### 1. `mooney-tokens.json` (11KB)
**Contenuto**: Token primitivi (foundation layer)
- Colori base (`colors.*`)
- Spacing (`spacings.*`)
- Border Radius (`borderRadii.*`)
- Font names (`fontNames.*`)

**Caratteristiche**:
- Valori singoli per token uguali in entrambi i temi
- Multi-mode `{ "base": value1, "mooneygo": value2 }` per token diversi

**Esempio**:
```json
{
  "colors": {
    "WHITE": {
      "$type": "color",
      "$value": "#ffffff"
    },
    "BLACK": {
      "$type": "color",
      "$value": {
        "base": "#000000",
        "mooneygo": "#1E1E1E"
      }
    }
  }
}
```

### 2. `mooney-variables.tokens.json` (154KB)
**Contenuto**: Token semantici e component-level
- Shadows (come stringhe CSS)
- Mixins (patterns riutilizzabili)
- Componenti UI (`UIMainHeader`, `UIButton`, `UIText`, ecc.)
- Typography (atomizzato: fontSize, fontFamily, lineHeight separati)

**Caratteristiche**:
- Riferimenti alias: `{colors.MOONEYGO_BLUE}`
- Multi-mode per valori diversi tra temi
- Typography atomizzato (NO composite type)
- Shadows come CSS strings

**Esempio**:
```json
{
  "UIMainHeader": {
    "roles": {
      "primary": {
        "textColor": {
          "$type": "color",
          "$value": {
            "base": "{colors.BLACK}",
            "mooneygo": "{colors.MOONEYGO_BLUE}"
          }
        }
      }
    }
  },
  "shadows": {
    "line_up": {
      "$type": "string",
      "$value": "0px -1px 0.5px 0px #BBBBBB"
    }
  }
}
```

---

## 🚀 Come Importare in Luckino

### Step 1: Aprire Luckino in Figma

1. Apri il file Figma dove vuoi usare i token
2. Vai al menu **Plugins** → **Luckino** (o il nome del plugin)
3. Seleziona **Import Tokens**

### Step 2: Importare Primitives

1. Click su **"Import JSON"** o **"Load Tokens"**
2. Seleziona il file **`mooney-tokens.json`**
3. Luckino creerà una **Variable Collection** chiamata `colors`, `spacings`, ecc.
4. Vedrai **2 modes**: `base` e `mooneygo`

### Step 3: Importare Variables

1. Dopo aver importato i primitives, importa **`mooney-variables.tokens.json`**
2. Luckino risolverà automaticamente i riferimenti (es. `{colors.BLACK}`)
3. Verranno create collections per:
   - `shadows`
   - `mixins`
   - `UIMainHeader`, `UIText`, `UIButton`, ecc.

### Step 4: Switchare tra Temi

1. Nel pannello Figma **Variables**
2. Seleziona una collection (es. `colors`)
3. Usa il dropdown **Mode** per switchare tra:
   - `base` (tema white label)
   - `mooneygo` (tema brand MooneyGo)

---

## 🎨 Utilizzo dei Tokens in Figma

### Applicare Colori

1. Seleziona un elemento (rettangolo, testo, ecc.)
2. Nel pannello **Fill** o **Stroke**
3. Click sull'icona **Variable** (quadratino con link)
4. Seleziona il token desiderato (es. `colors/MOONEYGO_BLUE`)
5. Il colore cambierà automaticamente quando switchi mode!

### Applicare Spacing

1. Seleziona un frame o component
2. Nel pannello **Auto Layout**
3. Per padding/gap, click sull'icona **Variable**
4. Seleziona `spacings/M`, `spacings/L`, ecc.

### Applicare Typography

⚠️ **IMPORTANTE**: Typography è **atomizzato** in Luckino

I token typography NON sono applicabili direttamente come "stile testo". Devi applicare singolarmente:

1. **Font Family**: `UIText/roles/h1/fontFamily` → Switcha tra "Default" e "Gotham"
2. **Font Size**: `UIText/roles/h1/size` → Es. 40px
3. **Line Height**: `UIText/roles/h1/lineHeight` → Es. 48px
4. **Letter Spacing**: `UIText/roles/h1/letterSpacing` → Es. 0px

**Workflow raccomandato**:
- Crea **Text Styles** in Figma manualmente
- Collega ogni proprietà a una variable
- Quando switchi mode, tutte le proprietà si aggiornano

### Applicare Shadows

Le shadows sono salvate come **stringhe CSS**. Luckino potrebbe non applicarle direttamente come effect.

**Alternative**:
1. Usa i token shadow come **reference** per creare Figma Effects manualmente
2. Oppure salva shadow come **Figma Styles** (collegati alle variables)

---

## 🔍 Verifica Import Corretto

### Checklist Post-Import

- [ ] Variable Collections create:
  - [ ] `colors` (con ~170+ token)
  - [ ] `spacings` (con XS, S, M, L, XL, ecc.)
  - [ ] `borderRadii` (con NONE, XS, S, M, L, ecc.)
  - [ ] `UIMainHeader`, `UIText`, `UIButton`, ecc.

- [ ] Modes creati:
  - [ ] `base`
  - [ ] `mooneygo`

- [ ] Alias funzionanti:
  - [ ] `{colors.BLACK}` si risolve a `#000000` (base) o `#1E1E1E` (mooneygo)
  - [ ] `{colors.MOONEYGO_BLUE}` si risolve a `#00587C`

- [ ] Multi-mode values:
  - [ ] Switching mode da `base` a `mooneygo` cambia valori
  - [ ] Es: `colors.GREYSCALE_1` passa da `#eee` a `#f6f6f6`

---

## ⚠️ Limitazioni e Known Issues

### 1. Typography Non Composita
**Problema**: Luckino non supporta `$type: "typography"` come token composito.

**Soluzione**: I token sono stati **atomizzati**. Ogni proprietà è un token separato:
- `UIText.roles.h1.fontFamily`
- `UIText.roles.h1.size`
- `UIText.roles.h1.lineHeight`
- `UIText.roles.h1.letterSpacing`

**Workaround**: Crea Figma Text Styles manualmente e collega ogni proprietà.

### 2. Shadows Come Stringhe
**Problema**: Shadows sono stringhe CSS (`"0px 2px 4px 0px #000000"`), non Figma Effects.

**Soluzione**: Usa come reference per creare effects manualmente, oppure Luckino potrebbe parsarle (da verificare).

### 3. Font Files Non Mappati
**Problema**: Token `fonts.Default.bold.fileName: "non-existing-font-file"` non puntano a font reali.

**Soluzione**: Ignorare questi token o rimuoverli. Usare `fontNames.*` per i nomi font (es. `Gotham`).

### 4. Limite 4 Modes per Collection
**Problema**: Luckino supporta max 4 modes per collection.

**Impatto**: Con 4 temi totali (base + mooneygo + brand3 + brand4), siamo al limite.

**Future**: Se serve aggiungere più temi, dividere in più collections.

### 5. Max 5000 Variables per Collection
**Problema**: Limite Luckino di 5000 variables.

**Status Attuale**: ~2200 token → OK
**Future**: Se aggiungiamo brand3 e brand4, potremmo avvicinarci al limite.

---

## 🐛 Troubleshooting

### Import Fallisce

**Errore**: "Invalid JSON format"
**Causa**: File corrotti o mal formattati
**Fix**: Riconverti con `node convert-to-luckino.js theme-base.json theme-mooneygo.json`

### Alias Non Si Risolvono

**Errore**: `{colors.BLACK}` appare come stringa invece che risolversi
**Causa**: Token primitivi non importati prima delle variables
**Fix**: Importa PRIMA `mooney-tokens.json`, POI `mooney-variables.tokens.json`

### Mode Non Appare

**Errore**: Solo mode `base` visibile, `mooneygo` manca
**Causa**: Token multi-mode non importati correttamente
**Fix**: Verifica che il file contenga `"$value": { "base": ..., "mooneygo": ... }`

### Typography Non Applicabile

**Errore**: Non riesco ad applicare typography come stile
**Causa**: Typography è atomizzato, non composite
**Fix**: Applica singole proprietà (fontSize, fontFamily, ecc.) una per una

---

## 📊 Statistiche Token Importati

| Categoria | Token Count | Multi-Mode | Note |
|-----------|-------------|------------|------|
| **colors** | ~170 | Sì (~40 diversi) | Include MOONEYGO_* brand colors |
| **spacings** | 13 | No (uguali) | NONE, XXXXS → XXXXXL |
| **borderRadii** | 13 | No (uguali) | NONE, XXXS → XXXXXXL |
| **shadows** | 9 | No (uguali) | Come CSS strings |
| **fontNames** | 2 | Sì | Default vs Gotham |
| **mixins** | ~50 | Alcuni | Link colors, mobility colors |
| **UI Components** | ~1900 | Molti | UIMainHeader, UIText, UIButton, ecc. |
| **TOTALE** | ~2200 | ~150 | Base: 2172, Mooneygo: 2226 |

---

## 🔗 Riferimenti

- **Script Conversione**: [`convert-to-luckino.js`](./convert-to-luckino.js)
- **Discovery Notes**: [`DISCOVERY_NOTES.md`](./DISCOVERY_NOTES.md)
- **Luckino Plugin Path**: `/Users/mattia/Documents/Mattia/Figma/Luckino/plugin`
- **Esempio Luckino Format**: `/Users/mattia/Documents/Mattia/Figma/Luckino/plugin/tokens/variables.tokens.json`

---

## 💡 Tips & Best Practices

1. **Import Order Matters**: Sempre primitives prima, variables dopo
2. **Usa Alias**: Preferisci `{colors.MOONEYGO_BLUE}` a `#00587C` hardcoded
3. **Text Styles**: Crea Figma Text Styles per typography (atomizzato)
4. **Mode Naming**: "base" = white label, "mooneygo" = brand theme
5. **Testing**: Dopo import, testa switching mode su un componente

---

**Next Steps**:
1. ✅ Import `mooney-tokens.json` in Luckino
2. ✅ Import `mooney-variables.tokens.json` in Luckino
3. 🔄 Test switching tra `base` e `mooneygo` modes
4. 🎨 Applica tokens ai componenti in Figma
5. 📝 Report issues/feedback per Session 2

---

**Supporto**: Per problemi o domande, vedere [`DISCOVERY_NOTES.md`](./DISCOVERY_NOTES.md) o creare issue nel progetto.
