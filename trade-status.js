(function() {
    'use strict';

    async function checkTradeStatus(tradeId) {
        try {
            const result = await BridgeUtils.callBridgeMethod('getTradeStatus', { tradeId }, 15000);
            return result;
        } catch (error) {
            if (error.message.includes('timeout')) {
                return { status: 'pending' };
            }
            return { status: 'pending' };
        }
    }

    async function updateTradeStatuses() {
        const pendingTrades = Storage.get('pendingExtensionTrades', []);
        if (pendingTrades.length === 0) return;

        const statusChecks = await Promise.all(
            pendingTrades.map(trade => checkTradeStatus(trade.id))
        );

        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);
        const stillPending = [];

        pendingTrades.forEach((trade, index) => {
            const status = statusChecks[index].status;

            if (status === 'pending') {
                stillPending.push(trade);
            } else {
                finalizedTrades.push({
                    ...trade,
                    status: status,
                    finalizedAt: Date.now()
                });
            }
        });

        Storage.setBatch({
            'pendingExtensionTrades': stillPending,
            'finalizedExtensionTrades': finalizedTrades
        });
    }

    let statusCheckInterval = null;

    function startTradeStatusMonitoring() {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }

        checkAndUpdateTradeStatuses();
        statusCheckInterval = setInterval(checkAndUpdateTradeStatuses, 5 * 60 * 1000);
        if (window.tradeStatusIntervals) {
            window.tradeStatusIntervals.add(statusCheckInterval);
        } else {
            window.tradeStatusIntervals = new Set([statusCheckInterval]);
        }
    }

    async function checkAndUpdateTradeStatuses() {
        const pendingTrades = Storage.get('pendingExtensionTrades', []);
        if (pendingTrades.length === 0) return;

        await checkRobloxTradeStatuses();
    }

    function playNotificationSound() {
        try {
            if (!chrome || !chrome.runtime || !chrome.runtime.getURL) {
                return;
            }
            const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (error) {
        }
    }

    const NOTIFICATION_CONFIGS = {
        'completed': { message: (user, tradeName) => `Trade status with User ${user} (Template: ${tradeName}): Accepted`, type: 'success' },
        'accepted': { message: (user, tradeName) => `Trade status with User ${user} (Template: ${tradeName}): Accepted`, type: 'success' },
        'countered': { message: (user, tradeName) => `Trade status with User ${user} (Template: ${tradeName}): Countered`, type: 'info' },
        'declined': { message: (user, tradeName) => `Trade status with User ${user} (Template: ${tradeName}): Declined`, type: 'error' },
        'expired': { message: (user, tradeName) => `Trade status with User ${user} (Template: ${tradeName}): Declined`, type: 'error' }
    };

    function getNotificationConfig(trade, status) {
        const userName = trade.user || `User ${trade.targetUserId}`;
        const tradeName = trade.tradeName || trade.name || 'Unknown Trade';
        const config = NOTIFICATION_CONFIGS[status] || { message: (user, name) => `Trade status with User ${user} (Template: ${name}): ${status}`, type: 'info' };
        return { message: config.message(userName, tradeName), type: config.type };
    }

    function hasBeenNotified(tradeId, status) {
        const notifiedTrades = Storage.get('notifiedTrades', []);
        return notifiedTrades.includes(`${tradeId}-${status}`);
    }

    function markAsNotified(tradeId, status) {
        const notifiedTrades = Storage.get('notifiedTrades', []);
        notifiedTrades.push(`${tradeId}-${status}`);
        Storage.set('notifiedTrades', notifiedTrades);
    }

    function createNotificationElement(message, type, customHTML = null) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.id = `trade-notification-${Date.now()}`;
        
        if (customHTML) {
            notification.innerHTML = customHTML;
        } else {
            notification.textContent = message;
        }
        
        const baseStyles = {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            padding: customHTML ? '0' : '14px 24px', borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: '999999',
            animation: 'slideDownNotification 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fontSize: '14px', fontWeight: '600', maxWidth: '450px',
            wordWrap: 'break-word', backdropFilter: 'blur(10px)',
            pointerEvents: 'auto'
        };

        const typeStyles = {
            'success': { background: 'rgba(40, 167, 69, 0.95)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' },
            'error': { background: 'rgba(220, 53, 69, 0.95)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' },
            'info': { background: 'rgba(0, 123, 255, 0.95)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }
        };

        Object.assign(notification.style, baseStyles, typeStyles[type] || typeStyles.info);
        return notification;
    }

    function createDeclinedTradeCard(trade) {
        const receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
        const robuxGet = Number(trade.robuxGet) || 0;
        const userName = trade.user || `User ${trade.targetUserId}`;
        
        const renderItemIcon = (item) => {
            const itemId = String(item.id || item.itemId || '').trim();
            const itemName = item.name || 'Unknown Item';
            return `<div class="item-icon" data-item-id="${itemId}" data-id="${itemId}" data-item-name="${itemName}" style="width: 32px; height: 32px; font-size: 9px;" title="${itemName}">${itemName.substring(0, 2).toUpperCase()}</div>`;
        };

        const renderRobuxIcon = (amount) => {
            if (amount <= 0) return '';
            const display = amount >= 1000 ? (amount / 1000).toFixed(1) + 'K' : amount.toLocaleString();
            return `<div class="item-icon robux-icon" style="background: #00d26a; color: white; font-size: 9px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold;">R${display}</div>`;
        };

        return `
            <div style="padding: 16px; max-width: 420px;">
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px; text-align: center;">
                    Trade Declined with ${userName}
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 12px;">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; opacity: 0.9;">YOU GET</div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${receiving.map(renderItemIcon).join('')}
                        ${renderRobuxIcon(robuxGet)}
                    </div>
                </div>
            </div>
        `;
    }

    function showTradeNotification(trade, status) {
        if (hasBeenNotified(trade.id, status)) return;

        markAsNotified(trade.id, status);

        const { message, type } = getNotificationConfig(trade, status);

        playNotificationSound();
        
        const notification = createNotificationElement(message, type);
        
        if (document.body) {
            document.body.appendChild(notification);
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.body) {
                    document.body.appendChild(notification);
                    obs.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideUpNotification 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 4000);
    }

    function moveTradeToFinalized(trade, status) {
        let pendingTrades = Storage.get('pendingExtensionTrades', []);
        const wasPending = pendingTrades.some(t => t.id === trade.id);
        pendingTrades = pendingTrades.filter(t => t.id !== trade.id);
        Storage.set('pendingExtensionTrades', pendingTrades);

        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);
        const existingIndex = finalizedTrades.findIndex(t => t.id === trade.id);
        
        const finalizedTrade = {
            ...trade,
            status: status,
            finalizedAt: Date.now()
        };

        if (existingIndex >= 0) {
            finalizedTrades[existingIndex] = finalizedTrade;
        } else {
            finalizedTrades.push(finalizedTrade);
        }
        Storage.set('finalizedExtensionTrades', finalizedTrades);

        if (wasPending && (status === 'completed' || status === 'accepted' || status === 'countered' || status === 'declined')) {
            showTradeNotification(trade, status);
        }

        const outboundSection = document.getElementById('outbound-section');
        if (outboundSection && outboundSection.style.display === 'block') {
            setTimeout(() => {
                if (typeof TradeLoading.loadOutboundTrades === 'function') {
                    TradeLoading.loadOutboundTrades();
                }
            }, 500);
        }
    }

    function startAutoUpdateSystem() {
        const UPDATE_INTERVAL = 15 * 1000;

        if (window.autoUpdateTimer) {
            clearInterval(window.autoUpdateTimer);
            if (window.tradeStatusIntervals) {
                window.tradeStatusIntervals.delete(window.autoUpdateTimer);
            }
        }

        window.autoUpdateTimer = setInterval(() => {
        if (window.tradeStatusIntervals) {
            window.tradeStatusIntervals.add(window.autoUpdateTimer);
        } else {
            window.tradeStatusIntervals = new Set([window.autoUpdateTimer]);
        }
            const isAutoTradesPage = document.body.classList.contains('path-auto-trades') ||
                                   document.body.classList.contains('path-auto-trades-send');

            if (isAutoTradesPage) {
                checkRobloxTradeStatuses().then(movedCount => {
                }).catch(error => {
                });

                const activeTab = document.querySelector('.filter-btn.active');
                if (activeTab) {
                    const filter = activeTab.getAttribute('data-filter');

                    switch(filter) {
                        case 'outbound':
                            if (typeof TradeLoading.loadOutboundTrades === 'function') {
                                TradeLoading.loadOutboundTrades();
                            }
                            break;
                        case 'expired':
                            if (typeof TradeLoading.loadExpiredTrades === 'function') {
                                TradeLoading.loadExpiredTrades();
                            }
                            break;
                        case 'countered':
                            if (typeof TradeLoading.loadCounteredTrades === 'function') {
                                TradeLoading.loadCounteredTrades();
                            }
                            break;
                        case 'completed':
                            if (typeof TradeLoading.loadCompletedTrades === 'function') {
                                TradeLoading.loadCompletedTrades();
                            }
                            break;
                    }

                    setTimeout(() => {
                        const activeContainer = document.querySelector('.trades-grid[style*="block"]');
                        if (activeContainer) {
                            const containerId = activeContainer.id;
                            if (typeof TradeDisplay.loadEnhancedTradeItemThumbnails === 'function') {
                                TradeDisplay.loadEnhancedTradeItemThumbnails(containerId);
                            }
                        }
                    }, 1000);
                }
            }
        }, UPDATE_INTERVAL);
    }

    const STATUS_MAPPING = {
        "Open": "outbound",
        "Declined": "declined",
        "Accepted": "accepted",
        "Expired": "declined",
        "Completed": "completed",
        "Countered": "countered"
    };

    function mapRobloxStatusToInternal(robloxStatus) {
        return STATUS_MAPPING[robloxStatus] || 'unknown';
    }

    function getOldestPendingTradeTime(pendingTrades) {
        if (pendingTrades.length === 0) return 0;
        
        const oldestTrade = pendingTrades.reduce((oldest, trade) => {
            const tradeTime = new Date(trade.created || trade.timestamp || 0).getTime();
            const oldestTime = new Date(oldest.created || oldest.timestamp || 0).getTime();
            return tradeTime < oldestTime ? trade : oldest;
        }, pendingTrades[0]);
        
        return new Date(oldestTrade.created || oldestTrade.timestamp || 0).getTime();
    }

    async function fetchOutboundTradesPage(cursor, limit) {
        let url = `https://trades.roblox.com/v1/trades/outbound?limit=${limit}&sortOrder=Desc`;
        if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
        }

        const result = await Utils.safeFetch(url, {
            method: 'GET',
            timeout: 10000,
            retries: 2
        });

        if (result.ok && result.data) {
            const responseData = result.data;
            return {
                data: Utils.ensureArray(responseData.data, []),
                nextPageCursor: responseData.nextPageCursor || null,
                previousPageCursor: responseData.previousPageCursor || null
            };
        }

        return { data: [], nextPageCursor: null, previousPageCursor: null };
    }

    async function findPendingTradesInPaginatedList(pendingTradeIds, oldestPendingTime) {
        const foundTradeIds = new Set();
        let cursor = '';
        let pagesChecked = 0;
        const MAX_PAGES = 50;

        while (pagesChecked < MAX_PAGES) {
            const pageData = await fetchOutboundTradesPage(cursor, 100);
            
            if (!pageData?.data?.length) break;

            let shouldStop = false;
            for (const tradeData of pageData.data) {
                const tradeId = String(tradeData.id);
                const tradeCreatedTime = new Date(tradeData.created).getTime();
                
                if (pendingTradeIds.has(tradeId)) {
                    foundTradeIds.add(tradeId);
                }
                
                if (tradeCreatedTime < oldestPendingTime) {
                    shouldStop = true;
                    break;
                }
            }

            if (shouldStop || !pageData.nextPageCursor) break;

            cursor = pageData.nextPageCursor;
            pagesChecked++;
        }

        return foundTradeIds;
    }

    async function fetchStatusForChangedTrades(tradeIds) {
        const statusMap = new Map();

        for (const tradeId of tradeIds) {
            const result = await Utils.safeFetch(`https://trades.roblox.com/v1/trades/${tradeId}`, {
                method: 'GET',
                timeout: 8000,
                retries: 1
            });

            if (result.ok && result.data && typeof result.data.status === 'string') {
                statusMap.set(tradeId, result.data.status);
            }
            
            await Utils.delay(200);
        }

        return statusMap;
    }

    function processStatusUpdates(pendingTrades, tradeStatusMap) {
        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);
        const stillPending = [];
        const movedTrades = [];

        for (const trade of pendingTrades) {
            const tradeId = String(trade.id);
            const robloxStatus = tradeStatusMap.get(tradeId);
            
            if (!robloxStatus) {
                stillPending.push(trade);
                continue;
            }

            const mappedStatus = mapRobloxStatusToInternal(robloxStatus);
            
            if (mappedStatus === 'outbound') {
                stillPending.push(trade);
            } else {
                const finalizedTrade = {
                    ...trade,
                    status: mappedStatus,
                    finalizedAt: Date.now(),
                    robloxStatus: robloxStatus,
                    giving: Array.isArray(trade.giving) ? trade.giving : [],
                    receiving: Array.isArray(trade.receiving) ? trade.receiving : [],
                    robuxGive: Number(trade.robuxGive) || 0,
                    robuxGet: Number(trade.robuxGet) || 0
                };
                finalizedTrades.push(finalizedTrade);
                movedTrades.push(finalizedTrade);
            }
        }

        return { stillPending, finalizedTrades, movedTrades };
    }

    function notifyAndRefreshUI(movedTrades) {
        movedTrades.forEach(trade => {
            const shouldNotify = ['completed', 'accepted', 'countered', 'declined'].includes(trade.status);
            if (shouldNotify) {
                showTradeNotification(trade, trade.status);
            }
        });

        if (movedTrades.length > 0) {
            if (typeof TradeLoading.loadOutboundTrades === 'function') TradeLoading.loadOutboundTrades();
            if (typeof TradeLoading.loadExpiredTrades === 'function') TradeLoading.loadExpiredTrades();
            if (typeof TradeLoading.loadCompletedTrades === 'function') TradeLoading.loadCompletedTrades();
        }
    }

    async function checkRobloxTradeStatuses() {
        const pendingTrades = Storage.get('pendingExtensionTrades', []);

        if (pendingTrades.length === 0) {
            return 0;
        }

        const pendingTradeIds = new Set(pendingTrades.map(t => String(t.id)));
        const oldestPendingTime = getOldestPendingTradeTime(pendingTrades);

        const foundInPaginatedList = await findPendingTradesInPaginatedList(pendingTradeIds, oldestPendingTime);

        const tradesToCheckIndividually = Array.from(pendingTradeIds).filter(id => !foundInPaginatedList.has(id));
        
        const tradeStatusMap = new Map();
        foundInPaginatedList.forEach(tradeId => tradeStatusMap.set(tradeId, 'Open'));

        if (tradesToCheckIndividually.length > 0) {
            const individualStatusMap = await fetchStatusForChangedTrades(tradesToCheckIndividually);
            individualStatusMap.forEach((status, tradeId) => tradeStatusMap.set(tradeId, status));
        }

        const { stillPending, finalizedTrades, movedTrades } = processStatusUpdates(pendingTrades, tradeStatusMap);

        if (movedTrades.length > 0) {
            Storage.set('pendingExtensionTrades', stillPending);
            Storage.set('finalizedExtensionTrades', finalizedTrades);
            notifyAndRefreshUI(movedTrades);
        }

        return movedTrades.length;
    }

    function cleanupTradeCategories() {
        const pendingTrades = Storage.get('pendingExtensionTrades', []);
        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);

        let moveCount = 0;

        const toMove = pendingTrades.filter(trade =>
            trade.status && ['declined', 'accepted', 'completed', 'expired'].includes(trade.status)
        );

        if (toMove.length > 0) {
            toMove.forEach(trade => {
                trade.finalizedAt = trade.finalizedAt || Date.now();
                finalizedTrades.push(trade);
            });

            const remainingPending = pendingTrades.filter(trade => !toMove.includes(trade));
            Storage.set('pendingExtensionTrades', remainingPending);
            Storage.set('finalizedExtensionTrades', finalizedTrades);
            moveCount = toMove.length;
        }

        return moveCount;
    }

    function cleanupOldNotifications() {
        const notifiedTrades = Storage.get('notifiedTrades', []);
        if (notifiedTrades.length > 1000) {
            Storage.set('notifiedTrades', notifiedTrades.slice(-500));
        }
    }

    window.TradeStatus = {
        checkTradeStatus,
        updateTradeStatuses,
        startTradeStatusMonitoring,
        checkAndUpdateTradeStatuses,
        moveTradeToFinalized,
        startAutoUpdateSystem,
        checkRobloxTradeStatuses,
        cleanupTradeCategories,
        showTradeNotification
    };

    window.checkTradeStatus = checkTradeStatus;
    window.updateTradeStatuses = updateTradeStatuses;
    window.startTradeStatusMonitoring = startTradeStatusMonitoring;
    window.checkAndUpdateTradeStatuses = checkAndUpdateTradeStatuses;
    window.moveTradeToFinalized = moveTradeToFinalized;
    window.startAutoUpdateSystem = startAutoUpdateSystem;
    window.checkRobloxTradeStatuses = checkRobloxTradeStatuses;
    window.cleanupTradeCategories = cleanupTradeCategories;
    window.showTradeNotification = showTradeNotification;

    // Cleanup old notifications periodically
    const notificationCleanupInterval = setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000);
    if (window.tradeStatusIntervals) {
        window.tradeStatusIntervals.add(notificationCleanupInterval);
    } else {
        window.tradeStatusIntervals = new Set([notificationCleanupInterval]);
    }
    cleanupOldNotifications();
})();
