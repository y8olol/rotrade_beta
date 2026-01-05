(function() {
    'use strict';

    async function fetchRealUsernames(opportunities) {
        const userIds = [...new Set(opportunities.map(opp => opp.targetUserId))];
        const batches = [];

        for (let i = 0; i < userIds.length; i += 100) {
            batches.push(userIds.slice(i, i + 100));
        }

        for (const batch of batches) {
            try {
                const response = await fetch(`https://users.roblox.com/v1/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userIds: batch,
                        excludeBannedUsers: true
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    data.data.forEach(user => {
                        opportunities.forEach(opp => {
                            if (opp.targetUserId === user.id) {
                                opp.targetUser.username = user.name;
                                opp.targetUser.displayName = user.displayName || user.name;
                            }
                        });
                    });
                }
            } catch (error) {
            }
        }

        return opportunities;
    }

    async function getItemIdsFromTrade(items, rolimonData) {
        let itemIds = items.map(item => item.id).filter(id => id);

        if (itemIds.length === 0 && Object.keys(rolimonData).length > 0) {
            items.forEach(item => {
                const rolimonEntry = Object.entries(rolimonData).find(([id, data]) =>
                    data[0] === item.name
                );

                if (rolimonEntry) {
                    const itemId = parseInt(rolimonEntry[0]);
                    itemIds.push(itemId);
                }
            });
        }

        return itemIds.sort((a, b) => a - b);
    }

    async function loadUserAvatars() {
        const sendButtons = document.querySelectorAll('.send-trade-btn');

        if (sendButtons.length === 0) {
            return;
        }

        const userIds = [...new Set(Array.from(sendButtons).map(btn => btn.getAttribute('data-user-id')).filter(Boolean))];

        if (userIds.length === 0) {
            return;
        }

        try {
            const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(',')}&size=150x150&format=Png&isCircular=false`);

            if (response.ok) {
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const avatarMap = new Map();
                    data.data.forEach(userData => {
                        if (userData.state === 'Completed' && userData.imageUrl) {
                            avatarMap.set(userData.targetId.toString(), userData.imageUrl);
                        }
                    });

                    sendButtons.forEach(button => {
                        const userId = button.getAttribute('data-user-id');
                        const card = button.closest('.send-trade-card');
                        const avatar = card?.querySelector('.user-avatar-compact');

                        if (userId && avatar && !avatar.dataset.loaded) {
                            const avatarUrl = avatarMap.get(userId);
                            
                            if (avatarUrl) {
                                avatar.src = avatarUrl;
                                avatar.style.opacity = '1';
                                avatar.dataset.loaded = 'true';
                            }
                        }
                    });
                }
            }
        } catch (error) {
        }
    }

    function estimateItemCopies(trade) {
        let minCopies = Infinity;

        [...trade.giving, ...trade.receiving].forEach(item => {
            let estimatedCopies;

            if (item.value > 1000000) {
                estimatedCopies = Math.floor(Math.random() * 50) + 10;
            } else if (item.value > 100000) {
                estimatedCopies = Math.floor(Math.random() * 200) + 50;
            } else if (item.value > 10000) {
                estimatedCopies = Math.floor(Math.random() * 500) + 100;
            } else if (item.value > 1000) {
                estimatedCopies = Math.floor(Math.random() * 2000) + 500;
            } else {
                estimatedCopies = Math.floor(Math.random() * 10000) + 1000;
            }

            minCopies = Math.min(minCopies, estimatedCopies);
        });

        return minCopies === Infinity ? 1000 : minCopies;
    }

    function setupSortingSystem() {
        const sortTypeSelect = document.getElementById('sort-type');
        const sortOrderSelect = document.getElementById('sort-order');

        if (!sortTypeSelect || !sortOrderSelect) return;

        applySort();

        sortTypeSelect.addEventListener('change', applySort);
        sortOrderSelect.addEventListener('change', applySort);
    }

    function applySort() {
        const sortType = document.getElementById('sort-type')?.value || 'ownerSince';
        const sortOrder = document.getElementById('sort-order')?.value || 'asc';

        if (!window.filteredOpportunities || window.filteredOpportunities.length === 0) return;

        window.filteredOpportunities.sort((a, b) => {
            const rawDataA = window.ownersRawData[a.id]?.find(u => u.userId === a.targetUserId);
            const rawDataB = window.ownersRawData[b.id]?.find(u => u.userId === b.targetUserId);

            let valA = 0;
            let valB = 0;

            if (sortType === 'ownerSince') {
                valA = rawDataA ? rawDataA.ownedSince : 0;
                valB = rawDataB ? rawDataB.ownedSince : 0;
            } else if (sortType === 'lastOnline') {
                valA = rawDataA ? rawDataA.lastOnline : 0;
                valB = rawDataB ? rawDataB.lastOnline : 0;
            }

            if (sortOrder === 'asc') {
                return valA - valB;
            } else {
                return valB - valA;
            }
        });

        Pagination.setCurrentPage(1);
        Pagination.displayCurrentPage();
        Pagination.updatePaginationControls();
    }

    function setupTradeFiltering() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('trade-filter-chip')) {
                const tradeId = e.target.dataset.tradeId;
                const tradeName = e.target.dataset.tradeName;

                document.querySelectorAll('.trade-filter-chip').forEach(chip => {
                    chip.classList.remove('active');
                    chip.style.borderBottom = '';
                    chip.style.setProperty('border-bottom', 'none', 'important');
                });

                e.target.classList.add('active');
                e.target.style.setProperty('border-bottom', '3px solid white', 'important');

                if (tradeName === 'all') {
                    window.filteredOpportunities = [...window.currentOpportunities];
                } else {
                    window.filteredOpportunities = window.currentOpportunities.filter(
                        opp => opp.id == tradeId
                    );
                }

                Pagination.setCurrentPage(1);
                Pagination.displayCurrentPage();
                updateTotalUsersInfo();
                Pagination.updatePaginationControls();
                loadUserAvatars();
                Utils.nextFrame(() => {
                    loadUserAvatars();
                });
            }
        });
    }

    function setupShuffleSystem() {
        const shuffleBtn = document.getElementById('shuffle-users-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                shuffleUsers();
            });
        }
    }

    function updateTradeFilterBar() {
        const filterChips = document.getElementById('trade-filter-chips');
        if (!filterChips) return;

        const currentActiveChip = document.querySelector('.trade-filter-chip.active');
        const currentActiveTab = currentActiveChip ? currentActiveChip.dataset.tradeName : 'all';

        const autoTrades = Storage.get('autoTrades', []);

        const allCount = window.currentOpportunities ? window.currentOpportunities.length : 0;
        const allActive = currentActiveTab === 'all' ? 'active' : '';
        let chipsHtml = `<div class="trade-filter-chip ${allActive}" data-trade-name="all">
            All Trades <span class="trade-count-badge">${allCount}</span>
        </div>`;

        autoTrades.forEach(trade => {
            const tradeOpps = window.currentOpportunities ? window.currentOpportunities.filter(opp => opp.id == trade.id) : [];
            const currentlyShowing = tradeOpps.length;

            const totalApiOwners = trade.totalOwners || 0;
            const maxTrades = trade.settings?.maxTrades || 5;
            const tradesExecutedToday = Trades.getTodayTradeCount(trade.id);
            const remainingTrades = Math.max(0, maxTrades - tradesExecutedToday);

            let statusText;
            if (totalApiOwners === 0) {
                statusText = remainingTrades === 0 ? "Daily limit reached" : "No owners found";
            } else {
                statusText = `${currentlyShowing}/${totalApiOwners}`;
            }

            const tradeActive = currentActiveTab === trade.name ? 'active' : '';
            chipsHtml += `<div class="trade-filter-chip ${tradeActive}" data-trade-id="${trade.id}" data-trade-name="${trade.name}">
                ${trade.name} <span class="trade-count-badge">${statusText}</span>
            </div>`;
        });

        filterChips.innerHTML = chipsHtml;
    }

    function updateTotalUsersInfo() {
        const totalInfo = document.getElementById('total-users-info');
        if (!totalInfo) return;

        const totalShowing = window.filteredOpportunities ? window.filteredOpportunities.length : 0;
        const totalAvailable = window.currentOpportunities ? window.currentOpportunities.length : 0;

        totalInfo.textContent = `Showing: ${totalShowing} / ${totalAvailable} opportunities`;
    }

    async function shuffleUsers() {
        const activeFilter = document.querySelector('.trade-filter-chip.active');
        const tradeName = activeFilter ? activeFilter.dataset.tradeName : 'all';

        // Handle "all trades" shuffle - just shuffle all current opportunities
        if (tradeName === 'all') {
            if (!window.currentOpportunities || window.currentOpportunities.length === 0) {
                Dialogs.alert('No Opportunities', 'No trading opportunities available to shuffle.', 'info');
                return;
            }

            // Shuffle all opportunities
            function shuffleArray(array) {
                const shuffled = [...array];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled;
            }

            const shuffled = shuffleArray([...window.currentOpportunities]);
            window.currentOpportunities = shuffled;
            // Since "all trades" is active, filteredOpportunities should show all opportunities
            window.filteredOpportunities = [...shuffled];

            Pagination.setCurrentPage(1);
            Pagination.displayCurrentPage();
            updateTradeFilterBar();
            updateTotalUsersInfo();
            Pagination.updatePaginationControls();
            
            Utils.delay(50).then(() => {
                loadUserAvatars();
            });

            return;
        }

        // Handle specific trade shuffle
        const activeTradeId = activeFilter ? activeFilter.dataset.tradeId : null;
        const autoTrades = Storage.get('autoTrades', []);
        const currentTrade = autoTrades.find(t => t.id == activeTradeId);

        if (!currentTrade) return;

        const rolimonData = window.rolimonData || {};
        const yourIds = await getItemIdsFromTrade(currentTrade.giving, rolimonData);
        const theirIds = await getItemIdsFromTrade(currentTrade.receiving, rolimonData);
        const yourR = currentTrade.robuxGive || 0;
        const theirR = currentTrade.robuxGet || 0;

        const realApiOwners = window.tradeRealOwners?.[currentTrade.id] || [];

        if (realApiOwners.length === 0) {
            Dialogs.alert('No Owners Found', 'No owners found to shuffle.', 'info');
            return;
        }

        const oldSentTrades = new Set(Storage.get('sentTrades', []));
        const history = Storage.get('sentTradeHistory', []);
        const settings = Trades.getSettings();
        const now = Date.now();
        const expiryMs = settings.tradeMemoryDays * 24 * 60 * 60 * 1000;
        
        const validHistory = history.filter(entry => (now - entry.timestamp) < expiryMs);

        const freshOwners = [];

        for (const userId of realApiOwners) {
            const tradeKey = `${currentTrade.id}-${userId}`;
            const isOldDuplicate = oldSentTrades.has(tradeKey);

            const currentHash = await Trades.generateTradeHash(yourIds, theirIds, yourR, theirR);
            const isHashDuplicate = validHistory.some(entry => entry.userId === userId && entry.hash === currentHash);

            if (!isOldDuplicate && !isHashDuplicate) {
                freshOwners.push(userId);
            }
        }

        const shuffledFreshOwners = [...freshOwners].sort(() => Math.random() - 0.5);
        let newOpportunities = [];
        
        const maxTrades = currentTrade.settings?.maxTrades || currentTrade.settings?.maxTradesPerDay || 5;
        const tradesExecutedToday = Trades.getTodayTradeCount(currentTrade.id);
        const remainingTrades = maxTrades - tradesExecutedToday;

        if (remainingTrades > 0) {
            const ownersToShow = shuffledFreshOwners.slice(0, remainingTrades);

            ownersToShow.forEach((userId, index) => {
                newOpportunities.push({
                    ...currentTrade,
                    targetUserId: userId,
                    targetUser: {
                        id: userId,
                        username: `Loading...`,
                        displayName: `User${userId}`,
                        avatarUrl: ``
                    },
                    tradeKey: `${currentTrade.id}-${userId}`,
                    status: 'available',
                    opportunityIndex: index + 1,
                    itemIds: currentTrade.itemIds || []
                });
            });
        }

        if (newOpportunities.length > 0) {
            newOpportunities = await fetchRealUsernames(newOpportunities);
        }

        window.currentOpportunities = newOpportunities;
        window.filteredOpportunities = [...window.currentOpportunities];

        Pagination.setCurrentPage(1);
        Pagination.displayCurrentPage();
        updateTradeFilterBar();
        updateTotalUsersInfo();
        Pagination.updatePaginationControls();
        loadUserAvatars();

        Utils.delay(50).then(() => {
            const filterChips = document.querySelectorAll('.trade-filter-chip');
            for (let i = 0; i < filterChips.length; i++) {
                const chip = filterChips[i];
                chip.classList.remove('active');
                chip.style.borderBottom = '';
                chip.style.setProperty('border-bottom', 'none', 'important');

                if (chip.dataset.tradeId === activeTradeId) {
                    chip.classList.add('active');
                    chip.style.setProperty('border-bottom', '3px solid white', 'important');
                }
            }
        });

        Utils.nextFrame(() => {
            loadUserAvatars();
        });
    }

    async function loadTradeOpportunities() {
        const autoTrades = Storage.get('autoTrades', []);

        if (!window.tradeUserPools) {
            window.tradeUserPools = {};
            window.sentTrades = new Set(Storage.get('sentTrades', []));
        }

        let rolimonData = {};
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'fetchRolimons'
            });

            if (response.success) {
                rolimonData = response.data.items || {};
            }
        } catch (error) {
        }

        const updatedAutoTrades = autoTrades.map(trade => {
            const updatedGiving = trade.giving.map(item => {
                const itemName = item.name;
                const rolimonItem = Object.values(rolimonData).find(r => r[0] === itemName);

                if (rolimonItem) {
                    return {
                        ...item,
                        rap: rolimonItem[2],
                        value: rolimonItem[4]
                    };
                }
                return item;
            });

            const updatedReceiving = trade.receiving.map(item => {
                const itemName = item.name;
                const rolimonItem = Object.values(rolimonData).find(r => r[0] === itemName);

                if (rolimonItem) {
                    return {
                        ...item,
                        rap: rolimonItem[2],
                        value: rolimonItem[4]
                    };
                }
                return item;
            });

            return {
                ...trade,
                giving: updatedGiving,
                receiving: updatedReceiving
            };
        });

        let opportunities = [];

        if (!window.ownersRawData) window.ownersRawData = {};

        for (const trade of updatedAutoTrades) {
            try {
                let itemIds = trade.receiving.map(item => item.id).filter(id => id);

                if (itemIds.length === 0 && Object.keys(rolimonData).length > 0) {
                    trade.receiving.forEach(item => {
                        const rolimonEntry = Object.entries(rolimonData).find(([id, data]) =>
                            data[0] === item.name
                        );

                        if (rolimonEntry) {
                            const itemId = parseInt(rolimonEntry[0]);
                            itemIds.push(itemId);
                        }
                    });
                }

                if (itemIds.length === 0) {
                    continue;
                }

                const settings = Trades.getSettings();
                const ownersResponse = await chrome.runtime.sendMessage({
                    action: 'fetchCommonOwners',
                    itemIds: itemIds,
                    maxOwnerDays: settings.maxOwnerDays,
                    lastOnlineDays: settings.lastOnlineDays
                });

                if (ownersResponse.success && ownersResponse.data.owners) {
                    const realOwners = ownersResponse.data.owners;

                    trade.totalOwners = realOwners.length;

                    if (!window.tradeRealOwners) window.tradeRealOwners = {};
                    
                    let userIds = [];
                    
                    if (realOwners.length > 0 && Array.isArray(realOwners[0]) && realOwners[0].length >= 3) {
                        window.ownersRawData[trade.id] = realOwners.map(o => ({
                            userId: o[0],
                            ownedSince: o[1],
                            lastOnline: o[2]
                        }));

                        userIds = realOwners.map(o => o[0]);
                    } else {
                        userIds = realOwners;
                        if (window.ownersRawData[trade.id]) delete window.ownersRawData[trade.id];
                    }

                    window.tradeRealOwners[trade.id] = userIds;

                    const autoTrades = Storage.get('autoTrades', []);
                    const storedTrade = autoTrades.find(at => at.id === trade.id);
                    if (storedTrade) {
                        storedTrade.totalOwners = userIds.length;
                        Storage.set('autoTrades', autoTrades);
                    }

                    const maxTrades = trade.settings?.maxTrades || trade.settings?.maxTradesPerDay || 5;
                    const tradesExecutedToday = Trades.getTodayTradeCount(trade.id);
                    const remainingTrades = maxTrades - tradesExecutedToday;

                    if (remainingTrades > 0) {
                        const yourIds = await getItemIdsFromTrade(trade.giving, rolimonData);
                        const theirIds = await getItemIdsFromTrade(trade.receiving, rolimonData);
                        const yourR = trade.robuxGive || 0;
                        const theirR = trade.robuxGet || 0;

                        const freshOwners = [];

                        for (const userId of userIds) {
                            const tradeKey = `${trade.id}-${userId}`;
                            const isOldDuplicate = window.sentTrades.has(tradeKey);
                            const isHashDuplicate = await Trades.isTradeComboSentRecently(userId, yourIds, theirIds, yourR, theirR);
                            
                            if (!isOldDuplicate && !isHashDuplicate) {
                                freshOwners.push(userId);
                            }
                        }

                        const ownersToShow = freshOwners.slice(0, remainingTrades);

                        ownersToShow.forEach((userId, index) => {
                            const tradeKey = `${trade.id}-${userId}`;
                            opportunities.push({
                                ...trade,
                                targetUserId: userId,
                                targetUser: {
                                    id: userId,
                                    username: `Loading...`,
                                    displayName: `User${userId}`,
                                    avatarUrl: ``
                                },
                                tradeKey: tradeKey,
                                status: 'available',
                                opportunityIndex: index + 1,
                                itemIds: itemIds
                            });
                        });
                    }
                }
            } catch (error) {
            }
        }

        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        opportunities = shuffleArray(opportunities);

        opportunities = await fetchRealUsernames(opportunities);

        window.currentOpportunities = opportunities;
        window.filteredOpportunities = [...opportunities];
        window.rolimonData = rolimonData;

        updateTradeFilterBar();
        Pagination.setCurrentPage(1);
        Pagination.displayCurrentPage();
        updateTotalUsersInfo();

        Utils.delay(200).then(() => {
            loadUserAvatars();
        });
    }

    window.Opportunities = {
        loadTradeOpportunities,
        fetchRealUsernames,
        getItemIdsFromTrade,
        shuffleUsers,
        setupTradeFiltering,
        updateTradeFilterBar,
        updateTotalUsersInfo,
        setupShuffleSystem,
        setupSortingSystem,
        applySort,
        estimateItemCopies,
        loadUserAvatars
    };

    window.loadTradeOpportunities = loadTradeOpportunities;
    window.fetchRealUsernames = fetchRealUsernames;
    window.getItemIdsFromTrade = getItemIdsFromTrade;
    window.shuffleUsers = shuffleUsers;
    window.setupTradeFiltering = setupTradeFiltering;
    window.updateTradeFilterBar = updateTradeFilterBar;
    window.updateTotalUsersInfo = updateTotalUsersInfo;
    window.setupShuffleSystem = setupShuffleSystem;
    window.setupSortingSystem = setupSortingSystem;
    window.applySort = applySort;
    window.estimateItemCopies = estimateItemCopies;
    window.loadUserAvatars = loadUserAvatars;
})();
