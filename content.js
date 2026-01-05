(function() {
    'use strict';

    function getCurrentPage() {
        return Pagination.getCurrentPage();
    }

    function setCurrentPage(page) {
        Pagination.setCurrentPage(page);
    }

    function getTotalPages() {
        return Pagination.getTotalPages();
    }

    function displayCurrentPage() {
        Pagination.displayCurrentPage();
    }

    window.loadThumbnailsForElements = Thumbnails.loadForElements;


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

    window.setupSettingsEventListeners = EventListeners.setupSettingsEventListeners;

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

    function updateCatalogVisual(catalogItem, newQuantity) {
        return Inventory.updateCatalogVisual(catalogItem, newQuantity);
    }

    const updateTradeSummary = TradeSummary.updateTradeSummary;
    window.updateTradeSummaryGlobal = updateTradeSummary;


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
        BridgeUtils.setupPageContextBridge();

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