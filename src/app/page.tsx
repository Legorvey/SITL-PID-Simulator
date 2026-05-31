import Link from "next/link";
import { ArrowRight, Activity, Cpu, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-73px)] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] selection:bg-blue-500/30">
      
      {/* Background UI */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(37,99,235,0.1),transparent_60%)] z-0 pointer-events-none blur-3xl"></div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/30 border border-blue-900/50 mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">v1.0 Production Ready</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          Industrial-Grade <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Control System
          </span> Simulator
        </h1>

        {/* Executive Summary */}
        <p className="text-base md:text-lg text-neutral-400 max-w-2xl mb-10 leading-relaxed">
          A high-performance Software-in-the-Loop (SITL) platform engineered for dynamic plant response analysis, real-time actuator saturation testing, and heuristic tuning optimization.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link 
            href="/simulator" 
            className="flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
          >
            <Activity size={18} />
            Initialize Dashboard
            <ArrowRight size={18} className="ml-1" />
          </Link>
          <a 
            href="https://github.com/adityacakti" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold tracking-wide transition-all"
          >
            View Source Architecture
          </a>
        </div>

        {/* Tech Stack Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/80 backdrop-blur-sm">
            <Cpu className="w-6 h-6 text-emerald-400 mb-4" />
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-2">Discrete Calculus</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Real-time Euler Integration operating at 100Hz with built-in actuator saturation, anti-windup mechanics, and <i>Derivative on Measurement</i> implementation.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/80 backdrop-blur-sm">
            <Activity className="w-6 h-6 text-rose-400 mb-4" />
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-2">Live Telemetry</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Continuous infinite-loop rendering for real-time momentum manipulation, tracking error analysis, and environmental disturbance rejection testing.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/80 backdrop-blur-sm">
            <Layers className="w-6 h-6 text-blue-400 mb-4" />
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-2">Modern Stack</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Architected on Next.js App Router for optimal CSR performance, styled with Tailwind CSS, and visualized using Plotly.js for scientific-grade graphing.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}