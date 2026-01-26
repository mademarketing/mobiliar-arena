---
description: Validate product planning documentation for completeness and quality
allowed-tools: Read, Glob
---

# Validate Product Plan

Validate that the product planning documentation is complete, well-written, and ready to guide development. Follow the `Workflow` to check all required files and sections, then provide a comprehensive validation `Report`.

## Variables

PRODUCT_DIR: `specs/product/`

## Instructions

- IMPORTANT: This command validates the product planning documents created by /plan-product
- IMPORTANT: Use your reasoning model: THINK HARD about whether each section provides enough detail to guide development
- Check that ALL required files exist
- Verify that ALL required sections exist in each file
- Ensure NO placeholders remain (like <current date>, <user persona 1>, <brief description>, etc.)
- Validate that content is specific, actionable, and complete
- Check that roadmap phases have clear dependencies and progression
- Verify success criteria are measurable and specific
- Assess overall quality and readiness for implementation
- When you finish validation, follow the `Report` section to provide detailed feedback

## Workflow

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Verify Files Exist

Check that all required product planning files exist:

```bash
ls -la specs/product/
```

Required files:

- `tech-stack.md`
- `requirements.md`
- `mission.md`
- `roadmap.md`

If any files are missing, STOP and report which files are missing.

### Step 2: Validate Tech Stack Document

Read `specs/product/tech-stack.md` and verify:

**Required Sections:**

- [ ] Title: "# Tech Stack"
- [ ] Last Updated field populated (not placeholder)
- [ ] Overview - 1-2 sentence summary
- [ ] Frontend section with Framework/Library, Language, Build Tool, Key Libraries
- [ ] Backend section with Runtime, Framework, Language, Key Libraries
- [ ] Infrastructure section with Deployment, Containerization, Hardware, Key Services
- [ ] Development Tools section with Testing, Package Management, Version Control
- [ ] Architecture Patterns - describes key patterns from codebase
- [ ] Technical Decisions - documents any user-specified tech choices

**Quality Checks:**

- [ ] No placeholder text like <current date>, <name and version>, <purpose>
- [ ] All sections contain actual technology names and versions where applicable
- [ ] Key libraries include purpose/rationale
- [ ] Architecture patterns describe actual codebase conventions
- [ ] Technical decisions section notes if user made specific tech stack choices in conversation

### Step 3: Validate Requirements Document

Read `specs/product/requirements.md` and verify:

**Required Sections:**

- [ ] Title: "# Product Requirements"
- [ ] Date field populated (not placeholder)
- [ ] Overview - 2-3 paragraph summary synthesizing the product
- [ ] Separator (---) between Overview and Raw Requirements
- [ ] "## Raw Requirements (Interview Responses)" section
- [ ] Product Vision subsection under Raw Requirements
- [ ] Target Users subsection under Raw Requirements
- [ ] Key Features subsection under Raw Requirements
- [ ] Unique Value Proposition subsection under Raw Requirements
- [ ] Success Metrics subsection under Raw Requirements
- [ ] Constraints subsection under Raw Requirements

**Quality Checks:**

- [ ] No placeholder text like <current date>, <user's response>
- [ ] Overview is 2-3 substantive paragraphs (not placeholder text)
- [ ] Overview synthesizes/summarizes the raw requirements effectively
- [ ] Raw requirements sections contain actual user responses from interview
- [ ] Features are specific enough to guide development (5-10 features)
- [ ] Success metrics are measurable (numbers, percentages, or clear outcomes)
- [ ] Constraints include timeline, technical, and operational constraints
- [ ] NO Tech Stack Analysis section (tech stack is in tech-stack.md)

### Step 4: Validate Mission Document

Read `specs/product/mission.md` and verify:

**Required Sections:**

