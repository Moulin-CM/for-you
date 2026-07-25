# Surprise Page

A tiny React app for making warm, private surprise pages for the people you love — a bestie on Friendship Day, a sister on Rakshabandhan, a birthday note. You fill in the Studio, get a shareable link, and send it whenever you're ready.

## How it works

Three routes, all served by the same static build:

- **`/#/admin`** — the Studio. Pick recipient, occasion, add photos + a message, and get a shareable link.
- **`/#/g/<slug>`** — the **short link** (recommended). Loads a small JSON file you committed under `public/gifts/`.
- **`/#/gift?d=…`** — the **self-contained link**. The whole gift lives inside the URL fragment — no file commit needed, but the URL is huge if photos are involved.

Nothing you type in the Studio is uploaded anywhere. URL fragments never leave the browser, and JSON files only exist in your own repo. No accounts, no analytics, no backend.

### Choosing between the two links

| | Short link | Self-contained link |
|---|---|---|
| URL length | ~60 chars | tens/hundreds of KB with photos |
| Setup per gift | Save JSON to `public/gifts/`, `npm run deploy` | None — just copy the link |
| Works if you never push | No — file must be online | Yes |
| Best for | Anything with photos | Text-only quick notes |

The Studio gives you both. Use the short one when you can.

## Local development

```bash
npm install
npm run dev
```

Then open the printed URL. Go to `/#/admin` to build a surprise.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (e.g. `surprise-page`).
2. Deploy the built site:

   ```bash
   npm run deploy
   ```

   This runs `vite build` and pushes `dist/` to the `gh-pages` branch.

3. In the repo settings → **Pages**, set the source to the `gh-pages` branch. Your site will be at `https://<you>.github.io/<repo>/`.

`vite.config.js` uses `base: './'`, so the same build works whether the site is at the root of a custom domain or under a repo sub-path.

## Notes on comfort

The default copy, colors, and structure lean warm and platonic — friendship, sisterhood, care. Nothing romantic by default. The recipient can close the envelope again at any time (top-right pill), and no interactions collect any data from them.

## Tips for a good link

- Keep photos to **6–8** for the smoothest experience. The app resizes each to ~1100px on the long edge at JPEG quality 0.78.
- **HEIC (iPhone) photos work** — they're converted to JPEG in the browser on upload.
- In the message field, `*word*` renders as **bold** and `_word_` as _italic_. Line breaks and blank lines are preserved.
- Test the link yourself first (Open in new tab in the Studio) before sending.

## Adding a new gift with the short-link flow

1. Fill in the Studio and give it a slug like `moulin-for-kali-birthday`.
2. Click **Download gift file** → you get `moulin-for-kali-birthday.json`.
3. Drop that file into `public/gifts/` in this repo.
4. `npm run deploy`.
5. Share `https://<you>.github.io/<repo>/#/g/moulin-for-kali-birthday`.
