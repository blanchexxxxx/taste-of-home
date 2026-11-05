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
   - side: which side of the dot the globe label sits on ('left' / 'right').
   ============================================================ */

window.LOCATIONS = {
  shenzhen:  { lat: 22.54, lng: 114.06, country: 'china',     city: 'shenzhen', code: 'CN', side: 'right' },
  jakarta:   { lat: -6.21, lng: 106.85, country: 'indonesia', city: 'jakarta',  code: 'ID', side: 'right' },
  yangon:    { lat: 16.84, lng: 96.17,  country: 'myanmar',   city: 'yangon',   code: 'MM', side: 'left' },
  colombo:   { lat: 6.93,  lng: 79.86,  country: 'srilanka',  city: 'colombo',  code: 'LK', side: 'left' }
};

window.POSTS = [
  { id: 'china-shenzhen',   location: 'shenzhen', author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'indonesia',        location: 'jakarta',  author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'myanmar',          location: 'yangon',   author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'sri-lanka',        location: 'colombo',  author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'post-5',           location: null,       author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'post-6',           location: null,       author: null, title: null, summary: null, body: null, video: null, poster: null }
];
