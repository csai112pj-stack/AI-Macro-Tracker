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

 const results = TAIWAN_FDA_NUTRITION_DB.map((item: any) => {
    // 同時相容官方 JSON 的中文欄位與系統英文欄位
    const itemName = (item.name || item['樣品名稱'] || item['整合名稱'] || '').toLowerCase();
    const itemCat = (item.category || item['食品分類'] || '').toLowerCase();

    let score = 0;

    // 1. 完全包含
    if (itemName && (itemName.includes(cleanQuery) || cleanQuery.includes(itemName))) {
      score += 100;
    }

    // 2. 關鍵字比對
    const queryChars = cleanQuery.split('');
    let matchedChars = 0;
    for (const char of queryChars) {
      if (itemName.includes(char)) {
        matchedChars++;
      }
    }
    const matchRatio = matchedChars / Math.max(cleanQuery.length, 1);
    score += matchRatio * 40;

    // 將資料格式統一轉回系統需要的 NutritionDbItem 結構
    const normalizedItem: NutritionDbItem = {
      code: item.code || item['樣品編號'] || 'TFDA_ITEM',
      name: item.name || item['樣品名稱'] || '未命名食材',
      category: item.category || item['食品分類'] || '一般食物',
      calories_per_100g: Number(item.calories_per_100g || item['熱量(kcal)'] || item['修正熱量(kcal)'] || 0),
      protein_per_100g: Number(item.protein_per_100g || item['粗蛋白(g)'] || 0),
      carbs_per_100g: Number(item.carbs_per_100g || item['總碳水化合物(g)'] || 0),
      fat_per_100g: Number(item.fat_per_100g || item['粗脂肪(g)'] || 0),
      fiber_per_100g: Number(item.fiber_per_100g || item['膳食纖維(g)'] || 0),
      sodium_per_100g: Number(item.sodium_per_100g || item['鈉(mg)'] || 0),
      common_portion_g: 100,
      portion_unit: "100g"
    };

    return { item: normalizedItem, score: Math.round(score) };
  });

  return results
    .filter(r => r.score > 25)
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
