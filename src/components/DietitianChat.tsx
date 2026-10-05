import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Loader2, 
  Dumbbell, 
  Flame, 
  Edit3, 
  Check, 
  X, 
  ChefHat, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Clock, 
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { UserProfile, RecommendedRecipe } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'dietitian';
  text: string;
  timestamp: string;
}

interface DietitianChatProps {
  user: UserProfile | null;
  dailySummary: any;
  onUpdateUser?: (updated: Partial<UserProfile>) => Promise<void>;
  pendingQuery?: string | null;
  onClearPendingQuery?: () => void;
}

export const DietitianChat: React.FC<DietitianChatProps> = ({
  user,
  dailySummary,
  onUpdateUser,
  pendingQuery,
  onClearPendingQuery
}) => {
  const isBulking = user?.goal === 'muscle_gain';

  // 改名欄位狀態
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // 主動推播建議食譜狀態 (3 則)
  const [recipes, setRecipes] = useState<RecommendedRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [showRecipePanel, setShowRecipePanel] = useState(true);

  // 對話訊息
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'dietitian',
      text: `你好 ${user?.name || '健身夥伴'}！我是你的專屬 AI 虛擬運動營養師。\n\n我已同步你的數據（體重 ${user?.weight}kg、體脂 ${user?.body_fat_rate}%）與【${isBulking ? '增肌目標 (高蛋白+熱量盈餘)' : '減脂目標 (高蛋白+熱量赤字)'}】。\n\n今日你已攝取 ${dailySummary?.consumed?.calories || 0} kcal（蛋白質 ${dailySummary?.consumed?.protein || 0}g），剩餘配額約 ${dailySummary?.remaining?.calories || 0} kcal。我已為你「主動推播 3 則量身定製的建議食譜」（見上方面板），若有任何烹飪步驟、外食替代或訓練補給問題，歡迎隨時問我！`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNewName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 主動獲取 3 則符合目標與今日缺口的建議食譜
  const fetchRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const url = user?.id ? `/api/dietitian/recipes?userId=${user.id}` : '/api/dietitian/recipes';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.recipes)) {
        setRecipes(data.recipes.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [user?.id, user?.goal, dailySummary?.consumed?.calories]);

  // 改名保存處理
  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === user?.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      if (onUpdateUser) {
        await onUpdateUser({ name: trimmed });
      }
      setIsEditingName(false);
      
      // 營養師主動在對話中確認新暱稱
      const confirmMsg: Message = {
        id: 'rename_' + Date.now(),
        sender: 'dietitian',
        text: `已為你更新稱呼為【${trimmed}】！日後的飲食分析、每日進度推播與食譜建議都會以此暱稱為你專屬服務。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      console.error('Failed to rename user:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/dietitian/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, userId: user?.id })
      });
      const data = await res.json();
      
      const botReply: Message = {
        id: 'bot_' + Date.now(),
        sender: 'dietitian',
        text: data.reply || '抱歉，暫時無法產生營養師回覆，請稍後再試。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error('Dietitian chat error:', err);
      const errMsg: Message = {
        id: 'err_' + Date.now(),
        sender: 'dietitian',
        text: '抱歉，連線至雲端營養師服務異常，請確認伺服器連線狀態。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // 詢問特定食譜的烹調細節或外食替代
  const handleAskRecipeDetails = (recipe: RecommendedRecipe) => {
    const question = `我想了解【${recipe.name}】（${recipe.calories_kcal} kcal / 蛋白 ${recipe.protein_g}g）的具體烹調備餐步驟，以及如果在便利商店或外食有什麼替代搭配？`;
    handleSend(question);
  };

  useEffect(() => {
    if (pendingQuery && pendingQuery.trim()) {
      handleSend(pendingQuery);
      if (onClearPendingQuery) {
        onClearPendingQuery();
      }
    }
  }, [pendingQuery]);

  const quickPrompts = isBulking
    ? [
        '今日熱量與蛋白質未達標，請給我明日【增肌專屬】隔日補償超商三餐搭配！',
        '我今天晚上要深蹲練腿，訓練後要吃多少碳水？',
        '目前增肌熱量還缺 400 kcal，建議吃什麼優質原型食物？',
        '增肌與減脂的隔日補償方案在碳水與蛋白質分配上有何差異？'
      ]
    : [
        '今日營養素未達標，請給我明日【減脂專屬】抗分解保肌補償三餐菜單！',
        '如果今天聚餐熱量與油脂不小心超標，明天減脂補償該怎麼吃才不掉肌肉？',
        '目前減脂蛋白質已達標但有飢餓感，蔬菜該怎麼補？',
        '外食便利商店有推薦的超低卡高蛋白消夜嗎？'
      ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[760px] overflow-hidden">
      
      {/* 頂部標頭：營養師身分 + 改名欄位 + 目標熱量提示 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* 左側：營養師身分 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">AI 虛擬運動營養師</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-500">
              對齊【{isBulking ? '增肌目標 (充足熱量+高蛋白)' : '減脂目標 (熱量赤字+抗分解)'}】與今日攝取情況
            </p>
          </div>
        </div>

        {/* 右側：改名欄位與今日剩餘指標 */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* 改名欄位 */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  id="input-dietitian-rename"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  placeholder="輸入新暱稱..."
                  className="w-28 px-2 py-0.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  id="btn-save-rename"
                  onClick={handleSaveName}
                  disabled={isSavingName || !newName.trim()}
                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
                  title="確認儲存新姓名"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-cancel-rename"
                  onClick={() => {
                    setNewName(user?.name || '');
                    setIsEditingName(false);
                  }}
                  className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  title="取消"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-edit-user-name"
                onClick={() => setIsEditingName(true)}
                className="group flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                title="點擊修改使用者姓名/暱稱"
              >
                <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                <span>夥伴：{user?.name || '健身夥伴'}</span>
                <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 ml-0.5" />
              </button>
            )}
          </div>

          {/* 今日剩餘熱量標籤 */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-bold shadow-sm">
            {isBulking ? <Dumbbell className="w-3.5 h-3.5 text-amber-600" /> : <Flame className="w-3.5 h-3.5 text-rose-600" />}
            <span>剩餘 {dailySummary?.remaining?.calories || 0} kcal</span>
          </div>
        </div>

      </div>

      {/* 主動推播建議食譜面板 (3 則量身定做) */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-emerald-100/60">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-sm">
              <ChefHat className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                  主動推播 3 則符合營養需求的建議食譜
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {isBulking ? '增肌首選' : '減脂精選'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                依據 {user?.name || '您'} 的【{isBulking ? '增肌目標' : '減脂目標'}】與今日攝取剩餘 {dailySummary?.remaining?.calories || 0} kcal 動態精算
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRecipes}
              disabled={isLoadingRecipes}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100/70 rounded-lg flex items-center gap-1 transition-colors"
              title="依據最新進度重新推播食譜"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingRecipes ? 'animate-spin' : ''}`} />
              <span>重新推播</span>
            </button>
            <button
              onClick={() => setShowRecipePanel(!showRecipePanel)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-colors"
              title={showRecipePanel ? '收合食譜' : '展開食譜'}
            >
              {showRecipePanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3 則食譜卡片列表 */}
        {showRecipePanel && (
          <div className="p-3">
            {isLoadingRecipes ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>AI 營養師正在針對今日熱量缺口客製 3 則最適食譜...</span>
              </div>
            ) : recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recipes.map((recipe, index) => (
                  <div
                    key={recipe.id || index}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* 食譜標題與分類標籤 */}
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {recipe.category || (isBulking ? '增肌修復' : '減脂高纖')}
                        </span>
                        {recipe.prep_time_minutes && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {recipe.prep_time_minutes} 分鐘
                          </span>
                        )}
                      </div>

                      <h5 className="font-extrabold text-xs text-slate-900 line-clamp-1 mb-2">
                        {recipe.name}
                      </h5>

                      {/* 四大熱量與營養素徽章 */}
                      <div className="grid grid-cols-4 gap-1 text-center py-1.5 px-2 rounded-lg bg-slate-50 text-[11px] font-mono mb-2">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">熱量</span>
                          <span className="font-bold text-slate-800">{recipe.calories_kcal}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">蛋白質</span>
                          <span className="font-bold text-rose-600">{recipe.protein_g}g</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">碳水</span>
                          <span className="font-bold text-blue-600">{recipe.carbs_g}g</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">脂肪</span>
                          <span className="font-bold text-amber-600">{recipe.fat_g}g</span>
                        </div>
                      </div>

                      {/* 食材清單 */}
                      <div className="mb-2">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">主要食材：</span>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 營養師推薦理由 */}
                      <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[10px] text-emerald-900 leading-relaxed mb-2.5">
                        <strong className="block text-emerald-800 mb-0.5 font-sans flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          契合今日配額依據：
                        </strong>
                        <p className="line-clamp-2">{recipe.reason}</p>
                      </div>
                    </div>

                    {/* 詢問按鈕 */}
                    <button
                      onClick={() => handleAskRecipeDetails(recipe)}
                      disabled={loading}
                      className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>請教詳細作法與外食選購</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                尚未載入食譜，點擊上方「重新推播」即可獲取 3 則專屬食譜。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 訊息流 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isMe = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs ${
                  isMe
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
                <span className={`text-[10px] text-slate-400 mt-1 block ${isMe ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>營養師正在研判代謝歷史與食物邏輯...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* 快捷常見問題建議 */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          快捷諮詢：
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs transition-colors border border-slate-200/60"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 輸入區 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="詢問營養師任何飲食搭配、補給品、增肌減脂或食譜做法..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`p-2.5 rounded-xl transition-colors ${
            !input.trim() || loading
              ? 'bg-slate-100 text-slate-400'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
