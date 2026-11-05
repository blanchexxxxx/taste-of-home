# Taste of Home

Food stories and short videos from international students, made for our English class.

Live site: https://blanchexxxxx.github.io/taste-of-home/

## Adding your post

Everything you need to edit is in **`assets/js/data.js`**:

```js
{ id: 'china-shenzhen', location: 'shenzhen',
  author: 'Your name',
  title: 'Grandma\'s Wonton Soup',
  summary: 'One or two sentences about the dish.',
  body: ['First paragraph.', 'Second paragraph.'],
  video: 'assets/videos/shenzhen.mp4',      // or a YouTube / Bilibili embed URL
  poster: 'assets/img/shenzhen.jpg' }       // optional cover image
```

- Put video files in `assets/videos/` (compress to under ~50 MB each), images in `assets/img/`.
- To add a new city to the globe, add it to `LOCATIONS` in the same file (latitude / longitude; `label` sets where the floating label goes).
- Home page slideshow photos: `HERO_PHOTOS` at the bottom of `data.js` (files in `assets/img/hero/`). The current ones are Wikimedia Commons placeholders, credited on the Info page.
- UI translations live in `assets/js/i18n.js` (English, 中文, 日本語, Bahasa Indonesia, မြန်မာ, සිංහල, தமிழ்).

Commit and push to `main`; GitHub Pages updates the site in about a minute.

## Tech

Static HTML/CSS/JS, no build step. 3D globe: [globe.gl](https://github.com/vasturiano/globe.gl) (MIT, bundled in `vendor/`).
Globe texture generated from [Natural Earth](https://www.naturalearthdata.com/) country data (public domain).
Icons: [Phosphor](https://phosphoricons.com/) (MIT). Font: Outfit (SIL OFL).
