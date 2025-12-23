# BHHV V3 Documentation Index

**Welcome to the BHHV V3 (Bảo Hiểm Hợp Thực Vụ) documentation suite!**

This comprehensive documentation covers all aspects of the Vehicle Insurance Contract Management System. Use this index to navigate the documentation.

---

## Quick Navigation

### For New Developers
1. Start with [README.md](../README.md) - Project overview and quick start
2. Read [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Phase 0 quick cheat sheet (5 min)
3. Review [docs/codebase-summary.md](codebase-summary.md) - Understanding the system
4. Check [docs/code-standards.md](code-standards.md) - Development guidelines
5. Read [docs/system-architecture.md](system-architecture.md) - Technical details

### For Phase 0 Provider Framework
1. Quick Start: [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Common patterns (5 min)
2. Integration: [provider-integration-guide.md](provider-integration-guide.md) - How to use (20 min)
3. Architecture: [phase-0-provider-framework.md](phase-0-provider-framework.md) - Deep dive (60 min)
4. System Design: [system-architecture.md](system-architecture.md) - Phase 0 section (30 min)

### For Project Managers/Stakeholders
1. Read [docs/project-overview-pdr.md](project-overview-pdr.md) - Vision and requirements
2. Review [docs/system-architecture.md](system-architecture.md) - System design overview
3. Check [README.md](../README.md) - Feature summary and deployment

### For DevOps/Infrastructure
1. Check [docs/system-architecture.md](system-architecture.md) - Deployment section
2. Review [README.md](../README.md) - Deployment options
3. Check database and monitoring sections in [docs/system-architecture.md](system-architecture.md)

### For Code Reviewers
1. Review [docs/code-standards.md](code-standards.md) - Code review checklist
2. Check [docs/codebase-summary.md](codebase-summary.md) - Patterns and practices
3. Reference [docs/system-architecture.md](system-architecture.md) - Architecture decisions

---

## Documentation Files

### 0. [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
**Phase 0 Quick Reference & Cheat Sheet**

- **Purpose**: One-page quick reference for common Phase 0 tasks
- **Audience**: Developers using provider framework
- **Key Sections**:
  - Common imports
  - Get providers, encrypt/decrypt credentials
  - Load and render forms
  - Check premium, create contracts
  - Use shared components
  - Error handling patterns
  - Complete code examples
  - Field types available
  - Documentation links

**When to read**: When implementing provider features, need quick code patterns

---

### 1. [phase-0-provider-framework.md](phase-0-provider-framework.md)
**Phase 0 Core Framework Architecture & Design**

- **Purpose**: Comprehensive documentation of provider framework architecture
- **Audience**: Architects, senior developers, tech leads
- **Key Sections**:
  - Problem statement and solution overview
  - Component hierarchy and structure
  - Core interfaces (InsuranceProvider, FormSchema, etc.)
  - Provider Registry design and usage
  - Base API Client implementation
  - Credential Manager with AES-256-GCM encryption
  - Dynamic Form System architecture
  - Shared Components (LocationPicker, DateRangePicker)
  - BHV Provider implementation details
  - Integration points with API routes
  - Extension guide (new providers, custom fields)
  - Multi-provider scenario examples
  - Security considerations and best practices
  - Testing strategy
  - Future enhancements and roadmap

**When to read**: Understanding Phase 0 architecture, designing extensions, security review

---

### 2. [provider-integration-guide.md](provider-integration-guide.md)
**Phase 0 Provider Integration Guide & Developer Reference**

- **Purpose**: Practical guide for developers using provider framework
- **Audience**: Frontend/backend developers implementing features
- **Key Sections**:
  - Quick start with imports
  - Common tasks (7 detailed examples):
    1. Display provider-specific form
    2. Encrypt and store credentials
    3. Retrieve and decrypt credentials
    4. Check premium with provider
    5. Submit contract to provider
    6. Use location picker component
    7. Use date range picker
  - Form integration patterns (5 patterns with code)
  - Provider development checklist
  - Provider response format specifications
  - Error handling patterns
  - Type safety examples
  - Testing examples (Jest, React Testing Library)
  - Performance tips
  - Troubleshooting guide (common issues)
  - Complete API reference
  - Best practices (6 items)

**When to read**: When implementing features, integrating providers, troubleshooting

---

### 3. [project-overview-pdr.md](project-overview-pdr.md)
**Product Development Requirements & Project Overview**

- **Purpose**: Define project vision, business requirements, and success criteria
- **Audience**: Project managers, stakeholders, team leads
- **Key Sections**:
  - Project vision and goals
  - Core features overview
  - Target users and personas
  - Business rules and constraints
  - Non-functional requirements
  - Integration specifications
  - Success metrics and KPIs
  - Roadmap and future enhancements
  - Risk mitigation strategies
  - Insurance terminology glossary

**When to read**: Before starting development, for requirement understanding, stakeholder communication

---

### 2. [codebase-summary.md](codebase-summary.md)
**Technical Codebase Overview & Architecture**

- **Purpose**: Provide high-level understanding of system structure and data flow
- **Audience**: All developers, architects, new team members
- **Key Sections**:
  - Project structure overview
  - Directory and file organization
  - Database models (6 models documented)
  - API architecture overview
  - State management patterns
  - External integrations
  - Testing strategy
  - Performance guidelines
  - Common development workflows

**When to read**: For general system understanding, during onboarding, before major changes

---

### 3. [code-standards.md](code-standards.md)
**Development Standards & Implementation Guidelines**

- **Purpose**: Establish consistent coding patterns and development practices
- **Audience**: All developers, code reviewers, team leads
- **Key Sections**:
  - TypeScript standards (with 80+ examples)
  - File organization guidelines
  - Naming conventions (all types)
  - React component patterns
  - API route patterns
  - Database model conventions
  - Error handling patterns
  - Security best practices
  - Validation and input patterns
  - Testing standards
  - Documentation standards
  - Code review checklist (30+ items)

**When to read**: Before writing code, during code review, when implementing features

---

### 4. [system-architecture.md](system-architecture.md)
**Technical System Design & Architecture**

- **Purpose**: Document complete system architecture, design decisions, and specifications
- **Audience**: Architects, senior developers, DevOps engineers, technical leads
- **Key Sections**:
  - High-level architecture diagram
  - System components and services
  - Complete database schema (7 collections)
  - API architecture (30+ endpoints with examples)
  - Authentication & authorization flows
  - External integrations (BHV Platform)
  - Deployment architecture
  - Scalability and performance strategies
  - Security architecture (6 layers)
  - Monitoring and logging strategy
  - Disaster recovery planning
  - Future enhancements

**When to read**: For system design decisions, deployment planning, integration work, performance optimization

---

### 5. [README.md](../README.md)
**Project Quick Start & Overview**

- **Purpose**: Provide quick start guide and project overview
- **Audience**: New developers, team members, external stakeholders
- **Key Sections**:
  - Project description and features
  - Technology stack
  - Quick start (installation, setup, running)
  - Development commands
  - Testing guide
  - Authentication explanation
  - BHV integration setup
  - Contract workflow
  - Environment configuration
  - Deployment options
  - API reference
  - Troubleshooting
  - Contributing guidelines

**When to read**: First when joining project, for quick reference, setup instructions

---

### 6. [CLAUDE.md](../CLAUDE.md)
**AI Assistant Development Guidelines** (Existing)

- **Purpose**: Provide AI-specific guidelines for code development
- **Contents**: Technology stack, project structure, development commands, architectural overview, code standards, testing strategy, key business rules, side effect prevention rules

**Complements**: All documentation files with AI-centric perspective

---

## Document Relationships

```
README.md (Start here)
    ↓
    ├─→ For Getting Started:
    │    └─ docs/codebase-summary.md
    │        └─ docs/code-standards.md
    │
    ├─→ For Business Understanding:
    │    └─ docs/project-overview-pdr.md
    │
    └─→ For Technical Details:
         └─ docs/system-architecture.md
            └─ docs/code-standards.md
```

---

## Common Tasks & Which Docs to Reference

### Setting Up Local Development
1. [README.md](../README.md) - Prerequisites and installation
2. [docs/system-architecture.md](system-architecture.md) - Database setup section

### Creating a New Feature
1. [docs/code-standards.md](code-standards.md) - Design patterns
2. [docs/codebase-summary.md](codebase-summary.md) - Similar examples
3. [docs/system-architecture.md](system-architecture.md) - API design

### Adding a Database Field
1. [docs/codebase-summary.md](codebase-summary.md) - "Adding a New Contract Field" section
2. [docs/code-standards.md](code-standards.md) - Database model conventions
3. [docs/system-architecture.md](system-architecture.md) - Schema reference

### Code Review
1. [docs/code-standards.md](code-standards.md) - Code review checklist
2. [docs/codebase-summary.md](codebase-summary.md) - Approved patterns
3. [docs/system-architecture.md](system-architecture.md) - Architectural decisions

### Deployment
1. [README.md](../README.md) - Deployment options
2. [docs/system-architecture.md](system-architecture.md) - Deployment architecture section
3. [docs/code-standards.md](code-standards.md) - Security best practices

### Integration with BHV Platform
1. [docs/system-architecture.md](system-architecture.md) - External integrations section
2. [docs/codebase-summary.md](codebase-summary.md) - BHV integration overview
3. [docs/project-overview-pdr.md](project-overview-pdr.md) - Integration specifications

### Performance Optimization
1. [docs/system-architecture.md](system-architecture.md) - Scalability & performance section
2. [docs/codebase-summary.md](codebase-summary.md) - Performance considerations
3. [README.md](../README.md) - Performance targets

### Security Implementation
1. [docs/code-standards.md](code-standards.md) - Security best practices
2. [docs/system-architecture.md](system-architecture.md) - Security architecture
3. [README.md](../README.md) - Security notes

---

## Key Metrics & Standards

### Code Coverage Requirements
- **Overall**: Minimum 80%
- **`src/utils/insurance-calculator.ts`**: Minimum 90%
- **`src/hooks/useFormValidation.ts`**: Minimum 85%

### Performance Targets
- **Page Load**: < 2 seconds (90th percentile)
- **API Response**: < 500ms (90th percentile)
- **Premium Calculation**: < 100ms
- **Database Query**: < 1 second

### File Size Limit
- **Maximum**: 200 lines per file
- **Rationale**: Improves readability, maintainability, testability

### Security Standards
- **Password Hashing**: bcryptjs (12 salt rounds)
- **Data Encryption**: AES-256-GCM for sensitive fields
- **JWT Tokens**: HS256, 32+ char secrets
- **Rate Limiting**: IP-based, configurable per endpoint

---

## Frequently Asked Questions

**Q: I'm new to the project. Where do I start?**
A: Read [README.md](../README.md) for quick start, then [docs/codebase-summary.md](codebase-summary.md) for system understanding.

**Q: Where are the coding standards?**
A: [docs/code-standards.md](code-standards.md) has comprehensive standards with examples.

**Q: How do I add a new API endpoint?**
A: Check "Creating a New API Endpoint" in [docs/codebase-summary.md](codebase-summary.md).

**Q: Where's the database schema?**
A: Complete schema in [docs/system-architecture.md](system-architecture.md) under "Data Architecture".

**Q: What's the contract workflow?**
A: See [docs/project-overview-pdr.md](project-overview-pdr.md) and [docs/codebase-summary.md](codebase-summary.md).

**Q: How do I submit contracts to BHV?**
A: Read "BHV Integration" in [docs/system-architecture.md](system-architecture.md).

**Q: What are the API endpoints?**
A: Complete API reference in [docs/system-architecture.md](system-architecture.md) and [README.md](../README.md).

**Q: How do I review code?**
A: Use the checklist in [docs/code-standards.md](code-standards.md).

**Q: Where's the deployment guide?**
A: [docs/system-architecture.md](system-architecture.md) has deployment section, [README.md](../README.md) has options.

**Q: How is BHV integration supposed to work?**
A: [docs/system-architecture.md](system-architecture.md) has "External Integrations" section with architecture and flow.

---

## Documentation Maintenance

### How to Keep Documentation Updated
1. Update relevant doc when making code changes
2. Keep examples in sync with actual code
3. Update standards when patterns change
4. Add new workflows as they emerge
5. Update performance targets after benchmarking

### Suggesting Documentation Improvements
1. Create an issue with suggestions
2. Submit pull request with improvements
3. Discuss major structural changes before implementing

### Documentation Review Checklist
- [ ] Accurate to current codebase
- [ ] Examples are correct and runnable
- [ ] Links between documents work
- [ ] Vietnamese terminology used properly
- [ ] Formatting consistent
- [ ] No outdated references
- [ ] Clear and understandable

---

## Documentation Statistics

- **Total Documentation**: 4,299 lines (132 KB)
- **Main Documents**: 4 comprehensive guides
- **Code Examples**: 80+ production patterns
- **API Endpoints**: 30+ documented
- **Database Models**: 7 fully specified
- **Checklists**: 30+ items for code review
- **Business Rules**: 20+ documented

---

## Related Resources

- **Project Repository**: https://github.com/minhtn012/bhhv_v3
- **Technology Documentation**:
  - [Next.js Docs](https://nextjs.org/docs)
  - [React Docs](https://react.dev)
  - [TypeScript Docs](https://www.typescriptlang.org/docs)
  - [MongoDB Docs](https://docs.mongodb.com)
  - [Mongoose Docs](https://mongoosejs.com)

---

## Document Versions

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| QUICK-REFERENCE.md | 1.0 | 2025-12-23 | NEW |
| phase-0-provider-framework.md | 1.0 | 2025-12-23 | NEW |
| provider-integration-guide.md | 1.0 | 2025-12-23 | NEW |
| project-overview-pdr.md | 1.0 | 2025-12-23 | Updated |
| system-architecture.md | 1.1 | 2025-12-23 | Updated |
| codebase-summary.md | 1.0 | 2025-12-22 | Active |
| code-standards.md | 1.0 | 2025-12-22 | Active |
| README.md | 1.0 | 2025-12-22 | Active |

---

## Support & Feedback

- **Questions**: Check the FAQ section above
- **Issues**: Review relevant document section
- **Improvements**: Submit suggestions via pull request
- **Clarifications**: Create issue with specific question

---

**Last Updated**: 2025-12-23
**Maintained By**: Documentation Team
**Status**: Complete & Active
**Phase**: Phase 0 Documentation Complete
