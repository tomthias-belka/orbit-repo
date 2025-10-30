const fs = require('fs');
const path = require('path');

// Leggi il file JSON flat
const inputFile = path.join(__dirname, '../censimento 001/stato attuale-json-mooney/theme-mooneygo.json');
const outputFile = path.join(__dirname, 'theme-mooneygo-updated.json');

const flatJson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Funzione per convertire da flat a nested
function flatToNested(flat) {
  const nested = {};

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = nested;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        // Ultimo elemento, assegna il valore
        current[part] = value;
      } else {
        // Crea l'oggetto se non esiste
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return nested;
}

// Converti e salva
const nestedJson = flatToNested(flatJson);
fs.writeFileSync(outputFile, JSON.stringify(nestedJson, null, 2), 'utf8');

console.log('Conversione completata!');
console.log(`File salvato in: ${outputFile}`);
