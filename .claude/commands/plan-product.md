---
description: Create comprehensive product planning documentation including mission and roadmap
allowed-tools: Read, Write, Bash, Glob
argument-hint: [optional: product name]
---

# Product Planning

Create comprehensive product documentation including mission and roadmap based on existing codebase. Follow the `Workflow` to understand the current tech stack, gather requirements, and create planning documents using the exact specified markdown formats.

## Variables

PRODUCT_NAME: $ARGUMENTS
OUTPUT_DIRECTORY: `specs/product/`

## Instructions

- IMPORTANT: You're creating product planning documentation that will guide the development of this product
- IMPORTANT: This command assumes you have starter code already in place - begin by understanding the existing codebase structure and tech stack
- IMPORTANT: Execute each phase in order: prime (understand codebase), gather requirements, create mission, create roadmap
- Create all files in the `OUTPUT_DIRECTORY` directory
- Use the exact formats specified in the `Document Formats` section below
- IMPORTANT: Replace every <placeholder> in the document formats with the requested value
- Use your reasoning model: THINK HARD about the product vision, user needs, and how to organize features into logical phases that build on the existing tech stack
- Keep all sections concise and skimmable - focus on the "why" not the "how"
- Organize roadmap phases by value delivery, not technical complexity
- Consider existing codebase patterns and architecture when planning features
- When you finish creating the planning documents, follow the `Report` section to properly report the results of your work

## Codebase Structure

Take note of these typical project locations:

```
.
├── README.md                      # Project overview and setup instructions
├── docker/app/*                     # Application source code
├── specs/
│   ├── product/                   # Product planning docs (created by this command)
│   │   ├── requirements.md
│   │   ├── mission.md
│   │   └── roadmap.md
│   └── <feature-specs>            # Feature specifications (created later)
```

## Document Formats

### Format 1: Requirements Document

$Create `specs/product/requirements.md` with overview first, then raw user input:

```md
# Product Requirements

**Date**: <current date>

## Overview

<2-3 paragraph summary synthesizing the product vision, target users, and core value proposition based on user responses>

---

## Raw Requirements (Interview Responses)

### Product Vision

<user's exact response to product vision question>

### Target Users

<user's exact response to target users question>

### Key Features

<user's exact response to key features question>

### Unique Value Proposition

<user's exact response to unique value question>

### Success Metrics

<user's exact response to success metrics question>

### Constraints

<user's exact response to constraints question>
```

### Format 2: Mission Document

Create `specs/product/mission.md` following this structure:

```md
# Product Mission

## Overview

<2-3 sentence summary of what the product is and why it exists>

## Problem Statement

<describe the core problem being solved - 2-3 sentences>

## Solution

<describe how this product solves the problem - 2-3 sentences>

## Target Audience

### Primary Users

- <user persona 1>: <brief description of needs and goals>
- <user persona 2>: <brief description of needs and goals>

### User Needs

- <key need 1>
- <key need 2>
- <key need 3>

## Value Proposition

<what makes this product valuable and unique>
- <value point 1>
- <value point 2>
- <value point 3>

## Core Principles

<3-5 guiding principles for product development>

- <principle 1>: <why it matters>
- <principle 2>: <why it matters>
- <principle 3>: <why it matters>

## Success Criteria

<how we'll know the product is successful - 3-5 measurable outcomes>

- <criterion 1>
- <criterion 2>
- <criterion 3>

## Technical Foundation

**Tech Stack**: <summary from tech-stack.md>
**Architecture**: <brief description of existing architecture patterns from tech-stack.md>
```

### Format 3: Tech Stack Document

Create `specs/product/tech-stack.md` following this structure:

```md
# Tech Stack

**Last Updated**: <current date>

## Overview

<1-2 sentence summary of the overall technical approach>

## Frontend

**Framework/Library**: <name and version>
**Language**: <primary language(s)>
**Build Tool**: <build tool>
**Key Libraries**:

- <library 1>: <purpose>
- <library 2>: <purpose>
- <library 3>: <purpose>

## Backend

**Runtime**: <runtime environment>
**Framework**: <framework name and version>
**Language**: <primary language(s)>
**Key Libraries**:

- <library 1>: <purpose>
- <library 2>: <purpose>
- <library 3>: <purpose>

## Infrastructure

**Deployment**: <deployment platform/method>
**Containerization**: <container technology if applicable>
**Hardware**: <target hardware if applicable>
**Key Services**:

- <service 1>: <purpose>
- <service 2>: <purpose>

## Development Tools

**Testing**: <testing frameworks>
**Package Management**: <package manager(s)>
**Version Control**: <VCS>
**Other Tools**: <any other relevant dev tools>

## Architecture Patterns

<brief description of key architectural patterns or conventions observed in the codebase>

## Technical Decisions

<if user specified any tech stack choices in conversation, document them here with rationale>
```

### Format 4: Roadmap Document

Create `specs/product/roadmap.md` following this structure:

