import type { Food, PortionUnit } from './nutrition';
import { indbFoods, indbSource, katoriFoods, type ReadyFoodCategory } from './readyFoodCatalog';
export { readyFoodCategories } from './readyFoodCatalog';

const india = 'https://mcdindia.com/wp-content/uploads/2025/12/product-nutritional-information-bookletpdf.pdf';
const newZealand = 'https://www.mcdonalds.com/content/dam/sites/nz/nfl/About%20us/NZ%20Core%20Food%20Menu_February%202026_0%20%281%29.pdf';
const dominos = 'https://cache.dominos.com/olo/6_161_0/assets/build/market/US/_en/pdf/DominosNutritionGuide.pdf';
const sources = {
  india: { source: 'McDonald’s North & East India', sourceUrl: india },
  newZealand: { source: 'McDonald’s New Zealand', sourceUrl: newZealand },
  dominos: { source: 'Domino’s US', sourceUrl: dominos },
  vegMomo: { source: 'Prasuma Classic Veg label · BigBasket',
    sourceUrl: 'https://www.bigbasket.com/pd/40311985/prasuma-classic-veg-momos-frozen-24-pcs/' },
  chickenMomo: { source: 'Prasuma Peri Peri Chicken label · BigBasket',
    sourceUrl: 'https://www.bigbasket.com/pd/40329216/prasuma-peri-peri-chicken-momos-250-g/' },
  tandooriMomo: { source: 'Prasuma Tandoori Veg label · BigBasket',
    sourceUrl: 'https://www.bigbasket.com/pd/40328814/prasuma-tandoori-momos-veg-280-g/' },
  punjabiSamosa: { source: 'Haldiram Punjabi Samosa label · H-E-B',
    sourceUrl: 'https://www.heb.com/product-detail/haldiram-s-frozen-punjabi-samosas/16284606' },
  miniSamosa: { source: 'Haldiram',
    sourceUrl: 'https://international.haldiram.com/namkeen-and-savories/namkeens/samosa' },
  kachori: { source: 'Haldiram',
    sourceUrl: 'https://international.haldiram.com/namkeen-and-savories/namkeens/kachori' },
  namkeen: { source: 'Haldiram',
    sourceUrl: 'https://international.haldiram.com/namkeen-and-savories/namkeens' },
  onionBhaji: { source: 'Tesco product nutrition',
    sourceUrl: 'https://www.tesco.com/shop/en-GB/products/284256585' },
  pavBhaji: { source: 'Haldiram',
    sourceUrl: 'https://international.haldiram.com/namkeen-and-savories/ready-to-eat' },
  mithai: { source: 'Haldiram',
    sourceUrl: 'https://international.haldiram.com/namkeen-and-savories/tin-sweets' },
  soanPapdi: { source: 'Haldiram',
    sourceUrl: 'https://international.haldiram.com/namkeen-and-savories/soan-papdi' },
};

type ReadyFood = Food & { portion: NonNullable<Food['portion']>; reference: string; category: ReadyFoodCategory; byWeight?: true };

function readyFood(id: string, name: string, source: keyof typeof sources,
  reference: string, unit: Exclude<PortionUnit, 'g' | 'ml'>, grams: number,
  [calories, protein, carbs, fat]: [number, number, number, number], aliases: string[],
  category: ReadyFoodCategory = 'Fast food', nutritionGrams = grams): ReadyFood {
  return {
    id: 'ready-' + id, name, ...sources[source], reference, aliases, category, portion: { unit, grams },
    per100: { calories: calories * 100 / nutritionGrams, protein: protein * 100 / nutritionGrams,
      carbs: carbs * 100 / nutritionGrams, fat: fat * 100 / nutritionGrams },
  };
}

