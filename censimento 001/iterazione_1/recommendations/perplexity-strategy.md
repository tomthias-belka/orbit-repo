# Perplexity AI - 7-Phase Unification Strategy Summary

## Date
October 28, 2025

## Overview
Perplexity AI provided a comprehensive 7-phase implementation plan spanning 14 weeks, complete with detailed governance model, risk mitigation strategies, and success metrics. A professional HTML presentation (15 slides) was also generated.

---

## 7-Phase Implementation Plan

### PHASE 1: Immediate Actions (Week 1-2)

#### 1.1 Team Alignment Meeting
**Objectives**:
- Present findings to both design and dev teams
- Establish shared understanding of conflicts
- Agree on source of truth approach
- Create decision-making framework

**Deliverables**:
- Meeting notes with decisions documented
- Conflict resolution matrix
- Agreed source of truth (expected: design file)

#### 1.2 Token Audit & Validation
**Activities**:
- Map all 282 design tokens to 273 dev tokens
- Document each conflict with business context
- Interview stakeholders for mobility service priorities
- Validate color palette choices with brand team

**Deliverables**:
- Token comparison spreadsheet
- Stakeholder interview summary
- Business context for each conflict

---

### PHASE 2: Architectural Decisions (Week 3-4)

#### 2.1 Three-Tier Token Architecture ✅ RECOMMENDED

**Layer 1: Global Primitives (Foundation)**
- All base colors, spacing, typography
- Immutable across brands
- Example tokens: `colors.blue.500`, `spacing.md`, `font.size.16`
- **No brand-specific values here**

**Layer 2: Semantic Tokens (Brand-Switchable)** ⭐ KEY DIFFERENTIATOR
- Purpose-based tokens with multi-mode values
- Enable 4-brand theming without duplication
- Example structure:
```json
{
  "color.text.primary": {
    "$type": "color",
    "$value": {
      "base": "{colors.gray.900}",
      "mooneygo": "{colors.brand.mg.primary}",
      "brand2": "{colors.brand.b2.primary}",
      "brand3": "{colors.brand.b3.primary}",
      "brand4": "{colors.brand.b4.primary}"
    }
  }
}
```

**Layer 3: Component Tokens (Specific Use)**
- 15-20% of total tokens (for exceptions only)
- Component-specific overrides
- Example: `button.primary.background`, `card.border.radius`
- **Build only when generic semantic tokens don't suffice**

#### 2.2 Luckino Plugin Requirements Checklist

✓ **Remove ALL emoji prefixes** (breaks import)
✓ **Use W3C DTCG format** ($type, $value, $description)
✓ **Organize into 3 collections**: primitives, semantic, component
✓ **Support variable scopes mapping**:
  - `borderRadius` → CORNER_RADIUS
  - `spacing` → GAP
  - `size` → HEIGHT_WIDTH
✓ **Use proper alias format**: `{colors.blue.500}` (no collection prefix like ~~{primitives.colors.blue.500}~~)
✓ **Multi-mode syntax**: `{ "base": value1, "brand": value2 }`

---

### PHASE 3: Conflict Resolution (Week 5-6)

#### 3.1 Mobility Services Decision Matrix

**CRITICAL DECISION**: All 22 services or subset of 6?

**Perplexity Recommendation**: ✅ **Include all 22 services**

**Rationale**:
1. Design team has done comprehensive service mapping
2. Future-proofing for whitelabel clients (may need full range)
3. Missing 73% of coverage creates technical debt
4. Cost of adding later > cost of including now
5. Some clients may need niche services (apparked, experience, skipass)

**Validation Required**:
- Check product roadmap for planned services
- Validate with client contracts/requirements
- Ask: "Which brands need which services?"

**Services Breakdown**:
- **Complete (6)**: bus, metro, train, garage, garage-telepass, sharing
- **Missing - Common (5)**: taxi, parking, car-rental, charging-station, airports
- **Missing - Transit (3)**: pullman, tram, harbor
- **Missing - Specialized (5)**: ncc, skipass, favorites, walk, ztl
- **Missing - New (3)**: places, apparked, experience

#### 3.2 Color Conflict Resolution

