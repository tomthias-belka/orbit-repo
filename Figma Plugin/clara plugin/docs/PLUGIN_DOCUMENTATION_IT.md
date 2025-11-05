# Luckino Import Export — Documentazione (Italiano)

Questa documentazione è tecnica e pensata per sviluppatori che devono mantenere o estendere il plugin. Contiene architettura, concetti chiave (variabili dinamiche, scopes, tipi), flussi di import/export, esempi pratici, API e suggerimenti per estendere o correggere il comportamento.

## Sommario

- Panoramica
- Contratto rapido (input/output)
- Architettura e file principali
- Concetti chiave
  - Variabili Figma e variabili dinamiche
  - Alias e risoluzione (two-pass)
  - Scopes e mappatura tipi
- Import
  - Formato JSON supportato
  - Flusso: parsing → TokenProcessor → VariableManager
  - Esempi
- Export
  - Stato implementazione
  - Formati e generatori (CSS/SCSS/JSON)
- API e messaggi UI
- Setup dev, build, test rapido
- Come estendere / punti di integrazione
- Edge cases e suggerimenti per QA
- Checklist tecnica

---

## Panoramica

Luckino Import Export è un plugin Figma per importare ed esportare variabili/ design tokens in diversi formati. Lavora principalmente con le API di `figma.variables` e con un sistema interno di token/alias che permette:

