# Repository Guidelines

## Project Structure & Module Organization

The static website entry point is `index.html`. UI logic and styles live in `src/`; versioned tax data, validation, and calculations live in `src/tax/`. Tests mirror that layout under `tests/tax/`. Development and build scripts are in `scripts/`, the tax specification is in `specs/`, and the generated `dist/` directory is ignored by Git. Keep assets in `assets/` if they are added.

If the chosen framework imposes a standard layout, follow that layout and update this guide in the same pull request.

## Build, Test, and Development Commands

Node.js 24 or later is required; there are no third-party packages to install. Run:

- `npm run dev`: serve the website at `http://localhost:4173`.
- `npm test`: run the Node test suite.
- `npm run lint`: check JavaScript syntax without changing files.
- `npm run build`: copy the static website to `dist/` for Vercel.

Commands used in continuous integration should also work from a clean local checkout.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, and JavaScript. Keep modules as native ECMAScript modules, with `camelCase` functions and variables and hyphenated file names. Store tax constants only in the versioned policy file, never in UI code. Use `npm run lint` before a pull request; it checks syntax, not formatting. Explain Spanish tax terms in public-facing text.

## Testing Guidelines

Add focused Node tests under `tests/tax/` for behavior changes, using `*.test.js` filenames. Cover bracket boundaries, rounding, zero values, invalid inputs, family allowances, Social Security limits, and changes to annual rules. Bug fixes require a regression test. Run `npm test` from a clean checkout.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects, optionally with a Conventional Commit prefix, such as `feat: add regional allowance calculation`.

Pull requests should explain the problem and solution, list verification commands, and link relevant issues. Include screenshots for UI changes and call out assumptions, tax-year sources, migrations, or configuration changes. Keep each pull request focused and update affected documentation.

## Security & Configuration

Never commit taxpayer data, credentials, or local environment files. Provide sanitized examples such as `.env.example`, validate all financial inputs, and record the source and effective tax year for calculation rules.

## Deployment

The website will be deployed on Vercel

## Website

The website itself will be a static page
