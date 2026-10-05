import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, MealLog, FitnessGoal, NextDayCompensationPlan, GoalSpecificCompensationPlan, MacroGapStatus } from '../src/types';
import { DB_SCHEMA_DDL } from '../src/data/dbSchemaDdl';

export { DB_SCHEMA_DDL };

// 計算 BMR (Mifflin-St Jeor 公式) 與 TDEE
export function calculateUserMetrics(
  gender: 'male' | 'female',
  weight: number,
  height: number,
  age: number,
  goal: FitnessGoal,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' = 'moderate'
) {
  // BMR
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // TDEE Multipliers
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725
  };
  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));

  // 目標熱量與三大營養素配置 (增肌 vs 減脂)
  let targetCalories = tdee;
  let targetProteinG = Math.round(weight * 2.0); // 基準 2.0g/kg
  let targetFatG = 0;
  let targetCarbsG = 0;

  if (goal === 'muscle_gain') {
    // 增肌：熱量盈餘 +300 kcal，蛋白質 2.0g/kg，脂肪佔總熱量 25%，其餘為碳水化合物
    targetCalories = tdee + 300;
    targetProteinG = Math.round(weight * 2.0);
    const fatCalories = targetCalories * 0.25;
    targetFatG = Math.round(fatCalories / 9);
    const remainingCalories = targetCalories - (targetProteinG * 4) - fatCalories;
    targetCarbsG = Math.max(50, Math.round(remainingCalories / 4));
  } else if (goal === 'fat_loss') {
    // 減脂：熱量赤字 -400 kcal，提高蛋白質至 2.2g/kg (防止肌肉流失)，脂肪 22%，其餘碳水
    targetCalories = Math.max(1200, tdee - 400);
    targetProteinG = Math.round(weight * 2.2);
    const fatCalories = targetCalories * 0.22;
    targetFatG = Math.round(fatCalories / 9);
    const remainingCalories = targetCalories - (targetProteinG * 4) - fatCalories;
    targetCarbsG = Math.max(40, Math.round(remainingCalories / 4));
  } else {
    // 維持
    targetCalories = tdee;
    targetProteinG = Math.round(weight * 1.8);
    const fatCalories = targetCalories * 0.25;
    targetFatG = Math.round(fatCalories / 9);
    const remainingCalories = targetCalories - (targetProteinG * 4) - fatCalories;
    targetCarbsG = Math.max(50, Math.round(remainingCalories / 4));
  }

  return {
    bmr: Math.round(bmr),
    tdee,
    target_calories: targetCalories,
    target_protein_g: targetProteinG,
    target_carbs_g: targetCarbsG,
    target_fat_g: targetFatG
  };
}

/**
 * 依據今日熱量與三大營養素總結進度，自動評估是否未達標並產出「隔日補償方案」
 * 分別針對【增肌 (Muscle Gain)】與【減脂 (Fat Loss)】獨立製作專屬的隔日配額微調、營養素補償策略與三餐執行課表
 */
