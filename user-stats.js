(function() {
    'use strict';

    async function getCachedUserStats(userIds) {
        if (!window.globalUserStats) {
            window.globalUserStats = new Map();
        }

        const missingIds = [];
        const results = new Map();

        userIds.forEach(id => {
            if (window.globalUserStats.has(id)) {
                results.set(id, window.globalUserStats.get(id));
            } else {
                missingIds.push(id);
            }
        });

        return {
            cached: results,
            missing: missingIds
        };
    }

    async function getUserRapAndValue() {
        try {
            let rolimonData = {};
            try {
                const response = await chrome.runtime.sendMessage({ action: 'fetchRolimons' });
                if (response && response.success) {
                    rolimonData = response.data.items || {};
                }
            } catch (error) {
            }

            const currentOpportunities = window.filteredOpportunities || [];
            const startIndex = (Pagination.getCurrentPage() - 1) * Pagination.getTradesPerPage();
            const endIndex = startIndex + Pagination.getTradesPerPage();
            const currentPageOpportunities = currentOpportunities.slice(startIndex, endIndex);

            let userIds = currentPageOpportunities.map(opp => opp.targetUserId);
            if (userIds.length === 0) return new Map();

            if (!window.globalUserStats) window.globalUserStats = new Map();
            if (!window.userStatsLoadingInProgress) window.userStatsLoadingInProgress = new Set();

            const cacheCheck = await getCachedUserStats(userIds);
            
            if (cacheCheck.cached.size > 0) {
                cacheCheck.cached.forEach((stats, id) => {
                    updateSpecificUserCard(id, stats);
                });
            }

            if (cacheCheck.missing.length === 0) {
                return window.globalUserStats;
            }

            const usersToProcess = cacheCheck.missing;
            
            displayLoadingStats(usersToProcess); 

            let response;
            try {
                response = await chrome.runtime.sendMessage({
                    action: "fetchPlayerAssets",
                    userIds: usersToProcess
                });
            } catch (error) {
                return window.globalUserStats;
            }

            if (!response || !response.success) {
                return window.globalUserStats;
            }

            const allUserData = response.data.results || {};
            const failedUsers = response.data.failedUsers || [];
            const failedUserIds = failedUsers.map(f => f.userId);

            const successIds = [];
            for (const userId of usersToProcess) {
                const userAssets = allUserData[userId];
                
                if (userAssets) {
                    const stats = calculateUserStatsFromAssets(userAssets, rolimonData);
                    
                    window.globalUserStats.set(userId, stats);
                    
                    updateSpecificUserCard(userId, stats);
                    
                    successIds.push(userId);
                }
            }

            if (failedUserIds.length > 0) {
                await Utils.delay(2000);

                for (let i = 0; i < failedUserIds.length; i++) {
                    window.globalUserStats.delete(failedUserIds[i]);
                }
                
                await getUserRapAndValue(failedUserIds);
            }
            
            updateUserCardsDisplay(userIds); 
            
            return window.globalUserStats;

        } catch (error) {
            return new Map();
        }
    }

    function calculateUserStatsFromAssets(userAssets, rolimonData) {
        let totalRap = 0;
        let totalValue = 0;
        let limitedCount = 0;

        if (!userAssets || (typeof userAssets !== 'object' && !Array.isArray(userAssets))) {
            return { totalRap: 0, totalValue: 0, limitedCount: 0 };
        }

        if (typeof userAssets === 'object') {
            for (const [assetId, instanceIds] of Object.entries(userAssets)) {
                if (!Array.isArray(instanceIds) || instanceIds.length === 0) continue;
                
                const count = instanceIds.length;
                
                const rolimonItem = rolimonData[assetId.toString()];
                if (rolimonItem && Array.isArray(rolimonItem) && rolimonItem.length >= 5) {
                    const rap = Number(rolimonItem[2]) || 0;
                    const value = Number(rolimonItem[4]) || 0;
                    
                    totalRap += (rap * count);
                    totalValue += (value * count);
                    limitedCount += count;
                }
            }
        }

        return {
            totalRap: Math.round(totalRap),
            totalValue: Math.round(totalValue),
            limitedCount: limitedCount
        };
    }

    function displayLoadingStats(userIds) {
        userIds.forEach(userId => {
            if (!window.globalUserStats.has(userId)) {
                const cards = document.querySelectorAll(`[data-user-id="${userId}"]`);
                cards.forEach(card => {
                    const tradeCard = card.closest('.send-trade-card');
                    if (tradeCard) {
                        addUserStatsToCard(tradeCard, { 
                            totalRap: 'Loading...', 
                            totalValue: 'Loading...', 
                            limitedCount: 0,
                            isLoading: true 
                        });
                    }
                });
            }
        });
    }

    function updateSpecificUserCard(userId, userStats) {
        const cards = document.querySelectorAll(`[data-user-id="${userId}"]`);
        cards.forEach(card => {
            const tradeCard = card.closest('.send-trade-card');
            if (tradeCard) addUserStatsToCard(tradeCard, userStats);
        });
    }

    function updateUserCardsDisplay(userIds) {
        userIds.forEach(uid => {
            const stats = window.globalUserStats.get(uid);
            if (stats) updateSpecificUserCard(uid, stats);
        });
    }

    function addUserStatsToCard(tradeCard, userStats) {
        if (!userStats) return;

        const existingStats = tradeCard.querySelector('.user-stats-info');
        if (existingStats) existingStats.remove();

        const userStatsToggle = document.getElementById('user-stats-toggle');
        const headerRightSection = tradeCard.querySelector('.header-right-section');

        if (!userStatsToggle || !userStatsToggle.checked) {
            if (headerRightSection) headerRightSection.classList.remove('stats-enabled');
            return;
        }

        if (headerRightSection) headerRightSection.classList.add('stats-enabled');

        const statsElement = document.createElement('div');
        statsElement.className = 'user-stats-info';

        let rapText, valueText;
        if (userStats.isLoading) {
            rapText = 'Loading...';
            valueText = 'Loading...';
        } else if (userStats.error) {
            rapText = 'Error';
            valueText = 'Error';
        } else {
            const rap = Number(userStats.totalRap);
            const val = Number(userStats.totalValue);
            rapText = isNaN(rap) ? '0' : rap.toLocaleString();
            valueText = isNaN(val) ? '0' : val.toLocaleString();
        }

        statsElement.innerHTML = `
            <div class="user-stats-row">
                <span class="stats-label">RAP:</span>
                <span class="stats-value rap-text">${rapText}</span>
            </div>
            <div class="user-stats-row">
                <span class="stats-label">VAL:</span>
                <span class="stats-value val-text">${valueText}</span>
            </div>
            ${userStats.limitedCount > 0 && !userStats.isLoading ? `<div class="limited-count">${userStats.limitedCount} limiteds</div>` : ''}
        `;

        const avatar = tradeCard.querySelector('.user-avatar-compact');
        if (headerRightSection && avatar) {
            headerRightSection.appendChild(statsElement);
        } else {
            const tradeHeader = tradeCard.querySelector('.send-trade-header');
            if (tradeHeader) tradeHeader.appendChild(statsElement);
        }
    }

    function toggleUserStatsVisibility() {
        const userStatsToggle = document.getElementById('user-stats-toggle');
        const allStatsElements = document.querySelectorAll('.user-stats-info');
        const allHeaderRightSections = document.querySelectorAll('.header-right-section');

        if (userStatsToggle && userStatsToggle.checked) {
            allStatsElements.forEach(stats => {
                stats.style.display = 'flex';
            });

            allHeaderRightSections.forEach(section => {
                section.classList.add('stats-enabled');
            });

            setTimeout(() => {
                loadCurrentUserStats();
            }, 100);
        } else {
            allStatsElements.forEach(stats => {
                stats.style.display = 'none';
            });

            allHeaderRightSections.forEach(section => {
                section.classList.remove('stats-enabled');
            });
        }
    }

    async function loadCurrentUserStats() {
        await getUserRapAndValue();
    }

    window.UserStats = {
        getCachedUserStats,
        getUserRapAndValue,
        calculateUserStatsFromAssets,
        displayLoadingStats,
        updateSpecificUserCard,
        updateUserCardsDisplay,
        addUserStatsToCard,
        toggleUserStatsVisibility,
        loadCurrentUserStats
    };

    window.loadCurrentUserStats = loadCurrentUserStats;
    window.toggleUserStatsVisibility = toggleUserStatsVisibility;
})();
