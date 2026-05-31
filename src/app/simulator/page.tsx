"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BrainCircuit, Play, Square, Activity } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const MAX_PTS = 500; 
const initialEngineState = () => ({
  t: new Array(MAX_PTS).fill(0).map((_, i) => (i - MAX_PTS) * 0.01),
  yIdeal: new Array(MAX_PTS).fill(0),
  setpointArray: new Array(MAX_PTS).fill(0),
  pArray: new Array(MAX_PTS).fill(0),
  iArray: new Array(MAX_PTS).fill(0),
  dArray: new Array(MAX_PTS).fill(0),
  integral: 0,
  y: 0,
  prevY: 0,
  dy: 0,
  currentTime: 0
});

export default function DashboardTelemetri() {
  const [plant, setPlant] = useState("drone");
  const [targetType, setTargetType] = useState("step");
  const [targetFreq, setTargetFreq] = useState(1.0); 
  const [enableNoise, setEnableNoise] = useState(false); 
  const [enableDisturbance, setEnableDisturbance] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [activePreset, setActivePreset] = useState("custom");
  
  const [kp, setKp] = useState(90);
  const [ki, setKi] = useState(200);
  const [kd, setKd] = useState(12);
  const [isClient, setIsClient] = useState(false);

  const [isLive, setIsLive] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const engine = useRef(initialEngineState());
  const paramsRef = useRef({ kp, ki, kd, plant, targetType, targetFreq, enableNoise, enableDisturbance });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    paramsRef.current = { kp, ki, kd, plant, targetType, targetFreq, enableNoise, enableDisturbance };
  }, [kp, ki, kd, plant, targetType, targetFreq, enableNoise, enableDisturbance]);

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === "aggressive") { setKp(120); setKi(150); setKd(2.5); }
    else if (preset === "balanced") { setKp(60); setKi(80); setKd(1.5); }
    else if (preset === "conservative") { setKp(25); setKi(30); setKd(0.8); }
  };

  const handleManualTweak = () => {
    if (activePreset !== "custom") setActivePreset("custom");
  };

  const simData = useMemo(() => {
    if (isLive) return null; 

    const dt = 0.01;
    const timeSteps = Math.floor(5.0 / dt);
    const t = new Array(timeSteps).fill(0).map((_, i) => i * dt);
    
    const yIdeal = new Array(timeSteps).fill(0);
    const setpointArray = new Array(timeSteps).fill(0);
    const pArray = new Array(timeSteps).fill(0);
    const iArray = new Array(timeSteps).fill(0);
    const dArray = new Array(timeSteps).fill(0);
    
    let integral = 0.0, y = 0.0, prevY = 0.0, dy = 0.0;
    const U_MAX = 255.0, U_MIN = -255.0;
    const noiseLevel = enableNoise ? 0.05 : 0.0;

    for (let i = 0; i < timeSteps; i++) {
      const currentTime = i * dt;
      let setpoint = 1.0;

      if (targetType === "square") {
        setpoint = Math.sign(Math.sin(2 * Math.PI * targetFreq * currentTime)) > 0 ? 1.0 : 0.0;
      } else if (targetType === "sine") {
        setpoint = Math.sin(2 * Math.PI * targetFreq * currentTime) * 0.5 + 0.5;
      }
      setpointArray[i] = setpoint;

      const currentY = y + (Math.random() - 0.5) * 2 * noiseLevel;
      const error = setpoint - currentY;
      const P = kp * error;
      const integralTemp = integral + (ki * error * dt);
      const D = kd * (prevY - currentY) / dt;
      
      pArray[i] = P; iArray[i] = integralTemp; dArray[i] = D;

      let uUnclamped = P + integralTemp + D;
      let u = 0;
      if (uUnclamped > U_MAX) u = U_MAX; 
      else if (uUnclamped < U_MIN) u = U_MIN; 
      else { u = uUnclamped; integral = integralTemp; }
      
      prevY = currentY;

      let disturbance = 0;
      if (enableDisturbance && currentTime >= 2.5 && currentTime <= 2.6) disturbance = -150.0; 
      
      if (plant === "drone") {
        const J = 0.05, B = 0.1;
        const ddy = (u + disturbance - B * dy) / J;
        dy += ddy * dt;
        y += dy * dt;
      } else {
        const Tau = 0.5, K = 1.0;
        const dyReactor = (K * (u + disturbance) - y) / Tau;
        y += dyReactor * dt;
      }
      yIdeal[i] = y;
    }

    const maxVal = Math.max(...yIdeal);
    const overshoot = targetType === "step" ? Math.max(0, (maxVal - 1.0) * 100) : 0;
    const steadyError = Math.abs(setpointArray[timeSteps - 1] - yIdeal[timeSteps - 1]) * 100;

    let riseTime = 0, settlingTime = 0;
    if (targetType === "step") {
      let t10 = -1, t90 = -1, lastOutsideBoundTime = 0;
      for(let i = 0; i < timeSteps; i++) {
        if (t10 === -1 && yIdeal[i] >= 0.1) t10 = t[i];
        if (t90 === -1 && yIdeal[i] >= 0.9) t90 = t[i];
        if (Math.abs(yIdeal[i] - 1.0) > 0.02) lastOutsideBoundTime = t[i];
      }
      if (t10 !== -1 && t90 !== -1) riseTime = t90 - t10;
      if (lastOutsideBoundTime < 5.0 - dt) settlingTime = lastOutsideBoundTime;
    }

    return { t, setpointArray, yIdeal, pArray, iArray, dArray, overshoot, steadyError, riseTime, settlingTime };
  }, [kp, ki, kd, enableNoise, enableDisturbance, plant, targetType, targetFreq, isLive]);

  useEffect(() => {
    if (!isLive) return;
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const loop = (time: number) => {
        const delta = time - lastTime;
        lastTime = time;
        accumulatedTime += delta;

        let stepsToRun = Math.floor(accumulatedTime / 10); 
        if (stepsToRun > 0) {
            accumulatedTime -= stepsToRun * 10;
            if (stepsToRun > 50) stepsToRun = 50; 

            const p = paramsRef.current;
            const e = engine.current;
            const dt = 0.01;

            for(let i=0; i<stepsToRun; i++) {
                e.currentTime += dt;
                let setpoint = 1.0;
                if (p.targetType === "square") {
                    setpoint = Math.sign(Math.sin(2 * Math.PI * p.targetFreq * e.currentTime)) > 0 ? 1.0 : 0.0;
                } else if (p.targetType === "sine") {
                    setpoint = Math.sin(2 * Math.PI * p.targetFreq * e.currentTime) * 0.5 + 0.5;
                }

                const noiseLevel = p.enableNoise ? 0.05 : 0.0;
                const currentY = e.y + (Math.random() - 0.5) * 2 * noiseLevel;

                const error = setpoint - currentY;
                const P = p.kp * error;
                const integralTemp = e.integral + (p.ki * error * dt);
                const D = p.kd * (e.prevY - currentY) / dt;

                e.t.push(e.currentTime);
                e.setpointArray.push(setpoint);
                e.pArray.push(P);
                e.iArray.push(integralTemp);
                e.dArray.push(D);

                let uUnclamped = P + integralTemp + D;
                let u = 0;
                if (uUnclamped > 255.0) u = 255.0;
                else if (uUnclamped < -255.0) u = -255.0;
                else { u = uUnclamped; e.integral = integralTemp; }

                e.prevY = currentY;

                let disturbance = p.enableDisturbance ? -150.0 : 0.0;

                if (p.plant === "drone") {
                    const J = 0.05, B = 0.1;
                    const ddy = (u + disturbance - B * e.dy) / J;
                    e.dy += ddy * dt;
                    e.y += e.dy * dt;
                } else {
                    const Tau = 0.5, K = 1.0;
                    const dyReactor = (K * (u + disturbance) - e.y) / Tau;
                    e.y += dyReactor * dt;
                }
                e.yIdeal.push(e.y);

                e.t.shift(); e.setpointArray.shift(); e.pArray.shift(); e.iArray.shift(); e.dArray.shift(); e.yIdeal.shift();
            }

            setLiveData({
                t: [...e.t], setpointArray: [...e.setpointArray], yIdeal: [...e.yIdeal],
                pArray: [...e.pArray], iArray: [...e.iArray], dArray: [...e.dArray],
                overshoot: 0, 
                steadyError: Math.abs(e.setpointArray[e.setpointArray.length-1] - e.yIdeal[e.yIdeal.length-1]) * 100,
                riseTime: 0, settlingTime: 0
            });
        }
        animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLive]);

  const displayData = isLive && liveData ? liveData : simData;

  const getLiveInsight = () => {
    if (isLive) return "Live Streaming Active. The physics engine is running continuously. Drag the Kp, Ki, and Kd sliders to instantly inject changes into the running momentum of the plant without resetting the timeline.";
    
    if (!displayData) return "";
    if (kp === 0 && ki === 0 && kd === 0) return "System offline. Increase Proportional (Kp) to engage actuators.";
    if (kp === 0) return "Proportional (Kp) is zero. System lacks fundamental driving force.";
    if (displayData.overshoot > 100) return `CRITICAL INSTABILITY: The system is violently oscillating with a ${displayData.overshoot.toFixed(0)}% overshoot. Reduce Kp and Ki immediately to regain control.`;

    let analysis = "";
    if (targetType === "step") {
      if (displayData.overshoot > 25) analysis += `Highly aggressive tuning. Experiencing a ${displayData.overshoot.toFixed(1)}% overshoot. Increase Derivative (Kd) to dampen the momentum, or lower Kp. `;
      else if (displayData.overshoot > 5) analysis += `Fast response, but with a slight ${displayData.overshoot.toFixed(1)}% overshoot. `;
      else if (kp < 30) analysis += "Sluggish response. The Proportional force is too weak to move the plant efficiently. ";
    } else {
      analysis += `Actively tracking a ${targetFreq}Hz reference signal. `;
    }

    if (enableDisturbance) analysis += "External disturbance detected. Monitor the Integral (Ki) component's ability to reject the interference. ";

    if (displayData.steadyError > 10) analysis += `Fails to lock onto target (Steady-State Error: ${displayData.steadyError.toFixed(1)}%). Increase Integral (Ki) to eliminate the offset.`;
    else if (displayData.steadyError > 2) analysis += `Close to target, but maintaining a ${displayData.steadyError.toFixed(1)}% offset. A minor increase in Ki is required.`;
    else if (displayData.overshoot <= 5 && displayData.steadyError <= 2) analysis += "Optimal tuning achieved. System is stable and locked onto the target with high precision.";

    return analysis;
  };

  if (!isClient || !displayData) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-50 font-sans relative overflow-x-hidden selection:bg-blue-500/30">
      
      {/* PREMIUM BACKGROUND UI: Subtle Grid & Radial Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.15),transparent)] z-0 pointer-events-none"></div>

      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 pt-8 pb-12">
        
        {/* PANEL KONTROL KIRI */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 shadow-xl text-neutral-50 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-neutral-800/60 bg-neutral-900/30 pb-4">
              <CardTitle className="text-md font-bold tracking-wide">System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Target Plant</label>
                  <Select value={plant} onValueChange={setPlant}>
                    <SelectTrigger className="w-full bg-neutral-950/50 border-neutral-800/80 text-xs hover:bg-neutral-900 transition-colors">
                      <SelectValue placeholder="Select Plant" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      <SelectItem value="drone">BLDC Motor</SelectItem>
                      <SelectItem value="pemanas_boiler">Industrial Heater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Reference Signal</label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger className="w-full bg-neutral-950/50 border-neutral-800/80 text-xs hover:bg-neutral-900 transition-colors">
                      <SelectValue placeholder="Signal Pattern" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      <SelectItem value="step">Unit Step (Constant)</SelectItem>
                      <SelectItem value="square">Square Wave</SelectItem>
                      <SelectItem value="sine">Sine Wave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800/50">
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Inject Disturbance</label>
                  <div className="flex items-center space-x-2 h-9">
                    <Switch checked={enableDisturbance} onCheckedChange={setEnableDisturbance} className="data-[state=checked]:bg-rose-500" />
                    <span className="text-xs text-neutral-400 font-medium">{enableDisturbance ? "Active" : "None"}</span>
                  </div>
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Advanced Metrics</label>
                  <div className="flex items-center space-x-2 h-9">
                    <Switch checked={showAdvancedMetrics} onCheckedChange={setShowAdvancedMetrics} disabled={targetType !== "step" || isLive} className="data-[state=checked]:bg-blue-500" />
                    <span className="text-xs text-neutral-400 font-medium">{showAdvancedMetrics && !isLive ? "Visible" : "Hidden"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Frequency</label>
                  <Select value={targetFreq.toString()} onValueChange={(val) => setTargetFreq(parseFloat(val))} disabled={targetType === "step"}>
                    <SelectTrigger className="w-full bg-neutral-950/50 border-neutral-800/80 text-xs disabled:opacity-30 hover:bg-neutral-900 transition-colors">
                      <SelectValue placeholder="Freq" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      <SelectItem value="1.0">Oscillation 1s (1Hz)</SelectItem>
                      <SelectItem value="0.5">Oscillation 2s (0.5Hz)</SelectItem>
                      <SelectItem value="0.25">Oscillation 4s (0.25Hz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Sensor Noise</label>
                  <div className="flex items-center space-x-2 h-9">
                    <Switch checked={enableNoise} onCheckedChange={setEnableNoise} className="data-[state=checked]:bg-emerald-500" />
                    <span className="text-xs text-neutral-400 font-medium">{enableNoise ? "Realistic" : "Ideal"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-800/50">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Auto-Tuning Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => applyPreset("conservative")} className={`text-xs font-semibold py-2 rounded-lg transition-all duration-200 border ${activePreset === "conservative" ? "bg-amber-900/30 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"}`}>Conservative</button>
                  <button onClick={() => applyPreset("balanced")} className={`text-xs font-semibold py-2 rounded-lg transition-all duration-200 border ${activePreset === "balanced" ? "bg-emerald-900/30 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"}`}>Balanced</button>
                  <button onClick={() => applyPreset("aggressive")} className={`text-xs font-semibold py-2 rounded-lg transition-all duration-200 border ${activePreset === "aggressive" ? "bg-rose-900/30 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]" : "bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"}`}>Aggressive</button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-blue-400 tracking-wide uppercase">Proportional (Kp)</label>
                    <Input type="number" value={kp} onChange={(e) => { setKp(Number(e.target.value) || 0); handleManualTweak(); }} className="w-20 h-7 text-right text-xs font-mono bg-neutral-950/80 border-neutral-800 text-blue-400 rounded" />
                  </div>
                  <Slider value={[kp]} min={0} max={300} step={1} onValueChange={(v) => { setKp(v[0]); handleManualTweak(); }} className="py-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-purple-400 tracking-wide uppercase">Integral (Ki)</label>
                    <Input type="number" value={ki} onChange={(e) => { setKi(Number(e.target.value) || 0); handleManualTweak(); }} className="w-20 h-7 text-right text-xs font-mono bg-neutral-950/80 border-neutral-800 text-purple-400 rounded" />
                  </div>
                  <Slider value={[ki]} min={0} max={500} step={1} onValueChange={(v) => { setKi(v[0]); handleManualTweak(); }} className="py-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-orange-400 tracking-wide uppercase">Derivative (Kd)</label>
                    <Input type="number" value={kd} onChange={(e) => { setKd(Number(e.target.value) || 0); handleManualTweak(); }} className="w-20 h-7 text-right text-xs font-mono bg-neutral-950/80 border-neutral-800 text-orange-400 rounded" />
                  </div>
                  <Slider value={[kd]} min={0} max={50} step={0.1} onValueChange={(v) => { setKd(v[0]); handleManualTweak(); }} className="py-2" />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* PANEL VISUALISASI KANAN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CONTROLLER TOGGLE */}
          <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 shadow-lg rounded-xl overflow-hidden">
             <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div>
                     <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                         <Activity size={16} className={isLive ? "text-rose-500 animate-pulse" : "text-emerald-500"} />
                         SYSTEM STATE: {isLive ? "LIVE HIL SIMULATION" : "STATIC ANALYSIS"}
                     </h2>
                     <p className="text-xs text-neutral-400 mt-1">
                         {isLive ? "Infinite loop visualization. Adjust sliders to manipulate running momentum." : "5-second fixed window. Ideal for analyzing system stability and metrics."}
                     </p>
                 </div>
                 <button 
                     onClick={() => {
                         if (!isLive) { engine.current = initialEngineState(); setLiveData(null); }
                         setIsLive(!isLive);
                     }}
                     className={`flex items-center px-4 py-2 rounded-lg font-bold text-[10px] tracking-widest transition-all shadow-md ${isLive ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'}`}
                 >
                     {isLive ? <Square size={14} className="mr-2" /> : <Play size={14} className="mr-2" />}
                     {isLive ? "STOP LIVE MODE" : "START LIVE MODE"}
                 </button>
             </CardContent>
          </Card>

          {/* METRICS ROW */}
          <div className={`grid gap-4 ${showAdvancedMetrics && targetType === "step" && !isLive ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
            <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 shadow-lg rounded-xl">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Max Overshoot</p>
                <p className="text-3xl font-black tracking-tight text-rose-500/90">{targetType === "step" && !isLive ? `${displayData.overshoot.toFixed(2)} %` : "N/A"}</p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 shadow-lg rounded-xl">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Steady-State Error</p>
                <p className="text-3xl font-black tracking-tight text-blue-500/90">{displayData.steadyError.toFixed(2)} %</p>
              </CardContent>
            </Card>
            {showAdvancedMetrics && targetType === "step" && !isLive && (
              <>
                <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 shadow-lg rounded-xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Rise Time</p>
                    <p className="text-3xl font-black tracking-tight text-amber-500/90">{displayData.riseTime > 0 ? `${displayData.riseTime.toFixed(2)} s` : "N/A"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 shadow-lg rounded-xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Settling Time</p>
                    <p className="text-3xl font-black tracking-tight text-emerald-500/90">{displayData.settlingTime > 0 ? `${displayData.settlingTime.toFixed(2)} s` : "> 5.0 s"}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* AI INSIGHT */}
          <Card className={`bg-neutral-900/60 backdrop-blur-md border overflow-hidden relative transition-all duration-300 shadow-lg rounded-xl ${displayData.overshoot > 100 && !isLive ? "border-rose-900/50 shadow-[0_4px_20px_rgba(244,63,94,0.1)]" : "border-blue-900/30 shadow-[0_4px_20px_rgba(59,130,246,0.05)]"}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${displayData.overshoot > 100 && !isLive ? "bg-rose-500" : "bg-blue-500"}`}></div>
            <CardContent className="p-5 flex gap-4 items-start">
              <div className={`mt-1 p-2 rounded-xl flex-shrink-0 border ${displayData.overshoot > 100 && !isLive ? "bg-rose-950/50 border-rose-900/50 text-rose-400" : "bg-blue-950/50 border-blue-900/50 text-blue-400"}`}>
                <BrainCircuit size={18} />
              </div>
              <div className="flex-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${displayData.overshoot > 100 && !isLive ? "text-rose-400" : "text-blue-400"}`}>Live System Analysis</p>
                <p className="text-sm text-neutral-300 leading-relaxed font-medium transition-all duration-300 mb-3">{getLiveInsight()}</p>
                <div className="flex items-start sm:items-center gap-3 pt-3 border-t border-neutral-800/60">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">Disclaimer</span>
                  <span className="text-[10px] text-neutral-500 font-medium">Heuristic analysis is for guidance only. Validate stability using raw metrics.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRAFIK 1: SYSTEM RESPONSE */}
          <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 p-2 shadow-lg rounded-xl">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-4 mt-3">System Response</p>
            <Plot
              data={[
                { x: displayData.t, y: displayData.setpointArray, mode: 'lines', name: 'Target', line: { color: '#525252', dash: 'dash', width: 2 }, hoverinfo: 'none' },
                { x: displayData.t, y: displayData.yIdeal, mode: 'lines', name: 'Response', line: { color: '#10b981', width: 2 } }
              ]}
              layout={{
                margin: { t: 15, r: 20, l: 40, b: 30 },
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                xaxis: { 
                  gridcolor: '#262626', zerolinecolor: '#404040', fixedrange: true,
                  range: isLive ? [displayData.t[0], displayData.t[displayData.t.length - 1]] : [0, 5],
                  tickfont: { color: '#737373', size: 10 } 
                },
                yaxis: { title: { text: 'Amplitude', font: { size: 10, color: '#737373' } }, gridcolor: '#262626', zerolinecolor: '#404040', fixedrange: true, tickfont: { color: '#737373', size: 10 } },
                showlegend: false
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%', height: '260px' }}
            />
          </Card>

          {/* GRAFIK 2: PID COMPONENTS */}
          <Card className="bg-neutral-900/60 backdrop-blur-md border-neutral-800/60 p-2 shadow-lg rounded-xl">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-4 mt-3">Control Components (P, I, D)</p>
            <Plot
              data={[
                { x: displayData.t, y: displayData.pArray, mode: 'lines', name: 'P (Proportional)', line: { color: '#3b82f6', width: 1.5 } },
                { x: displayData.t, y: displayData.iArray, mode: 'lines', name: 'I (Integral)', line: { color: '#a855f7', width: 1.5 } },
                { x: displayData.t, y: displayData.dArray, mode: 'lines', name: 'D (Derivative)', line: { color: '#f97316', width: 1.5 } }
              ]}
              layout={{
                margin: { t: 15, r: 20, l: 40, b: 45 },
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                xaxis: { 
                  title: { text: 'Time (s)', font: { size: 10, color: '#737373' } }, gridcolor: '#262626', zerolinecolor: '#404040', fixedrange: true,
                  range: isLive ? [displayData.t[0], displayData.t[displayData.t.length - 1]] : [0, 5],
                  tickfont: { color: '#737373', size: 10 } 
                },
                yaxis: { gridcolor: '#262626', zerolinecolor: '#404040', fixedrange: true, tickfont: { color: '#737373', size: 10 } },
                legend: { orientation: 'h', y: -0.25, font: { size: 10, color: '#a3a3a3' } }
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%', height: '220px' }}
            />
          </Card>
        </div>
      </main>
    </div>
  );
}