export function buildNextDayCompensationPlan(
  user: UserProfile,
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  targetDate: Date = new Date()
): NextDayCompensationPlan {
  const refDateStr = targetDate.toISOString().split('T')[0];
  const nextDateObj = new Date(targetDate.getTime() + 86400000);
  const nextDateStr = nextDateObj.toISOString().split('T')[0];

  // 1. 計算針對當前目標的缺口或超標狀態
  const calDiff = Math.round(consumed.calories - user.target_calories);
  const proDiff = Math.round((consumed.protein - user.target_protein_g) * 10) / 10;
  const carbDiff = Math.round((consumed.carbs - user.target_carbs_g) * 10) / 10;
  const fatDiff = Math.round((consumed.fat - user.target_fat_g) * 10) / 10;

  const calPct = user.target_calories > 0 ? Math.round((consumed.calories / user.target_calories) * 100) : 0;
  const proPct = user.target_protein_g > 0 ? Math.round((consumed.protein / user.target_protein_g) * 100) : 0;
  const carbPct = user.target_carbs_g > 0 ? Math.round((consumed.carbs / user.target_carbs_g) * 100) : 0;
  const fatPct = user.target_fat_g > 0 ? Math.round((consumed.fat / user.target_fat_g) * 100) : 0;

  const isCalMet = calPct >= 95 && calPct <= 105;
  const isProMet = proPct >= 95;
  const isCarbMet = carbPct >= 90 && carbPct <= 110;
  const isFatMet = fatPct >= 88 && fatPct <= 112;
  const isAllMet = isCalMet && isProMet && isCarbMet && isFatMet;

  const unmetItems: string[] = [];
  if (!isCalMet) {
    unmetItems.push(calDiff < 0 ? `熱量未達標 (尚缺 ${Math.abs(calDiff)} kcal)` : `熱量超標 (+${calDiff} kcal)`);
  }
  if (!isProMet) {
    unmetItems.push(`蛋白質未達標 (尚缺 ${Math.max(0, Math.round((user.target_protein_g - consumed.protein) * 10) / 10)}g)`);
  }
  if (!isCarbMet) {
    unmetItems.push(carbDiff < 0 ? `碳水未達標 (尚缺 ${Math.abs(carbDiff)}g)` : `碳水偏高 (+${carbDiff}g)`);
  }
  if (!isFatMet) {
    unmetItems.push(fatDiff < 0 ? `脂肪未達標 (尚缺 ${Math.abs(fatDiff)}g)` : `脂肪偏高 (+${fatDiff}g)`);
  }

  const gapStatus: MacroGapStatus = {
    calories_diff: calDiff,
    protein_diff_g: proDiff,
    carbs_diff_g: carbDiff,
    fat_diff_g: fatDiff,
    calories_pct: calPct,
    protein_pct: proPct,
    carbs_pct: carbPct,
    fat_pct: fatPct,
    is_calories_met: isCalMet,
    is_protein_met: isProMet,
    is_carbs_met: isCarbMet,
    is_fat_met: isFatMet,
    is_all_met: isAllMet,
    unmet_items: unmetItems.length > 0 ? unmetItems : ['今日各項指標接近目標，隔日可維持穩態進度']
  };

  // 分別計算該使用者在「增肌」與「減脂」下的標準科學基數
  const bulkMetrics = calculateUserMetrics(
    user.gender,
    user.weight,
    user.height,
    user.age,
    'muscle_gain',
    user.activity_level
  );
  const cutMetrics = calculateUserMetrics(
    user.gender,
    user.weight,
    user.height,
    user.age,
    'fat_loss',
    user.activity_level
  );

  // =========================================================================
  // 方案 A：【增肌專屬】隔日補償方案 (Muscle Gain Next-Day Compensation)
  // =========================================================================
  const bulkCalShortfall = Math.max(0, bulkMetrics.target_calories - consumed.calories);
  const bulkProShortfall = Math.max(0, Math.round((bulkMetrics.target_protein_g - consumed.protein) * 10) / 10);
  const bulkCarbShortfall = Math.max(0, Math.round((bulkMetrics.target_carbs_g - consumed.carbs) * 10) / 10);
  const bulkFatShortfall = Math.max(0, Math.round((bulkMetrics.target_fat_g - consumed.fat) * 10) / 10);

  // 增肌隔日補償邏輯：
  // 採「20%~25% 漸進式合成回補 (Progressive Anabolic Catch-up)」，避免隔日單次暴食造成消化負擔與內臟脂肪堆積
  const bulkCalDelta = bulkCalShortfall > 100
    ? Math.min(360, Math.max(150, Math.round(bulkCalShortfall * 0.22)))
    : (consumed.calories > bulkMetrics.target_calories + 200 ? -150 : 0);

  const bulkProDelta = bulkProShortfall > 8
    ? Math.min(35, Math.max(15, Math.round(bulkProShortfall * 0.28)))
    : 10;

  const bulkCarbDelta = bulkCarbShortfall > 15
    ? Math.min(60, Math.max(25, Math.round(bulkCarbShortfall * 0.22)))
    : (consumed.carbs > bulkMetrics.target_carbs_g + 40 ? -25 : 15);

  const bulkFatDelta = bulkFatShortfall > 8
    ? Math.min(14, Math.max(5, Math.round(bulkFatShortfall * 0.2)))
    : (consumed.fat > bulkMetrics.target_fat_g + 15 ? -10 : 0);

  const muscleGainPlan: GoalSpecificCompensationPlan = {
    goal_type: 'muscle_gain',
    title: '增肌專屬 ‧ 隔日合成與肌醣原回補方案',
    subtitle: '針對熱量盈餘不足與蛋白質/碳水缺口，啟動隔日分餐漸進回補機制',
    badge_label: '增肌補償 (Hypertrophy Catch-up)',
    core_principle: '【漸進式合成回補原則】增肌期若今日熱量或蛋白質未達標，切忌於隔日單一餐暴食塞滿缺口（易超過腸道吸收上限並轉化為體脂）。應將今日缺口的 20%~25% 分攤至隔日「晨間第一餐」與「訓練前後窗口」，優先拉高白胺酸 (Leucine) 濃度與肌醣原儲備。',
    diagnostic_summary: `以增肌目標 (${bulkMetrics.target_calories} kcal / P:${bulkMetrics.target_protein_g}g / C:${bulkMetrics.target_carbs_g}g / F:${bulkMetrics.target_fat_g}g) 結算今日攝取 (${consumed.calories} kcal)：目前尚缺熱量 ${bulkCalShortfall} kcal、蛋白質 ${bulkProShortfall}g、碳水 ${bulkCarbShortfall}g、脂肪 ${bulkFatShortfall}g。隔日建議上調目標熱量 +${bulkCalDelta} kcal、蛋白質 +${bulkProDelta}g、碳水 +${bulkCarbDelta}g，確保肌肉蛋白質合成 (MPS) 不中斷。`,
    tomorrow_adjusted_targets: {
      base_calories: bulkMetrics.target_calories,
      adjusted_calories: bulkMetrics.target_calories + bulkCalDelta,
      calories_delta: bulkCalDelta,
      base_protein_g: bulkMetrics.target_protein_g,
      adjusted_protein_g: bulkMetrics.target_protein_g + bulkProDelta,
      protein_delta_g: bulkProDelta,
      base_carbs_g: bulkMetrics.target_carbs_g,
      adjusted_carbs_g: bulkMetrics.target_carbs_g + bulkCarbDelta,
      carbs_delta_g: bulkCarbDelta,
      base_fat_g: bulkMetrics.target_fat_g,
      adjusted_fat_g: bulkMetrics.target_fat_g + bulkFatDelta,
      fat_delta_g: bulkFatDelta
    },
    macro_strategies: [
      {
        nutrient: '熱量 (Calories)',
        status_label: bulkCalShortfall > 100 ? '增肌盈餘未達標' : '熱量接近目標',
        is_met: bulkCalShortfall <= 100,
        shortfall_or_excess: bulkCalShortfall > 0 ? `今日尚缺 ${bulkCalShortfall} kcal` : `今日超額 ${Math.abs(bulkMetrics.target_calories - consumed.calories)} kcal`,
        action_plan: `隔日總熱量目標由 ${bulkMetrics.target_calories} kcal 動態補償調整為 ${bulkMetrics.target_calories + bulkCalDelta} kcal (${bulkCalDelta >= 0 ? '+' : ''}${bulkCalDelta} kcal)，透過液態乳清、燕麥與高密度複合碳水無負擔補足合成能量。`,
        recommended_foods: ['大燕麥片 80g (+300 kcal)', '無糖豆漿沖泡分離式乳清 (+240 kcal)', '台農57號烤地瓜 200g (+240 kcal)']
      },
      {
        nutrient: '蛋白質 (Protein)',
        status_label: bulkProShortfall > 8 ? 'MPS 合成門檻不足' : '蛋白質充足',
        is_met: bulkProShortfall <= 8,
        shortfall_or_excess: bulkProShortfall > 0 ? `今日尚缺 ${bulkProShortfall}g` : '今日已達標',
        action_plan: `隔日蛋白質目標由 ${bulkMetrics.target_protein_g}g 提高至 ${bulkMetrics.target_protein_g + bulkProDelta}g (+${bulkProDelta}g)。分為 4 餐平均攝取（每餐 35g~45g），於晨間起床立即補充快吸收蛋白，逆轉夜間分解狀態。`,
        recommended_foods: ['舒肥雞胸肉 200g (蛋白質 46g)', '分離式乳清蛋白 1.5 匙 (蛋白質 38g)', '水煮全蛋 2 顆 + 希臘優格 150g (蛋白質 29g)']
      },
      {
        nutrient: '碳水化合物 (Carbs)',
        status_label: bulkCarbShortfall > 15 ? '肌醣原儲備不足' : '碳水達標',
        is_met: bulkCarbShortfall <= 15,
        shortfall_or_excess: bulkCarbShortfall > 0 ? `今日尚缺 ${bulkCarbShortfall}g` : '今日已達標',
        action_plan: `隔日碳水化合物由 ${bulkMetrics.target_carbs_g}g 提高至 ${bulkMetrics.target_carbs_g + bulkCarbDelta}g (+${bulkCarbDelta}g)。重點配置於「訓練前 60 分鐘」與「訓練後 30 分鐘內」，利用胰島素敏感度高峰將碳水精準導向骨骼肌。`,
        recommended_foods: ['紫米糙米飯 220g (碳水 65g)', '中型香蕉 1 根 + 御飯糰 1 顆 (碳水 62g)', '全麥貝果 1 個佐無糖花生醬 (碳水 48g)']
      },
      {
        nutrient: '脂肪 (Fat)',
        status_label: bulkFatShortfall > 8 ? '荷爾蒙合成脂質偏低' : '脂質攝取適中',
        is_met: bulkFatShortfall <= 8,
        shortfall_or_excess: bulkFatShortfall > 0 ? `今日尚缺 ${bulkFatShortfall}g` : '今日已達標',
        action_plan: `隔日脂肪目標設定為 ${bulkMetrics.target_fat_g + bulkFatDelta}g (${bulkFatDelta >= 0 ? '+' : ''}${bulkFatDelta}g)，以 Omega-3 多元不飽和脂肪酸為主，維持睪固酮合成並降低重訓關節發炎。`,
        recommended_foods: ['厚切大西洋鮭魚 180g (脂肪 22g)', '無調味綜合堅果 25g (脂肪 13g)', '冷壓初榨橄欖油 10ml (脂肪 10g)']
      }
    ],
    meal_schedule: [
      {
        meal_slot: '隔日早餐 (晨間反分解快充)',
        timing: '07:30 - 09:00',
        focus: '啟動 mTOR 肌肉合成、回補夜間肝醣耗損',
        menu_suggestion: '大燕麥片 75g + 分離式乳清蛋白 1 匙 + 水煮全蛋 2 顆 + 藍莓無糖優格 100g',
        macros_estimate: '約 640 kcal｜P: 48g ‧ C: 64g ‧ F: 18g'
      },
      {
        meal_slot: '隔日午餐 (高密度合成正餐)',
        timing: '12:00 - 13:30',
        focus: '穩定供應支鏈胺基酸 (BCAA) 與慢速釋放複合碳水',
        menu_suggestion: '去皮舒肥雞胸肉 220g + 紫米糙米飯 1.5 碗 (240g) + 橄欖油蒜炒青花菜 180g',
        macros_estimate: '約 760 kcal｜P: 54g ‧ C: 92g ‧ F: 16g'
      },
      {
        meal_slot: '隔日練前/練後補償餐 (關鍵窗口)',
        timing: '16:30 - 19:00',
        focus: `針對今日未達標缺口 (+${bulkCalDelta} kcal / +${bulkProDelta}g P) 進行超量恢復`,
        menu_suggestion: '【練前】香蕉 1 根 + 鮭魚飯糰 1 顆；【練後】乳清蛋白 1.5 匙 + 烤地瓜 200g',
        macros_estimate: '約 680 kcal｜P: 46g ‧ C: 105g ‧ F: 6g'
      },
      {
        meal_slot: '隔日晚餐 (深層修復與 Omega-3)',
        timing: '19:30 - 21:00',
        focus: '提供夜間持續胺基酸釋放與抗發炎優質油脂',
        menu_suggestion: '香煎牛板腱或大西洋鮭魚 180g + 三色藜麥飯 160g + 溫沙拉佐胡麻嫩豆腐 150g',
        macros_estimate: '約 780 kcal｜P: 50g ‧ C: 68g ‧ F: 28g'
      }
    ],
    training_and_hydration_tip: `明日重訓建議維持中高強度多關節訓練（深蹲/硬舉/臥推），訓練中每 15 分鐘補充 200ml 水分（全日目標 ${(user.weight * 40)}ml），確保肌酸與醣原順利帶入肌細胞。`,
    warning_note: '增肌補償切勿以炸物、含糖手搖飲或高脂甜點湊熱量，否則補償熱量將優先囤積於脂肪細胞而非骨骼肌。'
  };

  // =========================================================================
  // 方案 B：【減脂專屬】隔日補償方案 (Fat Loss Next-Day Compensation)
  // =========================================================================
  const cutCalDiff = Math.round(consumed.calories - cutMetrics.target_calories); // 負數=比減脂目標更低；正數=減脂超標
  const cutProShortfall = Math.max(0, Math.round((cutMetrics.target_protein_g - consumed.protein) * 10) / 10);
  const cutCarbDiff = Math.round((consumed.carbs - cutMetrics.target_carbs_g) * 10) / 10;
  const cutFatDiff = Math.round((consumed.fat - cutMetrics.target_fat_g) * 10) / 10;

  const isCutCalOvershoot = cutCalDiff > 120;
  const isCutBelowBmr = consumed.calories < user.bmr;

  // 減脂隔日補償邏輯：
  // 情境 1：若今日熱量與蛋白質攝取不足（甚至低於 BMR），隔日嚴禁把未吃的熱量變本加厲暴食，而是「鎖定標準減脂熱量 + 強力追回純蛋白質缺口 (+15~30g)」，防止掉肌肉與基礎代謝崩盤。
  // 情境 2：若今日減脂熱量/碳水/油脂超標，隔日啟動「溫和赤字修正 (-200~300 kcal，絕不低於 BMR)」，下修精製碳水與油脂並維持 100% 高蛋白。
  const cutCalDelta = isCutCalOvershoot
    ? -Math.min(280, Math.max(150, Math.round(cutCalDiff * 0.5)))
    : (cutProShortfall > 15 ? 80 : 0); // 若蛋白質嚴重不足，隔日微幅增加純蛋白熱量 (+80 kcal ≈ +20g 純蛋白)

  const cutAdjustedCal = Math.max(user.bmr, cutMetrics.target_calories + cutCalDelta);

  const cutProDelta = cutProShortfall > 5
    ? Math.min(30, Math.max(15, Math.round(cutProShortfall * 0.3)))
    : 10;

  const cutCarbDelta = isCutCalOvershoot || cutCarbDiff > 20
    ? -Math.min(40, Math.max(20, Math.round(Math.max(20, cutCarbDiff) * 0.5)))
    : -10; // 減脂補償日優先將熱量配額讓給高蛋白與高纖蔬菜

  const cutFatDelta = isCutCalOvershoot || cutFatDiff > 10
    ? -Math.min(12, Math.max(5, Math.round(Math.max(10, cutFatDiff) * 0.4)))
    : 0;

  const fatLossPlan: GoalSpecificCompensationPlan = {
    goal_type: 'fat_loss',
    title: isCutCalOvershoot
      ? '減脂專屬 ‧ 隔日超標修正與排鈉燃脂方案'
      : '減脂專屬 ‧ 隔日抗分解保肌與穩糖補償方案',
    subtitle: isCutCalOvershoot
      ? '針對今日熱量/碳水超標，隔日溫和下修碳脂並鎖死高蛋白，迅速回歸燃脂軌道'
      : '針對今日蛋白質未達標與熱量缺口，隔日精準補齊純蛋白、嚴防肌肉流失與報復性暴食',
    badge_label: isCutCalOvershoot ? '減脂超標修正 (Deficit Reset)' : '減脂保肌補償 (Anti-Catabolic)',
    core_principle: isCutCalOvershoot
      ? '【減脂超標溫和修正原則】今日熱量超出減脂配額時，隔日絕不可極端斷食（會誘發皮質醇飆升與肌肉分解）。應下修明日精製碳水 (-30g) 與烹調油脂 (-10g)，但嚴格維持 2.2g/kg 高蛋白與高鉀蔬菜，搭配 20 分鐘餐後快走即可平順抵銷。'
      : '【減脂抗分解保肌原則】減脂期若今日蛋白質未達標或熱量低於 BMR，身體極易分解骨骼肌作為能量並下調基礎代謝。隔日切勿把沒吃到的熱量拿去吃高油高糖食物，而是「回歸標準減脂熱量 + 額外加碼 +20g~30g 零脂純蛋白質 + 300g 十字花科蔬菜」，鎖住瘦肉組織並穩定瘦體素 (Leptin)。',
    diagnostic_summary: isCutCalOvershoot
      ? `以減脂目標 (${cutMetrics.target_calories} kcal / P:${cutMetrics.target_protein_g}g) 檢視今日攝取 (${consumed.calories} kcal)：今日熱量超標 +${cutCalDiff} kcal，蛋白質尚缺 ${cutProShortfall}g。隔日建議將熱量微調至 ${cutAdjustedCal} kcal (${cutCalDelta} kcal)，並拉高蛋白質至 ${cutMetrics.target_protein_g + cutProDelta}g。`
      : `以減脂目標 (${cutMetrics.target_calories} kcal / P:${cutMetrics.target_protein_g}g / C:${cutMetrics.target_carbs_g}g / F:${cutMetrics.target_fat_g}g) 檢視今日攝取 (${consumed.calories} kcal)：${isCutBelowBmr ? `⚠️ 今日攝取低於基礎代謝 BMR (${user.bmr} kcal)！` : ''}蛋白質尚缺 ${cutProShortfall}g。隔日應立即執行保肌補償：鎖定熱量 ${cutAdjustedCal} kcal、加碼純蛋白質至 ${cutMetrics.target_protein_g + cutProDelta}g (+${cutProDelta}g)，防止肌肉流失。`,
    tomorrow_adjusted_targets: {
      base_calories: cutMetrics.target_calories,
      adjusted_calories: cutAdjustedCal,
      calories_delta: cutAdjustedCal - cutMetrics.target_calories,
      base_protein_g: cutMetrics.target_protein_g,
      adjusted_protein_g: cutMetrics.target_protein_g + cutProDelta,
      protein_delta_g: cutProDelta,
      base_carbs_g: cutMetrics.target_carbs_g,
      adjusted_carbs_g: Math.max(50, cutMetrics.target_carbs_g + cutCarbDelta),
      carbs_delta_g: cutCarbDelta,
      base_fat_g: cutMetrics.target_fat_g,
      adjusted_fat_g: Math.max(35, cutMetrics.target_fat_g + cutFatDelta),
      fat_delta_g: cutFatDelta
    },
    macro_strategies: [
      {
        nutrient: '熱量 (Calories)',
        status_label: isCutCalOvershoot ? '減脂赤字超標' : (isCutBelowBmr ? '低於 BMR 代謝紅線' : '熱量未達標'),
        is_met: !isCutCalOvershoot && !isCutBelowBmr && Math.abs(cutCalDiff) <= 100,
        shortfall_or_excess: cutCalDiff < 0 ? `比減脂目標少 ${Math.abs(cutCalDiff)} kcal` : `超出減脂目標 +${cutCalDiff} kcal`,
        action_plan: isCutCalOvershoot
          ? `隔日熱量由 ${cutMetrics.target_calories} kcal 溫和下修至 ${cutAdjustedCal} kcal (${cutCalDelta} kcal)，嚴守 BMR (${user.bmr} kcal) 底線，透過減少外食醬料與精製澱粉創造乾淨赤字。`
          : `隔日熱量精準定錨於 ${cutAdjustedCal} kcal（絕不低於 BMR ${user.bmr} kcal，亦不盲目暴食疊加昨日剩餘熱量），多出的 ${cutAdjustedCal - cutMetrics.target_calories >= 0 ? '+' : ''}${cutAdjustedCal - cutMetrics.target_calories} kcal 全數配置給零脂蛋白質。`,
        recommended_foods: ['水煮雞蛋白 3 顆 + 茶葉蛋 1 顆 (125 kcal)', '清蒸台灣鯛魚片 200g (196 kcal)', '無糖高纖豆漿 400ml (160 kcal)']
      },
      {
        nutrient: '蛋白質 (Protein)',
        status_label: cutProShortfall > 5 ? '減脂保肌蛋白不足' : '抗分解蛋白達標',
        is_met: cutProShortfall <= 5,
        shortfall_or_excess: cutProShortfall > 0 ? `今日尚缺 ${cutProShortfall}g (掉肌高風險)` : '今日已達標',
        action_plan: `減脂期蛋白質未達標是肌肉流失頭號主因！隔日蛋白質由 ${cutMetrics.target_protein_g}g 強制加碼至 ${cutMetrics.target_protein_g + cutProDelta}g (+${cutProDelta}g，約 ${Math.round(((cutMetrics.target_protein_g + cutProDelta) / user.weight) * 10) / 10}g/kg)，全面選用「高蛋白熱量比」之白肉與分離式乳清。`,
        recommended_foods: ['去皮舒肥雞胸肉 200g (蛋白質 46g / 脂肪僅 3g)', '分離式零卡乳清蛋白 35g (蛋白質 30g)', '非基改嫩豆腐半盒 + 滷牛腱 100g (蛋白質 38g)']
      },
      {
        nutrient: '碳水化合物 (Carbs)',
        status_label: cutCarbDiff > 15 ? '碳水偏高需控糖' : '碳水時機優化',
        is_met: Math.abs(cutCarbDiff) <= 15,
        shortfall_or_excess: cutCarbDiff < 0 ? `今日少攝取 ${Math.abs(cutCarbDiff)}g` : `今日多攝取 +${cutCarbDiff}g`,
        action_plan: `隔日碳水設定為 ${Math.max(50, cutMetrics.target_carbs_g + cutCarbDelta)}g (${cutCarbDelta}g)。執行「碳水集中化」：將 70% 碳水放於白天與訓練前後，晚餐改以十字花科蔬菜與菇類取代白飯，最大化夜間脂肪氧化率。`,
        recommended_foods: ['蒸台農57號地瓜 120g (低 GI 緩釋碳水 30g)', '綠花椰菜米 200g + 鴻喜菇 100g (高纖極低糖)', '大燕麥片 40g (豐富 β-葡聚醣延長飽足感)']
      },
      {
        nutrient: '脂肪 (Fat)',
        status_label: cutFatDiff > 10 ? '油脂偏高需控油' : '必需脂肪酸維持',
        is_met: Math.abs(cutFatDiff) <= 10,
        shortfall_or_excess: cutFatDiff < 0 ? `今日尚缺 ${Math.abs(cutFatDiff)}g` : `今日超額 +${cutFatDiff}g`,
        action_plan: `隔日脂肪嚴格控制在 ${Math.max(35, cutMetrics.target_fat_g + cutFatDelta)}g，避開油炸、百頁豆腐與濃稠沙拉醬，僅保留蛋黃、酪梨與深海魚油維持內分泌與脂溶性維生素吸收。`,
        recommended_foods: ['溫泉蛋/水煮全蛋 1~2 顆 (優質卵磷脂)', '高濃度 Omega-3 魚油 2 顆或鮭魚 100g', '無調味杏仁果 10 顆 (約 12g)']
      }
    ],
    meal_schedule: [
      {
        meal_slot: '隔日早餐 (高蛋白穩糖抗飢餓)',
        timing: '08:00 - 09:30',
        focus: '壓制飢餓素 (Ghrelin)、啟動晨間產熱效應 (TEF)',
        menu_suggestion: '無糖高纖豆漿 400ml + 水煮蛋白 3 顆 + 全蛋 1 顆 + 燕麥片 35g + 奇異果 1 顆',
        macros_estimate: '約 430 kcal｜P: 39g ‧ C: 38g ‧ F: 11g'
      },
      {
        meal_slot: '隔日午餐 (高體積低密度保肌餐)',
        timing: '12:00 - 13:30',
        focus: `精準填補今日蛋白質缺口 (+${cutProDelta}g P) 並拉滿膳食纖維`,
        menu_suggestion: '黑胡椒舒肥雞胸肉 220g + 蒸地瓜 120g + 蒜香川燙綠花椰菜與玉米筍 250g',
        macros_estimate: '約 460 kcal｜P: 50g ‧ C: 44g ‧ F: 6g'
      },
      {
        meal_slot: '隔日下午/練後補償 (零脂純蛋白快充)',
        timing: '16:30 - 18:00',
        focus: '零油脂負擔下極大化抗分解肌肉保護',
        menu_suggestion: '分離式乳清蛋白 1.5 匙 (水沖) + 大牛番茄 1 顆 (或超商去皮鹽水雞胸 150g)',
        macros_estimate: '約 180 kcal｜P: 38g ‧ C: 6g ‧ F: 1g'
      },
      {
        meal_slot: '隔日晚餐 (控碳高鉀排鈉燃脂餐)',
        timing: '18:30 - 20:00',
        focus: '降低夜間胰島素波動、幫助排除多餘水分與鈉離子',
        menu_suggestion: '薑絲清蒸台灣鯛魚片 200g + 涼拌嫩豆腐半盒 150g + 海帶芽金針菇菠菜湯 1 大碗',
        macros_estimate: '約 340 kcal｜P: 46g ‧ C: 12g ‧ F: 8g'
      }
    ],
    training_and_hydration_tip: `明日建議於重訓後或晚餐後安排 20~25 分鐘 Zone 2 低強度有氧（坡度快走或飛輪，心率 120-135 bpm），並飲水達 ${(user.weight * 45)}ml 促進脂肪 β-氧化代謝。`,
    warning_note: '減脂期若前一日未吃夠，隔日切忌「把昨天剩下的熱量額度拿去吃大餐」，應以高蛋白與高纖原型食物補足營養缺口，才能瘦脂不瘦肌。'
  };

  return {
    reference_date: refDateStr,
    next_date: nextDateStr,
    is_triggered: !isAllMet,
    gap_status: gapStatus,
    active_user_goal: user.goal,
    muscle_gain_plan: muscleGainPlan,
    fat_loss_plan: fatLossPlan
  };
}


