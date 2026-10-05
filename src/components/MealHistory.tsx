import React, { useState } from 'react';
import { History, Trash2, ChevronDown, ChevronUp, ShieldCheck, BrainCircuit, Flame, Activity } from 'lucide-react';
import { MealLog, MealType } from '../types';

interface MealHistoryProps {
  meals: MealLog[];
  onDeleteMeal: (id: string) => void;
  onSelectMeal: (meal: MealLog) => void;
}

export const MealHistory: React.FC<MealHistoryProps> = ({
  meals,
  onDeleteMeal,
  onSelectMeal
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMeals = meals.filter(m => {
    if (filterType === 'all') return true;
    return m.meal_type === filterType;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            雲端歷史餐點紀錄 (Meal_Logs 表)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            紀錄每餐辨識結果、熱量、三大營養素、時間戳記與虛擬營養師建議
          </p>
        </div>

        {/* 篩選標籤 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
            const labels: Record<string, string> = {
              all: '全部',
              breakfast: '早餐',
              lunch: '午餐',
              dinner: '晚餐',
              snack: '加餐'
            };
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterType === type
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 列表內容 */}
      <div className="mt-5 space-y-3">
        {filteredMeals.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-semibold">尚無此分類之餐點紀錄</p>
            <p className="text-xs text-slate-500 mt-1">拍照辨識後將自動持久化存入 Meal_Logs 表中</p>
          </div>
        ) : (
          filteredMeals.map((meal) => {
            const isExpanded = expandedId === meal.id;
            const dateStr = new Date(meal.timestamp).toLocaleString('zh-TW', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={meal.id}
                className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all bg-white"
              >
                <div
                  onClick={() => toggleExpand(meal.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
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
                        <span className="text-xs text-slate-400">{dateStr}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5 truncate">
                        {meal.meal_name}
                      </h4>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {meal.foods.map(f => f.name).join('、')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-base font-black text-slate-900">
                        {meal.total_calories} <span className="text-xs font-normal text-slate-500">kcal</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        P:{meal.total_protein}g | C:{meal.total_carbs}g | F:{meal.total_fat}g
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeal(meal.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="刪除紀錄"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* 展開詳情 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-slate-50/70 border-t border-slate-100 text-xs">
                    
                    {/* 食物細項 */}
                    <div className="mb-3">
                      <span className="font-bold text-slate-700 block mb-1">辨識細項與重量估算：</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {meal.foods.map((food, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200">
                            <div className="font-bold text-slate-900">{food.name} ({food.estimated_weight_g}g)</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              熱量 {food.calories_kcal} kcal | 蛋白質 {food.protein_g}g
                            </div>
                            {food.rag_verified && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                <ShieldCheck className="w-3 h-3" />
                                {food.rag_match_code || '食藥署比對通過'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 虛擬營養師點評 */}
                    {meal.dietitian_feedback && (
                      <div className="p-3 rounded-xl bg-slate-900 text-white">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                          <BrainCircuit className="w-4 h-4" />
                          <span>虛擬營養師點評 (評分: {meal.dietitian_feedback.score} 分)：</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {meal.dietitian_feedback.summary}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {meal.dietitian_feedback.goal_logic_explanation}
                        </p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
