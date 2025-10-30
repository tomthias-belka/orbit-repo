const fs = require('fs');

// Fix issues in generated W3C files
function fixW3CFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Fix empty UIText.colors group
  if (data.UIText && data.UIText.colors && data.UIText.colors.$value) {
    if (Object.keys(data.UIText.colors.$value).length === 0) {
      data.UIText.colors = {};
    }
  }
  
  // Fix letterSpacing to have units
  function fixLetterSpacing(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (obj[key].$type === 'typography' && obj[key].$value) {
          if (typeof obj[key].$value.letterSpacing === 'number') {
            obj[key].$value.letterSpacing = obj[key].$value.letterSpacing + 'px';
          }
        }
        fixLetterSpacing(obj[key]);
      }
    }
  }
  
  fixLetterSpacing(data);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
}

// Fix all generated files
fixW3CFile('theme-base-w3c.json');
fixW3CFile('theme-mooneygo-w3c.json');
fixW3CFile('themes-unified-w3c.json');

console.log('\n🎉 All fixes applied!');
