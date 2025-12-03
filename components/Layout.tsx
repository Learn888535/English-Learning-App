import React, { useState } from 'react';
import { Home, BookOpen, Info, Volume2, VolumeX, Settings } from 'lucide-react';
import { AppScreen } from '../types';
import { setGlobalMute, setGlobalVolume } from '../services/geminiService';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [volume, setVolume] = useState(1.0);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    setGlobalMute(newState);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setGlobalVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      setGlobalMute(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-yellow-400 p-4 flex justify-between items-center rounded-b-[2rem] shadow-md z-30 transition-all relative">
        <div className="flex items-center gap-2" onClick={() => onNavigate(AppScreen.HOME)}>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm cursor-pointer hover:scale-105 transition">
            🐼
          </div>
          <h1 className="font-bold text-slate-800 text-lg">PandaPal</h1>
        </div>
        
        <div className="flex gap-2 items-center">
          
          {/* Volume Control Area */}
          <div className="flex items-center bg-white/20 rounded-full pr-2 transition-all overflow-hidden">
             <button 
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              className="p-2 rounded-full hover:bg-white/40 transition text-slate-800"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            
            {(showVolumeControl) && (
               <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-slate-800/20 rounded-lg appearance-none cursor-pointer accent-slate-800 mr-2"
               />
            )}
          </div>

          <button 
            onClick={() => onNavigate(AppScreen.PARENT_GUIDE)}
            className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition"
          >
            <Info className="w-6 h-6 text-slate-800" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] scroll-smooth">
        {children}
      </main>

      {/* Bottom Nav */}
      {currentScreen !== AppScreen.HOME && currentScreen !== AppScreen.ASSESSMENT && (
        <nav className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md rounded-full p-2 shadow-xl border border-slate-100 flex justify-around items-center z-20">
          <NavItem 
            icon={<Home size={24} />} 
            label="Home (首页)" 
            active={currentScreen === AppScreen.DASHBOARD}
            onClick={() => onNavigate(AppScreen.DASHBOARD)} 
          />
           <NavItem 
            icon={<BookOpen size={24} />} 
            label="Learn (学习)" 
            active={[AppScreen.ACTIVITY_STORY, AppScreen.ACTIVITY_VOCAB, AppScreen.ACTIVITY_SIMON, AppScreen.ACTIVITY_ROLEPLAY].includes(currentScreen)}
            onClick={() => onNavigate(AppScreen.DASHBOARD)} 
          />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${active ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;