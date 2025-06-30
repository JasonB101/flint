import React, { useState, useEffect, useContext } from 'react';
import { storeContext } from '../../../../Store';
import Styles from './Store.module.scss';

const Store = () => {
    const { getStoreInfo } = useContext(storeContext);
    const [storeData, setStoreData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const result = await getStoreInfo();
                
                if (result.success) {
                    setStoreData(result.data);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError("Failed to load store information");
                console.error("Store fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [getStoreInfo]);

    const formatSellerLevel = (level) => {
        if (!level) return 'Standard';
        return level.replace(/([A-Z])/g, ' $1').trim();
    };

    const formatSubscription = (subscriptions) => {
        if (!subscriptions || subscriptions.length === 0) return 'Basic';
        if (Array.isArray(subscriptions)) {
            // Filter out FileExchange and format EBayStoreBasic
            const filtered = subscriptions
                .filter(sub => sub !== 'FileExchange')
                .map(sub => {
                    if (sub === 'EBayStoreBasic') return 'eBay Store Basic';
                    return sub;
                });
            return filtered.length > 0 ? filtered.join(', ') : 'Basic';
        }
        // Handle single subscription
        if (subscriptions === 'EBayStoreBasic') return 'eBay Store Basic';
        if (subscriptions === 'FileExchange') return 'Basic';
        return subscriptions;
    };

    const formatFeePercent = (percent) => {
        if (!percent || isNaN(Number(percent))) return 'N/A';
        return `${(Number(percent) * 100).toFixed(1)}%`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={Styles.wrapper}>
                <div className={Styles.loading}>Loading store information...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={Styles.wrapper}>
                <div className={Styles.errorCard}>
                    <h3>❌ Error Loading Store Information</h3>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className={Styles.retryButton}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={Styles.wrapper}>
            {storeData ? (
                <>
                    {/* Store Header with Logo and Name */}
                    <div className={Styles.storeHeader}>
                        <div className={Styles.storeIdentity}>
                            {storeData.store?.logoUrl && (
                                <div className={Styles.logoContainer}>
                                    <img 
                                        src={storeData.store.logoUrl} 
                                        alt="Store Logo" 
                                        className={Styles.storeLogo}
                                    />
                                </div>
                            )}
                            <div className={Styles.storeInfo}>
                                <h1 className={Styles.storeName}>
                                    {storeData.store?.name || 'eBay Store'}
                                </h1>
                                <p className={Styles.storeDescription}>
                                    {storeData.store?.description || 'Professional eBay Store'}
                                </p>
                                {storeData.store?.url && (
                                    <a 
                                        href={storeData.store.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={Styles.visitStoreButton}
                                    >
                                        🏪 Visit Store
                                    </a>
                                )}
                            </div>
                        </div>
                        
                        {/* Seller Status Badges */}
                        <div className={Styles.sellerBadges}>
                            {storeData.seller?.topRatedSeller && (
                                <div className={Styles.badge + ' ' + Styles.topRated}>
                                    ⭐ Top Rated Seller
                                </div>
                            )}
                            {storeData.seller?.idVerified && (
                                <div className={Styles.badge + ' ' + Styles.verified}>
                                    ✅ ID Verified
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className={Styles.contentGrid}>
                        {/* Seller Stats Card */}
                        <div className={Styles.card + ' ' + Styles.sellerStats}>
                            <h2>🌟 Seller Performance</h2>
                            <div className={Styles.statsGrid}>
                                <div className={Styles.statItem}>
                                    <span className={Styles.statLabel}>Feedback Score</span>
                                    <span className={Styles.statValue}>
                                        {storeData.seller?.feedbackScore?.toLocaleString() || '0'}
                                    </span>
                                </div>
                                <div className={Styles.statItem}>
                                    <span className={Styles.statLabel}>Positive Feedback</span>
                                    <span className={Styles.statValue + ' ' + Styles.positive}>
                                        {storeData.seller?.positiveFeedbackPercent && 
                                         !isNaN(Number(storeData.seller.positiveFeedbackPercent)) ? 
                                            `${Number(storeData.seller.positiveFeedbackPercent).toFixed(1)}%` : 'N/A'}
                                    </span>
                                </div>
                                <div className={Styles.statItem}>
                                    <span className={Styles.statLabel}>Seller Level</span>
                                    <span className={Styles.statValue}>
                                        {formatSellerLevel(storeData.seller?.sellerLevel)}
                                    </span>
                                </div>
                                <div className={Styles.statItem}>
                                    <span className={Styles.statLabel}>Registration</span>
                                    <span className={Styles.statValue}>
                                        {formatDate(storeData.seller?.registrationDate)}
                                    </span>
                                </div>
                                <div className={Styles.statItem}>
                                    <span className={Styles.statLabel}>90-Day Sales</span>
                                    <span className={Styles.statValue + ' ' + Styles.sales}>
                                        {storeData.sales?.totalSales ? 
                                            `$${storeData.sales.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                                            'Not Available'}
                                    </span>
                                </div>
                                <div className={Styles.statItem}>
                                    <span className={Styles.statLabel}>Sales Transactions</span>
                                    <span className={Styles.statValue}>
                                        {storeData.sales?.transactionCount ? 
                                            `${storeData.sales.transactionCount} transactions` : 
                                            'Not Available'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings Card */}
                        <div className={Styles.card + ' ' + Styles.accountSettings}>
                            <h2>⚙️ Account Settings</h2>
                            <div className={Styles.settingsGrid}>
                                <div className={Styles.settingItem}>
                                    <span className={Styles.settingLabel}>eBay Fee Percentage</span>
                                    <span className={Styles.settingValue}>
                                        {formatFeePercent(storeData.account?.ebayFeePercent)}
                                    </span>
                                </div>
                                <div className={Styles.settingItem}>
                                    <span className={Styles.settingLabel}>Average Shipping Cost</span>
                                    <span className={Styles.settingValue}>
                                        ${storeData.account?.averageShippingCost || '0.00'}
                                    </span>
                                </div>
                                <div className={Styles.settingItem}>
                                    <span className={Styles.settingLabel}>Subscription</span>
                                    <span className={Styles.settingValue}>
                                        {formatSubscription(storeData.seller?.userSubscription)}
                                    </span>
                                </div>
                                <div className={Styles.settingItem}>
                                    <span className={Styles.settingLabel}>Sync Status</span>
                                    <span className={`${Styles.settingValue} ${storeData.account?.syncedWithEbay ? Styles.synced : Styles.notSynced}`}>
                                        {storeData.account?.syncedWithEbay ? '✅ Synced' : '⏳ Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Store Details Card */}
                        <div className={Styles.card + ' ' + Styles.storeDetails}>
                            <h2>🏪 Store Details</h2>
                            <div className={Styles.detailsGrid}>
                                <div className={Styles.detailItem}>
                                    <span className={Styles.detailLabel}>Store Categories</span>
                                    <span className={Styles.detailValue}>
                                        {storeData.store?.customCategories?.length || 0} categories
                                    </span>
                                </div>
                                <div className={Styles.detailItem}>
                                    <span className={Styles.detailLabel}>Opened On</span>
                                    <span className={Styles.detailValue}>
                                        {formatDate(storeData.store?.lastOpenedTime)}
                                    </span>
                                </div>
                                <div className={Styles.detailItem}>
                                    <span className={Styles.detailLabel}>Good Standing</span>
                                    <span className={`${Styles.detailValue} ${storeData.seller?.goodStanding ? Styles.goodStanding : Styles.notGoodStanding}`}>
                                        {storeData.seller?.goodStanding ? '✅ Yes' : '❌ No'}
                                    </span>
                                </div>
                                <div className={Styles.detailItem}>
                                    <span className={Styles.detailLabel}>User ID</span>
                                    <span className={Styles.detailValue}>
                                        {storeData.seller?.userId || 'Not available'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Store Categories Card */}
                        {storeData.store?.customCategories && storeData.store.customCategories.length > 0 && (
                            <div className={Styles.card + ' ' + Styles.categoriesCard}>
                                <h2>📁 Store Categories ({storeData.store.customCategories.length})</h2>
                                <div className={Styles.categoriesList}>
                                    {storeData.store.customCategories.map((category, index) => (
                                        <div key={index} className={Styles.categoryItem}>
                                            <span className={Styles.categoryName}>{category.Name}</span>
                                            <span className={Styles.categoryOrder}>#{category.Order}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className={Styles.noStoreContainer}>
                    <div className={Styles.noStore}>
                        <h1>🏪 No eBay Store Found</h1>
                        <p>You don't appear to have an active eBay store, or we couldn't retrieve your store information.</p>
                        <p>Consider upgrading to an eBay Store subscription to access advanced selling features.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store; 