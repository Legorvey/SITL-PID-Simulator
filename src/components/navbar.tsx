"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Home, Activity } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800/60 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto py-3 px-6 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:bg-blue-500/20 transition-colors">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-neutral-100">SITL Simulator</h1>
            <p className="text-[9px] md:text-[10px] text-neutral-500 font-medium tracking-widest uppercase">PID Control Telemetry</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${
              pathname === "/" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Home size={14} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link 
            href="/simulator"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors ${
              pathname === "/simulator" ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-neutral-400 hover:text-blue-400 hover:bg-blue-900/10"
            }`}
          >
            <Activity size={14} />
            <span className="hidden sm:inline">Launch Simulator</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}