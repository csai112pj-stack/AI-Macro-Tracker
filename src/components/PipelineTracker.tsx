import React, { useEffect, useState } from 'react';
import { Camera, Database, Scale, PieChart, Sparkles, Server, CheckCircle2, Loader2 } from 'lucide-react';

interface PipelineTrackerProps {
  isAnalyzing: boolean;
}

const STEPS = [
  { id: 1, name: '影像多模態分析', desc: 'Gemini 3.8 Flash 食物視覺邊界與項目辨識', icon: Camera },
  { id: 2, name: 'RAG 知識庫比對', desc: '串接政府衛福部食藥署「食品營養成分資料庫」', icon: Database },
  { id: 3, name: '份量與熱量估算', desc: '幾何比例重量 (g) 測量與精確 kcal 換算', icon: Scale },
  { id: 4, name: '目標巨量營養分析', desc: '增肌 / 減脂蛋白質、碳水、脂肪 (P:C:F) 比例換算', icon: PieChart },
  { id: 5, name: '虛擬營養師邏輯合成', desc: 'LLM 結合歷史代謝、訓練時程產出專業建議', icon: Sparkles },
  { id: 6, name: 'JSON 格式化 & 入庫', desc: '產生標準 JSON 物件並持久化寫入 Meal_Logs 表', icon: Server }
];

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ isAnalyzing }) => {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(1);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 my-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          <h3 className="font-bold text-base text-white">正在執行「拍照即記錄」AI 智慧營養師分析管線</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
          進度: {currentStep} / 6
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-emerald-950/60 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                  : isDone
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800/40 opacity-40 text-slate-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-400">0{step.id}</span>
                    <h4 className="text-sm font-semibold text-slate-100 truncate">{step.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
