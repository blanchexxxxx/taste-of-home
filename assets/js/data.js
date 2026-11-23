/* ============================================================
   EDIT THIS FILE TO ADD THE REAL POSTS.
   ------------------------------------------------------------
   - Any field left as null shows a "coming soon" placeholder.
   - title / summary / body can be a plain string (English), or
     an object with translations: { en: '...', zh: '...' }.
   - body: a list of paragraphs, e.g. ['First paragraph', 'Second'].
   - keywords: a list of { word: '...', meaning: '...' } (optional).
   - ingredients: a list of strings; steps: a list of strings (numbered for you).
     Either can be split into groups: [{ title: 'Sambal', items: ['...', '...'] }, ...].
     Leave either as null to show "coming soon". These appear once body, ingredients or steps is filled in.
   - role: 'teacher' shows "Our teacher" instead of "Student" when author is empty.
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
  surabaya:  { lat: -7.26, lng: 112.75, country: 'indonesia', city: 'surabaya', code: 'ID', side: 'right', label: [-9, 13] },
  yangon:    { lat: 16.84, lng: 96.17,  country: 'myanmar',   city: 'yangon',   code: 'MM', side: 'left', label: [8, -12] },
  colombo:   { lat: 6.93,  lng: 79.86,  country: 'srilanka',  city: 'colombo',  code: 'LK', side: 'left', label: [-5, -14] },
  melbourne: { lat: -37.81, lng: 144.96, country: 'australia', city: 'melbourne', code: 'AU', side: 'right', label: [-6, 14] }
};

window.POSTS = [
  {
    id: 'china-shenzhen', location: 'shenzhen', author: null,
    title: 'Coca-Cola Chicken Wings',
    summary: null,
    body: null,
    ingredients: ['Ginger', 'Chicken wings', 'Oil', 'Coca-Cola', 'Oyster sauce', 'Cooking wine', 'Soy sauce', 'Sugar', 'Dark soy sauce (optional)'],
    steps: [
      'First, make a few cuts on both sides of the chicken wings.',
      'Put the wings in a pot of cold water. Add cooking wine and ginger, and bring it to the boil over high heat. Skim off the foam.',
      'Take the wings out and dry them with kitchen paper.',
      'Heat oil in a pan. Add the wings and fry them until they are golden brown.',
      'Pour in Coca-Cola until it covers the wings.',
      'Add soy sauce, oyster sauce, sugar, and dark soy sauce.',
      'Cook over high heat for 15 minutes until the sauce becomes thick.'
    ],
    video: null, poster: null
  },
  {
    id: 'indonesia', location: 'surabaya', author: null,
    title: 'Ayam Geprek',
    summary: null,
    body: [
      'Some say Ayam Geprek originated from Sleman Regency. A street vendor named Ruminah was approached by a student and asked to put some of her sambal on top of the fried chicken she sells and then crush them together using her pestle. At first, it was named Ayam Gejrot but Ruminah said that it would be easier if it’s called Ayam Geprek. The dish was accidental, but it was no accident that people came to love it. The price ranged from Rp. 10000 - Rp. 18000 in 2017 which was ¥84 - ¥150. This dish has saved a lot of people who are struggling with Indonesia’s economy up until now, because it is cheap and delicious. But due to Indonesia’s poor economy, the price has risen to Rp. 15000 - Rp. 45000 in 2026 which is ¥130 - ¥390, but this is still cheap enough for most people to buy.',
      'The dish is very spicy. Most Indonesians are used to spicy foods, but it might be a problem for foreigners that can’t handle spicy food.'
    ],
    keywords: [
      { word: 'Regency', meaning: 'a small town' },
      { word: 'street vendor', meaning: 'someone who sells things on the street' },
      { word: 'sambal', meaning: 'chili sauce' },
      { word: 'pestle', meaning: '乳棒' },
      { word: 'struggling', meaning: 'having trouble' }
    ],
    ingredients: [
      { title: 'Fried Chicken', items: ['Chicken (Preferably Dark Meat)', 'Flour', 'Oil'] },
      { title: 'Sambal', items: ['Bird’s Eye Chili', 'MSG', 'Garlic', 'Bouillon', 'Salt to taste', 'Sugar', 'Lime (Optional)', 'Shrimp Paste (Optional)', 'Oil after frying fried chicken'] }
    ],
    steps: [
      { title: 'Fried Chicken', items: [
        'Add salt and pepper to flour',
        'Separate half of the flour and add water to make a wet batter',
        'Coat the chicken in dry flour',
        'Dip it in wet batter',
        'Fry the chicken for 5-7 minutes'
      ] },
      { title: 'Sambal', items: [
        'Crush the chillies and garlic in the Mortar & Pestle',
        'Add salt and sugar to taste',
        'Add MSG and Bouillon',
        'Add Lime for a fresher taste',
        'Add Shrimp Paste for extra flavour',
        'Pour the oil after frying the chicken into the sambal to bring out the aroma and flavour of the sambal'
      ] },
      { title: 'Final part', items: [
        'Put the sambal on top of the chicken and crush it with the pestle'
      ] }
    ],
    video: null, poster: null
  },
  {
    id: 'myanmar-1', location: 'yangon', author: null,
    title: 'Lahpet Thoke (Tea Leaf Salad)',
    summary: null,
    body: [
      'Tea Leaf Salad is a traditional Myanmar dish. It is an important part of Myanmar food culture. People often serve it to guests and enjoy it during family gatherings. It is very popular in Myanmar, and it is one of my favourite Myanmar dishes because it is delicious and has a special taste – a little sour, salty and bitter. Just give it a try and you will love it, too.'
    ],
    keywords: [
      { word: 'Fermented', meaning: '発酵' }
    ],
    ingredients: ['Fermented tea leaves', 'Cabbage', 'Tomatoes', 'Fried beans', 'Peanuts', 'Sesame seeds', 'Garlic', 'Green chili', 'Lemon juice', 'Fish sauce', 'Cooking oil'],
    steps: [
      'First, wash the cabbage and tomatoes.',
      'Cut the cabbage, tomatoes, and green chili into small pieces.',
      'Put the fermented tea leaves into a large bowl.',
      'Add the cabbage, tomatoes, fried beans, peanuts, and sesame seeds.',
      'Add garlic, lemon juice, fish sauce, and a little cooking oil.',
      'Mix all the ingredients together.',
      'Finally, put the salad on a plate and serve it.'
    ],
    video: null, poster: null
  },
  { id: 'myanmar-2',      location: 'yangon',   author: null, title: null, summary: null, body: null, video: null, poster: null },
  { id: 'sri-lanka',      location: 'colombo',  author: null, title: null, summary: null, body: null, video: null, poster: null },
  {
    id: 'australia', location: 'melbourne', author: null, role: 'teacher',
    title: 'Pavlova',
    summary: null,
    body: [
      'Pavlova is a light and sweet dessert. It is said to have originated in Australia in the 1920s, in honour of the Russian ballerina Anna Pavlova. It has a crisp, crunchy outside and a soft, fluffy inside, like a marshmallow. The base is made from egg whites and sugar. It is baked slowly in the oven, then topped with whipped cream and fresh fruit, such as strawberries, kiwis, blueberries, or peaches.',
      'Pavlova is popular at birthdays, Christmas, and summer parties in Australia. It looks beautiful on the table, and it is easier to make than it looks. Why not try it at home?'
    ],
    keywords: [
      { word: 'meringue', meaning: 'a sweet, light mixture of egg whites and sugar' },
      { word: 'whip', meaning: 'to beat cream until it is thick' },
      { word: 'topping', meaning: 'food you put on top of something' }
    ],
    ingredients: ['4 large egg whites', '1 ¼ cups white sugar', '2 teaspoons cornstarch', '1 teaspoon vanilla extract', '1 teaspoon lemon juice (optional)', '450 ml heavy cream', 'Fresh fruit, sliced. E.g. strawberries, kiwis, blueberries, peaches'],
    steps: [
      'Preheat the oven to 150 degrees.',
      'Line a baking sheet with cooking paper; draw a 22cm circle on the cooking paper.',
      'Beat egg whites in a glass, metal, or ceramic bowl until stiff but not dry. Gradually add sugar, about 1 tablespoon at a time, beating well after each addition. Continue beating until meringue is thick, white, and glossy.',
      'Gently fold in cornstarch, vanilla extract, and lemon juice.',
      'Spoon mixture inside the circle drawn on the parchment paper. Working from the centre, spread mixture toward the outside edge and build the edge slightly. This should leave a slight depression in the centre.',
      'Bake in the preheated oven until meringue is dry and sounds hollow when tapped, about 1 hour. Cool on a wire rack.',
      'Beat heavy cream in a medium bowl until stiff peaks form; set aside. Remove meringue from the parchment paper and place on a flat serving plate.',
      'Fill centre of meringue with whipped cream and top with sliced fresh fruit.'
    ],
    video: null, poster: null
  }
];

/* Home page round "liquid" photos (first 5 are used; square images work best). The first one starts as the big ball.
   Photos with a `url` are placeholders from Wikimedia Commons (credited on the Info page); the others are the class's own photos.
   Replace with your own photos any time: put the file in assets/img/hero/ and edit this list. */
window.HERO_PHOTOS = [
  { src: 'assets/img/hero/pavlova.jpg',           alt: 'Pavlova with cream and strawberries (Australia)' },
  { src: 'assets/img/hero/noodles.jpg',           alt: 'Homemade Chinese stir-fry noodles',  credit: 'Sonny doe, CC BY-SA 4.0',                  url: 'https://commons.wikimedia.org/wiki/File:Homemade_Chinese_stir_fry_noodles.jpg' },
  { src: 'assets/img/hero/ayam-geprek.jpg',     alt: 'Ayam Geprek, crushed fried chicken with sambal (Indonesia)' },
  { src: 'assets/img/hero/mohinga.jpg',           alt: 'Mohinga, Myanmar fish noodle soup',  credit: 'Allervous, CC BY-SA 4.0',                  url: 'https://commons.wikimedia.org/wiki/File:Mohinga_(20250315).jpg' },
  { src: 'assets/img/hero/curry.jpg',             alt: 'Sri Lankan chicken curry',           credit: 'Swarnamala Priyadarshani, CC BY-SA 4.0',   url: 'https://commons.wikimedia.org/wiki/File:Sri_lankan_chicken_curry.jpg' }
];
