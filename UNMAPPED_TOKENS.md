# Unmapped Tokens: Dev JSON → Clara Whitelabel

## Overview

Questo documento elenca tutti i token presenti nel Dev JSON (`theme-mooneygo.json`) che **NON** hanno una mappatura diretta in Clara Whitelabel (`clara-tokens.json`), con le motivazioni e le azioni consigliate.

**Totale tokens Dev JSON**: ~2,226
**Totale tokens mappati**: ~450
**Tokens non mappati**: ~1,776 (79%)

---

## Categorie Non Mappate

### 1. UI Component Tokens (⚠️ Gap Maggiore)

**Conteggio**: ~1,800 tokens

Clara Whitelabel copre solo **4 tipi di componenti** (button, input, card, badge) mentre il Dev JSON ha oltre **50 componenti UI** con stati, varianti e proprietà dettagliate.

#### 1.1 UIButton (40 tokens)

**Esempio tokens Dev JSON**:
```
UIButton.primary.background.color
UIButton.primary.text.color
UIButton.secondary.background.color
UIButton.disabled.background.color
UIButton.large.padding.horizontal
UIButton.small.height
```

**Clara coverage**:
```json
"components.button": {
  "primary": {"background", "text"},
  "secondary": {"background", "text"},
  "disabled": {"background", "text"},
  "shared": {"borderRadius", "padding"}
}
```

**Gap**:
- Mancano varianti size (small, medium, large)
- Mancano stati (hover, active, focus, pressed)
- Mancano proprietà dettagliate (border, shadow, elevation)

**Raccomandazione**: ✅ **Espandere `components.button`** se si vuole multi-brand UI consistency

---

#### 1.2 UITextInput (44 tokens)

**Esempio tokens Dev JSON**:
```
UITextInput.default.background.color
UITextInput.default.border.color
UITextInput.focused.border.color
UITextInput.error.border.color
UITextInput.disabled.background.color
UITextInput.placeholder.text.color
UITextInput.text.color
UITextInput.padding.horizontal
UITextInput.padding.vertical
UITextInput.border.width
UITextInput.border.radius
UITextInput.height
```

**Clara coverage**:
```json
"components.input": {
  "background", "border", "borderfocus", "text",
  "placeholder", "padding", "borderradius", "fontsize"
}
```

**Gap**:
- Mancano stati error, disabled
- Mancano proprietà border.width, height
- Mancano varianti size

**Raccomandazione**: ✅ **Espandere `components.input`** aggiungendo stati e size variants

---

#### 1.3 Altri Componenti Non Mappati

**Lista completa** (con numero approssimativo di tokens):

| Componente | Tokens | Clara? | Raccomandazione |
|------------|--------|--------|-----------------|
| `UIAccordion` | 66 | ❌ | App-specific, skip |
| `UIText` | 85 | ❌ | Usare `semantic.typography.*` |
| `UIPin` | 66 | ❌ | Domain-specific (maps), considerare |
| `UICardExperience` | 39 | ✅ | Generalizzare a `components.card` |
| `UITag` | 30+ | ❌ | Simile a badge, valutare merge |
| `UIBanner` | 25+ | ❌ | Considerare aggiunta |
| `UIHeader` | 20+ | ❌ | App-specific, skip |
| `UIIconButton` | 20+ | ❌ | Variant di button, valutare |
| `UIAvatar` | 15+ | ❌ | App-specific, skip |
| `UIChip` | 15+ | ❌ | Simile a badge/tag |
| `UISwitch` | 12+ | ❌ | Form component, considerare |
| `UICheckbox` | 12+ | ❌ | Form component, considerare |
| `UIRadio` | 12+ | ❌ | Form component, considerare |
| `UIModal` | 20+ | ❌ | Layout component, considerare |
| `UIToast` | 15+ | ❌ | Feedback component, considerare |
| `UIBottomSheet` | 18+ | ❌ | Mobile-specific, skip |
| `UITabBar` | 20+ | ❌ | Navigation, app-specific |
| Molti altri... | 500+ | ❌ | Vari |

