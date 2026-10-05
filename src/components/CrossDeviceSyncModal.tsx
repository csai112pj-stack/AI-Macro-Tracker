import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, QrCode, Copy, Check, ShieldCheck, KeyRound, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { UserProfile } from '../types';

interface CrossDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdatePin?: (pin: string) => Promise<void>;
}

export const CrossDeviceSyncModal: React.FC<CrossDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdatePin
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pinInput, setPinInput] = useState(user?.pin || '');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinSavedSuccess, setPinSavedSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const syncCode = user?.sync_code || user?.id || '';
  const syncUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?sync=${encodeURIComponent(syncCode)}`
    : '';

  useEffect(() => {
    if (user?.pin) {
      setPinInput(user.pin);
    }
  }, [user?.pin]);

  // 產生 QR Code 圖片
  useEffect(() => {
    if (isOpen && syncUrl) {
      QRCode.toDataURL(syncUrl, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
    }
  }, [isOpen, syncUrl]);

  if (!isOpen || !user) return null;

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!syncUrl) return;
    navigator.clipboard.writeText(syncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdatePin) return;
    setPinError(null);
    setIsSavingPin(true);
    try {
      await onUpdatePin(pinInput.trim());
      setPinSavedSuccess(true);
      setTimeout(() => setPinSavedSuccess(false), 3000);
    } catch (err: any) {
      setPinError(err.message || '儲存 PIN 碼失敗');
    } finally {
      setIsSavingPin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* 頂部標頭 */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  跨裝置同步與換機登入
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  電腦 ⇄ 手機即時互通
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                只需使用專屬同步碼或掃描 QR Code，無論電腦、新手機皆可登入同一個飲食帳號！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區塊 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* 核心同步碼卡片 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  您的專屬唯一同步碼 (Sync Code)
                </span>
                <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white drop-shadow-sm">
                  {syncCode}
                </div>
                <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                  <span>持有者：<strong>{user.name}</strong></span>
                  <span>•</span>
                  <span>{user.goal === 'muscle_gain' ? '增肌目標' : user.goal === 'fat_loss' ? '減脂目標' : '維持目標'}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>密碼學安全生成 ‧ 雲端防碰撞比對 ‧ 保證 100% 唯一不重複</span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                    💡 <strong>支援不同使用者同名</strong>：即使有其他學員也叫做「{user.name}」，此同步碼是您在雲端的唯一數位身分。跨裝置登入只要出示此代碼，系統即能 100% 精準定位您的飲食數據與熱量進度！
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  <span>{copiedCode ? '已複製同步碼！' : '一鍵複製同步碼'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedLink ? '已複製專屬連結！' : '複製登入網址'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 手機掃描 QR Code 區域 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-40 h-40 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="登入 QR Code" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>產生二維碼中...</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  手機相機掃描，立即無縫登入
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                若您現在正在電腦前使用，請拿出手機打開相機對準左方 QR Code，點擊連結即可自動登入並載入所有飲食紀錄與熱量額度！
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                <span>📱 拍照即記錄</span>
                <span>•</span>
                <span>💻 電腦端大螢幕檢視數據</span>
                <span>•</span>
                <span>☁️ 雲端雙向同步</span>
              </div>
            </div>
          </div>

          {/* 換新手機或電腦操作指南三步驟 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-600" />
              換新手機或換電腦時，如何登入已有紀錄？
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-black text-emerald-700 text-xs mb-1">第 1 步</div>
                <div className="font-bold text-slate-800">在新裝置開啟網站</div>
                <div className="text-[11px] text-slate-500 mt-0.5">在手機或電腦瀏覽器打開 NutriFit AI 網址</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-black text-emerald-700 text-xs mb-1">第 2 步</div>
                <div className="font-bold text-slate-800">點選「登入已有帳號」</div>
                <div className="text-[11px] text-slate-500 mt-0.5">在彈出視窗切換至「跨裝置登入」分頁</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-black text-emerald-700 text-xs mb-1">第 3 步</div>
                <div className="font-bold text-slate-800">輸入同步碼立即同步</div>
                <div className="text-[11px] text-slate-500 mt-0.5">輸入 <span className="font-mono font-bold text-slate-900">{syncCode}</span> 即可完整繼承所有餐點</div>
              </div>
            </div>
          </div>

          {/* 安全保護：自訂 PIN 碼 */}
          {onUpdatePin && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-700" />
                  <span className="font-bold text-xs text-slate-900">帳號安全防護 PIN 碼 (可選)</span>
                </div>
                {user.pin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    已啟用 PIN 碼防護
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">未設定 (公開同步碼即可登入)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                若您擔心其他人在新裝置誤輸入您的同步碼，可設定 4-6 位數安全 PIN 碼，登入時需同時驗證。
              </p>

              <form onSubmit={handleSavePin} className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="輸入 4-6 位數數字 PIN 碼"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                >
                  {isSavingPin ? '儲存中...' : '儲存 PIN 碼'}
                </button>
              </form>

              {pinSavedSuccess && (
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>PIN 碼已更新成功！跨裝置登入時將啟用防護驗證。</span>
                </div>
              )}
              {pinError && (
                <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 底部關閉按鈕 */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            完成並關閉
          </button>
        </div>

      </div>
    </div>
  );
};
