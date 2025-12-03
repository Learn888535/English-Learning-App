import React, { useEffect, useState } from 'react';
import { EnglishLevel, VocabularyCard } from '../../types';
import { generateVocabulary, speakText } from '../../services/geminiService';
import { Volume2, ArrowRight, Search, Plus, Settings, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  level: EnglishLevel;
  onBack: () => void;
}

const TOPICS = [
  'Animals', 'Food', 'Colors', 'Family', 'Toys', 
  'Body Parts', 'Clothes', 'Weather', 'School', 'Home', 
  'Feelings', 'Transport', 'Nature', 'Space'
];

const VocabActivity: React.FC<Props> = ({ level, onBack }) => {
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Settings for quantity
  const [cardCount, setCardCount] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  const loadCards = async (topic: string) => {
    setLoading(true);
    setError(false);
    const data = await generateVocabulary(level, topic, cardCount);
    if (data && data.length > 0) {
        setCards(data);
        setIndex(0);
    } else {
        setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTopic) {
      loadCards(selectedTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, selectedTopic]);

  const handleNext = () => {
    if (index < cards.length - 1) {
      setIndex(index + 1);
    } else {
      setSelectedTopic(null); // Go back to topic selection
      setShowCustomInput(false);
      setCustomTopic('');
    }
  };

  if (!selectedTopic) {
     return (
       <div className="flex flex-col h-full p-4 overflow-y-auto">
         <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold text-slate-800">Choose a Topic</h2>
             <div className="flex gap-2">
               <button 
                 onClick={() => setShowSettings(!showSettings)}
                 className={`p-2 rounded-full ${showSettings ? 'bg-slate-200' : 'text-slate-400'}`}
               >
                 <Settings size={20} />
               </button>
               <button onClick={onBack} className="text-slate-400 font-bold">Back (返回)</button>
             </div>
         </div>
         
         {/* Quantity Settings Panel */}
         {showSettings && (
           <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200 animate-fade-in">
             <label className="flex justify-between text-sm font-bold text-slate-700 mb-2">
               <span>Number of Words:</span>
               <span className="text-orange-500">{cardCount}</span>
             </label>
             <input 
               type="range" 
               min="3" 
               max="15" 
               step="1"
               value={cardCount}
               onChange={(e) => setCardCount(parseInt(e.target.value))}
               className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
             />
           </div>
         )}

         {/* Custom Input Section */}
         <div className="mb-6">
            {!showCustomInput ? (
               <button 
                onClick={() => setShowCustomInput(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold"
               >
                 <Plus size={24} /> Create Topic (自定义)
               </button>
            ) : (
              <div className="bg-white p-2 rounded-2xl shadow-md border-2 border-purple-100 flex gap-2">
                <input 
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Minecraft, Dinosaurs..."
                  className="flex-1 p-3 outline-none text-slate-700 font-bold bg-transparent"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    if(customTopic.trim()) setSelectedTopic(customTopic);
                  }}
                  disabled={!customTopic.trim()}
                  className="bg-purple-500 text-white p-3 rounded-xl disabled:opacity-50"
                >
                  <Search size={20} />
                </button>
              </div>
            )}
         </div>

         <div className="grid grid-cols-2 gap-3 pb-20">
           {TOPICS.map(topic => (
             <button 
               key={topic}
               onClick={() => setSelectedTopic(topic)}
               className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 hover:bg-orange-50 hover:border-orange-200 transition text-left font-bold text-slate-700"
             >
               {topic}
             </button>
           ))}
         </div>
       </div>
     );
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center flex-col gap-2">
      <div className="animate-bounce text-4xl">🎲</div>
      <p className="text-slate-400">Creating {cardCount} "{selectedTopic}" cards...</p>
    </div>;
  }

  if (error) {
    return (
        <div className="flex h-full items-center justify-center flex-col gap-4 p-8 text-center">
            <div className="text-red-400 bg-red-50 p-4 rounded-full"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold text-slate-800">Oops!</h3>
            <p className="text-slate-500">Could not generate cards. Please check your connection or try again.</p>
            <button 
                onClick={() => loadCards(selectedTopic || 'Animals')} 
                className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
            >
                <RefreshCw size={20} /> Try Again (重试)
            </button>
            <button onClick={() => setSelectedTopic(null)} className="text-slate-400 font-bold text-sm">Cancel</button>
        </div>
    );
  }

  const currentCard = cards[index];
  if (!currentCard) return null;

  return (
    <div className="flex flex-col h-full items-center justify-center p-4">
      <div className="w-full max-w-xs aspect-[3/4] bg-white rounded-[3rem] shadow-xl border-4 border-orange-100 flex flex-col items-center p-8 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-32 bg-orange-50 rounded-b-[50%] -z-0"></div>
        <div className="absolute top-4 right-6 text-slate-300 text-sm font-bold">
          {index + 1} / {cards.length}
        </div>

        <div className="mt-8 text-[8rem] z-10 animate-pulse-slow">
          {currentCard.emoji}
        </div>
        
        <h2 className="text-4xl font-bold text-slate-800 mt-4">{currentCard.word}</h2>
        <p className="text-xl text-slate-400 font-medium mb-6">{currentCard.translation}</p>

        <button 
          onClick={() => speakText(currentCard.word)}
          className="bg-orange-400 text-white p-4 rounded-full shadow-lg hover:bg-orange-500 transition active:scale-95"
        >
          <Volume2 size={32} />
        </button>

        <div className="mt-8 bg-orange-50 p-4 rounded-xl w-full text-center">
          <p className="text-sm text-slate-600 italic">"{currentCard.sentence}"</p>
          <button onClick={() => speakText(currentCard.sentence)} className="mt-2 text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1">
             <Volume2 size={12} /> Listen
          </button>
        </div>
      </div>

      <div className="flex gap-4 mt-8 w-full max-w-xs">
        <button onClick={() => setSelectedTopic(null)} className="flex-1 bg-white text-slate-500 p-4 rounded-2xl font-bold shadow-sm">Topics (主题)</button>
        <button onClick={handleNext} className="flex-[2] bg-slate-800 text-white p-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
          {index < cards.length - 1 ? 'Next (下一个)' : 'Finish (完成)'} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default VocabActivity;