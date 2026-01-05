(function() {
    'use strict';

    function getCurrentPage() {
        return Pagination.getCurrentPage();
    }

    function setCurrentPage(page) {
        Pagination.setCurrentPage(page);
    }

    function getTradesPerPage() {
        return Pagination.getTradesPerPage();
    }

    function getTotalPages() {
        return Pagination.getTotalPages();
    }

    function updatePaginationControls() {
        Pagination.updatePaginationControls();
    }

    function displayCurrentPage() {
        Pagination.displayCurrentPage();
    }

    window.loadThumbnailsForElements = Thumbnails.loadForElements;

    function getCachedThumbnail(itemId) {
        if (!window.thumbnailCache) {
            window.thumbnailCache = {};
            try {
                const stored = localStorage.getItem('thumbnailCache');
                if (stored) {
                    window.thumbnailCache = JSON.parse(stored);
                }
            } catch {}
        }
        
        const itemIdStr = String(itemId).trim();
        const cachedUrl = window.thumbnailCache[itemIdStr];
        
        if (cachedUrl) {
            return Promise.resolve({
                data: [{
                    targetId: itemId,
                    state: 'Completed',
                    imageUrl: cachedUrl
                }]
            });
        }
        
        return Thumbnails.fetch(itemId);
    }

    window.selectInventoryItem = function(element, index) {
        element.classList.toggle('selected');
        if (window.updateTradeSummaryGlobal) {
            window.updateTradeSummaryGlobal();
        }
    };

    window.selectCatalogItem = function(element, index) {
        element.classList.toggle('selected');
        if (window.updateTradeSummaryGlobal) {
            window.updateTradeSummaryGlobal();
        }
    };

    function detectAndApplyTheme() {
        return Routing.detectAndApplyTheme();
    }

    function addAutoTradesTab() {
        return Routing.addAutoTradesTab();
    }

    function handleRouting() {
        return Routing.handleRouting();
    }

    window.loadAutoTradesPage = Pages.loadAutoTradesPage;

    window.loadCreateTradePage = Pages.loadCreateTradePage;

    window.loadSettingsPage = Pages.loadSettingsPage;

    function getSettings() {
        return Trades.getSettings();
    }

    function saveSettings(settings) {
        Trades.saveSettings(settings);
    }

    window.setupSettingsEventListeners = EventListeners.setupSettingsEventListeners;

    function replacePageContent(newContent) {
        UI.replacePageContent(newContent);
    }

    window.setupAutoTradesEventListeners = EventListeners.setupAutoTradesEventListeners;

    window.setupCreateTradeEventListeners = EventListeners.setupCreateTradeEventListeners;

    window.loadAutoTradeData = TradeLoading.loadAutoTradeData;

    window.loadOutboundTrades = TradeLoading.loadOutboundTrades;

    window.loadExpiredTrades = TradeLoading.loadExpiredTrades;

    window.loadCounteredTrades = TradeLoading.loadCounteredTrades;

    function displayAutoTrades(autoTrades) {
        return TradeDisplay.displayAutoTrades(autoTrades);
    }

    window.displayAutoTrades = displayAutoTrades;

    function loadTradeItemThumbnails(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const tradeCards = container.querySelectorAll('.trade-card');
        tradeCards.forEach(card => {
            const itemIcons = card.querySelectorAll('.item-icon');
            itemIcons.forEach(icon => {
                const itemName = icon.getAttribute('title')?.split('\n')[0];
                if (itemName) {

                    loadItemThumbnail(icon, itemName);
                }
            });
        });
    }

    function loadAutoTradeItemThumbnails(containerId = null) {
        let containerSelector;
        if (containerId) {
            containerSelector = `#${containerId}`;
        } else {
            containerSelector = '.auto-trades-container';
        }

        const container = document.querySelector(containerSelector);
        if (!container) {
            return;
        }

        if (!window.thumbnailCache) {
            window.thumbnailCache = {};
            try {
                const stored = localStorage.getItem('thumbnailCache');
                if (stored) {
                    window.thumbnailCache = JSON.parse(stored);
                }
            } catch {}
        }

        if (!window.Thumbnails || !window.Thumbnails.loadForElements) {
            if (window.Thumbnails && window.Thumbnails.init) {
                window.Thumbnails.init();
            }
        }

        const itemIcons = container.querySelectorAll('.item-icon:not(.robux-icon):not([style*="background: #00A2FF"]):not([style*="background: #00d26a"])');
        
        if (itemIcons.length === 0) {
            return;
        }

        if (window.Thumbnails && window.Thumbnails.loadForElements) {
            window.Thumbnails.loadForElements(Array.from(itemIcons));
        }
    }

    window.loadAutoTradeItemThumbnails = loadAutoTradeItemThumbnails;

    function loadItemThumbnailById(iconElement, itemName, itemId) {
        return new Promise((resolve, reject) => {
            if (!window.thumbnailCache) {
                window.thumbnailCache = {};
                try {
                    const stored = localStorage.getItem('thumbnailCache');
                    if (stored) {
                        window.thumbnailCache = JSON.parse(stored);
                    }
                } catch {}
            }

            const itemIdStr = String(itemId).trim();
            const cachedUrl = window.thumbnailCache[itemIdStr];
            
            if (cachedUrl) {
                iconElement.innerHTML = `<img src="${cachedUrl}" alt="${itemName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block;">`;
                resolve(true);
                return;
            }

            if (window.Thumbnails && window.Thumbnails.fetch) {
                window.Thumbnails.fetch(itemId)
                    .then(data => {
                        if (data.data && data.data[0] && data.data[0].imageUrl) {
                            const imageUrl = data.data[0].imageUrl;
                            if (window.thumbnailCache) {
                                window.thumbnailCache[itemIdStr] = imageUrl;
                                try {
                                    localStorage.setItem('thumbnailCache', JSON.stringify(window.thumbnailCache));
                                } catch {}
                            }
                            iconElement.innerHTML = `<img src="${imageUrl}" alt="${itemName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block;">`;
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
            } else {
                resolve(false);
            }
        });
    }

    async function processItemsWithDelay(items, index) {
        if (index >= items.length) {
            return;
        }

        const item = items[index];

        await loadItemThumbnailByIdWithRetry(item.icons, item.name, item.id, 3);

        Utils.delay(150).then(() => {
            processItemsWithDelay(items, index + 1);
        });
    }

    async function loadItemThumbnailByIdWithRetry(iconElements, itemName, itemId, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const success = await loadItemThumbnailById(iconElements[0], itemName, itemId);
                if (success) {

                    const thumbnailHTML = iconElements[0].innerHTML;
                    iconElements.forEach(icon => {
                        icon.innerHTML = thumbnailHTML;
                    });

                    return true;
                }
            } catch (error) {

                if (attempt < maxRetries) {

                    const delay = attempt * 300;
                    await Utils.delay(delay);
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    function loadItemThumbnail(iconElement, itemName) {

        const itemIds = {
            'Dominus Empyreus': '21070012',
            'Valkyrie Helm': '1365767',
            'Sparkle Time Fedora': '1285307',
            'Golden Crown': '20573078',
            'Crimson Amulet': '215719598',
            'Blue Bandana': '62724852',
            'Beautiful Hair': '16630147',
            'Clockwork Headphones': '1374269',
            'Ruby Crown': '64444871',
            'Sparkle Crown': '1374076',
            'The Classic ROBLOX Fedora': '1029025',
            'Domino Crown': '1031429',
            'Princess Hat': '1032641',
            'Red Baseball Cap': '1028606',
            'Classic ROBLOX Viking Helm': '1028720'
        };

        const itemId = itemIds[itemName];
        if (itemId) {

            getCachedThumbnail(itemId)
                .then(data => {
                    if (data.data && data.data[0] && data.data[0].imageUrl) {
                        iconElement.innerHTML = `<img src="${data.data[0].imageUrl}" alt="${itemName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block;">`;
                    }
                })
                .catch(error => {

                });
        }
    }

    function handleAutoTradeActions(e) {
        return TradeDisplay.handleAutoTradeActions(e);
    }

    function _handleAutoTradeActionsOriginal(e) {
        if (e.target.classList.contains('delete-auto-trade')) {
            const tradeId = e.target.getAttribute('data-trade-id');
            if (tradeId) {
                Dialogs.confirm('Delete Auto Trade', 'Are you sure you want to delete this auto trade?', 'Delete', 'Cancel').then(confirmed => {
                    if (confirmed) {
                        const autoTrades = Storage.get('autoTrades', []);

                        const updatedTrades = autoTrades.filter(trade => {
                            const match = trade.id !== tradeId &&
                                         String(trade.id) !== String(tradeId) &&
                                         trade.id !== parseInt(tradeId);
                            return match;
                        });

                        Storage.set('autoTrades', updatedTrades);
                        displayAutoTrades(updatedTrades);
                    }
                });
            }
        } else if (e.target.classList.contains('edit-auto-trade')) {
            const tradeId = e.target.getAttribute('data-trade-id');
            if (tradeId) {

                const autoTrades = Storage.get('autoTrades', []);

                let tradeToEdit = autoTrades.find(trade => trade.id === tradeId);

                if (!tradeToEdit) {
                    tradeToEdit = autoTrades.find(trade => String(trade.id) === String(tradeId));
                }

                if (!tradeToEdit && !isNaN(tradeId)) {
                    tradeToEdit = autoTrades.find(trade => trade.id === parseInt(tradeId));
                }

                if (tradeToEdit) {

                    Storage.set('editingTrade', tradeToEdit);

                    window.location.href = '/auto-trades/create';
                } else {
                }
            }
        }
    }

    function deleteAutoTrade(id) {
        return TradeOperations.deleteAutoTrade(id);
    }

    function _deleteAutoTradeOriginal(id) {
        Dialogs.confirm('Delete Auto Trade', 'Are you sure you want to delete this auto trade? This action cannot be undone.', 'Delete', 'Cancel').then(confirmed => {
            if (confirmed) {
                let autoTrades = Storage.get('autoTrades', []);
                autoTrades = autoTrades.filter(trade => trade.id != id);
                Storage.set('autoTrades', autoTrades);

                const card = document.querySelector(`[data-id="${id}"]`);
                if (card) {
                    card.remove();
                }

                const remainingCards = document.querySelectorAll('.auto-trade-card');
                if (remainingCards.length === 0) {
                    const container = document.getElementById('auto-trades-container');
                    const emptyState = document.getElementById('empty-state');
                    if (container && emptyState) {
                        container.style.display = 'none';
                        emptyState.style.display = 'block';
                    }
                }
            }
        });
    }

    function displayTrades(trades, containerId) {
        return TradeDisplay.displayTrades(trades, containerId);
    }

    function _displayTradesOriginal(trades, containerId) {
        const container = document.getElementById(containerId);

        if (!container) return;

        container.innerHTML = '';

        if (trades.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-title">No Trades Found</div>
                    <div class="empty-state-text">
                        ${containerId.includes('completed') ? 'No completed trades yet.' :
                          containerId.includes('outbound') ? 'No outbound trades at the moment.' : 'No expired trades found.'}
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = trades.map(trade => {

            if (trade.giving && trade.receiving && trade.giving.length > 0 && trade.receiving.length > 0) {

                const yourRap = trade.giving.reduce((sum, item) => sum + (item.rap || 0), 0) + (trade.robuxGive || 0);
                const yourVal = trade.giving.reduce((sum, item) => sum + (item.value || 0), 0) + (trade.robuxGive || 0);
                const theirRap = trade.receiving.reduce((sum, item) => sum + (item.rap || 0), 0) + (trade.robuxGet || 0);
                const theirVal = trade.receiving.reduce((sum, item) => sum + (item.value || 0), 0) + (trade.robuxGet || 0);

                const rapProfit = theirRap - yourRap;
                const valProfit = theirVal - yourVal;

                let statusColor, statusText, statusBg;
                if (containerId.includes('completed') || containerId.includes('expired') || containerId.includes('countered')) {

                    if (trade.status === 'declined') {
                        statusColor = '#dc3545';
                        statusBg = 'rgba(220, 53, 69, 0.2)';
                        statusText = 'DECLINED';
                    } else if (trade.status === 'accepted') {
                        statusColor = '#28a745';
                        statusBg = 'rgba(40, 167, 69, 0.2)';
                        statusText = 'ACCEPTED';
                    } else if (trade.status === 'completed') {
                        statusColor = '#28a745';
                        statusBg = 'rgba(40, 167, 69, 0.2)';
                        statusText = 'COMPLETED';
                    } else if (trade.status === 'countered') {
                        statusColor = '#ff6b35';
                        statusBg = 'rgba(255, 107, 53, 0.2)';
                        statusText = 'COUNTERED';
                    } else {
                        statusColor = '#6c757d';
                        statusBg = 'rgba(108, 117, 125, 0.2)';
                        statusText = trade.status?.toUpperCase() || 'UNKNOWN';
                    }
                } else {

                    statusColor = '#ffc107';
                    statusBg = 'rgba(255, 193, 7, 0.2)';
                    statusText = 'OUTBOUND';
                }

                return `
                    <div class="trade-card" data-status="outbound">
                        <div class="trade-header">
                            <div class="trade-header-top">
                                <div class="trade-user">${trade.user || `User ${trade.targetUserId}`}</div>
                                <div class="trade-status" style="color: ${statusColor}; border-color: ${statusColor}; background: ${statusBg};">
                                    ${statusText}
                                </div>
                            </div>
                            <div class="trade-timestamp-header">${new Date(trade.timestamp || trade.created).toLocaleString()}</div>
                        </div>

                        <div class="trade-items">
                            <div class="items-section">
                                <div class="items-title">YOU GIVE</div>
                                <div class="items-list">
                                    ${trade.giving.map(item =>
                                        `<div class="item-icon" data-item-id="${item.id || item.itemId || ''}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>`
                                    ).join('')}
                                </div>
                            </div>

                            <div class="items-section">
                                <div class="items-title">YOU GET</div>
                                <div class="items-list">
                                    ${trade.receiving.map(item =>
                                        `<div class="item-icon" data-item-id="${item.id || item.itemId || ''}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="trade-meta">
                            <div class="trade-values">
                                <div class="value-section">
                                    <div class="value-title">YOU</div>
                                    <div class="value-details">
                                        <div class="rap-text">RAP ${yourRap.toLocaleString()}</div>
                                        <div class="val-text">VAL ${yourVal.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div class="value-section">
                                    <div class="value-title">THEM</div>
                                    <div class="value-details">
                                        <div class="rap-text">RAP ${theirRap.toLocaleString()}</div>
                                        <div class="val-text">VAL ${theirVal.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div class="value-section">
                                    <div class="value-title">NET GAIN</div>
                                    <div class="value-details">
                                        <div class="profit-text ${rapProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                            ${rapProfit >= 0 ? '+' : ''}${rapProfit.toLocaleString()} RAP
                                        </div>
                                        <div class="profit-text ${valProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                            ${valProfit >= 0 ? '+' : ''}${valProfit.toLocaleString()} VAL
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {

                const statusColor = trade.status?.includes('Pending') ? '#ffc107' :
                                  trade.status === 'Expired' ? '#dc3545' :
                                  trade.status === 'Completed' ? '#28a745' : '#6c757d';

                return `
                    <div class="trade-card" data-status="${trade.status || 'unknown'}">
                        <div class="trade-header">
                            <div class="trade-user">User ID: ${trade.targetUserId || 'Unknown'}</div>
                            <div class="trade-status" style="color: ${statusColor}; border-color: ${statusColor}; background: rgba(${
                                statusColor === '#28a745' ? '40, 167, 69' :
                                statusColor === '#ffc107' ? '255, 193, 7' :
                                statusColor === '#dc3545' ? '220, 53, 69' : '108, 117, 125'
                            }, 0.2);">
                                ${trade.status || 'Unknown'}
                            </div>
                        </div>
                        <div class="trade-content">
                            <div class="trade-info">
                                <div><strong>Trade:</strong> ${trade.tradeName || 'Extension Trade'}</div>
                                <div><strong>ID:</strong> ${trade.id || 'Unknown'}</div>
                                <div><strong>Created:</strong> ${trade.created || 'Unknown'}</div>
                                <div><strong>Type:</strong> ${trade.type || 'Extension Trade'}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        Utils.delay(500).then(() => {
            loadEnhancedTradeItemThumbnails(containerId);
        });

        if (document.visibilityState === 'visible') {
            Utils.delay(1000).then(() => {
                loadEnhancedTradeItemThumbnails(containerId);
            });
        }
    }

    async function loadRolimonsData() {
        return Inventory.loadRolimonsData();
    }

    async function loadInventoryData() {
        return Inventory.loadInventoryData();
    }

    async function getCurrentUserId() {
        return Inventory.getCurrentUserId();
    }

    async function getUserCollectibles(userId) {
        return Inventory.getUserCollectibles(userId);
    }

    async function loadCatalogData() {
        return Inventory.loadCatalogData();
    }

    window.loadRolimonsData = loadRolimonsData;
    window.loadInventoryData = loadInventoryData;
    window.loadCatalogData = loadCatalogData;
    window.filterInventory = Inventory.filterInventory;
    window.filterCatalog = Inventory.filterCatalog;

    function displayInventory(items) {
        return Inventory.displayInventory(items);
    }

    function displayCatalog(items) {
        return Inventory.displayCatalog(items);
    }

    function updateCatalogVisual(catalogItem, newQuantity) {
        return Inventory.updateCatalogVisual(catalogItem, newQuantity);
    }

    function loadActualThumbnails(gridId, items) {
        return Inventory.loadActualThumbnails(gridId, items);
    }

    const updateTradeSummary = TradeSummary.updateTradeSummary;
    window.updateTradeSummaryGlobal = updateTradeSummary;

    function updateTradeStatistics(yourRap, yourVal, theirRap, theirVal) {
        return TradeSummary.updateTradeStatistics(yourRap, yourVal, theirRap, theirVal);
    }

    function _updateTradeStatisticsOriginal(yourRap, yourVal, theirRap, theirVal) {

        const rapProfit = theirRap - yourRap;
        const valProfit = theirVal - yourVal;

        const rapPercentage = yourRap > 0 ? ((theirRap - yourRap) / yourRap * 100) : 0;
        const valPercentage = yourVal > 0 ? ((theirVal - yourVal) / yourVal * 100) : 0;

        let statsContainer = DOM.$('#trade-statistics');
        if (!statsContainer) {
            const summaryContent = DOM.$('.auto-trades-injected .summary-content');
            if (summaryContent) {
                statsContainer = document.createElement('div');
                statsContainer.id = 'trade-statistics';
                statsContainer.className = 'trade-statistics';
                summaryContent.parentNode.appendChild(statsContainer);
            }
        }

        if (statsContainer && (yourRap > 0 || theirRap > 0)) {
            statsContainer.innerHTML = `
                <div class="stats-header">Trade Analysis</div>
                <div class="stats-grid">
                    <div class="stat-section">
                        <div class="stat-title">YOU</div>
                        <div class="stat-values">
                            <div class="rap-text">RAP ${yourRap.toLocaleString()}</div>
                            <div class="val-text">VAL ${yourVal.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="stat-section">
                        <div class="stat-title">THEM</div>
                        <div class="stat-values">
                            <div class="rap-text">RAP ${theirRap.toLocaleString()}</div>
                            <div class="val-text">VAL ${theirVal.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="stat-section">
                        <div class="stat-title">NET GAIN</div>
                        <div class="stat-values">
                            <div class="profit-text ${rapProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${rapProfit >= 0 ? '+' : ''}${rapProfit.toLocaleString()} RAP
                            </div>
                            <div class="profit-text ${valProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${valProfit >= 0 ? '+' : ''}${valProfit.toLocaleString()} VAL
                            </div>
                        </div>
                    </div>
                    <div class="stat-section">
                        <div class="stat-title">WIN/LOSS %</div>
                        <div class="stat-values">
                            <div class="profit-text ${rapPercentage >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${rapPercentage >= 0 ? '+' : ''}${rapPercentage.toFixed(1)}% RAP
                            </div>
                            <div class="profit-text ${valPercentage >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${valPercentage >= 0 ? '+' : ''}${valPercentage.toFixed(1)}% VAL
                            </div>
                        </div>
                    </div>
                </div>
            `;
            statsContainer.style.display = 'block';
        } else if (statsContainer) {
            statsContainer.style.display = 'none';
        }
    }

    function createAutoTrade() {
        return TradeOperations.createAutoTrade();
    }

    function _createAutoTradeOriginal() {
        const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
        const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card[data-quantity]:not([data-quantity="0"])');

        const totalCatalogItems = Array.from(selectedCatalog).reduce((total, item) => {
            return total + (parseInt(item.dataset.quantity) || 0);
        }, 0);

        if (selectedInventory.length === 0 || totalCatalogItems === 0) {
            Dialogs.alert('Selection Required', 'Please select items from both your inventory and the catalog', 'error');
            return;
        }

        if (selectedInventory.length > 4) {
            Dialogs.alert('Too Many Items', 'You can only select up to 4 items from your inventory.', 'error');
            return;
        }

        if (totalCatalogItems > 4) {
            Dialogs.alert('Too Many Items', 'You can only receive up to 4 items total. You currently have ' + totalCatalogItems + ' items selected.', 'error');
            return;
        }

        const nameInput = document.getElementById('auto-trade-name') ||
                          document.querySelector('input[placeholder*="trade name"]') ||
                          document.querySelector('input[placeholder*="Trade name"]') ||
                          document.querySelector('input[placeholder*="Enter your trade name"]') ||
                          document.querySelector('.trade-settings input[type="text"]');
        const autoTradeName = nameInput ? nameInput.value.trim() : '';

        if (!autoTradeName) {
            Dialogs.alert('Name Required', 'Please enter a name for your auto trade', 'error');
            if (nameInput) nameInput.focus();
            return;
        }

        const robuxGive = parseInt(document.getElementById('robux-give')?.value) || 0;
        const robuxGet = parseInt(document.getElementById('robux-get')?.value) || 0;

        if (!window.validateRobuxLimits(robuxGive, robuxGet)) {
            return;
        }

        const settings = {
            maxTrades: document.getElementById('max-trades')?.value || 1
        };

        const isEditMode = window.editingTradeId !== undefined;
        const tradeId = isEditMode ? window.editingTradeId : Date.now();

        const autoTradeData = {
            id: tradeId,
            name: autoTradeName,
            status: 'incomplete',
            giving: Array.from(selectedInventory).map(item => ({
                name: item.dataset.item,
                value: parseInt(item.dataset.value),
                rap: parseInt(item.dataset.rap)
            })),
            receiving: Array.from(selectedCatalog).flatMap(item => {
                const quantity = parseInt(item.dataset.quantity) || 0;

                return Array(quantity).fill().map(() => ({
                    name: item.dataset.item,
                    value: parseInt(item.dataset.value),
                    rap: parseInt(item.dataset.rap)
                }));
            }).filter(item => item),

            robuxGive: robuxGive,
            robuxGet: robuxGet,
            settings: {
                maxTradesPerDay: parseInt(settings.maxTrades),
                tradesExecutedToday: 0
            },
            created: isEditMode ? undefined : new Date().toISOString(),
            lastExecuted: null
        };

        if (!isEditMode) {
            autoTradeData.created = new Date().toISOString();
        }

        let autoTrades = Storage.get('autoTrades', []);

        if (isEditMode) {

            const tradeIndex = autoTrades.findIndex(trade => trade.id === tradeId || String(trade.id) === String(tradeId));
            if (tradeIndex !== -1) {

                autoTradeData.created = autoTrades[tradeIndex].created;
                autoTrades[tradeIndex] = autoTradeData;
            } else {
                autoTrades.push(autoTradeData);
            }
        } else {

            autoTrades.push(autoTradeData);
        }

        Storage.set('autoTrades', autoTrades);

        if (isEditMode) {
            window.editingTradeId = undefined;
        }

        window.location.href = '/auto-trades';
    }

    document.addEventListener('click', function(e) {

        const catalogSummaryItem = e.target.closest('.clickable-summary');
        if (catalogSummaryItem) {

            const itemId = catalogSummaryItem.dataset.originalItemId;

            const catalogItem = document.querySelector(`#catalog-grid .item-card[data-id="${itemId}"]`);
            if (catalogItem) {
                const currentQuantity = parseInt(catalogItem.dataset.quantity) || 0;
                if (currentQuantity > 0) {

                    const newQuantity = currentQuantity - 1;

                    updateCatalogVisual(catalogItem, newQuantity);
                    updateTradeSummary();

                }
            }
            return;
        }

        const inventorySummaryItem = e.target.closest('.clickable-inventory-summary');
        if (inventorySummaryItem) {

            const itemIndex = inventorySummaryItem.dataset.originalItemIndex;

            const inventoryItem = document.querySelector(`#inventory-grid .item-card[data-index="${itemIndex}"]`);
            if (inventoryItem && inventoryItem.classList.contains('selected')) {

                inventoryItem.classList.remove('selected');
                inventoryItem.style.removeProperty('--quantity-number');
                updateTradeSummary();

            }
        }
    });

    function formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    const filterInventory = Utils.throttle((query) => {
        const items = DOM.$$('#inventory-grid .item-card');
        const queryLower = query.toLowerCase();
        items.forEach(item => {
            item.style.display = item.dataset.item.toLowerCase().includes(queryLower) ? 'block' : 'none';
        });
    }, 100);

    const filterCatalog = Utils.throttle((query) => {
        const items = DOM.$$('#catalog-grid .item-card');
        const queryLower = query.toLowerCase();
        items.forEach(item => {
            item.style.display = item.dataset.item.toLowerCase().includes(queryLower) ? 'block' : 'none';
        });
    }, 100);

    document.addEventListener('click', function(e) {
        if (e.target.closest('#nav-auto-trades')) {
            e.preventDefault();
            window.location.href = '/auto-trades';
        }
    });

    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);

    function setupPageContextBridge() {
        return BridgeUtils.setupPageContextBridge();
    }

    async function callBridgeMethod(action, data, timeout = null) {
        return BridgeUtils.callBridgeMethod(action, data, timeout);
    }

    function waitForAngularViaBridge() {
        return BridgeUtils.waitForAngularViaBridge();
    }

    function init() {
        if (!document.getElementById('extension-trade-cards-css')) {
            const style = document.createElement('style');
            style.id = 'extension-trade-cards-css';
            style.textContent = `
                body:not(.path-auto-trades-send) #outbound-container,
                body:not(.path-auto-trades-send) #expired-container,
                body:not(.path-auto-trades-send) #countered-container,
                body:not(.path-auto-trades-send) #completed-container {
                    display: grid !important;
                    grid-template-columns: repeat(4, 1fr) !important;
                    gap: 16px !important;
                    margin: 0 auto !important;
                    max-width: 100% !important;
                }
                body:not(.path-auto-trades-send) .trade-card {
                    max-width: 100% !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }

                body.path-auto-trades-send .send-trades-container {
                    max-width: 1200px !important;
                    margin: 0 auto !important;
                    padding: 20px !important;
                }
                body.path-auto-trades-send .send-trades-grid {
                    display: grid !important;
                    grid-template-columns: repeat(3, 1fr) !important;
                    gap: 16px !important;
                    margin: 0 auto !important;
                    width: 100% !important;
                }
                body.path-auto-trades-send .send-trade-card {
                    max-width: 100% !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }

                .pagination-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 20px auto 10px;
                    padding: 10px 15px;
                    max-width: 1200px;
                    background: var(--auto-trades-bg-secondary, #f5f5f5);
                    border: 1px solid var(--auto-trades-border, #e0e0e0);
                    border-radius: 8px;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .pagination-info {
                    font-size: 14px;
                    color: var(--auto-trades-text-secondary, #666666);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-right: 12px;
                    border-right: 1px solid var(--auto-trades-border, #e0e0e0);
                    font-weight: 600;
                }

                .sorting-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-grow: 1;
                    justify-content: center;
                    padding: 0 12px;
                }

                .sort-btn {
                    background-color: var(--auto-trades-bg-primary, #ffffff);
                    border: 1px solid var(--auto-trades-border, #e0e0e0);
                    color: var(--auto-trades-text-primary, #191919);
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                }

                .sort-btn:hover {
                    border-color: #00A2FF;
                    background-color: var(--auto-trades-bg-primary);
                }

                .sort-btn:active {
                    transform: scale(0.98);
                }

                body.dark-theme .sort-btn {
                    background-color: #232629;
                    border-color: #393b3d;
                    color: #e0e0e0;
                }

                body.dark-theme .sort-btn:hover {
                    border-color: #00A2FF;
                    background-color: #2a2d30;
                }

                .sort-select {
                    background-color: var(--auto-trades-bg-primary, #ffffff);
                    border: 1px solid var(--auto-trades-border, #e0e0e0);
                    color: var(--auto-trades-text-primary, #191919);
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.15s ease;
                    min-width: 130px;
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                    background-size: 12px;
                    padding-right: 28px;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .sort-select:hover {
                    border-color: #00A2FF;
                    background-color: var(--auto-trades-bg-primary);
                }

                .sort-select:focus {
                    border-color: var(--auto-trades-border, #e0e0e0);
                    border-bottom: 2px solid #00A2FF;
                    padding-bottom: 7px;
                    background-color: var(--auto-trades-bg-primary);
                }

                body:not(.dark-theme) .sort-select option {
                    background-color: #ffffff;
                    color: #191919;
                }

                body.dark-theme .sort-select {
                    background-color: #232629;
                    border-color: #393b3d;
                    color: #e0e0e0;
                    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23bdbebe%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
                }
                
                body.dark-theme .sort-select:hover {
                    border-color: #00A2FF;
                    background-color: #2a2d30;
                }

                body.dark-theme .sort-select option {
                    background-color: #232629;
                    color: #e0e0e0;
                }

                .pagination-buttons {
                    display: flex;
                    gap: 10px;
                    padding-left: 12px;
                    border-left: 1px solid var(--auto-trades-border, #e0e0e0);
                }

                .pagination-btn {
                    background: var(--auto-trades-bg-primary, #ffffff);
                    border: 1px solid var(--auto-trades-border, #e0e0e0);
                    color: var(--auto-trades-text-primary, #191919);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    min-width: 100px;
                    text-align: center;
                }

                .pagination-btn:hover:not(:disabled) {
                    background: #00A2FF;
                    border-color: #00A2FF;
                    color: white;
                }

                .pagination-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    background: var(--auto-trades-bg-secondary, #f5f5f5);
                    border-color: var(--auto-trades-border);
                    transform: none;
                }

                @media (max-width: 850px) {
                    .pagination-controls {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }
                    .pagination-info {
                        border-right: none;
                        border-bottom: 1px solid var(--auto-trades-border);
                        padding-bottom: 8px;
                        margin-bottom: 4px;
                        justify-content: center;
                    }
                    .sorting-controls {
                        flex-direction: row;
                        justify-content: center;
                        gap: 8px;
                        padding: 0;
                        margin-bottom: 4px;
                    }
                    .sort-select {
                        flex: 1;
                        min-width: 100px;
                    }
                    .pagination-buttons {
                        border-left: none;
                        padding-left: 0;
                        justify-content: center;
                    }
                    .pagination-btn {
                        flex: 1;
                    }
                }

                body:not(.path-auto-trades-send) .trade-values { flex-wrap: nowrap !important; gap: 16px !important; }
                body:not(.path-auto-trades-send) .value-section { min-width: 100px !important; font-size: 12px !important; }
                body:not(.path-auto-trades-send) .trade-timestamp { display: none !important; }
                body:not(.path-auto-trades-send) .trade-header { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
                body:not(.path-auto-trades-send) .trade-header-top { display: flex !important; justify-content: space-between !important; align-items: center !important; width: 100% !important; }
                body:not(.path-auto-trades-send) .trade-timestamp-header { color: #666 !important; font-size: 10px !important; margin-top: 2px !important; }
            `;
            document.head.appendChild(style);
        }
        setupPageContextBridge();

        addAutoTradesTab();
        handleRouting();

        startAutoUpdateSystem();

        Utils.delay(2000).then(() => {
            cleanupTradeCategories();
            migrateTradesForRobux();
        });

        const observer = new MutationObserver(() => {
            addAutoTradesTab();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    window.loadCompletedTrades = TradeLoading.loadCompletedTrades;

    window.loadSendTradesPage = Pages.loadSendTradesPage;

    window.setupSendTradesEventListeners = EventListeners.setupSendTradesEventListeners;

    function copyChallengeToPrimaryPage(iframe, buttonElement) {
        return TradeSending.copyChallengeToPrimaryPage(iframe, buttonElement);
    }

    function showOriginalRobloxInterface(buttonElement) {
        return TradeSending.showOriginalRobloxInterface(buttonElement);
    }
    async function getRobloxCSRFToken() {
        return BridgeUtils.getRobloxCSRFToken();
    }

    function waitForPageAndAngularReady() {
        return BridgeUtils.waitForPageAndAngularReady();
    }

    function waitForAngularAndCache() {
        return BridgeUtils.waitForAngularAndCache();
    }

    async function fetchRealUsernames(opportunities) {
        return Opportunities.fetchRealUsernames(opportunities);
    }

    window.loadBasicSendTradesInterface = Pages.loadBasicSendTradesInterface;
    function setupSendTradesEventListeners() {

        const backBtn = document.querySelector('.back-link');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const contentContainer = document.querySelector('#content');
                const customOverlay = document.querySelector('#custom-send-trades-overlay');

                if (contentContainer) {

                    Array.from(contentContainer.children).forEach(child => {
                        if (child.id !== 'custom-send-trades-overlay') {
                            child.style.visibility = 'visible';
                        }
                    });
                }

                if (customOverlay) {
                    customOverlay.remove();
                }

                if (window.cachedAngularService) {
                    window.cachedAngularService = null;
                }

                sessionStorage.removeItem('loadSendTrades');
                window.location.href = '/auto-trades';
            });
        }

        const userStatsToggle = document.getElementById('user-stats-toggle');
        if (userStatsToggle) {
            userStatsToggle.addEventListener('change', toggleUserStatsVisibility);
        }

        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentPage = getCurrentPage();
                if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    displayCurrentPage();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentPage = getCurrentPage();
                const totalPages = getTotalPages();
                if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                    displayCurrentPage();
                }
            });
        }
    }

    function getSentTradeHistory() {
        return Storage.get('sentTradeHistory', []);
    }

    function saveSentTradeHistory(history) {
        Storage.set('sentTradeHistory', history);
    }

    async function generateTradeHash(yourItemIds, theirItemIds, yourRobux, theirRobux) {
        const sortedYourIds = [...yourItemIds].sort((a, b) => a - b).join(',');
        const sortedTheirIds = [...theirItemIds].sort((a, b) => a - b).join(',');
        
        const dataToHash = `${sortedYourIds}|${sortedTheirIds}|${yourRobux}|${theirRobux}`;
        
        const encoder = new TextEncoder();
        const data = encoder.encode(dataToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    async function isTradeComboSentRecently(userId, yourItemIds, theirItemIds, yourRobux, theirRobux) {
        const settings = getSettings();
        const history = getSentTradeHistory();
        const now = Date.now();
        const expiryMs = settings.tradeMemoryDays * 24 * 60 * 60 * 1000;

        const validHistory = history.filter(entry => (now - entry.timestamp) < expiryMs);
        if (validHistory.length !== history.length) {
            saveSentTradeHistory(validHistory);
        }

        const currentHash = await generateTradeHash(yourItemIds, theirItemIds, yourRobux, theirRobux);

        const exists = validHistory.some(entry => {
            return entry.userId === userId && entry.hash === currentHash;
        });

        return exists;
    }

    async function logSentTradeCombo(userId, yourItemIds, theirItemIds, yourRobux, theirRobux) {
        const history = getSentTradeHistory();
        const hash = await generateTradeHash(yourItemIds, theirItemIds, yourRobux, theirRobux);
        
        history.push({
            userId: userId,
            hash: hash,
            timestamp: Date.now()
        });

        saveSentTradeHistory(history);
    }

    async function loadTradeOpportunities() {
        return Opportunities.loadTradeOpportunities();
    }
    function getTodayTradeCount(tradeId) {
        return Trades ? Trades.getTodayTradeCount(tradeId) : 0;
    }

    function getCurrentDateKey() {
        return new Date().toISOString().split('T')[0];
    }

    function incrementTradeCount(tradeId) {
        return Trades.incrementTradeCount(tradeId);
    }

    async function loadUserAvatars() {
        return Opportunities.loadUserAvatars();
    }


    function estimateItemCopies(trade) {
        return Opportunities.estimateItemCopies(trade);
    }

    function displayTradeOpportunities(opportunities) {
        return TradeDisplay.displayTradeOpportunities(opportunities);
    }

    function _displayTradeOpportunitiesOriginal(opportunities) {
        const grid = DOM.$('#send-trades-grid');
        if (!grid) return;

        if (opportunities.length === 0) {
            if (window.filteredOpportunities && window.filteredOpportunities.length > 0) {
                const totalPages = getTotalPages();
                const currentPage = getCurrentPage();
                if (currentPage > 1 && currentPage <= totalPages) {
                    setCurrentPage(currentPage - 1);
                    displayCurrentPage();
                    return;
                }
            }
            
            const autoTrades = Storage.get('autoTrades', []);
            if (autoTrades.length === 0) {
                grid.innerHTML = '<div class="empty-message">No auto-trades available. Create some auto-trades first!</div>';
                return;
            }

            const allTradesComplete = autoTrades.every(trade => {
                const maxTrades = trade.settings?.maxTrades || 5;
                const tradesExecutedToday = Trades.getTodayTradeCount(trade.id);
                return tradesExecutedToday >= maxTrades;
            });

            if (allTradesComplete) {
                grid.innerHTML = '<div class="empty-message">All trades completed for today!</div>';
                return;
            }

            grid.innerHTML = '<div class="empty-message">No trading opportunities found.</div>';
            return;
        }

        let tradesToShow = opportunities;
        
        if (opportunities === window.filteredOpportunities) {
            const currentPage = getCurrentPage();
            const tradesPerPage = getTradesPerPage();
            const startIndex = (currentPage - 1) * tradesPerPage;
            const endIndex = startIndex + tradesPerPage;
            tradesToShow = opportunities.slice(startIndex, endIndex);
        }

        grid.innerHTML = tradesToShow.map(opportunity => {
            const givingItems = opportunity.giving.map(item =>
                `<div class="item-card-compact">
                    <div class="item-icon" title="${item.name}&#10;RAP ${item.rap?.toLocaleString() || 'N/A'}&#10;VALUE ${item.value?.toLocaleString() || 'N/A'}">${item.name.substring(0, 2).toUpperCase()}</div>
                    <div class="item-info-compact">
                        <div class="item-name-compact">${item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}</div>
                        <div class="item-values-compact">
                            <span class="rap-text">RAP: ${item.rap?.toLocaleString() || 'N/A'}</span>
                            <span class="value-text">VAL: ${item.value?.toLocaleString() || 'N/A'}</span>
                        </div>
                    </div>
                </div>`
            ).join('');

            const receivingItems = opportunity.receiving.map(item =>
                `<div class="item-card-compact">
                    <div class="item-icon" title="${item.name}&#10;RAP ${item.rap?.toLocaleString() || 'N/A'}&#10;VALUE ${item.value?.toLocaleString() || 'N/A'}">${item.name.substring(0, 2).toUpperCase()}</div>
                    <div class="item-info-compact">
                        <div class="item-name-compact">${item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}</div>
                        <div class="item-values-compact">
                            <span class="rap-text">RAP: ${item.rap?.toLocaleString() || 'N/A'}</span>
                            <span class="value-text">VAL: ${item.value?.toLocaleString() || 'N/A'}</span>
                        </div>
                    </div>
                </div>`
            ).join('');

            let lastOnlineHtml = '';
            let daysOwnedHtml = '';
            
            if (window.ownersRawData && window.ownersRawData[opportunity.id]) {
                const userData = window.ownersRawData[opportunity.id].find(u => u.userId === opportunity.targetUserId);
                
                if (userData) {
                    const now = Date.now();
                    const daysOwned = Math.floor((now - userData.ownedSince) / (1000 * 60 * 60 * 24));
                    const lastOnlineMs = userData.lastOnline * 1000;
                    const diffMs = now - lastOnlineMs;
                    const daysOnline = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const hoursOnline = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutesOnline = Math.floor(diffMs / (1000 * 60));

                    let onlineText = '';
                    if (daysOnline > 0) {
                        onlineText = `${daysOnline}d ago`;
                    } else if (hoursOnline > 0) {
                        onlineText = `${hoursOnline}h ago`;
                    } else {
                        onlineText = `${minutesOnline}m ago`;
                    }


                    lastOnlineHtml = `<div class="user-stat-line" style="font-size: 12px; color: #bdbebe6c;">Last Online: ${onlineText}</div>`;
                    daysOwnedHtml = `<div class="user-stat-line" style="font-size: 12px; color: #bdbebe6c;">Owned Since: ${daysOwned}d</div>`;
                }
            }

            return `
                <div class="send-trade-card trade-card">
                    <div class="send-trade-header">
                        <div class="trade-info-compact">
                            <div class="trade-title-compact">${opportunity.name}</div>
                            <div class="trade-target">→ ${opportunity.targetUser.username}</div>
                            ${lastOnlineHtml}
                            ${daysOwnedHtml}
                        </div>
                        <div class="header-right-section">
                            <img src="${opportunity.targetUser.avatarUrl}" alt="${opportunity.targetUser.username}" class="user-avatar-compact" style="opacity: 0.7;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiByeD0iNCIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSIxNSIgY3k9IjEyIiByPSI0IiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik04IDI0QzggMjAuNjg2MyAxMS4xMzQgMTggMTUgMThDMTguODY2IDE4IDIyIDIwLjY4NjMgMjIgMjRIOFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+Cg=='" />
                        </div>
                    </div>

                    <div class="trade-content-compact">
                        <div class="trade-section-compact">
                            <div class="section-title-compact">GIVE</div>
                            <div class="trade-items-compact">
                                ${givingItems}
                            </div>
                        </div>

                        <div class="trade-section-compact">
                            <div class="section-title-compact">GET</div>
                            <div class="trade-items-compact">
                                ${receivingItems}
                            </div>
                        </div>
                    </div>

                    <div class="send-trade-actions">
                        <button class="btn btn-success btn-sm send-trade-btn" data-user-id="${opportunity.targetUserId}" data-trade-id="${opportunity.id}">
                            SEND
                        </button>
                        <a href="https://www.roblox.com/users/${opportunity.targetUserId}/profile" target="_blank" class="btn btn-secondary btn-sm">
                            PROFILE
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        Utils.nextFrame(() => {
            loadAutoTradeItemThumbnails('send-trades-grid');
        });

        setupSendTradeButtons();
        updatePaginationControls();
    }

    function setupSortingSystem() {
        return Opportunities.setupSortingSystem();
    }

    function applySort() {
        return Opportunities.applySort();
    }

    function setupTradeFiltering() {
        return Opportunities.setupTradeFiltering();
    }

    function setupShuffleSystem() {
        return Opportunities.setupShuffleSystem();
    }

    function updateTradeFilterBar() {
        return Opportunities.updateTradeFilterBar();
    }

    function updateTotalUsersInfo() {
        return Opportunities.updateTotalUsersInfo();
    }

    async function shuffleUsers() {
        return Opportunities.shuffleUsers();
    }
    
    async function checkTradeStatus(tradeId) {
        return TradeStatus.checkTradeStatus(tradeId);
    }

    async function updateTradeStatuses() {
        return TradeStatus.updateTradeStatuses();
    }

    function startTradeStatusMonitoring() {
        return TradeStatus.startTradeStatusMonitoring();
    }

    async function checkAndUpdateTradeStatuses() {
        return TradeStatus.checkAndUpdateTradeStatuses();
    }

    function moveTradeToFinalized(trade, status) {
        return TradeStatus.moveTradeToFinalized(trade, status);
    }

    async function loadEnhancedTradeItemThumbnails(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        if (!window.thumbnailCache) {
            window.thumbnailCache = {};
        }

        try {
            const rolimonsItems = await loadRolimonsData();

            const itemNameToId = {};
            if (Array.isArray(rolimonsItems)) {
                rolimonsItems.forEach(item => {
                    itemNameToId[item.name] = item.id;
                });
            }

            const itemIcons = container.querySelectorAll('.item-icon:not(.robux-icon):not([style*="background: #00A2FF"]):not([style*="background: #00d26a"])');

            const elementsToLoad = [];

            itemIcons.forEach(icon => {
                if (icon.classList.contains('robux-icon')) {
                    return;
                }

                let itemId = icon.getAttribute('data-id') || icon.getAttribute('data-item-id') || icon.dataset.id || icon.dataset.itemId;
                
                if (itemId && itemId !== '' && itemId !== 'undefined' && itemId !== 'null') {
                    itemId = String(itemId).trim();
                    icon.setAttribute('data-id', itemId);
                    icon.setAttribute('data-item-id', itemId);
                    icon.dataset.id = itemId;
                    icon.dataset.itemId = itemId;
                    
                    const cachedUrl = window.thumbnailCache[itemId];
                    if (cachedUrl) {
                        icon.innerHTML = `<img src="${cachedUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block;">`;
                    } else {
                        elementsToLoad.push(icon);
                    }
                    return;
                }

                const itemName = icon.getAttribute('data-item-name') ||
                                 icon.getAttribute('title')?.split('\n')[0] ||
                                 icon.textContent?.trim();

                if (!itemName || itemName === 'UI' || itemName.length < 2) return;

                itemId = itemNameToId[itemName];
                
                if (!itemId) {
                    const lowerName = itemName.toLowerCase();
                    for (const [name, id] of Object.entries(itemNameToId)) {
                        if (name.toLowerCase() === lowerName) {
                            itemId = id;
                            break;
                        }
                    }
                }
                
                if (itemId) {
                    itemId = String(itemId).trim();
                    icon.setAttribute('data-id', itemId);
                    icon.setAttribute('data-item-id', itemId);
                    icon.dataset.id = itemId;
                    icon.dataset.itemId = itemId;
                    
                    const cachedUrl = window.thumbnailCache[itemId];
                    if (cachedUrl) {
                        icon.innerHTML = `<img src="${cachedUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block;">`;
                    } else {
                        elementsToLoad.push(icon);
                    }
                }
            });

            if (elementsToLoad.length > 0) {
                if (window.Thumbnails && window.Thumbnails.loadForElements) {
                    window.Thumbnails.loadForElements(elementsToLoad);
                } else if (window.loadThumbnailsForElements) {
                    window.loadThumbnailsForElements(elementsToLoad);
                }
            }

        } catch (error) {
            console.error('Error loading thumbnails:', error);
        }
    }

    function setupSendTradeButtons() {
        return TradeSending.setupSendTradeButtons();
    }


    async function getItemIdsFromTrade(items, rolimonData) {
        return Opportunities.getItemIdsFromTrade(items, rolimonData);
    }

    function checkForEditMode() {
        const editingTrade = Storage.get('editingTrade', null);
        if (!editingTrade) return;

        try {
            const tradeData = editingTrade;

            const pageTitle = document.querySelector('.auto-trades-title');
            if (pageTitle) {
                pageTitle.textContent = 'Edit Auto Trade';
            }

            const createButton = document.getElementById('create-auto-trade');
            if (createButton) {
                createButton.textContent = 'UPDATE AUTO TRADE';
                createButton.className = 'btn btn-success';
                createButton.style.background = '#28a745';
                createButton.style.borderColor = '#28a745';
            }

            const nameInput = document.getElementById('auto-trade-name') ||
                             document.getElementById('trade-name') ||
                             document.querySelector('input[placeholder*="trade name"]') ||
                             document.querySelector('input[placeholder*="Trade name"]') ||
                             document.querySelector('input[placeholder*="Enter your trade name"]') ||
                             document.querySelector('.trade-settings input[type="text"]');

            if (nameInput) {
                nameInput.value = tradeData.name;
                nameInput.placeholder = `Editing: ${tradeData.name}`;
            }

            if (tradeData.giving && tradeData.giving.length > 0) {
                const selectInventoryItems = () => {
                    const inventoryGrid = document.getElementById('inventory-grid');
                    if (!inventoryGrid || inventoryGrid.children.length === 0) {
                        requestAnimationFrame(selectInventoryItems);
                        return;
                    }

                    const itemCounts = {};
                    tradeData.giving.forEach(item => {
                        itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
                    });

                    Object.entries(itemCounts).forEach(([itemName, requiredCount]) => {
                        let inventoryCards = Array.from(document.querySelectorAll(`#inventory-grid [data-item="${itemName}"]`));

                        if (inventoryCards.length === 0) {
                            inventoryCards = Array.from(document.querySelectorAll(`#inventory-grid [title="${itemName}"]`));
                        }
                        if (inventoryCards.length === 0) {
                            inventoryCards = Array.from(document.querySelectorAll(`#inventory-grid [data-name="${itemName}"]`));
                        }

                        if (inventoryCards.length > 0) {
                            const availableCards = inventoryCards.filter(card => card.dataset.onHold !== 'true');
                            const countToSelect = Math.min(requiredCount, availableCards.length);

                            for (let i = 0; i < countToSelect; i++) {
                                const card = availableCards[i];
                                card.classList.add('selected');
                                card.style.setProperty('--quantity-number', '"1"');
                            }
                        }
                    });

                    if (window.updateTradeSummaryGlobal) {
                        window.updateTradeSummaryGlobal();
                    }

                    const selectedInventoryItems = document.querySelectorAll('#inventory-grid .item-card.selected');
                    if (selectedInventoryItems.length > 0 && window.loadThumbnailsForElements) {
                        window.loadThumbnailsForElements(selectedInventoryItems, '#inventory-grid');
                    }
                };

                requestAnimationFrame(() => {
                    selectInventoryItems();
                });
            }

            const targetItems = tradeData.getting || tradeData.receiving || [];
            if (targetItems && targetItems.length > 0) {
                const selectCatalogItems = () => {
                    const catalogGrid = document.getElementById('catalog-grid');
                    if (!catalogGrid || catalogGrid.children.length === 0) {
                        requestAnimationFrame(selectCatalogItems);
                        return;
                    }

                    const catalogItemCounts = {};
                    targetItems.forEach(item => {
                        catalogItemCounts[item.name] = (catalogItemCounts[item.name] || 0) + 1;
                    });

                    Object.entries(catalogItemCounts).forEach(([itemName, requiredCount]) => {
                        let catalogCard = document.querySelector(`#catalog-grid [data-item="${itemName}"]`) ||
                                        document.querySelector(`#catalog-grid [title="${itemName}"]`) ||
                                        document.querySelector(`#catalog-grid [data-name="${itemName}"]`);

                        if (catalogCard) {
                            catalogCard.dataset.quantity = Math.min(requiredCount, 4);
                            catalogCard.classList.add('selected');
                            catalogCard.style.setProperty('--quantity-number', `"${Math.min(requiredCount, 4)}"`);
                        }
                    });

                    if (window.updateTradeSummaryGlobal) {
                        window.updateTradeSummaryGlobal();
                    }

                    const selectedCatalogItems = document.querySelectorAll('#catalog-grid .item-card.selected');
                    if (selectedCatalogItems.length > 0 && window.loadThumbnailsForElements) {
                        window.loadThumbnailsForElements(selectedCatalogItems, '#catalog-grid');
                    }
                };

                requestAnimationFrame(() => {
                    selectCatalogItems();
                });
            }

            if (tradeData.settings && (tradeData.settings.maxTradesPerDay || tradeData.settings.maxTrades)) {
                const maxTradesInput = document.getElementById('max-trades');
                if (maxTradesInput) {
                    const maxTradesValue = tradeData.settings.maxTradesPerDay || tradeData.settings.maxTrades || 5;
                    maxTradesInput.value = maxTradesValue;
                }
            }

            if (tradeData.robuxGive || tradeData.robuxGet) {
                const setRobuxValues = () => {
                    const robuxGiveInput = document.getElementById('robux-give');
                    const robuxGetInput = document.getElementById('robux-get');

                    if (!robuxGiveInput || !robuxGetInput) {
                        requestAnimationFrame(setRobuxValues);
                        return;
                    }

                    if (tradeData.robuxGive && robuxGiveInput) {
                        robuxGiveInput.value = tradeData.robuxGive;

                        if (window.validateRobuxInput) {
                            window.validateRobuxInput('give');
                        }
                    }

                    if (tradeData.robuxGet && robuxGetInput) {
                        robuxGetInput.value = tradeData.robuxGet;

                        if (window.validateRobuxInput) {
                            window.validateRobuxInput('get');
                        }
                    }

                    if (window.updateTradeSummaryGlobal) {
                        window.updateTradeSummaryGlobal();
                    }
                };

                requestAnimationFrame(setRobuxValues);
            }

            window.editingTradeId = tradeData.id;


            requestAnimationFrame(() => {
                const allSelectedItems = document.querySelectorAll('#inventory-grid .item-card.selected, #catalog-grid .item-card.selected');
                if (allSelectedItems.length > 0) {
                    if (window.updateTradeSummaryGlobal) {
                        window.updateTradeSummaryGlobal();
                    }
                }
            });

            Storage.remove('editingTrade');

        } catch (error) {
            Storage.remove('editingTrade');
        }
    }

    window.checkForEditMode = checkForEditMode;

    function validateRobuxLimits(robuxGive, robuxGet) {
        const MIN_ROBUX = 0;

        if (robuxGive < MIN_ROBUX) {
            Dialogs.alert('Invalid Robux Amount', 'Robux you give cannot be negative.', 'error');
            return false;
        }

        if (robuxGet < MIN_ROBUX) {
            Dialogs.alert('Invalid Robux Amount', 'Robux you want cannot be negative.', 'error');
            return false;
        }

        const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
        const totalGivingValue = Array.from(selectedInventory).reduce((sum, item) => {
            return sum + (parseInt(item.dataset.value) || 0);
        }, 0);

        const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card[data-quantity]:not([data-quantity="0"])');
        const totalReceivingValue = Array.from(selectedCatalog).reduce((sum, item) => {
            const quantity = parseInt(item.dataset.quantity) || 0;
            const itemValue = parseInt(item.dataset.value) || 0;
            return sum + (itemValue * quantity);
        }, 0);

        if (totalGivingValue > 0 && robuxGive > 0) {
            const maxRobuxGive = totalGivingValue * 0.5;
            if (robuxGive > maxRobuxGive) {
                Dialogs.alert('Invalid Robux Amount', `Robux you give (${robuxGive.toLocaleString()}) cannot exceed 50% of your offering items' total value (${totalGivingValue.toLocaleString()}). Maximum allowed: ${Math.floor(maxRobuxGive).toLocaleString()} Robux.`, 'error');
                return false;
            }
        }

        if (totalReceivingValue > 0 && robuxGet > 0) {
            const maxRobuxGet = totalReceivingValue * 0.5;
            if (robuxGet > maxRobuxGet) {
                Dialogs.alert('Invalid Robux Amount', `Robux you want (${robuxGet.toLocaleString()}) cannot exceed 50% of the receiving items' total value (${totalReceivingValue.toLocaleString()}). Maximum allowed: ${Math.floor(maxRobuxGet).toLocaleString()} Robux.`, 'error');
                return false;
            }
        }

        return true;
    }

    window.validateRobuxLimits = validateRobuxLimits;

    function migrateTradesForRobux() {

        let migrated = 0;

        const pendingTrades = Storage.get('pendingExtensionTrades', []);
        pendingTrades.forEach(trade => {
            if (trade.robuxGive === undefined) {
                trade.robuxGive = 0;
                migrated++;
            }
            if (trade.robuxGet === undefined) {
                trade.robuxGet = 0;
            }
        });
        Storage.set('pendingExtensionTrades', pendingTrades);

        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);
        finalizedTrades.forEach(trade => {
            if (trade.robuxGive === undefined) {
                trade.robuxGive = 0;
                migrated++;
            }
            if (trade.robuxGet === undefined) {
                trade.robuxGet = 0;
            }
        });
        Storage.set('finalizedExtensionTrades', finalizedTrades);

    }

    window.debugEditMode = function() {

        const inventoryCards = document.querySelectorAll('#inventory-grid .item-card');

        const itemGroups = {};
        inventoryCards.forEach((card, index) => {
            const itemName = card.dataset.item;
            if (!itemGroups[itemName]) {
                itemGroups[itemName] = [];
            }
            itemGroups[itemName].push({
                index: index,
                dataIndex: card.dataset.index,
                selected: card.classList.contains('selected'),
                onHold: card.dataset.onHold === 'true'
            });
        });

        const autoTrades = Storage.get('autoTrades', []);

        return { inventoryCards: inventoryCards.length, itemGroups, autoTrades: autoTrades.length };
    };

    function applyResponsiveItemSizing() {
        const itemsLists = document.querySelectorAll('.auto-trades-injected .items-list');

        itemsLists.forEach(list => {

            list.classList.remove('items-2', 'items-3', 'items-4', 'items-5', 'items-6', 'items-7', 'items-8-plus');

            const itemCount = list.querySelectorAll('.item-icon').length;

            if (itemCount === 2) {
                list.classList.add('items-2');
            } else if (itemCount === 3) {
                list.classList.add('items-3');
            } else if (itemCount === 4) {
                list.classList.add('items-4');
            } else if (itemCount === 5) {
                list.classList.add('items-5');
            } else if (itemCount === 6) {
                list.classList.add('items-6');
            } else if (itemCount === 7) {
                list.classList.add('items-7');
            } else if (itemCount >= 8) {
                list.classList.add('items-8-plus');
            }
        });
    }

    function observeForItemChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach((mutation) => {

                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList.contains('items-list') ||
                                node.querySelector && node.querySelector('.items-list')) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
            });

            if (shouldUpdate) {

                Utils.delay(50).then(() => applyResponsiveItemSizing());
            }
        });

        const container = document.querySelector('.auto-trades-injected');
        if (container) {
            observer.observe(container, {
                childList: true,
                subtree: true
            });
        }

        applyResponsiveItemSizing();
    }

    
    if (window.location.pathname.includes('/auto-trades') ||
        document.querySelector('.auto-trades-injected')) {

        Utils.delay(100).then(() => {
            applyResponsiveItemSizing();
            observeForItemChanges();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();