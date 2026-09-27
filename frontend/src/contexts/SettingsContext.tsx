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
    appName: 'SIMRS Klinik',
    appLogo: '',
    appIcon: '',
    loading: true,
    refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appName, setAppName] = useState('SIMRS Klinik');
    const [appLogo, setAppLogo] = useState('');
    const [appIcon, setAppIcon] = useState('');
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const res = await api.get('/settings');
            const data = res.data;
            if (data.app_name) setAppName(data.app_name);
            if (data.app_logo) setAppLogo(getApiUrl(data.app_logo));
            if (data.app_icon) {
                const iconUrl = getApiUrl(data.app_icon);
                setAppIcon(iconUrl);
                // Update favicon dynamically
                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = iconUrl;
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
        document.title = appName;
    }, [appName]);

    return (
        <SettingsContext.Provider value={{ appName, appLogo, appIcon, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