**Strategia Generale**:

1. **Core Components** (button, input, card, badge): ✅ **Espandi** in Clara
2. **Form Components** (checkbox, radio, switch): 🟡 **Valuta** se necessari per multi-brand
3. **Feedback Components** (toast, banner, modal): 🟡 **Valuta** pattern comuni
4. **Navigation Components** (tabbar, header): ❌ **Skip** (troppo app-specific)
5. **Domain Components** (pin, maps-related): 🟡 **Valuta** caso per caso
6. **Screen Components** (ScreenMyTickets, etc.): ❌ **Skip** (app-specific)

---

### 2. Extra/Utility Colors (⚠️ Gap Critico)

**Conteggio**: ~30 tokens

#### 2.1 Extra Colors

**Tokens Dev JSON**:
```
colors.MOONEYGO_EXTRA_COLOR_1
colors.MOONEYGO_EXTRA_COLOR_1_BLUE
colors.MOONEYGO_EXTRA_COLOR_2
colors.MOONEYGO_EXTRA_COLOR_3
```

**Status**: ❌ Non documentati in Dev JSON (valore sconosciuto)

**Raccomandazione**: 🔍 **Investigare uso** nel codebase, poi decidere se mappare

---

#### 2.2 Single-Purpose Colors

**Tokens Dev JSON**:
```
colors.MOONEYGO_DANGER (diverso da FEEDBACK_ERROR_DARK?)
colors.MOONEYGO_GREEN (diverso da FEEDBACK_SUCCESS?)
colors.MOONEYGO_BLUE (varie varianti: BLUE6, BLUE7, BLUE10, BLUE11)
colors.MOONEYGO_ORANGE2
```

**Clara mapping**:
- `MOONEYGO_DANGER` → probabilmente duplicato di `semantic.colors.feedback.error`
- `MOONEYGO_GREEN` → probabilmente duplicato di `semantic.colors.feedback.success`
- `MOONEYGO_BLUE*` → uso sconosciuto, investigare

**Raccomandazione**:
1. ✅ **Verificare duplicati** con semantic.colors.feedback
2. 🔍 **Grep codebase** per capire uso effettivo
3. ❌ **Rimuovere** se sono alias non usati

---

#### 2.3 Map Colors

**Tokens Dev JSON**:
```
colors.MOONEYGO_MAP_COLOR_1
colors.MOONEYGO_MAP_COLOR_2
colors.MOONEYGP_MAP_BOTTOM_SHEET_80 (typo: MOONEYGP)
```

**Clara ha 50+ map colors**: `semantic.colors.specific.maps.{01-50, white-70, white-80}`

**Gap**: Dev JSON ha solo 3 map colors, Clara ne ha 50!

**Domanda**: ❓ **Da dove vengono i 50 map colors di Clara?**

**Raccomandazione**:
1. 🔍 **Documentare source** dei 50 map colors Clara
2. ✅ **Verificare se MAP_COLOR_1/2** corrispondono a qualche maps.* in Clara
3. 🔍 **Investigare typo** MOONEYGP

---

#### 2.4 MOONEYGO_GREY Variants (17 tokens)

**Tokens Dev JSON**:
```
colors.MOONEYGO_GREY1
colors.MOONEYGO_GREY2
...
colors.MOONEYGO_GREY17
```

Alcuni con opacity (es. `GREY8: "#F7F7F770"`)

**Clara ha**:
- `global.colors.gray.*` (17 levels: 5-700)
- `global.colors.grey.*` (16 levels: 5-600)
- `global.colors.greyscale.*` (5 levels: 1-5) ← NUOVO

**Gap**: MOONEYGO_GREY1-17 non mappano chiaramente a nessuna delle 3 scale

**Raccomandazione**:
1. 🔍 **Analizzare hex values** di GREY1-17
2. ✅ **Mappare a gray/grey scale** se corrispondono
3. ❌ **Deprecare** se sono duplicati non usati