- Importare JSON di design tokens convertendoli in `Variable Collections` e `Variables` in Figma.
- Esportare (parziale / in sviluppo) in formati come JSON/Tokens e CSS (variabili CSS).
- Risolvere alias fra variabili (es. una variabile che punta ad un'altra) con gestione dei riferimenti circolari e fallback.
- Mappare scopes e tipi semantici (es. `FONT_SIZE`, `CORNER_RADIUS`) per garantire che le variabili siano usabili nelle proprietà corrette di Figma.

Versione corrente: v1.0.0 (branch: experimental-changes) — alcune funzionalità di export avanzato sono ancora indicate come "in sviluppo" nel file `src/main.ts`.

---

## Contratto rapido

- Input principali
  - JSON (stringa o oggetto) che rappresenta raccolte di token / variabili.
  - Messaggi UI (via `figma.ui.postMessage`) del tipo `IMPORT_JSON`, `EXPORT_JSON_ADVANCED`, `EXPORT_CSS`, ecc.

- Output principali
  - Creazione/aggiornamento di `VariableCollections` e `Variables` in Figma.
  - Messaggi di risposta inviati alla UI (es. `IMPORT_RESULT`, `JSON_ADVANCED_RESULT`, `CSS_RESULT`).

- Error modes
  - `skipInvalid`: opzione per ignorare variabili non valide durante l'import.
  - Fallback per alias non risolti (genera placeholder CSS o token con ID parziale).

---

## Architettura e file principali

Cartella `src/` — codice TypeScript:

- `src/main.ts` — Entry point principale: inizializza plugin, gestisce messaggi UI, coordina `TokenProcessor` e `VariableManager`.
- `src/main-figma.ts` — Versione consolidata per compatibilità con Figma (contiene utility e logiche: alias, mapping scope->type, resolver avanzato).
- `src/simple-import.ts` — Import semplificato e robusto: parsing JSON e creazione variabili/collection in modo ricorsivo.
- `src/classes/TokenProcessor.ts` — Logica di parsing e normalizzazione dei token in input; individua alias e genera la struttura per l'import.
- `src/classes/VariableManager.ts` — Logiche di creazione/aggiornamento delle variabili in Figma, settaggio valori per modalità, gestione sovrascritture.
- `src/classes/VariableExporter.ts` — (esporta token da collezioni variabili) — funzionalità di esportazione verso JSON/Tokens.
- `src/classes/CSSExporter.ts` — Generatore CSS/SCSS (sezione export) e funzioni di risoluzione alias per output CSS.
- `src/classes/AdvancedAliasResolver.ts` (in `main-figma.ts` consolidato) — Risolutore robusto degli alias con cache, protezione da loop e fallback.
- `src/classes/ProductionErrorHandler.ts` — Centralizza logging e gestione errori (notifiche, invio a UI).
- `src/constants/index.ts` — Contiene `MESSAGE_TYPES`, `UI_CONFIG`, mappature e limiti utilizzati nel plugin.
- `src/types/*` — Tipi TypeScript usati (PluginMessage, PluginResponse, tokens, ecc.).

Altri file importanti:
- `manifest.json` — Manifest Figma plugin.
- `package.json` — Script di build (`npm run build` esegue `tsc && cp dist/main-figma.js code.js`).
- `ui.html` — Interfaccia utente del plugin (frontend comunicante via postMessage).
- `tokens/variables.tokens.json` — Esempio / token di riferimento.

---

## Concetti chiave

### Variabili Figma e variabili dinamiche

Il plugin usa le API `figma.variables.*` per creare `VariableCollection` e `Variable`. Ogni `Variable` può avere valori per più `modes` (es. "Default", "Dark"), e ha tipi Figma: `COLOR`, `FLOAT`, `STRING`, `BOOLEAN`.

Il plugin gestisce anche variabili che contengono riferimenti ad altre variabili (alias): questi sono rappresentati internamente come oggetti con `type: 'VARIABLE_ALIAS'` e `id: '<figma-variable-id>'`.

### Alias e risoluzione (two-pass)

Per gestire alias e riferimenti incrociati il plugin utilizza un sistema a due passaggi:

1. Prima passata: crea le variabili e memorizza i riferimenti/alias in `pendingAliases` (non risolti ancora perché la variabile referenziata potrebbe non esistere ancora).
2. Seconda passata: usa `AdvancedAliasResolver` per risolvere gli alias, con cache e protezione da loop. Se la referenza non è trovata, viene generato un fallback (es. `var(--unknown-variable-xxxx)` per CSS o `{unknown-variable-xxxx}` per JSON).

`AdvancedAliasResolver` supporta opzioni come `format` (css/tokens/json), `maxDepth`, `variableMap` e `nameTransform`.

### Scopes e mappatura tipi

Figma usa scopes per indicare dove una variabile può essere applicata (es. `FONT_SIZE`, `STROKE_COLOR`, `ALL_FILLS`). Il plugin contiene una mappatura semantica `SCOPE_TO_TYPE_MAPPING` che converte scope in tipi token più leggibili (es. `CORNER_RADIUS` -> `borderRadius`).

Inoltre, `FIGMA_TO_TOKEN_TYPE` converte tipi Figma (`COLOR`, `FLOAT`, `STRING`, `BOOLEAN`) in tipi token (`color`, `number`, `string`, `boolean`).

La funzione `getTokenType(variable)` (in `main-figma.ts`) decide il tipo token seguendo questa gerarchia:
- Se non esistono scopes -> usa `resolvedType` (tipo Figma) convertito tramite `FIGMA_TO_TOKEN_TYPE`.
- Se `ALL_SCOPES` presente -> fallback al tipo generico.
- Se uno scope singolo -> usa `SCOPE_TO_TYPE_MAPPING` per ottenere tipo semantico.

### Mapping: Figma scope -> token type

Di seguito trovi la mappatura completa usata dal plugin (`SCOPE_TO_TYPE_MAPPING` in `src/main-figma.ts`) che converte gli scope di Figma in tipi token semantici usati per l'export/import e per decidere come trattare i valori:

- CORNER_RADIUS -> borderRadius
- GAP -> spacing
- WIDTH_HEIGHT -> size
- STROKE_FLOAT -> strokeWidth
- STROKE -> strokeWidth
- LAYER_OPACITY -> opacity
- EFFECTS -> shadow
- FILLS -> fill
- STROKES -> stroke
- TEXT_COLOR -> textColor
- ALL_FILLS -> color
- FRAME_FILL -> color
- SHAPE_FILL -> color
- TEXT_FILL -> color
- STROKE_COLOR -> color
- EFFECT_COLOR -> color
- FONT_FAMILY -> fontFamily
- FONT_WEIGHT -> fontWeight
- FONT_SIZE -> fontSize
- LINE_HEIGHT -> lineHeight
- LETTER_SPACING -> letterSpacing
- PARAGRAPH_SPACING -> paragraphSpacing
- PARAGRAPH_INDENT -> paragraphIndent
- TEXT_CONTENT -> string

In aggiunta, la conversione diretta dei tipi Figma usati internamente (`FIGMA_TO_TOKEN_TYPE`) è:

- COLOR -> color
- FLOAT -> number
- STRING -> string
- BOOLEAN -> boolean

Note d'uso:
- Quando `getTokenType` trova uno scope singolo, applica la mappatura sopra per ottenere un tipo semantico (utile per esportare come `borderRadius`, `spacing`, `fontSize`, ecc.).
- Se non sono presenti scopes, il plugin ricade sul tipo risolto (`resolvedType`) e lo converte tramite `FIGMA_TO_TOKEN_TYPE`.
- `ALL_FILLS` e alcuni altri scope vengono normalizzati a `color` per compatibilità con generatori CSS/JSON.

---

## Import

### Flusso generale

1. L'UI invia `IMPORT_JSON` con payload `{ json: '<stringified JSON>' }`.
2. `main.ts` chiama `tokenProcessor.processTokensForImport(jsonData)` per normalizzare, individuare alias e costruire la struttura di "collections".
3. `variableManager.importTokensAsVariables(collections, options)` crea/aggiorna `VariableCollections` e `Variables` in Figma.
4. Risultato inviato alla UI come `IMPORT_RESULT` (success, message, counts).

Esiste anche una versione semplificata `simpleImportVariables(jsonData)` in `src/simple-import.ts` che:
- Legge l'oggetto JSON come mappa di collections & variabili.
- Crea collection se non esistenti.
- Crea variabili (with `createVariable`) e setta `value` per la mode `Default`.
- Tenta di convertire tipi conosciuti (color/number/string/boolean) e imposta scopes base con heuristics.

### Formato JSON supportato (esempio)

Esempio minimo accettato da `simpleImport` e dal processor:

```
{
  "theme": {
    "colors": {
      "brand": {
        "primary": { "$value": "#3366FF", "$type": "color" },
        "secondary": { "$value": "#FF3366", "$type": "color" }
      }
    },
    "spacing": {
      "small": { "$value": "8", "$type": "number" },
      "medium": { "$value": "16", "$type": "number" }
    }
  }
}
```

Regole:
- Ogni nodo che rappresenta una variabile deve contenere `value` o `$value` e preferibilmente `type` o `$type`.
- I nodi che iniziano con `$` sono trattati come metadata e saltati come collezioni.
- Alias possono essere scritti come stringhe del tipo `"{other.collection.var}"` oppure come oggetti già normalizzati con `type: 'VARIABLE_ALIAS'` e `id: '<figma-id>'`.

### Opzioni importanti

- `overwriteExisting` (bool) — se true sovrascrive variabili esistenti con lo stesso nome.
- `skipInvalid` (bool) — se true ignora variabili con tipi non supportati.

### Esempio: import passo-passo

1. Apri UI (Figma) e incolla JSON di esempio.
2. Premi "Import".
3. Il plugin creerà una collection `theme` con variabili come `colors/brand/primary` e `spacing/small`.

---

## Export

### Stato attuale

Nel `src/main.ts`, le chiamate `EXPORT_JSON_ADVANCED` e `EXPORT_CSS` sono instradate verso handler che rispondono al momento con messaggi "will be implemented in next phase". Tuttavia, il progetto contiene classi di export (`CSSExporter`, `VariableExporter`, generatori in `css-export/generators`) che definiscono i generatori per CSS/SCSS/JSON.

Questo significa che la logica core per generare output esiste in gran parte, ma l'integrazione completa con il comando UI (e alcune opzioni avanzate) richiede completamento e test.

### Formati supportati / progettati

- JSON/Tokens (struttura gerarchica con metadata). Ottimo per scambiare tokens con sistemi di design tokens come Style Dictionary.
- CSS/SCSS: variabili generate come `:root { --token-name: value; }` o uso di `var(--token)` per alias.
- SCSS: generazione di mappe e funzioni per integrazione in toolchain asset.

### Alias in export

Quando una variabile è alias di un'altra, `AdvancedAliasResolver.resolveCSSAlias` restituisce `var(--transformed-name)` per generare output CSS leggibile.

---

## API e messaggi UI

I messaggi usati dall'UI (in `constants`) sono:
- `UI_READY` — UI inizializzata, chiedere dati iniziali.
- `GET_COLLECTIONS` / `COLLECTIONS_DATA` — richiesta e ritorno delle collection locali.
- `IMPORT_JSON` / `IMPORT_RESULT` — import semplice/avanzato.
- `EXPORT_JSON_ADVANCED` / `JSON_ADVANCED_RESULT` — export JSON avanzato.
- `EXPORT_CSS` / `CSS_RESULT` — export CSS.
- `PREVIEW_IMPORT` / `PREVIEW_RESULT` — preview dell'import (potenzialmente utile per sandboxing prima dell'import reale).
- Messaggi di gestione GitHub: `LOAD_GITHUB_CONFIG`, `TEST_GITHUB_CONNECTION`, `UPLOAD_TO_GITHUB`, ecc. (il plugin include utilità per upload su GitHub configurate nelle autorizzazioni di rete del manifest).

