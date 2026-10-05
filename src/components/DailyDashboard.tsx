import React from 'react';
import { Flame, Activity, Scale, ShieldCheck, Dumbbell, Clock, ChevronRight } from 'lucide-react';
import { UserProfile, MealLog } from '../types';
import { NextDayCompensationCard } from './NextDayCompensationCard';

interface DailyDashboardProps {
  user: UserProfile | null;
  dailySummary: any;
  onSelectMeal?: (meal: MealLog) => void;
  onGoToCamera: () => void;
  onConsultDietitian?: (promptText: string) => void;
}

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  user,
  dailySummary,
  onSelectMeal,
  onGoToCamera,
  onConsultDietitian
}) => {
  if (!user || !dailySummary) return null;

  const { consumed, remaining, user_target, today_meals } = dailySummary;
  const isBulking = user.goal === 'muscle_gain';

  const calPct = Math.min(100, Math.round((consumed.calories / user_target.calories) * 100)) || 0;
  const proPct = Math.min(100, Math.round((consumed.protein / user_target.protein_g) * 100)) || 0;
  const carbPct = Math.min(100, Math.round((consumed.carbs / user_target.carbs_g) * 100)) || 0;
  const fatPct = Math.min(100, Math.round((consumed.fat / user_target.fat_g) * 100)) || 0;

  return (
    <div className="space-y-6">
      
      {/* 頂部今日狀態與總熱量進度大卡 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isBulking ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isBulking ? '增肌目標 (Hypertrophy)' : '減脂目標 (Fat Loss)'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                BMR: {user.bmr} kcal | TDEE: {user.tdee} kcal
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">今日熱量與營養素進度儀表板</h2>
          </div>

          <button
            onClick={onGoToCamera}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <span>拍照記錄新餐點</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 熱量大數值核心 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
          
          <div className="md:col-span-1 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900 text-white shadow-inner">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">今日剩餘熱量</span>
            <div className="text-4xl font-black text-emerald-400 my-2">
              {remaining.calories} <span className="text-sm font-normal text-slate-300">kcal</span>
            </div>
            <div className="text-xs text-slate-400 text-center">
              已攝取 {consumed.calories} / 目標 {user_target.calories} kcal
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                style={{ width: `${calPct}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* 三大營養素進度條 */}
          <div className="md:col-span-2 space-y-4">
            
            {/* 蛋白質 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-bold">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <Activity className="w-4 h-4" />
                  蛋白質 (Protein)
                </span>
                <span className="text-slate-700">
                  {consumed.protein}g / <span className="text-slate-400">{user_target.protein_g}g</span> ({proPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  style={{ width: `${proPct}%` }}
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>{user.weight}kg 體重建議: {user.goal === 'muscle_gain' ? '2.0g/kg' : '2.2g/kg'}</span>
                <span>尚缺 {remaining.protein}g</span>
              </div>
            </div>

            {/* 碳水化合物 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-bold">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Scale className="w-4 h-4" />
                  碳水化合物 (Carbs)
                </span>
                <span className="text-slate-700">
                  {consumed.carbs}g / <span className="text-slate-400">{user_target.carbs_g}g</span> ({carbPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  style={{ width: `${carbPct}%` }}
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>肌醣原維持基數</span>
                <span>尚缺 {remaining.carbs}g</span>
              </div>
            </div>

            {/* 脂肪 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  脂質 (Fat)
                </span>
                <span className="text-slate-700">
                  {consumed.fat}g / <span className="text-slate-400">{user_target.fat_g}g</span> ({fatPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  style={{ width: `${fatPct}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>荷爾蒙合成必需</span>
                <span>尚缺 {remaining.fat}g</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 隔日營養補償方案 (增肌 / 減脂分別製作) */}
      <NextDayCompensationCard
        user={user}
        dailySummary={dailySummary}
        onConsultDietitian={onConsultDietitian}
      />

      {/* 今日餐點時間軸 (Today's Meals) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            今日已記錄餐點 ({today_meals.length} 餐)
          </h3>
          <span className="text-xs text-slate-500">
            自動同步至 Meal_Logs 雲端資料庫
          </span>
        </div>

        {today_meals.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Flame className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">今日尚未拍照記錄餐點</p>
            <p className="text-xs text-slate-500 mt-1">點擊上方「拍照記錄新餐點」開始記錄您的第一餐！</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {today_meals.map((meal: MealLog) => (
              <div
                key={meal.id}
                onClick={() => onSelectMeal?.(meal)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-xl px-2.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={meal.image_path}
                      alt={meal.meal_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                        {meal.meal_type}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{meal.meal_name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {meal.foods.map(f => f.name).join('、')}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-slate-900">
                    {meal.total_calories} <span className="text-xs font-normal text-slate-500">kcal</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    P:{meal.total_protein}g ‧ C:{meal.total_carbs}g ‧ F:{meal.total_fat}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
