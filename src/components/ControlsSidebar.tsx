import React, { useState } from 'react';
import {
  SimSettings,
  WeatherPreset,
  Hemisphere,
  DisplayMode,
  PressureRegionType,
  DrawingTarget
} from '../types';
import { WEATHER_PRESETS } from '../data/presets';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Plus,
  Trash2,
  Eye,
  Layers,
  Wind,
  Globe,
  Thermometer,
  Sun,
  Snowflake,
  CloudRain,
  Sparkles,
  HelpCircle,
  Check,
  MapPin,
  Waves
} from 'lucide-react';

interface ControlsSidebarProps {
  settings: SimSettings;
  onUpdateSettings: (newSettings: Partial<SimSettings>) => void;
  selectedPresetId: string;
  onSelectPreset: (preset: WeatherPreset) => void;
  drawingTarget: DrawingTarget;
  setDrawingTarget: (target: DrawingTarget) => void;
  isDrawing: boolean;
  onStartDrawing: (type: PressureRegionType, val: number, target: DrawingTarget) => void;
  onFinishPolygonDrawing: () => void;
  drawingType: PressureRegionType;
  drawingVal: number;
  setDrawingVal: (val: number) => void;
  setDrawingType: (type: PressureRegionType) => void;
  drawingPointCount: number;
  isDeleteMode: boolean;
  onToggleDeleteMode: () => void;
  onResetAll: () => void;
  onOpenKnowledgeModal: () => void;
}

export const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  settings,
  onUpdateSettings,
  selectedPresetId,
  onSelectPreset,
  drawingTarget,
  setDrawingTarget,
  isDrawing,
  onStartDrawing,
  onFinishPolygonDrawing,
  drawingType,
  drawingVal,
  setDrawingVal,
  setDrawingType,
  drawingPointCount,
  isDeleteMode,
  onToggleDeleteMode,
  onResetAll,
  onOpenKnowledgeModal
}) => {
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wind': return <Wind className="w-4 h-4 text-sky-400" />;
      case 'Snowflake': return <Snowflake className="w-4 h-4 text-blue-300" />;
      case 'CloudRain': return <CloudRain className="w-4 h-4 text-indigo-400" />;
      case 'Sun': return <Sun className="w-4 h-4 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default: return <Compass className="w-4 h-4 text-purple-400" />;
    }
  };

  const handleLatChange = (lat: number) => {
    const clampedLat = Math.max(-90, Math.min(90, lat));
    onUpdateSettings({
      centerLatitude: clampedLat,
      hemisphere: clampedLat >= 0 ? 'Northern' : 'Southern'
    });
  };

  const handleLonChange = (lon: number) => {
    const clampedLon = Math.max(-180, Math.min(180, lon));
    onUpdateSettings({ centerLongitude: clampedLon });
  };

  // Quick Latitude / Longitude location presets
  const LOCATION_PRESETS = [
    { name: '西太平洋暖池', lat: 20.5, lon: 135.0, desc: '颱風搖籃 20.5°N 135°E' },
    { name: '臺灣海峽與澎湖', lat: 23.5, lon: 121.0, desc: '北回歸線 23.5°N 121°E' },
    { name: '赤道無風帶', lat: 0.0, lon: 140.0, desc: '無科氏偏轉 0.0°N 140°E' },
    { name: '東亞蒙古寒潮區', lat: 45.0, lon: 125.0, desc: '高緯大陸冷高壓 45.0°N' },
    { name: '南半球澳洲雪梨', lat: -32.5, lon: 151.0, desc: '左偏科氏力 -32.5°S' }
  ];

  return (
    <aside className="w-full md:w-88 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl text-slate-100 overflow-hidden">
      {/* App Sidebar Title Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-lg">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
              海神氣候模擬器
              <span className="text-[10px] bg-sky-950 border border-sky-600 text-sky-300 font-mono px-1.5 py-0.2 rounded">
                Poseidon
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Air Pressure & SST Climate Simulator</p>
          </div>
        </div>
        <button
          onClick={onOpenKnowledgeModal}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition border border-slate-700 flex items-center gap-1 text-xs font-semibold"
          title="閱讀大氣與海水氣候原理"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">原理</span>
        </button>
      </div>

      {/* Main Scrollable Controls */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">

        {/* Playback & Quick Controls */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
          <button
            onClick={() => onUpdateSettings({ isPaused: !settings.isPaused })}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              settings.isPaused
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {settings.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            {settings.isPaused ? '繼續模擬' : '暫停'}
          </button>

          <button
            onClick={onResetAll}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="重置為初始狀態"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 text-[11px] font-mono">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onUpdateSettings({ timeSpeed: s })}
                className={`px-2 py-0.5 rounded transition ${
                  settings.timeSpeed === s ? 'bg-sky-600 font-bold text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Weather Presets Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold tracking-wide uppercase">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Layers className="w-3.5 h-3.5" /> 經典海氣氣候情境預設
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {WEATHER_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`p-2 rounded-xl text-left border transition flex items-start gap-2 ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-500 text-sky-100 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="mt-0.5">{getPresetIcon(preset.iconName)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className="truncate">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Center Latitude & Longitude Control */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-purple-400">
              <Globe className="w-4 h-4" /> 地圖中心經緯度與半球
            </span>
            <span className="text-[11px] font-mono text-purple-300">
              {settings.centerLatitude >= 0 ? `${settings.centerLatitude.toFixed(1)}°N` : `${Math.abs(settings.centerLatitude).toFixed(1)}°S`},{' '}
              {settings.centerLongitude >= 0 ? `${settings.centerLongitude.toFixed(1)}°E` : `${Math.abs(settings.centerLongitude).toFixed(1)}°W`}
            </span>
          </div>

          <div className="space-y-2">
            {/* Latitude Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">緯度 Latitude (-90° ~ +90°):</span>
                <span className="font-mono text-sky-300 font-bold">{settings.centerLatitude}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="0.5"
                value={settings.centerLatitude}
                onChange={(e) => handleLatChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            {/* Longitude Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">經度 Longitude (-180° ~ +180°):</span>
                <span className="font-mono text-sky-300 font-bold">{settings.centerLongitude}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={settings.centerLongitude}
                onChange={(e) => handleLonChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            {/* Quick Location Presets Chips */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 block mb-1">快速導航預設經緯度:</span>
              <div className="flex flex-wrap gap-1">
                {LOCATION_PRESETS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      handleLatChange(loc.lat);
                      handleLonChange(loc.lon);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-[10px] text-slate-300 transition"
                  >
                    📍 {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Environmental Settings (Base Pressure & Sea Temp) */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sliders className="w-4 h-4" /> 整體氣壓與海水溫度設定
            </span>
          </div>

          {/* Base Pressure Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" /> 整體環境氣壓:
              </span>
              <span className="font-mono font-bold text-sky-300">{settings.basePressure} hPa</span>
            </div>
            <input
              type="range"
              min="970"
              max="1040"
              value={settings.basePressure}
              onChange={(e) => onUpdateSettings({ basePressure: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Base Sea Surface Temp (SST) Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" /> 海水整體溫度 (SST):
              </span>
              <span className={`font-mono font-bold ${settings.baseSST >= 26.5 ? 'text-rose-400' : 'text-amber-300'}`}>
                {settings.baseSST.toFixed(1)} °C
                {settings.baseSST >= 26.5 && <span className="text-[10px] text-rose-400 ml-1">🌀 (具颱風能量)</span>}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="0.5"
              value={settings.baseSST}
              onChange={(e) => onUpdateSettings({ baseSST: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Friction Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">海面風場摩擦力:</span>
              <span className="font-mono text-slate-300">{(settings.surfaceFriction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.surfaceFriction}
              onChange={(e) => onUpdateSettings({ surfaceFriction: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>

        {/* Region Editor / Shape & Polygon Drawing Tool */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Plus className="w-4 h-4" /> 多邊形/圓形繪製工具
            </span>
            {isDrawing && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 animate-pulse">
                繪製中...
              </span>
            )}
          </div>

          {/* Drawing Target Select: Pressure vs Sea Temperature */}
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setDrawingTarget('pressure');
                setDrawingVal(980);
              }}
              className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                drawingTarget === 'pressure' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5" /> 氣壓多邊形
            </button>
            <button
              onClick={() => {
                setDrawingTarget('temperature');
                setDrawingVal(30);
              }}
              className={`py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                drawingTarget === 'temperature' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" /> 溫度多邊形
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Value Input */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-slate-400">
                {drawingTarget === 'pressure' ? '氣壓設定 (hPa):' : '海水溫度 (SST °C):'}
              </label>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min={drawingTarget === 'pressure' ? 900 : 5}
                  max={drawingTarget === 'pressure' ? 1060 : 40}
                  value={drawingVal}
                  onChange={(e) => setDrawingVal(Number(e.target.value))}
                  className="w-16 bg-transparent text-right font-mono font-bold text-xs text-sky-300 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  {drawingTarget === 'pressure' ? 'hPa' : '°C'}
                </span>
              </div>
            </div>

            {/* Shape type select */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDrawingType('radial')}
                className={`py-1 px-2 rounded-lg text-center transition ${
                  drawingType === 'radial' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                圓形區域
              </button>
              <button
                onClick={() => setDrawingType('polygon')}
                className={`py-1 px-2 rounded-lg text-center transition ${
                  drawingType === 'polygon' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                多邊形
              </button>
            </div>

            {/* Action Buttons */}
            {!isDrawing ? (
              <button
                onClick={() => onStartDrawing(drawingType, drawingVal, drawingTarget)}
                className={`w-full py-2 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 text-white ${
                  drawingTarget === 'pressure' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <Plus className="w-4 h-4" /> 開始繪製 {drawingTarget === 'pressure' ? '氣壓區' : '海水溫度區'}
              </button>
            ) : (
              <div className="space-y-1.5">
                {drawingType === 'polygon' && (
                  <button
                    onClick={onFinishPolygonDrawing}
                    disabled={drawingPointCount < 3}
                    className={`w-full py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      drawingPointCount >= 3
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    完成多邊形頂點 ({drawingPointCount} 點)
                  </button>
                )}
                <button
                  onClick={() => onStartDrawing(drawingType, drawingVal, drawingTarget)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  取消繪製
                </button>
              </div>
            )}

            {/* Delete button toggle */}
            <button
              onClick={onToggleDeleteMode}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                isDeleteMode
                  ? 'bg-red-950 border-red-600 text-red-200 shadow-md ring-1 ring-red-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>{isDeleteMode ? '結束刪除模式' : '點擊標記中心進行刪除'}</span>
            </button>
          </div>
        </div>

        {/* Layer Display & Toggles */}
        <div className="space-y-2 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold tracking-wide uppercase flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-400" /> 圖層與風場流向顯示
          </div>

          {/* Wind Display Mode */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            {[
              { id: 'particles', label: '風流粒子' },
              { id: 'vectors', label: '流向箭頭' },
              { id: 'both', label: '兩者皆示' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateSettings({ displayMode: m.id as DisplayMode })}
                className={`py-1.5 rounded-lg text-center transition font-medium ${
                  settings.displayMode === m.id ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Toggles Checklist */}
          <div className="space-y-1.5 pt-1">
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span>等壓線標示 (Isobars)</span>
              <select
                value={settings.showIsobars}
                onChange={(e) => onUpdateSettings({ showIsobars: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 rounded text-xs text-sky-300 px-1.5 py-0.5 focus:outline-none font-mono"
              >
                <option value={0}>隱藏</option>
                <option value={2}>每 2 hPa</option>
                <option value={4}>每 4 hPa</option>
                <option value={8}>每 8 hPa</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span>海水溫度熱力圖 (SST Heatmap)</span>
              <input
                type="checkbox"
                checked={settings.showSSTHeatmap}
                onChange={(e) => onUpdateSettings({ showSSTHeatmap: e.target.checked, showHeatmap: e.target.checked ? false : settings.showHeatmap })}
                className="w-4 h-4 rounded border-slate-700 text-rose-500 focus:ring-0 accent-rose-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span>氣壓熱力色塊 (Pressure Heatmap)</span>
              <input
                type="checkbox"
                checked={settings.showHeatmap}
                onChange={(e) => onUpdateSettings({ showHeatmap: e.target.checked, showSSTHeatmap: e.target.checked ? false : settings.showSSTHeatmap })}
                className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0 accent-sky-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>🌀</span>
                <span>颱風與熱帶氣旋特效</span>
              </span>
              <input
                type="checkbox"
                checked={settings.showTyphoons !== false}
                onChange={(e) => onUpdateSettings({ showTyphoons: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-rose-500 focus:ring-0 accent-rose-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>鋒面系統特效 (冷/暖/滯留/錮囚)</span>
              </span>
              <input
                type="checkbox"
                checked={settings.showFronts !== false}
                onChange={(e) => onUpdateSettings({ showFronts: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-blue-500 focus:ring-0 accent-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span>1x1 地圖正方形經緯網格</span>
              <input
                type="checkbox"
                checked={settings.showLatLonGrid}
                onChange={(e) => onUpdateSettings({ showLatLonGrid: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-0 accent-purple-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span>探測資訊卡 (Probe Card)</span>
              <input
                type="checkbox"
                checked={settings.showProbePanel !== false}
                onChange={(e) => onUpdateSettings({ showProbePanel: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0 accent-sky-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                氣壓動態演化 (海溫增強/消散)
              </span>
              <input
                type="checkbox"
                checked={settings.autoEvolve !== false}
                onChange={(e) => onUpdateSettings({ autoEvolve: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

      </div>
    </aside>
  );
};

