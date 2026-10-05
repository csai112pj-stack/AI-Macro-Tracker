import { NutritionDbItem } from '../src/types';

/**
 * 台灣衛福部食藥署 (TFDA) 食品營養成分資料庫 精選與常用健身食材基準表
 * 數值以每 100g 可食部分計 (kcal, g)
 */
export const TAIWAN_FDA_NUTRITION_DB: NutritionDbItem[] = [
  // 蛋白質與肉類類
  {
    code: "TFDA_M001",
    name: "去皮雞胸肉 (生/熟平均)",
    category: "肉類",
    calories_per_100g: 119,
    protein_per_100g: 23.3,
    carbs_per_100g: 0.1,
    fat_per_100g: 2.1,
    fiber_per_100g: 0,
    sodium_per_100g: 62,
    common_portion_g: 150,
    portion_unit: "1 片掌心大"
  },
  {
    code: "TFDA_M002",
    name: "舒肥雞胸肉 / 煎雞胸肉",
    category: "肉類",
    calories_per_100g: 133,
    protein_per_100g: 26.5,
    carbs_per_100g: 0.8,
    fat_per_100g: 2.5,
    fiber_per_100g: 0,
    sodium_per_100g: 240,
    common_portion_g: 140,
    portion_unit: "1 包/塊"
  },
  {
    code: "TFDA_M003",
    name: "去皮雞腿肉",
    category: "肉類",
    calories_per_100g: 143,
    protein_per_100g: 19.8,
    carbs_per_100g: 0,
    fat_per_100g: 6.8,
    fiber_per_100g: 0,
    sodium_per_100g: 80,
    common_portion_g: 150,
    portion_unit: "1 隻大雞腿"
  },
  {
    code: "TFDA_M004",
    name: "牛板腱肉 (低脂牛肉)",
    category: "肉類",
    calories_per_100g: 166,
    protein_per_100g: 21.9,
    carbs_per_100g: 0.2,
    fat_per_100g: 8.2,
    fiber_per_100g: 0,
    sodium_per_100g: 58,
    common_portion_g: 150,
    portion_unit: "1 份牛排"
  },
  {
    code: "TFDA_M005",
    name: "牛沙朗肉",
    category: "肉類",
    calories_per_100g: 218,
    protein_per_100g: 20.2,
    carbs_per_100g: 0.1,
    fat_per_100g: 15.0,
    fiber_per_100g: 0,
    sodium_per_100g: 64,
    common_portion_g: 180,
    portion_unit: "6 盎司牛排"
  },
  {
    code: "TFDA_M006",
    name: "豬里肌肉 (精瘦)",
    category: "肉類",
    calories_per_100g: 140,
    protein_per_100g: 22.2,
    carbs_per_100g: 0.3,
    fat_per_100g: 5.4,
    fiber_per_100g: 0,
    sodium_per_100g: 50,
    common_portion_g: 120,
    portion_unit: "1 片肉排"
  },
  {
    code: "TFDA_M007",
    name: "鮭魚 (大西洋鮭)",
    category: "水產類",
    calories_per_100g: 208,
    protein_per_100g: 20.4,
    carbs_per_100g: 0,
    fat_per_100g: 13.4,
    fiber_per_100g: 0,
    sodium_per_100g: 59,
    common_portion_g: 150,
    portion_unit: "1 塊中厚切"
  },
  {
    code: "TFDA_M008",
    name: "台灣鯛魚片 / 鱸魚片",
    category: "水產類",
    calories_per_100g: 110,
    protein_per_100g: 20.8,
    carbs_per_100g: 0.5,
    fat_per_100g: 2.6,
    fiber_per_100g: 0,
    sodium_per_100g: 75,
    common_portion_g: 120,
    portion_unit: "1 片魚柳"
  },
  {
    code: "TFDA_M009",
    name: "白蝦仁",
    category: "水產類",
    calories_per_100g: 85,
    protein_per_100g: 19.5,
    carbs_per_100g: 0.4,
    fat_per_100g: 0.6,
    fiber_per_100g: 0,
    sodium_per_100g: 180,
    common_portion_g: 100,
    portion_unit: "6-8 尾蝦"
  },
  {
    code: "TFDA_E001",
    name: "雞蛋 (全蛋/水煮蛋/荷包蛋)",
    category: "蛋類",
    calories_per_100g: 143,
    protein_per_100g: 12.8,
    carbs_per_100g: 0.9,
    fat_per_100g: 9.8,
    fiber_per_100g: 0,
    sodium_per_100g: 140,
    common_portion_g: 55,
    portion_unit: "1 顆中型蛋"
  },
  {
    code: "TFDA_E002",
    name: "純蛋白液 / 水煮蛋白",
    category: "蛋類",
    calories_per_100g: 52,
    protein_per_100g: 11.2,
    carbs_per_100g: 0.7,
    fat_per_100g: 0.2,
    fiber_per_100g: 0,
    sodium_per_100g: 166,
    common_portion_g: 35,
    portion_unit: "1 顆蛋的蛋白"
  },
  {
    code: "TFDA_D001",
    name: "傳統豆腐 (板豆腐)",
    category: "豆類",
    calories_per_100g: 88,
    protein_per_100g: 8.5,
    carbs_per_100g: 2.1,
    fat_per_100g: 5.2,
    fiber_per_100g: 0.6,
    sodium_per_100g: 18,
    common_portion_g: 120,
    portion_unit: "1/4 塊板豆腐"
  },
  {
    code: "TFDA_D002",
    name: "嫩豆腐",
    category: "豆類",
    calories_per_100g: 51,
    protein_per_100g: 4.9,
    carbs_per_100g: 1.8,
    fat_per_100g: 2.7,
    fiber_per_100g: 0.3,
    sodium_per_100g: 12,
    common_portion_g: 150,
    portion_unit: "半盒嫩豆腐"
  },
  {
    code: "TFDA_D003",
    name: "無糖高纖豆漿",
    category: "豆類",
    calories_per_100g: 35,
    protein_per_100g: 3.6,
    carbs_per_100g: 1.2,
    fat_per_100g: 1.8,
    fiber_per_100g: 1.2,
    sodium_per_100g: 15,
    common_portion_g: 400,
    portion_unit: "1 瓶 (超商)"
  },
  {
    code: "TFDA_D004",
    name: "毛豆 (仁)",
    category: "豆類",
    calories_per_100g: 129,
    protein_per_100g: 13.8,
    carbs_per_100g: 7.2,
    fat_per_100g: 5.0,
    fiber_per_100g: 5.0,
    sodium_per_100g: 6,
    common_portion_g: 100,
    portion_unit: "1 小碗"
  },
  {
    code: "TFDA_S001",
    name: "乳清蛋白粉 (Whey Isolate/Concentrate)",
    category: "補充品",
    calories_per_100g: 390,
    protein_per_100g: 78.0,
    carbs_per_100g: 6.0,
    fat_per_100g: 4.5,
    fiber_per_100g: 0.5,
    sodium_per_100g: 180,
    common_portion_g: 32,
    portion_unit: "1 份匙"
  },

  // 碳水化合物與全穀雜糧
  {
    code: "TFDA_C001",
    name: "白米飯 (煮熟)",
    category: "穀物類",
    calories_per_100g: 142,
    protein_per_100g: 2.6,
    carbs_per_100g: 31.0,
    fat_per_100g: 0.3,
    fiber_per_100g: 0.4,
    sodium_per_100g: 2,
    common_portion_g: 160,
    portion_unit: "1 平碗"
  },
  {
    code: "TFDA_C002",
    name: "糙米飯 (煮熟)",
    category: "穀物類",
    calories_per_100g: 138,
    protein_per_100g: 3.1,
    carbs_per_100g: 29.8,
    fat_per_100g: 1.0,
    fiber_per_100g: 1.8,
    sodium_per_100g: 3,
    common_portion_g: 160,
    portion_unit: "1 平碗"
  },
  {
    code: "TFDA_C003",
    name: "紫米黑米飯 / 五穀飯",
    category: "穀物類",
    calories_per_100g: 140,
    protein_per_100g: 3.4,
    carbs_per_100g: 29.5,
    fat_per_100g: 1.2,
    fiber_per_100g: 2.2,
    sodium_per_100g: 2,
    common_portion_g: 160,
    portion_unit: "1 平碗"
  },
  {
    code: "TFDA_C004",
    name: "地瓜 (蒸烤黃金/紅肉地瓜)",
    category: "全穀雜糧",
    calories_per_100g: 114,
    protein_per_100g: 1.5,
    carbs_per_100g: 27.2,
    fat_per_100g: 0.2,
    fiber_per_100g: 2.5,
    sodium_per_100g: 35,
    common_portion_g: 150,
    portion_unit: "1 條中型地瓜"
  },
  {
    code: "TFDA_C005",
    name: "馬鈴薯 (蒸水煮)",
    category: "全穀雜糧",
    calories_per_100g: 77,
    protein_per_100g: 2.0,
    carbs_per_100g: 17.5,
    fat_per_100g: 0.1,
    fiber_per_100g: 1.8,
    sodium_per_100g: 6,
    common_portion_g: 150,
    portion_unit: "1 顆中馬鈴薯"
  },
  {
    code: "TFDA_C006",
    name: "大燕麥片 (乾)",
    category: "全穀雜糧",
    calories_per_100g: 379,
    protein_per_100g: 13.5,
    carbs_per_100g: 66.8,
    fat_per_100g: 6.5,
    fiber_per_100g: 8.5,
    sodium_per_100g: 3,
    common_portion_g: 50,
    portion_unit: "半碗 (乾重)"
  },
  {
    code: "TFDA_C007",
    name: "全麥吐司",
    category: "烘焙麵點",
    calories_per_100g: 250,
    protein_per_100g: 9.2,
    carbs_per_100g: 45.8,
    fat_per_100g: 3.5,
    fiber_per_100g: 5.2,
    sodium_per_100g: 410,
    common_portion_g: 60,
    portion_unit: "1 片厚片或 2 薄片"
  },
  {
    code: "TFDA_C008",
    name: "義大利麵 (煮熟純麵)",
    category: "麵食類",
    calories_per_100g: 158,
    protein_per_100g: 5.8,
    carbs_per_100g: 30.9,
    fat_per_100g: 0.9,
    fiber_per_100g: 1.8,
    sodium_per_100g: 5,
    common_portion_g: 180,
    portion_unit: "1 盤中等分量"
  },
  {
    code: "TFDA_C009",
    name: "甜玉米 (煮熟)",
    category: "全穀雜糧",
    calories_per_100g: 96,
    protein_per_100g: 3.3,
    carbs_per_100g: 20.8,
    fat_per_100g: 1.3,
    fiber_per_100g: 2.4,
    sodium_per_100g: 15,
    common_portion_g: 120,
    portion_unit: "半根玉米"
  },

  // 蔬菜類 (微量熱量、高纖維、微量元素)
  {
    code: "TFDA_V001",
    name: "青花菜 / 綠花椰菜 (熟)",
    category: "蔬菜類",
    calories_per_100g: 35,
    protein_per_100g: 2.8,
    carbs_per_100g: 6.0,
    fat_per_100g: 0.4,
    fiber_per_100g: 2.8,
    sodium_per_100g: 33,
    common_portion_g: 120,
    portion_unit: "1 拳頭大小"
  },
  {
    code: "TFDA_V002",
    name: "菠菜 (炒/煮)",
    category: "蔬菜類",
    calories_per_100g: 24,
    protein_per_100g: 2.4,
    carbs_per_100g: 3.4,
    fat_per_100g: 0.3,
    fiber_per_100g: 2.2,
    sodium_per_100g: 70,
    common_portion_g: 100,
    portion_unit: "1 份青菜"
  },
  {
    code: "TFDA_V003",
    name: "高麗菜 (炒/煮)",
    category: "蔬菜類",
    calories_per_100g: 25,
    protein_per_100g: 1.3,
    carbs_per_100g: 5.3,
    fat_per_100g: 0.2,
    fiber_per_100g: 1.3,
    sodium_per_100g: 12,
    common_portion_g: 120,
    portion_unit: "1 碟蔬菜"
  },
  {
    code: "TFDA_V004",
    name: "綜合生菜沙拉 (美生菜/芝麻葉/紫甘藍)",
    category: "蔬菜類",
    calories_per_100g: 18,
    protein_per_100g: 1.2,
    carbs_per_100g: 3.5,
    fat_per_100g: 0.2,
    fiber_per_100g: 1.5,
    sodium_per_100g: 10,
    common_portion_g: 100,
    portion_unit: "1 中盆生菜"
  },
  {
    code: "TFDA_V005",
    name: "大番茄 (牛番茄)",
    category: "蔬菜類",
    calories_per_100g: 19,
    protein_per_100g: 0.9,
    carbs_per_100g: 4.1,
    fat_per_100g: 0.2,
    fiber_per_100g: 1.2,
    sodium_per_100g: 8,
    common_portion_g: 130,
    portion_unit: "1 顆中番茄"
  },
  {
    code: "TFDA_V006",
    name: "杏鮑菇 / 綜合菇類 (熟)",
    category: "蔬菜類",
    calories_per_100g: 32,
    protein_per_100g: 2.6,
    carbs_per_100g: 5.8,
    fat_per_100g: 0.4,
    fiber_per_100g: 2.9,
    sodium_per_100g: 5,
    common_portion_g: 100,
    portion_unit: "半碗切片菇"
  },

  // 優質油脂與水果類
  {
    code: "TFDA_F001",
    name: "酪梨 (牛油果)",
    category: "油脂與堅果種子類",
    calories_per_100g: 160,
    protein_per_100g: 2.0,
    carbs_per_100g: 8.5,
    fat_per_100g: 14.7,
    fiber_per_100g: 6.7,
    sodium_per_100g: 7,
    common_portion_g: 60,
    portion_unit: "1/4 顆酪梨"
  },
  {
    code: "TFDA_F002",
    name: "綜合堅果 (核桃/杏仁/腰果 無調味)",
    category: "油脂與堅果種子類",
    calories_per_100g: 607,
    protein_per_100g: 18.2,
    carbs_per_100g: 21.0,
    fat_per_100g: 53.0,
    fiber_per_100g: 7.0,
    sodium_per_100g: 5,
    common_portion_g: 20,
    portion_unit: "1 湯匙/小把"
  },
  {
    code: "TFDA_F003",
    name: "橄欖油 / 苦茶油 (烹調用)",
    category: "油脂類",
    calories_per_100g: 884,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 100.0,
    fiber_per_100g: 0,
    sodium_per_100g: 0,
    common_portion_g: 10,
    portion_unit: "1 茶匙"
  },
  {
    code: "TFDA_FR001",
    name: "香蕉",
    category: "水果類",
    calories_per_100g: 89,
    protein_per_100g: 1.1,
    carbs_per_100g: 22.8,
    fat_per_100g: 0.3,
    fiber_per_100g: 2.6,
    sodium_per_100g: 1,
    common_portion_g: 110,
    portion_unit: "1 根中型香蕉"
  },
  {
    code: "TFDA_FR002",
    name: "富士蘋果",
    category: "水果類",
    calories_per_100g: 52,
    protein_per_100g: 0.3,
    carbs_per_100g: 13.8,
    fat_per_100g: 0.2,
    fiber_per_100g: 2.4,
    sodium_per_100g: 1,
    common_portion_g: 160,
    portion_unit: "1 顆中蘋果"
  },
  {
    code: "TFDA_FR003",
    name: "奇異果 (綠/黃金)",
    category: "水果類",
    calories_per_100g: 61,
    protein_per_100g: 1.1,
    carbs_per_100g: 14.7,
    fat_per_100g: 0.5,
    fiber_per_100g: 3.0,
    sodium_per_100g: 3,
    common_portion_g: 100,
    portion_unit: "1 顆奇異果"
  },
  {
    code: "TFDA_L001",
    name: "希臘優格 (無加糖脫脂/低脂)",
    category: "乳品類",
    calories_per_100g: 73,
    protein_per_100g: 10.0,
    carbs_per_100g: 4.0,
    fat_per_100g: 1.5,
    fiber_per_100g: 0,
    sodium_per_100g: 45,
    common_portion_g: 150,
    portion_unit: "1 盒杯裝"
  },
  {
    code: "TFDA_L002",
    name: "低脂鮮乳",
    category: "乳品類",
    calories_per_100g: 46,
    protein_per_100g: 3.3,
    carbs_per_100g: 4.8,
    fat_per_100g: 1.5,
    fiber_per_100g: 0,
    sodium_per_100g: 40,
    common_portion_g: 250,
    portion_unit: "1 馬克杯"
  }
];

