# Surprise Page

A tiny React app for making warm, private surprise pages for the people you love — a bestie on Friendship Day, a sister on Rakshabandhan, a birthday note. Fill in the Studio, hit **Publish**, share the link. Works from any browser (phone included) once you've done a one-time token setup.

Live at: **https://moulin-cm.github.io/for-you/**

## How it works

Three routes, all served by the same static build:

- **`/#/admin`** — the Studio. Pick recipient + occasion, add photos + message, hit **Publish**.
- **`/#/g/<slug>`** — the short shareable link. Loads a JSON committed under `public/gifts/`.
- **`/#/gift?d=…`** — the self-contained fallback. Whole gift lives in the URL fragment.

When you hit **Publish**, the Studio commits `public/gifts/<slug>.json` to the `main` branch via the GitHub API. The Gift page reads it directly from `raw.githubusercontent.com`, so it works within a minute — no local build, no `npm run deploy` between gifts.

## First-time setup (once per browser)

The Studio needs a **fine-grained personal access token** so it can commit gift files for you.

1. Go to **https://github.com/settings/personal-access-tokens/new**
2. **Repository access** → Only select repositories → `Moulin-CM/for-you`
3. **Repository permissions** → **Contents**: Read and write
4. Generate, copy the token, paste it into the Studio.

The token is stored in that browser's `localStorage` and only sent to `api.github.com`. Nothing else.

Do this once per browser (phone, laptop, whatever). To add a new device, just paste the token again there.

## Making a new gift

1. Open **https://moulin-cm.github.io/for-you/#/admin** (phone or laptop, anywhere).
2. Fill in recipient, occasion, photos, message.
3. Slug auto-suggests something like `moulin-for-kali-birthday`. Edit if you want.
4. Click **Publish**. Wait a few seconds.
5. Copy the link and send.

That's the whole loop. No files to move, no commits to type, no terminal.

## When to use the self-contained link instead

Tucked under a details toggle. Best for:
- Someone else is using this app and doesn't want to make a token
- Text-only quick notes (no big photos)
- Truly ephemeral / one-time shares

The URL grows with every photo — a 6-photo gift is easily 700 KB of URL, which still works but is unwieldy to send.

## Local dev

```bash
npm install
npm run dev
```

Open the printed URL. `/#/admin` for the Studio.

## Redeploying the app itself

Publishing gifts doesn't need a redeploy. But if you change the app code:

```bash
npm run deploy
```

This runs `vite build` and pushes `dist/` to the `gh-pages` branch. GitHub Pages picks it up in ~30 s.

## Forking under another account

Edit `src/config.js`:

```js
export const REPO_OWNER  = 'your-username'
export const REPO_NAME   = 'your-repo-name'
export const REPO_BRANCH = 'main'
```

Then push to your GitHub repo, deploy, done. The Studio's PAT setup will reference the new repo automatically.

## Notes on comfort

Warm, platonic defaults — friendship and sisterhood, nothing romantic. The recipient can close the envelope again at any time (top-right pill), and no interaction on the sharable page collects any data from them.

## Notes on tone

- `*bold*` and `_italic_` work in the message.
- Line breaks and blank paragraphs are preserved.
- HEIC (iPhone) photos are auto-converted on upload.
