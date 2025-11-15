#!/usr/bin/env python3
"""
Script v2 per importare component tokens da theme-mooneygo.json a clara-tokens.json
Gestione corretta della struttura gerarchica
"""

import json
import re

def convert_alias(value):
    """Converte un valore in alias se è un riferimento a token esistente"""
    if isinstance(value, str) and value.isupper() and not value.startswith('#') and not value.startswith('rgba'):
        # Mapping specifici per colori comuni
        if value == 'WHITE':
            return '{global.colors.neutral.white}'
        elif value == 'BLACK':
            return '{global.colors.neutral.black}'
        elif value == 'TRANSPARENT':
            return '{global.colors.neutral.transparent}'
        elif value.startswith('GREYSCALE_'):
            num = value.replace('GREYSCALE_', '')
            return f'{{global.colors.greyscale.{num}}}'
        elif value.startswith('FEEDBACK_'):
            parts = value.replace('FEEDBACK_', '').lower().split('_')
            if len(parts) == 2:
                return f'{{global.colors.feedback.{parts[0]}.{parts[1]}}}'
    return value

def get_type(key, value):
    """Deduce il $type basandosi sul nome della chiave o valore"""
    key_lower = key.lower()

    if 'color' in key_lower or 'background' in key_lower or 'border' in key_lower or 'text' in key_lower or 'icon' in key_lower:
        return 'color'
    elif 'radius' in key_lower:
        return 'borderRadius'
    elif 'width' in key_lower or 'height' in key_lower or 'size' in key_lower or 'spacing' in key_lower or 'padding' in key_lower or 'margin' in key_lower:
        return 'dimension'
    elif 'opacity' in key_lower:
        return 'opacity'
    elif 'shadow' in key_lower:
        return 'shadow'
    elif 'font' in key_lower or 'typography' in key_lower or 'weight' in key_lower or 'role' in key_lower:
        return 'typography'
    elif isinstance(value, (int, float)):
        return 'number'
    else:
        return 'string'

def extract_component(flat_dict, component_prefix):
    """Estrae tutte le chiavi di un componente e le converte in struttura nested"""
    nested = {}

    for key, value in flat_dict.items():
        if not key.startswith(component_prefix):
            continue

        # Rimuovi il prefisso del componente (es. "UIAccordion.")
        relative_key = key[len(component_prefix):]

        # Splitta il path
        parts = relative_key.split('.')

        # Naviga/crea la struttura nested
        current = nested
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]

        # Ultimo elemento - aggiungi il valore con $value e $type
        last_key = parts[-1]
        converted_value = convert_alias(value)

        current[last_key] = {
            '$value': converted_value,
            '$type': get_type(last_key, value)
        }

    return nested

# Leggi i file
print("📖 Lettura file...")
with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/json-dev/theme-mooneygo.json', 'r') as f:
    mooneygo = json.load(f)

with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json', 'r') as f:
    clara = json.load(f)

# Componenti da estrarre (10 totali)
components_map = {
    'accordion': 'UIAccordion.',
    'tab': 'UITabBar.',
    'modal': 'mixins.modals.',
    'bottomSheet': 'mixins.bottomSheet.',
    'dropdown': 'UILinkedCardCart.dropdown',
    'textInput': 'UITextInput.',
    'button': 'UIButton.',
    'checkbox': 'UICheckbox.',
    'radioToggle': 'UIRadioToggle.',
    'banner': 'UIBanner.',
}

print(f"\n🔄 Estrazione {len(components_map)} componenti...")

components_collection = clara.get('components', {})
total_extracted = 0

for comp_name, prefix in components_map.items():
    print(f"\n  📦 {comp_name} ({prefix})")

    nested = extract_component(mooneygo, prefix)

    if nested:
        # Conta proprietà totali (ricorsivamente)
        def count_props(obj):
            count = 0
            for v in obj.values():
                if isinstance(v, dict) and '$value' in v:
                    count += 1
                elif isinstance(v, dict):
                    count += count_props(v)
            return count

        prop_count = count_props(nested)
        components_collection[comp_name] = nested
        total_extracted += 1
        print(f"    ✅ Estratte {prop_count} proprietà")
    else:
        print(f"    ⚠️  Nessuna proprietà trovata")

# Aggiorna clara-tokens.json
clara['components'] = components_collection

# Salva
print(f"\n💾 Salvataggio clara-tokens.json...")
with open('/Users/mattia/Documents/Mattia/Progetti/Mooney/clara-tokens.json', 'w') as f:
    json.dump(clara, f, indent=2, ensure_ascii=False)

print(f"\n✅ Import completato!")
print(f"📊 {total_extracted} nuovi componenti aggiunti")
print(f"📊 Totale componenti in clara-tokens.json: {len(components_collection)}")
