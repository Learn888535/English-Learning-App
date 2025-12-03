import React, { useState } from 'react';
import { UserProfile, EnglishLevel } from '../types';
import { ArrowRight, Star } from 'lucide-react';
import { generateAssessment } from '../services/geminiService';

interface AssessmentProps {
  onComplete: (profile: UserProfile) => void;
}

const Assessment: React.FC<AssessmentProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFinish = async () => {
    if (!name || !age) return;
    
    setIsAnalyzing(true);
    const calculatedLevel = await generateAssessment(Number(age));
    
    setIsAnalyzing(false);
    onComplete({
      name,
      age: Number(age),
      level: calculatedLevel,
      interests: ['Animals', 'Colors']
    });
  };

  return (
    <div className="flex flex-col h-full justify-center max-w-xs mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Let's Start!</h2>
        <p className="text-slate-500">Create your profile</p>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Child's Name (名字)</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none text-lg bg-white"
              placeholder="e.g. Lele"
            />
          </div>
          <button 
            disabled={!name}
            onClick={() => setStep(2)}
            className="w-full bg-blue-500 text-white p-4 rounded-2xl font-bold text-lg shadow-blue-200 shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-blue-600 transition"
          >
            Next (下一步) <ArrowRight size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
           <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Child's Age (年龄)</label>
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none text-lg bg-white"
              placeholder="e.g. 5"
            />
          </div>
          <button 
            disabled={!age}
            onClick={handleFinish}
            className="w-full bg-green-500 text-white p-4 rounded-2xl font-bold text-lg shadow-green-200 shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-green-600 transition"
          >
            {isAnalyzing ? (
              <span>Analyzing...</span>
            ) : (
              <>Start Learning (开始学习) <Star fill="white" size={20}/></>
            )}
          </button>
          
          <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-800 mt-6 border border-yellow-100">
            <h4 className="font-bold mb-1">How we adjust learning:</h4>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li><strong>0-3 Years:</strong> Focus on Sounds & Listening (The Silent Period)</li>
              <li><strong>4-7 Years:</strong> Focus on Sentences & Imitation (Construction)</li>
              <li><strong>8+ Years:</strong> Focus on Grammar & Reading (Refinement)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessment;