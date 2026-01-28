import React from 'react';
import { useLanguage } from '../providers/localeContext';
import { Icon } from './icons';

export const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useLanguage();
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436a0979f9?q=80&w=2070&auto=format&fit=crop')" }}
    >
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
      <div className="relative z-10 text-center p-8 flex flex-col items-center animate-fade-in">
        <div className="w-48 h-48 bg-white rounded-2xl flex flex-col items-center justify-center shadow-2xl shadow-blue-900/50 mb-8 p-4 transform hover:scale-105 transition-transform duration-300">
          <Icon name="building-logo" className="w-full h-full text-[#0047AB]" />
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-wide text-slate-100 mb-6 drop-shadow-lg">
          {t('welcomeHeader')}
        </h1>
        <p className="text-slate-300 text-xl mb-12 max-w-2xl leading-relaxed">
          {t('welcomeDescription')}
        </p>
        <button
          onClick={onStart}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-amber-500/40 active:scale-95"
        >
          {t('welcomeStartButton')}
        </button>
      </div>
    </div>
  );
};
