import React, { useState, useRef, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { storeContext } from "../../Store";
import Styles from "./Header.module.scss";

const Header = (props) => {
    const { user } = props;
    const { 
        getNotifications, 
        getNotificationCount, 
        markNotificationAsViewed, 
        markAllNotificationsAsViewed,
        deleteNotification 
    } = useContext(storeContext);
    
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [hasMilestoneNotifications, setHasMilestoneNotifications] = useState(false);
    
    const userDropdownRef = useRef(null);
    const notificationDropdownRef = useRef(null);
    const history = useHistory();

    // Fetch notification count only on component mount (page refresh)
    useEffect(() => {
        if (user?.token) {
            // Only fetch count on mount/page refresh, no automatic polling
            fetchNotificationCountOnly();
        }
    }, [user]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setShowNotificationDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Optimized function that only fetches count (for polling)
    const fetchNotificationCountOnly = async () => {
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
    };

    // Function to fetch full notifications and check milestone status
    const fetchNotificationCount = async () => {
        try {
            const count = await getNotificationCount();
            setNotificationCount(count);
            
            // Only fetch full notifications if count > 0
            if (count > 0) {
                const notifs = await getNotifications();
                const unviewedMilestones = notifs.filter(n => 
                    n.type === 'newMilestone' && !n.isViewed
                );
                setHasMilestoneNotifications(unviewedMilestones.length > 0);
            } else {
                setHasMilestoneNotifications(false);
            }
        } catch (error) {
            console.error("Error fetching notification count:", error);
        }
    };

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

    const toggleUserDropdown = () => {
        setShowUserDropdown(!showUserDropdown);
        setShowNotificationDropdown(false);
    };

    const toggleNotificationDropdown = async () => {
        setShowNotificationDropdown(!showNotificationDropdown);
        setShowUserDropdown(false);
        
        // Only fetch full notifications when opening dropdown
        if (!showNotificationDropdown) {
            await fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isViewed) {
            await markNotificationAsViewed(notification._id);
            // Update local state immediately for better UX
            setNotifications(prev => prev.map(n => 
                n._id === notification._id ? { ...n, isViewed: true } : n
            ));
            // Only fetch count, not full notifications again
            await fetchNotificationCountOnly();
        }
        
        // If it's a milestone notification, show the congrats modal
        if (notification.type === 'newMilestone') {
            setShowNotificationDropdown(false);
            // Call the global function to show congrats modal
            if (window.showMilestoneCongrats) {
                window.showMilestoneCongrats(notification);
            }
        }
    };

    const handleMarkAllAsViewed = async () => {
        await markAllNotificationsAsViewed();
        // Update local state immediately
        setNotifications(prev => prev.map(n => ({ ...n, isViewed: true })));
        setNotificationCount(0);
        setHasMilestoneNotifications(false);
        // No need to refetch - we already updated the state
    };

    const handleDeleteNotification = async (notificationId, event) => {
        event.stopPropagation();
        await deleteNotification(notificationId);
        // Update local state immediately
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Only fetch count to update badge
        await fetchNotificationCountOnly();
    };

    const formatNotificationMessage = (notification) => {
        // For milestone notifications, just show "Milestone!" without details
        if (notification.type === 'newMilestone') {
            return 'Milestone!';
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
           <div className="spacer"></div>
           
           {/* Notifications */}
           {user?.token && (
               <div className={Styles.notificationWrapper} ref={notificationDropdownRef}>
                   <div className={`${Styles.notificationIcon} ${notificationCount > 0 ? Styles.hasNotifications : ''} ${hasMilestoneNotifications ? Styles.hasMilestones : ''}`} onClick={toggleNotificationDropdown}>
                       {notificationCount > 0 ? (
                           <>
                               <i className="material-icons">notifications_active</i>
                               <span className={Styles.notificationBadge}>{notificationCount}</span>
                           </>
                       ) : (
                           <i className="material-icons">notifications</i>
                       )}
                   </div>
                   
                   {showNotificationDropdown && (
                       <div className={Styles.notificationDropdown}>
                           <div className={Styles.notificationHeader}>
                               <span>Notifications</span>
                               {notifications.length > 0 && (
                                   <button 
                                       className={Styles.markAllBtn}
                                       onClick={handleMarkAllAsViewed}
                                   >
                                       Mark all read
                                   </button>
                               )}
                           </div>
                           
                           <div className={Styles.notificationList}>
                               {notifications.length === 0 ? (
                                   <div className={Styles.emptyNotifications}>
                                       <i className="material-icons">notifications_none</i>
                                       <span>No notifications</span>
                                   </div>
                               ) : (
                                   notifications.map((notification) => (
                                       <div 
                                           key={notification._id}
                                           className={`${Styles.notificationItem} ${!notification.isViewed ? Styles.unviewed : ''} ${notification.type === 'newMilestone' ? Styles.milestone : ''}`}
                                           onClick={() => handleNotificationClick(notification)}
                                       >
                                                                                          <div className={Styles.notificationContent}>
                                                   <div className={Styles.notificationMessage}>
                                                       {notification.type === 'newMilestone' ? '🏆' : '🎉'} {formatNotificationMessage(notification)}
                                                   </div>
                                                   <div className={Styles.notificationDate}>
                                                       {notification.type === 'newMilestone' 
                                                           ? `${formatDate(notification.date)} • Click to view details` 
                                                           : `${notification.data.dateTitle} • ${formatDate(notification.date)}`
                                                       }
                                                   </div>
                                               </div>
                                           <button 
                                               className={Styles.deleteBtn}
                                               onClick={(e) => handleDeleteNotification(notification._id, e)}
                                               title="Delete notification"
                                           >
                                               <i className="material-icons">close</i>
                                           </button>
                                       </div>
                                   ))
                               )}
                           </div>
                       </div>
                   )}
               </div>
           )}
           
           {/* User Profile Dropdown */}
           {user?.token && (
               <div className={Styles.userProfile} ref={userDropdownRef}>
                   <i 
                       className={`material-icons ${Styles.userIcon}`}
                       onClick={toggleUserDropdown}
                   >
                       person
                   </i>
                   
                   {showUserDropdown && (
                       <div className={Styles.dropdown}>
                           <div className={Styles.dropdownHeader}>
                               <span className={Styles.userName}>{user.fname}</span>
                               <span className={Styles.userEmail}>{user.email}</span>
                           </div>
                           <div className={Styles.dropdownDivider}></div>
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
           )}
        </div>
    );
}

export default Header;