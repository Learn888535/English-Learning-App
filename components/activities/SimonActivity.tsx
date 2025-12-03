import React, { useEffect, useState, useRef } from 'react';
import { EnglishLevel, SimonCommand } from '../../types';
import { generateSimonCommands, speakText, speakChinese, stopAllAudio } from '../../services/geminiService';
import { Play, Settings, Languages, Volume2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  level: EnglishLevel;
  onBack: () => void;
}

const SimonActivity: React.FC<Props> = ({ level, onBack }) => {
  const [commands, setCommands] = useState<SimonCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Translation & Help Logic
  const [canShowTranslation, setCanShowTranslation] = useState(false);
  const [translationVisible, setTranslationVisible] = useState(false);
  const [isHelpLoading, setIsHelpLoading] = useState(false); // New state for loading audio
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Settings
  const [commandCount, setCommandCount] = useState(5);
  const [helpDelay, setHelpDelay] = useState(3); // Default 3 seconds
  const [showSettings, setShowSettings] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Initial load or reset
  const loadGame = async () => {
    stopAllAudio();
    setLoading(true);
    setError(false);
    
    const data = await generateSimonCommands(level, commandCount);
    if (data && data.length > 0) {
        setCommands(data);
        setCurrentIdx(0);
        setGameStarted(true);
        resetCardState();
    } else {
        setError(true);
    }
    setLoading(false);
  };

  const resetCardState = () => {
    setCanShowTranslation(false);
    setTranslationVisible(false);
    setIsHelpLoading(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const playCommand = async () => {
    if (!commands[currentIdx] || isPlaying) return; // Prevent double clicks
    
    stopAllAudio();
    resetCardState();
    setIsPlaying(true);
    await speakText(commands[currentIdx].action);
    setIsPlaying(false);

    // Enable translation button after custom delay
    timerRef.current = setTimeout(() => {
      setCanShowTranslation(true);
    }, helpDelay * 1000);
  };

  const handleNext = () => {
    if (currentIdx < commands.length - 1) {
      setCurrentIdx(currentIdx + 1);
      resetCardState();
    } else {
      loadGame();
    }
  };

  const handleShowHelp = async () => {
    // Prevent multiple clicks while loading
    if (isHelpLoading) return;
    
    stopAllAudio();
    setIsHelpLoading(true);

    if (translationVisible) {
        // If already visible, just read it again
        if (commands[currentIdx]?.translation) {
            await speakChinese(commands[currentIdx].translation);
        }
    } else {
         // Reveal and read
        setTranslationVisible(true);
        if (commands[currentIdx]?.translation) {
            await speakChinese(commands[currentIdx].translation);
        }
    }
    setIsHelpLoading(false);
  };

  if (error) {
    return (
        <div className="flex h-full items-center justify-center flex-col gap-4 p-8 text-center bg-indigo-50">
            <div className="text-indigo-400 bg-indigo-100 p-4 rounded-full"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold text-slate-800">Game Load Error</h3>
            <p className="text-slate-500">Could not start the game. Please check your connection.</p>
            <button 
                onClick={loadGame} 
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
            >
                <RefreshCw size={20} /> Try Again (重试)
            </button>
            <button onClick={() => { stopAllAudio(); onBack(); }} className="text-indigo-400 font-bold">Back (返回)</button>
        </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col h-full p-6 items-center justify-center bg-indigo-50">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6">Simon Says</h2>
        
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 w-full max-w-sm mb-6 space-y-4">
          <div>
            <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
              <span>Number of Commands:</span>
              <span className="text-indigo-600">{commandCount}</span>
            </label>
            <input 
              type="range" 
              min="3" 
              max="10" 
              step="1"
              value={commandCount}
              onChange={(e) => setCommandCount(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
             <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
               <span>Help Button Delay (seconds):</span>
               <span className="text-indigo-600">{helpDelay}s</span>
             </label>
             <input 
               type="range" 
               min="1" 
               max="10" 
               step="1"
               value={helpDelay}
               onChange={(e) => setHelpDelay(parseInt(e.target.value))}
               className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
             />
             <p className="text-xs text-slate-400 mt-1">Wait time before child can see translation.</p>
          </div>
        </div>

        <button 
          onClick={loadGame}
          disabled={loading}
          className="w-full max-w-sm bg-indigo-600 text-white p-4 rounded-2xl font-bold text-xl shadow-indigo-300 shadow-lg hover:scale-105 transition disabled:opacity-70"
        >
          {loading ? <span className="animate-pulse">Loading...</span> : 'Start Game (开始游戏)'}
        </button>
        <button onClick={() => { stopAllAudio(); onBack(); }} className="mt-4 text-indigo-400 font-bold">Back (返回)</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 items-center bg-indigo-50">
       
       <div className="w-full flex justify-between items-center mb-4">
          <button onClick={() => setGameStarted(false)} className="text-indigo-300"><Settings size={20}/></button>
          <span className="text-indigo-300 text-xs font-bold">{currentIdx + 1} / {commands.length}</span>
       </div>

       <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200 flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg z-10">
            🤖
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2 z-10">Listen Carefully!</h2>
          <p className="text-slate-500 text-sm mb-8 z-10">If I don't say "Simon Says", don't move!</p>

          <div className="bg-slate-100 p-6 rounded-2xl w-full mb-4 min-h-[120px] flex flex-col items-center justify-center relative z-10">
            {isPlaying ? (
              <div className="flex gap-1">
                 <div className="w-2 h-8 bg-indigo-400 animate-bounce"></div>
                 <div className="w-2 h-8 bg-indigo-400 animate-bounce delay-100"></div>
                 <div className="w-2 h-8 bg-indigo-400 animate-bounce delay-200"></div>
              </div>
            ) : translationVisible ? (
               <div className="flex flex-col items-center gap-2 animate-fade-in">
                 <p className="text-indigo-600 font-bold text-lg">{commands[currentIdx]?.translation}</p>
                 <button 
                   onClick={() => handleShowHelp()} 
                   disabled={isHelpLoading}
                   className="text-indigo-400 hover:text-indigo-600"
                 >
                    {isHelpLoading ? <Loader2 size={20} className="animate-spin"/> : <Volume2 size={20} />}
                 </button>
               </div>
            ) : (
               <p className="text-slate-400 italic">Press play to hear command</p>
            )}
          </div>

          {/* Translation Reveal Button */}
          <div className="w-full h-10 mb-4 flex justify-center z-10">
            {canShowTranslation && !translationVisible && (
              <button 
                onClick={handleShowHelp}
                disabled={isHelpLoading}
                className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm disabled:opacity-70"
              >
                {isHelpLoading ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />} Need Help? (看不懂?)
              </button>
            )}
          </div>

          <button 
            onClick={playCommand}
            disabled={isPlaying || isHelpLoading}
            className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center shadow-green-200 shadow-xl hover:scale-105 transition active:scale-95 disabled:opacity-50 z-10"
          >
            <Play fill="white" className="ml-1 text-white" size={32} />
          </button>
       </div>

       <div className="mt-8 flex gap-4 w-full max-w-sm">
         <button onClick={() => { stopAllAudio(); onBack(); }} className="flex-1 py-3 text-slate-500 font-bold">Quit (退出)</button>
         <button 
            onClick={handleNext}
            className="flex-1 bg-white py-3 rounded-xl font-bold text-indigo-600 shadow-md"
          >
            {currentIdx < commands.length - 1 ? 'Next (下一个)' : 'New Game (新游戏)'}
          </button>
       </div>
    </div>
  );
};

export default SimonActivity;