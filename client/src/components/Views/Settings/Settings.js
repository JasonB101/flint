import React, { useState } from 'react';
import Styles from './Settings.module.scss';
import Notifications from './Notifications/Notifications';
import Store from './Store/Store';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('notifications');

    const menuItems = [
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'store', label: 'Store', icon: '🏪' }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'notifications':
                return <Notifications />;
            case 'store':
                return <Store />;
            default:
                return <Notifications />;
        }
    };

    return (
        <div className={Styles.wrapper}>
            <div className={Styles.settingsContainer}>
                <div className={Styles.sideMenu}>
                    <div className={Styles.menuItems}>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`${Styles.menuItem} ${activeSection === item.id ? Styles.active : ''}`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <span className={Styles.menuIcon}>{item.icon}</span>
                                <span className={Styles.menuLabel}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={Styles.contentArea}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings; 