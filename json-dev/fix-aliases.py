#!/usr/bin/env python3
"""
Script per convertire tutti gli alias hardcoded nei component tokens
"""

import json
import re

# Mapping completo alias
ALIAS_MAP = {
    # Neutral colors
    'WHITE': '{global.colors.neutral.white}',
    'BLACK': '{global.colors.neutral.black}',
    'TRANSPARENT': '{global.colors.neutral.transparent}',

    # Spacing/Radius (NONE, XS, S, M, L, XL → none, xs, sm, md, lg, xl, 2xl)
    'NONE': '0',
    'XS': '{global.radius.xs}',     # 4px radius
    'S': '{global.radius.sm}',      # 8px radius
    'M': '{global.radius.md}',      # 10px radius (o spacing md=20px per padding)
    'L': '{global.radius.lg}',      # 12px radius
    'XL': '{global.radius.xl}',     # 16px radius
    'XXL': '{global.radius.2xl}',   # 18px radius

    # Greyscale
    'GREYSCALE_1': '{global.colors.greyscale.1}',
    'GREYSCALE_2': '{global.colors.greyscale.2}',
    'GREYSCALE_3': '{global.colors.greyscale.3}',
    'GREYSCALE_4': '{global.colors.greyscale.4}',
    'GREYSCALE_5': '{global.colors.greyscale.5}',

    # Feedback colors
    'FEEDBACK_ERROR_DARK': '{global.colors.feedback.error.dark}',
    'FEEDBACK_ERROR_LIGHT': '{global.colors.feedback.error.light}',
    'FEEDBACK_WARNING_DARK': '{global.colors.feedback.warning.dark}',
    'FEEDBACK_WARNING_LIGHT': '{global.colors.feedback.warning.light}',
    'FEEDBACK_SUCCESS_DARK': '{global.colors.feedback.success.dark}',
    'FEEDBACK_SUCCESS_LIGHT': '{global.colors.feedback.success.light}',
    'FEEDBACK_INFO_DARK': '{global.colors.feedback.info.dark}',
    'FEEDBACK_INFO_LIGHT': '{global.colors.feedback.info.light}',

    # MooneyGo specific colors - mappati a semantic (assumendo che esistano)
    'MOONEYGO_PRIMARY_3': '{semantic.brand.core.main}',
    'MOONEYGO_SECONDARY_1': '{semantic.brand.alt.light}',
    'MOONEYGO_SECONDARY_3': '{semantic.brand.core.secondary}',
    'MOONEYGO_BLUE': '{semantic.brand.core.accent}',
    'MOONEYGO_GREY1': '{semantic.colors.background.subtle}',
    'MOONEYGO_GREY2': '{semantic.colors.border.default}',
    'MOONEYGO_GREY10': '{semantic.colors.text.primary}',
    'MOONEYGO_EXTRA_COLOR_1_BLUE': '{semantic.colors.background.info}',

    # Backdrop
    'BACKDROP_COLOR': '{semantic.colors.overlay.backdrop}',

    # Tag status colors
    'TAG_STATUS_WARNING_DARK': '{global.colors.feedback.warning.dark}',
    'TAG_STATUS_INFO_DARK': '{global.colors.feedback.info.dark}',
    'TAG_STATUS_ERROR_DARK': '{global.colors.feedback.error.dark}',
    'TAG_STATUS_SUCCESS_DARK': '{global.colors.feedback.success.dark}',
}

def convert_value(value):
    """Converte un valore usando la mappa alias"""
    if isinstance(value, str) and value in ALIAS_MAP:
        return ALIAS_MAP[value]
    return value

def fix_aliases_recursive(obj, path=''):
    """Converte ricorsivamente tutti gli alias in un oggetto"""
    fixes = 0

    if isinstance(obj, dict):
        if '$value' in obj:
            old_value = obj['$value']
            new_value = convert_value(old_value)

            if new_value != old_value:
                obj['$value'] = new_value
                fixes += 1
                print(f"  🔧 {path}: {old_value} → {new_value}")

        # Continua ricorsivamente
        for key, value in obj.items():
            if key not in ['$value', '$type', '$description']:
                fixes += fix_aliases_recursive(value, f'{path}.{key}' if path else key)

    return fixes

# Main execution
print("📖 Lettura clara-tokens.json...")
with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json', 'r') as f:
    clara = json.load(f)

components = clara.get('components', {})

print("\n🔧 Conversione alias hardcoded...\n")
total_fixes = 0

for comp_name in components.keys():
    print(f"📦 {comp_name}")
    fixes = fix_aliases_recursive(components[comp_name], comp_name)
    total_fixes += fixes
    if fixes == 0:
        print(f"  ✅ Nessuna conversione necessaria")
    print()

print(f"✅ Totale conversioni: {total_fixes}")

# Salva
print("\n💾 Salvataggio clara-tokens.json...")
with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json', 'w') as f:
    json.dump(clara, f, indent=2, ensure_ascii=False)

print("\n✅ Alias convertiti con successo!")

# Verifica
print("\n🔍 Verifica alias rimanenti...")
unconverted = []
def find_unconverted(obj, path=''):
    if isinstance(obj, dict):
        if '$value' in obj:
            val = obj['$value']
            if isinstance(val, str) and val.isupper() and not val.startswith('#') and not val.startswith('rgba') and not val.startswith('{'):
                unconverted.append(f'{path}: {val}')
        else:
            for key, value in obj.items():
                find_unconverted(value, f'{path}.{key}' if path else key)

find_unconverted(components)

if unconverted:
    print(f"⚠️  {len(unconverted)} alias ancora da convertire:")
    for item in unconverted[:10]:
        print(f"  - {item}")
else:
    print("✅ Tutti gli alias sono stati convertiti!")
