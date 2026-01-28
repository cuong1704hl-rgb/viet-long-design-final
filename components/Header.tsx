import React from 'react';
import { useLanguage } from '../providers/localeContext';
import { Icon } from './icons';

export const Header: React.FC = () => {
    const { t } = useLanguage();
    return (
        <header className="flex flex-col items-center mb-8 text-center relative">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-slate-100" style={{ textShadow: '0 0 20px rgba(99, 102, 241, 0.5), 0 0 5px rgba(255, 255, 255, 0.5)' }}>
                {t('appTitle')}
            </h1>
            <p className="text-slate-400 mt-2 text-sm">{t('developedBy')}</p>
            <p className="text-slate-400 text-sm">{t('sponsoredBy')}</p>
        </header>
    );
}