/**
 * 簡易而精準的 RAG 查詢器：將食物名稱分解並計算字元/關鍵字相似度，
 * 返回衛福部資料庫中最匹配的數筆真實成分紀錄。
 */
export function queryNutritionDatabase(query: string, topK: number = 3): {
  item: NutritionDbItem;
  score: number;
}[] {
  const cleanQuery = query.toLowerCase().replace(/[\s\-_（）()【】]/g, '');
  if (!cleanQuery) return [];

  const results = TAIWAN_FDA_NUTRITION_DB.map((item) => {
    const itemName = item.name.toLowerCase();
    const itemCat = item.category.toLowerCase();

    let score = 0;

    // 完全包含
    if (itemName.includes(cleanQuery) || cleanQuery.includes(itemName)) {
      score += 100;
    }

    // 關鍵詞匹配
    const queryKeywords = cleanQuery.split('');
    let matchedChars = 0;
    for (const char of queryKeywords) {
      if (itemName.includes(char)) {
        matchedChars++;
      }
    }
    score += (matchedChars / Math.max(cleanQuery.length, 1)) * 50;

    // 特殊核心詞權重
    const coreTerms = [
      '雞胸', '雞肉', '雞腿', '牛肉', '沙朗', '板腱', '鮭魚', '蛋', '水煮蛋', 
      '豆腐', '豆漿', '飯', '白飯', '糙米', '紫米', '地瓜', '燕麥', '花椰菜', 
      '酪梨', '吐司', '優格', '毛豆', '蝦', '沙拉', '番茄', '香蕉', '高麗菜'
    ];

    for (const term of coreTerms) {
      if (cleanQuery.includes(term) && itemName.includes(term)) {
        score += 40;
      }
    }

    return { item, score };
  });

  return results
    .filter(r => r.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 將多個辨識候選食物在衛福部資料庫中進行 RAG 檢索，生成 Prompt 注入文本
 */
export function buildNutritionRagContext(candidateFoods: string[]): string {
  if (!candidateFoods || candidateFoods.length === 0) return "";

  const allHits = new Map<string, NutritionDbItem>();

  for (const food of candidateFoods) {
    const matched = queryNutritionDatabase(food, 2);
    for (const match of matched) {
      allHits.set(match.item.code, match.item);
    }
  }

  if (allHits.size === 0) return "";

  let context = `【政府「食品營養成分資料庫 (TFDA)」官方標準基準值 (每100g)】:\n`;
  Array.from(allHits.values()).forEach((item) => {
    context += `- [${item.code}] ${item.name}: 熱量 ${item.calories_per_100g} kcal | 蛋白質 ${item.protein_per_100g}g | 碳水 ${item.carbs_per_100g}g | 脂肪 ${item.fat_per_100g}g | 纖維 ${item.fiber_per_100g}g (常用份量: ${item.common_portion_g}g / ${item.portion_unit})\n`;
  });

  return context;
}
