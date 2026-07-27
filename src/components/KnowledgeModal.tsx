import React, { useState } from 'react';
import { X, BookOpen, Compass, Wind, Sun, CloudRain, ShieldCheck, Thermometer, Globe } from 'lucide-react';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pressure' | 'sst' | 'coriolis' | 'system' | 'weather'>('pressure');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-900/50 text-sky-400 border border-sky-700/50">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">海神遊戲：海洋氣象物理原理教室</h2>
              <p className="text-xs text-slate-400">Sea God Game: Physical Principles of Weather, SST & Atmosphere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-4 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'pressure', label: '1. 氣壓與多邊形工具', icon: Wind },
            { id: 'sst', label: '2. 海溫 SST 與颱風能量', icon: Thermometer },
            { id: 'coriolis', label: '3. 緯度與科氏力偏轉', icon: Compass },
            { id: 'system', label: '4. 高低壓與鋒面構造', icon: ShieldCheck },
            { id: 'weather', label: '5. 經典氣候預設', icon: CloudRain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-sky-400 text-sky-400 bg-sky-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-300">
          {activeTab === 'pressure' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-sky-300">大氣氣壓與多邊形區域工具 (Pressure Systems & Polygons)</h3>
              <p>
                <strong>大氣壓力 (hPa, 百帕)</strong> 是空氣所產生的重力壓強。氣壓梯度力帶動風從高壓區 (High) 吹向低壓區 (Low)。
              </p>
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
                <h4 className="font-semibold text-slate-200">海神繪圖功能：</h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
                  <li><strong>圓形氣壓區：</strong> 一鍵在點選位置建立高壓或低壓中心。</li>
                  <li><strong>多邊形氣壓工具：</strong> 連續點選 3 個以上的點封閉區域，可制定任意複雜形狀的延伸氣壓脊（High Ridge）或低壓槽（Low Trough）。</li>
                  <li><strong>風場流向流線：</strong> 畫面上的流動風向箭頭即時展示該氣壓配置下的實時風場！</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'sst' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-rose-300">海水整體溫度 (SST) 與熱帶氣旋/颱風生成條件</h3>
              <p>
                海洋是颱風與熱帶氣旋的引擎！溫熱的海水蒸發大量水氣，為大氣對流提供巨大的潛熱（Latent Heat）。
              </p>
              <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-800/50 space-y-2 text-xs">
                <h4 className="font-bold text-rose-200 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-400" /> 颱風與熱帶氣旋生成三大要件：
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                  <li><strong>海水表面溫度 (SST) ≥ 26.5°C：</strong> 溫熱海水釋放潛熱能源，推動中心極強上升氣流。</li>
                  <li><strong>極低氣壓中心 (≤ 998 hPa)：</strong> 提供強烈的氣壓梯度力吸引四周水氣輻合。</li>
                  <li><strong>具備科氏力條件 (|緯度| ≥ 3.5°)：</strong> 赤道無科氏力無法形成旋轉，需要一定緯度才能產生氣旋漩渦。</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'coriolis' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-sky-300">經緯度與科氏力偏轉 (Coriolis Effect & Latitudes)</h3>
              <p>
                地圖中心設有真實經緯度（Latitude/Longitude）。隨緯度上升，科氏參數 <code className="bg-slate-800 px-1 py-0.5 rounded">f = 2Ω sin(φ)</code> 增大，氣旋偏轉越顯著！
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 space-y-1.5">
                  <span className="text-xs font-bold text-blue-300 px-2 py-0.5 rounded bg-blue-900/60">北半球 (Northern Hemisphere)</span>
                  <p className="text-xs text-slate-300">風向右偏轉。低氣壓呈<strong>逆時針輻合</strong>吹入；高氣壓呈<strong>順時針輻散</strong>吹出。</p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 space-y-1.5">
                  <span className="text-xs font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-900/60">南半球 (Southern Hemisphere)</span>
                  <p className="text-xs text-slate-300">風向左偏轉。低氣壓呈<strong>順時針輻合</strong>吹入；高氣壓呈<strong>逆時針輻散</strong>吹出。</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-sky-300">高低壓系統與鋒面 (Frontal Systems) 特有圖示</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3.5 space-y-2">
                  <h4 className="font-bold text-red-300">颱風 / 熱帶氣旋 (Typhoon / Tropical Cyclone)</h4>
                  <p className="text-slate-300">
                    當暖海水 (SST ≥ 26.5°C) 加上低壓輻合時，地圖上將動態生成專屬颱風動態氣旋圖示（旋轉雙臂及颱風眼），代表強烈的對流爆發！
                  </p>
                </div>

                <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-3.5 space-y-2">
                  <h4 className="font-bold text-cyan-300">冷鋒 / 滯留鋒 (Cold Front / Stationary Front)</h4>
                  <p className="text-slate-300">
                    當暖濕氣團與強烈冷高壓對峙產生顯著氣壓槽與溫差時，模擬器會在交界處繪製經典三角冷鋒鋸齒線或半圓滯留鋒圖示！
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weather' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-sky-300">經典氣候預設情境 (Weather Presets)</h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-1">
                  <div className="font-bold text-rose-300">1. 西太平洋強烈颱風 (West Pacific Typhoon)</div>
                  <p className="text-slate-300">中心經緯度 20.5°N 135.0°E，高溫 29.5°C 海水，中心氣壓 935 hPa，生成強大暴風圈。</p>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-1">
                  <div className="font-bold text-cyan-300">2. 東亞梅雨季滯留鋒 (East Asia Mei-Yu Front)</div>
                  <p className="text-slate-300">北方冷高壓與南海暖濕高壓對峙於台灣附近 (24.0°N 121.5°E)，形成東西向強烈滯留鋒面帶。</p>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-1">
                  <div className="font-bold text-amber-300">3. 太平洋高壓與赤道無風帶 (Pacific High & Doldrums)</div>
                  <p className="text-slate-300">赤道 (0.0°N) 無科氏力風力微弱，上方伴隨太平洋副熱帶高壓罩頂，天氣沉悶乾燥。</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>海神遊戲：自由指定氣壓多邊形、海溫與經緯度，觀察現實風場演變！</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 font-bold text-white rounded-lg transition"
          >
            返回海神模擬器
          </button>
        </div>
      </div>
    </div>
  );
};

