import React from 'react';
import { Cpu, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';

const Header = ({ isAuthenticated, userName, userEmail, userRole, onLogout, onBackToDashboard, isFormOrResult }) => {
  return (
    <header className="py-6 mb-6 flex items-center justify-between border-b border-white/5 pb-8">
      {/* Branding Section */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onBackToDashboard}>
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase tracking-[0.15em] leading-none">
              A I <span className="text-blue-500">Ticketing</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Enterprise Core</p>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="text-[8px] font-black text-green-500/80 uppercase tracking-widest">System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Section (Right Side) */}
      {isAuthenticated && (
        <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="hidden lg:flex flex-col items-end">
            <div className="flex items-center gap-2 mb-0.5">
               <ShieldCheck className="w-3 h-3 text-blue-400" />
               <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Authorized Session</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-white tracking-widest uppercase">{userName || userEmail}</span>
               <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase">{userRole}</span>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10 mx-1"></div>

          <div className="flex items-center gap-4">
            {isFormOrResult && (
              <button 
                onClick={onBackToDashboard}
                className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Dashboard
              </button>
            )}
            <button 
              onClick={onLogout}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/40 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest transition-all duration-300 shadow-lg"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