**Bus Service Colors:**
- **DESIGN**: Orange-based palette (Orange-100, Orange-750, Brown-800)
- **DEV**: Light Blue-based palette (Light Blue-200, Light Blue-650, Light Blue-750)

**Resolution Process**:
1. Review brand guidelines document
2. Consult with UX research on user testing
3. Check existing client implementations
4. Make evidence-based decision
5. Document reasoning for future reference

**Perplexity suggests looking for**:
- Existing bus service branding in app
- User association studies (do users expect certain colors?)
- Competitor analysis (mobility apps)

**Whitelabel (-extra) Colors:**
- **DESIGN**: Purple-based (Purple-300, Purple-600, Purple-800)
- **DEV**: Brown-based (Brown-200, Brown-800, Brown-900)

**Perplexity Recommendation**: ✅ **Purple**

**Rationale**:
- Higher contrast ratios
- Better accessibility (WCAG AA compliance)
- More distinct from primary brand colors
- Modern, tech-forward appearance

**Action**: Verify WCAG AA compliance for all color combinations before finalizing

---

### PHASE 4: Unified File Creation (Week 7-8)

#### 4.1 File Structure

**Recommended Project Structure**:
```
mooney-design-system/
├── tokens/
│   ├── primitives/
│   │   ├── colors.json           # All color primitives
│   │   ├── spacing.json          # Spacing scale
│   │   ├── typography.json       # Font families, weights, sizes
│   │   └── effects.json          # Shadows, blur (from full system)
│   ├── semantic/
│   │   ├── colors-semantic.json  # Semantic color mappings
│   │   ├── spacing-semantic.json # Semantic spacing
│   │   └── mobility-services.json # All 22 mobility token sets
│   └── component/
│       ├── button.json           # Button-specific tokens
│       ├── card.json             # Card-specific tokens
│       └── form.json             # Form-specific tokens
├── brands/
│   ├── mooneygo.json             # MooneyGo mode values
│   ├── brand2.json               # Brand 2 mode values
│   ├── brand3.json               # Brand 3 mode values
│   └── brand4.json               # Brand 4 mode values
└── docs/
    ├── governance.md             # Governance model
    ├── contribution-guide.md     # How to contribute
    └── migration-guide.md        # Migration from old system
```

#### 4.2 Token Naming Convention ✅ RECOMMENDED

**Hierarchical kebab-case**:

**Primitives**: `{category}.{subcategory}.{scale}`
```
colors.blue.500
spacing.scale.md
typography.font-family.body
```

**Semantic**: `{purpose}.{element}.{property}.{state}`
```
color.text.primary
color.text.secondary.hover
color.button.background.disabled
spacing.component.padding.small
```

**Component**: `{component}.{variant}.{property}.{state}`
```
button.primary.background.default
button.primary.background.hover
card.elevated.shadow.level
form.input.border.error
```

**Benefits**:
- Self-documenting
- Easy to search/autocomplete
- Clear hierarchy
- Scalable

---

### PHASE 5: Governance Model (Ongoing)

#### 5.1 RECOMMENDED: Federated Governance

**Core Design System Team (2-3 people)**:
- **Owns**: Primitives and semantic layers
- **Responsibilities**:
  - Reviews all contributions
  - Maintains documentation
  - Handles Luckino plugin sync
  - Versioning and releases
  - Breaking change management

**Product Teams (Distributed)**:
- **Can**: Propose component tokens
- **Process**: Submit via pull request
- **Must**: Follow contribution guidelines
- **Model**: Design system ambassadors per team

**Key Principle**: *Centralized standards, distributed execution*

#### 5.2 Contribution Workflow (8 Steps)

