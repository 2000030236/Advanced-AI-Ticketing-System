import React from 'react';
import { Cpu } from 'lucide-react';

const Header = () => {
  return (
    <header className="py-6 mb-12 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-[0.1em]">
            A I <span className="text-blue-500">Ticketing</span>
          </h1>
          <p className="text-xs text-white/40 font-medium">ENTERPRISE CORE · v1.0</p>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-white/40 uppercase tracking-widest leading-none">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        System Operational
      </div>
    </header>
  );
};

export default Header;
