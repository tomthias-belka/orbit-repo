# Mooney Design System - Token Audit Template

## Purpose

This template guides the process of reconciling 282 design tokens with 273 dev tokens, identifying conflicts, documenting business context, and creating a unified token set.

---

## Audit Overview

**Source Files**:
- Design: [design/variables.json](../../design/variables.json) - 282 tokens
- Dev: [censimento/jsonW3C-StatoAttuale.json](../../censimento/jsonW3C-StatoAttuale.json) - 273 tokens

**Goal**: Create single unified file with all necessary tokens, conflicts resolved

**Auditor**: ___________________
**Date Started**: ___________________
**Target Completion**: ___________________

---

## Phase 1: Token Inventory

### Step 1.1: Count Tokens by Category

| Category | Design Count | Dev Count | Status |
|----------|--------------|-----------|--------|
| **Typography** | | | |
| - font-family | 3 | 3 | ✓ Match |
| - font-weight | 3 | 3 | ✓ Match |
| - font-size | 9 | 9 | ✓ Match |
| - font-leading | 8 | 8 | ✓ Match |
| **Subtotal** | **23** | **23** | **✓ Aligned** |
| | | | |
| **Colors - Primitives** | | | |
| - dark-blue | _____ | _____ | _____ |
| - turquoise | _____ | _____ | _____ |
| - yellow | _____ | _____ | _____ |
| - grey | _____ | _____ | _____ |
| - red | _____ | _____ | _____ |
| - orange | _____ | _____ | _____ |
| - green | _____ | _____ | _____ |
| - brown | _____ | _____ | _____ |
| - teal | _____ | _____ | _____ |
| - purple | _____ | _____ | _____ |
| - light-blue | _____ | _____ | _____ |
| - base (white/black) | _____ | _____ | _____ |
| **Subtotal** | **_____** | **_____** | **_____** |
| | | | |
| **Colors - Semantic** | | | |
| - brand | _____ | _____ | _____ |
| - feedback | _____ | _____ | _____ |
| - greyscale | _____ | _____ | _____ |
| - illustration | _____ | _____ | _____ |
| - extra | _____ | _____ | _____ |
| **Subtotal** | **_____** | **_____** | **_____** |
| | | | |
| **Mobility Services** | | | |
| - bus | 3 | 3 | _____ |
| - metro | 3 | 3 | _____ |
| - train | 3 | 3 | _____ |
| - taxi | 3 | 0 | ❌ Missing |
| - parking | 3 | 0 | ❌ Missing |
| - car-rental | 3 | 0 | ❌ Missing |
| - charging-station | 3 | 0 | ❌ Missing |
| - airports | 3 | 0 | ❌ Missing |
| - pullman | 3 | 0 | ❌ Missing |
| - tram | 3 | 0 | ❌ Missing |
| - harbor | 3 | 0 | ❌ Missing |
| - ncc | 3 | 0 | ❌ Missing |
| - sharing | 3 | 3 | _____ |
| - garage | 3 | 3 | _____ |
| - garage-telepass | 3 | 3 | _____ |
| - skipass | 3 | 0 | ❌ Missing |
| - favorites | 3 | 0 | ❌ Missing |
| - walk | 3 | 0 | ❌ Missing |
| - ztl | 3 | 0 | ❌ Missing |
| - places | 3 | 0 | ❌ Missing |
| - apparked | 3 | 0 | ❌ Missing |
| - experience | 3 | 0 | ❌ Missing |
| **Subtotal** | **66** (22×3) | **18** (6×3) | **48 missing** |
| | | | |
| **Spacing/Radius** | | | |
| - spacing-radius | _____ | _____ | _____ |
| **Subtotal** | **_____** | **_____** | **_____** |
| | | | |
| **GRAND TOTAL** | **282** | **273** | **9 token gap** |

---

## Phase 2: Conflict Identification

### Step 2.1: Structural Conflicts

