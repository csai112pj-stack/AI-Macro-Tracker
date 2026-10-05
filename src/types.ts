export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'maintenance';
export type Gender = 'male' | 'female';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface UserProfile {
  id: string;
  name: string;
  sync_code?: string; // 跨裝置專屬同步碼 (例如 NFT-742918)
  pin?: string;       // 個人同步保護 PIN 碼 (可選)
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  body_fat_rate: number; // %
  goal: FitnessGoal;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active';
  bmr: number; // kcal
  tdee: number; // kcal
  target_calories: number; // kcal
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  created_at: string;
  updated_at: string;
}

export interface FoodItemAnalysis {
  id: string;
  name: string;
  name_en?: string;
  estimated_weight_g: number;
  confidence: number; // 0 - 100
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
  rag_verified: boolean;
  rag_source: string; // e.g. "衛福部食品營養成分資料庫 (FDA)"
  rag_match_code?: string;
  portion_description: string; // e.g. "約 1 個拳頭大小" or "1 片薄煎"
}

export interface MacroRatio {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

export interface DietitianFeedback {
  summary: string;
  score: number; // 1-100
  alignment_with_goal: 'excellent' | 'good' | 'needs_adjustment' | 'off_track';
  goal_logic_explanation: string;
  pros: string[];
  recommendations: string[];
  timing_advice: string; // e.g. "適合練前 2 小時或練後補充"
  next_meal_suggestion: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  meal_name: string;
  image_path: string;
  timestamp: string;
  foods: FoodItemAnalysis[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  macro_ratio: MacroRatio;
  dietitian_feedback: DietitianFeedback;
  raw_json?: string;
  created_at: string;
}

export interface NutritionDbItem {
  code: string;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  sodium_per_100g: number;
  common_portion_g: number;
  portion_unit: string;
}

export interface MealAnalysisResponse {
  success: boolean;
  is_food_detected?: boolean;
  unrecognized_category?: 'empty_dish' | 'non_food' | 'blurry_or_dark' | 'text_or_menu' | 'too_distant' | 'other' | string;
  unrecognized_reason?: string;
  meal_name: string;
  foods: FoodItemAnalysis[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  macro_ratio: MacroRatio;
  dietitian_feedback: DietitianFeedback;
  rag_hits: {
    query: string;
    matched_food: string;
    database_code: string;
    similarity: number;
    reference_nutrition: {
      per_100g: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  }[];
  raw_json: any;
}

export interface RecommendedRecipe {
  id: string;
  name: string;
  category: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: string[];
  reason: string;
  prep_time_minutes?: number;
  cooking_tip?: string;
}

export interface MacroGapStatus {
  calories_diff: number; // 負數代表未達標(尚缺)，正數代表超標
  protein_diff_g: number;
  carbs_diff_g: number;
  fat_diff_g: number;
  calories_pct: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  is_calories_met: boolean;
  is_protein_met: boolean;
  is_carbs_met: boolean;
  is_fat_met: boolean;
  is_all_met: boolean;
  unmet_items: string[];
}

export interface GoalSpecificCompensationPlan {
  goal_type: 'muscle_gain' | 'fat_loss';
  title: string;
  subtitle: string;
  badge_label: string;
  core_principle: string;
  diagnostic_summary: string;
  tomorrow_adjusted_targets: {
    base_calories: number;
    adjusted_calories: number;
    calories_delta: number;
    base_protein_g: number;
    adjusted_protein_g: number;
    protein_delta_g: number;
    base_carbs_g: number;
    adjusted_carbs_g: number;
    carbs_delta_g: number;
    base_fat_g: number;
    adjusted_fat_g: number;
    fat_delta_g: number;
  };
  macro_strategies: {
    nutrient: string;
    status_label: string;
    is_met: boolean;
    shortfall_or_excess: string;
    action_plan: string;
    recommended_foods: string[];
  }[];
  meal_schedule: {
    meal_slot: string;
    timing: string;
    focus: string;
    menu_suggestion: string;
    macros_estimate: string;
  }[];
  training_and_hydration_tip: string;
  warning_note: string;
}

export interface NextDayCompensationPlan {
  reference_date: string;
  next_date: string;
  is_triggered: boolean;
  gap_status: MacroGapStatus;
  active_user_goal: FitnessGoal;
  muscle_gain_plan: GoalSpecificCompensationPlan;
  fat_loss_plan: GoalSpecificCompensationPlan;
}


