# Theme Builder - Analisi Funzionale Completa

> **Documento:** Analisi dettagliata delle funzionalità della tab Theme Builder
>
> **Data:** 2025-11-14
> **File:** ui.html (righe 4975-5033 + logica JS)

---

## 📋 Sommario Esecutivo

Il **Theme Builder** è una tab del plugin Clara che permette di:
1. **Visualizzare** temi esistenti estratti dai token semantici
2. **Creare** nuovi temi tramite wizard guidato
3. **Eliminare** temi esistenti (tranne 'clara')
4. **Modificare** i riferimenti ai colori nei token semantici

**Stato Attuale:** ✅ Funzionale - Non è un placeholder vuoto, ma ha logica complessa implementata

---

## 🎯 Struttura UI

### Layout (ui.html:4975-5033)

```
┌──────────────────────────────────────────────────────────┐
│ THEME BUILDER TAB                                        │
├──────────────────┬───────────────────────────────────────┤
│                  │                                       │
│  SIDEBAR         │  EDITOR AREA                          │
│  (320px)         │  (flex: 1)                            │
│                  │                                       │
│  ┌────────────┐  │  ┌─────────────────────────────────┐  │
│  │ Themes (3) │  │  │ #theme-editor-empty             │  │
│  └────────────┘  │  │ (default stato)                 │  │
│                  │  │                                 │  │
│  ┌────────────┐  │  │  [Icona smile]                  │  │
│  │ ● ● ● clara│  │  │  "Select a theme to view        │  │
│  └────────────┘  │  │   details"                      │  │
│  ┌────────────┐  │  └─────────────────────────────────┘  │
│  │ ● ● ● theme│  │                                       │
│  └────────────┘  │  ┌─────────────────────────────────┐  │
│                  │  │ #theme-editor-content           │  │
│  + add new theme │  │ (visualizzato quando tema       │  │
│                  │  │  è selezionato)                 │  │
│                  │  │                                 │  │
│                  │  │ - Theme Details                 │  │
│                  │  │ - Color Preview Cards           │  │
│                  │  │ - UI Component Previews         │  │
│                  │  └─────────────────────────────────┘  │
└──────────────────┴───────────────────────────────────────┘
```

---

## 🗂️ Componenti UI Dettagliati

### 1. Sidebar - Lista Temi

**HTML:** ui.html:4981-5007

```html
<div class="theme-sidebar">
  <div class="section">
    <div class="section-title">
      <svg><!-- Icona palette --></svg>
      Themes (<span id="theme-count">0</span>)
    </div>

    <div id="theme-list" class="theme-list">
      <!-- Renderizzato dinamicamente da renderThemeList() -->
    </div>

    <button id="add-theme-btn">
      <svg><!-- Icona + --></svg>
      <span>add new theme</span>
    </button>
  </div>
</div>
```

