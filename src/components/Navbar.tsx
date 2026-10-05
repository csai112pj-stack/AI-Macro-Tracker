import React from 'react';
import { Camera, BarChart3, Database, MessageSquareText, History, Settings, Flame, Dumbbell, ShieldCheck, Sparkles, Users, UserPlus, QrCode } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'camera' | 'dashboard' | 'history' | 'database' | 'chat';
  setActiveTab: (tab: 'camera' | 'dashboard' | 'history' | 'database' | 'chat') => void;
  user: UserProfile | null;
  onOpenSettings: () => void;
  onOpenUserSwitch: () => void;
  onOpenSyncModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenSettings,
  onOpenUserSwitch,
  onOpenSyncModal
}) => {
  const isBulking = user?.goal === 'muscle_gain';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">NutriFit AI</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  RAG 食藥署庫
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">專業健身營養師 ‧ 拍照即記錄系統</p>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="nav-tab-camera"
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'camera'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Camera className="w-4 h-4" />
              拍照辨識
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              今日進度
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-4 h-4" />
              餐點紀錄 (Meal_Logs)
            </button>

            <button
              id="nav-tab-database"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'database'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Database className="w-4 h-4" />
              資料庫架構 (Users & Meals)
            </button>

            <button
              id="nav-tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              營養師諮詢
            </button>
          </nav>

          {/* User Profile Target Badge & Settings */}
          <div className="flex items-center gap-2">
            {/* Cloud Status */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GCP Cloud Run</span>
            </div>

            {/* User Target Badge & Switcher */}
            {user ? (
              <div className="flex items-center gap-1.5">
                {onOpenSyncModal && (
                  <button
                    id="btn-cross-device-sync"
                    onClick={onOpenSyncModal}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-sm"
                    title="手機/電腦跨裝置同步：掃描 QR Code 或複製同步碼"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">跨裝置同步</span>
                  </button>
                )}

                <button
                  id="btn-user-profile-summary"
                  onClick={onOpenSettings}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-sm"
                  title="點擊修改目前使用者的身高、體重與增肌減脂目標"
                >
                  <div className={`p-1 rounded-lg ${isBulking ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isBulking ? <Dumbbell className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <span>{user.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                        {isBulking ? '增肌' : user.goal === 'fat_loss' ? '減脂' : '維持'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {user.weight}kg | 目標 {user.target_calories} kcal
                    </div>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  id="btn-switch-user"
                  onClick={onOpenUserSwitch}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 transition-colors shadow-sm"
                  title="切換使用者或建立新使用者檔案"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-onboarding-user"
                onClick={onOpenUserSwitch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 animate-pulse"
              >
                <UserPlus className="w-4 h-4" />
                <span>請先設定使用者資訊</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => setActiveTab('camera')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'camera' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            拍照辨識
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            今日進度
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'history' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            紀錄 (Meal_Logs)
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'database' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            資料庫表
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'chat' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            營養師諮詢
          </button>
        </div>

      </div>
    </header>
  );
};
