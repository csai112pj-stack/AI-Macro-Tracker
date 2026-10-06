import React, { useState, useEffect } from 'react';
import { 
  X, Dumbbell, Flame, Check, Scale, UserPlus, Users, ArrowRight, 
  ShieldCheck, Sparkles, KeyRound, QrCode, Copy, Trash2, LogIn, AlertTriangle 
} from 'lucide-react';
import { UserProfile, FitnessGoal, Gender } from '../types';

interface UserProfileModalProps {
  user: UserProfile | null;
  deviceAccounts: UserProfile[];
  isOpen: boolean;
  mode: 'onboarding' | 'edit' | 'switch';
  onClose: () => void;
  onSave: (updatedUser: Partial<UserProfile>) => Promise<void>;
  onCreateUser: (newUser: {
    name: string;
    gender: Gender;
    age: number;
    height: number;
    weight: number;
    body_fat_rate: number;
    goal: FitnessGoal;
    activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active';
    pin?: string;
  }) => Promise<void>;
  onSelectUser: (user: UserProfile) => void;
  onLoginUser: (identifier: string, pin?: string) => Promise<void>;
  onDeleteAccount: (userId: string) => Promise<void>;
  onRemoveDeviceAccount?: (userId: string) => void;
  onSignOut?: () => void;
  onOpenSyncModal?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  deviceAccounts,
  isOpen,
  mode,
  onClose,
  onSave,
  onCreateUser,
  onSelectUser,
  onLoginUser,
  onDeleteAccount,
  onRemoveDeviceAccount,
  onSignOut,
  onOpenSyncModal
}) => {
  // 分頁狀態：'form' (建立/編輯表單), 'login' (跨裝置登入), 'list' (此裝置帳號列表)
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'login' | 'list'>('form');

  // 表單欄位狀態
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState(26);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [bodyFat, setBodyFat] = useState(18);
  const [goal, setGoal] = useState<FitnessGoal>('muscle_gain');
  const [activity, setActivity] = useState<'sedentary' | 'light' | 'moderate' | 'very_active'>('moderate');
  const [pin, setPin] = useState('');
  
  // 跨裝置登入欄位狀態
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 刪除確認狀態
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 一般狀態
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);

  // 當開啟或模式切換時初始化資料
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setConfirmDeleteId(null);
      if (mode === 'edit' && user) {
        setName(user.name);
        setGender(user.gender);
        setAge(user.age);
        setHeight(user.height);
        setWeight(user.weight);
        setBodyFat(user.body_fat_rate);
        setGoal(user.goal);
        setActivity(user.activity_level);
        setPin(user.pin || '');
        setActiveSubTab('form');
      } else if (mode === 'switch') {
        setActiveSubTab(deviceAccounts.length > 0 ? 'list' : 'login');
      } else if (mode === 'onboarding') {
        setName('');
        setGender('male');
        setAge(25);
        setHeight(175);
        setWeight(70);
        setBodyFat(18);
        setGoal('muscle_gain');
        setActivity('moderate');
        setPin('');
        setActiveSubTab('form');
      }
    }
  }, [isOpen, mode, user, deviceAccounts.length]);

  if (!isOpen) return null;

  const isOnboarding = mode === 'onboarding';

  // 即時預覽計算 (Mifflin-St Jeor 公式)
  const calcBmr = Math.round(
    gender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161
  );

  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725 };
  const calcTdee = Math.round(calcBmr * (multipliers[activity] || 1.55));

  let targetCal = calcTdee;
  let targetPro = Math.round(weight * 2.0);
  if (goal === 'muscle_gain') {
    targetCal = calcTdee + 300;
    targetPro = Math.round(weight * 2.0);
  } else if (goal === 'fat_loss') {
    targetCal = Math.max(1200, calcTdee - 400);
    targetPro = Math.round(weight * 2.2);
  } else {
    targetPro = Math.round(weight * 1.8);
  }

  // 提交建立或更新表單
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('請填寫您的姓名或健身暱稱');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'edit' && user) {
        await onSave({
          id: user.id,
          name: name.trim(),
          gender,
          age: Number(age),
          height: Number(height),
          weight: Number(weight),
          body_fat_rate: Number(bodyFat),
          goal,
          activity_level: activity,
          pin: pin.trim() ? pin.trim() : undefined
        });
        onClose();
      } else {
        await onCreateUser({
          name: name.trim(),
          gender,
          age: Number(age),
          height: Number(height),
          weight: Number(weight),
          body_fat_rate: Number(bodyFat),
          goal,
          activity_level: activity,
          pin: pin.trim() ? pin.trim() : undefined
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to save user profile:', err);
      setErrorMessage(err.message || '儲存失敗，請檢查網路連線或稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  // 執行跨裝置登入 (僅限專屬唯一同步碼)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('請輸入您的專屬唯一同步碼 (例如 NFT-8888-8888)');
      return;
    }

    setIsLoggingIn(true);
    setErrorMessage(null);

    try {
      await onLoginUser(loginIdentifier.trim(), loginPin.trim() || undefined);
      setLoginIdentifier('');
      setLoginPin('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '登入失敗，請確認專屬同步碼是否正確');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 執行永久刪除帳號
  const handleConfirmDelete = async (userId: string) => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onDeleteAccount(userId);
      setConfirmDeleteId(null);
      if (user?.id === userId) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || '刪除帳號失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* 頂部標頭 */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                {mode === 'edit' ? <Scale className="w-6 h-6" /> : activeSubTab === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {mode === 'edit' 
                      ? '個人健身檔案與跨裝置同步' 
                      : activeSubTab === 'login'
                        ? '登入已有帳號 (電腦 / 換手機同步)'
                        : isOnboarding 
                          ? '初次使用：請建立專屬健身檔案' 
                          : '切換、登入或新增檔案'}
                  </h3>
                  {isOnboarding && activeSubTab === 'form' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      必要步驟
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeSubTab === 'login' 
                    ? '若您在電腦或其他裝置已建立過飲食帳號，輸入專屬同步碼即可無縫繼承所有紀錄！'
                    : mode === 'edit'
                      ? '修改您的身高體重目標，或查看跨裝置同步碼以在手機與電腦共用同一個帳號。'
                      : '設定專屬身高、體重與增肌/減脂目標，系統將為您客製化 BMR / TDEE 每日熱量預算。'}
                </p>
              </div>
            </div>

            {(!isOnboarding || user) && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 模式分頁切換按鈕 (Onboarding 或 Switch 模式) */}
          {mode !== 'edit' && (
            <div className="flex items-center gap-1.5 mt-4 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
              {isOnboarding ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('form');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeSubTab === 'form'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>建立全新個人檔案</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('login');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeSubTab === 'login'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    <span>已有帳號？電腦/手機同步登入</span>
                  </button>
                </>
              ) : (
                <>
                  {deviceAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('list');
                        setErrorMessage(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeSubTab === 'list'
                          ? 'bg-white text-emerald-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>此裝置帳號 ({deviceAccounts.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('login');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeSubTab === 'login'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    <span>跨裝置登入</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('form');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeSubTab === 'form'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>建立新身分</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 錯誤提示 */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* 分頁 1: 跨裝置登入 (僅支援專屬唯一同步碼) */}
        {/* ================================================================= */}
        {activeSubTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-50 border border-emerald-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>電腦與手機無縫同步說明 (唯一同步碼識別)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                NutriFit AI 的所有飲食記錄皆存於雲端資料庫。<strong>系統完全允許不同使用者同名</strong>，為確保個人資料精確隔離與帳號安全，跨裝置或換手機登入一律使用<strong>專屬唯一同步碼（如 NFT-7K4W-9X2M）</strong>。在下方輸入即可立刻無損還原您的飲食與目標紀錄！
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                <span>帳號專屬唯一同步碼 (Sync Code)：</span>
                <span className="text-emerald-700 text-[10px] font-bold">🔒 100% 唯一驗證</span>
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="例如：NFT-7K4W-9X2M"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                required
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                提示：請在已建立帳號的裝置上複製專屬同步碼。為避免同名混淆並保障隱私，跨裝置登入僅認專屬唯一同步碼。
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                <span>安全保護 PIN 碼 (若有設定)：</span>
                <span className="text-slate-400 text-[10px]">無設定則留空</span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                placeholder="輸入 4-6 位數數字 PIN 碼 (若曾設定)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              {(!isOnboarding || user) && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
              )}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? '正在雲端檢索並同步...' : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>以專屬同步碼立即同步</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* ================================================================= */}
        {/* 分頁 2: 選擇此裝置已有使用者列表 */}
        {/* ================================================================= */}
        {activeSubTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>此裝置已記錄之身分（若在其他手機使用，請使用跨裝置同步碼登入）：</span>
            </div>

            {deviceAccounts.map((u) => {
              const isCurrent = user?.id === u.id;
              const isBulking = u.goal === 'muscle_gain';
              const isConfirming = confirmDeleteId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div 
                    onClick={() => {
                      if (!isConfirming) {
                        onSelectUser(u);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isBulking ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.name.substring(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{u.name}</span>
                        {u.sync_code && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {u.sync_code}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            目前記錄中
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{u.gender === 'male' ? '男性' : '女性'} ‧ {u.height}cm / {u.weight}kg</span>
                        <span>•</span>
                        <span className="font-mono font-semibold text-emerald-700">目標 {u.target_calories} kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* 操作動作按鈕 */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-50 border border-rose-200">
                        <span className="text-[11px] font-bold text-rose-700 px-1">確定永久刪除？</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleConfirmDelete(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all shadow-sm"
                        >
                          {isDeleting ? '刪除中...' : '確認'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-100"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectUser(u);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          <span>{isCurrent ? '使用中' : '切換'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* 永久刪除按鈕 */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(u.id)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="永久刪除此帳號與所有餐點歷史紀錄"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('login')}
                  className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>跨裝置同步其他帳號</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('form')}
                  className="text-xs font-bold text-slate-700 hover:underline inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>建立新身分</span>
                </button>
              </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>🔒 登出目前裝置</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 分頁 3: 建立全新個人身分 或 編輯現有檔案 */}
        {/* ================================================================= */}
        {activeSubTab === 'form' && (
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* 若在編輯模式，展示跨裝置同步資訊卡 */}
            {mode === 'edit' && user && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
                    📱 電腦 / 手機跨裝置同步碼 (Sync Code)
                  </span>
                  <div className="font-mono text-xl font-black text-white tracking-widest mt-0.5">
                    {user.sync_code || user.id}
                  </div>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    在另一台手機或電腦打開網站輸入此碼，即刻同步此帳號
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const code = user.sync_code || user.id;
                      navigator.clipboard.writeText(code);
                      setCopiedSyncCode(true);
                      setTimeout(() => setCopiedSyncCode(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSyncCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSyncCode ? '已複製' : '複製代碼'}</span>
                  </button>

                  {onOpenSyncModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSyncModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>手機掃描 QR Code</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 使用者暱稱 */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>使用者姓名 / 健身暱稱：</span>
                  <span className="text-rose-500">*必填</span>
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✨ 支援同名 ‧ 各自配發唯一同步碼
                </span>
              </label>
              <input
                type="text"
                id="input-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Alex、小智、健身新手小陳"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                💡 系統完全允許不同使用者同名，資料庫會為每位成員產生獨立專屬同步碼，跨裝置請憑同步碼登入。
              </span>
            </div>

            {/* 目標選擇 */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">健身目標 (Fitness Goal)：</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGoal('muscle_gain')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    goal === 'muscle_gain'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/40'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs">增肌 (Muscle Gain)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">TDEE +300 kcal 盈餘，蛋白質 2.0g/kg</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGoal('fat_loss')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    goal === 'fat_loss'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-400/40'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs">減脂 (Fat Loss)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">TDEE -400 kcal 赤字，高蛋白 2.2g/kg</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 身高、體重、體脂率 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">身高 (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="100"
                  max="250"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">體重 (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min="30"
                  max="200"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">體脂率 (%)</label>
                <input
                  type="number"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(Number(e.target.value))}
                  min="3"
                  max="60"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 年齡、生理性別、活動等級 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">年齡 (歲)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min="12"
                  max="100"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">生理性別</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="male">男性 (Male)</option>
                  <option value="female">女性 (Female)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">日常活動量等級</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="sedentary">久坐少動 (很少運動，乘數 1.2)</option>
                <option value="light">輕度活動 (每週運動 1-3 天，乘數 1.375)</option>
                <option value="moderate">中度規律訓練 (每週重訓 3-5 天，乘數 1.55)</option>
                <option value="very_active">重度高強度訓練 (每週訓練 6-7 天，乘數 1.725)</option>
              </select>
            </div>

            {/* 安全 PIN 碼保護 */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>個人同步防護 PIN 碼 (可選)：</span>
                </span>
                <span className="text-slate-400 text-[10px]">設定後跨裝置登入需驗證</span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-6 位數數字 (若不想加密防護可留空)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* 即時換算卡片 */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  客製化代謝與配額預覽
                </span>
                <span className="text-emerald-400 font-mono font-bold">Mifflin-St Jeor 標準</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                <div className="bg-slate-800/90 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">基礎代謝 (BMR)</span>
                  <span className="text-sm font-bold text-white">{calcBmr} kcal</span>
                </div>
                <div className="bg-slate-800/90 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">總消耗 (TDEE)</span>
                  <span className="text-sm font-bold text-amber-300">{calcTdee} kcal</span>
                </div>
                <div className="bg-slate-800/90 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-sans">每日目標攝取</span>
                  <span className="text-sm font-bold text-emerald-400">{targetCal} kcal</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-300 text-center pt-1">
                建議每日蛋白質門檻：<strong className="text-rose-400 font-mono">{targetPro}g</strong> 
                <span className="text-slate-400 ml-1.5">(約每公斤體重 {goal === 'muscle_gain' ? '2.0g' : '2.2g'})</span>
              </div>
            </div>

            {/* 若在編輯模式，顯示明確的「永久刪除帳號」危險專區 */}
            {mode === 'edit' && user && (
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3 mt-4">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>危險操作：永久刪除此帳號 (Delete Account)</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  點擊下方按鈕將從雲端伺服器徹底刪除【{user.name}】的身材檔案、代謝目標以及所有的飲食日記與餐點照片紀錄（Meal_Logs），<strong>刪除後無法還原</strong>。
                </p>

                {confirmDeleteId === user.id ? (
                  <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2">
                    <span className="text-xs font-bold text-rose-800 block">
                      ⚠️ 確定要永久徹底刪除此帳號與所有飲食紀錄嗎？
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleConfirmDelete(user.id)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? '正在刪除所有資料...' : '確認永久刪除'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(user.id)}
                    className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>永久刪除此帳號與所有紀錄</span>
                  </button>
                )}
              </div>
            )}

            {/* 底部按鈕 */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {(!isOnboarding || user) && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {submitting ? '正在存入 Users 資料表...' : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{mode === 'edit' ? '儲存變更並更新配額' : '完成設定，開始飲食紀錄'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
