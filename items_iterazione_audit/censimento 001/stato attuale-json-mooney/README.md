# Mooney Design Tokens - W3C DTCG Conversion

Conversione dei design tokens Mooney dal formato flat (dot notation) al formato W3C Design Tokens Community Group (DTCG) per integrazione con Figma Tokens Studio.

## 🎯 Quick Start

```bash
# Converti i temi in formato W3C
node convert-to-w3c.js theme-base.json theme-mooneygo.json

# Output generati:
# - theme-base-w3c.json (Option A - file separato base)
# - theme-mooneygo-w3c.json (Option A - file separato mooneygo)
# - themes-unified-w3c.json (Option B - file unificato multi-tema)
```

## 📁 File Structure

```
.
├── theme-base.json              # Tema white label (input)
├── theme-mooneygo.json          # Tema brand MooneyGo (input)
├── convert-to-w3c.js            # Script di conversione principale
├── fix-conversion.js            # Post-processing fixes
├── theme-base-w3c.json          # Output W3C - Base theme
├── theme-mooneygo-w3c.json      # Output W3C - MooneyGo theme
├── themes-unified-w3c.json      # Output W3C - Multi-theme unified
├── DISCOVERY_NOTES.md           # Note dettagliate progetto (LEGGI PRIMA)
└── README.md                    # Questo file
```

## 🔄 Formato Conversione

### Input (Flat)
```json
{
  "colors.WHITE": "#ffffff",
  "colors.MOONEYGO_BLUE": "#00587C",
  "UIMainHeader.roles.primary.textColor": "MOONEYGO_BLUE",
  "shadows.line_up.shadowColor": "#BBBBBB",
  "shadows.line_up.shadowOffset.width": 0,
  "shadows.line_up.shadowOffset.height": -1
}
```

### Output (W3C Nested)
```json
{
  "colors": {
    "WHITE": {
      "$value": "#ffffff",
      "$type": "color"
    },
    "MOONEYGO_BLUE": {
      "$value": "#00587C",
      "$type": "color"
    }
  },
  "UIMainHeader": {
    "roles": {
      "primary": {
        "textColor": {
          "$value": "{colors.MOONEYGO_BLUE}"
        }
      }
    }
  },
  "shadows": {
    "line_up": {
      "$type": "shadow",
      "$value": {
        "color": "#BBBBBB",
        "offsetX": "0px",
        "offsetY": "-1px",
        "blur": "0.5px",
        "spread": "0px"
      }
    }
  }
}
```

## 🎨 Architettura Temi

```
theme-base.json (White Label)
    └─ extends & overrides
        ├─→ theme-mooneygo.json (Brand MooneyGo) ✅
        ├─→ theme-brand3.json (Futuro)
        └─→ theme-brand4.json (Futuro)
```

## 📊 Statistiche

- **Base Theme**: 2172 tokens
- **MooneyGo Theme**: 2226 tokens (+54 overrides, +40 brand tokens)
- **Token Types**: colors, spacings, borderRadii, shadows, typography, components
- **Composite Tokens**: ~100 shadows + typography aggregati

## ✅ Validazione

Script testato e validato con:
- ✅ W3C DTCG Spec compliance
- ✅ Gemini AI code review
- ✅ Token compositi (shadow, typography)
- ✅ Sistema di alias/riferimenti
- ✅ Multi-theme structure (Tokens Studio)

## 🚀 Next Steps

1. **Testare import in Figma Tokens Studio**
2. **Aumentare uso alias** (ridurre duplicazione valori)
3. **Normalizzare naming convention** (decidere standard)
4. **Aggiungere brand 3 e 4**

## 📚 Documentation

Per dettagli completi del progetto, architettura, decisioni tecniche e roadmap → Leggi [DISCOVERY_NOTES.md](./DISCOVERY_NOTES.md)

## 🔗 Links

- [W3C DTCG Spec](https://tr.designtokens.org/format/)
- [Tokens Studio Docs](https://docs.tokens.studio/)
- [Figma Plugin - Luckino](./../../../Figma/Luckino/plugin)

---

**Progetto**: Discovery Phase (4 mesi)
**Status**: ✅ Pilot completato - Session 1/N
**Last Update**: 27 Ottobre 2025