API interne principali (file / classi):
- `TokenProcessor.processTokensForImport(json)` → { success, collections, aliasCount, message }
- `VariableManager.importTokensAsVariables(collections, options)` → { success, variableCount, collectionCount, message }
- `simpleImportVariables(json)` (procedura dichiarata esportabile per import veloce)
- `AdvancedAliasResolver.resolveAlias(value, options)` → AliasResolutionResult

---

## Setup dev, build e test rapido

Prerequisiti: Node.js (LTS), npm.

1. Clona il repo.
2. Installa dipendenze dev:

```bash
npm install
```

3. Build:

```bash
npm run build
```

Questo esegue `tsc` e copia `dist/main-figma.js` in `code.js` (file caricato da `manifest.json`).

4. In sviluppo:

```bash
npm run dev
# oppure
npm run watch
```

5. Caricare il plugin in Figma:
- Apri Figma -> Plugins -> Development -> "Import plugin from manifest..." e seleziona la cartella del progetto (assicurati che `manifest.json`, `code.js`, `ui.html` siano presenti).

6. Linting:

```bash
npm run lint
```

Suggerimento: modificare `src/main-figma.ts` è utile per debugging locale: contiene console.log dettagliati e versioni consolidate delle classi.

---

## Come estendere / punti di integrazione per uno sviluppatore

