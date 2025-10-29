# Mooney Design System - Team Alignment Meeting Agenda

## Meeting Details

**Duration**: 45 minutes (STRICT - decisions must be made)
**Objective**: Make rapid, binding decisions to unify design system
**Required Attendees**:
- Design Team Lead
- Development Team Lead
- Product Owner
- Brand Manager (for color decisions)
- Design System Facilitator (you)

**Optional Attendees**:
- UX Research Lead (for data on color/service priorities)
- Engineering Manager

**Pre-Work Required**:
- All attendees review [MOONEY_DS_ANALYSIS_FOR_PERPLEXITY.md](../MOONEY_DS_ANALYSIS_FOR_PERPLEXITY.md)
- Product Owner reviews mobility services list
- Brand Manager reviews brand guidelines

---

## Agenda Breakdown (45 Minutes)

### 1. STATE OF THE UNION (5 minutes)

**Facilitator Presents**:

#### The Numbers
- Design Team: 282 tokens, 22 mobility services, excellent structure ❌ emoji prefixes
- Dev Team: 273 tokens, 6 mobility services, plugin-compatible ❌ 73% gap
- **Result**: Teams working in silos, divergent implementations

#### Visual Impact
*Show slide 2 from presentation: Executive Summary*
- 22 vs 6 mobility services
- Multiple color conflicts
- Urgency Level: **CRITICAL**

#### The Cost
- Wasted development effort (duplicate work)
- Growing technical debt (harder to reconcile daily)
- Delayed whitelabel launch
- Team frustration and confusion

**Key Message**: "We can't continue on separate paths. Today we unify."

---

### 2. PROPOSED STRATEGY (10 minutes)

**Facilitator Presents**:

#### Recommendation: Use Design File as Foundation

**Why?**
- More complete (all 22 mobility services)
- Better structure (Primitives → Brand → Mobility)
- Closer to target 3-tier architecture
- Less rework than rebuilding dev file

**What needs to change?**
- Remove emoji prefixes (breaks Luckino)
- Integrate any unique dev tokens
- Resolve conflicts with stakeholder decisions

#### The 3-Tier Architecture Vision

*Show slide 8 from presentation: Three-Tier Token System*

```
┌─────────────────────────────────────────┐
│  Layer 3: Component Tokens              │
│  (button.primary.background)            │
├─────────────────────────────────────────┤
│  Layer 2: Semantic Tokens               │ ← KEY FOR MULTI-BRAND
│  (color.text.primary)                   │
│  Multi-mode: {base, mooneygo, brand2...}│
├─────────────────────────────────────────┤
│  Layer 1: Global Primitives             │
│  (colors.blue.500)                      │
│  Immutable across brands                │
└─────────────────────────────────────────┘
```

**What this enables**:
- 4-brand whitelabel from single source
- One component, multiple brand appearances
- Easy maintenance (change once, applies everywhere)

#### Timeline Preview
- Phase 1 (Week 1-2): This meeting + conflict resolution
- Phase 2-4 (Week 3-8): Build unified system
- Phase 5-7 (Week 9-14): Migrate and validate

**Open Floor for Questions** (3 minutes)
- Concerns about approach?
- Technical blockers?
- Resource availability?

---

### 3. DECISION #1: Mobility Services Scope (15 minutes)

**Facilitator Frames the Question**:

"The design team has defined 22 mobility services. The dev file only has 6 (27% coverage). We need to decide: For the whitelabel launch, do we need all 22 services, or can we start with a documented subset?"

#### The 22 Services (Current Design)

**Implemented (6)**:
- ✓ bus
- ✓ metro
- ✓ train
- ✓ garage
- ✓ garage-telepass
- ✓ sharing

**Missing - Common Services (5)**:
- ✗ taxi
- ✗ parking
- ✗ car-rental
- ✗ charging-station
- ✗ airports

**Missing - Transit (3)**:
- ✗ pullman
- ✗ tram
- ✗ harbor

**Missing - Specialized (5)**:
- ✗ ncc
- ✗ skipass
- ✗ favorites
- ✗ walk
- ✗ ztl

**Missing - New (3)**:
- ✗ places
- ✗ apparked
- ✗ experience

#### Questions for Product Owner

1. **Which brands need which services?**
   - MooneyGo: all 22?
   - Brand 2: subset?
   - Brand 3/4: different subset?

2. **What's in the product roadmap?**
   - Next 6 months: which services launching?
   - Client contracts: which services committed?

3. **Cost-benefit analysis**:
   - Cost of including now: minimal (tokens already designed)
   - Cost of adding later: significant (rework, retesting, client updates)

