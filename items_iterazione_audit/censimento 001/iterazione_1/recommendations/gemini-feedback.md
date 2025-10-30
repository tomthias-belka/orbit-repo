# Gemini CLI - Strategic Feedback Summary

## Date
October 28, 2025

## Context
Gemini CLI was consulted for strategic analysis of the Mooney Design System unification challenge after initial analysis revealed critical divergence between design and development teams.

---

## Key Recommendations

### 1. Source of Truth Decision

**Recommendation**: Use Design Team file (`design/variables.json`) as the foundation

**Rationale**:
- **Completeness**: Contains all 22 mobility services (vs 6 in dev file)
- **Structure Superiority**: Hierarchical organization (Primitives → Brand → Mobility) is more robust and scalable
- **Closer to Target**: Already near the desired 3-tier model
- **Less Rework**: Easier to fix formatting issues than rebuild entire structure and add 16 missing services

**Action Items**:
1. Duplicate `design/variables.json` → `tokens/core.json`
2. Remove emoji prefixes via find/replace
3. Integrate unique tokens from dev file
4. Mark conflicts for team decision

---

### 2. Unification Process (4 Steps)

#### Step 1: Create New Master File
- Start with `design/variables.json` as base
- Name: `tokens/core.json`
- This becomes the single source of truth

#### Step 2: Remove Emoji Prefixes
Transform:
```
🎨 Colors → Colors
🔠 Typography → Typography
⬛️ Primitives → Primitives
```

**Why Critical**: Luckino plugin cannot parse emoji in group names

#### Step 3: Integrate Missing Tokens
- Audit `censimento/jsonW3C-StatoAttuale.json` for unique tokens
- Add any necessary tokens not in design file
- Document why each token is included

#### Step 4: Flag Conflicts (Don't Resolve)
- Document conflicts clearly
- Do NOT choose winner without stakeholder input
- Conflicts are business decisions, not technical ones

---

### 3. Color Conflict Resolution Strategy

**Problem**: Different palettes for same services
- Bus: Orange (design) vs Light Blue (dev)
- -extra: Purple (design) vs Brown (dev)

**Gemini's Approach**:

#### Don't Choose a Technical Winner
This is NOT a technical decision. The "right" color is a **brand and product decision**.

#### Prepare Visual Comparison
- Create mockups showing both options
- Same component (e.g., bus ticket, banner) with both palettes
- Side-by-side comparison for stakeholders

#### Frame as Business Question
**Bad question**: "Which color is right?"

**Good questions**:
- "What brand experience do we want for bus services?"
- "Which palette better supports our vision?"
- "What do user research/testing show?"

#### Decision Ownership
- Product Owner or Brand Owner makes final call
- Document decision and rationale
- Add to design system documentation for future reference

---

### 4. Whitelabel Architecture (3-Tier Confirmed)

**Gemini confirms industry best practice**:

### Layer 1: Primitives (Global/Core)
- **Purpose**: Foundation values, immutable across brands
- **Examples**: `color.blue.500`, `spacing.md`, `font.size.16`
- **Location**: `tokens/core.json` (becomes this after cleanup)

### Layer 2: Semantic (Brand-Switchable)
- **Purpose**: Give contextual meaning, enable multi-brand
- **Examples**: `color.text.primary`, `color.background.surface`
- **Key Feature**: Multi-mode values
- **Location**: `tokens/semantic.json` (NEW FILE TO CREATE)

### Layer 3: Component (Specific Use)
- **Purpose**: Component-specific overrides (15-20% of tokens)
- **Examples**: `button.primary.background`, `card.border.radius`
- **Location**: `tokens/component.json` (future phase)

**Critical**: Layer 2 (Semantic) is currently **missing** and must be built

---

### 5. Multi-Mode Token Structure

**Gemini Example** (W3C DTCG compliant):

```json
{
  "color.background.surface": {
    "$type": "color",
    "$value": {
      "base": "{color.white.base}",
      "mooneygo": "{color.white.base}",
      "brand-2": "{color.grey.100}",
      "brand-3": "{color.off-white.base}"
    },
    "$description": "Primary surface background color"
  }
}
```

**Key Points**:
- Use `"base"` (or `"default"`) for primary theme
- Clear, predictable names for other modes (`mooneygo`, `flowe`, etc.)
- Both Luckino and Style Dictionary must support this format
- Generates Figma Variable Modes automatically

---

### 6. Team Alignment Meeting Structure

**Duration**: 45 minutes (strict timing)

**Objective**: Make rapid, binding decisions

#### Agenda Breakdown:

**1. State of the Union (5 min)**
- Show the numbers: 282 vs 273 tokens, 22 vs 6 services
- Visualize the cost of divergence
- Create sense of urgency

