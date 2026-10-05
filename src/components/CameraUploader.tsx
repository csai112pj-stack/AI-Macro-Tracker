import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, Check, AlertCircle, Utensils, Image as ImageIcon, ShieldCheck, Target, Info, AlertTriangle } from 'lucide-react';
import { MealType, UserProfile } from '../types';

interface CameraUploaderProps {
  onAnalyze: (imageData: string, mimeType: string, mealType: MealType) => void;
  isAnalyzing: boolean;
  user: UserProfile | null;
}

export const CameraUploader: React.FC<CameraUploaderProps> = ({
  onAnalyze,
  isAnalyzing,
  user
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 關閉相機串流清理
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 開啟相機
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('此瀏覽器或環境不支援直接開啟攝像鏡頭，請使用相片上傳。');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || '無法存取相機，請允許鏡頭權限或直接上傳照片。');
      setIsCameraActive(false);
    }
  };

  // 快門拍照
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.88);
      setSelectedImage(dataUri);
      setMimeType('image/jpeg');
      stopCamera();
      if (autoAnalyze) {
        onAnalyze(dataUri, 'image/jpeg', mealType);
      }
    }
  };

  // 圖片壓縮優化 (避免超大原始圖傳輸耗時)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('圖片讀取失敗'));
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 檔案上傳
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUri = await compressImage(file);
      setSelectedImage(compressedDataUri);
      setMimeType('image/jpeg');
      stopCamera();
      if (autoAnalyze) {
        onAnalyze(compressedDataUri, 'image/jpeg', mealType);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;
          setSelectedImage(resultStr);
          setMimeType(file.type || 'image/jpeg');
          stopCamera();
          if (autoAnalyze) {
            onAnalyze(resultStr, file.type || 'image/jpeg', mealType);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 拖曳上傳
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const compressedDataUri = await compressImage(file);
      setSelectedImage(compressedDataUri);
      setMimeType('image/jpeg');
      stopCamera();
      if (autoAnalyze) {
        onAnalyze(compressedDataUri, 'image/jpeg', mealType);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;
          setSelectedImage(resultStr);
          setMimeType(file.type || 'image/jpeg');
          stopCamera();
          if (autoAnalyze) {
            onAnalyze(resultStr, file.type || 'image/jpeg', mealType);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedImage) return;
    onAnalyze(selectedImage, mimeType, mealType);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      
      {/* 頂部說明與餐別選擇 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            拍照即記錄 ‧ AI 食物辨識
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            上傳或即時拍攝餐點照片，由 Gemini 辨識所有食物並串接政府食品營養成分資料庫 (RAG) 換算
          </p>
        </div>

        {/* 餐別選擇 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
            const labels: Record<MealType, string> = {
              breakfast: '早餐',
              lunch: '午餐',
              dinner: '晚餐',
              snack: '加餐'
            };
            return (
              <button
                key={type}
                id={`meal-type-${type}`}
                onClick={() => setMealType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mealType === type
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

      {/* 相機 / 照片預覽主要區域 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左側：相機與圖片預覽舞台 */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group shadow-inner"
          >
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-900/80 backdrop-blur-sm text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/40">
                    請將食物完整置於框內
                  </span>
                </div>
                {/* 拍照快門按鈕 */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
                  <button
                    id="btn-shutter-snap"
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    title="拍攝照片"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-600"></div>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-slate-900/80 text-white text-xs px-3 py-2 rounded-xl backdrop-blur-md border border-slate-700 hover:bg-slate-800"
                  >
                    取消相機
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={selectedImage}
                  alt="餐點預覽"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-900/80 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-md border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    更換照片
                  </button>
                </div>
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                  <div className="bg-slate-950/80 backdrop-blur-md text-slate-300 text-[11px] px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>照片已載入</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isAnalyzing}
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition-transform"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAnalyzing ? "分析計算中..." : "立即辨識數據"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-slate-300">尚未選取餐點照片</p>
                <p className="text-xs text-slate-500 mt-1">請開啟相機拍攝、上傳相片，或從右側點擊示範餐點</p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* 相機與上傳觸發列 */}
          <div className="mt-3 flex items-center gap-2">
            {!isCameraActive ? (
              <button
                id="btn-open-camera"
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                開啟相機拍攝
              </button>
            ) : null}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              id="btn-upload-file"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              從裝置上傳圖片
            </button>
          </div>

          {/* 自動分析開關與操作提示 */}
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium hover:text-slate-900">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>拍照或選取照片後立即自動分析</span>
            </label>
            <span className="text-[11px] text-slate-400">已串接台灣食藥署資料庫</span>
          </div>

          {/* 分析主要按鈕 */}
          <button
            id="btn-start-analysis"
            onClick={handleSubmit}
            disabled={!selectedImage || isAnalyzing}
            className={`mt-4 w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
              !selectedImage || isAnalyzing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-700/25 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI 營養師正在精算重量、熱量與巨量營養素...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>開始 AI 營養師分析 (辨識 + RAG 換算 + 入庫)</span>
              </>
            )}
          </button>
        </div>

        {/* 右側：精準拍攝指引與健身目標計算依據 */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* 拍攝技巧指引卡 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              AI 營養師精準拍照辨識技巧
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-800">45° 至 60° 俯角拍攝：</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">能同時辨識餐盤深度與食物體積，協助估算公克重量。</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-800">主菜蛋白質完整入鏡：</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">確保雞胸、牛排、魚肉或豆腐不被蔬菜掩蓋，以利高精準檢索。</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-800">光線均勻無強烈反光：</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">避免塑膠盒強烈反光或陰影，大幅提升色澤與烹調方式判斷。</p>
                </div>
              </li>
            </ul>
          </div>

          {/* 辨識失敗防範與即時診斷提示 */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-slate-700">
            <div className="font-bold text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>辨識保護機制：無法辨識時即時說明原因</span>
            </div>
            <p className="text-[11px] text-amber-900/80 mt-1 leading-relaxed">
              若照片中為空餐盤、純文字/包裝盒、非食物物品或光線嚴重不足，系統將主動標示未辨識原因與改善步驟，且不扣除當日熱量與營養額度。
            </p>
          </div>

          {/* TFDA 資料庫串接說明 */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-700">
            <div className="font-bold text-emerald-950 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>衛福部食藥署 (TFDA) 知識庫串接</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 mt-1.5 leading-relaxed">
              辨識出餐點後，系統將自動比對台灣在地常用食品營養成分資料庫，精確校驗熱量、蛋白質、碳水化合物、脂肪、膳食纖維與鈉含量。
            </p>
          </div>

          {/* 底部目前使用者目標對齊提示 */}
          {user ? (
            <div className="p-4 rounded-xl bg-slate-900 text-white text-xs">
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Target className="w-4 h-4 text-emerald-400" />
                  【{user.name}】個人目標即時算式
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  user.goal === 'muscle_gain' ? 'bg-amber-400 text-amber-950' : 'bg-rose-400 text-rose-950'
                }`}>
                  {user.goal === 'muscle_gain' ? '增肌 (高蛋白+盈餘)' : '減脂 (高蛋白+赤字)'}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                <div className="bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">當前體重</span>
                  <span className="font-bold text-white">{user.weight} kg</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">每日目標</span>
                  <span className="font-bold text-emerald-400">{user.target_calories} kcal</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">每日蛋白</span>
                  <span className="font-bold text-rose-400">{user.target_protein_g} g</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>尚未指定使用者：請先設定個人資訊</span>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                設定您的身材數據與健身目標後，AI 營養師才能在您拍照時，精確計算熱量盈餘、赤字與每餐蛋白質達標比例。
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
