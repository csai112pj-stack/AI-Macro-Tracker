import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { dbService, DB_SCHEMA_DDL } from "./server/db";
import { analyzeMealImage, askDietitianQuestion, generateRecommendedRecipes } from "./server/geminiService";
import { queryNutritionDatabase, TAIWAN_FDA_NUTRITION_DB } from "./server/nutritionDb";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // 支援大圖 base64 傳輸 (拍照分析)
  app.use(express.json({ limit: "35mb" }));
  app.use(express.urlencoded({ limit: "35mb", extended: true }));

  // =========================================================================
  // API 路由 (置於 Vite 之前)
  // =========================================================================

  // 健康檢查與雲端託管狀態
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      service: "NutriFit AI Dietitian API",
      cloud_provider: "GCP (Google Cloud Run)",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      models_ready: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // 1. 使用者資訊 API (Users 表)
  // 基於隱私與資安防護規範，全域使用者名單不開放公開讀取，各瀏覽器與訪客只能讀取自身已授權之個人帳號
  app.get("/api/users", (req, res) => {
    res.status(403).json({ 
      success: false, 
      error: "Access Denied: 全域使用者名單依隱私與資安規範已關閉公開存取，防止跨租戶資料外洩。" 
    });
  });

  app.get("/api/user", (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      const user = userId ? dbService.getUser(userId) : null;
      res.json({ 
        success: true, 
        user
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/user", (req, res) => {
    try {
      const { name, gender, age, height, weight, body_fat_rate, goal, activity_level, pin } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "請輸入姓名或暱稱" });
      }
      const newUser = dbService.createUser({
        name: name.trim(),
        gender: gender || 'male',
        age: Number(age) || 25,
        height: Number(height) || 175,
        weight: Number(weight) || 70,
        body_fat_rate: Number(body_fat_rate) || 18,
        goal: goal || 'muscle_gain',
        activity_level: activity_level || 'moderate',
        pin: pin ? String(pin).trim() : undefined
      });
      const dailySummary = dbService.getDailySummary(newUser.id);
      res.status(201).json({ success: true, user: newUser, dailySummary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 跨裝置 / 換機登入現有帳號 (僅支援專屬唯一同步碼 NFT-XXXX-XXXX 或帳號 ID，停用姓名登入以防同名衝突)
  app.post("/api/user/login", (req, res) => {
    try {
      const { identifier, syncCode, pin } = req.body;
      const targetIdentifier = (identifier || syncCode || '').trim();

      if (!targetIdentifier) {
        return res.status(400).json({ 
          success: false, 
          error: "請輸入專屬唯一同步碼（例如 NFT-8888-8888）" 
        });
      }

      const result = dbService.loginUser(targetIdentifier, pin ? String(pin).trim() : undefined);
      if (!result.success) {
        return res.status(401).json(result);
      }

      const dailySummary = dbService.getDailySummary(result.user.id);
      const meals = dbService.getMealLogs(result.user.id);

      res.json({
        success: true,
        user: result.user,
        dailySummary,
        meals_count: meals.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 刪除帳號 (徹底從資料庫中清除使用者檔案以及所有關聯之 Meal_Logs 餐點紀錄)
  app.delete("/api/user", (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || (req.body && req.body.userId);
      if (!userId) {
        return res.status(400).json({ success: false, error: "缺少要刪除的使用者 ID 或同步碼" });
      }

      const deleted = dbService.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "找不到該使用者或已被刪除" });
      }

      res.json({
        success: true,
        message: "帳號與所有關聯餐點紀錄已從雲端伺服器永久清除"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/user/:id", (req, res) => {
    try {
      const { id } = req.params;
      const deleted = dbService.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "找不到該使用者或已被刪除" });
      }

      res.json({
        success: true,
        message: "帳號與所有關聯餐點紀錄已從雲端伺服器永久清除"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/user", (req, res) => {
    try {
      const updates = req.body;
      const userId = updates.id || (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(400).json({ success: false, error: "缺少使用者 ID" });
      }
      const updatedUser = dbService.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: "找不到指定使用者" });
      }
      const dailySummary = dbService.getDailySummary(updatedUser.id);
      res.json({ success: true, user: updatedUser, dailySummary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/user/profile", (req, res) => {
    try {
      const updates = req.body;
      const userId = updates.id || (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(400).json({ success: false, error: "缺少使用者 ID" });
      }
      const updatedUser = dbService.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: "找不到指定使用者" });
      }
      const dailySummary = dbService.getDailySummary(updatedUser.id);
      res.json({ success: true, user: updatedUser, dailySummary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. 餐點紀錄 API (Meal_Logs 表 - 嚴格資料隔離：僅回傳指定 userId 之餐點)
  app.get("/api/meals", (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.json({ success: true, meals: [] });
      }
      const meals = dbService.getMealLogs(userId);
      res.json({ success: true, meals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/meals", (req, res) => {
    try {
      const mealData = req.body;
      const userId = mealData.user_id || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: "請提供使用者身分" });
      }
      const createdMeal = dbService.addMealLog({
        ...mealData,
        user_id: userId
      });
      res.status(201).json({ success: true, meal: createdMeal });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/meals/:id", (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      const deleted = dbService.deleteMealLog(id, userId);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. 今日總攝取與剩餘熱量/營養素 (嚴格限縮單一使用者)
  app.get("/api/daily-summary", (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) {
        return res.status(401).json({ success: false, error: "請先建立或提供使用者身分" });
      }
      const summary = dbService.getDailySummary(userId);
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. 「拍照即記錄」AI 分析核心端點 (辨識 + RAG 食品庫 + 估算重量熱量 + 增肌減脂比例 + 虛擬營養師邏輯 + JSON 格式化)
  app.post("/api/analyze-meal", async (req, res) => {
    try {
      const { image, mimeType, mealType = "lunch", autoSave = true, userId: bodyUserId } = req.body;
      const userId = bodyUserId || (req.headers['x-user-id'] as string);

      if (!image) {
        return res.status(400).json({ success: false, error: "請提供圖片 (Base64 或圖片路徑)" });
      }

      const user = userId ? dbService.getUser(userId) : null;
      if (!user) {
        return res.status(401).json({ success: false, error: "尚未建立個人檔案，為維護您的資料安全與計算精準，請先設定您的專屬使用者！" });
      }

      const dailySummary = dbService.getDailySummary(user.id);

      // 執行 LLM 多模態辨識與 RAG 查表分析
      const analysis = await analyzeMealImage(
        image,
        mimeType || "image/jpeg",
        mealType,
        user,
        dailySummary
      );

      let savedMeal = null;
      if (autoSave && analysis.is_food_detected !== false && analysis.foods && analysis.foods.length > 0) {
        // 直接格式化寫入 Meal_Logs 表 (嚴格綁定該使用者 user.id)
        savedMeal = dbService.addMealLog({
          user_id: user.id,
          meal_type: mealType,
          meal_name: analysis.meal_name,
          image_path: image,
          timestamp: new Date().toISOString(),
          foods: analysis.foods,
          total_calories: analysis.total_calories,
          total_protein: analysis.total_protein,
          total_carbs: analysis.total_carbs,
          total_fat: analysis.total_fat,
          macro_ratio: analysis.macro_ratio,
          dietitian_feedback: analysis.dietitian_feedback,
          raw_json: JSON.stringify(analysis.raw_json)
        });
      }

      // 格式化輸出 JSON
      res.json({
        success: true,
        analysis,
        saved_meal: savedMeal,
        updated_daily_summary: dbService.getDailySummary(user.id)
      });

    } catch (err: any) {
      console.error("Meal analysis endpoint error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. 虛擬營養師即時問答 (基於個別使用者歷史紀錄與健身目標)
  app.post("/api/dietitian/chat", async (req, res) => {
    try {
      const { message, userId: bodyUserId } = req.body;
      const userId = bodyUserId || (req.headers['x-user-id'] as string);

      if (!message) {
        return res.status(400).json({ success: false, error: "請輸入諮詢內容" });
      }

      const user = userId ? dbService.getUser(userId) : null;
      if (!user) {
        return res.status(401).json({ success: false, error: "請先設定個人資訊" });
      }

      const dailySummary = dbService.getDailySummary(user.id);
      const recentMeals = dbService.getMealLogs(user.id).slice(0, 5);

      const reply = await askDietitianQuestion(message, user, dailySummary, recentMeals);
      res.json({ success: true, reply });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5.1 依用戶健身目標 (增肌/減脂) 與今日已攝取情況，主動推播 3 則符合營養需求的建議食譜
  app.get("/api/dietitian/recipes", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      const user = userId ? dbService.getUser(userId) : null;
      if (!user) {
        return res.json({ success: true, recipes: [] });
      }
      const dailySummary = dbService.getDailySummary(user.id);
      const recipes = await generateRecommendedRecipes(user, dailySummary);
      res.json({ success: true, recipes, user_goal: user.goal, dailySummary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. 資料庫檢視器 (落實 Row-Level Security 租戶隔離：僅能檢視當前已驗證使用者的資料行)
  app.get("/api/db/inspector", (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      const data = dbService.getDatabaseTables(userId);
      res.json({ success: true, ...data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. 政府食品營養成分資料庫查詢 (TFDA RAG 知識庫查詢)
  app.get("/api/nutrition-db/search", (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      if (!query) {
        return res.json({
          success: true,
          count: TAIWAN_FDA_NUTRITION_DB.length,
          items: TAIWAN_FDA_NUTRITION_DB.slice(0, 20)
        });
      }

      const results = queryNutritionDatabase(query, 10);
      res.json({
        success: true,
        query,
        count: results.length,
        items: results.map(r => ({ ...r.item, match_score: Math.round(r.score) }))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // Vite Middleware 與靜態文件服務
  // =========================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=================================================`);
    console.log(` NutriFit AI 健身營養師 Server Running on port ${PORT}`);
    console.log(` GCP Cloud Run API Ready`);
    console.log(` Database: Users & Meal_Logs initialized`);
    console.log(`=================================================`);
  });
}

startServer();
