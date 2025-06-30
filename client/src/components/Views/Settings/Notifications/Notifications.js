import React, { useState, useEffect, useContext } from 'react';
import { storeContext } from '../../../../Store';
import Styles from './Notifications.module.scss';

const Notifications = () => {
    const { getUserSettings, updateUserSettings } = useContext(storeContext);
    const [settings, setSettings] = useState({
        milestones: true,
        automaticReturns: true
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({});
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
    }, []);

    const handleToggle = async (settingKey) => {
        const newValue = !settings[settingKey];
        const settingName = settingKey === 'milestones' ? 'Milestone' : 'Automatic Return';
        
        // Optimistically update the UI
        setSettings(prev => ({
            ...prev,
            [settingKey]: newValue
        }));

        // Set updating state for this specific setting
        setUpdating(prev => ({ ...prev, [settingKey]: true }));

        try {
            const updatedSettings = { ...settings, [settingKey]: newValue };
            await updateUserSettings({ notificationSettings: updatedSettings });
        } catch (error) {
            console.error('Error updating setting:', error);
            // Revert the optimistic update on error
            setSettings(prev => ({
                ...prev,
                [settingKey]: !newValue
            }));
            setMessage(`Error updating ${settingName.toLowerCase()} notifications`);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            // Clear updating state for this specific setting
            setUpdating(prev => ({ ...prev, [settingKey]: false }));
        }
    };

    if (loading) {
        return (
            <div className={Styles.wrapper}>
                <div className={Styles.loading}>Loading notification settings...</div>
            </div>
        );
    }

    return (
        <div className={Styles.wrapper}>
            <div className={Styles.pageHeader}>
                <h1>Notifications</h1>
                <p>Manage your notification preferences</p>
            </div>

            <div className={Styles.contentCard}>
                <div className={Styles.section}>
                    <h2>Notification Settings</h2>
                    <p className={Styles.sectionDescription}>
                        Choose which notifications you'd like to receive. Changes are saved automatically.
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
                                        disabled={updating.milestones}
                                    />
                                    <span className={`${Styles.slider} ${updating.milestones ? Styles.updating : ''}`}></span>
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
                                        disabled={updating.automaticReturns}
                                    />
                                    <span className={`${Styles.slider} ${updating.automaticReturns ? Styles.updating : ''}`}></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`${Styles.message} ${message.includes('Error') ? Styles.error : Styles.success}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications; 