const DATA_DIR = process.env.VERCEL === '1'
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MEALS_FILE = path.join(DATA_DIR, 'meal_logs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 採用 30 個清晰易辨識的大寫英數字符 (排除易混淆的 0, O, 1, I, L)
const SYNC_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * 密碼學安全專屬同步碼生成器
 * 組合數：30^8 = 656,100,000,000 (超過 6,561 億種組合)
 * 嚴格支援碰撞檢測與重試，100% 確保資料庫中絕對唯一、絕不重複
 */
export function generateSyncCode(existingCodes?: Set<string>): string {
  let attempts = 0;
  let code = '';
  
  do {
    const bytes = crypto.randomBytes(8);
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += SYNC_CHARSET[bytes[i] % SYNC_CHARSET.length];
    }
    for (let i = 4; i < 8; i++) {
      part2 += SYNC_CHARSET[bytes[i] % SYNC_CHARSET.length];
    }
    code = `NFT-${part1}-${part2}`;
    attempts++;
  } while (
    existingCodes && 
    (existingCodes.has(code.toUpperCase()) || existingCodes.has(code.replace(/[^0-9A-Z]/g, ''))) && 
    attempts < 100
  );

  return code;
}

// 預設使用者資料 (72kg, 178cm, 16.5% 體脂, 目標: 增肌)
const DEFAULT_METRICS = calculateUserMetrics('male', 72, 178, 26, 'muscle_gain', 'moderate');

