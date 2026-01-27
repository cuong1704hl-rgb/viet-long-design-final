import React, { useEffect } from 'react';
import type { SourceImage } from '../types';
import { useLanguage } from '../providers/LocaleContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';
import { translations } from '../locales/translations';

interface UpscaleCreatorProps {
    onBack: () => void;
    upscaleSourceImage: SourceImage | null;
    setUpscaleSourceImage: (image: SourceImage | null) => void;
    upscaleLevel: 'subtle' | 'balanced' | 'creative';
    setUpscaleLevel: (level: 'subtle' | 'balanced' | 'creative') => void;
    upscaleGeneratedImages: string[];
    upscaleSelectedImage: string | null;
    setUpscaleSelectedImage: (image: string | null) => void;
    handleUpscaleGeneration: () => void;
    isLoading: boolean;
    setFullscreenImage: (url: string | null) => void;
}

export const UpscaleCreator: React.FC<UpscaleCreatorProps> = ({
    onBack,
    upscaleSourceImage: sourceImage,
    setUpscaleSourceImage: setSourceImage,
    upscaleLevel: level,
    setUpscaleLevel: setLevel,
    upscaleGeneratedImages: generatedImages,
    upscaleSelectedImage: selectedImage,
    setUpscaleSelectedImage: setSelectedImage,
    handleUpscaleGeneration: handleGenerate,
    isLoading,
    setFullscreenImage,
}) => {
    const { t, language } = useLanguage();
    // Get options directly from translation file to ensure correct typing and structure
    const { upscaleLevels } = translations[language].constants;

    useEffect(() => {
        if (generatedImages.length > 0 && !selectedImage) {
            setSelectedImage(generatedImages[0]);
        }
    }, [generatedImages, selectedImage, setSelectedImage]);

    return (
        <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700/50 animate-fade-in">
            <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-4">
                    <Icon name="sparkles" className="w-8 h-8 text-orange-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{t('upscaleTitle')}</h2>
                        <p className="text-sm text-slate-400">{t('upscaleDesc')}</p>
                    </div>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-700/50">
                    <Icon name="arrow-uturn-left" className="w-5 h-5" />
                    <span>{t('backToUtilities')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <section>
                        <h3 className="font-semibold text-slate-300 mb-3">{t('uploadImageToUpscale')}</h3>
                        {sourceImage ? (
                            <div className='space-y-3'>
                                <div className='bg-black/30 rounded-lg p-2'><img src={sourceImageToDataUrl(sourceImage)} alt="Source to upscale" className="w-full h-auto object-contain rounded" /></div>
                                <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 text-sm px-3 py-1.5 rounded-md hover:bg-red-500/10'>{t('delete')}</button>
                            </div>
                        ) : (
                            <ImageDropzone onImageUpload={setSourceImage} className='w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-slate-400 text-sm cursor-pointer'>
                                <div><p>{t('dropzoneHint')}</p><p className="text-xs mt-1 text-slate-500">{t('dropzoneFormats')}</p></div>
                            </ImageDropzone>
                        )}
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-300 mb-2">{t('upscaleFactor')}</h3>
                        <p className="text-xs text-slate-400 -mt-2 mb-3">{t('upscaleFactorHelp')}</p>
                        <div className="space-y-2">
                            {upscaleLevels.map((opt: { display: string; value: string; }) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setLevel(opt.value as 'subtle' | 'balanced' | 'creative')}
                                    className={`w-full text-left px-4 py-3 rounded-md border transition-all ${level === opt.value ? 'bg-orange-600/20 border-orange-500 text-orange-200' : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                                >
                                    {opt.display}
                                </button>
                            ))}
                        </div>
                    </section>

                    <button onClick={handleGenerate} disabled={isLoading || !sourceImage} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed text-base">
                        <Icon name="sparkles" className="w-5 h-5" />
                        {isLoading ? t('generatingUpscale') : t('generateUpscaleButton')}
                    </button>
                </div>
                <div className="lg:col-span-8 bg-slate-900/50 rounded-lg min-h-[60vh] flex items-center justify-center p-4 border border-slate-700">
                    {isLoading ? (
                        <div className="text-center text-slate-400">
                            <Icon name="sparkles" className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                            <p>{t('generatingUpscale')}...</p>
                        </div>
                    ) : generatedImages.length > 0 && selectedImage ? (
                        <div className="flex flex-col h-full w-full">
                            <div className="flex-grow flex items-center justify-center relative group bg-black/30 rounded-lg overflow-hidden">
                                <img src={selectedImage} alt="Selected Upscaled Image" className="max-w-full max-h-[65vh] object-contain" />
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button onClick={() => selectedImage && setFullscreenImage(selectedImage)} className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 hover:bg-slate-700 text-white p-2.5 rounded-full" title={t('fullscreen')}>
                                        <Icon name="arrows-pointing-out" className="w-5 h-5" />
                                    </button>
                                    <a href={selectedImage} download={`aicomplex-upscaled-${Date.now()}.png`} className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 hover:bg-slate-700 text-white p-2.5 rounded-full inline-flex" title={t('downloadImage')}>
                                        <Icon name="download" className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                            {/* Comparison view or thumbnail if we generated multiple variations (currently usually 1) */}
                            {generatedImages.length > 1 && (
                                <div className={`flex-shrink-0 mt-4 grid grid-cols-${Math.min(generatedImages.length, 4)} gap-2`}>
                                    {generatedImages.map((image, index) => (
                                        <div key={index} className={`relative cursor-pointer rounded-md overflow-hidden transition-all duration-200 h-28 ${selectedImage === image ? 'ring-2 ring-orange-500' : 'opacity-60 hover:opacity-100'}`} onClick={() => setSelectedImage(image)}>
                                            <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500">
                            <Icon name="sparkles" className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400">{t('upscaleTitle')}</h3>
                            <p className="mt-2">{t('upscaleEmptyText')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};