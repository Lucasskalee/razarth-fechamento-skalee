# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- **PLATFORM_VISION_V2.md** — Strategic shift: Razarth as multi-tenant SaaS platform (not ERP)
- **PLATFORM_MVP.md** — MVP redefinition: Signup → Company → Public Profile → Products → WhatsApp
- **10-PLATFORM/** documentation folder for platform-specific concepts
- Updated Sprint 1.2+ roadmap to align with platform architecture

### Changed
- **PRODUCT_VISION.md** — Scope redefined from "Analytics for Supermarkets" to "Modular SaaS Platform"
- **NON_GOALS.md** — Frozen scope to prevent drift

### Fixed

### Security

---

## [0.1.0] — Sprint 0 Complete

### Added
- Sprint 0: Full architectural documentation (35+ docs)
  - 9 Architecture Decision Records (ADRs)
  - Product Vision, Core Architecture, Module System
  - Business Dictionary, Engines specifications
  - KPI Catalog, Formula Book
- Sprint 0.5: Environment and CI/CD setup
  - `.editorconfig`, `Directory.Build.props`, `global.json`
  - GitHub Actions pipeline
  - Issue/PR templates, Dependabot
- Sprint 1.1: Clean Architecture solution
  - 8-project structure (Core, Infrastructure, API, Modules)
  - 2 test projects (Unit, Integration)
  - Base classes: `Result<T>`, `IDomainEvent`
  - `/health` endpoint
- Governance framework:
  - 10-folder documentation structure
  - Non-Functional Requirements
  - Project Metrics (KPIs)
  - RFC framework

### Changed
- Architecture frozen (ready for implementation)

### Security
- Soft delete + audit logging planned

---

## Legend

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

---

## Version Scheme

Razarth Platform uses **Semantic Versioning**:
- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes

Each module can have its own version independent of the platform.
