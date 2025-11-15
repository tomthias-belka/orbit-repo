#!/usr/bin/env python3
"""
Script per correggere $type basandosi sul valore dell'alias
"""

import json

def get_type_from_alias(value):
    """Determina il $type corretto basandosi sull'alias"""
    if not isinstance(value, str) or not value.startswith('{'):
        return None  # Non è un alias

    # Mapping alias → type
    if '{global.spacing.' in value or '{semantic.spacing.' in value:
        return 'spacing'
    elif '{global.radius.' in value or '{semantic.radius.' in value:
        return 'borderRadius'
    elif '{global.colors.' in value or '{semantic.colors.' in value or '{semantic.brand.' in value:
        return 'color'
    elif '{global.typography.' in value or '{semantic.typography.' in value:
        return 'typography'
    elif '{shadow.' in value or '{semantic.shadow.' in value:
        return 'shadow'

    return None

def fix_types_by_alias(obj, path=''):
    """Corregge $type basandosi sull'alias"""
    fixes = 0

    if isinstance(obj, dict):
        if '$value' in obj and '$type' in obj:
            value = obj['$value']
            current_type = obj['$type']
            correct_type = get_type_from_alias(value)

            if correct_type and correct_type != current_type:
                obj['$type'] = correct_type
                fixes += 1
                print(f"  🔧 {path}: $type {current_type} → {correct_type} (alias: {value[:40]}...)")

        # Continua ricorsivamente
        for key, val in obj.items():
            if key not in ['$value', '$type', '$description']:
                fixes += fix_types_by_alias(val, f'{path}.{key}' if path else key)

    return fixes

# Main
print("📖 Lettura clara-tokens.json...")
with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json', 'r') as f:
    clara = json.load(f)

components = clara.get('components', {})

print("\n🔧 Correzione $type basandosi sugli alias...\n")
total_fixes = 0

for comp_name in components.keys():
    print(f"📦 {comp_name}")
    fixes = fix_types_by_alias(components[comp_name], comp_name)
    total_fixes += fixes
    if fixes == 0:
        print(f"  ✅ Nessuna correzione necessaria")
    print()

print(f"✅ Totale correzioni: {total_fixes}")

# Salva
print("\n💾 Salvataggio clara-tokens.json...")
with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json', 'w') as f:
    json.dump(clara, f, indent=2, ensure_ascii=False)

print("\n✅ $type corretti basandosi sugli alias!")