#### Recommendation (Both Gemini & Perplexity)
✅ **Include all 22 services**

**Rationale**:
- Design team has already done the mapping work
- Future-proofing for whitelabel clients
- Some brands may need niche services (skipass for mountain regions, harbor for coastal cities)
- Cost of including now < cost of adding later
- Missing 73% creates unnecessary technical debt

#### DECISION REQUIRED

**Product Owner decides**:
- [ ] Option A: Include all 22 services ✅ RECOMMENDED
- [ ] Option B: Start with subset (must specify which services + rationale)
- [ ] Option C: Include all in token system, mark some as "inactive" for now

**Document Decision**:
- Decision: _______________________________________________
- Rationale: _______________________________________________
- Owner for validation: _______________________________________________

---

### 4. DECISION #2: Color Conflicts (10 minutes)

**Facilitator Frames**:

"We have two critical color conflicts where design and dev teams chose different palettes for the same services. These are **brand decisions**, not technical ones. Brand Manager, we need your input."

#### Conflict #1: Bus Service Colors

*Show slide 6 from presentation: Critical Color Discrepancies*

**Design Team Choice**: Orange-based
- Light: Orange-100 (#fef0e5)
- Medium: Orange-750 (#f26a1f)
- Dark: Brown-800 (#bd590d)

**Dev Team Choice**: Light Blue-based
- Light: Light Blue-200 (#ddf1ff)
- Medium: Light Blue-650 (#4286f5)
- Dark: Light Blue-750 (#007eb5)

**Visual Comparison**:
```
DESIGN:  🟠 Orange/Brown (warm, earthy)
DEV:     🔵 Light Blue (cool, tech)
```

#### Questions for Brand Manager

1. **Brand Guidelines**: Do existing guidelines specify bus service colors?
2. **User Research**: Any testing data on color associations for bus services?
3. **Existing Implementations**: What's currently in production apps?
4. **Competitor Benchmark**: What colors do other mobility apps use for bus?

#### Conflict #2: Whitelabel (-extra) Colors

**Design Team Choice**: Purple-based
- Light: Purple-300 (#f0d1ff)
- Medium: Purple-600 (#ae3ce7)
- Dark: Purple-800 (#622282)

**Dev Team Choice**: Brown-based
- Light: Brown-200 (#f3ad8b)
- Medium: Brown-800 (#bd590d)
- Dark: Brown-900 (#9c540e)

**Perplexity Recommendation**: ✅ **Purple**
**Rationale**: Higher contrast, better WCAG AA accessibility, more distinct from primary brand

#### DECISIONS REQUIRED

**Brand Manager decides**:

**Bus Service Colors**:
- [ ] Option A: Orange/Brown (Design choice)
- [ ] Option B: Light Blue (Dev choice)
- [ ] Option C: Different palette (specify: _______________)

**Whitelabel (-extra) Colors**:
- [ ] Option A: Purple (Design choice) ✅ RECOMMENDED
- [ ] Option B: Brown (Dev choice)
- [ ] Option C: Different palette (specify: _______________)

**Document Decisions**:
- Bus decision: _______________________________________________
- Bus rationale: _______________________________________________
- Extra decision: _______________________________________________
- Extra rationale: _______________________________________________

**Action Item**: Validate chosen colors meet WCAG AA accessibility (Owner: _________)

---

### 5. NEXT STEPS & OWNERSHIP (5 minutes)

**Facilitator Summarizes Decisions Made**:

1. Source of truth: [Design / Dev / Other]
2. Mobility services: [All 22 / Subset / Phased]
3. Bus colors: [Orange / Light Blue / Other]
4. Extra colors: [Purple / Brown / Other]

#### Immediate Action Items (Week 1-2)

**Action 1**: Create unified `tokens/core.json` file
- **Owner**: Design System Lead
- **Input**: Design file + decisions from today
- **Output**: Single JSON file, emoji removed, conflicts resolved
- **Due**: End of Week 1

**Action 2**: Test Luckino import with unified file
- **Owner**: Design Team Lead
- **Input**: core.json from Action 1
- **Test**: Import 10% of tokens (pilot)
- **Success Criteria**: Zero import errors
- **Due**: End of Week 1

**Action 3**: Create semantic layer structure
- **Owner**: Design System Lead
- **Input**: core.json + 3-tier architecture plan
- **Output**: `tokens/semantic.json` draft with multi-mode structure
- **Due**: End of Week 2

**Action 4**: Dev team branch testing
- **Owner**: Dev Team Lead
- **Input**: Unified token files
- **Test**: Integrate in test branch, validate token consumption
- **Success Criteria**: Components render correctly with new tokens
- **Due**: End of Week 2

**Action 5**: Validate accessibility for chosen colors
- **Owner**: [Assign to Brand Manager or UX Researcher]
- **Input**: Decided color palettes
- **Tool**: WCAG contrast checker
- **Output**: Accessibility report (pass/fail for AA)
- **Due**: End of Week 1

#### Follow-Up Meeting

**Scheduled For**: [Insert Date/Time - End of Week 2]
**Agenda**:
- Review Action Item progress
- Address any blockers
- Approve unified core.json file
- Plan Phase 2 (Semantic Layer)

#### Communication Plan

**Announce to Teams**:
- Slack channels: #design-system, #engineering, #design
- Message: "Design system unification kickoff - decisions made today, see summary"
- Link: [This document after decisions filled in]

**Weekly Updates**:
- Every Friday: Progress update in Slack
- Owner: Design System Lead
- Format: Action items status + blockers + next week preview

---

## Meeting Rules & Norms

1. **No Deferred Decisions**
   - All conflicts must be resolved or explicitly documented as "future work"
   - "We'll think about it" is not acceptable today

2. **Data-Driven When Possible**
   - Refer to brand guidelines
   - Cite user research
   - Check existing implementations

3. **Business Context Over Personal Preference**
   - Decisions based on brand, users, business needs
   - Not "I like blue better than orange"

4. **Clear Ownership**
   - Every action item has one owner (not "the team")
   - Every decision has documented rationale

5. **Time Discipline**
   - Facilitator manages time strictly
   - If discussion stalls, Brand Manager / Product Owner makes final call

---

## Pre-Meeting Preparation Checklist

**Design System Facilitator (You)**:
- [ ] Open HTML presentation ([index.html](../mooney-ds-presentation/index.html))
- [ ] Print this agenda (or share screen-ready)
- [ ] Prepare visual color comparisons (screenshots)
- [ ] Have both token files open for reference
- [ ] Set up timer for agenda sections

**Product Owner**:
- [ ] Review 22 mobility services list
- [ ] Check product roadmap for service priorities
- [ ] Review client contracts for committed services
- [ ] Come prepared to make decisions

**Brand Manager**:
- [ ] Review brand guidelines for color specifications
- [ ] Check existing bus service implementations in app
- [ ] Bring any user research on color associations
- [ ] Come prepared to make decisions

**Design Team Lead**:
- [ ] Review design/variables.json file
- [ ] Be ready to explain design decisions
- [ ] Prepared to commit to emoji removal

**Dev Team Lead**:
- [ ] Review censimento/jsonW3C-StatoAttuale.json
- [ ] Identify any unique dev tokens to preserve
- [ ] Estimate effort for testing unified file

---

## Post-Meeting Actions

**Facilitator** (immediately after meeting):
1. Update this document with filled-in decisions
2. Create action item tracking doc
3. Schedule follow-up meeting
4. Send summary to all attendees
5. Announce in Slack channels

**All Attendees**:
1. Begin assigned action items
2. Flag blockers immediately (don't wait for follow-up)
3. Update status in action item tracker

---

## Success Criteria for This Meeting

✓ All conflicts resolved or explicitly scoped as future work
✓ Source of truth decision made
✓ Mobility services scope decided
✓ Color conflicts resolved
✓ All action items have owners and due dates
✓ Follow-up meeting scheduled
✓ Team understands next steps

If all criteria met → Meeting successful ✅
If any criteria not met → Schedule emergency follow-up 🚨

---

## Emergency Contact

If meeting runs into issues:
- **Escalation Path**: [Insert executive sponsor if needed]
- **Backup Facilitator**: [Insert name if facilitator unavailable]

---

## Appendix: Reference Documents

Available in `iterazione_1/` folder:
- [MOONEY_DS_ANALYSIS_FOR_PERPLEXITY.md](../MOONEY_DS_ANALYSIS_FOR_PERPLEXITY.md) - Full analysis
- [gemini-feedback.md](../recommendations/gemini-feedback.md) - Gemini strategic recommendations
- [perplexity-strategy.md](../recommendations/perplexity-strategy.md) - 7-phase implementation plan
- [HTML Presentation](../mooney-ds-presentation/index.html) - Visual presentation assets
- [Token Comparison CSV](../mooney-ds-presentation/mooney_token_comparison.csv) - Detailed token audit
- [Mobility Coverage CSV](../mooney-ds-presentation/mooney_mobility_coverage.csv) - Service-by-service comparison
- [Color Conflicts CSV](../mooney-ds-presentation/mooney_color_conflicts.csv) - Detailed color conflicts

---

**Version**: 1.0
**Created**: October 28, 2025
**Last Updated**: October 28, 2025