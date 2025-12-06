# Clara Tokens Plugin - Script Documentation

> Complete technical documentation for Clara Tokens Figma Plugin scripts
> Documentazione tecnica completa degli script del plugin Figma Clara Tokens

---

## 📚 Documentation Index / Indice Documentazione

### 🇮🇹 Italiano

1. **[NPM Scripts](it/01-npm-scripts.md)** - Comandi npm per build, development e testing
2. **[Script Principali](it/02-main-scripts.md)** - Entry points e sistema di import
3. **[Classi Core](it/03-core-classes.md)** - Classi fondamentali del plugin
4. **[Utility Scripts](it/04-utility-scripts.md)** - Script di utilità e helper
5. **[Test Scripts](it/05-test-scripts.md)** - Suite di test e testing framework
6. **[Configurazione](it/06-configuration.md)** - File di configurazione TypeScript e Figma
7. **[Workflow Guide](it/99-workflow-guide.md)** - Guida completa al workflow di sviluppo

### 🇬🇧 English

1. **[NPM Scripts](en/01-npm-scripts.md)** - NPM commands for build, development and testing
2. **[Main Scripts](en/02-main-scripts.md)** - Entry points and import system
3. **[Core Classes](en/03-core-classes.md)** - Core plugin classes
4. **[Utility Scripts](en/04-utility-scripts.md)** - Utility scripts and helpers
5. **[Test Scripts](en/05-test-scripts.md)** - Test suites and testing framework
6. **[Configuration](en/06-configuration.md)** - TypeScript and Figma configuration files
7. **[Workflow Guide](en/99-workflow-guide.md)** - Complete development workflow guide

---

## 🎯 Quick Overview / Panoramica Rapida

### What is Clara Tokens? / Cos'è Clara Tokens?

**🇬🇧 EN:** Clara Tokens is a Figma plugin for importing, exporting, and managing design tokens. It supports W3C Design Tokens format, Token Studio format, and provides advanced features like theme generation, library support, and cross-collection aliases.

**🇮🇹 IT:** Clara Tokens è un plugin Figma per importare, esportare e gestire design token. Supporta il formato W3C Design Tokens, il formato Token Studio, e fornisce funzionalità avanzate come generazione temi, supporto librerie e alias cross-collection.

### Architecture / Architettura

```
Clara Tokens Plugin
├── Entry Points (main-figma.ts, main.ts)
├── Core Classes (TokenProcessor, VariableManager, LibraryManager)
├── Utilities (Color, Theme, Validation)
├── Tests (Unit tests for critical functions)
└── Configuration (TypeScript, Figma manifest)
```

### Key Features / Funzionalità Chiave

- ✅ **Token Import/Export** - W3C and Token Studio formats
- ✅ **Theme Generation** - Automatic color variant generation
- ✅ **Library Support** - Figma Team Libraries integration
- ✅ **Alias Resolution** - Two-step cross-collection references
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Error Handling** - Production-ready error management

---

## 🚀 Quick Start / Avvio Rapido

### Development / Sviluppo

```bash
# Install dependencies / Installa dipendenze
cd "Figma Plugin/clara plugin"
npm install

# Start development mode / Avvia modalità sviluppo
npm run dev

# Build for production / Build per produzione
npm run build

# Run linter / Esegui linter
npm run lint
```

### File Structure / Struttura File

```
clara plugin/
├── src/
│   ├── main-figma.ts          # Main entry point (consolidated)
│   ├── main.ts                 # Main entry point (modular)
│   ├── simple-import.ts        # Import system
│   ├── classes/                # Core classes
│   ├── utils/                  # Utility scripts
│   └── types/                  # TypeScript types
├── tests/                      # Test suites
├── dist/                       # Compiled output
├── code.js                     # Figma plugin code
├── ui.html                     # Plugin UI
├── manifest.json               # Figma manifest
├── tsconfig.json              # TypeScript config
└── package.json               # NPM config
```

---

## 📖 Documentation Guide / Guida alla Documentazione

### For New Developers / Per Nuovi Sviluppatori

**🇬🇧 EN:** Start with:
1. [Workflow Guide](en/99-workflow-guide.md) - Understand the development process
2. [NPM Scripts](en/01-npm-scripts.md) - Learn available commands
3. [Main Scripts](en/02-main-scripts.md) - Understand the architecture

**🇮🇹 IT:** Inizia con:
1. [Workflow Guide](it/99-workflow-guide.md) - Comprendi il processo di sviluppo
2. [NPM Scripts](it/01-npm-scripts.md) - Impara i comandi disponibili
3. [Script Principali](it/02-main-scripts.md) - Comprendi l'architettura

### For Feature Development / Per Sviluppo Funzionalità

**🇬🇧 EN:** Check:
1. [Core Classes](en/03-core-classes.md) - Main plugin logic
2. [Utility Scripts](en/04-utility-scripts.md) - Helper functions
3. [Test Scripts](en/05-test-scripts.md) - Write tests for your code

**🇮🇹 IT:** Controlla:
1. [Classi Core](it/03-core-classes.md) - Logica principale del plugin
2. [Utility Scripts](it/04-utility-scripts.md) - Funzioni helper
3. [Test Scripts](it/05-test-scripts.md) - Scrivi test per il tuo codice

### For Configuration Changes / Per Modifiche Configurazione

**🇬🇧 EN:** See:
1. [Configuration](en/06-configuration.md) - All config files explained

**🇮🇹 IT:** Vedi:
1. [Configurazione](it/06-configuration.md) - Tutti i file di configurazione spiegati

---

## 🔗 External Resources / Risorse Esterne

- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [W3C Design Tokens Spec](https://design-tokens.github.io/community-group/format/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 📝 Contributing / Contribuire

**🇬🇧 EN:** When modifying scripts, please:
1. Update relevant documentation
2. Add/update tests
3. Run linter before committing
4. Follow existing code style

**🇮🇹 IT:** Quando modifichi gli script, per favore:
1. Aggiorna la documentazione rilevante
2. Aggiungi/aggiorna i test
3. Esegui il linter prima di committare
4. Segui lo stile di codice esistente

---

## 📄 License / Licenza

**🇬🇧 EN:** This documentation is part of the Clara Tokens plugin project.

**🇮🇹 IT:** Questa documentazione è parte del progetto plugin Clara Tokens.

---

**Last Updated / Ultimo Aggiornamento:** 2025-01-16
**Version / Versione:** 1.0.0
