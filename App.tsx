import React, { useState } from 'react';
import { AppScreen, UserProfile } from './types';
import Layout from './components/Layout';
import Assessment from './components/Assessment';
import Dashboard from './components/Dashboard';
import VocabActivity from './components/activities/VocabActivity';
import StoryActivity from './components/activities/StoryActivity';
import SimonActivity from './components/activities/SimonActivity';
import RolePlayActivity from './components/activities/RolePlayActivity';
import ParentGuide from './components/ParentGuide';

function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleAssessmentComplete = (profile: UserProfile) => {
    setUser(profile);
    setScreen(AppScreen.DASHBOARD);
  };

  const renderContent = () => {
    switch (screen) {
      case AppScreen.HOME:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-8xl mb-6 animate-bounce">🐼</div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">PandaPal English</h1>
            <p className="text-slate-500 mb-8">Learn English naturally through play!</p>
            <button 
              onClick={() => setScreen(AppScreen.ASSESSMENT)}
              className="w-full bg-yellow-400 text-slate-900 font-bold py-4 rounded-2xl shadow-yellow-200 shadow-lg text-xl hover:scale-105 transition"
            >
              Get Started (开始学习)
            </button>
            <p className="mt-4 text-xs text-slate-400">Designed for ages 2-10</p>
          </div>
        );

      case AppScreen.ASSESSMENT:
        return <Assessment onComplete={handleAssessmentComplete} />;

      case AppScreen.DASHBOARD:
        if (!user) return null;
        return <Dashboard user={user} onNavigate={setScreen} />;

      case AppScreen.ACTIVITY_VOCAB:
        if (!user) return null;
        return <VocabActivity level={user.level} onBack={() => setScreen(AppScreen.DASHBOARD)} />;

      case AppScreen.ACTIVITY_STORY:
        if (!user) return null;
        return <StoryActivity level={user.level} onBack={() => setScreen(AppScreen.DASHBOARD)} />;

      case AppScreen.ACTIVITY_SIMON:
        if (!user) return null;
        return <SimonActivity level={user.level} onBack={() => setScreen(AppScreen.DASHBOARD)} />;

      case AppScreen.ACTIVITY_ROLEPLAY:
        if (!user) return null;
        return <RolePlayActivity level={user.level} onBack={() => setScreen(AppScreen.DASHBOARD)} />;

      case AppScreen.PARENT_GUIDE:
        return <ParentGuide onBack={() => setScreen(user ? AppScreen.DASHBOARD : AppScreen.HOME)} />;

      default:
        return null;
    }
  };

  return (
    <Layout currentScreen={screen} onNavigate={setScreen}>
      {renderContent()}
    </Layout>
  );
}

export default App;