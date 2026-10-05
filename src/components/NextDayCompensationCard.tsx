import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Flame,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Utensils,
  Activity,
  Scale,
  ShieldCheck,
  Clock,
  Droplets,
  MessageSquarePlus,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import {
  UserProfile,
  NextDayCompensationPlan,
  GoalSpecificCompensationPlan
} from '../types';

interface NextDayCompensationCardProps {
  user: UserProfile | null;
  dailySummary: any;
  compact?: boolean;
  onConsultDietitian?: (promptText: string) => void;
  onGoToDashboard?: () => void;
}

type SimulationMode = 'realtime' | 'under_consumed' | 'over_consumed';
type ViewMode = 'both' | 'muscle_gain' | 'fat_loss';

export const NextDayCompensationCard: React.FC<NextDayCompensationCardProps> = ({
  user,
  dailySummary,
  compact = false,
  onConsultDietitian,
  onGoToDashboard
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [simMode, setSimMode] = useState<SimulationMode>('realtime');

  if (!user || !dailySummary || !dailySummary.compensation_plan) {
    return null;
  }

  const basePlan: NextDayCompensationPlan = dailySummary.compensation_plan;

  // 支援即時真實進度與情境模擬預覽（讓使用者隨時可檢視「攝取不足」與「聚餐超標」兩種未達標情境下的增肌/減脂隔日補償方案）
  const activePlan: NextDayCompensationPlan = useMemo(() => {
    if (simMode === 'realtime') {
      return basePlan;
    }

    const isUnder = simMode === 'under_consumed';
    const simConsumedCal = isUnder
      ? Math.round(user.target_calories * 0.58)
      : Math.round(user.target_calories * 1.22);
    const simConsumedPro = isUnder
      ? Math.round(user.target_protein_g * 0.55)
      : Math.round(user.target_protein_g * 0.72);
    const simConsumedCarb = isUnder
      ? Math.round(user.target_carbs_g * 0.6)
      : Math.round(user.target_carbs_g * 1.35);
    const simConsumedFat = isUnder
      ? Math.round(user.target_fat_g * 0.65)
      : Math.round(user.target_fat_g * 1.4);

    const calDiff = simConsumedCal - user.target_calories;
    const proDiff = simConsumedPro - user.target_protein_g;
    const carbDiff = simConsumedCarb - user.target_carbs_g;
    const fatDiff = simConsumedFat - user.target_fat_g;

    const bulkBase = basePlan.muscle_gain_plan.tomorrow_adjusted_targets;
    const cutBase = basePlan.fat_loss_plan.tomorrow_adjusted_targets;

    if (isUnder) {
      return {
        ...basePlan,
        is_triggered: true,
        gap_status: {
          calories_diff: calDiff,
          protein_diff_g: proDiff,
          carbs_diff_g: carbDiff,
          fat_diff_g: fatDiff,
          calories_pct: 58,
          protein_pct: 55,
          carbs_pct: 60,
          fat_pct: 65,
          is_calories_met: false,
          is_protein_met: false,
          is_carbs_met: false,
          is_fat_met: false,
          is_all_met: false,
          unmet_items: [
            `熱量未達標 (尚缺 ${Math.abs(calDiff)} kcal)`,
            `蛋白質未達標 (尚缺 ${Math.abs(proDiff)}g)`,
            `碳水未達標 (尚缺 ${Math.abs(carbDiff)}g)`,
            `脂肪未達標 (尚缺 ${Math.abs(fatDiff)}g)`
          ]
        }
      };
    } else {
      // 聚餐熱量與碳脂超標、但蛋白質仍不足之典型外食未達標情境
      const overBulkPlan: GoalSpecificCompensationPlan = {
        ...basePlan.muscle_gain_plan,
        title: '增肌專屬 ‧ 隔日高脂超標修正與純肌合成方案',
        subtitle: '針對今日外食油脂/熱量超標但蛋白質不足，隔日下修油脂、拉高純蛋白與訓練量',
        badge_label: '增肌乾淨修正 (Lean Bulk Reset)',
        core_principle:
          '【增肌乾淨盈餘修正原則】今日總熱量雖超標，但多來自外食精製碳水與油脂，且關鍵蛋白質仍未達標！隔日應將多餘的熱量盈餘轉化為高強度重訓動能，下修明日脂肪 (-15g) 與微調總熱量 (-180 kcal)，同時強制追回蛋白質 (+25g)，防止「增肌變增肥」。',
        diagnostic_summary: `模擬外食超標情境（攝取 ${simConsumedCal} kcal）：熱量超標 +${calDiff} kcal、脂肪超標 +${fatDiff}g，但蛋白質卻尚缺 ${Math.abs(proDiff)}g。隔日增肌方案將目標熱量微調為 ${bulkBase.base_calories - 180} kcal，蛋白質提高至 ${bulkBase.base_protein_g + 25}g。`,
        tomorrow_adjusted_targets: {
          ...bulkBase,
          adjusted_calories: bulkBase.base_calories - 180,
          calories_delta: -180,
          adjusted_protein_g: bulkBase.base_protein_g + 25,
          protein_delta_g: 25,
          adjusted_carbs_g: bulkBase.base_carbs_g - 20,
          carbs_delta_g: -20,
          adjusted_fat_g: Math.max(40, bulkBase.base_fat_g - 15),
          fat_delta_g: -15
        }
      };

      const overCutPlan: GoalSpecificCompensationPlan = {
        ...basePlan.fat_loss_plan,
        title: '減脂專屬 ‧ 隔日超標修正與高鉀排鈉燃脂方案',
        subtitle: '針對今日熱量與碳脂超標，隔日啟動溫和赤字下修 (-280 kcal) 與高纖排鈉補償',
        badge_label: '減脂超標修正 (Deficit Reset)',
        core_principle:
          '【減脂超標溫和修正原則】今日熱量超出減脂目標時，隔日絕不可極端斷食（會導致皮質醇升高與肌肉流失）。應於隔日溫和下修精製碳水 (-40g) 與油脂 (-15g)，但嚴格補齊高蛋白 (+20g) 與高鉀十字花科蔬菜，搭配 25 分鐘餐後有氧即可平順抵銷超標熱量。',
        diagnostic_summary: `模擬聚餐超標情境（攝取 ${simConsumedCal} kcal）：超出減脂目標且碳脂偏高、蛋白質尚缺 ${Math.abs(proDiff)}g。隔日減脂方案將目標熱量下修至 ${Math.max(user.bmr, cutBase.base_calories - 280)} kcal，蛋白質拉高至 ${cutBase.base_protein_g + 20}g。`,
        tomorrow_adjusted_targets: {
          ...cutBase,
          adjusted_calories: Math.max(user.bmr, cutBase.base_calories - 280),
          calories_delta: Math.max(user.bmr, cutBase.base_calories - 280) - cutBase.base_calories,
          adjusted_protein_g: cutBase.base_protein_g + 20,
          protein_delta_g: 20,
          adjusted_carbs_g: Math.max(50, cutBase.base_carbs_g - 40),
          carbs_delta_g: -40,
          adjusted_fat_g: Math.max(35, cutBase.base_fat_g - 15),
          fat_delta_g: -15
        }
      };

      return {
        ...basePlan,
        is_triggered: true,
        gap_status: {
          calories_diff: calDiff,
          protein_diff_g: proDiff,
          carbs_diff_g: carbDiff,
          fat_diff_g: fatDiff,
          calories_pct: 122,
          protein_pct: 72,
          carbs_pct: 135,
          fat_pct: 140,
          is_calories_met: false,
          is_protein_met: false,
          is_carbs_met: false,
          is_fat_met: false,
          is_all_met: false,
          unmet_items: [
            `熱量超標 (+${calDiff} kcal)`,
            `蛋白質未達標 (尚缺 ${Math.abs(proDiff)}g)`,
            `碳水超標 (+${carbDiff}g)`,
            `脂肪超標 (+${fatDiff}g)`
          ]
        },
        muscle_gain_plan: overBulkPlan,
        fat_loss_plan: overCutPlan
      };
    }
  }, [basePlan, simMode, user]);

  const { gap_status, muscle_gain_plan, fat_loss_plan } = activePlan;

  const renderPlanColumn = (plan: GoalSpecificCompensationPlan) => {
    const isBulk = plan.goal_type === 'muscle_gain';
    const isCurrentUserGoal = user.goal === plan.goal_type;
    const t = plan.tomorrow_adjusted_targets;

    const formatDelta = (val: number, unit: string) => {
      if (val > 0) return `+${val}${unit}`;
      if (val < 0) return `${val}${unit}`;
      return `維持基準`;
    };

    return (
      <div
        key={plan.goal_type}
        className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
          isBulk
            ? 'bg-gradient-to-b from-amber-50/50 via-white to-white border-amber-200/90 shadow-sm'
            : 'bg-gradient-to-b from-rose-50/50 via-white to-white border-rose-200/90 shadow-sm'
        } ${isCurrentUserGoal ? 'ring-2 ring-emerald-500/80' : ''}`}
      >
        <div>
          {/* 方案頂部標頭 */}
          <div
            className={`p-4 sm:p-5 border-b ${
              isBulk ? 'border-amber-100 bg-amber-50/60' : 'border-rose-100 bg-rose-50/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                    isBulk
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                      : 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                  }`}
                >
                  {isBulk ? <Dumbbell className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                  <span>{isBulk ? '【增肌】隔日補償方案' : '【減脂】隔日補償方案'}</span>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isBulk
                      ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                      : 'bg-rose-100/80 text-rose-900 border-rose-300'
                  }`}
                >
                  {plan.badge_label}
                </span>
              </div>

              {isCurrentUserGoal && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  您的當前目標適用
                </span>
              )}
            </div>

            <h4 className="text-base font-black text-slate-900">{plan.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{plan.subtitle}</p>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {/* 1. 明日動態補償後配額總覽 (4 格指標) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-emerald-600" />
                  明日 ({activePlan.next_date}) 補償後目標配額
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  基準 vs 隔日補償目標
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 熱量 */}
                <div className="p-3 rounded-xl bg-slate-900 text-white">
                  <span className="text-[10px] text-slate-400 font-bold block">明日補償熱量</span>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {t.adjusted_calories} <span className="text-[10px] font-normal text-slate-300">kcal</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400">原 {t.base_calories}</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded ${
                        t.calories_delta > 0
                          ? 'bg-amber-500/20 text-amber-300'
                          : t.calories_delta < 0
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {formatDelta(t.calories_delta, ' kcal')}
                    </span>
                  </div>
                </div>

                {/* 蛋白質 */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
                  <span className="text-[10px] text-rose-700 font-bold block">明日補償蛋白質</span>
                  <div className="text-base font-black text-rose-900 font-mono mt-0.5">
                    {t.adjusted_protein_g}g
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-500">原 {t.base_protein_g}g</span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-1.5 rounded">
                      {formatDelta(t.protein_delta_g, 'g')}
                    </span>
                  </div>
                </div>

                {/* 碳水 */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
                  <span className="text-[10px] text-blue-700 font-bold block">明日補償碳水</span>
                  <div className="text-base font-black text-blue-900 font-mono mt-0.5">
                    {t.adjusted_carbs_g}g
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-500">原 {t.base_carbs_g}g</span>
                    <span className="font-bold text-blue-700 bg-blue-100 px-1.5 rounded">
                      {formatDelta(t.carbs_delta_g, 'g')}
                    </span>
                  </div>
                </div>

                {/* 脂肪 */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 font-bold block">明日補償脂肪</span>
                  <div className="text-base font-black text-emerald-900 font-mono mt-0.5">
                    {t.adjusted_fat_g}g
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-500">原 {t.base_fat_g}g</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                      {formatDelta(t.fat_delta_g, 'g')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 科學補償邏輯與今日缺口診斷 */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                isBulk
                  ? 'bg-amber-50/40 border-amber-200/70 text-slate-800'
                  : 'bg-rose-50/40 border-rose-200/70 text-slate-800'
              }`}
            >
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${isBulk ? 'text-amber-600' : 'text-rose-600'}`} />
                <span>運動營養師隔日補償核心邏輯</span>
              </div>
              <p className="text-slate-700">{plan.core_principle}</p>
              <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-medium">
                📊 缺口精算：{plan.diagnostic_summary}
              </p>
            </div>

            {/* 3. 熱量與三大營養素逐項補償策略 (非精簡模式或展開時顯示) */}
            {!compact && (
              <div className="space-y-2.5">
                <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>熱量與三大營養素 ‧ 隔日補償執行明細</span>
                </h5>

                <div className="space-y-2">
                  {plan.macro_strategies.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900">{item.nutrient}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {item.shortfall_or_excess}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.is_met
                                ? 'bg-emerald-100 text-emerald-800'
                                : isBulk
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status_label}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed text-[11px]">{item.action_plan}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400">隔日優先補償食材：</span>
                        {item.recommended_foods.map((food, fIdx) => (
                          <span
                            key={fIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium"
                          >
                            {food}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 隔日三餐與訓練窗口補償課表 */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                <span>隔日 ({activePlan.next_date}) 三餐與訓練補償執行菜單</span>
              </h5>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                {plan.meal_schedule.map((slot, sIdx) => (
                  <div key={sIdx} className="p-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            isBulk
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {slot.meal_slot}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {slot.timing}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {slot.macros_estimate}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mt-1">{slot.menu_suggestion}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">🎯 重點：{slot.focus}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. 訓練水分建議與禁忌提示 */}
            {!compact && (
              <div className="grid grid-cols-1 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/70 text-sky-900 flex items-start gap-2">
                  <Droplets className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">訓練與水分代謝配合：</strong>
                    <span>{plan.training_and_hydration_tip}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">營養師避坑叮嚀：</strong>
                    <span>{plan.warning_note}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部互動按鈕 */}
        <div className="p-4 pt-0 mt-auto">
          {onConsultDietitian ? (
            <button
              onClick={() =>
                onConsultDietitian(
                  `請根據我的【${isBulk ? '增肌' : '減脂'}隔日補償方案】（明日目標：${t.adjusted_calories} kcal、蛋白質 ${t.adjusted_protein_g}g、碳水 ${t.adjusted_carbs_g}g、脂肪 ${t.adjusted_fat_g}g），幫我搭配一份台灣便利商店（7-11 或全家）就能買齊的一日補償菜單！`
                )
              }
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm ${
                isBulk
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>請 AI 營養師客製「{isBulk ? '增肌' : '減脂'}隔日外食/超商補償菜單」</span>
            </button>
          ) : onGoToDashboard ? (
            <button
              onClick={onGoToDashboard}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
            >
              查看完整隔日補償明細與三餐課表 →
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 頂部未達標警示與控制列 */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {gap_status.is_all_met
                    ? '今日營養已達標（隔日穩態與預備補償方案）'
                    : '今日熱量與三大營養素總結未達標 ‧ 已啟動隔日補償方案'}
                </span>
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                結算基準日：{activePlan.reference_date} → 補償執行日：{activePlan.next_date}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              隔日營養補償方案（增肌 ／ 減脂 雙軌專屬制定）
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              系統即時比對【{user.name}】今日已攝取熱量與三大營養素缺口，分別針對
              <strong className="text-amber-300 mx-1">增肌（漸進式合成與肌醣原超量回補）</strong>
              與
              <strong className="text-rose-300 mx-1">減脂（抗分解純蛋白追回與穩糖排鈉修正）</strong>
              量身打造隔日配額調整與三餐執行計畫。
            </p>
          </div>

          {/* 檢視切換器 (雙方案並排 / 單看增肌 / 單看減脂) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="inline-flex p-1 rounded-xl bg-slate-800/90 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'both'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>增肌+減脂並排</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('muscle_gain')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'muscle_gain'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>增肌方案</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('fat_loss')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'fat_loss'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>減脂方案</span>
              </button>
            </div>
          </div>
        </div>

        {/* 今日未達標項目摘要徽章列 + 情境模擬切換 */}
        <div className="mt-4 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">今日總結診斷標籤：</span>
            {gap_status.unmet_items.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-amber-300 border border-amber-500/30"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 情境模擬器：方便使用者測試「攝取不足」與「聚餐超標」兩種未達標狀態 */}
          <div className="flex items-center gap-1.5 text-[11px] shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-semibold">補償情境：</span>
            <button
              type="button"
              onClick={() => setSimMode('realtime')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                simMode === 'realtime'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              今日實際進度
            </button>
            <button
              type="button"
              onClick={() => setSimMode('under_consumed')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                simMode === 'under_consumed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              模擬攝取不足
            </button>
            <button
              type="button"
              onClick={() => setSimMode('over_consumed')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                simMode === 'over_consumed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              模擬外食超標
            </button>
          </div>
        </div>
      </div>

      {/* 主體內容：分別呈現【增肌補償方案】與【減脂補償方案】 */}
      <div className="p-5 sm:p-6 bg-slate-50/50">
        {viewMode === 'both' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderPlanColumn(muscle_gain_plan)}
            {renderPlanColumn(fat_loss_plan)}
          </div>
        ) : viewMode === 'muscle_gain' ? (
          <div className="max-w-4xl mx-auto">{renderPlanColumn(muscle_gain_plan)}</div>
        ) : (
          <div className="max-w-4xl mx-auto">{renderPlanColumn(fat_loss_plan)}</div>
        )}
      </div>
    </div>
  );
};
