<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Run and deploy your AI Studio app

![Build Status](https://github.com/USERNAME/REPO/actions/workflows/deploy.yml/badge.svg)

</div>

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1l3bv3fOJjhOQZCxTzyzsLhTr_tjYOZF8

## Run Locally

**Prerequisites:**
- Node.js (v20+ recommended)
- `npm` (usually comes with Node.js)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env` to `.env.local` (if applicable) or ensure `GEMINI_API_KEY` is set.
   - Note: The app expects `GEMINI_API_KEY` to be available.

3. **Run the app:**
   ```bash
   npm run dev
   ```

## Deployment

This project is configured to deploy automatically to **GitHub Pages** using GitHub Actions.

### How it works
1. Push changes to the `main` or `master` branch.
2. The `.github/workflows/deploy.yml` action will trigger.
3. It builds the project and deploys the `dist` folder to the `gh-pages` branch.

### Setup on GitHub
1. Go to your repository **Settings**.
2. Navigate to **Pages**.
3. Under **Build and deployment**, select **Source** as `Deploy from a branch`.
4. Select `gh-pages` branch and `/ (root)` folder (Note: This branch will be created after the first successful action run).
