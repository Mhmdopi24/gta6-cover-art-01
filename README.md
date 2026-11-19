[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun · gta6-cover-art-01 · rank](https://make.fun/badge/gta6-cover-art-01/Mhmdopi24/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![make.fun · gta6-cover-art-01 · reward](https://make.fun/badge/gta6-cover-art-01/Mhmdopi24/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio — GTA 6-style cover art maker

Turn your own photo and a caption into bold multi-panel poster art in the
style of GTA 6's posters, and export it as a PNG to share. Built for the
[make.fun](https://make.fun/?ref=6qhstm5a) bounty **gta6-cover-art-01**.

## What it does

- **Multi-panel poster art** — three layouts (Hero split, Diagonal trio,
  Grid four) with white-bordered, angled frames, a neon-sunset sky, a
  striped synthwave sun and palm silhouettes.
- **Any photo** — upload one or more photos from your machine (read with
  `FileReader`, never uploaded anywhere). Click a panel to select it, then
  crop and position its photo with zoom / move sliders or by dragging
  inside the preview. One photo can fill every panel, or several photos
  can fill the panels one by one. Two built-in sample photos
  (`app/samples/boulevard.jpg`, `app/samples/pier.jpg`) let you try it in
  one click.
- **Caption** — editable big bold condensed lettering with a gradient fill
  and dark outline, plus an editable tag line in a pill.
- **Colour grades** — three presets (Sunset, Neon night, Palm dusk),
  each a canvas gradient sky plus a wash over every photo.
- **Fast export** — one click downloads a PNG in the post size you picked:
  Square 1080×1080, Portrait 1080×1350, or Wide 1920×1080. Live preview
  updates as you edit.
- **Fully offline** — static files only, no network requests, no
  downloaded fonts (system font families only), no Rockstar logo,
  wordmark, artwork or font anywhere.

## How to run it

```sh
# from the repo root — serves app/ on http://localhost:8080
node serve.ts
# or any static server, e.g.:
python3 -m http.server 8080 --directory app
```

Open `http://localhost:8080` in desktop Chrome, load a photo (or a
sample), pick a layout and grade, type your caption, choose a size and
hit **Download cover PNG**.

## How it is built

- `app/index.html` — editor page.
- `app/style.css` — dark neon editor chrome.
- `app/src/cover.js` — the cover renderer: sky, sun, palms, panels,
  grade wash, caption lettering, vignette (canvas 2D).
- `app/src/main.js` — editor state, uploads, panel selection, drag,
  sliders, export.
- `app/samples/` — two sample photos made with an image model, free to use.
- `main.ts` — the make.fun entrypoint: copies `app/` and `screenshots/`
  into the output directory and writes `dossier.json`.
- `screenshots/` — screenshots of the app and covers it exported.

## License

MIT — see `LICENSE`.
