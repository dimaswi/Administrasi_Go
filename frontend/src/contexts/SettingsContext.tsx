import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getApiUrl } from '@/lib/api';

interface SettingsContextType {
    appName: string;
    appLogo: string;
    appIcon: string;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    appName: 'SIMKEP',
    appLogo: '',
    appIcon: '',
    loading: true,
    refreshSettings: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const updateFavicon = (url: string) => {
    if (!url) return;
    // Remove existing favicon link tags to prevent conflicts in browser
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(el => el.parentNode?.removeChild(el));

    const link = document.createElement('link');
    link.id = 'app-favicon';
    link.rel = 'icon';
    if (url.endsWith('.svg')) {
        link.type = 'image/svg+xml';
    } else if (url.endsWith('.png')) {
        link.type = 'image/png';
    } else if (url.endsWith('.ico')) {
        link.type = 'image/x-icon';
    } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        link.type = 'image/jpeg';
    }
    link.href = url;
    document.head.appendChild(link);
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appName, setAppName] = useState(() => localStorage.getItem('app_name') || 'SIMKEP');
    const [appLogo, setAppLogo] = useState(() => localStorage.getItem('app_logo') || '');
    const [appIcon, setAppIcon] = useState(() => localStorage.getItem('app_icon') || '');
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const res = await api.get('/settings');
            const data = res.data;
            if (data.app_name) {
                setAppName(data.app_name);
                localStorage.setItem('app_name', data.app_name);
            }
            if (data.app_logo) {
                const logoUrl = getApiUrl(data.app_logo);
                setAppLogo(logoUrl);
                localStorage.setItem('app_logo', logoUrl);
            }
            if (data.app_icon) {
                const iconUrl = getApiUrl(data.app_icon);
                setAppIcon(iconUrl);
                localStorage.setItem('app_icon', iconUrl);
                updateFavicon(iconUrl);
            } else {
                localStorage.removeItem('app_icon');
                updateFavicon('/favicon.svg');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    // Update document title when appName changes
    useEffect(() => {
        if (appName) {
            document.title = appName;
        }
    }, [appName]);

    return (
        <SettingsContext.Provider value={{ appName, appLogo, appIcon, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
