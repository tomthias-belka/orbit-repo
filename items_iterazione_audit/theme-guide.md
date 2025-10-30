# Guida: Aggiungere Nuovi Temi al Sistema Whitelabel

## Introduzione

Questo sistema whitelabel supporta **temi multipli** tramite Figma Modes. Ogni tema rappresenta un brand diverso con propri colori, spaziature e stili tipografici.

**Attualmente configurati**: 4 temi
- `mooney`: Brand originale Mooney (blu/turchese/giallo)
- `corporate`: Brand corporate generico (blu professionale)
- `creative`: Brand creativo (viola/rosa vibrante)
- `eco`: Brand eco-friendly (verde/natura)

**Capacità totale**: Fino a **20 temi** (limite consigliato per gestibilità)

---

## Anatomia di un Tema

Un tema è definito dai **valori specifici** assegnati ai token semantici nella chiave `$value`:

```json
{
  "semantic": {
    "colors": {
      "brand": {
        "primary": {
          "$value": {
            "mooney": "{primitives.colors.blue.700}",      // Tema 1
            "corporate": "{primitives.colors.blue.700}",   // Tema 2
            "creative": "{primitives.colors.purple.500}",  // Tema 3
            "eco": "{primitives.colors.green.500}",        // Tema 4
            "nuovo-tema": "{primitives.colors.red.600}"    // Tema 5 ← NUOVO
          },
          "$type": "color"
        }
      }
    }
  }
}
```

---

## Workflow: Aggiungere un Nuovo Tema

### Step 1: Definire l'Identità del Brand

Prima di modificare il JSON, definisci:

1. **Nome del tema** (lowercase, no spazi): es. `tech-startup`, `luxury-fashion`, `health-wellness`
2. **Colore primario**: Quale famiglia colore da `primitives` userai?
3. **Colore secondario**: Colore di supporto
4. **Colore accent**: Colore per CTA/highlight
5. **Personalità**: Corporate? Playful? Elegante?

**Esempio**:
```
Nome: "tech-startup"
Primario: Blue (energia, fiducia)
Secondario: Cyan (innovazione)
Accent: Orange (azione)
Personalità: Moderno, dinamico, tech-forward
```

---

### Step 2: Aggiungere il Tema ai Token Semantici

Apri `whitelabel-tokens.json` e aggiungi il nuovo tema a **TUTTI i token semantici** che hanno `$value` come oggetto.

#### 2.1 Brand Colors

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
            "eco": "{primitives.colors.green.500}",
            "tech-startup": "{primitives.colors.blue.600}"  // ← NUOVO
          },
          "$type": "color"
        },
        "secondary": {
          "$value": {
            "mooney": "{primitives.colors.cyan.700}",
            "corporate": "{primitives.colors.cyan.600}",
            "creative": "{primitives.colors.pink.500}",
            "eco": "{primitives.colors.cyan.700}",
            "tech-startup": "{primitives.colors.cyan.600}"  // ← NUOVO
          },
          "$type": "color"
        },
        "accent": {
          "$value": {
            "mooney": "{primitives.colors.yellow.600}",
            "corporate": "{primitives.colors.orange.600}",
            "creative": "{primitives.colors.yellow.600}",
            "eco": "{primitives.colors.yellow.700}",
            "tech-startup": "{primitives.colors.orange.600}"  // ← NUOVO
          },
          "$type": "color"
        }
      }
    }
  }
}
```

#### 2.2 Surface Colors

```json
{
  "surface": {
    "primary": {
      "$value": {
        "mooney": "{primitives.colors.neutral.white}",
        "corporate": "{primitives.colors.neutral.white}",
        "creative": "{primitives.colors.neutral.white}",
        "eco": "{primitives.colors.grey.50}",
        "tech-startup": "{primitives.colors.grey.50}"  // ← NUOVO (leggermente grigio)
      },
      "$type": "color"
    },
    "secondary": {
      "$value": {
        "mooney": "{primitives.colors.grey.100}",
        "corporate": "{primitives.colors.grey.50}",
        "creative": "{primitives.colors.purple.100}",
        "eco": "{primitives.colors.green.100}",
        "tech-startup": "{primitives.colors.blue.50}"  // ← NUOVO (tinta blu)
      },
      "$type": "color"
    }
  }
}
```

#### 2.3 Text Colors

```json
{
  "text": {
    "primary": {
      "$value": {
        "mooney": "{primitives.colors.grey.900}",
        "corporate": "{primitives.colors.neutral.black}",
        "creative": "{primitives.colors.purple.700}",
        "eco": "{primitives.colors.green.700}",
        "tech-startup": "{primitives.colors.grey.900}"  // ← NUOVO
      },
      "$type": "color"
    }
  }
}
```

#### 2.4 Border & Feedback Colors

Ripeti lo stesso pattern per:
- `border.primary`, `border.secondary`, `border.focus`
- `feedback.success`, `feedback.warning`, `feedback.error`, `feedback.info`
- Le versioni `-light` di tutti i feedback colors

---

### Step 3: Aggiungere il Tema agli Spacing (Opzionale)

Se il nuovo brand ha spaziature diverse:

```json
{
  "spacing": {
    "component": {
      "md": {
        "$value": {
          "mooney": "{primitives.spacing.4}",
          "corporate": "{primitives.spacing.4}",
          "creative": "{primitives.spacing.5}",
          "eco": "{primitives.spacing.4}",
          "tech-startup": "{primitives.spacing.4}"  // ← NUOVO (stesso valore)
        },
        "$type": "spacing"
      }
    }
  }
}
```

**Nota**: Se il nuovo tema usa le stesse spaziature di un tema esistente, puoi copiare i valori.

---

### Step 4: Aggiungere il Tema alla Tipografia

Atomizza le proprietà tipografiche:

```json
{
  "typography": {
    "heading": {
      "h1": {
        "fontFamily": {
          "$value": {
            "mooney": "{primitives.typography.fontFamily.gotham}",
            "corporate": "{primitives.typography.fontFamily.sans}",
            "creative": "{primitives.typography.fontFamily.sans}",
            "eco": "{primitives.typography.fontFamily.sans}",
            "tech-startup": "{primitives.typography.fontFamily.sans}"  // ← NUOVO
          },
          "$type": "fontFamily"
        },
        "fontSize": {
          "$value": {
            "mooney": "{primitives.typography.fontSize.4xl}",
            "corporate": "{primitives.typography.fontSize.4xl}",
            "creative": "{primitives.typography.fontSize.4xl}",
            "eco": "{primitives.typography.fontSize.3xl}",
            "tech-startup": "{primitives.typography.fontSize.4xl}"  // ← NUOVO
          },
          "$type": "fontSize"
        },
        "fontWeight": {
          "$value": {
            "mooney": "{primitives.typography.fontWeight.bold}",
            "corporate": "{primitives.typography.fontWeight.bold}",
            "creative": "{primitives.typography.fontWeight.bold}",
            "eco": "{primitives.typography.fontWeight.semibold}",
            "tech-startup": "{primitives.typography.fontWeight.bold}"  // ← NUOVO
          },
          "$type": "fontWeight"
        }
      }
    }
  }
}
```

Ripeti per: `h2`, `h3`, `body.large`, `body.base`, `body.small`

---

### Step 5: Aggiungere il Tema ai Componenti

#### Button Border Radius

```json
{
  "components": {
    "button": {
      "shared": {
        "border-radius": {
          "$value": {
            "mooney": "{primitives.radius.md}",
            "corporate": "{primitives.radius.sm}",
            "creative": "{primitives.radius.lg}",
            "eco": "{primitives.radius.md}",
            "tech-startup": "{primitives.radius.lg}"  // ← NUOVO (bordi arrotondati)
          },
          "$type": "borderRadius"
        }
      }
    }
  }
}
```

#### Card Shadow

```json
{
  "card": {
    "shadow": {
      "$value": {
        "mooney": "0 4px 12px rgba(0, 88, 124, 0.1)",
        "corporate": "0 2px 8px rgba(0, 0, 0, 0.1)",
        "creative": "0 8px 24px rgba(168, 85, 247, 0.15)",
        "eco": "0 2px 12px rgba(53, 133, 81, 0.1)",
        "tech-startup": "0 6px 20px rgba(8, 145, 178, 0.15)"  // ← NUOVO
      },
      "$type": "string"
    }
  }
}
```

---

### Step 6: Validare il JSON

Dopo aver aggiunto il tema, valida la sintassi:

```bash
# Usa un validatore JSON online
https://jsonlint.com/

# O usa Gemini CLI
gemini "Valida sintassi JSON in /path/to/whitelabel-tokens.json"
```

**Checklist**:
- [ ] Tutti i token semantici hanno il nuovo tema
- [ ] Tutti gli alias si risolvono correttamente
- [ ] Nessuna virgola mancante o extra
- [ ] Sintassi JSON valida

---

### Step 7: Import in Figma via Luckino

1. Apri Figma
2. Lancia il plugin **Luckino Variables Import Export**
3. Seleziona `whitelabel-tokens.json`
4. Import → Il plugin creerà:
   - Collection `primitives` (senza modes)
   - Collection `semantic` (con 5 modes ora!)
   - Collection `components` (con 5 modes)
5. Verifica che il nuovo mode `tech-startup` sia visibile nel panel Variabili di Figma

---

## Esempi di Temi Completi

### Tema "Luxury Fashion"

**Identità**:
- Primario: Purple scuro (eleganza)
- Secondario: Pink (sofisticato)
- Accent: Gold (via yellow)
- Spaziature: Più generose (creative)
- Font: Mantieni sans
- Radius: Arrotondati (lg)

**Colori**:
```json
{
  "brand": {
    "primary": "{primitives.colors.purple.700}",
    "secondary": "{primitives.colors.pink.500}",
    "accent": "{primitives.colors.yellow.600}"
  },
  "surface": {
    "primary": "{primitives.colors.neutral.white}",
    "secondary": "{primitives.colors.purple.100}"
  },
  "text": {
    "primary": "{primitives.colors.purple.700}",
    "secondary": "{primitives.colors.purple.500}"
  }
}
```

---

### Tema "Health & Wellness"

**Identità**:
- Primario: Green calmo
- Secondario: Cyan fresco
- Accent: Yellow vitale
- Spaziature: Normali
- Font: Sans
- Radius: Moderati (md)

**Colori**:
```json
{
  "brand": {
    "primary": "{primitives.colors.green.500}",
    "secondary": "{primitives.colors.cyan.700}",
    "accent": "{primitives.colors.yellow.600}"
  },
  "surface": {
    "primary": "{primitives.colors.green.50}",
    "secondary": "{primitives.colors.green.100}"
  },
  "text": {
    "primary": "{primitives.colors.green.700}",
    "secondary": "{primitives.colors.grey.600}"
  }
}
```

---

## Limiti e Best Practices

### Limiti Figma
- **Massimo 4 modes per collection** (limite Figma attuale)
- Se hai più di 4 temi, dovrai:
  - Creare collection separate (`semantic-themes-1-4`, `semantic-themes-5-8`)
  - Oppure usare file Figma separati per gruppi di temi

### Best Practices
1. **Mantieni consistenza**: Tutti i temi devono avere gli stessi token
2. **Usa sempre alias**: Non hardcodare valori nei semantic tokens
3. **Documenta decisioni**: Aggiungi `$description` per scelte non ovvie
4. **Testa in Figma**: Importa e verifica che tutto funzioni prima di committare
5. **Versiona il JSON**: Usa git per tracciare modifiche ai temi

---

## Troubleshooting

### Errore: "Mode not found"
**Causa**: Hai dimenticato di aggiungere il nuovo tema a qualche token semantico.
**Soluzione**: Cerca nel JSON tutti i `$value: {` e verifica che il nuovo tema sia presente.

### Errore: "Circular reference"
**Causa**: Un alias punta a se stesso o crea un loop.
**Soluzione**: Verifica gli alias con Gemini CLI o manualmente.

### Errore: "Invalid token type"
**Causa**: $type non riconosciuto da Luckino.
**Soluzione**: Usa solo: `color`, `spacing`, `borderRadius`, `fontSize`, `fontFamily`, `fontWeight`, `lineHeight`, `number`, `string`.

---

## Risorse

- **Template tema vuoto**: [theme-template.json](./theme-template.json) (da creare)
- **Luckino Docs**: [DOCUMENTATION.md](/Users/mattia/Documents/Mattia/Figma/Luckino/plugin/prompt%20md/DOCUMENTATION.md)
- **W3C Spec**: https://design-tokens.github.io/community-group/format/

---

**Prossimi Passi**: Dopo aver aggiunto il tema, esporta come CSS/SCSS per usarlo nel codice!
