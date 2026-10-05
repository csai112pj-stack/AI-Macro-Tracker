import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Scale, 
  Flame, 
  Activity, 
  BrainCircuit, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Check, 
  AlertTriangle,
  HelpCircle,
  Camera,
  SunMedium,
  Crop,
  UtensilsCrossed,
  Info
} from 'lucide-react';
import { MealAnalysisResponse, UserProfile } from '../types';

interface MealAnalysisCardProps {
  analysis: MealAnalysisResponse;
  user: UserProfile | null;
  savedToDatabase?: boolean;
}

export const MealAnalysisCard: React.FC<MealAnalysisCardProps> = ({
  analysis,
  user,
  savedToDatabase = true
}) => {
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    meal_name,
    foods = [],
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    macro_ratio,
    dietitian_feedback,
    rag_hits,
    unrecognized_reason,
    unrecognized_category
  } = analysis;

  const isBulking = user?.goal === 'muscle_gain';

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 若照片未檢測到食物或無法辨識
  if (analysis.is_food_detected === false || foods.length === 0) {
    // 依據類別定義明確原因標籤與圖示
    const categoryDetails = {
      empty_dish: {
        label: '空餐盤或盛裝容器無餐點',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        tips: '盤中尚未盛裝或已食用完畢，請在餐點盛盤完成後再行拍照。'
      },
      non_food: {
        label: '非食物或生活雜物',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        tips: '鏡頭拍到人物臉部、寵物、辦公桌面、鍵盤或其他非餐點物品。'
      },
      blurry_or_dark: {
        label: '光線過暗、逆光或畫面晃動模糊',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        tips: '鏡頭焦距模糊或陰影過重，請至光線充足處並握穩手機重拍。'
      },
      text_or_menu: {
        label: '外包裝、純文字或紙盒外觀',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        tips: '避免僅拍攝便當外盒蓋、手搖杯封膜文字或菜單，請打開盒蓋拍攝實際食材。'
      },
      too_distant: {
        label: '拍攝距離過遠或食材比例過小',
        badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
        tips: '請將手機靠近餐盤約 20-30 公分，讓餐盤食物佔滿畫面 70% 以上。'
      },
      other: {
        label: '食物特徵不清晰無法確認食材',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        tips: '請調整角度拍攝主菜與主食切面，協助 AI 與政府資料庫精準對齊。'
      }
    };

    const currentCategory = (unrecognized_category && categoryDetails[unrecognized_category as keyof typeof categoryDetails])
      ? categoryDetails[unrecognized_category as keyof typeof categoryDetails]
      : categoryDetails.other;

    const displayReason = unrecognized_reason || dietitian_feedback?.summary || "AI 視覺系統未在目前照片中辨識到可食用的食材或餐點內容。";

    return (
      <div id="unrecognized-meal-card" className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-6 my-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center shrink-0 text-amber-700">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="flex-1 w-full">
            {/* 標籤列 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                無法辨識食物照
              </span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${currentCategory.badgeColor}`}>
                原因類別：{currentCategory.label}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                未扣除熱量與營養素
              </span>
            </div>

            {/* 具體診斷標題與說明 */}
            <h3 className="text-xl font-extrabold text-slate-900 mt-2.5 flex items-center gap-2">
              <span>{analysis.meal_name && analysis.meal_name !== '健身營養均衡餐' ? analysis.meal_name : '未能在照片中辨識出食物'}</span>
            </h3>

            {/* 原因醒目提示方塊 */}
            <div className="mt-3 p-4 rounded-xl bg-amber-50/90 border border-amber-200">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    AI 視覺營養師診斷原因：
                  </h4>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed font-medium">
                    {displayReason}
                  </p>
                  <p className="text-[11px] text-amber-800/80 mt-1.5">
                    💡 {currentCategory.tips}
                  </p>
                </div>
              </div>
            </div>

            {/* 營養師專業說明 */}
            {dietitian_feedback?.goal_logic_explanation && (
              <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                <strong className="text-slate-800 block mb-1">營養師備註：</strong>
                {dietitian_feedback.goal_logic_explanation}
              </div>
            )}

            {/* 拍照改善實用技巧指南 */}
            <div className="mt-4 p-4 bg-slate-50/90 border border-slate-200 rounded-xl">
              <h5 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                改善拍照技巧，提升辨識成功率：
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <Crop className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">靠近餐盤 (20-30 cm)</strong>
                    <span className="text-[11px] text-slate-500">菜餚主食佔滿螢幕 70% 以上，避免過遠拍到整個桌面雜物。</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">打開盒蓋拍實體</strong>
                    <span className="text-[11px] text-slate-500">掀開餐盒或外帶蓋，讓雞胸、牛排、飯與配菜直接呈現在鏡頭前。</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <SunMedium className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">明亮光線避免強反光</strong>
                    <span className="text-[11px] text-slate-500">確保光線均勻，避免背光黑影或塑膠盒白光反光遮蓋食材。</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">45°-60° 俯角拍立體</strong>
                    <span className="text-[11px] text-slate-500">微傾角度能看清厚度與深度，協助換算公克克數與卡路里。</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速重新操作或體驗示範餐點按鈕 */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                您也可以點擊相機上傳區右側的示範餐點，立即體驗高精確度解析。
              </span>
              <button
                id="btn-reupload-meal-photo"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                回到上方重新拍照或上傳
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 my-6">
      
      {/* 標題列與資料庫入庫狀態 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              AI 辨識完成
            </span>
            {savedToDatabase && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                已自動寫入 Meal_Logs 資料庫
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1.5">{meal_name}</h3>
        </div>

        {/* 檢視格式化 JSON 按鈕 */}
        <div className="flex items-center gap-2">
          <button
            id="btn-view-json-schema"
            onClick={() => setShowJsonModal(!showJsonModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>格式化 JSON 結構</span>
            {showJsonModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* JSON 展開檢視區塊 */}
      {showJsonModal && (
        <div className="my-4 p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span>標準 JSON 輸出 (可直接存入 PostgreSQL / Cloud SQL Meal_Logs 表)：</span>
            <button
              onClick={handleCopyJson}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              {copied ? '已複製' : '複製 JSON'}
            </button>
          </div>
          <pre>{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}

      {/* 整餐總熱量與巨量營養素數值卡 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
            <Flame className="w-4 h-4" />
            總熱量
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">
            {total_calories} <span className="text-xs font-normal text-amber-700">kcal</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            佔每日目標 {user ? Math.round((total_calories / user.target_calories) * 100) : 0}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
          <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold">
            <Activity className="w-4 h-4" />
            蛋白質 (P)
          </div>
          <div className="text-2xl font-black text-rose-950 mt-1">
            {total_protein} <span className="text-xs font-normal text-rose-700">g</span>
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">
            熱量佔比 {macro_ratio.protein_pct}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
          <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold">
            <Scale className="w-4 h-4" />
            碳水化合物 (C)
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {total_carbs} <span className="text-xs font-normal text-blue-700">g</span>
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">
            熱量佔比 {macro_ratio.carbs_pct}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            脂肪 (F)
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {total_fat} <span className="text-xs font-normal text-emerald-700">g</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            熱量佔比 {macro_ratio.fat_pct}%
          </div>
        </div>
      </div>

      {/* 三大營養素比例可視化條狀圖 */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span>三大營養素熱量分佈 (P : C : F)</span>
          <span className="text-slate-500 font-normal">
            蛋白質 {macro_ratio.protein_pct}% ‧ 碳水 {macro_ratio.carbs_pct}% ‧ 脂肪 {macro_ratio.fat_pct}%
          </span>
        </div>
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${macro_ratio.protein_pct}%` }}
            className="bg-rose-500 h-full"
            title={`蛋白質 ${macro_ratio.protein_pct}%`}
          />
          <div
            style={{ width: `${macro_ratio.carbs_pct}%` }}
            className="bg-blue-500 h-full"
            title={`碳水化合物 ${macro_ratio.carbs_pct}%`}
          />
          <div
            style={{ width: `${macro_ratio.fat_pct}%` }}
            className="bg-emerald-500 h-full"
            title={`脂肪 ${macro_ratio.fat_pct}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 蛋白質 (4 kcal/g)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> 碳水化合物 (4 kcal/g)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 脂肪 (9 kcal/g)
          </span>
        </div>
      </div>

      {/* 辨識出的食物清單與 RAG 驗證 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            盤中所有食物辨識與重量估算 ({foods.length} 項)
          </h4>
          <span className="text-xs text-slate-500">
            RAG 檢索食藥署資料庫比對
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">食物品名</th>
                <th className="py-2.5 px-3">預估重量 (g)</th>
                <th className="py-2.5 px-3">熱量 (kcal)</th>
                <th className="py-2.5 px-3">蛋白質</th>
                <th className="py-2.5 px-3">碳水</th>
                <th className="py-2.5 px-3">脂肪</th>
                <th className="py-2.5 px-3">官方 RAG 比對</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {foods.map((food, idx) => (
                <tr key={food.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{food.name}</div>
                    <div className="text-[10px] text-slate-500">{food.portion_description}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {food.estimated_weight_g} g
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-800">
                    {food.calories_kcal} kcal
                  </td>
                  <td className="py-3 px-3 text-rose-700 font-semibold">
                    {food.protein_g} g
                  </td>
                  <td className="py-3 px-3 text-blue-700 font-semibold">
                    {food.carbs_g} g
                  </td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold">
                    {food.fat_g} g
                  </td>
                  <td className="py-3 px-3">
                    {food.rag_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" title={food.rag_source}>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {food.rag_match_code || '食藥署已核實'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">標準估算</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 虛擬營養師邏輯建議面板 (AI Dietitian Logical Guidance) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-md border border-slate-700">
        
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">虛擬營養師 ‧ 深度邏輯點評</h4>
              <p className="text-[10px] text-slate-400">
                依據【{isBulking ? '增肌目標 (Hypertrophy)' : '減脂目標 (Fat Loss)'}】臨床邏輯評估
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-emerald-400">
              {dietitian_feedback.score} <span className="text-xs font-normal text-slate-400">/ 100 分</span>
            </div>
            <div className="text-[10px] text-emerald-300 capitalize font-medium">
              適配度：{dietitian_feedback.alignment_with_goal}
            </div>
          </div>
        </div>

        {/* 總結與邏輯解說 */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-emerald-200">
            「{dietitian_feedback.summary}」
          </p>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            {dietitian_feedback.goal_logic_explanation}
          </p>
        </div>

        {/* 優點與建議清單 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <h5 className="text-xs font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              此餐符合目標之亮點 (Pros)
            </h5>
            <ul className="space-y-1 text-xs text-slate-300">
              {dietitian_feedback.pros?.map((pro, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <h5 className="text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              營養師調控建議 (Recommendations)
            </h5>
            <ul className="space-y-1 text-xs text-slate-300">
              {dietitian_feedback.recommendations?.map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* 訓練時程與下一餐調整引導 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-700/60">
          <div className="bg-slate-800/40 p-2.5 rounded-lg">
            <span className="text-slate-400 font-bold block mb-0.5">⏱️ 最佳進食時機：</span>
            <span className="text-slate-200">{dietitian_feedback.timing_advice}</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-lg">
            <span className="text-slate-400 font-bold block mb-0.5">🥗 下一餐配額建議：</span>
            <span className="text-slate-200">{dietitian_feedback.next_meal_suggestion}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
