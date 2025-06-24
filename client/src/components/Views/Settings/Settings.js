import React, { useState, useEffect, useContext } from 'react';
import { storeContext } from '../../../Store';
import Styles from './Settings.module.scss';

const Settings = () => {
    const { getUserSettings, updateUserSettings } = useContext(storeContext);
    const [settings, setSettings] = useState({
        milestones: true,
        automaticReturns: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const loadSettings = async () => {
        try {
            setLoading(true);
            const userSettings = await getUserSettings();
            if (userSettings && userSettings.notificationSettings) {
                setSettings(userSettings.notificationSettings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            setMessage('Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [getUserSettings]);

    const handleToggle = (settingKey) => {
        setSettings(prev => ({
            ...prev,
            [settingKey]: !prev[settingKey]
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateUserSettings({ notificationSettings: settings });
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('Error saving settings');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={Styles.wrapper}>
                <div className={Styles.loading}>Loading settings...</div>
            </div>
        );
    }

    return (
        <div className={Styles.wrapper}>
            <div className={Styles.header}>
                <h1>Settings</h1>
                <p>Manage your application preferences</p>
            </div>

            <div className={Styles.section}>
                <h2>Notifications</h2>
                <p className={Styles.sectionDescription}>
                    Choose which notifications you'd like to receive
                </p>

                <div className={Styles.settingsList}>
                    <div className={Styles.settingItem}>
                        <div className={Styles.settingInfo}>
                            <h3>Milestone Notifications</h3>
                            <p>Get notified when you reach new high scores for daily, weekly, or monthly records</p>
                        </div>
                        <div className={Styles.toggleWrapper}>
                            <label className={Styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.milestones}
                                    onChange={() => handleToggle('milestones')}
                                />
                                <span className={Styles.slider}></span>
                            </label>
                        </div>
                    </div>

                    <div className={Styles.settingItem}>
                        <div className={Styles.settingInfo}>
                            <h3>Automatic Return Notifications</h3>
                            <p>Get notified when returns are automatically processed and items are restored to active listings</p>
                        </div>
                        <div className={Styles.toggleWrapper}>
                            <label className={Styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.automaticReturns}
                                    onChange={() => handleToggle('automaticReturns')}
                                />
                                <span className={Styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className={Styles.actions}>
                    <button 
                        className={Styles.saveButton}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                {message && (
                    <div className={`${Styles.message} ${message.includes('Error') ? Styles.error : Styles.success}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings; 