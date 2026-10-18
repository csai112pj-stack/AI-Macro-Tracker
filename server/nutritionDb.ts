import { NutritionDbItem } from '../src/types';
import tfdaFullDb from './tfda_full_database.json'; // 直接引用剛剛上傳的 JSON

// 載入完整食藥署資料庫
export const TAIWAN_FDA_NUTRITION_DB: NutritionDbItem[] = tfdaFullDb as NutritionDbItem[];

/**
 * 純 TS 高效原生模糊與加權比對演算法 (免額外套件)
 */
export function queryNutritionDatabase(query: string, topK: number = 3): {
  item: NutritionDbItem;
  score: number;
}[] {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.toLowerCase().replace(/[\s\-_（）()【】]/g, '');

  const results = TAIWAN_FDA_NUTRITION_DB.map((item) => {
    const itemName = (item.name || '').toLowerCase();
    const itemCat = (item.category || '').toLowerCase();

    let score = 0;

    // 1. 完全包含 (權重最高)
    if (itemName.includes(cleanQuery)) {
      score += 100;
    } else if (cleanQuery.includes(itemName) && itemName.length > 1) {
      score += 80;
    }

    // 2. 雙向關鍵字匹配率
    const queryChars = cleanQuery.split('');
    let matchedChars = 0;
    for (const char of queryChars) {
      if (itemName.includes(char)) {
        matchedChars++;
      }
    }
    const matchRatio = matchedChars / Math.max(cleanQuery.length, 1);
    score += matchRatio * 40;

    // 3. 分類相符加分
    if (itemCat && cleanQuery.includes(itemCat)) {
      score += 20;
    }

    return { item, score: Math.round(score) };
  });

  // 過濾掉分數過低的無關選項並降序排序，取 Top K
  return results
    .filter(r => r.score > 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 構建 RAG Context Prompt 注入文本
 */
export function buildNutritionRagContext(candidateFoods: string[]): string {
  if (!candidateFoods || candidateFoods.length === 0) return "";

  const allHits = new Map<string, NutritionDbItem>();

  for (const food of candidateFoods) {
    const matched = queryNutritionDatabase(food, 2);
    for (const match of matched) {
      allHits.set(match.item.code || match.item.name, match.item);
    }
  }

  if (allHits.size === 0) return "";

  let context = `【政府「食品營養成分資料庫 (TFDA)」官方標準基準值 (每100g)】:\n`;
  Array.from(allHits.values()).forEach((item) => {
    context += `- [${item.code || 'TFDA'}] ${item.name}: 熱量 ${item.calories_per_100g} kcal | 蛋白質 ${item.protein_per_100g}g | 碳水 ${item.carbs_per_100g}g | 脂肪 ${item.fat_per_100g}g (常用份量: ${item.common_portion_g || 100}g / ${item.portion_unit || '1份'})\n`;
  });

  return context;
}
