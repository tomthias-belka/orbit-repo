# Mooney Design System - Decision Framework

## Purpose

This framework provides structured guidance for resolving the critical conflicts identified in the Mooney Design System unification process. Use this to facilitate evidence-based decision-making during the team alignment meeting.

---

## How to Use This Framework

1. **For Each Conflict**: Work through the sections in order
2. **Gather Evidence**: Complete the "Evidence Collection" checklist
3. **Evaluate Options**: Score each option against criteria
4. **Make Decision**: Document decision and rationale
5. **Validate**: Confirm against success criteria

**Key Principle**: Decisions based on brand strategy, user needs, and business objectives — not personal preference.

---

## DECISION #1: Mobility Services Scope

### The Conflict
- **Design Team**: 22 mobility services defined
- **Dev Team**: 6 mobility services implemented
- **Gap**: 16 services missing (73% coverage gap)

### Evidence Collection Checklist

Before deciding, gather:

- [ ] **Product Roadmap Review**
  - Which mobility services are planned for launch in next 6 months?
  - Which are in research/exploration phase?
  - Which are deprioritized?

- [ ] **Client Contract Audit**
  - Which services are contractually committed to clients?
  - Do different whitelabel brands need different services?
  - Any penalties for missing services?

- [ ] **Competitive Analysis**
  - What services do competitors offer?
  - What's table stakes vs differentiation?

- [ ] **Usage Data** (if available)
  - Which services get most user engagement?
  - Which have highest conversion/revenue?
  - Which are rarely used?

- [ ] **Technical Effort Assessment**
  - Cost to include all 22 now: ______ hours
  - Cost to add 16 later: ______ hours
  - Risk of breaking changes if added later: Low / Medium / High

### Options Analysis

#### Option A: Include All 22 Services ✅ RECOMMENDED

**Pros**:
- ✓ Future-proofing for whitelabel clients
- ✓ Design work already complete
- ✓ No technical debt
- ✓ Flexibility for different brands to enable different services
- ✓ Cost of including now < cost of adding later

**Cons**:
- ✗ Slight increase in token file size (negligible)
- ✗ Some tokens may go unused initially (but available when needed)

**When to Choose**:
- Product roadmap shows potential for any of the 16 services
- Whitelabel clients have diverse needs
- Want to minimize future rework

**Estimated Effort**: 2-4 hours (just include existing design tokens)

---

#### Option B: Start with Subset (6 + Prioritized)

**Pros**:
- ✓ Only include what's immediately needed
- ✓ Smaller initial file size
- ✓ Focused scope for first launch

**Cons**:
- ✗ Creates technical debt (will need to add later)
- ✗ Rework when new services added (retesting, revalidation)
- ✗ Potential breaking changes
- ✗ Limits whitelabel flexibility
- ✗ Must decide which services to prioritize (requires additional meeting)

**When to Choose**:
- Product roadmap confirms 16 services will NEVER be needed
- Strict performance constraints (not applicable here)
- Team bandwidth severely limited (not applicable - tokens already designed)

**Estimated Effort**: 1-2 hours initially, then 6-10 hours per new service added later

---

#### Option C: Include All, Mark Some "Inactive"

**Pros**:
- ✓ All tokens present in system (future-ready)
- ✓ Can activate services per brand via configuration
- ✓ No rework when service becomes active
- ✓ Clear documentation of what's available vs active

**Cons**:
- ✗ Requires additional "active/inactive" metadata layer
- ✗ More complex initial setup

**When to Choose**:
- Want flexibility but need to clearly communicate what's "ready for production"
- Different brands will activate different services

**Estimated Effort**: 4-6 hours (including metadata layer)

---

### Decision Matrix

| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| Future-proofing | 30% | 10/10 | 4/10 | 9/10 |
| Implementation effort (now) | 20% | 8/10 | 9/10 | 6/10 |
| Flexibility for whitelabel | 25% | 10/10 | 5/10 | 10/10 |
| Maintenance burden | 15% | 9/10 | 6/10 | 7/10 |
| Technical debt avoidance | 10% | 10/10 | 3/10 | 9/10 |
| **WEIGHTED SCORE** | | **9.15** | **5.65** | **8.65** |