1. **Team identifies need** for new token/change
2. **Check existing tokens first** (exhaustive search in docs)
3. **Contact DS team** via Slack channel (#design-system)
4. **DS team evaluates**: one-off component need vs system addition
5. **If system addition**:
   - Create feature branch in Git repo
   - Add token following naming convention
   - Document use case and reasoning
   - Submit PR with screenshots/examples
6. **DS team reviews** within 48 hours (SLA)
7. **If approved**:
   - Merge to main
   - Sync to Figma via Luckino
   - Update documentation site
   - Announce in team channels
8. **Version bump** according to semver (semantic versioning)

#### 5.3 Change Management Process

**Breaking Changes** (Major version bump):
- Require minimum 2-week deprecation notice
- Migration guide provided
- Automated codemod if possible
- Communication in all channels
- Example: `v1.0.0` → `v2.0.0`

**Non-Breaking Changes** (Minor version bump):
- New tokens
- Value updates that don't break existing usage
- Can be deployed immediately
- Example: `v1.5.0` → `v1.6.0`

**Documentation Updates** (Patch version bump):
- Changelog updated with every release
- Migration guides for major versions
- Examples provided for complex changes
- Example: `v1.5.1` → `v1.5.2`

---

### PHASE 6: Migration Execution (Week 9-12)

#### 6.1 Preparation
- Create unified token file (validated by team)
- Set up Luckino plugin in Figma workspace
- Create test import with 10% of tokens (pilot)
- Validate mapping and scopes work correctly

#### 6.2 Pilot Migration
- Select one small product/feature as pilot
- Import unified tokens via Luckino
- Test all 4 brand modes work
- Document issues and solutions
- Refine process based on learnings
- **Go/No-Go decision point**

#### 6.3 Full Migration (Figma)
- Import all tokens to Figma Variables
- Map to existing components progressively
- Update design files in phases (by product)
- Coordinate with dev team for code sync
- Maintain parallel old system during transition (deprecation period)

#### 6.4 Code Migration (Development)
- Install token library in codebase (npm package)
- Use codemod to replace hardcoded values
- Update component library to consume tokens
- Test across all brand modes
- Deploy progressively per product (canary → full rollout)

---

### PHASE 7: Quality Assurance (Week 13-14)

#### 7.1 Validation Checklist

**Technical Validation**:
- [ ] All 22 mobility services defined
- [ ] All color conflicts resolved
- [ ] Luckino import successful (no errors)
- [ ] 4-brand mode switching works in Figma
- [ ] W3C DTCG compliance validated
- [ ] Accessibility (WCAG AA) verified for all color combinations

**Process Validation**:
- [ ] Documentation complete and published
- [ ] Team training completed (design + dev)
- [ ] Governance model in place
- [ ] Contribution workflow tested
- [ ] Support channels established

#### 7.2 Success Metrics

**Quantitative**:
- Token count consistency: Design = Dev (282 vs 282)
- Plugin import: 100% success rate (no errors)
- Brand switching: < 2 seconds in Figma
- Reduction in design-dev inconsistencies: > 70%

**Qualitative**:
- Team satisfaction: > 80% approval rating
- Design-dev collaboration: subjective improvement
- Time to implement new features: reduced
- Onboarding time for new team members: reduced

---

## Risk Mitigation Strategies

### Risk 1: Breaking Existing Implementations ⚠️ HIGH

**Impact**: Production bugs, user-facing issues, team frustration

**Mitigation**:
- Maintain old tokens with deprecation warnings for 3 months
- Provide automated migration scripts (codemods)
- Phased rollout (pilot → beta → production)
- Comprehensive testing before each phase
- Rollback plan ready

### Risk 2: Team Resistance 👥 MEDIUM

**Impact**: Low adoption, continued use of old system, wasted effort

**Mitigation**:
- Involve teams early in decisions (co-creation)
- Show clear benefits with pilot results
- Provide comprehensive training (hands-on workshops)
- Establish clear support channels (#design-system Slack)
- Celebrate wins and showcase improvements

### Risk 3: Incomplete Requirements 📋 MEDIUM

**Impact**: Building wrong system, rework needed, client disappointment

**Mitigation**:
- Validate with product roadmap (align with business)
- Interview key stakeholders (Product Owners, clients)
- Build flexibility for future additions (semantic layer)
- Use versioning to allow incremental additions
- Don't block on perfect requirements (iterate)

### Risk 4: Governance Vacuum 🏛️ LOW (but important)

**Impact**: Chaos, inconsistency, technical debt creeps back

**Mitigation**:
- Define governance model upfront (Phase 5)
- Assign clear owners and responsibilities
- Document processes (contribution workflow)
- Regular review meetings
- Continuous improvement culture

---

## Perplexity's Key Insights

### 1. All 22 Mobility Services are Worth It
Despite only 6 being implemented, the design team's comprehensive mapping is valuable. **Future-proofing is cheaper than retrofitting**.

### 2. Purple Over Brown for Whitelabel
Accessibility and contrast should drive this decision, not personal preference.

### 3. Federated Governance Scales Better
Central control of standards, but distributed execution empowers teams and reduces bottlenecks.

### 4. Three-Tier Architecture is Industry Standard
Primitives → Semantic → Component is proven at scale (Shopify Polaris, Adobe Spectrum, Material Design 3).

### 5. Migration is Riskiest Phase
More projects fail in migration than architecture. Plan, pilot, iterate.

---

## Deliverables from Perplexity

✅ **HTML Presentation** (15 slides)
- Located: `iterazione_1/mooney-ds-presentation/index.html`
- Professional, interactive, ready to present
- Includes visual comparisons, data tables, roadmap

✅ **CSV Data Files** (5 files)
- Token comparison
- Mobility coverage
- Color conflicts
- Architecture comparison
- Risk assessment

✅ **Text Strategy Document**
- Full 7-phase plan with details
- Located: `mooney_unification_strategy.txt`

---

## Timeline Overview

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| 1. Immediate Actions | Week 1-2 | Team alignment complete |
| 2. Architectural Decisions | Week 3-4 | 3-tier structure approved |
| 3. Conflict Resolution | Week 5-6 | All conflicts resolved |
| 4. Unified File Creation | Week 7-8 | Single source of truth exists |
| 5. Governance Model | Ongoing | Processes documented |
| 6. Migration Execution | Week 9-12 | System in production |
| 7. Quality Assurance | Week 13-14 | Success metrics validated |

**Total Duration**: 14 weeks (~3.5 months)

---

## Next Steps (Immediate)

1. ✅ Open `index.html` presentation in browser for review
2. ✅ Schedule team alignment meeting (this week)
3. ✅ Prepare meeting agenda based on Phase 1
4. ✅ Identify stakeholders to interview (mobility services priority)
5. ✅ Gather brand guidelines for color conflict resolution

---

## Comparison with Gemini Feedback

Both Gemini and Perplexity **strongly agree** on:
- ✅ Use design file as source of truth
- ✅ Three-tier architecture (Primitives → Semantic → Component)
- ✅ Team alignment meeting is critical and urgent
- ✅ Multi-mode W3C DTCG format for 4-brand system
- ✅ Remove emoji prefixes immediately

**Perplexity adds**:
- Detailed 14-week timeline
- Specific governance model (federated)
- Change management process (semver)
- Success metrics and validation checklist
- Professional presentation assets

**Gemini adds**:
- Tactical meeting structure (45-min breakdown)
- Strong emphasis on stakeholder decision-making
- Process for framing color conflicts as business questions
- Phased approach with pilot validation

**Together**: Complete strategic + tactical guidance for unification

---

## Recommended Action

Use **Perplexity for strategy** (what to do, when to do it, how to measure success) and **Gemini for tactics** (how to run the meeting, how to frame questions, how to get decisions made).

This dual approach gives you:
- Long-term roadmap (Perplexity)
- Short-term execution plan (Gemini)
- Presentation assets (Perplexity)
- Meeting facilitation guide (Gemini)

---

## File References

- Full strategy: [`mooney_unification_strategy.txt`](../mooney-ds-presentation/mooney_unification_strategy.txt)
- Presentation: [`index.html`](../mooney-ds-presentation/index.html)
- Token comparison: [`mooney_token_comparison.csv`](../mooney-ds-presentation/mooney_token_comparison.csv)
- Mobility coverage: [`mooney_mobility_coverage.csv`](../mooney-ds-presentation/mooney_mobility_coverage.csv)
- Color conflicts: [`mooney_color_conflicts.csv`](../mooney-ds-presentation/mooney_color_conflicts.csv)
- Architecture comparison: [`mooney_architecture_comparison.csv`](../mooney-ds-presentation/mooney_architecture_comparison.csv)
- Risk assessment: [`mooney_risk_assessment.csv`](../mooney-ds-presentation/mooney_risk_assessment.csv)