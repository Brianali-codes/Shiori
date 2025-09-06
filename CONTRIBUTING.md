# Contributing to **Shiori Wallpapers**

First off—thank you for taking the time to contribute! Shiori is a React Native (Expo) wallpaper app with a lightweight desktop companion. We welcome contributions across code, design, docs, performance tuning, and new wallpaper packs—as long as you own the rights to the media you submit.

> **TL;DR**
>
> * Use **TypeScript**, **Expo**, and follow **Conventional Commits**.
> * Open an **issue** before big changes.
> * Run `lint`, `type-check`, and `tests` locally before opening a PR.
> * Only submit wallpapers you **created yourself** or that you have a **clear license** for.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Branching & Git](#branching--git)
5. [Commit Style (Conventional Commits)](#commit-style-conventional-commits)
6. [Coding Standards](#coding-standards)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Testing & Quality Gates](#testing--quality-gates)
9. [Performance & Profiling](#performance--profiling)
10. [Security](#security)
11. [Wallpapers & Media Submission Guide](#wallpapers--media-submission-guide)
12. [Translation & i18n](#translation--i18n)
13. [Release Checklist](#release-checklist)
14. [PR Checklist](#pr-checklist)
15. [Community & Support](#community--support)

---

## Code of Conduct

This project adheres to a Contributor Code of Conduct. By participating, you agree to uphold a respectful, inclusive, and harassment‑free environment. Be kind; disagree constructively; assume good intent.

---

## How Can I Contribute?

### Bug Reports

Please use the **Bug report** issue template and include:

* Steps to reproduce
* Expected vs actual behavior
* Device/OS (e.g., Android 14, iOS 17)
* App version / commit hash
* Logs (`adb logcat` snippet if applicable)
* Screenshots or screen recordings

### Feature Requests / Ideas

Open a **Feature request** issue. Describe the problem, not just the solution. Mockups welcome. For big changes, wait for maintainer feedback before implementation.

### Documentation Improvements

Typos, examples, `README` clarifications, or developer docs—yes please! Small doc fixes can go straight to PRs.

### Design / UI Polish

We welcome thoughtful animations (Framer Motion on web, Reanimated/Moti on native), sensible spacing, and accessible contrast. Share Figma links or screenshots.

### Wallpaper Packs

See: [Wallpapers & Media Submission Guide](#wallpapers--media-submission-guide).

---

## Development Setup

Shiori is built with **React Native + Expo** (managed/ EAS), using **TypeScript** and **expo-router**. A PC client (Tauri/CLI) communicates over **WebSocket** for media sync.

### Prerequisites

* Node.js LTS (≥ 18)
* PNPM or Yarn (preferred) or npm
* Expo CLI (`npm i -g expo`)
* Android SDK / Android Studio for device emulation (or a physical device with USB debugging)

### Getting Started

```bash
# 1) Fork then clone your fork
git clone https://github.com/<you>/shiori.git
cd shiori

# 2) Install deps
pnpm install        # or: yarn / npm i

# 3) Configure environment
cp .env.example .env
# Fill in any required values (see comments inside the file)

# 4) Run the app (choose one)
pnpm expo start
pnpm expo run:android
pnpm expo run:ios      # macOS only
```

### Helpful Scripts

```bash
pnpm lint            # ESLint
pnpm type-check      # TypeScript
pnpm test            # Unit tests
pnpm format          # Prettier
pnpm validate        # lint + type-check + test
```

### Android Notes

* Ensure proper USB drivers and enable **USB debugging**.
* Avoid modifying Gradle directly unless working in Bare/Prebuild mode; prefer Expo config plugins.

---

## Branching & Git

* **main**: stable, release‑ready
* **dev**: integration branch
* **feature/**\*: for new features
* **fix/**\*: for bug fixes
* **chore/**\*: tooling, deps, CI

Keep PRs small and focused. Rebase over merge when possible.

---

## Commit Style (Conventional Commits)

Use the following prefixes:

* `feat:` new feature
* `fix:` bug fix
* `docs:` documentation only
* `style:` formatting, no code change
* `refactor:` neither bug fix nor feature
* `perf:` performance improvements
* `test:` adding or fixing tests
* `build:` build system or dependencies
* `ci:` CI/CD changes
* `chore:` maintenance tasks

**Examples**

```
feat(wallpapers): add progressive image loader
fix(android): correct immersive mode
perf(image-cache): memoize decoded bitmaps
```

---

## Coding Standards

* **Language**: TypeScript (no `any` unless unavoidable)
* **Formatting**: Prettier (project config)
* **Linting**: ESLint (React/React Native + TypeScript rules)
* **Imports**: absolute where configured (e.g., `@/components/...`)
* **State**: React hooks, lightweight state libs only if needed
* **Networking**: `fetch` or lightweight clients; handle timeouts & errors
* **File Naming**: `PascalCase` for components, `camelCase` for others
* **Accessibility**: meaningful labels/roles; touch targets ≥ 44x44

---

## UI/UX Guidelines

* **Performance-first images**: Use progressive/lazy loading; prefer a low‑res preview → full‑res swap. Consider libraries like *React Native Progressive Image*.
* **Smooth scrolling**: Virtualized lists for galleries; avoid large renders.
* **Animations**: Keep <200ms for micro‑interactions; respect reduced motion.
* **Theming**: Light/Dark support; avoid hard‑coded colors.
* **Offline**: Cache recently viewed wallpapers; graceful fallbacks.
* **expo-router**: Keep routes organized under `app/`, co-locate screens & hooks.

---

## Testing & Quality Gates

* Unit tests for utilities, hooks, and critical UI logic
* Snapshot tests for visual regressions where helpful
* Basic E2E flows with Detox (optional)
* All PRs must pass: `pnpm validate`

**Recommended structure**

```
src/
  components/
  screens/
  hooks/
  lib/
  store/
  types/
```

---

## Performance & Profiling

* Use the React Native performance monitor (⌘D/Shake → Perf Monitor)
* Prefer memoization (`React.memo`, `useMemo`, `useCallback`) where it materially reduces work
* Defer heavy image decoding to background (if applicable)
* Measure before/after; include numbers in PR descriptions

---

## Security

* Never commit secrets—use `.env` and keep it out of VCS
* Validate all input for any local HTTP/WebSocket interfaces
* Follow platform privacy rules; declare permissions clearly (e.g., storage access)

---

## Wallpapers & Media Submission Guide

We **only** accept wallpapers that meet **all** of the below:

1. **Ownership & License**

   * You are the original creator **or** you include an explicit license that permits redistribution and modification (e.g., CC BY 4.0).
   * If using models/people/brands, ensure you have model/property releases where applicable.

2. **Quality**

   * Minimum resolution: **2160×3840** (portrait) or **3840×2160** (landscape). Higher is welcome.
   * Clean composition, no artifacts, properly cropped.

3. **Metadata**

   * Provide: `title`, `author`, `license`, `source link` (if any), `tags`.
   * Include an attribution file per pack: `packs/<pack-name>/METADATA.json`.

4. **Folder Structure**

```
assets/wallpapers/
  <pack-name>/
    full/
      <slug>@2x.jpg
    preview/
      <slug>-preview.jpg   # small, optimized
    METADATA.json
```

5. **Optimization**

   * Use visually lossless compression (e.g., mozjpeg/guetzli-equivalent)
   * Provide a **preview** image ≤ 200 KB when possible

6. **Submitting**

   * Open a PR adding your pack under `assets/wallpapers/`
   * In the PR, confirm you own the rights and specify the license

**Example `METADATA.json`**

```json
{
  "pack": "neon-city",
  "license": "CC BY 4.0",
  "source": "https://example.com/neon-city-pack",
  "wallpapers": [
    {
      "slug": "alley-neon",
      "title": "Alley Neon",
      "author": "Your Name",
      "tags": ["city", "neon", "night"],
      "orientation": "portrait"
    }
  ]
}
```

---

## Translation & i18n

* Keep strings in a dedicated i18n file (e.g., `i18n/en.json`)
* Use keys, not literal strings in UI components
* When adding strings, update base locale and include fallbacks

---

## Release Checklist

* [ ] All tests pass
* [ ] Lint & type-check clean
* [ ] Changelog updated
* [ ] Version bumped
* [ ] New assets verified & optimized

---

## PR Checklist

* [ ] My PR targets `dev` and is rebased
* [ ] Follows **Conventional Commits**
* [ ] Includes tests or rationale for no tests
* [ ] Passes `pnpm validate`
* [ ] Updates docs/typings as needed
* [ ] For wallpapers: rights & license included, previews optimized

---

## Community & Support

* Start discussions in GitHub Issues
* Be respectful and constructive

Thank you for helping make **Shiori Wallpapers** fast, beautiful, and reliable.