- [ ] Title: "# Product Mission"
- [ ] Overview - 2-3 sentence summary
- [ ] Problem Statement - clear problem description
- [ ] Solution - how product solves the problem
- [ ] Target Audience with Primary Users subsection
- [ ] Target Audience with User Needs subsection
- [ ] Value Proposition - 3+ value points
- [ ] Core Principles - 3-5 principles with explanations
- [ ] Success Criteria - 3-5 measurable outcomes
- [ ] Technical Foundation with Tech Stack
- [ ] Technical Foundation with Architecture

**Quality Checks:**

- [ ] No placeholder text like <2-3 sentence summary>, <user persona 1>, <principle 1>
- [ ] Overview is exactly 2-3 sentences and clearly states what the product is
- [ ] Problem and Solution are specific and connected
- [ ] Primary Users lists at least 2 user personas with their needs
- [ ] User Needs lists at least 3 specific needs
- [ ] Value Proposition has at least 3 distinct value points
- [ ] Core Principles has 3-5 principles, each with "why it matters"
- [ ] Success Criteria has 3-5 measurable outcomes
- [ ] Technical Foundation references tech-stack.md for complete documentation
- [ ] Architecture describes existing patterns (not placeholder text)

### Step 5: Validate Roadmap Document

Read `specs/product/roadmap.md` and verify:

**Required Sections:**

- [ ] Title: "# Product Development Roadmap"
- [ ] Last Updated field populated
- [ ] Roadmap Overview - 1-2 sentences
- [ ] Phase 1: MVP with Goal, Status, Features, Success Criteria, Technical Dependencies
- [ ] Phase 2: Core Enhancement with Goal, Status, Features, Success Criteria, Technical Dependencies
- [ ] Phase 3: Advanced Features with Goal, Status, Features, Success Criteria, Technical Dependencies
- [ ] Phase 4+: Future Enhancements with Goal and Potential Features
- [ ] Notes section

**Quality Checks:**

- [ ] No placeholder text like <current date>, <what this phase achieves>, <feature 1>
- [ ] Last Updated has actual date
- [ ] Roadmap Overview explains the phased approach strategy
- [ ] Each phase (1-3) has a clear, specific goal
- [ ] Each phase has Status set to "[ ] Not Started"
- [ ] Phase 1 (MVP) has 3+ features with descriptions explaining why they're critical
- [ ] Phase 2 has 3+ features building on Phase 1
- [ ] Phase 3 has 2+ advanced features
- [ ] Each phase has 2+ success criteria that are measurable
- [ ] Technical Dependencies for each phase reference specific infrastructure or features
- [ ] Phase 2 dependencies reference Phase 1 features
- [ ] Phase 3 dependencies reference previous phases
- [ ] Features use checkboxes [ ] for tracking
- [ ] Phase 4+ lists potential future features with descriptions
- [ ] Notes section contains relevant context or decisions

### Step 6: Cross-Document Validation

THINK HARD about consistency across all documents:

**Consistency Checks:**

- [ ] Tech stack in tech-stack.md is referenced in mission.md Technical Foundation
- [ ] Tech stack info is NOT duplicated in requirements.md (should only be in tech-stack.md)
- [ ] User personas/needs are consistent between requirements.md and mission.md
- [ ] Features in roadmap.md align with Key Features in requirements.md
- [ ] Success criteria in roadmap phases align with Success Metrics in requirements.md
- [ ] Value propositions in mission.md support the Product Vision in requirements.md
- [ ] Roadmap phases build logically on each other with clear progression

**Completeness Checks:**

- [ ] All major features from requirements appear somewhere in the roadmap
- [ ] The MVP phase addresses the core problem from mission.md
- [ ] Technical dependencies in roadmap reflect the actual tech stack from tech-stack.md
- [ ] The roadmap has a clear path from MVP to advanced features
- [ ] tech-stack.md documents any user-specified tech choices mentioned in conversation

### Step 7: Quality Assessment

Assess overall quality on these dimensions:

**Clarity:**

- Are the documents easy to read and understand?
- Is the language specific rather than vague?
- Would a developer understand what to build?

**Actionability:**

- Can roadmap items be turned into feature specs?
- Are success criteria measurable?
- Are technical dependencies clear enough to plan implementation?

