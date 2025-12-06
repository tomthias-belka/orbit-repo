#!/usr/bin/env python3
"""
Converts a flat design tokens JSON file to W3C Design Tokens Format Module specification.
"""

import json
import sys
import re
from typing import Any, Dict


def infer_token_type(key: str, value: Any) -> str:
    """Infer the W3C token type based on key and value."""
    key_lower = key.lower()

    # Color detection
    if isinstance(value, str):
        if re.match(r'^#[0-9A-Fa-f]{3,8}$', value):
            return "color"
        if re.match(r'^rgba?\(', value):
            return "color"
        if 'color' in key_lower:
            return "color"

    # Dimension detection
    if isinstance(value, (int, float)) and any(x in key_lower for x in [
        'width', 'height', 'size', 'padding', 'margin', 'gap', 'spacing',
        'radius', 'border', 'offset', 'indent'
    ]):
        return "dimension"

    # Font weight
    if 'weight' in key_lower or 'fontweight' in key_lower:
        return "fontWeight"

    # Font family
    if 'font' in key_lower and 'family' in key_lower:
        return "fontFamily"

    # Duration
    if 'duration' in key_lower or 'delay' in key_lower:
        return "duration"

    # Number
    if isinstance(value, (int, float)):
        return "number"

    # String/other
    return "string"


def set_nested_value(obj: Dict, path: list, value: Any, original_key: str) -> None:
    """Set a value in a nested dictionary using a path."""
    for key in path[:-1]:
        if key not in obj:
            obj[key] = {}
        obj = obj[key]

    last_key = path[-1]

    # Infer type
    token_type = infer_token_type(original_key, value)

    # Create W3C token structure
    obj[last_key] = {
        "$value": value,
        "$type": token_type
    }

    # Add description with original flat key for reference
    obj[last_key]["$description"] = f"Original key: {original_key}"


def convert_flat_to_w3c(flat_tokens: Dict) -> Dict:
    """Convert flat token structure to W3C nested structure."""
    w3c_tokens = {}

    for flat_key, value in flat_tokens.items():
        # Split by dots to create hierarchy
        path = flat_key.split('.')
        set_nested_value(w3c_tokens, path, value, flat_key)

    return w3c_tokens


def main():
    # Read input file
    input_file = sys.argv[1] if len(sys.argv) > 1 else "theme-mooneygo.json"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "theme-mooneygo-w3c.json"

    print(f"Converting {input_file} to W3C format...")

    with open(input_file, 'r', encoding='utf-8') as f:
        flat_tokens = json.load(f)

    # Convert to W3C format
    w3c_tokens = convert_flat_to_w3c(flat_tokens)

    # Write output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(w3c_tokens, f, indent=2, ensure_ascii=False)

    print(f"✓ Conversion complete! Output saved to {output_file}")
    print(f"  Total tokens converted: {len(flat_tokens)}")


if __name__ == "__main__":
    main()