---

### Decision Template

**DECISION**: We choose Option _____ (A / B / C)

**RATIONALE**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**EVIDENCE CONSIDERED**:
- Product roadmap: ____________________________________________________________
- Client contracts: ___________________________________________________________
- Technical effort: ___________________________________________________________
- Competitive landscape: ______________________________________________________

**DECISION OWNER**: ___________________ (Product Owner / Design System Lead)

**VALIDATION CRITERIA**:
- [ ] Decision aligns with product roadmap
- [ ] Stakeholders (Product, Eng, Design) agree
- [ ] Documented in design system docs
- [ ] Communicated to all teams

**IF OPTION B CHOSEN**: Specify which services to include:
- Core 6: bus, metro, train, garage, garage-telepass, sharing
- Additional: ________________________________________________________________

---

## DECISION #2: Bus Service Colors

### The Conflict
- **Design Team**: Orange-based palette (warm, earthy)
- **Dev Team**: Light Blue-based palette (cool, tech)

### Evidence Collection Checklist

- [ ] **Brand Guidelines Audit**
  - Do guidelines specify colors for bus services? Page/section: __________
  - What's the general brand color strategy (warm vs cool)? __________
  - Any existing color → service mappings? __________

- [ ] **User Research**
  - Any user testing on color associations for mobility? Study: __________
  - Color preference data? __________
  - Accessibility testing results? __________

- [ ] **Current Implementations**
  - What color is currently used in production app? __________
  - User complaints or feedback about current colors? __________
  - Analytics on engagement with bus features? __________

- [ ] **Competitive Benchmark**
  - Top 5 mobility apps - what colors for bus? __________
    1. ______________ : ______________
    2. ______________ : ______________
    3. ______________ : ______________
    4. ______________ : ______________
    5. ______________ : ______________

- [ ] **Accessibility Check**
  - Orange palette WCAG AA compliance: Pass / Fail
  - Light Blue palette WCAG AA compliance: Pass / Fail
  - Which has better contrast ratios? __________

### Options Analysis

#### Option A: Orange/Brown (Design Choice)