**Rendering Dinamico:** [ui.html:5332-5384](#)

```javascript
function renderThemeList() {
  const container = document.getElementById('theme-list');
  if (!container) return;

  // Estrai temi dai token semantici
  themeBuilderState.themes = extractThemesFromTokens();
  container.innerHTML = '';

  themeBuilderState.themes.forEach(theme => {
    // Recupera i riferimenti ai colori dal token tree
    const coreRef = tokenTreeData.semantic.brand.core.main.$value[theme.id];
    const accentRef = tokenTreeData.semantic.brand.accent.main.$value[theme.id];
    const altRef = tokenTreeData.semantic.brand.alt.main.$value[theme.id];

    // Risolvi i riferimenti ai valori hex
    const coreHex = resolveColorRefToHex(coreRef);    // es: "#1068f6"
    const accentHex = resolveColorRefToHex(accentRef);
    const altHex = resolveColorRefToHex(altRef);

    // Crea elemento lista
    const item = document.createElement('div');
    item.className = `theme-list-item${theme.id === themeBuilderState.activeTheme ? ' active' : ''}`;

    item.innerHTML = `
      <!-- 3 pallini colorati sovrapposti -->
      <div class="theme-color-swatches">
        <div class="theme-color-swatch">
          <div class="theme-color-dot" style="background: ${coreHex}" title="Core: ${coreRef}"></div>
        </div>
        <div class="theme-color-swatch">
          <div class="theme-color-dot" style="background: ${accentHex}" title="Accent: ${accentRef}"></div>
        </div>
        <div class="theme-color-swatch">
          <div class="theme-color-dot" style="background: ${altHex}" title="Alt: ${altRef}"></div>
        </div>
      </div>

      <!-- Nome tema + badge DRAFT se nuovo -->
      <div class="theme-color-label">
        ${theme.label}.json
        ${themeImportStatus[theme.id] === 'draft' ? '<span class="theme-draft-badge">DRAFT</span>' : ''}
      </div>

      <!-- Bottone delete (visibile solo al hover, non per 'clara') -->
      ${theme.id !== 'clara' ? `
        <button class="icon-only secondary theme-delete-btn" onclick="deleteTheme('${theme.id}')">
          <svg><!-- Trash icon --></svg>
        </button>
      ` : ''}
    `;

    // Click listener per selezionare il tema
    item.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        selectTheme(theme.id);
      }
    });

    container.appendChild(item);
  });

  // Aggiorna contatore
  document.getElementById('theme-count').textContent = themeBuilderState.themes.length;
}
```

**Aspetto Visivo:**

```
┌──────────────────────────────┐
│ 🎨 Themes (3)                │
├──────────────────────────────┤
│ ● ● ● clara.json             │ ← Tema attivo (sfondo grigio)
│ ● ● ● adidas.json [DRAFT]    │ ← Tema draft (badge giallo)
│ ● ● ● nike.json       [🗑️]  │ ← Delete al hover
│                              │
│ + add new theme              │
└──────────────────────────────┘
```

### 2. Editor Area - Dettagli Tema

**Stato Vuoto:** ui.html:5019-5027

```html
<div id="theme-editor-empty" class="theme-editor-empty">
  <svg width="64" height="64"><!-- Smile icon --></svg>
  <p>Select a theme to view details</p>
</div>
```

**Stato Popolato:** ui.html:5011-5017

```html
<div id="theme-editor-content" style="display: none;">
  <div class="section">
    <div class="section-title">Theme Details</div>
    <div id="theme-details-container">
      <!-- Renderizzato da renderThemeEditor() -->
    </div>
  </div>
</div>
```

---

## 🔄 Logica di Funzionamento

### 1. Estrazione Temi dai Token

**Funzione:** `extractThemesFromTokens()` [ui.html:5313-5330](#)

```javascript
function extractThemesFromTokens() {
  if (!tokenTreeData || !tokenTreeData.semantic) return [];

  // I temi sono memorizzati come chiavi nell'oggetto $value
  const brandCore = tokenTreeData.semantic.brand?.core?.main?.$value;
  if (!brandCore || typeof brandCore !== 'object') return [];

  // Ogni chiave = un tema
  return Object.keys(brandCore).map(id => {
    // Inizializza stato import se non esiste
    if (themeImportStatus[id] === undefined) {
      themeImportStatus[id] = 'imported';
    }

    return {
      id,                                          // "clara"
      label: id.charAt(0).toUpperCase() + id.slice(1)  // "Clara"
    };
  });
}
```

**Esempio Struttura Token:**

```json
{
  "semantic": {
    "brand": {
      "core": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.70}",     ← Tema 1
            "adidas": "{colors.coral.60}",    ← Tema 2
            "nike": "{colors.mint.70}"        ← Tema 3
          }
        },
        "soft": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.30}",
            "adidas": "{colors.coral.30}",
            "nike": "{colors.mint.30}"
          }
        }
      },
      "accent": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.coral.50}",
            "adidas": "{colors.ocean.50}",
            "nike": "{colors.gray.700}"
          }
        }
      },
      "alt": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.gray.700}",
            "adidas": "{colors.mint.70}",
            "nike": "{colors.coral.50}"
          }
        }
      }
    }
  }
}
```

**Logica:**
- ✅ **Non** cerca temi in file esterni
- ✅ Estrae temi dalla struttura `semantic.brand.*.*..$value`
- ✅ Ogni chiave in `$value` rappresenta un tema
- ✅ I temi sono **condivisi** tra tutti i token semantici (core, accent, alt, radius, fontfamily)

---

### 2. Selezione Tema

**Funzione:** `selectTheme(themeId)` [ui.html:5386-5390](#)

```javascript
function selectTheme(themeId) {
  themeBuilderState.activeTheme = themeId;
  renderThemeList();      // Re-render lista per evidenziare tema attivo
  renderThemeEditor(themeId);  // Mostra dettagli tema nell'editor
}
```

---

### 3. Rendering Editor Tema

**Funzione:** `renderThemeEditor(themeId)` [ui.html:5392-5506](#)

```javascript
function renderThemeEditor(themeId) {
  const empty = document.getElementById('theme-editor-empty');
  const content = document.getElementById('theme-editor-content');
  const container = document.getElementById('theme-details-container');

  // Se nessun tema selezionato, mostra placeholder vuoto
  if (!themeId) {
    empty.style.display = 'flex';
    content.style.display = 'none';
    return;
  }

  // Mostra editor
  empty.style.display = 'none';
  content.style.display = 'block';

  const theme = themeBuilderState.themes.find(t => t.id === themeId);
  if (!theme) return;

  // Recupera token semantici
  const semantic = tokenTreeData?.semantic;
  if (!semantic) {
    container.innerHTML = '<p>No semantic tokens available</p>';
    return;
  }

  // Estrai riferimenti ai token per questo tema
  const coreMainRef = semantic.brand?.core?.main?.$value?.[themeId];     // "{colors.ocean.70}"
  const coreSoftRef = semantic.brand?.core?.soft?.$value?.[themeId];     // "{colors.ocean.30}"
  const accentMainRef = semantic.brand?.accent?.main?.$value?.[themeId]; // "{colors.coral.50}"
  const altMainRef = semantic.brand?.alt?.main?.$value?.[themeId];       // "{colors.gray.700}"
  const fontFamilyRef = semantic.brand?.fontfamily?.main?.$value?.[themeId]; // "{typography.fontfamily.inter}"
  const radiusRef = semantic.radius?.brand?.$value?.[themeId];           // "{radius.md}"

  // Risolvi riferimenti a valori effettivi
  const coreMain = resolveColorRefToHex(coreMainRef);    // "#1068f6"
  const coreSoft = resolveColorRefToHex(coreSoftRef);    // "#e3f2fd"
  const accentMain = resolveColorRefToHex(accentMainRef);
  const altMain = resolveColorRefToHex(altMainRef);
  const fontFamily = resolveFontFamilyRef(fontFamilyRef); // "Inter"
  const radius = resolveRadiusRef(radiusRef);            // "8px"

  // Genera HTML con preview del tema
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 32px;">
      <!-- Intestazione tema -->
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h2 style="margin: 0; font-size: 24px; font-family: '${fontFamily}';">
          ${theme.label}
        </h2>
        <div style="display: flex; gap: 8px;">
          <!-- Pallini colore grandi -->
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${coreMain}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${accentMain}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${altMain}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>
        </div>
      </div>

      <!-- Sezione Token References -->
      <div>
        <h3>Token References</h3>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
          <div style="color: #666;">Core:</div>
          <div>${coreMainRef}</div>

          <div style="color: #666;">Accent:</div>
          <div>${accentMainRef}</div>

          <div style="color: #666;">Alt:</div>
          <div>${altMainRef}</div>

          <div style="color: #666;">Font:</div>
          <div>${fontFamilyRef}</div>

          <div style="color: #666;">Radius:</div>
          <div>${radiusRef}</div>
        </div>
      </div>

      <!-- Sezione Component Previews -->
      <div>
        <h3>UI Components Preview</h3>
        <div style="display: flex; flex-direction: column; gap: 24px;">

          <!-- Card Preview -->
          <div style="display: flex; align-items: center; gap: 24px;">
            <div style="
              background: ${coreSoft};
              border: 1px solid ${altMain};
              border-radius: ${radius};
              height: 90px;
              width: 343px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16px;
            ">
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${accentMain};
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <!-- Icon SVG -->
                </svg>
              </div>
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #999;">
              brand.core.soft<br/>
              brand.alt.main<br/>
              brand.radius
            </div>
          </div>

          <!-- Metro Card Preview -->
          <div style="display: flex; align-items: center; gap: 24px;">
            <div style="
              background: ${coreSoft};
              border: 1px solid ${altMain};
              border-radius: ${radius};
              height: 90px;
              width: 343px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 2px;
              padding: 16px;
            ">
              <svg width="24" height="24" fill="${accentMain}">
                <!-- Metro Icon -->
              </svg>
              <p style="font-size: 12px; color: #1E1E1E; margin: 0;">
                Metro Linea AB
              </p>
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #999;">
              brand.core.soft<br/>
              brand.radius<br/>
              brand.accent.main
            </div>
          </div>

          <!-- Button Preview -->
          <div style="display: flex; align-items: center; gap: 24px;">
            <button style="
              background: ${coreMain};
              border: none;
              border-radius: ${radius};
              height: 40px;
              width: 343px;
              font-family: -apple-system, sans-serif;
              font-size: 14px;
              font-weight: 600;
              color: white;
              cursor: pointer;
            ">
              Accedi
            </button>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #999;">
              brand.core<br/>
              brand.radius
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}
```

**Cosa Visualizza:**
1. ✅ Nome tema + pallini colore
2. ✅ Token references (percorsi completi tipo `{colors.ocean.70}`)
3. ✅ Preview componenti UI:
   - Card con icona
   - Metro card
   - Button
4. ✅ Annotazioni con i token usati per ogni componente

---

### 4. Creazione Nuovo Tema

**Flusso Completo:**

```
User Click "add new theme"
    ↓
addNewTheme()
    ↓
createModal("New Theme", "Enter name", "adidas")
    ↓
[User inserisce nome: "nike"]
    ↓
Validazione nome:
  - Non duplicato
  - Solo lettere, numeri, -, _
    ↓
openThemeColorPicker("nike")
    ↓
┌─────────────────────────────────────┐
│ STEP 1: Select Colors               │
│ (selectAllColorsStep)               │
│                                     │
│ Core:   [input + autocomplete]     │
│ Accent: [input + autocomplete]     │
│ Alt:    [input + autocomplete]     │
│                                     │
│ [Cancel] [Next]                     │
└─────────────────────────────────────┘
    ↓
User seleziona:
  - Core:   {colors.mint.70}
  - Accent: {colors.coral.50}
  - Alt:    {colors.gray.700}
    ↓
┌─────────────────────────────────────┐
│ STEP 2: Brand Settings              │
│ (selectBrandSettingsStep)           │
│                                     │
│ Font Family: [select dropdown]     │
│ Radius:      [select dropdown]     │
│                                     │
│ [Back] [Create Theme]               │
└─────────────────────────────────────┘
    ↓
User seleziona:
  - Font: {typography.fontfamily.inter}
  - Radius: {radius.md}
    ↓
mapColorVariants()
    ↓
Per ogni colore (core, accent, alt):
  1. Parse color ref: {colors.mint.70}
  2. Trova famiglia in global: colors.mint
  3. Trova livelli disponibili: [10, 20, 30, 40, 50, 60, 70, 80, 90]
  4. Calcola varianti usando VARIANT_PERCENTILES:
     main: 70 (user selected)
     soft: 30 (30% della scala)
     light: 20 (20% della scala)
     faded: 40 (40% della scala)
     dark: 90 (90% della scala)
    ↓
addThemeToSemanticTokens("nike", mappedColors, brandSettings)
    ↓
Aggiorna token tree:
  semantic.brand.core.main.$value.nike = {colors.mint.70}
  semantic.brand.core.soft.$value.nike = {colors.mint.30}
  semantic.brand.core.light.$value.nike = {colors.mint.20}
  semantic.brand.core.faded.$value.nike = {colors.mint.40}
  semantic.brand.core.dark.$value.nike = {colors.mint.90}

  semantic.brand.accent.main.$value.nike = {colors.coral.50}
  semantic.brand.accent.soft.$value.nike = {colors.coral.30}
  ... (e così via)

  semantic.brand.alt.main.$value.nike = {colors.gray.700}
  ... (e così via)

  semantic.brand.fontfamily.main.$value.nike = {typography.fontfamily.inter}
  semantic.radius.brand.$value.nike = {radius.md}
    ↓
Copia tutti gli altri token semantici da 'clara':
  copySemanticTokensFromCLARA("nike")
    ↓
Attraversa ricorsivamente semantic e per ogni $value object:
  se esiste $value.clara, crea $value.nike = $value.clara
    ↓
Marca tema come DRAFT:
  themeImportStatus["nike"] = "draft"
    ↓
Aggiorna UI:
  hasUnsavedChanges = true
  updateImportButtonState()
  renderTokenTree()
  renderThemeList()
  selectTheme("nike")
    ↓
Mostra snackbar: "Theme 'nike' created"
```

---

### 4.1. Funzione `addNewTheme()`

[ui.html:5550-5571](#)

```javascript
async function addNewTheme() {
  // Step 1: Chiedi nome tema
  const themeName = await createModal(
    'New Theme',
    'Enter a name for the new theme:',
    'adidas'  // placeholder
  );

  if (!themeName) return;

  // Step 2: Validazione
  const existing = themeBuilderState.themes.find(t => t.id === themeName.toLowerCase());
  if (existing) {
    showSnackbar('Theme name already exists', 'error');
    return;
  }

  if (!/^[a-z0-9\-_]+$/i.test(themeName)) {
    showSnackbar('Use only letters, numbers, hyphens, and underscores', 'error');
    return;
  }

  // Step 3: Apri wizard selezione colori
  await openThemeColorPicker(themeName);
}
```

---

### 4.2. Funzione `openThemeColorPicker()`

[ui.html:5874-5903](#)

```javascript
async function openThemeColorPicker(themeName) {
  // STEP 1: Selezione 3 colori (core, accent, alt)
  const colorSelections = await selectAllColorsStep(themeName);
  if (!colorSelections) {
    showSnackbar('Theme creation cancelled', 'info');
    return;
  }
  // colorSelections = {
  //   core: "{colors.mint.70}",
  //   accent: "{colors.coral.50}",
  //   alt: "{colors.gray.700}"
  // }

  // STEP 2: Selezione font e radius
  const brandSettings = await selectBrandSettingsStep(themeName);
  if (!brandSettings) {
    showSnackbar('Theme creation cancelled', 'info');
    return;
  }
  // brandSettings = {
  //   fontFamily: "{typography.fontfamily.inter}",
  //   radius: "{radius.md}"
  // }

  // STEP 3: Mappa colori a varianti (main, soft, light, faded, dark)
  const selectedColors = {};
  for (const [group, colorRef] of Object.entries(colorSelections)) {
    const mapped = mapColorVariants(colorRef, group);
    console.log(`[Theme Builder] Mapped ${group}:`, colorRef, '->', mapped);
    selectedColors[group] = mapped || getClaraFallback(group);
  }
  // selectedColors = {
  //   core: { family: "mint", variants: { main: 70, soft: 30, light: 20, faded: 40, dark: 90 } },
  //   accent: { family: "coral", variants: { main: 50, soft: 30, light: 20, dark: 80 } },
  //   alt: { family: "gray", variants: { main: 700, soft: 300, light: 200, dark: 900 } }
  // }

  console.log('[Theme Builder] All colors selected:', selectedColors);
  console.log('[Theme Builder] Brand settings:', brandSettings);

  // STEP 4: Aggiungi tema ai token semantici
  addThemeToSemanticTokens(themeName, selectedColors, brandSettings);

  showSnackbar(`Theme "${themeName}" created`, 'success');
}
```

---

### 4.3. Funzione `mapColorVariants()`

[ui.html:5251-5305](#)

```javascript
const VARIANT_PERCENTILES = {
  core: { soft: 30, light: 20, faded: 40, dark: 90 },
  accent: { soft: 30, light: 20, dark: 80 },
  alt: { soft: 30, light: 20, dark: 90 }
};

const CLARA_FALLBACK = {
  core: { main: 70, soft: 30, light: 20, faded: 40, dark: 90 },
  accent: { main: 50, soft: 30, light: 20, dark: 80 },
  alt: { main: 700, soft: 300, light: 200, dark: 900 }
};

function mapColorVariants(colorRef, groupType) {
  // Parse: "{colors.mint.70}" -> { family: "mint", level: 70 }
  const parsed = parseColorReference(colorRef);
  if (!parsed) return null;

  // Trova famiglia in global.colors
  const family = tokenTreeData?.global?.colors?.[parsed.family];
  if (!family) return null;

  // Trova tutti i livelli disponibili nella famiglia (es: [10, 20, 30, ..., 90])
  const levels = Object.keys(family)
    .map(k => parseInt(k, 10))
    .filter(n => !isNaN(n) && family[n].$type === 'color')
    .sort((a, b) => a - b);

  if (levels.length === 0) return null;

  // Calcola indici per ogni variante
  const targets = VARIANT_PERCENTILES[groupType];
  if (!targets) return null;

  const results = { main: parsed.level };
  const maxIndex = levels.length - 1;

  for (const [variant, targetPercent] of Object.entries(targets)) {
    // Calcola indice target basato su percentuale
    const targetIndex = Math.round((targetPercent / 100) * maxIndex);
    const clampedIndex = Math.max(0, Math.min(targetIndex, maxIndex));
    results[variant] = levels[clampedIndex];
  }

  return { family: parsed.family, variants: results };
}

// Esempio:
// Input: "{colors.mint.70}", "core"
// Output: {
//   family: "mint",
//   variants: {
//     main: 70,   // user selected
//     soft: 30,   // 30% della scala (indice 2 su [10,20,30,40,50,60,70,80,90])
//     light: 20,  // 20%
//     faded: 40,  // 40%
//     dark: 90    // 90%
//   }
// }
```

---

### 4.4. Funzione `addThemeToSemanticTokens()`

[ui.html:6030-6154](#)

```javascript
function addThemeToSemanticTokens(themeName, colorGroups, brandSettings = null) {
  try {
    const semantic = tokenTreeData.semantic;

    if (!semantic || !semantic.brand) {
      throw new Error('Invalid token structure: semantic.brand not found');
    }

    console.log('[Theme Builder] Creating theme:', themeName, 'with colors:', colorGroups);
    if (brandSettings) {
      console.log('[Theme Builder] Brand settings:', brandSettings);
    }

    // ===== CORE COLORS =====
    ['main', 'soft', 'light', 'faded', 'dark'].forEach(variant => {
      // Crea nodo se non esiste
      if (!semantic.brand.core[variant]) {
        semantic.brand.core[variant] = { $type: 'color', $value: {} };
      }

      const path = semantic.brand.core[variant];
      if (!path.$value) path.$value = {};

      // Prendi livello dalla mappatura
      const family = colorGroups.core.family;
      const level = colorGroups.core.variants[variant] || colorGroups.core.variants.main;

      if (level !== undefined) {
        path.$value[themeName] = buildColorRef(family, level);
        console.log(`[Theme Builder] Set core.${variant}[${themeName}] = ${buildColorRef(family, level)}`);
      }
    });

    // ===== ACCENT COLORS =====
    ['main', 'soft', 'light', 'dark'].forEach(variant => {
      if (!semantic.brand.accent[variant]) {
        semantic.brand.accent[variant] = { $type: 'color', $value: {} };
      }

      const path = semantic.brand.accent[variant];
      if (!path.$value) path.$value = {};

      const family = colorGroups.accent.family;
      const level = colorGroups.accent.variants[variant] || colorGroups.accent.variants.main;

      if (level !== undefined) {
        path.$value[themeName] = buildColorRef(family, level);
        console.log(`[Theme Builder] Set accent.${variant}[${themeName}] = ${buildColorRef(family, level)}`);
      }
    });

    // ===== ALT COLORS =====
    ['main', 'soft', 'light', 'dark'].forEach(variant => {
      if (!semantic.brand.alt[variant]) {
        semantic.brand.alt[variant] = { $type: 'color', $value: {} };
      }

      const path = semantic.brand.alt[variant];
      if (!path.$value) path.$value = {};

      const family = colorGroups.alt.family;
      const level = colorGroups.alt.variants[variant] || colorGroups.alt.variants.main;

      if (level !== undefined) {
        path.$value[themeName] = buildColorRef(family, level);
        console.log(`[Theme Builder] Set alt.${variant}[${themeName}] = ${buildColorRef(family, level)}`);
      }
    });

    // ===== FONT FAMILY =====
    if (brandSettings?.fontFamily) {
      if (!semantic.brand.fontfamily) {
        semantic.brand.fontfamily = {};
      }
      if (!semantic.brand.fontfamily.main) {
        semantic.brand.fontfamily.main = { $type: 'fontFamily', $value: {} };
      }
      semantic.brand.fontfamily.main.$value[themeName] = brandSettings.fontFamily;
      console.log(`[Theme Builder] Set fontfamily.main[${themeName}] = ${brandSettings.fontFamily}`);
    }

    // ===== RADIUS =====
    if (brandSettings?.radius) {
      if (!semantic.radius) {
        semantic.radius = {};
      }
      if (!semantic.radius.brand) {
        semantic.radius.brand = { $type: 'dimension', $value: {} };
      }
      semantic.radius.brand.$value[themeName] = brandSettings.radius;
      console.log(`[Theme Builder] Set radius.brand[${themeName}] = ${brandSettings.radius}`);
    }

    // ===== COPIA TUTTI GLI ALTRI TOKEN DA CLARA =====
    copySemanticTokensFromCLARA(themeName);

    // ===== MARCA COME DRAFT =====
    themeImportStatus[themeName] = 'draft';

    // ===== AGGIORNA UI =====
    hasUnsavedChanges = true;
    updateImportButtonState();
    renderTokenTree(tokenTreeData, activeTokenMode);
    renderThemeList();
    selectTheme(themeName);

    console.log('[Theme Builder] Theme created successfully:', themeName);
  } catch (error) {
    console.error('[Theme Builder] Error adding theme:', error);
    showSnackbar(`Failed to create theme: ${error.message}`, 'error');
    throw error;
  }
}

function buildColorRef(family, level) {
  return `{colors.${family}.${level}}`;
}
```

**Risultato nel Token Tree:**

```json
{
  "semantic": {
    "brand": {
      "core": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.70}",
            "nike": "{colors.mint.70}"  ← NUOVO
          }
        },
        "soft": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.30}",
            "nike": "{colors.mint.30}"  ← CALCOLATO
          }
        },
        "light": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.20}",
            "nike": "{colors.mint.20}"  ← CALCOLATO
          }
        },
        "faded": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.40}",
            "nike": "{colors.mint.40}"  ← CALCOLATO
          }
        },
        "dark": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.90}",
            "nike": "{colors.mint.90}"  ← CALCOLATO
          }
        }
      },
      "accent": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.coral.50}",
            "nike": "{colors.coral.50}"  ← NUOVO
          }
        }
        // ... soft, light, dark
      },
      "alt": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.gray.700}",
            "nike": "{colors.gray.700}"  ← NUOVO
          }
        }
        // ... soft, light, dark
      },
      "fontfamily": {
        "main": {
          "$type": "fontFamily",
          "$value": {
            "clara": "{typography.fontfamily.inter}",
            "nike": "{typography.fontfamily.inter}"  ← NUOVO
          }
        }
      }
    },
    "radius": {
      "brand": {
        "$type": "dimension",
        "$value": {
          "clara": "{radius.md}",
          "nike": "{radius.md}"  ← NUOVO
        }
      }
    }
  }
}
```

---

### 4.5. Funzione `copySemanticTokensFromCLARA()`

[ui.html:6156-6174](#)

```javascript
function copySemanticTokensFromCLARA(newThemeName) {
  const semantic = tokenTreeData.semantic;

  function traverseAndCopy(obj) {
    if (!obj || typeof obj !== 'object') return;

    // Se questo nodo ha $value con il tema 'clara', duplicalo per il nuovo tema
    if (obj.$value && typeof obj.$value === 'object' && obj.$value.clara) {
      obj.$value[newThemeName] = obj.$value.clara;
    }

    // Ricorsione su tutti i figli
    for (const key in obj) {
      if (!key.startsWith('$')) {
        traverseAndCopy(obj[key]);
      }
    }
  }

  traverseAndCopy(semantic);
}
```

**Cosa fa:**
- ✅ Attraversa **ricorsivamente** tutto l'albero `semantic`
- ✅ Per ogni nodo con `$value.clara`, crea `$value[newTheme]` con lo stesso valore
- ✅ Copia **tutti** i token semantici (non solo quelli esplicitamente configurati)

**Esempio:**

```json
// PRIMA
{
  "semantic": {
    "text": {
      "primary": {
        "$type": "color",
        "$value": {
          "clara": "{colors.gray.900}"
        }
      }
    }
  }
}

// DOPO copySemanticTokensFromCLARA("nike")
{
  "semantic": {
    "text": {
      "primary": {
        "$type": "color",
        "$value": {
          "clara": "{colors.gray.900}",
          "nike": "{colors.gray.900}"  ← COPIATO
        }
      }
    }
  }
}
```

---

### 5. Eliminazione Tema

**Funzione:** `deleteTheme(themeId)` [ui.html:5508-5548](#)

```javascript
async function deleteTheme(themeId) {
  // Protezione: non puoi eliminare 'clara'
  if (themeId === 'clara') {
    showSnackbar('Cannot delete CLARA theme', 'warning');
    return;
  }

  // Conferma con modal
  const confirmed = await createModal(
    'Delete Theme',
    `Are you sure you want to delete theme "${themeId}"? This action cannot be undone.`,
    null,
    'delete'  // tipo modal = delete (rosso)
  );

  if (!confirmed) return;

  const semantic = tokenTreeData.semantic;

  // Rimuovi tema ricorsivamente da tutti i token
  function removeThemeFromTokens(obj) {
    if (!obj || typeof obj !== 'object') return;

    // Se questo nodo ha $value object, rimuovi la chiave del tema
    if (obj.$value && typeof obj.$value === 'object') {
      delete obj.$value[themeId];
    }

    // Ricorsione
    for (const key in obj) {
      if (!key.startsWith('$')) {
        removeThemeFromTokens(obj[key]);
      }
    }
  }

  removeThemeFromTokens(semantic);

  // Aggiorna UI
  hasUnsavedChanges = true;
  updateImportButtonState();
  renderTokenTree(tokenTreeData, activeTokenMode);

  themeBuilderState.activeTheme = null;
  renderThemeList();
  renderThemeEditor(null);

  showSnackbar(`Theme "${themeId}" deleted`, 'success');
}
```

**Effetto:**

```json
// PRIMA
{
  "semantic": {
    "brand": {
      "core": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.70}",
            "nike": "{colors.mint.70}",
            "adidas": "{colors.coral.60}"
          }
        }
      }
    }
  }
}

// DOPO deleteTheme("nike")
{
  "semantic": {
    "brand": {
      "core": {
        "main": {
          "$type": "color",
          "$value": {
            "clara": "{colors.ocean.70}",
            "adidas": "{colors.coral.60}"
          }
        }
      }
    }
  }
}
```

---

## 🎨 Autocomplete System

### Color Autocomplete

Quando l'utente seleziona un colore nello step 1, appare un **autocomplete dropdown** con:

**Funzione:** `buildColorAutocompleteOptions()` [ui.html:6204-6298](#)

```javascript
function buildColorAutocompleteOptions() {
  // Cache per evitare ricalcoli
  if (autocompleteState.cachedOptions) {
    return autocompleteState.cachedOptions;
  }

  const options = [];
  const colors = tokenTreeData?.global?.colors;
  if (!colors) return options;

  // Costruisce struttura gerarchica:
  // {
  //   ocean: { 10: "#...", 20: "#...", 70: "#...", ... },
  //   coral: { 10: "#...", 50: "#...", ... },
  //   ...
  // }
  const hierarchical = {};

  for (const [familyName, family] of Object.entries(colors)) {
    if (typeof family !== 'object') continue;

    for (const [key, token] of Object.entries(family)) {
      if (token && token.$type === 'color' && token.$value) {
        const level = parseInt(key, 10);
        if (!isNaN(level)) {
          if (!hierarchical[familyName]) hierarchical[familyName] = {};
          hierarchical[familyName][level] = token.$value;
        }
      }
    }
  }

  autocompleteState.hierarchicalData = hierarchical;

  // Crea opzioni per dropdown
  for (const [familyName, levels] of Object.entries(hierarchical)) {
    const sortedLevels = Object.keys(levels)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b);

    // Aggiungi famiglia come header
    options.push({
      type: 'family',
      label: familyName,
      value: null,
      family: familyName
    });

    // Aggiungi tutti i livelli
    sortedLevels.forEach(level => {
      options.push({
        type: 'color',
        label: `${level}`,
        value: `{colors.${familyName}.${level}}`,
        family: familyName,
        level: level,
        hex: levels[level]
      });
    });
  }

  autocompleteState.cachedOptions = options;
  return options;
}
```

**Rendering Dropdown:**

```javascript
function showAutocomplete(input, options, onSelect) {
  // Crea dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';

  options.forEach((opt, index) => {
    const item = document.createElement('div');

    if (opt.type === 'family') {
      // Header famiglia (collapsible)
      item.className = 'autocomplete-family-header';
      item.innerHTML = `
        <svg><!-- Chevron icon --></svg>
        <span>${opt.label}</span>
      `;
      item.addEventListener('click', () => {
        toggleFamilyExpansion(opt.family);
      });
    } else {
      // Color item
      const isExpanded = autocompleteState.expandedFamilies.has(opt.family);
      item.className = 'autocomplete-item';
      item.style.display = isExpanded ? 'flex' : 'none';
      item.innerHTML = `
        <div class="autocomplete-color-swatch" style="background: ${opt.hex}"></div>
        <span class="autocomplete-label">${opt.label}</span>
        <span class="autocomplete-ref">{colors.${opt.family}.${opt.level}}</span>
      `;
      item.addEventListener('click', () => {
        onSelect(opt.value);
        hideAutocomplete();
      });
    }

    dropdown.appendChild(item);
  });

  document.body.appendChild(dropdown);
  positionDropdown(dropdown, input);
}
```

**Aspetto Visivo:**

```
┌──────────────────────────────────────┐
│ ▼ ocean                              │ ← Famiglia (cliccabile)
│   ⬛ 10  {colors.ocean.10}           │ ← Colore + livello + ref
│   ⬛ 20  {colors.ocean.20}           │
│   ⬛ 30  {colors.ocean.30}           │
│   ⬛ 70  {colors.ocean.70}           │ ← Hover = sfondo blu
│   ⬛ 90  {colors.ocean.90}           │
│                                      │
│ ▶ coral                              │ ← Famiglia collassata
│                                      │
│ ▼ mint                               │
│   ⬛ 10  {colors.mint.10}            │
│   ⬛ 20  {colors.mint.20}            │
│   ...                                │
└──────────────────────────────────────┘
```

---

## 📊 State Management

### Global State

```javascript
// Theme Builder State
const themeBuilderState = {
  themes: [],           // Array di { id, label }
  activeTheme: null     // ID tema selezionato (es: "clara")
};

// Import Status (DRAFT vs imported)
const themeImportStatus = {
  clara: 'imported',
  nike: 'draft',
  adidas: 'draft'
};

// Token Tree Data (shared con Import tab)
let tokenTreeData = {
  global: { colors: {...}, typography: {...}, radius: {...} },
  semantic: { brand: {...}, text: {...}, radius: {...} }
};

// Unsaved Changes Flag
let hasUnsavedChanges = false;

// Active Token Mode (multi-tema)
let activeTokenMode = 'clara';  // Quale tema è attivo per preview
```

---

## 🔄 Integrazione con Import Tab

### Sincronizzazione Token Tree

Quando l'utente clicca **"Import Variables"** (footer button):

```javascript
// 1. Converte tokenTreeData in JSON W3C
const jsonString = JSON.stringify(tokenTreeData, null, 2);

// 2. Invia al backend
sendMessage('import-json', { json: jsonString });

// 3. Backend crea Figma Variables
// Per OGNI tema in semantic.brand.core.main.$value:
//   - Crea collection "brand-{theme}"
//   - Crea variabili per ogni token semantico
//   - Resolve alias references

// 4. Marca tutti i temi come 'imported'
for (const themeId in themeImportStatus) {
  themeImportStatus[themeId] = 'imported';
}

// 5. Rimuovi badge DRAFT
renderThemeList();
```

### Multi-Theme Support

Il plugin supporta **mode switching** per visualizzare diversi temi:

```javascript
// Dropdown in Import tab
<select id="token-mode-select">
  <option value="clara">Clara</option>
  <option value="nike">Nike</option>
  <option value="adidas">Adidas</option>
</select>

// Quando cambi mode:
function switchTokenMode(modeName) {
  activeTokenMode = modeName;
  renderTokenTree(tokenTreeData, modeName);
  // Renderizza token tree mostrando solo i valori per quel tema
}
```

**Effetto:**

```json
// Token semantico:
{
  "brand": {
    "core": {
      "main": {
        "$type": "color",
        "$value": {
          "clara": "{colors.ocean.70}",
          "nike": "{colors.mint.70}"
        }
      }
    }
  }
}

// Se activeTokenMode = "clara":
// Token tree mostra: brand.core.main = {colors.ocean.70}

// Se activeTokenMode = "nike":
// Token tree mostra: brand.core.main = {colors.mint.70}
```

---

## ⚙️ Funzioni Utility

### 1. `resolveColorRefToHex(ref)`

```javascript
function resolveColorRefToHex(ref) {
  if (!ref || typeof ref !== 'string') return null;

  // Se già un hex, ritorna direttamente
  if (ref.startsWith('#')) return ref;

  // Parse reference: "{colors.ocean.70}"
  const match = ref.match(/^\{colors\.([a-z]+)\.(\d+)\}$/i);
  if (!match) return null;

  const [, family, level] = match;

  // Lookup in tokenTreeData
  const token = tokenTreeData?.global?.colors?.[family]?.[level];
  if (!token || !token.$value) return null;

  return token.$value;  // "#1068f6"
}
```

### 2. `resolveFontFamilyRef(ref)`

```javascript
function resolveFontFamilyRef(ref) {
  if (!ref || typeof ref !== 'string') return 'Inter';

  // Parse: "{typography.fontfamily.inter}"
  const match = ref.match(/^\{typography\.fontfamily\.([a-z]+)\}$/i);
  if (!match) return 'Inter';

  const [, name] = match;

  const token = tokenTreeData?.global?.typography?.fontfamily?.[name];
  if (!token || !token.$value) return 'Inter';

  return token.$value;  // "Inter, -apple-system, sans-serif"
}
```

### 3. `resolveRadiusRef(ref)`

```javascript
function resolveRadiusRef(ref) {
  if (!ref || typeof ref !== 'string') return '8px';

  // Parse: "{radius.md}"
  const match = ref.match(/^\{radius\.([a-z]+)\}$/i);
  if (!match) return '8px';

  const [, size] = match;

  const token = tokenTreeData?.global?.radius?.[size];
  if (!token || !token.$value) return '8px';

  return token.$value;  // "8px"
}
```

### 4. `parseColorReference(ref)`

```javascript
function parseColorReference(ref) {
  // "{colors.ocean.70}" -> { family: "ocean", level: 70 }
  const match = ref.match(/^\{colors\.([a-z]+)\.(\d+)\}$/i);
  if (!match) return null;

  return {
    family: match[1],
    level: parseInt(match[2], 10)
  };
}
```

---

## 🎯 Limitazioni e Bug Noti

### Limitazioni Funzionali

1. **Non puoi modificare temi esistenti**
   - ❌ Non esiste UI per cambiare i colori di un tema dopo la creazione
   - ⚠️ Workaround: Elimina e ricrea

2. **Non puoi duplicare temi**
   - ❌ Non c'è funzione "Duplicate theme"
   - ⚠️ Workaround: Crea manualmente con stessi colori

3. **Font e Radius solo da step wizard**
   - ❌ Non puoi modificare font/radius dopo creazione
   - ⚠️ Tutti i valori vengono copiati da CLARA

4. **Preview limitato**
   - ❌ Solo 3 componenti UI (Card, Metro, Button)
   - ❌ Non mostra tutti i token del tema

5. **No esportazione singolo tema**
   - ❌ Non puoi esportare solo 1 tema in JSON
   - ⚠️ Export include sempre tutti i temi

### Bug Potenziali

1. **Nessuna validazione color families**
   - ⚠️ Se selezioni `{colors.nonexistent.50}`, mapColorVariants() ritorna null
   - ⚠️ Fallback a CLARA_FALLBACK, ma potrebbe non essere desiderato

2. **Race condition su renderThemeList()**
   - ⚠️ Se chiami rapidamente addNewTheme() → deleteTheme(), UI potrebbe desync

3. **No undo/redo**
   - ❌ Se elimini un tema per errore, devi ricrearlo manualmente

4. **Memoria theme import status**
   - ⚠️ `themeImportStatus` è solo in memoria, si perde al refresh

---

## 📝 Riepilogo Funzioni Chiave

| Funzione | Riga | Scopo |
|----------|------|-------|
| `extractThemesFromTokens()` | 5313 | Estrae lista temi da `semantic.brand.core.main.$value` |
| `renderThemeList()` | 5332 | Renderizza sidebar con lista temi + pallini colore |
| `selectTheme(id)` | 5386 | Seleziona tema e mostra dettagli nell'editor |
| `renderThemeEditor(id)` | 5392 | Renderizza preview tema + token references |
| `addNewTheme()` | 5550 | Apre wizard creazione tema |
| `openThemeColorPicker(name)` | 5874 | Gestisce 2-step wizard (colori + settings) |
| `mapColorVariants(ref, group)` | 5251 | Calcola varianti colore (soft, light, dark) |
| `addThemeToSemanticTokens()` | 6030 | Aggiunge tema al token tree |
| `copySemanticTokensFromCLARA()` | 6156 | Copia tutti i token semantici da CLARA |
| `deleteTheme(id)` | 5508 | Elimina tema ricorsivamente |
| `buildColorAutocompleteOptions()` | 6204 | Costruisce dropdown autocomplete colori |
| `setupThemeBuilderEventListeners()` | 6183 | Inizializza event listeners |
| `initializeThemeBuilder()` | 6176 | Inizializza UI Theme Builder |

---

## 🚀 Flusso Completo Esempio

### Scenario: Utente crea tema "Nike"

```
1. User apre plugin
   ↓
2. Click tab "Themes"
   ↓
3. Plugin carica JSON tokens da Import tab
   tokenTreeData = {
     global: { colors: {...}, typography: {...}, radius: {...} },
     semantic: { brand: {...} }
   }
   ↓
4. extractThemesFromTokens() trova tema "clara" esistente
   ↓
5. renderThemeList() mostra:
   - Themes (1)
   - ● ● ● clara.json
   - + add new theme
   ↓
6. User click "+ add new theme"
   ↓
7. Modal: "Enter name" → user digita "nike"
   ↓
8. Validazione OK → openThemeColorPicker("nike")
   ↓
9. STEP 1: Select Colors
   - Core: user seleziona {colors.mint.70} (autocomplete)
   - Accent: user seleziona {colors.coral.50}
   - Alt: user seleziona {colors.gray.700}
   - Click "Next"
   ↓
10. STEP 2: Brand Settings
    - Font Family: user seleziona {typography.fontfamily.roboto}
    - Radius: user seleziona {radius.lg}
    - Click "Create Theme"
   ↓
11. mapColorVariants() calcola:
    core:   { family: "mint",  variants: { main:70, soft:30, light:20, faded:40, dark:90 } }
    accent: { family: "coral", variants: { main:50, soft:30, light:20, dark:80 } }
    alt:    { family: "gray",  variants: { main:700, soft:300, light:200, dark:900 } }
   ↓
12. addThemeToSemanticTokens("nike", colors, settings)
    Aggiunge a tokenTreeData:
    - semantic.brand.core.main.$value.nike = {colors.mint.70}
    - semantic.brand.core.soft.$value.nike = {colors.mint.30}
    - semantic.brand.accent.main.$value.nike = {colors.coral.50}
    - semantic.brand.alt.main.$value.nike = {colors.gray.700}
    - semantic.brand.fontfamily.main.$value.nike = {typography.fontfamily.roboto}
    - semantic.radius.brand.$value.nike = {radius.lg}
   ↓
13. copySemanticTokensFromCLARA("nike")
    Copia tutti gli altri token semantici (text, surface, etc.) da clara → nike
   ↓
14. themeImportStatus["nike"] = "draft"
   ↓
15. hasUnsavedChanges = true
   ↓
16. renderTokenTree() → Import tab mostra nuovo JSON con tema "nike"
   ↓
17. renderThemeList() → Theme Builder mostra:
    - Themes (2)
    - ● ● ● clara.json
    - ● ● ● nike.json [DRAFT]  ← NUOVO, evidenziato
   ↓
18. selectTheme("nike") → Editor mostra:
    - Nome: "Nike"
    - 3 pallini colore grandi
    - Token references
    - 3 UI component previews con i nuovi colori
   ↓
19. User può:
    - ✅ Modificare token manualmente in Import tab
    - ✅ Click "Import Variables" per creare Figma variables
    - ✅ Eliminare tema se non piace
    - ✅ Creare altri temi
```

---

## 🎓 Conclusioni

### Punti di Forza

✅ **UI ben progettata** - Sidebar + editor chiaro e pulito
✅ **Wizard guidato** - Creazione tema in 2 step intuitivi
✅ **Autocomplete potente** - Navigazione gerarchica colori
✅ **Preview in tempo reale** - Vedi componenti UI con nuovi colori
✅ **Mapping intelligente** - Calcolo automatico varianti colore
✅ **Multi-theme support** - Gestione multipli temi nello stesso file
✅ **Integrazione completa** - Sincronizzato con Import tab

### Aree di Miglioramento

🔴 **Modifica temi esistenti** - Aggiungi edit mode
🔴 **Duplicazione temi** - Funzione clone theme
🔴 **Export selettivo** - Esporta solo 1 tema
🔴 **Preview esteso** - Mostra più componenti UI
🔴 **Persistenza stato** - Salva DRAFT status in localStorage
🔴 **Undo/Redo** - History management per errori
🔴 **Validazione robusta** - Check color families esistono

---

**Fine Documento**

Versione: 1.0
Data: 2025-11-14
Autore: Claude Code