**Emoji Prefixes (Design file)**:
- [ ] Count groups with emoji: _____
- [ ] List of groups to rename:
  - `🔠 Typography` → `typography`
  - `⬛️ Primitives` → `primitives`
  - `🎨 Colours - Brand MG` → `brand-mg` (or nest under `colours`)
  - `🎨 Colours - Illustrations MG` → `illustrations`
  - `🎨 Colours - WL` → `whitelabel` (or `extra`)
  - `🎨 Colours - Mobility` → `mobility`

**Organizational Differences**:
| Aspect | Design | Dev | Resolution |
|--------|---------|-----|------------|
| Top-level structure | 6 groups | 31 groups | _____________ |
| Primitives location | `⬛️ Primitives` group | Mixed in root | _____________ |
| Mobility grouping | `🎨 Colours - Mobility` | Separate root groups | _____________ |

### Step 2.2: Value Conflicts

**Bus Service Colors** ⚠️ CRITICAL:
```json
// Design
"bus": {
  "light": "{Colours.Orange.orange-100}",
  "medium": "{Colours.Orange.orange-750}",
  "dark": "{Colours.Brown.brown-800}"
}

// Dev
"bus": {
  "light": "{Colours.Light Blue.light-blue-200}",
  "medium": "{Colours.Light Blue.light-blue-650}",
  "dark": "{Colours.Light Blue.light-blue-750}"
}
```

**Decision Made** (from meeting): _____________________
**Rationale**: _____________________

**Whitelabel (-extra) Colors** ⚠️ CRITICAL:
```json
// Design - Purple
"-extra": {
  "dark-3": "{Colours.Purple.purple-800}",
  "medium-2": "{Colours.Purple.purple-600}",
  "light-1": "{Colours.Purple.purple-300}"
}

// Dev - Brown
"-extra": {
  "dark-3": "{Colours.Brown.brown-900}",
  "medium-2": "{Colours.Brown.brown-800}",
  "light-1": "{Colours.Brown.brown-200}"
}
```

**Decision Made** (from meeting): _____________________
**Rationale**: _____________________

**Other Value Conflicts**:
| Token Path | Design Value | Dev Value | Decision | Notes |
|------------|--------------|-----------|----------|-------|
| feedback.info-light | turquoise-50 | turquoise-150 | _______ | Minor visual diff |
| _____________ | _______ | _______ | _______ | _______ |
| _____________ | _______ | _______ | _______ | _______ |

---

## Phase 3: Missing Token Analysis

### Step 3.1: Tokens in Design but NOT in Dev

**Mobility Services (16 missing)**:
- [ ] taxi (light, medium, dark)
- [ ] parking (light, medium, dark)
- [ ] car-rental (light, medium, dark)
- [ ] charging-station (light, medium, dark)
- [ ] airports (light, medium, dark)
- [ ] pullman (light, medium, dark)
- [ ] tram (light, medium, dark)
- [ ] harbor (light, medium, dark)
- [ ] ncc (light, medium, dark)
- [ ] skipass (light, medium, dark)
- [ ] favorites (light, medium, dark)
- [ ] walk (light, medium, dark)
- [ ] ztl (light, medium, dark)
- [ ] places (light, medium, dark)
- [ ] apparked (light, medium, dark)
- [ ] experience (light, medium, dark)

**Action**: Include in unified file? Yes / No (based on meeting decision)

**Other Design-Only Tokens**:
| Token | Category | Include? | Rationale |
|-------|----------|----------|-----------|
| ______ | _______ | ☐ Yes ☐ No | _________ |
| ______ | _______ | ☐ Yes ☐ No | _________ |

### Step 3.2: Tokens in Dev but NOT in Design

**Identify Unique Dev Tokens**:
| Token | Category | Include? | Rationale |
|-------|----------|----------|-----------|
| ______ | _______ | ☐ Yes ☐ No | _________ |
| ______ | _______ | ☐ Yes ☐ No | _________ |

