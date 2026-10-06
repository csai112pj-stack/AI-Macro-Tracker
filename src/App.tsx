import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CameraUploader } from './components/CameraUploader';
import { PipelineTracker } from './components/PipelineTracker';
import { MealAnalysisCard } from './components/MealAnalysisCard';
import { DailyDashboard } from './components/DailyDashboard';
import { MealHistory } from './components/MealHistory';
import { DatabaseInspector } from './components/DatabaseInspector';
import { DietitianChat } from './components/DietitianChat';
import { UserProfileModal } from './components/UserProfileModal';
import { CrossDeviceSyncModal } from './components/CrossDeviceSyncModal';
import { NextDayCompensationCard } from './components/NextDayCompensationCard';
import { UserProfile, MealLog, MealAnalysisResponse, MealType } from './types';
import { AlertCircle, Sparkles, CheckCircle2, UserPlus, Users, ArrowRight, QrCode, LogIn } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'dashboard' | 'history' | 'database' | 'chat'>('camera');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [deviceAccounts, setDeviceAccounts] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('nutrifit_device_accounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<MealAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 使用者設定與初次進站詢問對話框狀態
  const [userModalState, setUserModalState] = useState<{
    isOpen: boolean;
    mode: 'onboarding' | 'edit' | 'switch';
  }>({
    isOpen: false,
    mode: 'onboarding'
  });

  // 跨裝置 QR Code / 同步碼專屬彈窗
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [pendingChatQuery, setPendingChatQuery] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConsultDietitianWithPrompt = (promptText: string) => {
    setPendingChatQuery(promptText);
    setActiveTab('chat');
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const saveDeviceAccount = (account: UserProfile) => {
    setDeviceAccounts(prev => {
      const filtered = prev.filter(a => a.id !== account.id);
      const updated = [account, ...filtered];
      try {
        localStorage.setItem('nutrifit_device_accounts', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving device account:', err);
      }
      return updated;
    });
  };

  // 載入特定使用者的數據 (摘要與餐點紀錄)
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const headers = { 'X-User-Id': userId };
      const [userRes, summaryRes, mealsRes] = await Promise.all([
        fetch(`/api/user?userId=${encodeURIComponent(userId)}`, { headers }),
        fetch(`/api/daily-summary?userId=${encodeURIComponent(userId)}`, { headers }),
        fetch(`/api/meals?userId=${encodeURIComponent(userId)}`, { headers })
      ]);

      const [userData, summaryData, mealsData] = await Promise.all([
        userRes.json(),
        summaryRes.json(),
        mealsRes.json()
      ]);

      if (userData.success && userData.user) {
        setUser(userData.user);
      }
      if (summaryData.success) {
        setDailySummary(summaryData.summary);
      }
      if (mealsData.success) {
        setMeals(mealsData.meals || []);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // 1. 初始化：支援直接網址帶入同步碼 (?sync=NFT-XXXXXX) 或從本機記憶中還原
  const initializeApp = useCallback(async () => {
    try {
      // 優先檢查網址是否有攜帶跨裝置同步碼 (例如手機相機掃描 QR Code 開啟)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const syncParam = urlParams.get('sync') || urlParams.get('code');
        if (syncParam && syncParam.trim()) {
          try {
            const loginRes = await fetch('/api/user/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: syncParam.trim() })
            });
            const loginData = await loginRes.json();
            if (loginData.success && loginData.user) {
              localStorage.setItem('nutrifit_active_user_id', loginData.user.id);
              setUser(loginData.user);
              saveDeviceAccount(loginData.user);
              if (loginData.dailySummary) {
                setDailySummary(loginData.dailySummary);
              }
              await loadUserData(loginData.user.id);
              // 清除網址參數，維持乾淨體驗
              window.history.replaceState({}, document.title, window.location.pathname);
              showNotification(`🎉 跨裝置掃描同步成功！已為您登入【${loginData.user.name}】並載入完整餐點歷史！`, 'success');
              return;
            }
          } catch (syncErr) {
            console.error('URL sync failed:', syncErr);
          }
        }
      }

      // 檢查本機瀏覽器是否已有目前正在記錄的專屬使用者 ID
      const savedUserId = localStorage.getItem('nutrifit_active_user_id');

      if (savedUserId) {
        // 向後端請求該獨立身分
        const res = await fetch(`/api/user?userId=${encodeURIComponent(savedUserId)}`, {
          headers: { 'X-User-Id': savedUserId }
        });
        const data = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
          saveDeviceAccount(data.user);
          await loadUserData(data.user.id);
          return;
        } else {
          // 若後端查無此 ID，清空本機殘留 key
          localStorage.removeItem('nutrifit_active_user_id');
        }
      }

      // 若為全新開啟或不同瀏覽器未設定過身分：
      // 優先彈出對話框請使用者建立個人專屬資訊或登入已有身分
      setUser(null);
      setMeals([]);
      setDailySummary(null);
      setUserModalState({
        isOpen: true,
        mode: 'onboarding'
      });
    } catch (err) {
      console.error('Failed to init app:', err);
      setUser(null);
      setUserModalState({
        isOpen: true,
        mode: 'onboarding'
      });
    }
  }, [loadUserData]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // 建立全新使用者 (儲存到 Users 資料表，並將後續記錄綁定該使用者)
  const handleCreateUser = async (newUserData: any) => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('nutrifit_active_user_id', data.user.id);
        setUser(data.user);
        saveDeviceAccount(data.user);
        if (data.dailySummary) {
          setDailySummary(data.dailySummary);
        }
        setMeals([]);
        setLatestAnalysis(null);
        showNotification(`🎉 歡迎【${data.user.name}】！已成功建立個人獨立檔案與熱量配額，您的專屬唯一同步碼為 ${data.user.sync_code}（跨裝置登入請使用此唯一碼）！`, 'success');
      } else {
        throw new Error(data.error || '建立使用者失敗');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  // 跨裝置 / 換手機登入現有帳號
  const handleLoginUser = async (identifier: string, pin?: string) => {
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('nutrifit_active_user_id', data.user.id);
        setUser(data.user);
        saveDeviceAccount(data.user);
        if (data.dailySummary) {
          setDailySummary(data.dailySummary);
        }
        setLatestAnalysis(null);
        await loadUserData(data.user.id);
        showNotification(`🎉 跨裝置同步成功！已為您登入【${data.user.name}】並載入雲端餐點歷史！`, 'success');
      } else {
        throw new Error(data.error || '登入同步失敗');
      }
    } catch (err: any) {
      console.error('Error logging in user:', err);
      throw err;
    }
  };

 // 1. 徹底刪除帳號 (從資料庫永久刪除使用者與所有 Meal_Logs)
