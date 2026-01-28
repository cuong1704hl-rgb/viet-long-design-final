
import React, { useEffect } from 'react';
import type { SourceImage } from '../types';
import { useLanguage } from '../providers/localeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';

interface MoodboardCreatorProps {
    onBack: () => void;
    moodboardSourceImage: SourceImage | null;
    setMoodboardSourceImage: (image: SourceImage | null) => void;
    moodboardReferenceImage: SourceImage | null;
    setMoodboardReferenceImage: (image: SourceImage | null) => void;
    moodboardPrompt: string;
    setMoodboardPrompt: (prompt: string) => void;
    moodboardImageCount: number;
    setMoodboardImageCount: (count: number) => void;
    moodboardGeneratedImages: string[];
    moodboardSelectedImage: string | null;
    setMoodboardSelectedImage: (image: string | null) => void;
    handleMoodboardGeneration: () => void;
    isLoading: boolean;
}

export const MoodboardCreator: React.FC<MoodboardCreatorProps> = ({
    onBack,
    moodboardSourceImage: sourceImage,
    setMoodboardSourceImage: setSourceImage,
    moodboardReferenceImage: referenceImage,
    setMoodboardReferenceImage: setReferenceImage,
    moodboardPrompt: prompt,
    setMoodboardPrompt: setPrompt,
    moodboardImageCount: imageCount,
    setMoodboardImageCount: setImageCount,
    moodboardGeneratedImages: generatedMoodboards,
    moodboardSelectedImage: selectedMoodboard,
    setMoodboardSelectedImage: setSelectedMoodboard,
    handleMoodboardGeneration: handleGenerate,
    isLoading
}) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (generatedMoodboards.length > 0 && !selectedMoodboard) {
            setSelectedMoodboard(generatedMoodboards[0]);
        }
    }, [generatedMoodboards, selectedMoodboard, setSelectedMoodboard]);

    return (
        <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700/50 animate-fade-in">
            <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-4">
                    <Icon name="clipboard" className="w-8 h-8 text-blue-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{t('moodboardTitle')}</h2>
                    </div>
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                        <Icon name="x-mark" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    {/* Step 1: Inspiration Image */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('uploadInspirationImage')}
                        </label>
                        <ImageDropzone
                            image={sourceImage}
                            onImageUpload={setSourceImage}
                            placeholder={t('dropzoneHint')}
                        />
                    </div>

                    {/* Step 2: Reference Image */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('uploadReferenceImage')} <span className="text-slate-500 font-normal">({t('referenceImageHelp')})</span>
                        </label>
                        <ImageDropzone
                            image={referenceImage}
                            onImageUpload={setReferenceImage}
                            placeholder={t('dropzoneHint')}
                        />
                    </div>

                    {/* Step 3: Prompt & Count */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-300">
                                {t('moodboardPromptHelp')}
                            </label>
                            <button
                                onClick={() => setPrompt(t('moodboardSamplePromptText'))}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {t('moodboardSamplePrompt')}
                            </button>
                        </div>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('promptPlaceholder.create')}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('moodboardImageCount')}
                        </label>
                        <select
                            value={imageCount}
                            onChange={(e) => setImageCount(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={1}>1 {t('images')}</option>
                            <option value={2}>2 {t('images')}</option>
                            <option value={3}>3 {t('images')}</option>
                            <option value={4}>4 {t('images')}</option>
                        </select>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !sourceImage || !prompt}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isLoading || !sourceImage || !prompt
                                ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Icon name="arrow-path" className="w-5 h-5 animate-spin" />
                                {t('generatingMoodboard')}
                            </>
                        ) : (
                            <>
                                <Icon name="sparkles" className="w-5 h-5" />
                                {t('generateMoodboardButton')}
                            </>
                        )}
                    </button>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-8">
                    {generatedMoodboards.length > 0 ? (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 h-full min-h-[500px]">
                            <div className="grid grid-cols-1 gap-6">
                                {generatedMoodboards.map((img, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-700">
                                        <img src={img} alt={`Moodboard ${index + 1}`} className="w-full h-auto object-contain" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <a
                                                href={img}
                                                download={`moodboard-${index + 1}.png`}
                                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm text-white transition-colors"
                                                title={t('downloadImage')}
                                            >
                                                <Icon name="arrow-down-tray" className="w-6 h-6" />
                                            </a>
                                            <button
                                                onClick={() => window.open(img, '_blank')}
                                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm text-white transition-colors"
                                                title={t('fullscreen')}
                                            >
                                                <Icon name="arrows-pointing-out" className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-700 p-8">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Icon name="photo" className="w-10 h-10 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-200 mb-2">{t('moodboardEmptyHeader')}</h3>
                            <p className="text-slate-400 max-w-sm">{t('moodboardEmptyText')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