**Completeness:**

- Is there enough detail to guide development?
- Are all critical aspects of the product covered?
- Would a new team member understand the product vision?

**Alignment:**

- Do all documents tell a consistent story?
- Does the roadmap support the mission?
- Do technical choices match the product vision?

## Report

After completing all validation steps, provide a report in this exact format:

```
# Product Plan Validation Report

## Overall Status
<✅ PASS | ⚠️ PASS WITH ISSUES | ❌ FAIL>

## Files Validated
- [ ] specs/product/tech-stack.md
- [ ] specs/product/requirements.md
- [ ] specs/product/mission.md
- [ ] specs/product/roadmap.md

---

## Tech Stack Document (tech-stack.md)

**Status**: <✅ Complete | ⚠️ Needs Improvement | ❌ Incomplete>

**Missing Sections**: <list any missing required sections, or "None">

**Placeholder Text Found**: <list any remaining placeholders, or "None">

**Issues**:
- <specific issue 1, or "None found">
- <specific issue 2>

**Strengths**:
- <what's done well>

---

## Requirements Document (requirements.md)

**Status**: <✅ Complete | ⚠️ Needs Improvement | ❌ Incomplete>

**Missing Sections**: <list any missing required sections, or "None">

**Placeholder Text Found**: <list any remaining placeholders, or "None">

**Issues**:
- <specific issue 1, or "None found">
- <specific issue 2>

**Strengths**:
- <what's done well>

---

## Mission Document (mission.md)

**Status**: <✅ Complete | ⚠️ Needs Improvement | ❌ Incomplete>

**Missing Sections**: <list any missing required sections, or "None">

**Placeholder Text Found**: <list any remaining placeholders, or "None">

**Issues**:
- <specific issue 1, or "None found">
- <specific issue 2>

**Strengths**:
- <what's done well>

---

## Roadmap Document (roadmap.md)

**Status**: <✅ Complete | ⚠️ Needs Improvement | ❌ Incomplete>

**Missing Sections**: <list any missing required sections, or "None">

**Placeholder Text Found**: <list any remaining placeholders, or "None">

**Issues**:
- <specific issue 1, or "None found">
- <specific issue 2>

**Strengths**:
- <what's done well>

---

## Cross-Document Analysis

**Consistency**: <✅ Consistent | ⚠️ Minor Issues | ❌ Major Conflicts>

**Issues Found**:
- <specific consistency issue 1, or "None found">
- <specific consistency issue 2>

**Tech Stack Coverage**:
- Primary documentation: tech-stack.md
- Referenced in: mission.md Technical Foundation
- NOT in requirements.md: <confirm tech stack is not duplicated in requirements.md>

**Feature Coverage**:
- Total features in requirements: <count>
- Total features across roadmap: <count>
- Missing from roadmap: <list any, or "None">

---

## Quality Assessment

**Clarity**: <1-5 score>/5
<brief explanation>

**Actionability**: <1-5 score>/5
<brief explanation>

**Completeness**: <1-5 score>/5
<brief explanation>

**Alignment**: <1-5 score>/5
<brief explanation>

---

## Recommendations

<If status is PASS, write:>
✅ Product planning documentation is complete and ready to guide development. You can proceed with creating feature specifications using /feature or similar commands.

<If status is PASS WITH ISSUES, list:>
⚠️ The following improvements are recommended before proceeding:
1. <specific recommendation 1>
2. <specific recommendation 2>
3. <specific recommendation 3>

<If status is FAIL, list:>
❌ Critical issues must be addressed before proceeding:
1. <critical issue 1>
2. <critical issue 2>
3. <critical issue 3>

---

## Next Steps

<Based on validation results, suggest appropriate next steps:>
- If PASS: "Ready to create feature specs. Start with Phase 1 MVP features."
- If PASS WITH ISSUES: "Address recommendations above, then re-validate with /validate-product-plan"
- If FAIL: "Fix critical issues in <file names>, then re-validate with /validate-product-plan"
```
