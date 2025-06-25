import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { storeContext } from "../../../Store";
import Styles from "./SideBarHeader.module.scss";

const SideBarHeader = (props) => {
    const { user } = props;
    const { 
        getNotifications, 
        getNotificationCount, 
        markNotificationAsViewed, 
        markAllNotificationsAsViewed
    } = useContext(storeContext);
    
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [hasMilestoneNotifications, setHasMilestoneNotifications] = useState(false);
    
    const userDropdownRef = useRef(null);
    const history = useHistory();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Optimized function that only fetches count (for polling)
    const fetchNotificationCountOnly = useCallback(async () => {
        try {
            const count = await getNotificationCount();
            setNotificationCount(count);
            
            // Only clear milestone status if count is 0
            if (count === 0) {
                setHasMilestoneNotifications(false);
            }
            // Don't fetch full notifications during polling - only when dropdown opens
        } catch (error) {
            console.error("Error fetching notification count:", error);
        }
    }, [getNotificationCount]);

    // Fetch notification count only on component mount (page refresh)
    useEffect(() => {
        if (user?.token) {
            // Only fetch count on mount/page refresh, no automatic polling
            fetchNotificationCountOnly();
        }
    }, [user, fetchNotificationCountOnly]);



    const fetchNotifications = async () => {
        try {
            const notifs = await getNotifications();
            setNotifications(notifs);
            
            // Update count and milestone status when fetching full notifications
            const unviewedCount = notifs.filter(n => !n.isViewed).length;
            setNotificationCount(unviewedCount);
            
            // Check if there are any unviewed milestone notifications
            const unviewedMilestones = notifs.filter(n => 
                n.type === 'newMilestone' && !n.isViewed
            );
            setHasMilestoneNotifications(unviewedMilestones.length > 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleSignOut = () => {
        setShowUserDropdown(false);
        history.push('/auth/signin');
    };

    const handleSettings = () => {
        setShowUserDropdown(false);
        history.push('/settings');
    };

    const toggleUserDropdown = () => {
        setShowUserDropdown(!showUserDropdown);
        setShowNotificationModal(false);
    };

    const toggleNotificationModal = async () => {
        setShowNotificationModal(!showNotificationModal);
        setShowUserDropdown(false);
        
        // Only fetch full notifications when opening modal
        if (!showNotificationModal) {
            await fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isViewed) {
            await markNotificationAsViewed(notification._id);
            // Remove from local state immediately (hide from modal)
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
            // Update count
            await fetchNotificationCountOnly();
        }
        
        // If it's a milestone notification, show the congrats modal
        if (notification.type === 'newMilestone') {
            setShowNotificationModal(false);
            // Call the global function to show congrats modal
            if (window.showMilestoneCongrats) {
                window.showMilestoneCongrats(notification);
            }
        }
    };

    const handleMarkAllAsViewed = async () => {
        await markAllNotificationsAsViewed();
        // Clear all notifications from modal
        setNotifications([]);
        setNotificationCount(0);
        setHasMilestoneNotifications(false);
    };

    const handleCopySku = async (sku, event) => {
        event.stopPropagation(); // Prevent notification click
        try {
            await navigator.clipboard.writeText(sku);
            // Could add a toast notification here if desired
        } catch (error) {
            console.error('Failed to copy SKU:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = sku;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };



    const formatNotificationMessage = (notification) => {
        // For milestone notifications, just show "Milestone!" without details
        if (notification.type === 'newMilestone') {
            return 'Milestone!';
        }
        
        // For automatic return notifications
        if (notification.type === 'automaticReturn') {
            const { data } = notification;
            const itemTitle = data.itemTitle || `SKU ${data.sku}`;
            
            return itemTitle;
        }

        // For return delivered notifications
        if (notification.type === 'returnDelivered') {
            const { data } = notification;
            return `Return Delivered - ${data.itemTitle || `SKU ${data.itemSku}`}`;
        }
        
        // For other notification types, show detailed message
        const { data } = notification;
        const period = data.category === 'day' ? 'Daily' : data.category === 'week' ? 'Weekly' : 'Monthly';
        const type = data.type.charAt(0).toUpperCase() + data.type.slice(1);
        return `New ${period} ${type} Record: ${data.value}${data.type === 'sales' || data.type === 'spent' ? ' $' : ''}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={Styles.wrapper}>
            {/* User Controls Section */}
            {user?.token && (
                <div className={Styles.userControls}>
                    {/* User Profile Dropdown */}
                    <div className={Styles.userProfile} ref={userDropdownRef}>
                        <div className={Styles.userSection} onClick={toggleUserDropdown}>
                            <span className={Styles.userName}>{user.fname}</span>
                            <i className={`material-icons ${Styles.userIcon}`}>
                                person
                            </i>
                        </div>
                        
                        {showUserDropdown && (
                            <div className={Styles.dropdown}>
                                <button 
                                    className={Styles.dropdownItem}
                                    onClick={handleSettings}
                                >
                                    <i className="material-icons">settings</i>
                                    Settings
                                </button>
                                <button 
                                    className={Styles.dropdownItem}
                                    onClick={handleSignOut}
                                >
                                    <i className="material-icons">logout</i>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className={Styles.notificationWrapper}>
                        <div className={`${Styles.notificationIcon} ${notificationCount > 0 ? Styles.hasNotifications : ''} ${hasMilestoneNotifications ? Styles.hasMilestones : ''}`} onClick={toggleNotificationModal}>
                            {notificationCount > 0 ? (
                                <>
                                    <i className="material-icons">notifications_active</i>
                                    <span className={Styles.notificationBadge}>{notificationCount}</span>
                                </>
                            ) : (
                                <i className="material-icons">notifications</i>
                            )}
                        </div>
                    </div>
                </div>
            )}
                        
            {showNotificationModal && (
                <div className={Styles.notificationModalOverlay} onClick={() => setShowNotificationModal(false)}>
                    <div className={Styles.notificationModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={Styles.notificationModalHeader}>
                            <h2>🔔 Notifications</h2>
                            <button className={Styles.closeButton} onClick={() => setShowNotificationModal(false)}>×</button>
                        </div>
                        
                        <div className={Styles.notificationModalBody}>
                                    {notifications.length > 0 && (
                                <div className={Styles.notificationActions}>
                                        <button 
                                        className={Styles.markAllViewedBtn}
                                            onClick={handleMarkAllAsViewed}
                                        >
                                        Mark all as read
                                        </button>
                                </div>
                            )}
                                
                            <div className={Styles.notificationModalList}>
                                    {notifications.length === 0 ? (
                                        <div className={Styles.emptyNotifications}>
                                            <i className="material-icons">notifications_none</i>
                                        <span>No notifications yet</span>
                                        <p>You'll see your milestone achievements and updates here</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div 
                                                key={notification._id}
                                            className={`${Styles.notificationModalItem} ${!notification.isViewed ? Styles.unviewed : ''} ${notification.type === 'newMilestone' ? Styles.milestone : ''} ${notification.type === 'automaticReturn' ? Styles.automaticReturn : ''} ${notification.type === 'returnDelivered' ? Styles.returnDelivered : ''}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                            <div className={Styles.notificationIcon}>
                                                {notification.type === 'newMilestone' ? '🏆' : notification.type === 'automaticReturn' ? '↩️' : notification.type === 'returnDelivered' ? '📦' : '🎉'}
                                            </div>
                                                <div className={Styles.notificationContent}>
                                                    <div className={Styles.notificationMessage}>
                                                    {formatNotificationMessage(notification)}
                                                    </div>
                                                {notification.type === 'automaticReturn' && (
                                                    <div className={Styles.notificationDate}>
                                                        {formatDate(notification.date)}
                                                    </div>
                                                )}
                                                    <div className={Styles.notificationDate}>
                                                        {notification.type === 'newMilestone' 
                                                            ? `${formatDate(notification.date)} • Click to view details` 
                                                            : notification.type === 'automaticReturn'
                                                            ? `Returned → Relisted • $${notification.data.returnShippingCost || '0.00'} return cost • New profit: $${notification.data.newExpectedProfit || '0.00'}`
                                                            : notification.type === 'returnDelivered'
                                                            ? `${notification.data.carrierUsed || 'Unknown carrier'} delivery • ${notification.data.trackingNumber || 'No tracking'} • ${formatDate(notification.date)}`
                                                            : `${notification.data.dateTitle} • ${formatDate(notification.date)}`
                                                        }
                                                    </div>
                                                </div>
                                            
                                            {(notification.type === 'automaticReturn' || notification.type === 'returnDelivered') && (
                                                <button
                                                    className={Styles.copySkuBtn}
                                                    onClick={(e) => handleCopySku(notification.data.sku || notification.data.itemSku, e)}
                                                    title="Copy SKU"
                                                >
                                                    <i className="material-icons">content_copy</i>
                                                </button>
                                            )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SideBarHeader;