// Serving weights for the NZ burger and fries are approximate, from the per-serve and per-100 g columns.
export const readyFoods: ReadyFood[] = [
  readyFood('veg-momo', 'Veg momo', 'vegMomo', '1 classic vegetable momo (about 21 g), before frying or adding dip', 'piece', 85 / 4,
    [183.14, 4.84, 30.46, 4.66], ['momo', 'momos', 'veg momos', 'vegetable momos', 'steamed momos', 'steamed veg momos'], 'Indian snacks', 100),
  readyFood('chicken-momo', 'Chicken momo', 'chickenMomo', '1 peri-peri chicken momo (20 g), before frying or adding dip', 'piece', 20,
    [192.78, 8.66, 19.96, 8.7], ['chicken momos', 'steamed chicken momo', 'steamed chicken momos', 'peri peri chicken momos'], 'Indian snacks', 100),
  readyFood('tandoori-momo', 'Tandoori veg momo', 'tandooriMomo', '1 tandoori vegetable momo (25 g)', 'piece', 25,
    [212.35, 6.07, 23.19, 10.59], ['tandoori momo', 'tandoori momos', 'tandoori veg momos'], 'Indian snacks', 100),
  readyFood('punjabi-samosa', 'Punjabi samosa', 'punjabiSamosa', '1 potato and pea samosa (70 g)', 'piece', 70,
    [206, 3.1, 23.8, 10.8], ['samosa', 'samosas', 'punjabi samosas', 'aloo samosa', 'aloo samosas', 'potato samosa'], 'Indian snacks'),
  readyFood('mini-samosa', 'Mini samosa', 'miniSamosa', '1 packaged mini samosa (15 g)', 'piece', 15,
    [75, 1, 7, 5], ['mini samosas', 'cocktail samosa', 'cocktail samosas'], 'Indian snacks'),
  readyFood('mini-kachori', 'Mini kachori', 'kachori', '1 packaged mini kachori (20 g)', 'piece', 20,
    [110, 2, 11, 6], ['kachori', 'kachoris', 'mini kachoris'], 'Indian snacks'),
  readyFood('onion-bhaji', 'Onion pakora', 'onionBhaji', '1 small onion bhaji (14 g)', 'piece', 14,
    [30, 0.7, 3.6, 1.2], ['pakora', 'pakoras', 'pakoda', 'pakodas', 'onion pakoras', 'onion bhaji', 'onion bhajis'], 'Indian snacks'),
  readyFood('aloo-bhujia', 'Aloo bhujia', 'namkeen', '1 packaged serving (35 g)', 'serving', 35,
    [230, 2, 14, 18], ['bhujia', 'aloo bhujiya'], 'Indian snacks'),
  readyFood('jhal-muri', 'Jhal muri', 'namkeen', '1 packaged serving (35 g)', 'serving', 35,
    [160, 4, 22, 6], ['jhalmuri', 'packaged jhal muri'], 'Indian snacks'),
  readyFood('pav-bhaji', 'Pav bhaji (bhaji only)', 'pavBhaji', '1 serving of vegetable bhaji (142 g), without bread', 'serving', 142,
    [190, 2, 11, 15], ['bhaji only', 'pav bhaji without bread', 'pao bhaji without bread'], 'Indian snacks'),
  readyFood('gulab-jamun', 'Gulab jamun', 'mithai', '1 reference piece (83 g)', 'piece', 83,
    [260, 3, 53, 4], ['gulab jamuns', 'gulabjamun'], 'Sweets'),
  readyFood('rasgulla', 'Rasgulla', 'mithai', '1 reference piece (71 g)', 'piece', 71,
    [170, 4, 36, 1.5], ['rasgullas', 'rasogolla', 'rasagulla'], 'Sweets'),
  readyFood('rasmalai', 'Rasmalai', 'mithai', '1 reference piece (83 g)', 'piece', 83,
    [200, 5, 41, 1.5], ['ras malai'], 'Sweets'),
  readyFood('soan-papdi', 'Soan papdi', 'soanPapdi', '1 piece (about 30 g)', 'piece', 30,
    [170, 3, 18, 9], ['son papdi', 'soan papri', 'soan papdis'], 'Sweets'),
  readyFood('hamburger', 'Plain hamburger', 'newZealand', '1 beef hamburger', 'piece', 103,
    [257, 13.5, 27.4, 9.9], ['burger', 'burgers', 'hamburger', 'hamburgers', 'plain burger', 'beef burger']),
  readyFood('cheeseburger', 'Cheeseburger', 'newZealand', '1 single-patty cheeseburger', 'piece', 117,
    [306, 16.3, 28, 13.9], ['cheeseburgers', 'cheese burger', 'cheese burgers']),
  readyFood('aloo-tikki', 'Aloo Tikki burger', 'india', '1 McAloo Tikki burger', 'piece', 146,
    [339.52, 8.5, 50.27, 11.31], ['aloo tikki', 'aloo tikki burgers', 'mcaloo tikki', 'mcaloo tikki burger', 'mcaloo tikki burgers']),
  readyFood('veggie', 'Veggie burger', 'india', '1 McVeggie burger', 'piece', 168,
    [387.88, 10.24, 56.54, 13.83], ['veg burger', 'veg burgers', 'veggie burgers', 'mcveggie', 'mcveggie burger', 'vegetable burger']),
  readyFood('chicken', 'Chicken burger', 'india', '1 McChicken burger', 'piece', 173,
    [396.77, 15.66, 47.98, 15.7], ['chicken burgers', 'mcchicken', 'mcchicken burger']),
  readyFood('small-fries', 'Small fries', 'newZealand', '1 small order of fries', 'serving', 76,
    [231, 3.6, 25.7, 12.2], ['fries', 'french fries', 'small french fries']),
  readyFood('medium-fries', 'Medium fries', 'newZealand', '1 medium order of fries', 'serving', 104,
    [316, 5, 35.2, 16.6], ['medium french fries']),
  readyFood('large-fries', 'Large fries', 'newZealand', '1 large order of fries', 'serving', 133,
    [404, 6.4, 45, 21.3], ['large french fries']),
  readyFood('nugget', 'Chicken nugget', 'newZealand', '1 nugget from a six-piece portion', 'piece', 20,
    [312 / 6, 17.2 / 6, 20.9 / 6, 17.5 / 6], ['nugget', 'nuggets', 'chicken nuggets', 'mcnuggets', 'chicken mcnuggets']),
  // Sum the published crust, garlic oil, pizza sauce and regular cheese per slice.
  readyFood('cheese-pizza', 'Cheese pizza slice', 'dominos', '1 slice of a 14-inch hand-tossed cheese pizza', 'slice', 120.8,
    [285, 11, 34, 10.5], ['pizza', 'pizza slice', 'pizza slices', 'cheese pizza slices']),
  ...katoriFoods.map(([slug, name, category, preparation, reference, grams, ml, nutrition, aliases]): ReadyFood => {
    const pieces = slug === 'idli' ? 2 : slug === 'pani-puri' ? 6 : 1;
    const singleItem = pieces > 1 || /^(1 (?:piece|naan|medium roti|plain paratha|.*dosa|leg|.*paratha|poppadom))\b/i.test(reference);
    const unit = singleItem ? 'piece' : 'serving';
    return {
      id: 'ready-katori-' + slug, name, category, aliases,
      reference: pieces > 1 ? '1 piece from ' + reference : preparation + ' recipe · ' + reference,
      source: 'Katori Indian food nutrition dataset', sourceUrl: 'https://getkatori.com/calories/' + slug,
      portion: { unit, grams: grams / pieces }, volume: ml ? { ml, grams } : undefined,
      per100: { calories: nutrition.calories * 100 / grams, protein: nutrition.protein * 100 / grams,
        carbs: nutrition.carbs * 100 / grams, fat: nutrition.fat * 100 / grams },
    };
  }),
  ...indbFoods.map(([code, name, category, [calories, protein, carbs, fat], aliases]): ReadyFood => ({
    id: 'ready-indb-' + code.toLowerCase(), name, category, aliases, byWeight: true,
    source: 'Indian Nutrient Databank', sourceUrl: indbSource,
    reference: '100 g · INDB recipe ' + code, portion: { unit: 'serving', grams: 100 },
    per100: { calories, protein, carbs, fat },
  })),
];