---

### 3. Area/Zone-Specific Tokens (❌ Non Mappati)

**Conteggio**: ~15 tokens

**Tokens Dev JSON**:
```
colors.AREAB_BACKGROUND_COLOR
colors.AREAB_ICON_COLOR
colors.AREAC_BACKGROUND_COLOR
colors.AREAC_ICON_COLOR
```

**Clara**: ❌ Non ha equivalenti

**Contesto**: Probabilmente relativi a zone di parcheggio (Area B, Area C di Milano)

**Raccomandazione**:
- 🟡 Se specifici di **Mooney app** → ❌ **Non aggiungere** a Clara (rimangono app-specific)
- 🟡 Se necessari per **multi-brand** → ✅ **Aggiungere** sotto `semantic.colors.specific.zones.*`

---

### 4. ATAC Transit System Tokens (❌ Non Mappati)

**Conteggio**: ~12 tokens

**Tokens Dev JSON**:
```
colors.ATAC_ACTIVATION_NORMAL_BG_COLOR
colors.ATAC_ACTIVATION_NORMAL_BORDER_COLOR
colors.ATAC_ACTIVATION_DISABLED_BG_COLOR
colors.ATAC_ACTIVATION_DISABLED_BORDER_COLOR
colors.ATAC_ACTIVATION_SELECTED_BG_COLOR
colors.ATAC_ACTIVATION_SELECTED_BORDER_COLOR
```

**Clara**: ❌ Non ha equivalenti

**Contesto**: ATAC = sistema trasporti Roma, feature specifica Mooney app

**Raccomandazione**: ❌ **Non aggiungere** a Clara whitelabel (troppo domain-specific)

---

### 5. Metro Line Colors (⚠️ Mapping Inverso!)

**Situazione particolare**: Clara ha **PIÙ** metro lines del Dev JSON!

**Dev JSON ha**:
```
colors.MOBILITY_METRO_DARK
colors.MOBILITY_METRO_MEDIUM
colors.MOBILITY_METRO_LIGHT
(solo colori generici metro, no city-specific)
```

**Clara ha** (15 city-specific lines):
```
semantic.colors.specific.metro.{
  brescia1, catania1, genova1,
  milanoM1, milanoM2, milanoM3, milanoM4, milanoM5,
  napoli1, napoli6,
  romaMea, romaMeb, romaMec,
  torino1, torino2
}
```

**Domanda**: ❓ **Da dove vengono i 15 metro line colors di Clara?**

**Raccomandazione**:
1. 🔍 **Documentare source** (design specs? feature request?)
2. ✅ **Verificare accuracy** dei colori (corrispondono ai brand reali delle metro?)
3. 📝 **Aggiornare documentazione** con fonte

---

### 6. Illustrations Colors (⚠️ Mapping Inverso!)

**Dev JSON**: ❌ Non ha tokens "ILLUSTRATION"

**Clara ha**: ✅ 31 illustration colors (`semantic.colors.specific.illustrations.01-31`)

**Domanda**: ❓ **Da dove vengono i 31 illustration colors?**

**Raccomandazione**:
1. 🔍 **Documentare source**
2. ✅ **Verificare se sono usati** nelle app
3. 📝 **Aggiungere a documentazione**

---

### 7. Transport Position Colors (⚠️ Mapping Inverso!)

**Dev JSON**: ❌ Non ha tokens "TRANSPORT_POSITION"

**Clara ha**:
```
semantic.colors.specific.meansOfTransportPosition.{
  bus10, bus30, harbor10, harbor30,
  pullman10, pullman30, train10, train30,
  tram10, tram30
}
```

**Domanda**: ❓ **Cosa rappresentano questi colori? (10 vs 30)**

**Raccomandazione**:
1. 🔍 **Documentare uso** (markers su mappa? icone?)
2. 📝 **Spiegare naming** (perché 10 e 30?)

---

### 8. Shadows (⚠️ Approccio Diverso)

