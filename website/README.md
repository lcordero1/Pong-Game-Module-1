# Clarity AI Consulting — Website

A single-page site for an AI consulting business (strategy, workflow automation, team
training, custom AI tools). Plain HTML/CSS/JS, no build step or dependencies.

## Preview locally

Open `website/index.html` directly in a browser, or serve it:

```
cd website
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Customize checklist

- **Brand name** — replace "Clarity AI Consulting" (in `index.html` title/nav/footer).
- **Copy** — service descriptions, "How We Work" steps, and the About section are all
  placeholder text in `index.html` — edit to match your actual offering and voice.
- **Contact email** — currently `cordero.lariana@gmail.com` (mailto link + form target).
- **Contact form backend** — the form in `script.js` only shows a local confirmation
  message; it does not send email. Wire it to a service like Formspree/Getform, or a
  serverless function, to actually receive submissions.
- **Colors** — edit the CSS custom properties at the top of `styles.css`
  (`--accent`, `--bg`, etc.) to match your brand.
- **Logo/imagery** — the `assets/` folder is empty; drop in a logo or photos and
  reference them from `index.html` as needed.