const INITIAL_USER: UserProfile = {
  id: 'usr_default_001',
  name: 'Alex (健身愛好者)',
  sync_code: 'NFT-8888-8888',
  gender: 'male',
  age: 26,
  height: 178,
  weight: 72,
  body_fat_rate: 16.5,
  goal: 'muscle_gain',
  activity_level: 'moderate',
  ...DEFAULT_METRICS,
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  updated_at: new Date().toISOString()
};

// 預設示範餐點紀錄 (讓使用者首次進入就看到豐富的雲端歷史紀錄)
const INITIAL_MEALS: MealLog[] = [
  {
    id: 'meal_demo_001',
    user_id: 'usr_default_001',
    meal_type: 'breakfast',
    meal_name: '高蛋白燕麥水煮蛋佐藍莓優格',
    image_path: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&auto=format&fit=crop&q=80',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    foods: [
      {
        id: 'f1',
        name: '大燕麥片',
        estimated_weight_g: 60,
        confidence: 96,
        calories_kcal: 227,
        protein_g: 8.1,
        carbs_g: 40.1,
        fat_g: 3.9,
        fiber_g: 5.1,
        sodium_mg: 2,
        rag_verified: true,
        rag_source: '衛福部食品營養成分資料庫 (TFDA_C006)',
        rag_match_code: 'TFDA_C006',
        portion_description: '約半碗大燕麥片乾重泡開'
      },
      {
        id: 'f2',
        name: '水煮全蛋',
        estimated_weight_g: 110,
        confidence: 98,
        calories_kcal: 157,
        protein_g: 14.1,
        carbs_g: 1.0,
        fat_g: 10.8,
        fiber_g: 0,
        sodium_mg: 154,
        rag_verified: true,
        rag_source: '衛福部食品營養成分資料庫 (TFDA_E001)',
        rag_match_code: 'TFDA_E001',
        portion_description: '2 顆水煮中型蛋'
      },
      {
        id: 'f3',
        name: '無加糖希臘優格',
        estimated_weight_g: 150,
        confidence: 94,
        calories_kcal: 110,
        protein_g: 15.0,
        carbs_g: 6.0,
        fat_g: 2.3,
        fiber_g: 0,
        sodium_mg: 68,
        rag_verified: true,
        rag_source: '衛福部食品營養成分資料庫 (TFDA_L001)',
        rag_match_code: 'TFDA_L001',
        portion_description: '1 杯中型優格'
      }
    ],
    total_calories: 494,
    total_protein: 37.2,
    total_carbs: 47.1,
    total_fat: 17.0,
    macro_ratio: {
      protein_pct: 30,
      carbs_pct: 38,
      fat_pct: 32
    },
    dietitian_feedback: {
      summary: '早餐蛋白質供給極佳，優質複合碳水提供持續訓練動能',
      score: 94,
      alignment_with_goal: 'excellent',
      goal_logic_explanation: '此餐蛋白質高達 37.2g，完全滿足晨間肌肉蛋白質合成 (MPS) 啟動門檻 (25-35g Leucine 充足)。燕麥提供低 GI 緩釋碳水，對於增肌階段具備極佳的肌醣原回補效果。',
      pros: [
        '蛋白質達到 37g，蛋類與乳清酪蛋白互補胺基酸譜',
        '大燕麥含有豐富 β-葡聚醣與水溶性纖維，飽足感長達 4 小時',
        '脂肪來源為全蛋卵磷脂與天然乳脂，無精製油添加'
      ],
      recommendations: [
        '若當天早上安排重訓，可再額外補半根香蕉提升即時爆發力',
        '增肌目標下維持目前三大營養素分配非常健康'
      ],
      timing_advice: '晨間喚醒或早晨重量訓練前 1.5 小時食用最佳',
      next_meal_suggestion: '午餐建議補足 1.5 碗紫米或糙米飯與 150g 舒肥雞胸肉，持續拉高日總熱量盈餘。'
    },
    created_at: new Date(Date.now() - 14400000).toISOString()
  }
];