**Conteggio Dev JSON**: 54 shadow tokens

**Esempio**:
```json
"shadows.line_up.shadowColor": "#BBBBBB",
"shadows.line_up.shadowOffset.width": 0,
"shadows.line_up.shadowOffset.height": -1,
"shadows.line_up.shadowOpacity": 1,
"shadows.line_up.shadowRadius": 0.5,
"shadows.line_up.elevation": 2
```

**Clara ha**: Solo 1 shadow token (`semantic.shadow.card`)

**Gap**: Clara ha approccio minimalista, Dev JSON ha 54 shadow variants

**Raccomandazione**:
- 🟡 **Valutare se espandere** shadow system in Clara
- 🟡 **Considerare platform-specific** (iOS vs Android shadows diversi)
- ❌ **Mantenere minimale** per ora (solo card shadow)

---

### 9. Mixins (❌ Non Mappati)

**Conteggio**: 90 tokens

**Esempio**:
```
mixins.textStyle.heading.large.fontFamily
mixins.textStyle.heading.large.fontSize
mixins.textStyle.heading.large.fontWeight
mixins.textStyle.heading.large.lineHeight
mixins.textStyle.body.regular.fontFamily
...
```

**Clara ha**: Typography atomics + semantic typography roles

**Gap**: Clara non ha "mixins" ma usa composite semantic tokens

**Raccomandazione**:
- ✅ **Usare `semantic.typography.*`** invece di mixins
- 🟡 **Valutare se W3C composite typography** è supportato da Luckino
- 📝 **Documentare migration** da mixins a semantic typography

---

### 10. Fonts (⚠️ Parzialmente Mappati)

**Dev JSON ha**: 7 font tokens
```
fonts.Gotham.fontFamily: "Gotham"
fonts.Gotham.fontWeight: "400"
fonts.GothamBold.fontFamily: "Gotham"
fonts.GothamBold.fontWeight: "700"
fonts.GothamMedium.fontFamily: "Gotham"
fonts.GothamMedium.fontWeight: "500"
fonts.GeneralSans.fontFamily: "General Sans"
```

**Clara ha**:
```
global.typography.fontFamily.{manrope, mono, gotham, generalSans}
global.typography.fontWeight.{normal, medium, semibold, bold}
```

**Gap**: Dev JSON ha font variants separati (Gotham, GothamBold), Clara usa family + weight

**Raccomandazione**: ✅ **Approccio Clara è migliore** (separazione family/weight), nessuna modifica necessaria

---

## Riepilogo Azioni

### Priorità Alta (Immediate)

1. ✅ **Documentare source** di tokens Clara senza mapping Dev JSON:
   - [ ] 15 metro line colors
   - [ ] 31 illustration colors
   - [ ] 50+ map colors
   - [ ] 10 transport position colors

2. 🔍 **Investigare tokens Dev JSON sconosciuti**:
   - [ ] MOONEYGO_EXTRA_COLOR_* (valore e uso)
   - [ ] MOONEYGO_GREY1-17 (mappare a gray/grey/greyscale?)
   - [ ] MOONEYGO_BLUE*, MOONEYGO_ORANGE2 (uso effettivo?)
   - [ ] Typo: MOONEYGP_MAP_BOTTOM_SHEET_80

3. ✅ **Verificare duplicati**:
   - [ ] MOONEYGO_DANGER vs FEEDBACK_ERROR
   - [ ] MOONEYGO_GREEN vs FEEDBACK_SUCCESS

### Priorità Media (Next Sprint)

4. 🟡 **Valutare espansione component tokens**:
   - [ ] Espandere `components.button` (size, states)
   - [ ] Espandere `components.input` (error, disabled states)
   - [ ] Aggiungere form components? (checkbox, radio, switch)
   - [ ] Aggiungere feedback components? (toast, banner, modal)

5. 🟡 **Valutare domain-specific tokens**:
   - [ ] AREA*/ATAC* → necessari per multi-brand?
   - [ ] UIPin → generalizzare per maps?

