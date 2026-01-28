import React from 'react';
import type { ActiveTab } from '../types';
import { useLanguage } from '../providers/localeContext';

const Tab: React.FC<{ label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({ label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 md:px-6 py-2.5 text-xs md:text-sm font-semibold transition-all duration-300 rounded-lg whitespace-nowrap ${active
      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 transform scale-105'
      : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
  </button>
);

export const TopNavBar: React.FC<{
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();
  return (
    <nav className="max-w-[1800px] mx-auto mb-8 flex justify-center sticky top-4 z-40">
      <div className="flex items-center space-x-2 bg-slate-800/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl shadow-xl overflow-x-auto thin-scrollbar max-w-full">
        <Tab label={t('tabCreate')} active={activeTab === 'create'} onClick={() => onTabChange('create')} />
        <Tab label={t('tabCameraAngle')} active={activeTab === 'cameraAngle'} onClick={() => onTabChange('cameraAngle')} />
        <Tab label={t('tabEdit')} active={activeTab === 'edit'} onClick={() => onTabChange('edit')} />
        <Tab label={t('tabPlanTo3D')} active={activeTab === 'planTo3d'} onClick={() => onTabChange('planTo3d')} />
        <Tab label={t('tabCanvaMix')} active={activeTab === 'canva'} onClick={() => onTabChange('canva')} />
        <Tab label={t('tabCreatePrompt')} active={activeTab === 'prompt'} onClick={() => onTabChange('prompt')} />
        <Tab label={t('tabCreateVideo')} active={activeTab === 'video'} onClick={() => onTabChange('video')} />
        <Tab label={t('tabUtilities')} active={activeTab === 'utilities'} onClick={() => onTabChange('utilities')} />
      </div>
    </nav>
  );
};