*Note: Review dev file for any tokens not present in design (rare, but check for dev-specific additions)*

---

## Phase 4: Business Context Documentation

### For Each Conflict, Answer:

**Bus Service Colors**:
- **Why does it matter?** _____________________________________
- **Who's affected?** _____________________________________
- **Business impact of wrong choice?** _____________________________________
- **User impact?** _____________________________________
- **Cost to change later?** _____________________________________

**Mobility Services Gap (16 missing)**:
- **Why 22 in design but 6 in dev?** _____________________________________
- **Product roadmap relevance?** _____________________________________
- **Client contracts?** _____________________________________
- **Competitive landscape?** _____________________________________
- **Cost to include now vs later?** _____________________________________

**Whitelabel (-extra) Colors**:
- **Purpose of -extra tokens?** _____________________________________
- **Which brands use them?** _____________________________________
- **Accessibility requirements?** _____________________________________
- **Brand differentiation goal?** _____________________________________

---

## Phase 5: Unification Strategy

### Step 5.1: Choose Base File

**Decision**: Use _____________ file as foundation (Design / Dev)

**Rationale**:
- ___________________________________________________________________
- ___________________________________________________________________

**Modifications Needed**:
- [ ] Remove emoji prefixes (if Design base)
- [ ] Add missing mobility services (if Design base)
- [ ] Restructure organization (if Dev base)
- [ ] Resolve value conflicts (both)
- [ ] Integrate unique tokens from other file

### Step 5.2: New Structure Plan

**Proposed Unified Structure**:
```
mooney-tokens/
├── primitives/
│   ├── colors/
│   │   ├── dark-blue
│   │   ├── turquoise
│   │   ├── yellow
│   │   └── ... (all color families)
│   ├── typography/
│   │   ├── font-family
│   │   ├── font-weight
│   │   ├── font-size
│   │   └── font-leading
│   └── spacing-radius/
│       └── (all spacing/radius values)
├── semantic/
│   ├── brand/
│   │   ├── primary
│   │   ├── secondary
│   │   ├── accent
│   │   └── gradient
│   ├── feedback/
│   │   ├── error
│   │   ├── warning
│   │   ├── success
│   │   └── info
│   ├── greyscale/
│   │   └── (black, white, greys, overlay)
│   └── whitelabel/
│       └── (extra tokens)
└── mobility/
    ├── bus
    ├── metro
    ├── train
    └── ... (all 22 services - if decided)
```

**Naming Convention**:
- Primitives: `{category}.{subcategory}.{scale}`
- Semantic: `{purpose}.{element}.{property}`
- Mobility: `{service}.{weight}` (light/medium/dark)

---

## Phase 6: Validation Checklist

Before considering audit complete:

### Completeness
- [ ] All 282 design tokens accounted for
- [ ] All 273 dev tokens accounted for
- [ ] All conflicts identified and documented
- [ ] All missing tokens have include/exclude decision
- [ ] Business context documented for major decisions

### Quality
- [ ] Naming conventions consistent
- [ ] No duplicate tokens
- [ ] All aliases resolve correctly
- [ ] W3C DTCG format compliance
- [ ] No emoji in token names

### Alignment
- [ ] Design team reviewed and approved
- [ ] Dev team reviewed and approved
- [ ] Product Owner approved (for mobility services)
- [ ] Brand Manager approved (for color conflicts)

### Documentation
- [ ] Audit findings documented
- [ ] Decisions recorded with rationale
- [ ] Change log created (old → new mappings)
- [ ] Migration guide drafted

---

## Phase 7: Create Unified File

### Step 7.1: Build Core.json

**Process**:
1. Copy base file (chosen in Step 5.1)
2. Remove emoji prefixes
3. Integrate unique tokens from other file
4. Apply conflict resolutions
5. Add/remove tokens per meeting decisions
6. Validate JSON syntax
7. Test Luckino import (small batch)