```md
# Product Development Roadmap

**Last Updated**: <current date>

## Roadmap Overview

<1-2 sentences describing the phased approach and priorities based on the existing technical foundation>

---

## Phase 1: MVP (Minimum Viable Product)

**Goal**: <what this phase achieves>

**Status**: [ ] Not Started

### Features

- [ ] **<feature 1>**: <brief description of what it does and why it's critical>
- [ ] **<feature 2>**: <brief description>
- [ ] **<feature 3>**: <brief description>

### Success Criteria

- <measurable outcome 1>
- <measurable outcome 2>

### Technical Dependencies

- <any existing code or infrastructure this phase builds on>

---

## Phase 2: Core Enhancement

**Goal**: <what this phase achieves>

**Status**: [ ] Not Started

### Features

- [ ] **<feature 1>**: <brief description>
- [ ] **<feature 2>**: <brief description>
- [ ] **<feature 3>**: <brief description>

### Success Criteria

- <measurable outcome 1>
- <measurable outcome 2>

### Technical Dependencies

- <features from Phase 1 this builds upon>

---

## Phase 3: Advanced Features

**Goal**: <what this phase achieves>

**Status**: [ ] Not Started

### Features

- [ ] **<feature 1>**: <brief description>
- [ ] **<feature 2>**: <brief description>

### Success Criteria

- <measurable outcome 1>
- <measurable outcome 2>

### Technical Dependencies

- <features from previous phases this builds upon>

---

## Phase 4+: Future Enhancements

**Goal**: <long-term vision>

### Potential Features

- **<future feature 1>**: <brief description>
- **<future feature 2>**: <brief description>
- **<future feature 3>**: <brief description>

---

## Notes

<any additional context, architectural decisions, or constraints based on existing codebase>
```

## Workflow

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Prime - Understand Existing Codebase

Before gathering requirements, understand what's already in place:

1. Run /prime
2. Identify the application structure
3. Note any existing architectural patterns or conventions

### Step 2: Create Tech Stack Document

IMPORTANT: Create `specs/product/tech-stack.md` using `Format 3: Tech Stack Document`

Follow this priority order:

1. **Note User's Input Regarding Tech Stack**: IF the user has provided specific information in the current conversation regarding tech stack choices, these notes ALWAYS take precedence. These must be reflected in your final tech-stack.md document.

2. **Gather Default Tech Stack Information**: Reconcile and fill in the remaining gaps in the tech stack list by analyzing information from the /prime step:

   - Read package.json files to identify dependencies and versions
   - Check framework and library usage in source code
   - Identify build tools, testing frameworks, and development tooling
   - Document deployment and infrastructure setup
   - Note any architectural patterns or conventions

3. **Document Technical Decisions**: In the "Technical Decisions" section, explicitly document any tech stack choices the user mentioned in conversation, including the rationale.

### Step 3: Gather Product Requirements

Ask the user the following 6 discovery questions to gather comprehensive product information:

1. **Product Vision**: What is the core purpose of this product? What problem does it solve?
2. **Target Users**: Who are the primary users? What are their key needs and pain points?
3. **Key Features**: What are the essential features for the initial version? List the top 5-10 features.
4. **Unique Value**: What makes this product different from existing solutions?
5. **Success Metrics**: How will you measure if this product is successful?
6. **Constraints**: Are there any timeline or resource constraints we should know about?

After gathering all responses, create `specs/product/requirements.md` using `Format 1: Requirements Document`

IMPORTANT: Tech stack information goes in tech-stack.md (created in Step 2). Keep requirements.md focused on product requirements only.

### Step 4: Create Mission Document

THINK HARD about how to synthesize the gathered requirements with the existing technical foundation.

Analyze the gathered requirements and create `specs/product/mission.md` using `Format 2: Mission Document`

### Step 5: Create Development Roadmap

Based on the key features gathered, organize them into logical development phases that build on the existing codebase:

- **Phase 1 (MVP)**: Core features needed for basic functionality
- **Phase 2**: Enhanced features that improve core experience
- **Phase 3**: Advanced features and optimizations
- **Phase 4+**: Future enhancements and scale features

Consider technical dependencies and how each phase builds on the previous one.

Create `specs/product/roadmap.md` using `Format 4: Roadmap Document`

### Step 6: Validation

Verify all files were created successfully:

```bash
ls -la specs/product/
```

Confirm you see: `tech-stack.md`, `requirements.md`, `mission.md`, and `roadmap.md`

Run /validate-product-plan

## Report

After completing all steps, provide a report in this exact format:

```
✅ Product Planning Complete

**Files Created:**
- specs/product/tech-stack.md - Complete tech stack documentation
- specs/product/requirements.md - Product overview + raw interview responses
- specs/product/mission.md - Product vision and strategy
- specs/product/roadmap.md - Phased development plan with <X> phases

**Tech Stack Summary:**
- Frontend: <key frontend technologies>
- Backend: <key backend technologies>
- Infrastructure: <key infrastructure/deployment>

**Roadmap Summary:**
- Phase 1 (MVP): <brief summary of MVP features>
- Phase 2: <brief summary>
- Phase 3: <brief summary>

**Next Steps:**
1. Review the mission and roadmap documents to ensure alignment with your vision
2. Adjust phases or features as needed
3. Use this roadmap to create feature specifications with /feature or similar commands
4. Each roadmap item can become a separate spec in the specs/ directory
```