### Priorità Bassa (Future)

6. ❌ **Non aggiungere** (confermati come app-specific):
   - [ ] Screen-specific components (ScreenMyTickets, etc.)
   - [ ] Navigation components (UITabBar, UIHeader)
   - [ ] ATAC-specific tokens
   - [ ] Area B/C specific tokens (se solo Milano)

7. 📝 **Documentazione**:
   - [ ] Creare migration guide da Dev JSON a Clara
   - [ ] Script di conversione automatica
   - [ ] Token usage analyzer (trova tokens non usati)

---

## Tokens Confermati Non Necessari

Questi tokens **NON** vanno aggiunti a Clara Whitelabel:

### Screen-Specific Tokens
```
ScreenDiscovery.*
ScreenMyTickets.*
ScreenProfile.*
... (tutti screen-specific)
```

**Motivo**: Troppo app-specific, nessun riuso cross-brand

### Navigation Components
```
UITabBar.*
UIHeader.*
UINavigationBar.*
```

**Motivo**: Pattern di navigazione varia per app, non whitelabel-friendly

### Domain-Specific Features
```
ATAC_ACTIVATION_*
AREAB_*
AREAC_*
```

**Motivo**: Feature specifiche Mooney app (trasporti Roma, zone Milano)

---

## Metriche Finali

| Categoria | Dev JSON | Clara | Gap | Azione |
|-----------|----------|-------|-----|--------|
| **Brand Colors** | 12 | 12 | 0 | ✅ Completo |
| **Greyscale** | 5 | 5 | 0 | ✅ Completo (NUOVO) |
| **Feedback** | 8 | 8 | 0 | ✅ Completo |
| **Mobility** | 66 | 66 | 0 | ✅ Completo |
| **Metro** | 3 | 15 | -12 | ⚠️ Clara ha di più! |
| **Maps** | 3 | 50+ | -47 | ⚠️ Clara ha di più! |
| **Illustrations** | 0 | 31 | -31 | ⚠️ Clara ha di più! |
| **Spacing** | 13 | 13 | 0 | ✅ Completo |
| **Radius** | 13 | 14 | -1 | ✅ Completo (7xl aggiunto) |
| **Opacity** | ~10 | 11 | 0 | ✅ Completo (NUOVO) |
| **Typography** | 7 | 20+ | OK | ✅ Approccio diverso (atomics) |
| **Components** | 1800+ | 4 types | 1796 | ⚠️ Gap maggiore |
| **Shadows** | 54 | 1 | 53 | 🟡 Valutare espansione |
| **Utility Colors** | 30+ | ~10 | 20+ | 🔍 Investigare necessità |
| **Domain-Specific** | 20+ | 0 | 20+ | ❌ Intenzionale (app-specific) |

---

## Conclusioni

### Copertura Attuale
- ✅ **Ottima** per: Colors, Spacing, Radius, Brand Identity
- 🟡 **Parziale** per: Components, Shadows
- ❌ **Mancante** per: Domain-specific features (intenzionale)

### Gap Critici da Risolvere
1. Documentare source dei tokens "extra" di Clara (metro, maps, illustrations)
2. Decidere strategia component tokens (minimale vs completo)
3. Investigare utility colors (EXTRA_COLOR, GREY variants, BLUE variants)

### Filosofia Clara Whitelabel
Il sistema Clara è **volutamente minimale** e **brand-agnostic**. Non tutti i tokens Dev JSON devono essere mappati - molti sono app-specific e dovrebbero rimanere fuori dal whitelabel core.

**Trade-off**:
- ✅ **Pro minimale**: Più facile da mantenere, focus su multi-brand essentials
- ❌ **Contro**: Apps devono estendere con tokens custom

**Raccomandazione Finale**: Mantenere Clara minimale, documentare bene come estendere per app-specific needs.

---

**Versione**: 1.0.0
**Ultimo Aggiornamento**: 2025-01-15
**Prossimo Review**: Dopo validazione Gemini CLI
