import { NutritionDbItem } from '../src/types';
import tfdaRawJson from './tfda_full_database.json';

// 自動整理並補齊正確的 code 與內容
export const TAIWAN_FDA_NUTRITION_DB: NutritionDbItem[] = (tfdaRawJson as any[]).map((item, index) => {
  return {
    code: String(item.code || item['整合編號'] || item['樣品編號'] || `TFDA_${index + 1}`),
    name: String(item.name || item['樣品名稱'] || item['整合名稱'] || '未命名食材'),
    category: String(item.category || item['食品分類'] || '一般食物'),
    calories_per_100g: Number(item.calories_per_100g ?? item['熱量(kcal)'] ?? 0),
    protein_per_100g: Number(item.protein_per_100g ?? item['粗蛋白(g)'] ?? 0),
    carbs_per_100g: Number(item.carbs_per_100g ?? item['總碳水化合物(g)'] ?? 0),
    fat_per_100g: Number(item.fat_per_100g ?? item['粗脂肪(g)'] ?? 0),
    fiber_per_100g: Number(item.fiber_per_100g ?? item['膳食纖維(g)'] ?? 0),
    sodium_per_100g: Number(item.sodium_per_100g ?? item['鈉(mg)'] ?? 0),
    common_portion_g: 100,
    portion_unit: "100g"
  };
});

// 白話文精準關鍵字對照
const FOOD_ALIASES: Record<string, string[]> = {
  "雞腿": ["大腿", "雞肉", "肉雞"],
  "白飯": ["白米飯", "蓬萊米", "稻米"],
  "滷蛋": ["雞蛋", "鴨蛋", "蛋"],
  "貢丸": ["豬肉貢丸", "貢丸", "丸"],
  "小白菜": ["小白菜", "不結球白菜"],
  "玉米": ["甜玉米", "玉米"],
  "蘿蔔": ["蘿蔔乾", "醃漬蘿蔔", "蘿蔔"]
};

export function queryNutritionDatabase(query: string, topK: number = 3): {
  item: NutritionDbItem;
  score: number;
}[] {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.toLowerCase().replace(/[\s\-_（）()【】]/g, '');

  let searchKeywords = [cleanQuery];
  for (const [key, aliases] of Object.entries(FOOD_ALIASES)) {
    if (cleanQuery.includes(key)) {
      searchKeywords.push(...aliases);
    }
  }

  const results = TAIWAN_FDA_NUTRITION_DB.map((item) => {
    const itemName = item.name.toLowerCase();
    let maxScore = 0;

    // 完全比對給予最高分
    if (itemName === cleanQuery) {
      maxScore = 100;
    } else {
      for (const kw of searchKeywords) {
        if (itemName.includes(kw)) {
          // 長度匹配度加權，防止所有食材都撞到簡短的通用詞
          const matchScore = 70 + Math.min(kw.length * 5, 25);
          maxScore = Math.max(maxScore, matchScore);
        }
      }
    }

    return { item, score: maxScore };
  });

  return results
    .filter(r => r.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