**Color Values**:
- Light: Orange-100 (#fef0e5)
- Medium: Orange-750 (#f26a1f)
- Dark: Brown-800 (#bd590d)

**Pros**:
- ✓ Warm, earthy association (buses = ground transport)
- ✓ Distinct from other transit types (if metro = blue, train = green)
- ✓ Memorable, stands out in UI

**Cons**:
- ✗ May conflict with warning/alert colors (often orange)
- ✗ Less common in mobility apps (trend is cool blues)

**User Psychology**: Orange = energy, warmth, accessibility (public transport)

---

#### Option B: Light Blue (Dev Choice)

**Color Values**:
- Light: Light Blue-200 (#ddf1ff)
- Medium: Light Blue-650 (#4286f5)
- Dark: Light Blue-750 (#007eb5)

**Pros**:
- ✓ Cool, tech-forward
- ✓ Common in mobility apps (familiarity)
- ✓ Associated with movement, sky, travel

**Cons**:
- ✗ May be too similar to metro (if metro also blue)
- ✗ Less distinct visually (blends with other transit)

**User Psychology**: Blue = trust, calm, technology (modern mobility)

---

#### Option C: Different Palette (New)

**Only choose if**:
- Both existing options fail accessibility
- Brand guidelines mandate different color
- User research shows strong preference for something else

---

### Decision Criteria

| Criterion | Orange/Brown | Light Blue | Notes |
|-----------|--------------|------------|-------|
| **Brand Alignment** | ___/10 | ___/10 | Check guidelines |
| **Accessibility (WCAG AA)** | ___/10 | ___/10 | Run contrast tests |
| **User Familiarity** | ___/10 | ___/10 | Competitive benchmark |
| **Visual Distinction** | ___/10 | ___/10 | Differentiation from other services |
| **Current Implementation** | ___/10 | ___/10 | If one is already in production, migration cost |

---

### Decision Template

**DECISION**: Bus service colors will be _____________________ (Orange/Brown / Light Blue / Other)

**RATIONALE**:
_____________________________________________________________________________
_____________________________________________________________________________

**EVIDENCE CONSIDERED**:
- Brand guidelines: ___________________________________________________________
- User research: ______________________________________________________________
- Current implementation: _____________________________________________________
- Accessibility: ______________________________________________________________
- Competitive benchmark: ______________________________________________________

**DECISION OWNER**: ___________________ (Brand Manager / Product Owner)

**VALIDATION CRITERIA**:
- [ ] WCAG AA accessibility confirmed (contrast ratio ≥ 4.5:1)
- [ ] Brand team approves
- [ ] Design and dev teams aligned
- [ ] Documented in brand guidelines

---

## DECISION #3: Whitelabel (-extra) Colors

### The Conflict
- **Design Team**: Purple-based (modern, high contrast)
- **Dev Team**: Brown-based (earthy, warm)

### Evidence Collection Checklist

- [ ] **Whitelabel Brand Strategy**
  - What's the intended persona for whitelabel brands? __________
  - Should whitelabel feel different from main brand? Yes / No
  - Color strategy for differentiation? __________

- [ ] **Accessibility Priority**
  - Are all whitelabel brands B2C (high accessibility needs)? Yes / No
  - B2B clients (lower accessibility needs)? Yes / No
  - WCAG compliance requirement? AA / AAA

- [ ] **Client Preferences** (if known)
  - Brand 2 color preference: __________
  - Brand 3 color preference: __________
  - Brand 4 color preference: __________

### Options Analysis

#### Option A: Purple (Design Choice) ✅ RECOMMENDED

**Color Values**:
- Light: Purple-300 (#f0d1ff)
- Medium: Purple-600 (#ae3ce7)
- Dark: Purple-800 (#622282)

**Pros**:
- ✓ High contrast (better accessibility)
- ✓ Modern, tech-forward
- ✓ Distinct from primary MooneyGo brand (blue/turquoise)
- ✓ Perplexity recommends for WCAG AA compliance

**Cons**:
- ✗ Less common in fintech/mobility (but that's good for differentiation)

**Accessibility**: Typically strong contrast ratios

---

#### Option B: Brown (Dev Choice)

**Color Values**:
- Light: Brown-200 (#f3ad8b)
- Medium: Brown-800 (#bd590d)
- Dark: Brown-900 (#9c540e)

**Pros**:
- ✓ Warm, earthy (reliability, trust)
- ✓ Different feel from primary brand

**Cons**:
- ✗ Lower contrast ratios (potential accessibility issues)
- ✗ Can appear dated or dull
- ✗ Less common in tech products (for good reason)

**Accessibility**: Needs validation (browns often struggle with contrast)

---

### Decision Matrix

| Criterion | Weight | Purple | Brown |
|-----------|--------|--------|-------|
| Accessibility (WCAG AA) | 40% | 9/10 | 6/10 |
| Brand differentiation | 25% | 9/10 | 7/10 |
| Modern appearance | 20% | 10/10 | 5/10 |
| Versatility across brands | 15% | 9/10 | 7/10 |
| **WEIGHTED SCORE** | | **8.95** | **6.3** |

---

### Decision Template

**DECISION**: Whitelabel (-extra) colors will be _____________________ (Purple / Brown / Other)

**RATIONALE**:
_____________________________________________________________________________
_____________________________________________________________________________

**EVIDENCE CONSIDERED**:
- Accessibility testing: _______________________________________________________
- Whitelabel strategy: ________________________________________________________
- Client preferences: _________________________________________________________

**DECISION OWNER**: ___________________ (Brand Manager / Design System Lead)

**VALIDATION CRITERIA**:
- [ ] WCAG AA compliance confirmed for all shades
- [ ] Tested against MooneyGo brand (sufficient differentiation)
- [ ] Design and dev teams aligned
- [ ] Documented in whitelabel brand guidelines

---

## General Decision-Making Guidelines

### When Evidence is Insufficient

If you can't gather enough evidence to decide:

1. **Choose the option with lower future cost**
   - Easier to change later = less risk
   - Example: Including all 22 services is lower risk than subset (can deactivate, can't easily add)

2. **Default to accessibility**
   - If in doubt, choose the more accessible option
   - Example: Purple over brown if contrast ratios are better

3. **Align with brand strategy**
   - When technical options are equivalent, brand wins
   - Example: If brand guidelines lean warm, choose warm colors

4. **Consult users**
   - If available, run quick user test (A/B)
   - Example: Show bus in both colors to 10 users, measure preference

### When Stakeholders Disagree

If Brand Manager and Product Owner conflict:

1. **Identify the underlying need**
   - What's the real concern behind each position?
   - Often reveals a third option that satisfies both

2. **Escalate with data**
   - Present evidence matrix
   - Show weighted scores
   - Let data guide (removes emotion)

3. **Executive tie-breaker**
   - If genuinely deadlocked, escalate to executive sponsor
   - Provide recommendation + rationale

### Documenting Decisions

Every decision must include:
- ✅ What was decided
- ✅ Why (rationale with evidence)
- ✅ Who made the decision (owner)
- ✅ When decision was made (date)
- ✅ How to validate decision was correct (criteria)

**Where to document**:
- Immediate: This framework (fill in templates)
- Permanent: Design system documentation site
- Communication: Slack announcement + meeting notes

---

## Post-Decision Validation

After making decisions, validate within 1 week:

### For Mobility Services Decision:
- [ ] Token file includes decided services
- [ ] Documentation explains which services are available
- [ ] If subset chosen: roadmap for adding others documented

### For Color Decisions:
- [ ] WCAG AA compliance tested and confirmed
- [ ] Colors added to brand guidelines
- [ ] Design files updated
- [ ] Dev implementation tested

### For All Decisions:
- [ ] All stakeholders notified
- [ ] No blockers raised
- [ ] Team alignment achieved

---

## Decision Reversal Process

If you need to reverse a decision later:

1. **Document why reversal is needed**
   - New evidence?
   - Unforeseen consequence?
   - Stakeholder feedback?

2. **Assess impact**
   - Breaking change?
   - Migration needed?
   - User-facing impact?

3. **Follow change management process**
   - For breaking changes: major version bump, deprecation notice
   - For non-breaking: minor version bump, documentation update

4. **Learn from it**
   - What could we have foreseen?
   - Update decision framework for future

---

## Success Criteria for Decision-Making

A good decision:
- ✅ Based on evidence, not opinion
- ✅ Aligned with brand strategy and business goals
- ✅ Considers accessibility and user needs
- ✅ Has clear owner and rationale
- ✅ Documented for future reference
- ✅ Achieves stakeholder alignment

A bad decision:
- ❌ Based on personal preference
- ❌ Made without gathering evidence
- ❌ Ignores accessibility or brand guidelines
- ❌ No clear owner or rationale
- ❌ Not documented
- ❌ Leaves team divided

---

## Quick Reference: Decision Owners

| Decision Type | Primary Owner | Approver | Consulted |
|---------------|---------------|----------|-----------|
| Mobility Services Scope | Product Owner | Executive Sponsor | Design, Dev, Clients |
| Color Choices | Brand Manager | Product Owner | UX Research, Design |
| Token Architecture | Design System Lead | Engineering Manager | Design, Dev teams |
| Naming Conventions | Design System Lead | Design & Dev Leads | Both teams |
| Governance Model | Design System Lead | Executive Sponsor | All teams |

---

**Version**: 1.0
**Created**: October 28, 2025
**Last Updated**: October 28, 2025

Use this framework during the team alignment meeting to make structured, evidence-based decisions that the entire team can support.