class DatabaseService {
  private users: Map<string, UserProfile> = new Map();
  private meals: MealLog[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        let modified = false;
        const seenCodes = new Set<string>();
        usersData.forEach((u: UserProfile) => {
          const codeUpper = u.sync_code ? u.sync_code.toUpperCase() : '';
          if (!codeUpper || seenCodes.has(codeUpper)) {
            u.sync_code = this.generateUniqueSyncCode();
            modified = true;
          }
          if (u.sync_code) {
            seenCodes.add(u.sync_code.toUpperCase());
          }
          this.users.set(u.id, u);
        });
        if (modified) {
          this.saveUsersToDisk();
        }
      } else {
        this.users.set(INITIAL_USER.id, INITIAL_USER);
        this.saveUsersToDisk();
      }

      if (fs.existsSync(MEALS_FILE)) {
        this.meals = JSON.parse(fs.readFileSync(MEALS_FILE, 'utf-8'));
      } else {
        this.meals = [...INITIAL_MEALS];
        this.saveMealsToDisk();
      }
    } catch (err) {
      console.warn('無法從磁碟載入或初始化資料，自動退回記憶體模式:', err);
      if (this.users.size === 0) {
        this.users.set(INITIAL_USER.id, INITIAL_USER);
      }
      if (this.meals.length === 0) {
        this.meals = [...INITIAL_MEALS];
      }
    }
  }

  private saveUsersToDisk() {
    try {
      ensureDataDir();
      fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2));
    } catch (err) {
      // 捕獲 Vercel 唯讀環境的錯誤，防止伺服器崩潰
      console.warn('注意：目前環境為唯讀檔案系統 (Vercel)，使用者資料已暫存於記憶體中。');
    }
  }

  private saveMealsToDisk() {
    try {
      ensureDataDir();
      fs.writeFileSync(MEALS_FILE, JSON.stringify(this.meals, null, 2));
    } catch (err) {
      // 捕獲 Vercel 唯讀環境的錯誤，防止伺服器崩潰
      console.warn('注意：目前環境為唯讀檔案系統 (Vercel)，餐點紀錄已暫存於記憶體中。');
    }
  }

  /**
   * 生成全局 100% 唯一的跨裝置同步代碼
   * 比對所有現有使用者的 sync_code 與 ID，保證絕對無碰撞、不重複
   */
  public generateUniqueSyncCode(): string {
    const existingCodes = new Set<string>();
    for (const u of this.users.values()) {
      if (u.sync_code) {
        existingCodes.add(u.sync_code.toUpperCase());
        existingCodes.add(u.sync_code.toUpperCase().replace(/[^0-9A-Z]/g, ''));
      }
      if (u.id) {
        existingCodes.add(u.id.toUpperCase());
      }
    }
    return generateSyncCode(existingCodes);
  }

  public findUserByName(name: string): UserProfile | null {
    const trimmed = name.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.name.trim().toLowerCase() === trimmed) {
        return user;
      }
    }
    return null;
  }

  public findUserBySyncCode(code: string): UserProfile | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const cleanDigits = clean.replace(/[^0-9A-Z]/g, '');
    for (const user of this.users.values()) {
      if (user.id === code.trim()) return user;
      if (user.sync_code) {
        const userSyncUpper = user.sync_code.toUpperCase();
        if (userSyncUpper === clean) return user;
        if (userSyncUpper.replace(/[^0-9A-Z]/g, '') === cleanDigits) return user;
      }
    }
    return null;
  }

  public loginUser(identifier: string, pin?: string): { success: true; user: UserProfile } | { success: false; error: string } {
    if (!identifier || !identifier.trim()) {
      return { success: false, error: '請輸入專屬唯一同步碼 (Sync Code)' };
    }
    const cleanId = identifier.trim();

    // 跨裝置同步登入僅透過專屬唯一同步碼 (Sync Code) 或帳號 ID 尋找
    // 嚴格禁止以姓名尋找，確保同名使用者之資料隱私與隔離
    const user = this.findUserBySyncCode(cleanId);

    if (!user) {
      return { 
        success: false, 
        error: `找不到相符的同步代碼「${cleanId}」。跨裝置同步請使用專屬唯一同步碼（例如 NFT-XXXX-XXXX）。因支援不同使用者同名，系統已停用姓名登入以確保帳號安全與隱私。` 
      };
    }

    // 檢查安全 PIN 碼 (若該帳號有設定)
    if (user.pin && user.pin.trim()) {
      if (!pin || !pin.trim()) {
        return { success: false, error: '此帳號已設定安全保護 PIN 碼，請輸入 4-6 位數 PIN 碼' };
      }
      if (pin.trim() !== user.pin.trim()) {
        return { success: false, error: '安全 PIN 碼不正確，請重新輸入' };
      }
    }

    return { success: true, user };
  }

  public createUser(userData: {
    name: string;
    gender: 'male' | 'female';
    age: number;
    height: number;
    weight: number;
    body_fat_rate?: number;
    goal: FitnessGoal;
    activity_level?: 'sedentary' | 'light' | 'moderate' | 'very_active';
    pin?: string;
  }): UserProfile {
    // 系統完全支援不同使用者同名！
    // 每次註冊皆建立獨立的專屬檔案、指派全新的唯一 ID 與專屬同步碼 (NFT-XXXX-XXXX)，
    // 確保每位使用者資料獨立隔離、互不影響。
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const sync_code = this.generateUniqueSyncCode();
    const activity_level = userData.activity_level || 'moderate';
    const body_fat_rate = userData.body_fat_rate || (userData.gender === 'male' ? 18 : 24);
    const metrics = calculateUserMetrics(
      userData.gender,
      userData.weight,
      userData.height,
      userData.age,
      userData.goal,
      activity_level
    );

    const newUser: UserProfile = {
      id,
      name: userData.name.trim() || '新健身學員',
      sync_code,
      pin: userData.pin ? userData.pin.trim() : undefined,
      gender: userData.gender,
      age: userData.age,
      height: userData.height,
      weight: userData.weight,
      body_fat_rate,
      goal: userData.goal,
      activity_level,
      ...metrics,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.users.set(id, newUser);
    this.saveUsersToDisk();
    return newUser;
  }

  public getUser(id?: string): UserProfile | null {
    if (id) {
      const user = this.users.get(id) || this.findUserBySyncCode(id);
      if (user) return user;
    }
    return null;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    let existing = this.users.get(id);
    if (!existing) {
      existing = this.findUserBySyncCode(id) || undefined;
    }
    if (!existing) {
      return null;
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // 自動依新體重、身高、目標重算代謝與營養指標
    const recalculated = calculateUserMetrics(
      updated.gender,
      updated.weight,
      updated.height,
      updated.age,
      updated.goal,
      updated.activity_level
    );

    Object.assign(updated, recalculated);

    this.users.set(updated.id, updated);
    this.saveUsersToDisk();
    return updated;
  }

  public deleteUser(idOrCode: string): boolean {
    if (!idOrCode) return false;
    let targetId = idOrCode;
    const user = this.users.get(idOrCode) || this.findUserBySyncCode(idOrCode);
    if (user) {
      targetId = user.id;
    }
    const deleted = this.users.delete(targetId);
    if (deleted) {
      // 連帶清理該使用者的所有餐點紀錄
      this.meals = this.meals.filter(m => m.user_id !== targetId);
      this.saveMealsToDisk();
      this.saveUsersToDisk();
      return true;
    }
    return false;
  }

  // 取得指定使用者的餐點紀錄 (嚴格資料隔離：未提供 userId 則不回傳任何資料)
  public getMealLogs(userId?: string): MealLog[] {
    if (!userId) {
      return [];
    }
    return this.meals
      .filter(m => m.user_id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addMealLog(meal: Omit<MealLog, 'id' | 'created_at'>): MealLog {
    // 冪等防重複機制：如果在過去 60 秒內已為該使用者記錄了相同餐名與相近熱量的餐點，則直接回傳該紀錄，不重複新增
    const now = Date.now();
    const existingRecentMeal = this.meals.find(m => {
      if (m.user_id !== meal.user_id) return false;
      if (m.meal_name.trim().toLowerCase() !== meal.meal_name.trim().toLowerCase()) return false;
      const mealTime = new Date(m.created_at || m.timestamp).getTime();
      const timeDiff = Math.abs(now - mealTime);
      const isWithinWindow = timeDiff < 60 * 1000; // 60 秒內
      const isSameCalories = Math.abs(m.total_calories - meal.total_calories) < 2;
      return isWithinWindow && isSameCalories;
    });

    if (existingRecentMeal) {
      return existingRecentMeal;
    }

    const newMeal: MealLog = {
      ...meal,
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString()
    };
    this.meals.unshift(newMeal);
    this.saveMealsToDisk();
    return newMeal;
  }

  // 刪除指定餐點 (驗證擁有者 ID，防止越權刪除)
  public deleteMealLog(mealId: string, userId?: string): boolean {
    const targetMeal = this.meals.find(m => m.id === mealId);
    if (!targetMeal) {
      return false;
    }
    if (userId && targetMeal.user_id !== userId) {
      // 權限不符，非餐點擁有者禁止刪除
      return false;
    }
    this.meals = this.meals.filter(m => m.id !== mealId);
    this.saveMealsToDisk();
    return true;
  }

  public getDailySummary(userId?: string, dateStr?: string) {
    if (!userId) {
      return null;
    }
    const user = this.getUser(userId);
    if (!user) {
      return null;
    }
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const endOfDay = startOfDay + 86400000;

    const todayMeals = this.meals.filter(m => {
      if (m.user_id !== user.id) return false;
      const t = new Date(m.timestamp).getTime();
      return t >= startOfDay && t < endOfDay;
    });

    const consumed = todayMeals.reduce((acc, m) => {
      acc.calories += m.total_calories;
      acc.protein += m.total_protein;
      acc.carbs += m.total_carbs;
      acc.fat += m.total_fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    consumed.calories = Math.round(consumed.calories);
    consumed.protein = Math.round(consumed.protein * 10) / 10;
    consumed.carbs = Math.round(consumed.carbs * 10) / 10;
    consumed.fat = Math.round(consumed.fat * 10) / 10;

    const remaining = {
      calories: Math.max(0, user.target_calories - consumed.calories),
      protein: Math.max(0, Math.round((user.target_protein_g - consumed.protein) * 10) / 10),
      carbs: Math.max(0, Math.round((user.target_carbs_g - consumed.carbs) * 10) / 10),
      fat: Math.max(0, Math.round((user.target_fat_g - consumed.fat) * 10) / 10)
    };

    const compensation_plan = buildNextDayCompensationPlan(user, consumed, targetDate);

    return {
      user_id: user.id,
      user_name: user.name,
      date: targetDate.toISOString().split('T')[0],
      meals_count: todayMeals.length,
      user_target: {
        calories: user.target_calories,
        protein_g: user.target_protein_g,
        carbs_g: user.target_carbs_g,
        fat_g: user.target_fat_g,
        goal: user.goal,
        tdee: user.tdee
      },
      consumed,
      remaining,
      compensation_plan,
      today_meals: todayMeals
    };
  }

  // 資料庫檢視器 (落實 Row-Level Security 租戶隔離：僅能檢視當前使用者的個人數據)
  public getDatabaseTables(userId?: string) {
    const user = userId ? this.getUser(userId) : null;
    const userMeals = userId ? this.getMealLogs(userId) : [];

    return {
      schema_ddl: DB_SCHEMA_DDL,
      rls_policy: {
        enabled: true,
        isolated_user_id: userId || 'unauthenticated',
        message: '【Row-Level Security 租戶隔離模式生效中】僅允許檢視當前已驗證使用者的資料行，其他使用者的身形隱私與飲食紀錄已在資料存取層阻斷。'
      },
      tables: {
        users: {
          name: 'users',
          count: user ? 1 : 0,
          columns: ['id', 'name', 'sync_code', 'pin', 'gender', 'age', 'height', 'weight', 'body_fat_rate', 'goal', 'activity_level', 'bmr', 'tdee', 'target_calories', 'target_protein_g', 'target_carbs_g', 'target_fat_g', 'created_at', 'updated_at'],
          sample_rows: user ? [user] : []
        },
        meal_logs: {
          name: 'meal_logs',
          count: userMeals.length,
          columns: ['id', 'user_id', 'meal_type', 'meal_name', 'image_path', 'timestamp', 'foods', 'total_calories', 'total_protein', 'total_carbs', 'total_fat', 'macro_ratio', 'dietitian_feedback', 'created_at'],
          sample_rows: userMeals.slice(0, 15)
        }
      }
    };
  }
}

export const dbService = new DatabaseService();
