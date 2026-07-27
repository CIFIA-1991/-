import React from 'react';
import { ProbeData } from '../types';
import { Wind, Gauge, CloudRain, Sun, ArrowUpRight, Compass, Thermometer, Globe, X } from 'lucide-react';

interface ProbePanelProps {
  data: ProbeData | null;
  basePressure: number;
  onClose?: () => void;
}

export const ProbePanel: React.FC<ProbePanelProps> = ({ data, basePressure, onClose }) => {
  if (!data) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between gap-2 shadow-lg min-w-[280px]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
          <span>將游標移至地圖上即可探測該點海氣氣候資訊</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="關閉資訊卡"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  const pDiff = data.pressure - basePressure;
  const isHigh = pDiff > 1;
  const isLow = pDiff < -1;

  // Beaufort wind force scale approximation
  const getBeaufort = (speed: number) => {
    if (speed < 0.3) return '0 級 (無風)';
    if (speed < 1.6) return '1 級 (軟風)';
    if (speed < 3.4) return '2 級 (輕風)';
    if (speed < 5.5) return '3 級 (微風)';
    if (speed < 8.0) return '4 級 (和風)';
    if (speed < 10.8) return '5 級 (清風)';
    if (speed < 13.9) return '6 級 (強風)';
    if (speed < 17.2) return '7 級 (疾風)';
    if (speed < 20.8) return '8 級 (大風)';
    if (speed < 24.5) return '9 級 (烈風)';
    if (speed < 28.5) return '10 級 (狂風)';
    if (speed < 32.6) return '11 級 (暴風)';
    return '12+ 級 (颶風/颱風)';
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-2xl text-slate-100 min-w-[300px] max-w-[360px] space-y-3">
      {/* Header with Latitude / Longitude & Close button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-400 tracking-wider">海神探測儀</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
            <Globe className="w-3 h-3 text-purple-400" />
            <span>{data.lat >= 0 ? `${data.lat}°N` : `${Math.abs(data.lat)}°S`}, {data.lon >= 0 ? `${data.lon}°E` : `${Math.abs(data.lon)}°W`}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
              title="關閉資訊卡"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Pressure Card */}
        <div className={`p-2 rounded-xl border ${
          isLow ? 'bg-red-950/40 border-red-800/50 text-red-200' :
          isHigh ? 'bg-blue-950/40 border-blue-800/50 text-blue-200' :
          'bg-slate-800/50 border-slate-700/50 text-slate-200'
        }`}>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3" /> 氣壓
          </div>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-lg font-extrabold font-mono">{data.pressure}</span>
            <span className="text-[10px] text-slate-400">hPa</span>
          </div>
        </div>

        {/* SST Temperature Card */}
        <div className={`p-2 rounded-xl border ${
          data.sst >= 26.5 ? 'bg-rose-950/50 border-rose-800/60 text-rose-200' : 'bg-slate-800/50 border-slate-700/50 text-slate-200'
        }`}>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-rose-400" /> 海水 SST
          </div>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className={`text-lg font-extrabold font-mono ${data.sst >= 26.5 ? 'text-rose-400' : 'text-amber-300'}`}>
              {data.sst}
            </span>
            <span className="text-[10px] text-slate-400">°C</span>
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-sky-400" /> 風速
          </div>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-lg font-extrabold font-mono text-sky-300">{data.windSpeed}</span>
            <span className="text-[10px] text-slate-400">m/s</span>
          </div>
        </div>
      </div>

      {/* Wind Direction & Flow */}
      <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full bg-sky-900/60 border border-sky-500/50 flex items-center justify-center text-sky-300 transition-transform duration-300"
            style={{ transform: `rotate(${data.windDirectionAngle}deg)` }}
          >
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">{data.windDirectionText}</div>
            <div className="text-[10px] text-slate-400 font-mono">{getBeaufort(data.windSpeed)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold text-slate-300">
            {data.verticalMotion === 'rising' ? (
              <span className="text-red-400 flex items-center justify-end gap-1">
                <CloudRain className="w-3.5 h-3.5" /> 上升氣流 (強對流)
              </span>
            ) : data.verticalMotion === 'sinking' ? (
              <span className="text-amber-300 flex items-center justify-end gap-1">
                <Sun className="w-3.5 h-3.5" /> 下沉氣流 (乾燥晴朗)
              </span>
            ) : (
              <span className="text-slate-400">水準平穩風</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            雲量: <span className="text-slate-200 font-mono">{data.cloudCover}%</span>
            {data.rainIntensity > 0 && <span className="text-blue-300 ml-1">({data.rainIntensity} mm/h)</span>}
          </div>
        </div>
      </div>

      {/* Local Phenomenon Status */}
      {data.phenomenon && (
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <span className="truncate font-medium">{data.phenomenon}</span>
        </div>
      )}
    </div>
  );
};

