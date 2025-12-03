import React from 'react';
import { UserProfile, AppScreen, EnglishLevel } from '../types';
import { Gamepad2, BookOpen, Mic, Store, Share2 } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (screen: AppScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const getLevelColor = (l: EnglishLevel) => {
    switch(l) {
      case EnglishLevel.BEGINNER: return 'bg-green-100 text-green-700 border-green-200';
      case EnglishLevel.INTERMEDIATE: return 'bg-blue-100 text-blue-700 border-blue-200';
      case EnglishLevel.ADVANCED: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getLevelLabel = (l: EnglishLevel) => {
    switch(l) {
      case EnglishLevel.BEGINNER: return 'Input Phase (Silent Period)';
      case EnglishLevel.INTERMEDIATE: return 'Construction (Building)';
      case EnglishLevel.ADVANCED: return 'Refinement (Fluency)';
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'PandaPal English',
      text: 'Check out this cool AI English learning app for kids!',
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard! (链接已复制)');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Hi, {user.name}! 👋</h2>
                    <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(user.level)}`}>
                    {getLevelLabel(user.level)}
                    </div>
                </div>
                <button 
                    onClick={handleShare}
                    className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition"
                    title="Share App"
                >
                    <Share2 size={20} />
                </button>
            </div>
            <p className="text-slate-500 mt-4 text-sm max-w-[80%]">Ready to learn something new today?</p>
        </div>
        
        {/* Decorative Background Panda */}
        <div className="absolute -right-4 -bottom-8 opacity-10 text-8xl pointer-events-none">
            🐼
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* Flashcards (Input) */}
        <ActivityCard 
          title="House Labels (生活物品)"
          subtitle="Learn objects around you"
          icon={<Gamepad2 className="w-8 h-8 text-white" />}
          color="bg-orange-400"
          onClick={() => onNavigate(AppScreen.ACTIVITY_VOCAB)}
        />

        {/* Story Time (Reading) */}
        <ActivityCard 
          title="Story Time (故事时光)"
          subtitle="Picture walks & reading"
          icon={<BookOpen className="w-8 h-8 text-white" />}
          color="bg-pink-400"
          onClick={() => onNavigate(AppScreen.ACTIVITY_STORY)}
        />

        {/* Simon Says (Imitation/Play) */}
        <ActivityCard 
          title="Simon Says (听指令)"
          subtitle="Listen & Move body"
          icon={<Mic className="w-8 h-8 text-white" />}
          color="bg-indigo-400"
          onClick={() => onNavigate(AppScreen.ACTIVITY_SIMON)}
        />

         {/* Role Play (Interaction) */}
         <ActivityCard 
          title="Role Play (角色扮演)"
          subtitle="Chat & Buy things"
          icon={<Store className="w-8 h-8 text-white" />}
          color="bg-emerald-400"
          onClick={() => onNavigate(AppScreen.ACTIVITY_ROLEPLAY)}
        />

      </div>

      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <h3 className="font-bold text-blue-800 text-sm mb-1">Tip for today:</h3>
        <p className="text-blue-600 text-xs">
          Kids naturally "self-correct" over time. Don't worry about every mistake, just keep practicing!
        </p>
      </div>
    </div>
  );
};

const ActivityCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, subtitle, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="relative overflow-hidden bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition group text-left w-full"
  >
    <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      <p className="text-slate-400 text-sm">{subtitle}</p>
    </div>
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full z-0 opacity-50 pointer-events-none"></div>
  </button>
);

export default Dashboard;