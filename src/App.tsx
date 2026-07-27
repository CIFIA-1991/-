/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Compass } from 'lucide-react';
import {
  SimSettings,
  PressureSystem,
  TempSystem,
  Point,
  ProbeData,
  WeatherPreset,
  PressureRegionType,
  DrawingTarget
} from './types';
import { WEATHER_PRESETS } from './data/presets';
import { HeaderBar } from './components/HeaderBar';
import { ControlsSidebar } from './components/ControlsSidebar';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ProbePanel } from './components/ProbePanel';
import { KnowledgeModal } from './components/KnowledgeModal';

export default function App() {
  // 1. Simulation Settings State
  const [settings, setSettings] = useState<SimSettings>({
    basePressure: 1012,
    baseSST: 28.0,
    centerLatitude: 20.5,
    centerLongitude: 135.0,
    hemisphere: 'Northern',
    coriolisStrength: 1.0,
    surfaceFriction: 0.35,
    particleCount: 800,
    particleSpeed: 1.0,
    showIsobars: 4,
    showHeatmap: false,
    showSSTHeatmap: true,
    showPhenomenaIcons: true,
    showTyphoons: true,
    showFronts: true,
    showLatLonGrid: true,
    showVectorGrid: false,
    showCloudsAndRain: true,
    displayMode: 'particles',
    isPaused: false,
    timeSpeed: 1.0,
    autoEvolve: true,
    showProbePanel: true
  });

  // 2. Active Pressure Systems & Temperature Systems State
  const initialPreset = WEATHER_PRESETS[0]; // Typhoon scenario
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset.id);
  const [systems, setSystems] = useState<PressureSystem[]>(
    initialPreset.systems.map((s, idx) => ({ ...s, id: `sys_init_${idx}` }))
  );
  const [tempSystems, setTempSystems] = useState<TempSystem[]>(
    (initialPreset.tempSystems || []).map((ts, idx) => ({ ...ts, id: `tsys_init_${idx}` }))
  );

  // 3. Drawing Mode State (Pressure vs Sea Surface Temperature)
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawingTarget, setDrawingTarget] = useState<DrawingTarget>('pressure');
  const [drawingType, setDrawingType] = useState<PressureRegionType>('radial');
  const [drawingVal, setDrawingVal] = useState<number>(980);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);

  // 4. Delete Mode State
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  // 5. Probe Data State
  const [probeData, setProbeData] = useState<ProbeData | null>(null);

  // 6. Educational Modal State
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState<boolean>(false);

  // 7. Mobile Sidebar Drawer State
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Update Settings Handler
  const handleUpdateSettings = useCallback((newSettings: Partial<SimSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Preset Selection Handler
  const handleSelectPreset = useCallback((preset: WeatherPreset) => {
    setSelectedPresetId(preset.id);
    setSettings((prev) => ({
      ...prev,
      basePressure: preset.basePressure,
      baseSST: preset.baseSST ?? 26.5,
      centerLatitude: preset.centerLatitude ?? 20.0,
      centerLongitude: preset.centerLongitude ?? 135.0,
      hemisphere: (preset.centerLatitude ?? 20.0) >= 0 ? 'Northern' : 'Southern'
    }));
    setSystems(
      preset.systems.map((s, idx) => ({
        ...s,
        id: `sys_preset_${Date.now()}_${idx}`
      }))
    );
    setTempSystems(
      (preset.tempSystems || []).map((ts, idx) => ({
        ...ts,
        id: `tsys_preset_${Date.now()}_${idx}`
      }))
    );
    setIsDrawing(false);
    setIsDeleteMode(false);
    setDrawingPoints([]);
  }, []);

  // Drawing Handlers
  const handleStartDrawing = useCallback((type: PressureRegionType, val: number, target: DrawingTarget = 'pressure') => {
    setIsDrawing(true);
    setIsDeleteMode(false);
    setDrawingTarget(target);
    setDrawingType(type);
    setDrawingVal(val);
    setDrawingPoints([]);
  }, []);

  const handleAddPoint = useCallback((pt: Point) => {
    setDrawingPoints((prev) => [...prev, pt]);
  }, []);

  const handleFinishPolygonDrawing = useCallback(() => {
    if (drawingPoints.length < 3) return;

    // Calculate center of mass for polygon
    const cx = drawingPoints.reduce((sum, p) => sum + p.x, 0) / drawingPoints.length;
    const cy = drawingPoints.reduce((sum, p) => sum + p.y, 0) / drawingPoints.length;

    if (drawingTarget === 'temperature') {
      const newTSys: TempSystem = {
        id: 'tsys_poly_' + Date.now(),
        type: 'polygon',
        val: drawingVal,
        points: drawingPoints,
        cx,
        cy,
        radius: 0.28,
        label: `多邊形海水 ${drawingVal}°C`
      };
      setTempSystems((prev) => [...prev, newTSys]);
    } else {
      const newSys: PressureSystem = {
        id: 'sys_poly_' + Date.now(),
        type: 'polygon',
        val: drawingVal,
        points: drawingPoints,
        cx,
        cy,
        radius: 0.28,
        label: drawingVal < settings.basePressure ? '多邊形低壓' : '多邊形高壓'
      };
      setSystems((prev) => [...prev, newSys]);
    }

    setIsDrawing(false);
    setDrawingPoints([]);
  }, [drawingPoints, drawingTarget, drawingVal, settings.basePressure]);

  const handleToggleDeleteMode = useCallback(() => {
    setIsDeleteMode((prev) => !prev);
    setIsDrawing(false);
    setDrawingPoints([]);
  }, []);

  const handleResetAll = useCallback(() => {
    setSelectedPresetId('blank');
    setSystems([]);
    setTempSystems([]);
    setSettings((prev) => ({
      ...prev,
      basePressure: 1013,
      baseSST: 26.0,
      centerLatitude: 23.5,
      centerLongitude: 121.5
    }));
    setIsDrawing(false);
    setIsDeleteMode(false);
    setDrawingPoints([]);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 font-sans overflow-hidden select-none">
      {/* Header Bar */}
      <HeaderBar
        onOpenKnowledgeModal={() => setIsKnowledgeModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpenMobile((prev) => !prev)}
      />

      {/* Main Container */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Controls Sidebar (Desktop + Mobile drawer) */}
        <div
          className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 md:static md:translate-x-0 ${
            isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ControlsSidebar
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            drawingTarget={drawingTarget}
            setDrawingTarget={setDrawingTarget}
            isDrawing={isDrawing}
            onStartDrawing={handleStartDrawing}
            onFinishPolygonDrawing={handleFinishPolygonDrawing}
            drawingType={drawingType}
            drawingVal={drawingVal}
            setDrawingVal={setDrawingVal}
            setDrawingType={setDrawingType}
            drawingPointCount={drawingPoints.length}
            isDeleteMode={isDeleteMode}
            onToggleDeleteMode={handleToggleDeleteMode}
            onResetAll={handleResetAll}
            onOpenKnowledgeModal={() => setIsKnowledgeModalOpen(true)}
          />
        </div>

        {/* Backdrop for mobile drawer */}
        {isSidebarOpenMobile && (
          <div
            onClick={() => setIsSidebarOpenMobile(false)}
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
          />
        )}

        {/* Main Canvas Viewport Area */}
        <main className="flex-1 relative h-full bg-slate-950 overflow-hidden">
          <SimulationCanvas
            settings={settings}
            systems={systems}
            onSystemsChange={setSystems}
            tempSystems={tempSystems}
            onTempSystemsChange={setTempSystems}
            drawingTarget={drawingTarget}
            isDrawing={isDrawing}
            drawingType={drawingType}
            drawingVal={drawingVal}
            drawingPoints={drawingPoints}
            onAddPoint={handleAddPoint}
            isDeleteMode={isDeleteMode}
            onProbeUpdate={setProbeData}
          />

          {/* Floating Real-time Weather Probe Panel or Re-open Button */}
          {settings.showProbePanel !== false ? (
            <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
              <ProbePanel
                data={probeData}
                basePressure={settings.basePressure}
                onClose={() => handleUpdateSettings({ showProbePanel: false })}
              />
            </div>
          ) : (
            <button
              onClick={() => handleUpdateSettings({ showProbePanel: true })}
              className="absolute bottom-6 right-6 z-20 pointer-events-auto px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2.5 transition hover:border-sky-500 hover:text-white"
              title="開啟海神探測資訊卡"
            >
              <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
              <span>開啟探測資訊卡</span>
            </button>
          )}
        </main>
      </div>

      {/* Atmospheric Physics Educational Modal */}
      <KnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />
    </div>
  );
}

