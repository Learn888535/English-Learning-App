import React, { useEffect, useState } from 'react';
import { EnglishLevel, StorySegment } from '../../types';
import { generateStory, generateImage, speakText } from '../../services/geminiService';
import { Volume2, ChevronRight, Image as ImageIcon, Sparkles, Settings, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  level: EnglishLevel;
  onBack: () => void;
}

const THEMES = ['Panda\'s Home', 'Outer Space', 'Magic Castle', 'Underwater', 'School Day', 'Jungle Adventure'];

const StoryActivity: React.FC<Props> = ({ level, onBack }) => {
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Settings
  const [storyLength, setStoryLength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  
  // Image state
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const loadStory = async () => {
    if (!selectedTheme) return;
    setLoading(true);
    setError(false);
    setSegments([]); // Clear previous
    
    const data = await generateStory(level, selectedTheme, storyLength);
    
    if (data && data.length > 0) {
        setSegments(data);
        setCurrentLine(0);
        // Load first image
        loadStoryImage(data[0].text);
    } else {
        setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTheme) {
      loadStory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheme]);

  const loadStoryImage = async (text: string) => {
    setImageLoading(true);
    setCurrentImage(null);
    const img = await generateImage(text);
    setCurrentImage(img);
    setImageLoading(false);
  };

  const handleNext = () => {
    const nextLine = currentLine + 1;
    setCurrentLine(nextLine);
    if (segments[nextLine]) {
        loadStoryImage(segments[nextLine].text);
    }
  };

  if (!selectedTheme) {
      return (
        <div className="flex flex-col h-full p-4 overflow-y-auto">
         <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold text-pink-500">Choose a Story</h2>
             <div className="flex gap-2">
               <button 
                 onClick={() => setShowSettings(!showSettings)}
                 className={`p-2 rounded-full ${showSettings ? 'bg-pink-100' : 'text-slate-400'}`}
               >
                 <Settings size={20} />
               </button>
               <button onClick={onBack} className="text-slate-400 font-bold">Back (返回)</button>
             </div>
         </div>

         {/* Quantity Settings Panel */}
         {showSettings && (
           <div className="bg-pink-50 p-4 rounded-2xl mb-4 border border-pink-100 animate-fade-in">
             <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
               <span>Story Length (Sentences):</span>
               <span className="text-pink-500">{storyLength}</span>
             </label>
             <input 
               type="range" 
               min="3" 
               max="8" 
               step="1"
               value={storyLength}
               onChange={(e) => setStoryLength(parseInt(e.target.value))}
               className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
             />
           </div>
         )}

         {/* Custom Theme Input */}
         <div className="mb-6">
            {!showCustomInput ? (
               <button 
                onClick={() => setShowCustomInput(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold"
               >
                 <Sparkles size={24} /> Write Story (编写故事)
               </button>
            ) : (
              <div className="bg-white p-2 rounded-2xl shadow-md border-2 border-pink-100 flex gap-2">
                <input 
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="e.g. A flying turtle..."
                  className="flex-1 p-3 outline-none text-slate-700 font-bold bg-transparent"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    if(customTheme.trim()) setSelectedTheme(customTheme);
                  }}
                  disabled={!customTheme.trim()}
                  className="bg-pink-500 text-white p-3 rounded-xl disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
         </div>

         <div className="grid grid-cols-1 gap-3 pb-20">
           {THEMES.map(theme => (
             <button 
               key={theme}
               onClick={() => setSelectedTheme(theme)}
               className="bg-white p-6 rounded-3xl shadow-md border-2 border-pink-50 hover:bg-pink-50 hover:border-pink-200 transition text-left font-bold text-slate-700 flex items-center justify-between"
             >
               <span>{theme}</span>
               <span className="text-2xl">📚</span>
             </button>
           ))}
         </div>
       </div>
      );
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center flex-col gap-2">
        <div className="animate-spin text-4xl">📖</div>
        <p className="text-slate-400">Writing a {storyLength}-sentence story...</p>
    </div>;
  }

  if (error) {
    return (
        <div className="flex h-full items-center justify-center flex-col gap-4 p-8 text-center">
            <div className="text-pink-400 bg-pink-50 p-4 rounded-full"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold text-slate-800">Story Generation Failed</h3>
            <p className="text-slate-500">Could not write the story. Please check your connection.</p>
            <button 
                onClick={loadStory} 
                className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
            >
                <RefreshCw size={20} /> Try Again (重试)
            </button>
            <button onClick={() => setSelectedTheme(null)} className="text-slate-400 font-bold text-sm">Cancel</button>
        </div>
    );
  }

  const segment = segments[currentLine];

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 bg-white rounded-3xl shadow-lg border border-pink-100 p-4 flex flex-col relative overflow-hidden">
        
        {/* Visual Aid Section */}
        <div className="w-full aspect-square md:aspect-video rounded-2xl bg-slate-50 mb-4 overflow-hidden relative flex items-center justify-center border border-slate-100">
            {imageLoading ? (
                <div className="flex flex-col items-center text-slate-300">
                    <div className="animate-pulse mb-2"><ImageIcon size={32} /></div>
                    <span className="text-xs">Drawing...</span>
                </div>
            ) : currentImage ? (
                <img src={currentImage} alt="Story visual" className="w-full h-full object-cover animate-fade-in" />
            ) : (
                <div className="text-4xl">🐼</div>
            )}
        </div>
        
        <div className="flex-1 flex flex-col items-center text-center space-y-4">
          {segment ? (
            <>
              <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                {segment.text}
              </p>
              <p className="text-md text-slate-400 font-medium">
                {segment.translation}
              </p>
              <button 
                onClick={() => speakText(segment.text)}
                className="bg-pink-100 text-pink-600 p-3 rounded-full hover:bg-pink-200 transition"
              >
                <Volume2 size={24} />
              </button>
            </>
          ) : (
             <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-slate-800">The End!</h3>
                <p className="text-slate-500 mb-4">Great reading!</p>
                <button onClick={() => { setSelectedTheme(null); setCustomTheme(''); setShowCustomInput(false); }} className="bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-pink-200">Read Another (再读一个)</button>
             </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-auto pt-4 flex-wrap">
          {segments.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === currentLine ? 'bg-pink-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center px-2">
        <button onClick={() => { setSelectedTheme(null); setCustomTheme(''); setShowCustomInput(false); }} className="text-slate-400 font-bold text-sm">Back (返回)</button>
        {segment && (
          <button 
            onClick={handleNext}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
          >
            Next (下一页) <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryActivity;