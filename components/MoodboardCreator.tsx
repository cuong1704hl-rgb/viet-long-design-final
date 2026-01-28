
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
                        <p className="text-sm text-slate-400">{t('moodboardDesc')}</p