**Validation**:
- [ ] Valid JSON (no syntax errors)
- [ ] All references resolve (no broken aliases)
- [ ] Luckino import succeeds (no errors)
- [ ] Token count matches expectation: ______ tokens

### Step 7.2: Document Changes

**Change Log**:
| Old Token (Design) | Old Token (Dev) | New Token (Unified) | Reason for Change |
|--------------------|-----------------|---------------------|-------------------|
| `🎨 Colours - Brand MG.brand.primary` | `brand.primary` | `semantic.brand.primary` | Remove emoji, clarify semantic layer |
| _________________ | _________________ | _________________ | _________________ |
| _________________ | _________________ | _________________ | _________________ |

**Breaking Changes**:
- List any token name changes that will break existing code: _______________

**Migration Notes**:
- Instructions for design team: _______________
- Instructions for dev team: _______________

---

## Phase 8: Stakeholder Review

### Review Rounds

**Round 1: Technical Review**
- [ ] Design lead reviews unified file
- [ ] Dev lead reviews unified file
- [ ] Feedback collected
- [ ] Issues addressed

**Round 2: Business Review**
- [ ] Product Owner approves mobility services scope
- [ ] Brand Manager approves color decisions
- [ ] Sign-off received

**Round 3: Test Import**
- [ ] Import 10% of tokens to Luckino (pilot)
- [ ] Validate in Figma Variables
- [ ] Test token application to components
- [ ] Document any issues

**Final Approval**:
- [ ] All stakeholders approve unified file
- [ ] No blockers remaining
- [ ] Ready for full migration

---

## Audit Summary Template

**Audit Completed By**: ___________________
**Date**: ___________________

**Tokens Audited**:
- Design: 282 tokens
- Dev: 273 tokens
- Unified: ______ tokens

**Conflicts Resolved**:
- Bus colors: _____________ (Orange / Light Blue)
- Extra colors: _____________ (Purple / Brown)
- Mobility services: ______ services included
- Other: ___________________

**Tokens Added**:
- From design only: ______ tokens
- From dev only: ______ tokens
- New (created during unification): ______ tokens

**Tokens Removed**:
- Deprecated from design: ______ tokens
- Deprecated from dev: ______ tokens

**Structure Changes**:
- Emoji prefixes removed: Yes / No
- New grouping applied: Yes / No
- Naming convention standardized: Yes / No

**Status**: ☐ Draft ☐ Review ☐ Approved ☐ In Production

**Next Steps**:
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

---

## Tools & Resources

**JSON Validators**:
- https://jsonlint.com/
- VS Code JSON validation

**Token Tools**:
- Luckino plugin: [path/to/luckino]
- Token transformer: https://github.com/tokens-studio/sd-transforms

**Accessibility Checkers**:
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Colour Contrast Analyser: https://www.tpgi.com/color-contrast-checker/

**Reference Docs**:
- W3C DTCG Spec: https://design-tokens.github.io/community-group/format/
- Luckino documentation: [link]

---

## Appendix: Quick Reference

**File Locations**:
- Design: `/Users/mattia/Documents/Mattia/Progetti/Mooney/design/variables.json`
- Dev: `/Users/mattia/Documents/Mattia/Progetti/Mooney/censimento/jsonW3C-StatoAttuale.json`
- Unified (output): `/Users/mattia/Documents/Mattia/Progetti/Mooney/tokens/core.json`

**Key Decisions** (fill in after meeting):
- Mobility services: ☐ All 22 ☐ Subset ☐ Phased
- Bus colors: ☐ Orange ☐ Light Blue ☐ Other: _______
- Extra colors: ☐ Purple ☐ Brown ☐ Other: _______

**Stakeholder Contacts**:
- Product Owner: ___________________
- Brand Manager: ___________________
- Design Lead: ___________________
- Dev Lead: ___________________

---

**Version**: 1.0
**Created**: October 28, 2025
**Last Updated**: October 28, 2025

Use this template to systematically audit, reconcile, and unify the Mooney Design System tokens.