Per aggiungere feature (es. integrazione con S3, formati aggiuntivi o UI multilingua):

1. Metti mano a `TokenProcessor` per supportare nuovi campi nel JSON in ingresso (ad es. `description`, `category`, `deprecated`).
2. Completare gli handler di export in `src/main.ts` (funzioni `handleExportJsonAdvanced` e `handleExportCss`) per chiamare i generatori presenti in `css-export/generators`.
3. Aggiungere test unitari per `AdvancedAliasResolver` (casi: alias semplice, alias multilivello, circular reference, missing variable).
4. Per performance su grandi set di token: usare una `Map<string, Variable>` per lookup variabili ed evitare chiamate ripetute alle API di Figma.
5. Per integrazioni CI/CD (deploy automatico di file generati su GitHub): usare gli endpoint già presenti in `utils/githubApi.ts` e completare il flusso di upload.

### Dove trovare i punti di estensione nel codice

- Handler messaggi: `src/main.ts` → aggiungi nuovi MESSAGE_TYPES e handler.
- Generator CSS/SCSS: `src/css-export/generators/*` → aggiungi template o opzioni.
- Mapping scope->type e heuristics: `src/main-figma.ts` (SCOPE_TO_TYPE_MAPPING, assignSimpleScopes).

---

## Edge cases e suggerimenti per QA

- Alias circolari: `AdvancedAliasResolver` segnala e fornisce fallback; assicurarsi di testare con profondità massiva (>10 livelli).
- Tipi non riconosciuti: `simpleImport` ignora tipi non mappati (log & skip) se `skipInvalid=true`.
- Collisione nomi: considerare normalizzazione dei nomi (transforms) per evitare duplicati quando si importa da sistemi con convenzioni diverse.
- Modalità (modes): verificare che `collection.modes` sia presente; quando si crea una collection il plugin usa la prima mode disponibile come `Default`.
- Performance: import di grandi set deve essere batchato e mostrare progress (es. api `figma.notify` o messaggi progressivi alla UI).

---

## Checklist tecnica

- Documentazione tecnica aggiornata (IT + EN)
- Esempi JSON e template (posizionare in `tokens/` con README)
- Test unitari per `AdvancedAliasResolver` e per import/export core
- Completare handler export (JSON avanzato e CSS) e test end-to-end
- Istruzioni di installazione per lo sviluppo e il deploy in Figma
- Aggiungere licenza se necessaria e dettagli di supporto nel `README.md`
- Aggiornare `package.json` con `version` e changelog
- Verificare manifest e permessi di rete (solo domini necessari)

---

## Esempi pratici

Esempio JSON da usare per test rapido (import semplice):

```json
{
  "demo": {
    "colors": {
      "brand": {
        "primary": { "$value": "#3366FF", "$type": "color" },
        "muted": { "$value": "#E6F0FF", "$type": "color" }
      }
    },
    "typography": {
      "heading": {
        "font-size": { "$value": "24", "$type": "number" },
        "font-family": { "$value": "Inter", "$type": "string" }
      }
    }
  }
}
```

Copia/incolla nella UI e premi Import. Dovresti ottenere la collection `demo` con variabili nell'albero `colors.brand.primary` e `typography.heading.font-size`.

---

## Note pratiche

- Includere una licenza se il progetto verrà distribuito.
- Fornire istruzioni chiare per l'installazione della versione prod (file `code.js`, `manifest.json`, asset UI).

---

## Riferimenti ai file sorgente (per lo sviluppatore)

- `manifest.json` — Permessi e entry (`main` = `code.js`, `ui` = `ui.html`).
- `src/main.ts` — Orchestrazione principale e handler messaggi.
- `src/main-figma.ts` — Logiche consolidate, risolutore alias, mapping scope->type.
- `src/simple-import.ts` — Importer ricorsivo e heuristics di mappatura type->scope.
- `src/classes/TokenProcessor.ts` — Normalizzazione, parsing, conteggio alias.
- `src/classes/VariableManager.ts` — Creazione/aggiornamento Variables e Collections.
- `src/classes/CSSExporter.ts` — Generazione CSS e risoluzione alias per CSS.
- `src/constants/index.ts` — `MESSAGE_TYPES`, `UI_CONFIG`, `SCOPE_TO_TYPE_MAPPING`.
- `tokens/variables.tokens.json` — Esempi di token per riferimento.


