// ============================================================
// NutriFit AI 健身營養師資料庫結構 (PostgreSQL / Cloud SQL 規範)
// ============================================================

export const DB_SCHEMA_DDL = `
-- ============================================================
-- NutriFit AI 健身營養師資料庫結構 (PostgreSQL / Cloud SQL 規範)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,               -- 使用者姓名/暱稱 (系統支援不同使用者同名)
    sync_code VARCHAR(32) UNIQUE NOT NULL,    -- 跨裝置專屬唯一同步碼 (NFT-XXXX-XXXX，保證全局唯一不重複)
    pin VARCHAR(10),                          -- 帳號安全防護 PIN 碼 (可選)
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    age INT NOT NULL,
    height DECIMAL(5,2) NOT NULL,            -- 公分 (cm)
    weight DECIMAL(5,2) NOT NULL,            -- 公斤 (kg)
    body_fat_rate DECIMAL(4,2) NOT NULL,     -- 體脂率 (%)
    goal VARCHAR(20) NOT NULL CHECK (goal IN ('muscle_gain', 'fat_loss', 'maintenance')),
    activity_level VARCHAR(20) NOT NULL DEFAULT 'moderate',
    bmr INT NOT NULL,                        -- 基礎代謝率 (kcal)
    tdee INT NOT NULL,                       -- 每日總能量消耗 (kcal)
    target_calories INT NOT NULL,            -- 每日目標攝取 (kcal)
    target_protein_g INT NOT NULL,           -- 目標蛋白質 (g)
    target_carbs_g INT NOT NULL,             -- 目標碳水化合物 (g)
    target_fat_g INT NOT NULL,               -- 目標脂肪 (g)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_name VARCHAR(150) NOT NULL,
    image_path TEXT NOT NULL,                 -- 雲端儲存路徑 / Base64 / Storage URL
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    foods JSONB NOT NULL,                    -- 食物陣列: [{name, estimated_weight_g, calories_kcal, protein_g, carbs_g, fat_g, rag_verified}]
    total_calories INT NOT NULL,             -- 總熱量 (kcal)
    total_protein DECIMAL(5,1) NOT NULL,     -- 總蛋白質 (g)
    total_carbs DECIMAL(5,1) NOT NULL,       -- 總碳水 (g)
    total_fat DECIMAL(5,1) NOT NULL,         -- 總脂肪 (g)
    macro_ratio JSONB NOT NULL,              -- 三大營養素比例: {protein_pct, carbs_pct, fat_pct}
    dietitian_feedback JSONB NOT NULL,       -- LLM 虛擬營養師邏輯建議
    raw_json JSONB,                          -- AI 原始格式化輸出
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, timestamp);
`;
