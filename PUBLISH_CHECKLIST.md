# Publish Checklist (Judge-Only)

Use this checklist to open-source the judge while keeping private systems private.

## 1) Keep Scope Narrow

Publish only files in this directory:

- `src/*`
- `README.md`
- `JUDGE_SPEC.md`
- `RUN_MANIFEST.template.json`
- `package.json`
- `tsconfig.json`

Do not include app/backend files from the private monorepo.

## 2) Secrets and Private Data

- Do not publish `.env*`
- Do not publish private URLs/endpoints
- Do not publish internal emails/user IDs
- Do not publish proprietary ops scripts

## 3) New Public Repo (No Private History)

Create a new repository and copy this folder contents into it.
Avoid making the private monorepo public.

## 4) Verify Package Is Self-Contained

- `npm install`
- `npm run check`
- `npm run build`

## 5) Add License and Governance

- Confirm `MIT` (or your chosen license)
- Add CONTRIBUTING.md (optional)
- Add SECURITY.md (optional)

## 6) Publish Method

Option A: GitHub public repo only  
Option B: GitHub + npm package

## 7) Transparency Add-On

For each production run, store a manifest based on `RUN_MANIFEST.template.json`.
This makes future audits materially easier.
