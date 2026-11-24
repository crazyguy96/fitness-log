import { type Food, type Nutrition } from './nutrition';

const usdaSource = 'https://fdc.nal.usda.gov/data-documentation/';

function usda(id: number, name: string, [calories, protein, carbs, fat]: number[], aliases: string[] = []): Food {
  return { id: String(id), name, per100: { calories, protein, carbs, fat }, source: 'USDA FoodData Central · ' + id, sourceUrl: usdaSource, aliases };
}

function indianFood(id: string, name: string, [kilojoules, protein, availableCarbs, fiber, fat]: number[], aliases: string[] = []): Food {
  return {
    id, name, per100: { calories: kilojoules / 4.184, protein, carbs: availableCarbs + fiber, fat },
    source: 'ICMR–NIN Indian Food Composition Tables · ' + id, sourceUrl: 'https://www.nin.res.in/ebooks/IFCT2017.pdf', aliases,
  };
}

export const foodCatalog: Food[] = [
  indianFood('L003', 'Paneer', [1278, 18.86, 2.41, 0, 24.78]),
  {
    id: 'amul-paneer',
    name: 'Amul Fresh Paneer',
    per100: { calories: 312, protein: 20, carbs: 4, fat: 24 },
    source: 'Dudhsagar Dairy · product nutrition',
    sourceUrl: 'https://dudhsagardairy.coop/dairy/products/amul-fresh-paneer/',
    aliases: ['amul paneer'],
  },
  indianFood('A019', 'Atta, whole-wheat flour', [1340, 10.57, 64.17, 11.36, 1.53], ['atta', 'whole wheat flour']),
  indianFood('L002', 'Whole cow milk', [305, 3.26, 4.94, 0, 4.48], ['cow milk', 'whole milk']),
  indianFood('E012', 'Banana, ripe', [440, 1.23, 23.63, 1.94, 0.33], ['banana']),
  indianFood('E001', 'Apple, raw', [261, 0.29, 13.11, 2.59, 0.64], ['apple']),
  indianFood('D043', 'Cucumber, raw', [82, 0.71, 3.48, 2.14, 0.16], ['cucumber']),
  indianFood('D076', 'Tomato, ripe', [82, 0.90, 2.71, 1.77, 0.47], ['tomato']),
  indianFood('G017', 'Onion, raw', [201, 1.50, 9.56, 2.45, 0.24], ['onion']),
  indianFood('C033', 'Spinach, raw', [102, 2.14, 2.05, 2.38, 0.64], ['spinach', 'palak']),
  indianFood('F002', 'Carrot, raw', [139, 0.95, 5.55, 4.18, 0.47], ['carrot']),
  { ...usda(172689, 'Whole-wheat toast', [306, 16.3, 51.2, 4.07], ['toast', 'wheat toast']), id: 'whole-wheat-toast', portion: { unit: 'slice', grams: 25 } },
  { ...usda(172688, 'Whole-wheat bread, untoasted', [252, 12.4, 42.7, 3.5], ['bread', 'whole wheat bread', 'whole wheat breads', 'bread slices']), portion: { unit: 'slice', grams: 32 } },
  usda(174257, 'Whole moong, boiled', [105, 7.02, 19.2, 0.38], ['cooked moong', 'boiled mung beans', 'moong']),
  usda(172421, 'Lentils, boiled', [116, 9.02, 20.1, 0.38], ['cooked lentils', 'boiled dal']),
  usda(168878, 'White rice, cooked', [130, 2.69, 28.2, 0.28], ['cooked rice', 'cooked white rice']),
  { ...usda(170886, 'Plain low-fat yogurt', [63, 5.25, 7.04, 1.55], ['yogurt', 'yoghurt', 'plain yogurt']), volume: { ml: 240, grams: 245 } },
  usda(170903, 'Plain low-fat Greek yogurt', [73, 9.95, 3.94, 1.92], ['greek yogurt', 'greek yoghurt']),
  { ...usda(173424, 'Egg, hard-boiled (large)', [155, 12.6, 1.12, 10.6], ['egg', 'eggs', 'boiled egg', 'boiled eggs', 'hard boiled egg']), portion: { unit: 'piece', grams: 50 } },
  usda(171477, 'Chicken breast, roasted', [165, 31, 0, 3.57], ['cooked chicken breast', 'roasted chicken breast']),
  usda(172475, 'Firm tofu, plain', [144, 17.3, 2.78, 8.72], ['tofu', 'firm tofu']),
  usda(173904, 'Rolled oats, dry', [379, 13.2, 67.7, 6.52], ['dry oats', 'rolled oats']),
];

export const nutrientLabels: Record<keyof Nutrition, string> = {
  calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
};
