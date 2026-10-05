import React, { useState, useEffect } from 'react';
import { Database, Table, FileCode, Search, Download, Copy, Check, Server, ShieldCheck } from 'lucide-react';
import { DB_SCHEMA_DDL } from '../data/dbSchemaDdl';

interface DatabaseInspectorProps {
  activeUserId?: string;
  onSelectUser?: (userId: string) => void;
}

export const DatabaseInspector: React.FC<DatabaseInspectorProps> = ({
  activeUserId,
  onSelectUser
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'meal_logs' | 'ddl' | 'nutrition_rag'>('users');
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // RAG Search State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [ragSearching, setRagSearching] = useState(false);

  const fetchDbData = async () => {
    try {
      setLoading(true);
      const url = activeUserId ? `/api/db/inspector?userId=${encodeURIComponent(activeUserId)}` : '/api/db/inspector';
      const res = await fetch(url, {
        headers: activeUserId ? { 'X-User-Id': activeUserId } : {}
      });
      const json = await res.json();
      if (json.success) {
        setDbData(json);
      }
    } catch (err) {
      console.error('Failed to fetch DB inspector data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRag = async (q: string) => {
    try {
      setRagSearching(true);
      const res = await fetch(`/api/nutrition-db/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setRagResults(json.items || []);
      }
    } catch (err) {
      console.error('RAG search error:', err);
    } finally {
      setRagSearching(false);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, [activeUserId]);

  useEffect(() => {
    handleSearchRag('');
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(DB_SCHEMA_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nutrifit_database_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      
      {/* 頂部說明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              雲端資料庫架構與實體表檢視器
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
              GCP Cloud SQL / PostgreSQL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            規格需求明確定義：Users 表（身高、體重、體脂、增肌減脂目標）與 Meal_Logs 表（熱量、營養素、時間、影像路徑）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            匯出 JSON
          </button>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已複製 DDL' : '複製 SQL DDL'}
          </button>
        </div>
      </div>

      {/* 標籤導航 */}
      <div className="flex items-center gap-2 my-5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          Users 表 ({dbData?.tables?.users?.count || 1} 筆)
        </button>

        <button
          onClick={() => setActiveTab('meal_logs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'meal_logs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          Meal_Logs 表 ({dbData?.tables?.meal_logs?.count || 0} 筆)
        </button>

        <button
          onClick={() => setActiveTab('ddl')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ddl'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          SQL DDL 結構規格 (CREATE TABLE)
        </button>

        <button
          onClick={() => setActiveTab('nutrition_rag')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'nutrition_rag'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          食藥署 RAG 知識庫比對庫
        </button>
      </div>

      {/* 內容區塊 1: Users 表 */}
      {activeTab === 'users' && (
        <div>
          {/* Row-Level Security 租戶隔離提示 */}
          <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Row-Level Security (RLS) 租戶資料隔離已啟用：</strong>
                僅允許檢視當前已授權使用者 (<code className="font-mono text-emerald-700 font-bold">{activeUserId || '尚未登入身分'}</code>)。跨使用者名冊已被全面鎖定以防資安外洩。
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              RLS 隔離保護中
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>資料表名稱：<strong className="font-mono text-slate-800">users</strong> (記錄身高、體重、體脂率、增肌/減脂目標、BMR、TDEE)</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">id</th>
                  <th className="py-2.5 px-3">sync_code (跨裝置碼)</th>
                  <th className="py-2.5 px-3">name</th>
                  <th className="py-2.5 px-3">height (cm)</th>
                  <th className="py-2.5 px-3">weight (kg)</th>
                  <th className="py-2.5 px-3">body_fat_rate (%)</th>
                  <th className="py-2.5 px-3">goal</th>
                  <th className="py-2.5 px-3">BMR</th>
                  <th className="py-2.5 px-3">TDEE</th>
                  <th className="py-2.5 px-3">target_calories</th>
                  <th className="py-2.5 px-3">target_protein_g</th>
                  <th className="py-2.5 px-3">target_carbs_g</th>
                  <th className="py-2.5 px-3">target_fat_g</th>
                  <th className="py-2.5 px-3 text-center">當前記錄狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dbData?.tables?.users?.sample_rows?.map((u: any) => {
                  const isActive = activeUserId === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 font-mono ${isActive ? 'bg-emerald-50/50' : ''}`}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{u.id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 bg-emerald-50/50">
                        {u.sync_code || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{u.name}</td>
                      <td className="py-2.5 px-3">{u.height} cm</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{u.weight} kg</td>
                      <td className="py-2.5 px-3">{u.body_fat_rate}%</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold ${
                          u.goal === 'muscle_gain' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.goal === 'muscle_gain' ? '增肌 (muscle_gain)' : '減脂 (fat_loss)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{u.bmr}</td>
                      <td className="py-2.5 px-3 font-bold">{u.tdee}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800">{u.target_calories}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">{u.target_protein_g}g</td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">{u.target_carbs_g}g</td>
                      <td className="py-2.5 px-3 font-bold text-amber-700">{u.target_fat_g}g</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {isActive ? (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ 正在記錄
                          </span>
                        ) : onSelectUser ? (
                          <button
                            onClick={() => onSelectUser(u.id)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                          >
                            切換此人
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 內容區塊 2: Meal_Logs 表 */}
      {activeTab === 'meal_logs' && (
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>資料表名稱：<strong className="font-mono text-slate-800">meal_logs</strong> (記錄每餐辨識結果、熱量、營養素、時間、影像路徑)</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">id</th>
                  <th className="py-2.5 px-3">user_id</th>
                  <th className="py-2.5 px-3">meal_type</th>
                  <th className="py-2.5 px-3">meal_name</th>
                  <th className="py-2.5 px-3">calories</th>
                  <th className="py-2.5 px-3">protein / carbs / fat</th>
                  <th className="py-2.5 px-3">foods (JSON)</th>
                  <th className="py-2.5 px-3">timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dbData?.tables?.meal_logs?.sample_rows?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 px-3 text-slate-500 font-semibold">{m.id.substring(0, 14)}...</td>
                    <td className="py-2.5 px-3 text-slate-500">{m.user_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded font-sans text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                        {m.meal_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{m.meal_name}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-800">{m.total_calories} kcal</td>
                    <td className="py-2.5 px-3">
                      P:{m.total_protein}g | C:{m.total_carbs}g | F:{m.total_fat}g
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate font-sans text-slate-600">
                      {m.foods?.map((f: any) => `${f.name}(${f.estimated_weight_g}g)`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(m.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 內容區塊 3: SQL DDL 結構 */}
      {activeTab === 'ddl' && (
        <div>
          <div className="mb-2 text-xs text-slate-500 flex items-center justify-between">
            <span>標準 SQL Schema 定義 (可用於 GCP Cloud SQL、PostgreSQL、Supabase)：</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
            <pre>{DB_SCHEMA_DDL}</pre>
          </div>
        </div>
      )}

      {/* 內容區塊 4: 食藥署 RAG 資料庫比對搜尋 */}
      {activeTab === 'nutrition_rag' && (
        <div>
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => {
                    setRagQuery(e.target.value);
                    handleSearchRag(e.target.value);
                  }}
                  placeholder="輸入食物名稱搜尋食藥署官方標準成分 (如：雞胸肉、鮭魚、紫米、燕麥、花椰菜)..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              此 RAG 向量與關鍵字庫做為 LLM 影像辨識之實證基準，確保換算熱量符合衛福部公告標準
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {ragResults.map((item) => (
              <div key={item.code} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {item.code}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {item.category}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1.5">{item.name}</h4>
                <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] text-center font-mono">
                  <div className="bg-amber-50 p-1 rounded text-amber-900">
                    <span className="text-[9px] text-amber-600 block">熱量</span>
                    <strong>{item.calories_per_100g}</strong>
                  </div>
                  <div className="bg-rose-50 p-1 rounded text-rose-900">
                    <span className="text-[9px] text-rose-600 block">蛋白質</span>
                    <strong>{item.protein_per_100g}g</strong>
                  </div>
                  <div className="bg-blue-50 p-1 rounded text-blue-900">
                    <span className="text-[9px] text-blue-600 block">碳水</span>
                    <strong>{item.carbs_per_100g}g</strong>
                  </div>
                  <div className="bg-emerald-50 p-1 rounded text-emerald-900">
                    <span className="text-[9px] text-emerald-600 block">脂肪</span>
                    <strong>{item.fat_per_100g}g</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                  <span>常用份量：{item.portion_unit}</span>
                  <span>約 {item.common_portion_g}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