const handleDeleteUser = async (userId: string) => {
  // 💡 將「從此裝置記錄中移除」封裝成可重複呼叫的函式
  const removeLocalAccount = () => {
    // 從此裝置記錄中移除
    setDeviceAccounts(prev => {
      const updated = prev.filter(a => a.id !== userId);
      try {
        localStorage.setItem('nutrifit_device_accounts', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // 若被刪除的是目前活躍中的使用者
    if (user?.id === userId) {
      localStorage.removeItem('nutrifit_active_user_id');
      setUser(null);
      setMeals([]);
      setDailySummary(null);
      setLatestAnalysis(null);
      setUserModalState({
        isOpen: true,
        mode: 'onboarding'
      });
    }
  };

  try {
    const res = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId }
    });
    const data = await res.json();

    // 若 API 回傳失敗/找不到人，判斷是否為「已被刪除/404」
    if (!res.ok || !data.success) {
      const errorMsg = data?.error || '刪除帳號失敗';

      // 狀況：雲端資料庫其實已經沒有這個人了（404 或 已刪除）
      if (
        res.status === 404 || 
        errorMsg.includes('找不到') || 
        errorMsg.includes('已被刪除') || 
        errorMsg.includes('not found')
      ) {
        removeLocalAccount(); // 依然幫本機裝置清除記錄，避免卡片死卡在畫面上
        showNotification('該帳號已不在雲端，已為您從本機清單移除', 'info');
        return; // 正常結束，不拋出錯誤
      }

      // 真正失敗原因才拋出 Error
      throw new Error(errorMsg);
    }

    // 正常刪除成功：執行本機移除
    removeLocalAccount();
    showNotification('🗑️ 帳號與所有關聯餐點紀錄已永久從雲端伺服器徹底刪除！', 'success');

  } catch (err: any) {
    console.error('Error deleting user:', err);
    showNotification(`刪除失敗：${err.message}`, 'error');
    throw err;
  }
};

// 2. 僅從本裝置移除該帳號記憶 (不刪除雲端檔案) —— 保持原樣不變
const handleRemoveDeviceAccount = (userId: string) => {
  setDeviceAccounts(prev => {
    const updated = prev.filter(a => a.id !== userId);
    try {
      localStorage.setItem('nutrifit_device_accounts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return updated;
  });
  showNotification('已從本裝置紀錄清單移除 (雲端資料仍安全保留)', 'success');
};
  // 切換至本裝置已記錄的身分
  const handleSelectUser = async (selected: UserProfile) => {
    localStorage.setItem('nutrifit_active_user_id', selected.id);
    setUser(selected);
    saveDeviceAccount(selected);
    setLatestAnalysis(null);
    await loadUserData(selected.id);
    showNotification(`已切換至【${selected.name}】，系統現正為此身分記錄餐點。`, 'success');
  };

  // 登出並清除本機工作階段
  const handleSignOut = () => {
    localStorage.removeItem('nutrifit_active_user_id');
    setUser(null);
    setMeals([]);
    setDailySummary(null);
    setLatestAnalysis(null);
    setUserModalState({
      isOpen: true,
      mode: 'onboarding'
    });
    showNotification('🔒 已成功登出此裝置工作階段，健康隱私受全面隔離防護。', 'success');
  };

  // 更新目前使用者的身材數值與健身目標 (Users 表)
  const handleSaveUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({ ...updates, id: user.id })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        saveDeviceAccount(data.user);
        if (data.dailySummary) {
          setDailySummary(data.dailySummary);
        }
        showNotification(`已更新【${data.user.name}】的身材數據與健身目標！`, 'success');
      } else {
        throw new Error(data.error || '更新失敗');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      showNotification(`更新失敗：${err.message}`, 'error');
      throw err;
    }
  };

  // 觸發「拍照即記錄」AI 辨識與 RAG 計算 (關聯至當前使用者)
  const handleAnalyzeMeal = async (imageData: string, mimeType: string, mealType: MealType) => {
    if (!user) {
      showNotification('請先設定或選擇使用者資訊，系統才能將餐點紀錄在您的專屬帳戶中！', 'error');
      setUserModalState({ isOpen: true, mode: 'onboarding' });
      return;
    }

    setIsAnalyzing(true);
    setLatestAnalysis(null);

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({
          image: imageData,
          mimeType,
          mealType,
          autoSave: true,
          userId: user.id // 關聯至當前已記錄的使用者
        })
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setLatestAnalysis(data.analysis);
        if (data.saved_meal) {
          setMeals((prev) => {
            if (prev.some(m => m.id === data.saved_meal.id)) {
              return prev;
            }
            return [data.saved_meal, ...prev];
          });
        }
        if (data.updated_daily_summary) {
          setDailySummary(data.updated_daily_summary);
        }
        if (data.analysis.is_food_detected !== false && data.analysis.foods && data.analysis.foods.length > 0) {
          showNotification(`🎉 辨識完成！「${data.analysis.meal_name}」已為【${user.name}】存入 Meal_Logs 資料表。`, 'success');
        } else {
          const reasonMsg = data.analysis.unrecognized_reason || 'AI 視覺系統未在照片中辨識到可食用的餐點內容';
          showNotification(`⚠️ 無法辨識食物照：${reasonMsg}，請參考下方提示調整後重新上傳！`, 'error');
        }
      } else {
        throw new Error(data.error || '分析服務未回傳有效資料');
      }
    } catch (err: any) {
      console.error('Meal analysis error:', err);
      showNotification(`分析失敗：${err.message || '請檢查網路連線或圖片'}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 刪除 Meal_Logs 紀錄
  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/meals/${mealId}?userId=${encodeURIComponent(user.id)}`, { 
        method: 'DELETE',
        headers: { 'X-User-Id': user.id }
      });
      const data = await res.json();
      if (data.success) {
        setMeals((prev) => prev.filter((m) => m.id !== mealId));
        // 同步刷新當前使用者的今日統計
        const summaryRes = await fetch(`/api/daily-summary?userId=${encodeURIComponent(user.id)}`, {
          headers: { 'X-User-Id': user.id }
        });
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setDailySummary(summaryData.summary);
        }
        showNotification('已從 Meal_Logs 資料表中刪除紀錄', 'success');
      } else {
        showNotification(data.error || '刪除失敗', 'error');
      }
    } catch (err) {
      console.error('Error deleting meal:', err);
      showNotification('刪除失敗', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* 頂部導航欄 */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenSettings={() => setUserModalState({ isOpen: true, mode: 'edit' })}
        onOpenUserSwitch={() => setUserModalState({ isOpen: true, mode: 'switch' })}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* 通知提示橫條 */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all border ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 主要內容容器 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 未登入/未選擇使用者時的顯眼引導提示 */}
        {!user && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/80 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>開啟系統第一步：請先設定或選擇記錄的使用者資訊</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    客製化準備
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  設定您的姓名、身高、體重與增肌/減脂目標後，系統才會為您建立專屬飲食日記與 RAG 營養分析。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setUserModalState({ isOpen: true, mode: 'switch' })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>已有帳號？電腦/手機同步登入</span>
              </button>

              <button
                onClick={() => setUserModalState({ isOpen: true, mode: 'onboarding' })}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <span>建立全新身分</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: 拍照辨識與即時分析 */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            <CameraUploader
              onAnalyze={handleAnalyzeMeal}
              isAnalyzing={isAnalyzing}
              user={user}
            />

            {/* 分析管線執行進度卡 */}
            <PipelineTracker isAnalyzing={isAnalyzing} />

            {/* 當前最新辨識與營養師建議結果卡 */}
            {latestAnalysis && (
              <MealAnalysisCard
                analysis={latestAnalysis}
                user={user}
                savedToDatabase={true}
              />
            )}

            {/* 若今日已有進度，在下方提供快捷進度視圖 */}
            {dailySummary && user && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      【{user.name}】今日熱量與三大營養素總結
                    </h3>
                    <p className="text-xs text-slate-500">
                      依據 {user.goal === 'muscle_gain' ? '增肌' : '減脂'} 目標即時扣減已攝取配額
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    查看完整報表 →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-400 block font-semibold">今日已攝取 / 目標熱量</span>
                    <strong className="text-base font-bold text-slate-900 font-mono">
                      {dailySummary.consumed.calories} / {dailySummary.user_target.calories} kcal
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-400 block font-semibold">蛋白質 (Protein)</span>
                    <strong className="text-base font-bold text-rose-700 font-mono">
                      {dailySummary.consumed.protein} / {dailySummary.user_target.protein_g}g
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-400 block font-semibold">碳水化合物 (Carbs)</span>
                    <strong className="text-base font-bold text-blue-700 font-mono">
                      {dailySummary.consumed.carbs} / {dailySummary.user_target.carbs_g}g
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-400 block font-semibold">脂肪 (Fat)</span>
                    <strong className="text-base font-bold text-emerald-700 font-mono">
                      {dailySummary.consumed.fat} / {dailySummary.user_target.fat_g}g
                    </strong>
                  </div>
                </div>

                {/* 若今日熱量與三大營養素總結未達標，立即提供隔日補償方案（增肌/減脂分別製作） */}
                <div className="mt-6">
                  <NextDayCompensationCard
                    user={user}
                    dailySummary={dailySummary}
                    onConsultDietitian={handleConsultDietitianWithPrompt}
                    onGoToDashboard={() => setActiveTab('dashboard')}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 今日進度與目標儀表板 */}
        {activeTab === 'dashboard' && (
          <DailyDashboard
            user={user}
            dailySummary={dailySummary}
            onGoToCamera={() => setActiveTab('camera')}
            onSelectMeal={() => {
              setActiveTab('history');
            }}
            onConsultDietitian={handleConsultDietitianWithPrompt}
          />
        )}

        {/* TAB 3: 飲食歷史紀錄 (Meal_Logs 表) */}
        {activeTab === 'history' && (
          <MealHistory
            meals={meals}
            onDeleteMeal={handleDeleteMeal}
            onSelectMeal={() => {}}
          />
        )}

        {/* TAB 4: 關聯資料庫檢視器 (Users & Meal_Logs 表、SQL DDL、RAG 資料庫) */}
        {activeTab === 'database' && (
          <DatabaseInspector
            activeUserId={user?.id}
          />
        )}

        {/* TAB 5: 虛擬營養師諮詢對話 */}
        {activeTab === 'chat' && (
          <DietitianChat
            user={user}
            dailySummary={dailySummary}
            onUpdateUser={handleSaveUserProfile}
            pendingQuery={pendingChatQuery}
            onClearPendingQuery={() => setPendingChatQuery(null)}
          />
        )}

      </main>

      {/* 使用者初次填寫 / 編輯 / 切換 / 跨裝置登入對話框 */}
      <UserProfileModal
        user={user}
        deviceAccounts={deviceAccounts}
        isOpen={userModalState.isOpen}
        mode={userModalState.mode}
        onClose={() => setUserModalState(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveUserProfile}
        onCreateUser={handleCreateUser}
        onSelectUser={handleSelectUser}
        onLoginUser={handleLoginUser}
        onDeleteAccount={handleDeleteUser}
        onRemoveDeviceAccount={handleRemoveDeviceAccount}
        onSignOut={handleSignOut}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* 跨裝置同步與換機專屬 QR Code / 同步代碼彈窗 */}
      <CrossDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        user={user}
        onUpdatePin={async (newPin: string) => {
          if (!user) return;
          await handleSaveUserProfile({ pin: newPin });
        }}
      />

      {/* 頁腳 */}
      <footer className="mt-auto py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AI 健身營養師 ‧ 雲端部署 Google Cloud Run</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>辨識引擎: Gemini 3.8 Flash</span>
            <span>•</span>
            <span>RAG 知識庫: 衛福部食藥署食品成分資料庫 (TFDA)</span>
            <span>•</span>
            <span>關聯結構: Users & Meal_Logs 表</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
