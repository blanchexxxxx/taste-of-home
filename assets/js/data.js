/* ============================================================
   EDIT THIS FILE TO ADD THE REAL POSTS.
   ------------------------------------------------------------
   - Any field left as null shows a "coming soon" placeholder.
   - title / summary / body can be a plain string (English), or
     an object with translations: { en: '...', zh: '...' }.
   - body: a list of paragraphs, e.g. ['First paragraph', 'Second'].
   - video:
       * a file in this repo, e.g. 'assets/videos/shenzhen.mp4'
         (keep each file under ~50 MB; compress first), or
       * an embed URL, e.g. 'https://www.youtube.com/embed/VIDEO_ID'
         or 'https://player.bilibili.com/player.html?bvid=BVxxxx'
   - poster: optional cover image, e.g. 'assets/img/shenzhen.jpg'
   - location: one of the keys in LOCATIONS below (or null if unknown).
     Posts that share a location share one globe label; the popup lists them all.
   - side: which side of the line end the globe label sits on ('left' / 'right').
   - label: [latOffset, lngOffset] in degrees: where the floating label goes, relative to the city.
   ============================================================ */

window.LOCATIONS = {
  shenzhen:  { lat: 22.54, lng: 114.06, country: 'china',     city: 'shenzhen', code: 'CN', side: 'right', label: [7, 13] },
  jakarta:   { lat: -6.21, lng: 106.85, country: 'indonesia', city: 'jakarta',  code: 'ID', side: 'right', label: [-9, 13] },
  yangon:    { lat: 16.84, lng: 96.17,  country: 'myanmar',   city: 'yangon',   code: 'MM', side: 'left', label: [8, -12] },
  colombo:   { lat: 6.93,  lng: 79.86,  country: 'srilanka',  city: 'colombo',  code: 'LK', side: 'left', label: [-5, -14] }
};

window.POSTS = [
  { id: 'china-shenzhen', location: 'shenzhen', author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'indonesia',      location: 'jakarta',  author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'myanmar-1',      location: 'yangon',   author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'myanmar-2',      location: 'yangon',   author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'sri-lanka',      location: 'colombo',  author: null, title: null, summary: null, body: null, video: null, poster: null }
];

/* Home page slideshow. Placeholder photos from Wikimedia Commons (free licenses, credited on the Info page).
   Replace with your own photos any time: put the file in assets/img/hero/ and edit this list. */
window.HERO_PHOTOS = [
  { src: 'assets/img/hero/wok.jpg',        alt: 'Cooking with a wok',                 credit: 'Mx. Granger, CC0',                         url: 'https://commons.wikimedia.org/wiki/File:Cooking_with_a_wok_on_an_outdoor_stove_5.jpg' },
  { src: 'assets/img/hero/noodles.jpg',    alt: 'Homemade Chinese stir-fry noodles',  credit: 'Sonny doe, CC BY-SA 4.0',                  url: 'https://commons.wikimedia.org/wiki/File:Homemade_Chinese_stir_fry_noodles.jpg' },
  { src: 'assets/img/hero/nasigoreng.jpg', alt: 'Nasi goreng vendor in Jakarta',      credit: 'Gunkarta, CC BY-SA 3.0',                   url: 'https://commons.wikimedia.org/wiki/File:Nasi_Goreng_Travelling_Vendor_in_Jakarta.JPG' },
  { src: 'assets/img/hero/mohinga.jpg',    alt: 'Mohinga, Myanmar fish noodle soup',  credit: 'Allervous, CC BY-SA 4.0',                  url: 'https://commons.wikimedia.org/wiki/File:Mohinga_(20250315).jpg' },
  { src: 'assets/img/hero/curry.jpg',      alt: 'Sri Lankan chicken curry',           credit: 'Swarnamala Priyadarshani, CC BY-SA 4.0',   url: 'https://commons.wikimedia.org/wiki/File:Sri_lankan_chicken_curry.jpg' }
];
