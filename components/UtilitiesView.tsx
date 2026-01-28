import React, { useState } from 'react';
import type { Utility } from '../types';
import { useLanguage } from '../providers/localeContext';
import { Icon } from './icons';
import { MoodboardCreator } from './MoodboardCreator';
import { LightingCreator } from './LightingCreator';
import { VirtualTourCreator } from './VirtualTourCreator';
import { VideoPromptCreator } from './VideoPromptCreator';
import { ExtendViewCreator } from './ExtendViewCreator';
import { ChangeStyleCreator } from './ChangeStyleCreator';
import { UpscaleCreator } from './UpscaleCreator';

interface UtilityToolPlaceholderProps {
    utility: Utility;
    onBack: () => void;
}

const UtilityToolPlaceholder: React.FC<UtilityToolPlaceholderProps> = ({ utility, onBack }) => {
    const { t } = useLanguage();
    const titles: Record<Utility, string> = {
        moodboard: t('moodboardTitle'),
        videoPrompt: t('videoPromptTitle'),
        lighting: t('lightingTitle'),
        virtualTour: t('virtualTourTitle'),
        extendView: t('extendViewTitle'),
        changeStyle: t('changeStyleTitle'),
        upscale: t('upscaleTitle'),
    };
    return (
        <div className="bg-[#1e293b] p-8 rounded-2xl min-h-[70vh] flex flex-col items-center justify-center text-center border border-slate-700/50 relative shadow-2xl">
            <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors">
                <Icon name="arrow-uturn-left" className="w-6 h-6" />
                {t('backToUtilities')}
            </button>
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Icon name="cpu-chip" className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-slate-100">{titles[utility]}</h2>
            <p className="text-xl text-slate-400 bg-slate-800/80 px-6 py-3 rounded-full border border-slate-700">{t('comingSoon')}</p>
        </div>
    );
};

interface UtilityThumbnailProps {
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
}

const UtilityThumbnail: React.FC<UtilityThumbnailProps> = ({ icon, title, description, onClick }) => (
    <div
        onClick={onClick}
        className="group bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col items-center text-center"
    >
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-700 group-hover:border-amber-500/30">
            <Icon name={icon} className="w-10 h-10 text-blue-500 group-hover:text-amber-500 transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
);

export const UtilitiesView: React.FC<any> = (props) => {
    const { t } = useLanguage();
    const [activeUtility, setActiveUtility] = useState<Utility | null>(null);

    const utilities: { id: Utility; icon: string; }[] = [
        { id: 'moodboard', icon: 'clipboard' },
        { id: 'lighting', icon: 'sparkles' },
        { id: 'virtualTour', icon: 'globe' },
        { id: 'videoPrompt', icon: 'video-camera' },
        { id: 'extendView', icon: 'arrows-pointing-out' },
        { id: 'changeStyle', icon: 'cpu-chip' },
        { id: 'upscale', icon: 'sparkles' },
    ];

    if (activeUtility) {
        let utilityComponent;
        switch (activeUtility) {
            case 'moodboard':
                utilityComponent = <MoodboardCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            case 'lighting':
                utilityComponent = <LightingCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            case 'virtualTour':
                utilityComponent = <VirtualTourCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            case 'videoPrompt':
                utilityComponent = <VideoPromptCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            case 'extendView':
                utilityComponent = <ExtendViewCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            case 'changeStyle':
                utilityComponent = <ChangeStyleCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            case 'upscale':
                utilityComponent = <UpscaleCreator onBack={() => setActiveUtility(null)} {...props} />;
                break;
            default:
                utilityComponent = <UtilityToolPlaceholder utility={activeUtility} onBack={() => setActiveUtility(null)} />;
                break;
        }
        return (
            <div className="lg:col-span-12">
                {utilityComponent}
            </div>
        );
    }

    return (
        <div className="lg:col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {utilities.map((item) => (
                    <UtilityThumbnail
                        key={item.id}
                        icon={item.icon}
                        title={t(`${item.id}Title` as any)}
                        description={t(`${item.id}Desc` as any)}
                        onClick={() => setActiveUtility(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};
