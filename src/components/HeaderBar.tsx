import React from 'react';
import { Wind, Compass, HelpCircle, Layers, SlidersHorizontal } from 'lucide-react';

interface HeaderBarProps {
  onOpenKnowledgeModal: () => void;
  onToggleSidebar: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenKnowledgeModal, onToggleSidebar }) => {
  return (
    <header className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-slate-200 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
          title="切換選單"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Wind className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-2">
              氣壓與氣候模擬器
              <span className="hidden sm:inline-block text-[10px] bg-sky-950 border border-sky-600 text-sky-300 font-mono px-2 py-0.5 rounded-full">
                Interactive Physics
              </span>
            </span>
            <span className="hidden md:block text-[10px] text-slate-400">
              大氣壓力梯度、地轉偏向力 (科氏力) 與風場氣候視覺化
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenKnowledgeModal}
          className="px-3 py-1.5 rounded-xl bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-600/60 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <HelpCircle className="w-4 h-4 text-sky-300" />
          <span>大氣原理與圖解</span>
        </button>
      </div>
    </header>
  );
};