**2. Proposed Strategy (10 min)**
- Present recommendation: unify from design file
- Explain why (completeness, structure, less rework)
- Show the 3-tier architecture vision

**3. Decision #1: Services Scope (15 min)**
- Show list of 16 missing mobility services
- **Ask Product Owner**: "For whitelabel launch, do we need all 22 or can we start with documented subset?"
- **Get clear answer** (not "we'll think about it")
- Document decision

**4. Decision #2: Color Conflicts (10 min)**
- Show visual comparisons (bus, -extra)
- **Ask Brand/Product Owner**: Choose palette for each
- **Get definitive choice**
- Document rationale

**5. Next Steps & Ownership (5 min)**
- Action: Finalize `core.json` (Designer owner)
- Action: Create `semantic.json` (Designer owner)
- Action: Dev team tests in branch (Tech Lead owner)
- Schedule follow-up review

**Meeting Rules**:
- No decisions deferred
- All conflicts resolved or explicitly documented as future work
- Clear owners for every action
- Follow-up meeting scheduled before leaving

---

### 7. Critical Success Factors

Gemini emphasizes these as non-negotiable:

1. **Single Source of Truth**
   - One file, not two
   - Design and dev use same file
   - Version controlled in Git

2. **Stakeholder Ownership of Conflicts**
   - Don't guess at business decisions
   - Get Product/Brand team to decide
   - Document reasoning

3. **Semantic Layer is Key**
   - This is where multi-brand magic happens
   - Must be built before component layer
   - Links primitives to usage

4. **Luckino Compatibility Testing**
   - Test import early and often
   - Small batch first (10% of tokens)
   - Validate before full migration

5. **Team Communication**
   - Design and dev must align NOW
   - Cost of delay increases daily
   - Parallel work = wasted work

---

## Gemini's Risk Assessment

### Highest Risk: Continued Divergence
If teams keep working separately:
- Wasted development effort (people working on conflicting versions)
- Growing technical debt (harder to reconcile later)
- Delayed whitelabel launch
- Team frustration and confusion

**Mitigation**: IMMEDIATE alignment meeting

### Medium Risk: Incomplete Requirements
Without Product Owner input on mobility services:
- May build wrong thing
- Rework required later
- Client expectations mismatch

**Mitigation**: Validate with product roadmap and client contracts

### Lower Risk: Breaking Changes
Unification will change token paths/names:
- Some code may break
- Figma files need updates

**Mitigation**:
- Maintain old tokens with deprecation warnings
- Provide migration scripts
- Phased rollout (pilot first)

---

## Gemini's Closing Advice

> "The foundation is solid (primitives are consistent). The problem is organizational, not technical. Fix the communication first, then the architecture falls into place naturally."

**Translation**:
- Colors and spacing are already aligned ✅
- The gap is in semantics and team process ❌
- Bring teams together FIRST
- Technical unification is easier once aligned

---

## Recommended Reading Order

If sharing this with team:
1. Start with "Source of Truth Decision" (sets direction)
2. Show "Color Conflict Resolution Strategy" (explains process)
3. Present "Team Alignment Meeting Structure" (gives action plan)
4. Reference "Whitelabel Architecture" as technical foundation

---

## Next Steps Based on Gemini Feedback

1. ✅ Schedule 45-minute alignment meeting (this week)
2. ✅ Prepare visual comparisons for color conflicts
3. ✅ Create agenda following Gemini's structure
4. ✅ Identify Product Owner and Brand Owner to attend
5. ✅ Create `tokens/core.json` from design file (post-meeting)
6. ✅ Plan `tokens/semantic.json` structure

---

## Implementation Priority

**Week 1** (NOW):
- Team alignment meeting
- Resolve all conflicts
- Get stakeholder decisions

**Week 2**:
- Create unified `core.json`
- Remove emoji prefixes
- Test Luckino import

**Week 3**:
- Design `semantic.json` structure
- Add multi-mode values
- Validate 4-brand switching

---

## Validation Checklist

Before considering unification "done":
- [ ] Single `core.json` file exists
- [ ] All emoji removed
- [ ] Luckino import successful (no errors)
- [ ] All conflicts resolved or documented
- [ ] Product Owner approved mobility services scope
- [ ] Brand Owner approved color palettes
- [ ] Semantic layer structure defined
- [ ] Both teams using same file

---

## Contact for Questions

This summary synthesizes Gemini CLI's strategic recommendations. For clarification on any point, refer back to the original Gemini conversation or consult the design system lead.

**Key Principle from Gemini**:
*"Unify the teams first, unify the tokens second. Architecture follows alignment."*