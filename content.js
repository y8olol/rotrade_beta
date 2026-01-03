(function() {
    'use strict';

    window.thumbnailCache = JSON.parse(localStorage.getItem('thumbnailCache') || '{}');

    const cacheSize = Object.keys(window.thumbnailCache).length;

    function getCachedThumbnail(itemId) {

        if (window.thumbnailCache[itemId]) {
            return Promise.resolve({
                data: [{
                    targetId: itemId,
                    state: 'Completed',
                    imageUrl: window.thumbnailCache[itemId]
                }]
            });
        }

        return fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${itemId}&size=150x150&format=Png&isCircular=false`)
            .then(response => response.json())
            .then(data => {

                if (data.data && data.data[0] && data.data[0].imageUrl) {
                    window.thumbnailCache[itemId] = data.data[0].imageUrl;
                    localStorage.setItem('thumbnailCache', JSON.stringify(window.thumbnailCache));
                }
                return data;
            });
    }

    function getCachedThumbnailBatch(itemIds) {

        const cached = [];
        const uncachedIds = [];

        itemIds.forEach(id => {
            if (window.thumbnailCache[id]) {
                cached.push({
                    targetId: id,
                    state: 'Completed',
                    imageUrl: window.thumbnailCache[id]
                });
            } else {
                uncachedIds.push(id);
            }
        });

        if (uncachedIds.length === 0) {
            return Promise.resolve({ data: cached });
        }

        return fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${uncachedIds.join(',')}&size=150x150&format=Png&isCircular=false`)
            .then(response => response.json())
            .then(data => {

                if (data.data) {
                    data.data.forEach(item => {
                        if (item.imageUrl && item.state === 'Completed') {
                            window.thumbnailCache[item.targetId] = item.imageUrl;
                        }
                    });
                    localStorage.setItem('thumbnailCache', JSON.stringify(window.thumbnailCache));
                }

                return { data: [...cached, ...(data.data || [])] };
            });
    }

    function loadThumbnailsForElements(elements) {
        const itemsToLoad = [];
        const elementMap = new Map();

        elements.forEach(element => {
            const itemId = element.dataset.id || element.dataset.itemId;
            if (!itemId) return;

            if (window.thumbnailCache[itemId]) {

                const imageContainer = element.querySelector('.item-image, .item-icon') || element;
                if (imageContainer) {
                    imageContainer.innerHTML = `<img src="${window.thumbnailCache[itemId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
                }
            } else {

                itemsToLoad.push(itemId);
                if (!elementMap.has(itemId)) {
                    elementMap.set(itemId, []);
                }
                elementMap.get(itemId).push(element);
            }
        });

        if (itemsToLoad.length > 0) {

            getCachedThumbnailBatch(itemsToLoad)
                .then(data => {
                    if (data.data) {

                        data.data.forEach(item => {
                            if (item.imageUrl && item.state === 'Completed') {
                                const elements = elementMap.get(item.targetId.toString()) || [];
                                elements.forEach(element => {
                                    const imageContainer = element.querySelector('.item-image, .item-icon') || element;
                                    if (imageContainer) {
                                        imageContainer.innerHTML = `<img src="${item.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
                                    }
                                });
                            }
                        });
                    }
                })
                .catch(error => console.error('UI thumbnail loading failed:', error));
        }
    }

    window.loadThumbnailsForElements = loadThumbnailsForElements;

    window.selectInventoryItem = function(element, index) {
        element.classList.toggle('selected');
        if (window.updateTradeSummaryGlobal) {
            window.updateTradeSummaryGlobal();
        } else {
            console.error('updateTradeSummaryGlobal not available yet');
        }
    };

    window.selectCatalogItem = function(element, index) {
        element.classList.toggle('selected');
        if (window.updateTradeSummaryGlobal) {
            window.updateTradeSummaryGlobal();
        } else {
            console.error('updateTradeSummaryGlobal not available yet');
        }
    };

    function detectAndApplyTheme() {

        const isDarkMode = document.body.classList.contains('dark-theme') ||
                          document.documentElement.classList.contains('dark-theme') ||
                          document.querySelector('[data-theme="dark"]') ||
                          window.getComputedStyle(document.body).backgroundColor.includes('rgb(35, 37, 39)') ||
                          window.getComputedStyle(document.body).backgroundColor.includes('rgb(25, 27, 28)');

        const bodyBg = window.getComputedStyle(document.body).backgroundColor;

        const root = document.documentElement;
        if (isDarkMode) {

            root.style.setProperty('--auto-trades-bg-primary', '#232629');
            root.style.setProperty('--auto-trades-bg-secondary', '#1e2023');
            root.style.setProperty('--auto-trades-border', '#393b3d');
            root.style.setProperty('--auto-trades-text-primary', '#ffffff');
            root.style.setProperty('--auto-trades-text-secondary', '#bdbebe');
            root.style.setProperty('--auto-trades-text-muted', '#858585');
        } else {

            root.style.setProperty('--auto-trades-bg-primary', '#ffffff');
            root.style.setProperty('--auto-trades-bg-secondary', '#f5f5f5');
            root.style.setProperty('--auto-trades-border', '#e0e0e0');
            root.style.setProperty('--auto-trades-text-primary', '#191919');
            root.style.setProperty('--auto-trades-text-secondary', '#666666');
            root.style.setProperty('--auto-trades-text-muted', '#999999');
        }
    }

    function addAutoTradesTab() {
        const tradeLink = document.querySelector('a[href="https://www.roblox.com/trades"]');
        if (tradeLink) {
            const existingAutoTrades = document.querySelector('#nav-auto-trades');
            if (existingAutoTrades) return;

            const autoTradesLink = document.createElement('li');
            autoTradesLink.style.display = 'block';
            autoTradesLink.innerHTML = `
                <a class="dynamic-overflow-container text-nav" href="/auto-trades" id="nav-auto-trades" target="_self">
                    <div><span class="icon-nav-trade"></span></div>
                    <span class="font-header-2 dynamic-ellipsis-item" title="Auto Trades">Auto Trades</span>
                </a>
            `;

            const tradeListItem = tradeLink.closest('li');
            if (tradeListItem && tradeListItem.parentNode) {
                tradeListItem.parentNode.insertBefore(autoTradesLink, tradeListItem);
            }
        }
    }

    function handleRouting() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;

        const shouldLoadSendTrades = sessionStorage.getItem('loadSendTrades') === 'true';

        detectAndApplyTheme();

        if (currentPath === '/auto-trades') {
            document.body.classList.add('path-auto-trades');
            loadAutoTradesPage();
        } else if (currentPath === '/auto-trades/create') {
            document.body.classList.add('path-auto-trades-create');
            loadCreateTradePage();
        } else if (currentPath === '/auto-trades/settings') {
            document.body.classList.add('path-auto-trades-settings');
            loadSettingsPage();
        } else if (currentPath === '/trades' && shouldLoadSendTrades) {

            sessionStorage.removeItem('loadSendTrades');
            document.body.classList.add('path-auto-trades-send');
            loadSendTradesPage();
        } else if (currentPath === '/trades' && currentHash === '#/auto-trades-send') {
            document.body.classList.add('path-auto-trades-send');
            loadSendTradesPage();
        } else if (currentPath === '/auto-trades/send') {

            sessionStorage.setItem('loadSendTrades', 'true');
            window.location.href = '/trades';
        } else {
            document.body.classList.remove('path-auto-trades', 'path-auto-trades-create', 'path-auto-trades-send');
        }
    }

    function loadAutoTradesPage() {
        const content = `
            <div class="auto-trades-container">
                <div class="auto-trades-header">
                    <h1 class="auto-trades-title">Auto Trades</h1>
                    <div class="control-panel">
                        <a href="/auto-trades/settings" class="btn btn-secondary">
                            SETTINGS
                        </a>
                        <a href="/trades" class="btn btn-primary" id="send-trades">
                            SEND TRADES
                        </a>
                        <a href="/auto-trades/create" class="btn btn-success">
                            CREATE NEW AUTO TRADE
                        </a>
                    </div>
                </div>

                <div class="trade-filters">
                    <button class="filter-btn active" data-filter="auto-trades">Auto Trades</button>
                    <button class="filter-btn" data-filter="outbound">Outbound</button>
                    <button class="filter-btn" data-filter="expired">Expired</button>
                    <button class="filter-btn" data-filter="countered">Countered</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                </div>

                <div class="content-sections">
                    <div class="auto-trades-section" id="auto-trades-section">
                        <div class="auto-trades-grid" id="auto-trades-container">
                            <!-- Auto trade cards will be populated here -->
                        </div>
                    </div>

                    <div class="trades-section" id="outbound-section" style="display: none;">
                        <div class="trades-grid" id="outbound-container">
                            <!-- Outbound trades will be populated here -->
                        </div>
                    </div>

                    <div class="trades-section" id="expired-section" style="display: none;">
                        <div class="trades-grid" id="expired-container">
                            <!-- Expired trades will be populated here -->
                        </div>
                    </div>

                    <div class="trades-section" id="countered-section" style="display: none;">
                        <div class="trades-grid" id="countered-container">
                            <!-- Countered trades will be populated here -->
                        </div>
                    </div>

                    <div class="trades-section" id="completed-section" style="display: none;">
                        <div class="trades-grid" id="completed-container">
                            <!-- Completed trades will be populated here -->
                        </div>
                    </div>
                </div>

                <div class="empty-state" id="empty-state" style="display: none;">
                    <div class="empty-state-icon">🤖</div>
                    <div class="empty-state-title">No Auto Trades Yet</div>
                    <div class="empty-state-text">
                        Create your first automated trade to get started.<br>
                        Set up trades to run automatically and maximize your trading efficiency.
                    </div>
                </div>
            </div>
        `;

        replacePageContent(content);
        setupAutoTradesEventListeners();

    setTimeout(() => {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (activeFilterBtn) {
            activeFilterBtn.style.setProperty('border-bottom', '3px solid white', 'important');
        }
    }, 100);

        loadAutoTradeData().then(() => {
            loadOutboundTrades();
            loadExpiredTrades();
            loadCompletedTrades();

            setTimeout(async () => {

                if (!window.rolimonsData || Object.keys(window.rolimonsData).length === 0) {
                    await loadRolimonsData();
                }

                loadAutoTradeItemThumbnails();
                loadAutoTradeItemThumbnails('outbound-container');
                loadAutoTradeItemThumbnails('expired-container');
                loadAutoTradeItemThumbnails('completed-container');
            }, 500);
        });

        setTimeout(() => {
            loadAutoTradeItemThumbnails();

        }, 500);
    }

    function loadCreateTradePage() {
        const content = `
            <div class="create-trade-container">
                <a href="/auto-trades" class="back-link">
                    ← Back to Auto Trades
                </a>

                <div class="auto-trades-header">
                    <h1 class="auto-trades-title">Create Auto Trade</h1>
                </div>

                <div class="trade-builder">
                    <div class="section">
                        <div class="section-title">
                            <span class="icon-nav-inventory"></span> Your Inventory
                        </div>
                        <div class="search-bar">
                            <input type="text" class="search-input" placeholder="Search your items..." id="inventory-search">
                            <button class="btn btn-secondary">
                                <span class="icon-search"></span>
                            </button>
                        </div>
                        <div class="items-grid" id="inventory-grid">
                            <!-- Inventory items will be loaded here -->
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">
                            <span class="icon-catalog"></span> Target Items
                        </div>
                        <div class="search-bar">
                            <input type="text" class="search-input" placeholder="Search Roblox catalog..." id="catalog-search">
                            <button class="btn btn-secondary">
                                <span class="icon-search"></span>
                            </button>
                        </div>
                        <div class="items-grid" id="catalog-grid">
                            <!-- Catalog items will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="trade-summary">
                    <div class="section-title">Trade Preview</div>
                    <div class="summary-content">
                        <div class="summary-section">
                            <div class="summary-title">You Give</div>
                            <div class="summary-items" id="giving-items">
                                <div class="item-icon" style="border: 2px dashed #c6c6c6; background: transparent;">
                                    <span style="color: #999;">Select Items</span>
                                </div>
                            </div>
                        </div>
                        <div class="summary-arrow">→</div>
                        <div class="summary-section">
                            <div class="summary-title">You Get</div>
                            <div class="summary-items" id="receiving-items">
                                <div class="item-icon" style="border: 2px dashed #c6c6c6; background: transparent;">
                                    <span style="color: #999;">Select Items</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="trade-settings">

                        <!-- ROBUX SECTION (moved to top, no header) -->
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label class="setting-label">Robux You Give</label>
                                <input type="number" class="setting-input" placeholder="0" min="0" id="robux-give">
                                <div class="robux-info" id="robux-give-info" style="font-size: 12px; color: #888; margin-top: 5px;"></div>
                            </div>
                            <div class="setting-group">
                                <label class="setting-label">Robux You Want</label>
                                <input type="number" class="setting-input" placeholder="0" min="0" id="robux-get">
                                <div class="robux-info" id="robux-get-info" style="font-size: 12px; color: #888; margin-top: 5px;"></div>
                            </div>
                        </div>

                        <!-- TRADE SETTINGS (moved below robux) -->
                        <div class="settings-grid" style="margin-top: 15px;">
                            <div class="setting-group">
                                <label class="setting-label">Auto Trade Name</label>
                                <input type="text" class="setting-input" placeholder="Enter your trade name" id="auto-trade-name">
                            </div>
                            <div class="setting-group">
                                <label class="setting-label">Max Trades Per Day</label>
                                <input type="number" class="setting-input" value="5" min="1" max="50" id="max-trades">
                            </div>
                        </div>

                        <div style="text-align: center; margin-top: 20px;">
                            <button class="btn btn-success" id="create-auto-trade" style="font-size: 14px; padding: 12px 30px;">
                                CREATE AUTO TRADE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        replacePageContent(content);
        setupCreateTradeEventListeners();
        loadInventoryData();
        loadCatalogData();

        setTimeout(() => {
            checkForEditMode();
        }, 1500);
    }

    function loadSettingsPage() {
        const settings = getSettings();

        const content = `
            <div class="auto-trades-container">
                <a href="/auto-trades" class="back-link">← Back to Auto Trades</a>

                <div class="auto-trades-header">
                    <h1 class="auto-trades-title">Settings</h1>
                </div>

                <div class="settings-sections">
                    <div class="settings-section">
                        <h3>Common Owners Fetching</h3>
                        <p class="section-description">Adjust parameters for finding users who own the items you want to trade for.</p>

                        <div class="setting-group">
                            <label class="setting-label">Max Owner Days</label>
                            <input type="number" id="maxOwnerDays" class="setting-input" value="${settings.maxOwnerDays}" min="1" max="999999999" />
                            <small class="setting-help">Maximum days since user owned the items (current: ${settings.maxOwnerDays.toLocaleString()})</small>
                        </div>

                        <div class="setting-group">
                            <label class="setting-label">Last Online Days</label>
                            <input type="number" id="lastOnlineDays" class="setting-input" value="${settings.lastOnlineDays}" min="1" max="365" />
                            <small class="setting-help">Maximum days since user was last online (current: ${settings.lastOnlineDays})</small>
                        </div>

                        <div class="setting-actions">
                            <button class="btn btn-secondary" id="save-settings">Save Settings</button>
                            <button class="btn btn-opposite" id="reset-settings">Reset to Defaults</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        replacePageContent(content);
        setupSettingsEventListeners();
    }

    function getSettings() {
        const defaults = {
            maxOwnerDays: 100000000,
            lastOnlineDays: 3
        };
        return { ...defaults, ...JSON.parse(localStorage.getItem('rotradeSettings') || '{}') };
    }

    function saveSettings(settings) {
        localStorage.setItem('rotradeSettings', JSON.stringify(settings));
    }

    function setupSettingsEventListeners() {
        const saveBtn = document.getElementById('save-settings');
        const resetBtn = document.getElementById('reset-settings');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const maxOwnerDays = parseInt(document.getElementById('maxOwnerDays').value) || 100000000;
                const lastOnlineDays = parseInt(document.getElementById('lastOnlineDays').value) || 3;

                if (maxOwnerDays < 1 || maxOwnerDays > 999999999) {
                    alert('Max Owner Days must be between 1 and 999,999,999');
                    return;
                }

                if (lastOnlineDays < 1 || lastOnlineDays > 365) {
                    alert('Last Online Days must be between 1 and 365');
                    return;
                }

                const settings = { maxOwnerDays, lastOnlineDays };
                saveSettings(settings);

                saveBtn.textContent = 'Settings Saved!';
                setTimeout(() => {
                    saveBtn.textContent = 'Save Settings';
                }, 2000);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset settings to default values?')) {
                    document.getElementById('maxOwnerDays').value = 100000000;
                    document.getElementById('lastOnlineDays').value = 3;
                }
            });
        }
    }

    function replacePageContent(newContent) {

        let contentContainer = document.querySelector('.container-main .row-fluid') ||
                              document.querySelector('#wrap .row-fluid') ||
                              document.querySelector('.content-container') ||
                              document.querySelector('.container-main');

        if (!contentContainer) {

            contentContainer = document.querySelector('#wrap') || document.querySelector('.container-main');
        }

        if (contentContainer) {

            const contentElements = contentContainer.querySelectorAll(':scope > *:not(.auto-trades-injected)');
            contentElements.forEach(el => {
                el.style.display = 'none';
            });
        }

        const existing = document.querySelector('.auto-trades-injected');
        if (existing) existing.remove();

        const wrapper = document.createElement('div');
        wrapper.className = 'auto-trades-injected';
        wrapper.innerHTML = newContent;

        if (contentContainer) {
            contentContainer.appendChild(wrapper);
        } else {
            document.body.appendChild(wrapper);
        }
    }

    function setupAutoTradesEventListeners() {

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {

            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.style.setProperty('border-bottom', 'none', 'important');
            });

            e.target.classList.add('active');
            e.target.style.setProperty('border-bottom', '3px solid white', 'important');

            const filter = e.target.dataset.filter;

                document.getElementById('auto-trades-section').style.display = 'none';
                document.getElementById('outbound-section').style.display = 'none';
                document.getElementById('expired-section').style.display = 'none';
                document.getElementById('countered-section').style.display = 'none';

                document.getElementById('auto-trades-section').style.display = 'none';
                document.getElementById('outbound-section').style.display = 'none';
                document.getElementById('expired-section').style.display = 'none';
                document.getElementById('countered-section').style.display = 'none';
                document.getElementById('completed-section').style.display = 'none';

                if (filter === 'auto-trades') {
                    document.getElementById('auto-trades-section').style.display = 'block';
                } else if (filter === 'outbound') {
                    document.getElementById('outbound-section').style.display = 'block';

                    loadOutboundTrades();

                    setTimeout(() => {
                        loadEnhancedTradeItemThumbnails('outbound-container');
                    }, 1000);
                } else if (filter === 'expired') {
                    document.getElementById('expired-section').style.display = 'block';

                    loadExpiredTrades();

                    setTimeout(() => {
                        loadEnhancedTradeItemThumbnails('expired-container');
                    }, 1000);
                } else if (filter === 'countered') {
                    document.getElementById('countered-section').style.display = 'block';

                    loadCounteredTrades();

                    setTimeout(() => {
                        loadEnhancedTradeItemThumbnails('countered-container');
                    }, 1000);
                } else if (filter === 'completed') {
                    document.getElementById('completed-section').style.display = 'block';

                    loadCompletedTrades();

                    setTimeout(() => {
                        loadEnhancedTradeItemThumbnails('completed-container');
                    }, 1000);
                }
            });
        });

        const sendTradesBtn = document.getElementById('send-trades');
        if (sendTradesBtn) {
            sendTradesBtn.addEventListener('click', (e) => {
                e.preventDefault();

                sessionStorage.setItem('loadSendTrades', 'true');

                window.location.href = '/trades';
            });
        }

        const startBtn = document.getElementById('start-auto-trades');
        const stopBtn = document.getElementById('stop-auto-trades');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-flex';

            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                stopBtn.style.display = 'none';
                startBtn.style.display = 'inline-flex';

            });
        }
    }

    function setupCreateTradeEventListeners() {

        const backBtn = document.querySelector('.back-link');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/auto-trades';
            });
        }

        const inventorySearch = document.getElementById('inventory-search');
        if (inventorySearch) {
            inventorySearch.addEventListener('input', (e) => {
                filterInventory(e.target.value);
            });
        }

        const catalogSearch = document.getElementById('catalog-search');
        if (catalogSearch) {
            catalogSearch.addEventListener('input', (e) => {
                filterCatalog(e.target.value);
            });
        }

        const createBtn = document.getElementById('create-auto-trade');
        if (createBtn) {
            createBtn.addEventListener('click', createAutoTrade);
        }

        const robuxGiveInput = document.getElementById('robux-give');
        const robuxGetInput = document.getElementById('robux-get');
        const robuxGiveInfo = document.getElementById('robux-give-info');
        const robuxGetInfo = document.getElementById('robux-get-info');

        if (robuxGiveInput && robuxGiveInfo) {
            robuxGiveInput.addEventListener('input', () => validateRobuxInput('give'));
        }
        if (robuxGetInput && robuxGetInfo) {
            robuxGetInput.addEventListener('input', () => validateRobuxInput('get'));
        }

        function updateRobuxValidation() {
            if (robuxGiveInput && robuxGiveInput.value) validateRobuxInput('give');
            if (robuxGetInput && robuxGetInput.value) validateRobuxInput('get');

            updateTradeSummary();
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('item-card')) {
                setTimeout(updateRobuxValidation, 100);
            }
        });

        if (robuxGiveInput) {
            robuxGiveInput.addEventListener('input', () => {
                validateRobuxInput('give');
                setTimeout(updateTradeSummary, 100);
            });
        }
        if (robuxGetInput) {
            robuxGetInput.addEventListener('input', () => {
                validateRobuxInput('get');
                setTimeout(updateTradeSummary, 100);
            });
        }

        function validateRobuxInput(side) {
            const input = side === 'give' ? robuxGiveInput : robuxGetInput;
            const info = side === 'give' ? robuxGiveInfo : robuxGetInfo;
            const rawAmount = parseInt(input.value) || 0;

            if (rawAmount === 0) {
                info.textContent = '';
                info.style.color = '#888';
                return;
            }

            const afterTax = Math.floor(rawAmount * 0.7);

            const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
            const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card.selected');

            let currentRap = 0;
            if (side === 'give') {

                currentRap = Array.from(selectedInventory).reduce((sum, item) => sum + (parseInt(item.dataset.rap) || 0), 0);
            } else {

                currentRap = Array.from(selectedCatalog).reduce((sum, item) => sum + (parseInt(item.dataset.rap) || 0), 0);
            }

            const maxAllowed = Math.floor(currentRap * 0.5);

            if (currentRap === 0) {
                info.textContent = `⚠️ Select ${side === 'give' ? 'inventory' : 'catalog'} items first to use robux`;
                info.style.color = '#ffc107';
                input.style.borderColor = '#ffc107';
                return;
            }

            if (rawAmount > maxAllowed) {
                info.textContent = `❌ Max allowed: ${maxAllowed.toLocaleString()} (50% of ${currentRap.toLocaleString()} RAP)`;
                info.style.color = '#dc3545';
                input.style.borderColor = '#dc3545';
            } else {
                info.textContent = `✅ After 30% tax: ${afterTax.toLocaleString()} robux will be added`;
                info.style.color = '#28a745';
                input.style.borderColor = '#28a745';
            }
        }

        window.validateRobuxLimits = validateRobuxLimits;

        function validateRobuxLimits(robuxGive, robuxGet) {

            const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
            const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card.selected');

            const givingRap = Array.from(selectedInventory).reduce((sum, item) => sum + (parseInt(item.dataset.rap) || 0), 0);
            const receivingRap = Array.from(selectedCatalog).reduce((sum, item) => sum + (parseInt(item.dataset.rap) || 0), 0);

            if (robuxGive > 0 && robuxGive > givingRap * 0.5) {
                const maxGive = Math.floor(givingRap * 0.5);
                alert(`❌ Robux you give (${robuxGive.toLocaleString()}) exceeds 50% limit.\nMax allowed: ${maxGive.toLocaleString()} (50% of ${givingRap.toLocaleString()} RAP)`);
                return false;
            }

            if (robuxGet > 0 && robuxGet > receivingRap * 0.5) {
                const maxGet = Math.floor(receivingRap * 0.5);
                alert(`❌ Robux you want (${robuxGet.toLocaleString()}) exceeds 50% limit.\nMax allowed: ${maxGet.toLocaleString()} (50% of ${receivingRap.toLocaleString()} RAP)`);
                return false;
            }

            return true;
        }
    }

    async function loadAutoTradeData() {
        let autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

        let rolimonData = {};
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'fetchRolimons'
            });

            if (response.success) {
                rolimonData = response.data.items || {};
            } else {
            }
        } catch (error) {
        }

        if (Object.keys(rolimonData).length > 0) {
            autoTrades = autoTrades.map(trade => {
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

        }

        displayAutoTrades(autoTrades);
    }

    async function loadOutboundTrades() {

        const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');

        if (pendingTrades.length === 0) {
            displayTrades([], 'outbound-container');
            return;
        }

        const formattedTrades = pendingTrades.map(trade => {

            if (trade.giving && trade.receiving) {
                return {
                    ...trade,
                    timestamp: trade.created,
                    user: trade.user || `User ${trade.targetUserId}`,
                    status: 'outbound'
                };
            } else {

                return {
                    id: trade.id,
                    type: 'Extension Trade',
                    tradeName: trade.tradeName,
                    targetUserId: trade.targetUserId,
                    created: new Date(trade.created).toLocaleString(),
                    status: 'Pending'
                };
            }
        });

        displayTrades(formattedTrades, 'outbound-container');
    }

    function loadExpiredTrades() {
        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');
        const expiredTrades = finalizedTrades
            .filter(trade => ['expired', 'declined'].includes(trade.status))
            .map(trade => {

                return {
                    ...trade,
                    type: 'Extension Trade',
                    expired: new Date(trade.finalizedAt).toLocaleString()
                };
            });

        displayTrades(expiredTrades, 'expired-container');
    }

    function loadCounteredTrades() {
        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');
        const counteredTrades = finalizedTrades
            .filter(trade => ['countered'].includes(trade.status))
            .map(trade => {

                return {
                    ...trade,
                    type: 'Extension Trade',
                    countered: new Date(trade.finalizedAt).toLocaleString()
                };
            });

        displayTrades(counteredTrades, 'countered-container');
    }

    function displayAutoTrades(autoTrades) {
        const container = document.getElementById('auto-trades-container');
        const emptyState = document.getElementById('empty-state');

        if (!container) return;

        if (autoTrades.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = autoTrades.map(autoTrade => {

            const yourRap = autoTrade.giving.reduce((sum, item) => sum + item.rap, 0) + (autoTrade.robuxGive || 0) * 0.7;
            const yourVal = autoTrade.giving.reduce((sum, item) => sum + item.value, 0) + (autoTrade.robuxGive || 0) * 0.7;
            const theirRap = autoTrade.receiving.reduce((sum, item) => sum + item.rap, 0) + (autoTrade.robuxGet || 0) * 0.7;
            const theirVal = autoTrade.receiving.reduce((sum, item) => sum + item.value, 0) + (autoTrade.robuxGet || 0) * 0.7;

            const rapProfit = theirRap - yourRap;
            const valProfit = theirVal - yourVal;

            const maxTrades = autoTrade.settings?.maxTrades || autoTrade.settings?.maxTradesPerDay || 5;
            const tradesExecutedToday = getTodayTradeCount(autoTrade.id);

            const statusIcon = tradesExecutedToday >= maxTrades ? '✅' : '⏳';
            const statusText = tradesExecutedToday >= maxTrades ?
                `COMPLETE (${tradesExecutedToday}/${maxTrades})` :
                `INCOMPLETE (${tradesExecutedToday}/${maxTrades})`;

            return `
                <div class="auto-trade-card" data-status="${autoTrade.status}" data-id="${autoTrade.id}">
                    <div class="auto-trade-header">
                        <div class="auto-trade-name">${autoTrade.name}</div>
                        <div class="auto-trade-status status-${autoTrade.status}">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>

                    <div class="auto-trade-items">
                        <div class="items-section">
                            <div class="items-title">You Give</div>
                            <div class="items-list">
                                ${autoTrade.giving.map(item =>
                                    `<div class="item-icon" title="${item.name}&#10;RAP ${item.rap.toLocaleString()}&#10;VAL ${item.value.toLocaleString()}">${item.name.substring(0, 2)}</div>`
                                ).join('')}
                            </div>
                        </div>

                        <div class="items-section">
                            <div class="items-title">You Get</div>
                            <div class="items-list">
                                ${autoTrade.receiving.map(item =>
                                    `<div class="item-icon" title="${item.name}&#10;RAP ${item.rap.toLocaleString()}&#10;VAL ${item.value.toLocaleString()}">${item.name.substring(0, 2)}</div>`
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
                        <div class="trade-actions-inline" style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
                            <button class="edit-auto-trade" data-trade-id="${autoTrade.id}" style="
                                background: transparent !important;
                                border: 1px solid #444 !important;
                                color: #fff !important;
                                width: 32px !important;
                                height: 32px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                font-size: 14px !important;
                                padding: 0 !important;
                                box-shadow: none !important;
                            ">✏️</button>
                            <button class="delete-auto-trade" data-trade-id="${autoTrade.id}" style="
                                background: transparent !important;
                                border: 1px solid #444 !important;
                                color: #fff !important;
                                width: 32px !important;
                                height: 32px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                font-size: 14px !important;
                                padding: 0 !important;
                                box-shadow: none !important;
                            ">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const autoTradesContainer = document.getElementById('auto-trades-container');
        if (autoTradesContainer) {

            autoTradesContainer.removeEventListener('click', handleAutoTradeActions);
            autoTradesContainer.addEventListener('click', handleAutoTradeActions);
        }

        loadAutoTradeItemThumbnails();
    }

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
            containerSelector = `#${containerId} .trade-card`;
        } else {
            containerSelector = '.auto-trade-card';
        }

        const tradeCards = document.querySelectorAll(containerSelector);

        if (tradeCards.length === 0) {
            return;
        }

        loadRolimonsData().then(rolimonsItems => {

            const itemNameToId = {};
            rolimonsItems.forEach(item => {
                itemNameToId[item.name] = item.id;
            });

            const itemsToProcess = [];
            const processedItems = new Set();

            tradeCards.forEach(card => {
                const itemIcons = card.querySelectorAll('.item-icon');

                itemIcons.forEach(icon => {
                    const itemName = icon.getAttribute('title')?.split('\n')[0];
                    if (itemName && itemNameToId[itemName]) {
                        const itemId = itemNameToId[itemName];
                        const itemKey = `${itemName}-${itemId}`;

                        if (!processedItems.has(itemKey)) {
                            processedItems.add(itemKey);
                            itemsToProcess.push({
                                name: itemName,
                                id: itemId,
                                icons: []
                            });
                        }

                        const itemToProcess = itemsToProcess.find(item =>
                            item.name === itemName && item.id == itemId
                        );
                        if (itemToProcess) {
                            itemToProcess.icons.push(icon);
                        }
                    } else if (itemName) {
                    }
                });
            });

            processItemsWithDelay(itemsToProcess, 0);
        });
    }

    function loadItemThumbnailById(iconElement, itemName, itemId) {
        return new Promise((resolve, reject) => {

            getCachedThumbnail(itemId)
                .then(data => {
                    if (data.data && data.data[0] && data.data[0].imageUrl) {
                        iconElement.innerHTML = `<img src="${data.data[0].imageUrl}" alt="${itemName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    async function processItemsWithDelay(items, index) {
        if (index >= items.length) {
            return;
        }

        const item = items[index];

        await loadItemThumbnailByIdWithRetry(item.icons, item.name, item.id, 3);

        setTimeout(() => {
            processItemsWithDelay(items, index + 1);
        }, 150);
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
                    await new Promise(resolve => setTimeout(resolve, delay));
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
                        iconElement.innerHTML = `<img src="${data.data[0].imageUrl}" alt="${itemName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
                    } else {
                    }
                })
                .catch(error => {

                });
        } else {
        }
    }

    function handleAutoTradeActions(e) {
        if (e.target.classList.contains('delete-auto-trade')) {
            const tradeId = e.target.getAttribute('data-trade-id');
            if (tradeId && confirm('Are you sure you want to delete this auto trade?')) {

                const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

                const updatedTrades = autoTrades.filter(trade => {
                    const match = trade.id !== tradeId &&
                                 String(trade.id) !== String(tradeId) &&
                                 trade.id !== parseInt(tradeId);
                    return match;
                });

                localStorage.setItem('autoTrades', JSON.stringify(updatedTrades));

                displayAutoTrades(updatedTrades);

            }
        } else if (e.target.classList.contains('edit-auto-trade')) {
            const tradeId = e.target.getAttribute('data-trade-id');
            if (tradeId) {

                const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

                let tradeToEdit = autoTrades.find(trade => trade.id === tradeId);

                if (!tradeToEdit) {
                    tradeToEdit = autoTrades.find(trade => String(trade.id) === String(tradeId));
                }

                if (!tradeToEdit && !isNaN(tradeId)) {
                    tradeToEdit = autoTrades.find(trade => trade.id === parseInt(tradeId));
                }

                if (tradeToEdit) {

                    localStorage.setItem('editingTrade', JSON.stringify(tradeToEdit));

                    window.location.href = '/auto-trades/create';
                } else {
                    console.error('❌ Trade not found with ID:', tradeId);
                    console.error('📋 Available trade IDs:', autoTrades.map(t => t.id));
                }
            }
        }
    }

    function deleteAutoTrade(id) {
        if (confirm('Are you sure you want to delete this auto trade? This action cannot be undone.')) {

            let autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');
            autoTrades = autoTrades.filter(trade => trade.id != id);
            localStorage.setItem('autoTrades', JSON.stringify(autoTrades));

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
    }

    function displayTrades(trades, containerId) {
        const container = document.getElementById(containerId);

        if (!container) return;

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

                const yourRap = trade.giving.reduce((sum, item) => sum + (item.rap || 0), 0) + (trade.robuxGive || 0) * 0.7;
                const yourVal = trade.giving.reduce((sum, item) => sum + (item.value || 0), 0) + (trade.robuxGive || 0) * 0.7;
                const theirRap = trade.receiving.reduce((sum, item) => sum + (item.rap || 0), 0) + (trade.robuxGet || 0) * 0.7;
                const theirVal = trade.receiving.reduce((sum, item) => sum + (item.value || 0), 0) + (trade.robuxGet || 0) * 0.7;

                const rapProfit = theirRap - yourRap;
                const valProfit = theirVal - yourVal;

                let statusColor, statusText, statusBg;
                if (containerId.includes('completed') || containerId.includes('expired') || containerId.includes('countered')) {

                    if (trade.status === 'declined') {
                        statusColor = '#dc3545';
                        statusBg = 'rgba(220, 53, 69, 0.2)';
                        statusText = 'EXPIRED';
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

        setTimeout(() => {
            loadEnhancedTradeItemThumbnails(containerId);
        }, 500);

        if (document.visibilityState === 'visible') {
            setTimeout(() => {
                loadEnhancedTradeItemThumbnails(containerId);
            }, 1000);
        }
    }

    async function loadRolimonsData() {

        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "fetchRolimons" }, (response) => {
                if (response && response.success && response.data) {

                    const limiteds = [];
                    for (const [itemId, itemData] of Object.entries(response.data.items || {})) {

                        if (limiteds.length < 5) {
                        }

                        if (itemData && Array.isArray(itemData) && itemData.length >= 5) {
                            const name = itemData[0];
                            const rap = itemData[2];
                            const value = itemData[4];

                            if (name && typeof name === 'string' && name.trim() !== '' && value && value > 0) {
                                limiteds.push({
                                    name: name.trim(),
                                    value: parseInt(value),
                                    rap: parseInt(rap),
                                    id: parseInt(itemId),
                                    rarity: value > 50000 ? 'legendary' : value > 10000 ? 'rare' : 'common'
                                });
                            }
                        }
                    }

                    const sortedLimiteds = limiteds.sort((a, b) => b.value - a.value);

                    if (sortedLimiteds.length < 10) {
                        const fallbackItems = getFallbackItems();
                        resolve([...sortedLimiteds, ...fallbackItems]);
                    } else {
                        resolve(sortedLimiteds);
                    }
                } else {
                    resolve(getFallbackItems());
                }
            });
        });
    }

    function getFallbackItems() {
        return [
            { name: 'Dominus Empyreus', value: 25000, rap: 23500, id: 21070012, rarity: 'legendary' },
            { name: 'Valkyrie Helm', value: 12000, rap: 11800, id: 1365767, rarity: 'rare' },
            { name: 'Sparkle Time Fedora', value: 8500, rap: 8200, id: 1285307, rarity: 'rare' },
            { name: 'Clockwork Headphones', value: 6000, rap: 5800, id: 1235488, rarity: 'uncommon' },
            { name: 'Beautiful Hair', value: 3200, rap: 3100, id: 16630147, rarity: 'common' },
            { name: 'Crimson Amulet', value: 15000, rap: 14500, id: 1365781, rarity: 'legendary' },
            { name: 'Golden Crown', value: 4500, rap: 4200, id: 1199220, rarity: 'uncommon' },
            { name: 'Blue Bandana', value: 1200, rap: 1150, id: 86896502, rarity: 'common' }
        ];
    }

    async function loadInventoryData() {
        try {

            const userId = await getCurrentUserId();
            if (!userId) {
                const limiteds = await loadRolimonsData();
                displayInventory(limiteds.slice(0, 50));
                return;
            }

            const userInventory = await getUserCollectibles(userId);

            if (userInventory.length === 0) {
                const limiteds = await loadRolimonsData();
                displayInventory(limiteds.slice(0, 50));
                return;
            }

            displayInventory(userInventory);

        } catch (error) {
            console.error('💥 Error loading user inventory:', error);

            const limiteds = await loadRolimonsData();
            displayInventory(limiteds.slice(0, 50));
        }
    }

    async function getCurrentUserId() {
        try {

            if (window.location.href.includes('/users/')) {
                const urlMatch = window.location.href.match(/\/users\/(\d+)/);
                if (urlMatch) {
                    const foundUserId = parseInt(urlMatch[1]);
                    return foundUserId;
                }
            }

            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: "fetchUserAuth" }, (response) => {
                    if (response && response.success && response.data.id) {
                        const authUserId = response.data.id;
                        resolve(authUserId);
                    } else {

                        const userElements = document.querySelectorAll('[data-userid]');
                        for (const element of userElements) {
                            const userId = element.getAttribute('data-userid');
                            if (userId && userId !== '0') {
                                const pageUserId = parseInt(userId);
                                resolve(pageUserId);
                                return;
                            }
                        }

                        resolve(null);
                    }
                });
            });
        } catch (error) {
            console.error('💥 Error getting user ID:', error);
            return null;
        }
    }

    async function getUserCollectibles(userId) {
        try {

            const rolimonData = {};
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'fetchRolimons'
                });

                if (response.success) {
                    Object.assign(rolimonData, response.data.items || {});
                }
            } catch (error) {
            }

            const collectibles = [];
            let cursor = null;
            let pageCount = 0;
            const maxPages = 5;

            do {

                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: "fetchUserInventory",
                        userId: userId,
                        cursor: cursor
                    }, (response) => {
                        resolve(response);
                    });
                });

                if (!response || !response.success) {
                    const errorMsg = response?.error || 'Unknown error from background script';
                    console.error(`💥 Background script error on page ${pageCount + 1}:`, errorMsg);
                    throw new Error(errorMsg);
                }

                const data = response.data;

                if (data.data && data.data.length > 0) {

                    const pageItems = data.data.map(item => {

                        const rolimonItem = Object.values(rolimonData).find(r => r[0] === item.name);
                        let rap = item.recentAveragePrice || 1000;
                        let value = item.recentAveragePrice || 1000;

                        if (rolimonItem) {
                            rap = rolimonItem[2];
                            value = rolimonItem[4];
                        } else {
                        }

                        return {
                            name: item.name,
                            id: item.assetId,
                            value: value,
                            rap: rap,
                            serialNumber: item.serialNumber || null,
                            userAssetId: item.userAssetId || null,
                            isOnHold: item.isOnHold || false,
                            copies: 1,
                            rarity: value > 50000 ? 'legendary' :
                                   value > 10000 ? 'rare' : 'common'
                        };
                    });

                    collectibles.push(...pageItems);
                }

                cursor = data.nextPageCursor;
                pageCount++;

                if (cursor && pageCount < maxPages) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

            } while (cursor && pageCount < maxPages);

            const itemCounts = {};
            collectibles.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
            });

            const duplicates = Object.entries(itemCounts).filter(([name, count]) => count > 1);
            if (duplicates.length > 0) {

            }

            return collectibles;

        } catch (error) {
            console.error('💥 Error fetching user collectibles:', error);
            return [];
        }
    }

    async function loadCatalogData() {
        try {
            const limiteds = await loadRolimonsData();

            if (limiteds.length === 0) {
                const fallback = getFallbackItems();
                displayCatalog(fallback.slice(0, 8));
                return;
            }

            displayCatalog(limiteds);
        } catch (error) {
            console.error('Error loading catalog:', error);

            const fallback = getFallbackItems();
            displayCatalog(fallback);
        }
    }

    function displayInventory(items) {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        grid.innerHTML = items.map((item, index) => `
            <div class="item-card ${item.isOnHold ? 'on-hold' : ''}" data-item="${item.name}" data-value="${item.value}" data-rap="${item.rap}" data-id="${item.id}" data-index="${index}" data-type="inventory" data-on-hold="${item.isOnHold || false}">
                <div class="item-image">
                    <div style="width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 11px; color: rgb(255, 255, 255); font-weight: 600; display: flex; background: #2a2d30; border-radius: 4px;">
                        ${item.name.substring(0, 3).toUpperCase()}
                    </div>
                </div>
                ${item.isOnHold ? '<div class="hold-indicator">🕒</div>' : ''}
                <div class="item-name" title="${item.name}">${item.name}</div>
                <div class="item-pricing">
                    <div class="item-value rap-text">RAP ${item.rap.toLocaleString()}</div>
                    <div class="item-rap val-text">VAL ${item.value.toLocaleString()}</div>
                </div>
            </div>
        `).join('');

        grid.addEventListener('click', function(e) {
            const itemCard = e.target.closest('.item-card');
            if (itemCard && itemCard.dataset.type === 'inventory') {

                if (itemCard.dataset.onHold === 'true') {
                    return;
                }

                const isSelected = itemCard.classList.contains('selected');

                if (isSelected) {

                    itemCard.classList.remove('selected');
                    itemCard.style.removeProperty('--quantity-number');
                } else {

                    const selectedItems = grid.querySelectorAll('.item-card.selected');
                    if (selectedItems.length >= 4) {
                        alert('You can only select up to 4 items from your inventory.');
                        return;
                    }

                    itemCard.classList.add('selected');
                    itemCard.style.setProperty('--quantity-number', '"1"');
                }

                updateTradeSummary();
            }
        });

        loadActualThumbnails('inventory-grid', items);
    }

    function displayCatalog(items) {
        const grid = document.getElementById('catalog-grid');
        if (!grid) return;

        grid.innerHTML = items.map((item, index) => `
            <div class="item-card" data-item="${item.name}" data-value="${item.value}" data-rap="${item.rap}" data-id="${item.id}" data-index="${index}" data-type="catalog" data-quantity="0">
                <div class="item-image">
                    <div style="width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 11px; color: rgb(255, 255, 255); font-weight: 600; display: flex; background: #2a2d30; border-radius: 4px;">
                        ${item.name.substring(0, 3).toUpperCase()}
                    </div>
                </div>
                <div class="item-name" title="${item.name}">${item.name}</div>
                <div class="item-pricing">
                    <div class="item-value rap-text">RAP ${item.rap.toLocaleString()}</div>
                    <div class="item-rap val-text">VAL ${item.value.toLocaleString()}</div>
                </div>
            </div>
        `).join('');

        grid.addEventListener('click', function(e) {
            const itemCard = e.target.closest('.item-card');
            if (itemCard && itemCard.dataset.type === 'catalog') {

                const currentQuantity = parseInt(itemCard.dataset.quantity) || 0;
                const nextQuantity = (currentQuantity + 1) % 5;

                itemCard.dataset.quantity = nextQuantity;

                if (nextQuantity === 0) {

                    itemCard.classList.remove('selected');
                    itemCard.style.removeProperty('--quantity-number');
                } else {

                    itemCard.classList.add('selected');
                    itemCard.style.setProperty('--quantity-number', `"${nextQuantity}"`);
                }

                updateTradeSummary();
            }
        });

        loadActualThumbnails('catalog-grid', items);
    }

    function updateCatalogVisual(catalogItem, newQuantity) {
        catalogItem.dataset.quantity = newQuantity;

        if (newQuantity === 0) {
            catalogItem.classList.remove('selected');
            catalogItem.style.removeProperty('--quantity-number');
        } else {
            catalogItem.classList.add('selected');
            catalogItem.style.setProperty('--quantity-number', `"${newQuantity}"`);
        }
    }

    function loadActualThumbnails(gridId, items) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }

        batches.forEach((batch, batchIndex) => {
            setTimeout(() => {
                processThumbnailBatch(batch, batchIndex + 1, batches.length, grid);
            }, batchIndex * 300);
        });
    }

    function processThumbnailBatch(items, batchNumber, totalBatches, grid) {
        const itemIds = items.map(item => item.id);

        getCachedThumbnailBatch(itemIds)
            .then(data => {
                if (data.data && data.data.length > 0) {

                    data.data.forEach(thumb => {
                        if (thumb.imageUrl && thumb.state === 'Completed') {
                            updateThumbnailInRealTime(grid, thumb.targetId, thumb.imageUrl);
                        }
                    });
                } else {
                }
            })
            .catch(error => {
                console.error(`Batch ${batchNumber} failed:`, error);

            });
    }

    function updateThumbnailInRealTime(grid, itemId, imageUrl) {

        const cards = grid.querySelectorAll(`[data-id="${itemId}"]`);

        cards.forEach((card, index) => {

            let imageContainer = card.querySelector('.item-image');
            if (!imageContainer) {
                imageContainer = card.querySelector('.item-icon');
            }

            if (imageContainer) {

                imageContainer.innerHTML = `<img src="${imageUrl}" alt="Item Thumbnail" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
            } else {
            }
        });

        if (cards.length === 0) {
        }
    }

    window.updateTradeSummaryGlobal = updateTradeSummary;

    function updateTradeSummary() {

        const givingContainer = document.getElementById('giving-items');
        const receivingContainer = document.getElementById('receiving-items');

        if (!givingContainer || !receivingContainer) {
            console.error('Trade preview containers not found!');
            return;
        }

        const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
        const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card[data-quantity]:not([data-quantity="0"])');

        const totalCatalogItems = Array.from(selectedCatalog).reduce((total, item) => {
            return total + (parseInt(item.dataset.quantity) || 0);
        }, 0);

        let yourTotalRap = 0;
        let yourTotalVal = 0;
        let theirTotalRap = 0;
        let theirTotalVal = 0;

        if (selectedInventory.length > 0) {
            givingContainer.innerHTML = Array.from(selectedInventory).map(item => {
                const itemName = item.dataset.item;
                const itemValue = parseInt(item.dataset.value);
                const itemRap = parseInt(item.dataset.rap);
                yourTotalVal += itemValue;
                yourTotalRap += itemRap;

                const imageEl = item.querySelector('.item-image img') || item.querySelector('.item-image div');
                let imageSrc = '';

                if (imageEl && imageEl.tagName === 'IMG') {

                    imageSrc = `<img src="${imageEl.src}" alt="${itemName}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">`;
                } else if (imageEl) {

                    imageSrc = `<div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #2a2d30; border-radius: 4px; font-size: 10px; color: #bdbebe;">${itemName.substring(0, 3).toUpperCase()}</div>`;
                } else {
                    imageSrc = `<div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #2a2d30; border-radius: 4px; font-size: 10px; color: #bdbebe;">${itemName.substring(0, 3).toUpperCase()}</div>`;
                }

                return `
                    <div class="summary-item clickable-inventory-summary"
                         data-original-item-index="${item.dataset.index}"
                         title="Click to remove from selection&#10;${itemName}&#10;RAP ${itemRap.toLocaleString()}&#10;VAL ${itemValue.toLocaleString()}">
                        ${imageSrc}
                    </div>
                `;
            }).join('');
        } else {
            givingContainer.innerHTML = `
                <div style="border: 2px dashed #4a4c4e; background: transparent; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                    <span style="color: #858585; font-size: 10px;">Select Items</span>
                </div>
            `;
        }

        if (selectedCatalog.length > 0) {

            const receivingItems = [];

            selectedCatalog.forEach(item => {
                const itemName = item.dataset.item;
                const itemValue = parseInt(item.dataset.value);
                const itemRap = parseInt(item.dataset.rap);
                const quantity = parseInt(item.dataset.quantity) || 1;

                theirTotalVal += itemValue * quantity;
                theirTotalRap += itemRap * quantity;

                const imageEl = item.querySelector('.item-image img') || item.querySelector('.item-image div');
                let imageSrc = '';

                if (imageEl && imageEl.tagName === 'IMG') {
                    imageSrc = `<img src="${imageEl.src}" alt="${itemName}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">`;
                } else if (imageEl) {
                    imageSrc = `<div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #2a2d30; border-radius: 4px; font-size: 10px; color: #bdbebe;">${itemName.substring(0, 3).toUpperCase()}</div>`;
                } else {
                    imageSrc = `<div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #2a2d30; border-radius: 4px; font-size: 10px; color: #bdbebe;">${itemName.substring(0, 3).toUpperCase()}</div>`;
                }

                for (let i = 0; i < quantity; i++) {
                    receivingItems.push(`
                        <div class="summary-item clickable-summary"
                             data-original-item-id="${item.dataset.id}"
                             title="Click to remove one copy&#10;${itemName} (${i + 1}/${quantity})&#10;RAP ${itemRap.toLocaleString()}&#10;VAL ${itemValue.toLocaleString()}">
                            ${imageSrc}
                        </div>
                    `);
                }
            });

            receivingContainer.innerHTML = receivingItems.join('');
        } else {
            receivingContainer.innerHTML = `
                <div style="border: 2px dashed #4a4c4e; background: transparent; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                    <span style="color: #858585; font-size: 10px;">Select Items</span>
                </div>
            `;
        }

        const robuxGiveInput = document.getElementById('robux-give');
        const robuxGetInput = document.getElementById('robux-get');

        if (robuxGiveInput && robuxGiveInput.value) {
            const robuxGive = parseInt(robuxGiveInput.value) || 0;
            const afterTaxRobux = Math.floor(robuxGive * 0.7);
            yourTotalRap += afterTaxRobux;
            yourTotalVal += afterTaxRobux;
        }

        if (robuxGetInput && robuxGetInput.value) {
            const robuxGet = parseInt(robuxGetInput.value) || 0;
            const afterTaxRobux = Math.floor(robuxGet * 0.7);
            theirTotalRap += afterTaxRobux;
            theirTotalVal += afterTaxRobux;
        }

        updateTradeStatistics(yourTotalRap, yourTotalVal, theirTotalRap, theirTotalVal);
    }

    function updateTradeStatistics(yourRap, yourVal, theirRap, theirVal) {

        const rapProfit = theirRap - yourRap;
        const valProfit = theirVal - yourVal;

        const rapPercentage = yourRap > 0 ? ((theirRap - yourRap) / yourRap * 100) : 0;
        const valPercentage = yourVal > 0 ? ((theirVal - yourVal) / yourVal * 100) : 0;

        let statsContainer = document.getElementById('trade-statistics');
        if (!statsContainer) {
            const summaryContent = document.querySelector('.auto-trades-injected .summary-content');
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
        const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
        const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card[data-quantity]:not([data-quantity="0"])');

        const totalCatalogItems = Array.from(selectedCatalog).reduce((total, item) => {
            return total + (parseInt(item.dataset.quantity) || 0);
        }, 0);

        if (selectedInventory.length === 0 || totalCatalogItems === 0) {
            alert('Please select items from both your inventory and the catalog');
            return;
        }

        if (selectedInventory.length > 4) {
            alert('You can only select up to 4 items from your inventory.');
            return;
        }

        if (totalCatalogItems > 4) {
            alert('You can only receive up to 4 items total. You currently have ' + totalCatalogItems + ' items selected.');
            return;
        }

        const nameInput = document.getElementById('auto-trade-name') ||
                          document.querySelector('input[placeholder*="trade name"]') ||
                          document.querySelector('.trade-settings input[type="text"]');
        const autoTradeName = nameInput ? nameInput.value.trim() : '';

        if (!autoTradeName) {
            alert('Please enter a name for your auto trade');
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

        let autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

        if (isEditMode) {

            const tradeIndex = autoTrades.findIndex(trade => trade.id === tradeId || String(trade.id) === String(tradeId));
            if (tradeIndex !== -1) {

                autoTradeData.created = autoTrades[tradeIndex].created;
                autoTrades[tradeIndex] = autoTradeData;
            } else {
                console.error('❌ Could not find trade to update, creating new instead');
                autoTrades.push(autoTradeData);
            }
        } else {

            autoTrades.push(autoTradeData);
        }

        localStorage.setItem('autoTrades', JSON.stringify(autoTrades));

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
            } else {
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

            } else {
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

    function filterInventory(query) {
        const items = document.querySelectorAll('#inventory-grid .item-card');
        items.forEach(item => {
            const name = item.dataset.item.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function filterCatalog(query) {
        const items = document.querySelectorAll('#catalog-grid .item-card');
        items.forEach(item => {
            const name = item.dataset.item.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (e.target.closest('#nav-auto-trades')) {
            e.preventDefault();
            window.location.href = '/auto-trades';
        }
    });

    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);

    function setupPageContextBridge() {

        window.addEventListener('extensionBridgeResponse', (event) => {
            window.lastBridgeResponse = event.detail;
        });

        const existingScript = document.querySelector('#extension-bridge-script');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'extension-bridge-script';
        script.src = chrome.runtime.getURL('bridge.js');

        (document.head || document.documentElement).appendChild(script);

    }

    async function callBridgeMethod(action, data, timeout = null) {
        return new Promise((resolve, reject) => {
            const requestId = Date.now() + Math.random();

            const handler = (event) => {
                if (event.detail.requestId === requestId) {
                    window.removeEventListener('extensionBridgeResponse', handler);

                    if (event.detail.success) {
                        resolve(event.detail.result);
                    } else {
                        reject(new Error(event.detail.error));
                    }
                }
            };

            window.addEventListener('extensionBridgeResponse', handler);

            window.dispatchEvent(new CustomEvent('extensionBridgeRequest', {
                detail: { action, data, requestId }
            }));

            const timeoutMs = timeout || (action === 'sendTrade' ? 30000 : 5000);
            setTimeout(() => {
                window.removeEventListener('extensionBridgeResponse', handler);
                reject(new Error('Bridge request timeout'));
            }, timeoutMs);
        });
    }

    function waitForAngularViaBridge() {
        return new Promise(async (resolve) => {

            let attempts = 0;
            const maxAttempts = 20;

            async function checkAngularViaBridge() {
                attempts++;

                try {
                    const result = await callBridgeMethod('checkAngular');

                    if (result.ready) {
                        resolve(true);
                        return;
                    }
                } catch (error) {
                }

                if (attempts >= maxAttempts) {
                    resolve(false);
                    return;
                }

                setTimeout(checkAngularViaBridge, 200);
            }

            checkAngularViaBridge();
        });
    }

    function init() {

        if (!document.getElementById('extension-trade-cards-css')) {
            const style = document.createElement('style');
            style.id = 'extension-trade-cards-css';
            style.textContent = `
                /* AUTO-TRADES PAGE CSS (scoped to NOT affect send-trades) */
                body:not(.path-auto-trades-send) #outbound-container,
                body:not(.path-auto-trades-send) #expired-container,
                body:not(.path-auto-trades-send) #completed-container {
                    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)) !important;
                }

                body:not(.path-auto-trades-send) .trade-card {
                    min-width: 420px !important;
                    max-width: 500px !important;
                }

                /* SEND-TRADES PAGE SPECIFIC CSS (only for send-trades) */
                body.path-auto-trades-send .send-trades-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr 1fr !important;
                    gap: 16px !important;
                    margin: 0 auto !important;
                    max-width: 100% !important;
                    width: 100% !important;
                }

                body.path-auto-trades-send .send-trade-card {
                    max-width: 100% !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }

                body.path-auto-trades-send .trade-filter-bar {
                    width: 100% !important;
                    box-sizing: border-box !important;
                }

                /* Ensure filter bar and grid have same width constraints */
                body.path-auto-trades-send .send-trades-container {
                    max-width: 1200px !important;
                    margin: 0 auto !important;
                    padding: 20px !important;
                }

                body.path-auto-trades-send .send-trades-container .trade-filter-bar,
                body.path-auto-trades-send .send-trades-container .send-trades-grid {
                    width: 100% !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                }

                /* Auto-trades specific styling (scoped to NOT affect send-trades) */
                body:not(.path-auto-trades-send) .trade-values {
                    flex-wrap: nowrap !important;
                    gap: 16px !important;
                }

                body:not(.path-auto-trades-send) .value-section {
                    min-width: 100px !important;
                    font-size: 12px !important;
                }

                /* Better timestamp positioning - move to header (auto-trades only) */
                body:not(.path-auto-trades-send) .trade-timestamp {
                    display: none !important;
                }

                body:not(.path-auto-trades-send) .trade-header {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 4px !important;
                }

                body:not(.path-auto-trades-send) .trade-header-top {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    width: 100% !important;
                }

                body:not(.path-auto-trades-send) .trade-timestamp-header {
                    color: #666 !important;
                    font-size: 10px !important;
                    margin-top: 2px !important;
                }
            `;
            document.head.appendChild(style);
        }

        setupPageContextBridge();

        addAutoTradesTab();
        handleRouting();

        startAutoUpdateSystem();

        setTimeout(() => {
            cleanupTradeCategories();

            migrateTradesForRobux();
        }, 2000);

        const observer = new MutationObserver(() => {
            addAutoTradesTab();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function loadCompletedTrades() {
        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');
        const completedTrades = finalizedTrades
            .filter(trade => ['completed', 'accepted'].includes(trade.status))
            .map(trade => {

                return {
                    ...trade,
                    type: 'Extension Trade',
                    completed: new Date(trade.finalizedAt).toLocaleString()
                };
            });

        displayTrades(completedTrades, 'completed-container');
    }

    function loadSendTradesPage() {

        loadBasicSendTradesInterface();
    }

    function setupSendTradesEventListeners() {

        const backBtn = document.querySelector('.back-link');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();

                window.cachedAngularService = null;

                const contentContainer = document.querySelector('#content');
                const customOverlay = document.querySelector('#custom-send-trades-overlay');

                if (contentContainer && customOverlay) {

                    Array.from(contentContainer.children).forEach(child => {
                        if (child.id !== 'custom-send-trades-overlay') {
                            child.style.visibility = 'visible';
                        }
                    });

                    customOverlay.remove();

                    window.location.href = '/auto-trades';
                }
            });
        }
    }

    function copyChallengeToPrimaryPage(iframe, buttonElement) {
        try {

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            const challengeSelectors = [
                '.modal-dialog',
                '[role="dialog"]',
                '.modal',
                '.modal-content'
            ];

            let challengeElement = null;
            for (const selector of challengeSelectors) {
                challengeElement = iframeDoc.querySelector(selector);
                if (challengeElement && challengeElement.innerHTML.includes('2-Step Verification')) {
                    break;
                }
            }

            if (challengeElement) {

                const mirrorModal = document.createElement('div');
                mirrorModal.id = 'extension-challenge-mirror';
                mirrorModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Source Sans Pro', Arial, sans-serif;
                `;

                mirrorModal.innerHTML = `
                    <div class="modal-dialog" style="background: white; border-radius: 8px; max-width: 450px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        <div class="modal-content" role="document">
                            <div class="modal-header" style="padding: 20px 20px 0; border-bottom: none;">
                                <button type="button" class="modal-close-btn" style="float: right; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                                <h4 class="modal-title" style="margin: 0; color: #393B3D; font-size: 18px; font-weight: 600;">2-Step Verification</h4>
                            </div>
                            <div class="modal-body" style="padding: 20px; text-align: center;">
                                <div style="font-size: 48px; color: #00A2FF; margin-bottom: 20px;">🛡️</div>
                                <p style="margin-bottom: 30px; color: #393B3D; font-size: 14px;">Enter the code generated by your authenticator app.</p>
                                <div style="margin-bottom: 20px;">
                                    <input type="text" id="extension-2sv-code" placeholder="Enter 6-digit Code" maxlength="6"
                                           style="width: 200px; padding: 12px; border: 2px solid #bdbdbd; border-radius: 4px; text-align: center; font-size: 16px; letter-spacing: 2px;" />
                                </div>
                            </div>
                            <div class="modal-footer" style="padding: 0 20px 20px; text-align: center;">
                                <button type="button" id="extension-verify-btn" disabled
                                        style="background: #00A2FF; color: white; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600; opacity: 0.5;">
                                    Verify
                                </button>
                                <p style="margin: 15px 0 5px; font-size: 12px; color: #666;">Need help? Contact <a href="https://www.roblox.com/info/2sv" target="_blank" style="color: #00A2FF;">Roblox Support</a></p>
                                <p style="margin: 0; font-size: 11px; color: #888; line-height: 1.4;">IMPORTANT: Don't share your security codes with anyone. Roblox will never ask you for your codes.</p>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(mirrorModal);

                const codeInput = mirrorModal.querySelector('#extension-2sv-code');
                const verifyBtn = mirrorModal.querySelector('#extension-verify-btn');
                const closeBtn = mirrorModal.querySelector('.modal-close-btn');

                codeInput.addEventListener('input', () => {
                    const code = codeInput.value.trim();
                    const isValid = code.length === 6 && /^\d{6}$/.test(code);

                    verifyBtn.disabled = !isValid;
                    verifyBtn.style.opacity = isValid ? '1' : '0.5';
                    verifyBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
                });

                verifyBtn.addEventListener('click', () => {
                    const code = codeInput.value.trim();
                    if (code.length === 6) {

                        const iframeCodeInput = iframeDoc.querySelector('#two-step-verification-code-input');
                        const iframeVerifyBtn = iframeDoc.querySelector('.btn-cta-md[aria-label="Verify"]');

                        if (iframeCodeInput && iframeVerifyBtn) {

                            iframeCodeInput.value = code;
                            iframeCodeInput.dispatchEvent(new Event('input', { bubbles: true }));

                            setTimeout(() => {
                                iframeVerifyBtn.click();

                                verifyBtn.textContent = 'Verifying...';
                                verifyBtn.disabled = true;

                                const checkCompletion = setInterval(() => {
                                    const iframeModal = iframeDoc.querySelector('.modal-dialog');
                                    if (!iframeModal) {
                                        clearInterval(checkCompletion);
                                        mirrorModal.remove();

                                        if (buttonElement) {
                                            buttonElement.textContent = 'Retrying trade...';
                                            buttonElement.style.background = '#28a745';

                                        }
                                    }
                                }, 500);

                                setTimeout(() => clearInterval(checkCompletion), 30000);

                            }, 100);
                        } else {
                        }
                    }
                });

                closeBtn.addEventListener('click', () => {
                    mirrorModal.remove();
                    iframe.remove();

                    if (buttonElement) {
                        buttonElement.textContent = 'Send Trade';
                        buttonElement.style.background = '#007bff';
                        buttonElement.disabled = false;
                    }
                });

                setTimeout(() => codeInput.focus(), 100);

            } else {

                this.showOriginalRobloxInterface(buttonElement);
            }

        } catch (copyError) {
            this.showOriginalRobloxInterface(buttonElement);
        }
    }

    function showOriginalRobloxInterface(buttonElement) {
        const contentContainer = document.querySelector('#content');
        const customOverlay = document.querySelector('#custom-send-trades-overlay');

        if (contentContainer && customOverlay) {
            Array.from(contentContainer.children).forEach(child => {
                if (child.id !== 'custom-send-trades-overlay') {
                    child.style.visibility = 'visible';
                }
            });
            customOverlay.style.visibility = 'hidden';

            if (buttonElement) {
                buttonElement.textContent = 'Complete challenge on Roblox page';
                buttonElement.style.background = '#ff6b35';
            }
        }
    }
    async function getRobloxCSRFToken() {
        try {

            const response = await fetch('https://auth.roblox.com/v1/logout', {
                method: 'POST',
                credentials: 'include'
            });

            const csrfToken = response.headers.get('x-csrf-token');

            return csrfToken;
        } catch (error) {
            console.error('❌ Failed to get CSRF token:', error);
            return null;
        }
    }
    function waitForPageAndAngularReady() {
        return new Promise((resolve) => {

            let attempts = 0;
            const maxAttempts = 30;

            function checkForAngularScript() {
                attempts++;

                if (window.angular) {

                    waitForAngularAndCache().then(resolve);
                } else {

                    const angularScripts = Array.from(document.scripts).filter(script =>
                        script.src && script.src.includes('angular') ||
                        script.textContent && script.textContent.includes('angular')
                    );

                    if (attempts < maxAttempts) {
                        setTimeout(checkForAngularScript, 100);
                    } else {
                        console.error('❌ Angular script never loaded after 20 seconds');
                        resolve(null);
                    }
                }
            }

            checkForAngularScript();
        });
    }

    function waitForAngularAndCache() {
        return new Promise((resolve) => {

            let attempts = 0;
            const maxAttempts = 150;

            const checkAngular = () => {
                attempts++;

                if (window.angular) {

                    const modules = window.angular._getModules ? window.angular._getModules() : [];

                    const tradesElement = document.querySelector('[trades]');
                    const hasTradesElement = !!tradesElement;
                    const isTradesElementVisible = tradesElement && tradesElement.offsetHeight > 0;

                    if (window.angular && window.angular.element && tradesElement) {
                        try {
                            const ngElement = window.angular.element(tradesElement);

                            if (ngElement && ngElement.injector) {
                                const injector = ngElement.injector();

                                if (injector) {

                                    try {
                                        const tradesService = injector.get('tradesService');

                                        if (tradesService && tradesService.sendTrade) {
                                            resolve(tradesService);
                                            return;
                                        } else {
                                        }
                                    } catch (serviceError) {
                                    }
                                }
                            } else {
                            }
                        } catch (elementError) {
                        }
                    } else {
                    }
                } else {
                }

                if (attempts < maxAttempts) {
                    setTimeout(checkAngular, 100);
                } else {
                    console.error(`❌ Angular/trades modules failed to load after ${maxAttempts * 100 / 1000} seconds`);

                    try {
                        if (window.angular && window.angular.element) {
                            const testElement = document.querySelector('[trades]');
                            if (testElement) {
                                const testNgElement = window.angular.element(testElement);
                                const testInjector = testNgElement.injector();
                                const testService = testInjector.get('tradesService');
                                resolve(testService);
                                return;
                            }
                        }
                        resolve(null);
                    } catch (finalError) {
                        resolve(null);
                    }
                }
            };

            checkAngular();
        });
    }

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

                } else {
                    console.warn('❌ Failed to fetch usernames batch:', response.status);
                }
            } catch (error) {
                console.warn('❌ Error fetching usernames:', error);
            }
        }

        return opportunities;
    }

    function loadBasicSendTradesInterface() {

        const content = `
        <div class="send-trades-container">
            <a href="/auto-trades" class="back-link">← Back to Auto Trades</a>
            <div class="page-header">
                <h1>Send Trades</h1>
                <p class="subtitle">Execute your auto-trades by sending them to available users</p>
            </div>

            <div class="trade-filter-bar" id="trade-filter-bar">
                <div class="filter-label">Filter by Trade:</div>
                <div class="trade-filter-chips" id="trade-filter-chips">
                    <!-- Filter chips will be generated here -->
                </div>
                <div class="shuffle-controls">
                    <div class="user-stats-toggle">
                        <label class="stats-toggle-label">
                            <input type="checkbox" id="user-stats-toggle">
                            <span class="toggle-text">Show User Stats</span>
                        </label>
                    </div>
                    <div class="total-users-info" id="total-users-info">
                        Total Users: 0
                    </div>
                    <button class="shuffle-btn" id="shuffle-users-btn">
                        Shuffle Users
                    </button>
                </div>
            </div>

            <div class="send-trades-grid" id="send-trades-grid">
                <!-- Trade opportunities will be populated here -->
            </div>
        </div>
        `;

        replacePageContent(content);

        const tryAgainBtn = document.getElementById('try-angular-again');
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        const testAngularBtn = document.getElementById('test-angular-manual');
        if (testAngularBtn) {
            testAngularBtn.addEventListener('click', () => {

                try {
                    if (window.angular && window.angular.element) {
                        const tradesElement = document.querySelector('[trades]');
                        if (tradesElement) {
                            const injector = window.angular.element(tradesElement).injector();
                            const tradesService = injector.get('tradesService');

                            if (tradesService && tradesService.sendTrade) {
                                window.cachedAngularService = tradesService;

                                testAngularBtn.textContent = '✅ Angular Ready!';
                                testAngularBtn.style.background = '#28a745';

                                const warningDiv = testAngularBtn.parentElement;
                                warningDiv.innerHTML = `
                                    <h3 style="color: #28a745; margin-bottom: 15px;">✅ Angular Service Ready!</h3>
                                    <p style="color: #bdbebe;">Trades should work normally now. Click "SEND TRADE" on any opportunity below.</p>
                                `;

                                return;
                            }
                        }
                    }

                    testAngularBtn.textContent = '❌ Still Not Ready';
                    testAngularBtn.style.background = '#dc3545';

                    setTimeout(() => {
                        testAngularBtn.textContent = '🧪 Test Angular Now';
                        testAngularBtn.style.background = '#007bff';
                    }, 3000);

                } catch (error) {
                    testAngularBtn.textContent = '❌ Test Failed';
                    testAngularBtn.style.background = '#dc3545';

                    setTimeout(() => {
                        testAngularBtn.textContent = '🧪 Test Angular Now';
                        testAngularBtn.style.background = '#007bff';
                    }, 3000);
                }
            });
        }

        setupSendTradesEventListeners();

        loadTradeOpportunities().then(() => {
            setupTradeFiltering();
            setupShuffleSystem();
            setupSendTradeButtons();
        }).catch(error => {
            console.error('❌ Error loading trade opportunities:', error);
        });
    }

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
    }

    async function loadTradeOpportunities() {
        const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

        if (!window.tradeUserPools) {
            window.tradeUserPools = {};
            window.sentTrades = new Set(JSON.parse(localStorage.getItem('sentTrades') || '[]'));
        }

        let rolimonData = {};
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'fetchRolimons'
            });

            if (response.success) {
                rolimonData = response.data.items || {};
            } else {
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
                        } else {
                        }
                    });
                }

                if (itemIds.length === 0) {
                    continue;
                }

                const settings = getSettings();
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
                    window.tradeRealOwners[trade.id] = realOwners;

                    const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');
                    const storedTrade = autoTrades.find(at => at.id === trade.id);
                    if (storedTrade) {
                        storedTrade.totalOwners = realOwners.length;
                        localStorage.setItem('autoTrades', JSON.stringify(autoTrades));
                    }

                    const maxTrades = trade.settings?.maxTrades || trade.settings?.maxTradesPerDay || 5;
                    const tradesExecutedToday = getTodayTradeCount(trade.id);
                    const remainingTrades = maxTrades - tradesExecutedToday;

                    if (remainingTrades > 0) {

                        const ownersToShow = realOwners.slice(0, remainingTrades);

                        ownersToShow.forEach((userId, index) => {

                            const tradeKey = `${trade.id}-${userId}`;
                            opportunities.push({
                                    ...trade,
                                    targetUserId: userId,
                                    targetUser: {
                                        id: userId,
                                        username: `Loading...`,
                                        displayName: `User${userId}`,
                                        avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`
                                    },
                                    tradeKey: tradeKey,
                                    status: 'available',
                                    opportunityIndex: index + 1,
                                    itemIds: itemIds
                                });
                        });

                    } else {
                    }
                } else {
                }

            } catch (error) {
                console.error(`❌ Error processing trade ${trade.name}:`, error);
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
        displayTradeOpportunities(window.filteredOpportunities);
        updateTotalUsersInfo();

        setTimeout(() => {
            loadUserAvatars();
        }, 200);
    }

    function generateUserPool(trade, poolSize) {
        const users = [];

        const verifiedUserIds = [

            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            156, 261, 1311, 2032, 2041, 2154, 2231, 2415, 2495, 3060,
            13645, 18166, 20395, 22848, 23771, 25845, 38767, 40831, 44391, 45248,

            50567, 51897, 56299, 82471, 83429, 85353, 88323, 103734, 119524, 125318,
            137225, 142348, 155612, 163348, 178428, 186568, 188798, 201415, 234586, 267879,
            312343, 378738, 482465, 547161, 627143, 732645, 845123, 967234,

            1028606, 1365767, 1285307, 20573078, 215719598, 62724852, 48545806, 1073690,
            21070012, 1285307, 1365767, 20573078, 21070012, 48545806, 62724852, 215719598,

            987654, 876543, 765432, 654321, 543210, 432109, 321098, 210987, 109876,
            1111111, 2222222, 3333333, 4444444, 5555555, 6666666, 7777777, 8888888, 9999999,
            1234567, 2345678, 3456789, 4567890, 5678901, 6789012, 7890123, 8901234, 9012345,

            12345678, 23456789, 34567890, 45678901, 56789012, 67890123, 78901234, 89012345, 90123456,
            10203040, 20304050, 30405060, 40506070, 50607080, 60708090, 70809001, 80901020, 90102030,

            111111, 222222, 333333, 444444, 555555, 666666, 777778, 888889, 999990,
            1010101, 2020202, 3030303, 4040404, 5050505, 6060606, 7070707, 8080808, 9090909
        ];

        const shuffledIds = [...verifiedUserIds].sort(() => Math.random() - 0.5);
        const selectedIds = shuffledIds.slice(0, Math.min(poolSize, shuffledIds.length));

        selectedIds.forEach(userId => {

            const usernameStyles = [
                `Player${userId.toString().slice(-4)}`,
                `Trader${userId.toString().slice(-3)}`,
                `${getRandomWord()}${Math.floor(Math.random() * 99)}`,
                `${getRandomWord()}${getRandomWord()}`,
                `Pro${getRandomWord()}`,
                `${getRandomWord()}Master`,
            ];

            const username = usernameStyles[Math.floor(Math.random() * usernameStyles.length)];

            users.push({
                id: userId,
                username: username,
                displayName: username,
                avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`,
                lastOnline: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000).toISOString(),
                avatarLoaded: false
            });
        });

        return users;
    }

    function getRandomWord() {
        const words = [
            'Shadow', 'Fire', 'Ice', 'Storm', 'Blaze', 'Dark', 'Light', 'Star', 'Moon', 'Sun',
            'Dragon', 'Wolf', 'Eagle', 'Lion', 'Tiger', 'Bear', 'Fox', 'Hawk', 'Raven', 'Phoenix',
            'Knight', 'Warrior', 'Hunter', 'Mage', 'Ninja', 'Samurai', 'Ranger', 'Scout', 'Guard', 'Hero',
            'Master', 'Legend', 'Epic', 'Elite', 'Prime', 'Ultra', 'Super', 'Mega', 'Hyper', 'Alpha'
        ];
        return words[Math.floor(Math.random() * words.length)];
    }

    function getTodayTradeCount(tradeId) {
        const tradeCountsKey = `tradeCountsDaily_${getCurrentDateKey()}`;
        const dailyCounts = JSON.parse(localStorage.getItem(tradeCountsKey) || '{}');
        return dailyCounts[tradeId] || 0;
    }

    function getLastResetDate(tradeId) {
        const resetKey = `lastReset_${tradeId}`;
        const lastReset = localStorage.getItem(resetKey);
        return lastReset || getCurrentDateKey();
    }

    function getCurrentDateKey() {
        return new Date().toISOString().split('T')[0];
    }

    function incrementTradeCount(tradeId) {
        const tradeCountsKey = `tradeCountsDaily_${getCurrentDateKey()}`;
        const dailyCounts = JSON.parse(localStorage.getItem(tradeCountsKey) || '{}');
        dailyCounts[tradeId] = (dailyCounts[tradeId] || 0) + 1;
        localStorage.setItem(tradeCountsKey, JSON.stringify(dailyCounts));

        const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');
        const tradeIndex = autoTrades.findIndex(t => t.id == tradeId);
        if (tradeIndex !== -1) {
            autoTrades[tradeIndex].settings.tradesExecutedToday = dailyCounts[tradeId];
            autoTrades[tradeIndex].lastExecuted = new Date().toISOString();
            localStorage.setItem('autoTrades', JSON.stringify(autoTrades));
        }

        return dailyCounts[tradeId];
    }

    function cleanupOldTradesCounts() {
        const keys = Object.keys(localStorage);
        const tradeCountKeys = keys.filter(key => key.startsWith('tradeCountsDaily_'));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        const cutoffKey = cutoffDate.toISOString().split('T')[0];

        tradeCountKeys.forEach(key => {
            const dateKey = key.replace('tradeCountsDaily_', '');
            if (dateKey < cutoffKey) {
                localStorage.removeItem(key);
            }
        });
    }

    async function loadUserAvatars() {

        const sendButtons = document.querySelectorAll('.send-trade-btn');

        const userAvatarMap = new Map();

        sendButtons.forEach(button => {
            const userId = button.getAttribute('data-user-id');
            const card = button.closest('.send-trade-card');
            const avatar = card?.querySelector('.user-avatar-compact');

            if (userId && avatar) {
                if (!userAvatarMap.has(userId)) {
                    userAvatarMap.set(userId, []);
                }
                userAvatarMap.get(userId).push(avatar);
            }
        });

        let successCount = 0;
        let failCount = 0;

        for (const [userId, avatars] of userAvatarMap) {
            try {

                const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);

                if (response.ok) {
                    const data = await response.json();

                    if (data.data && data.data[0] && data.data[0].state === 'Completed' && data.data[0].imageUrl) {

                        const avatarUrl = data.data[0].imageUrl;
                        avatars.forEach(img => {
                            img.src = avatarUrl;
                            img.style.opacity = '1';
                        });
                        successCount++;
                    } else {
                        throw new Error('Avatar not ready or no image URL');
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {

                const initials = `U${userId.toString().slice(-1)}`;
                const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
                const color = colors[parseInt(userId) % colors.length];

                const fallbackSvg = `data:image/svg+xml;base64,${btoa(`
                    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="15" cy="15" r="15" fill="${color}"/>
                        <text x="15" y="19" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                    </svg>
                `)}`;

                avatars.forEach(img => {
                    img.src = fallbackSvg;
                    img.style.opacity = '1';
                });
                failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
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

    function displayTradeOpportunities(opportunities) {
        const grid = document.getElementById('send-trades-grid');
        if (!grid) return;

        if (opportunities.length === 0) {

            const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

            if (autoTrades.length === 0) {
                grid.innerHTML = '<div class="empty-message">No auto-trades available. Create some auto-trades first!</div>';
                return;
            }

            const allTradesComplete = autoTrades.every(trade => {
                const maxTrades = trade.settings?.maxTrades || 5;
                const tradesExecutedToday = getTodayTradeCount(trade.id);
                return tradesExecutedToday >= maxTrades;
            });

            if (allTradesComplete) {
                grid.innerHTML = '<div class="empty-message">All trades completed for today! All your auto-trades have reached their daily limits. Come back tomorrow to send more trades.</div>';
                return;
            }

            grid.innerHTML = '<div class="empty-message">No trading opportunities found. No users were found who own the items you want to trade. Try different auto-trades or check back later.</div>';
            return;
        }

        grid.innerHTML = opportunities.map(opportunity => {
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

            return `
                <div class="send-trade-card trade-card">
                    <div class="send-trade-header">
                        <div class="trade-info-compact">
                            <div class="trade-title-compact">${opportunity.name}</div>
                            <div class="trade-target">→ ${opportunity.targetUser.username}</div>
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

        setTimeout(() => {
            loadAutoTradeItemThumbnails('send-trades-grid');
            loadUserStatsForTradeCards();

        }, 100);

        setupSendTradeButtons();
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

                displayTradeOpportunities(window.filteredOpportunities);
                updateTotalUsersInfo();

                setTimeout(() => {
                    loadUserAvatars();

                }, 100);
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

        const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

        const allCount = window.currentOpportunities.length;
        const allActive = currentActiveTab === 'all' ? 'active' : '';
        let chipsHtml = `<div class="trade-filter-chip ${allActive}" data-trade-name="all">
            All Trades <span class="trade-count-badge">${allCount}</span>
        </div>`;

        autoTrades.forEach(trade => {
            const tradeOpps = window.currentOpportunities.filter(opp => opp.id == trade.id);
            const currentlyShowing = tradeOpps.length;

            const totalApiOwners = trade.totalOwners || 0;
            const maxTrades = trade.settings?.maxTrades || 5;
            const tradesExecutedToday = getTodayTradeCount(trade.id);
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

        const totalShowing = window.filteredOpportunities.length;
        const totalAvailable = window.currentOpportunities.length;

        totalInfo.textContent = `Showing: ${totalShowing} / ${totalAvailable} opportunities`;
    }

    async function shuffleUsers() {

        const activeFilter = document.querySelector('.trade-filter-chip.active');
        const tradeName = activeFilter ? activeFilter.dataset.tradeName : 'all';

        if (tradeName === 'all') {
            alert('Shuffle is only available on specific trade tabs. Please select a specific trade to shuffle users for that trade.');
            return;
        }

        const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');

        let newOpportunities = [];
        autoTrades.forEach(trade => {

            const realApiOwners = window.tradeRealOwners?.[trade.id] || [];

            if (realApiOwners.length === 0) {
                return;
            }

            const shuffledOwners = [...realApiOwners].sort(() => Math.random() - 0.5);

            const maxTrades = trade.settings?.maxTrades || trade.settings?.maxTradesPerDay || 5;
            const tradesExecutedToday = getTodayTradeCount(trade.id);
            const remainingTrades = maxTrades - tradesExecutedToday;

            if (remainingTrades > 0) {

                const ownersToShow = shuffledOwners.slice(0, remainingTrades);

                ownersToShow.forEach((userId, index) => {
                    newOpportunities.push({
                        ...trade,
                        targetUserId: userId,
                        targetUser: {
                            id: userId,
                            username: `Loading...`,
                            displayName: `User${userId}`,
                            avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`
                        },
                        tradeKey: `${trade.id}-${userId}`,
                        status: 'available',
                        opportunityIndex: index + 1,
                        itemIds: trade.itemIds || []
                    });
                });

            } else {
            }
        });

        if (newOpportunities.length > 0) {
            newOpportunities = await fetchRealUsernames(newOpportunities);
        }

        window.currentOpportunities = newOpportunities;

        const activeTradeId = activeFilter ? activeFilter.dataset.tradeId : null;

        if (tradeName === 'all') {
            window.filteredOpportunities = [...window.currentOpportunities];
        } else {

            window.filteredOpportunities = window.currentOpportunities.filter(
                opp => opp.id == activeTradeId
            );
        }

        displayTradeOpportunities(window.filteredOpportunities);
        updateTradeFilterBar();
        updateTotalUsersInfo();

        setTimeout(() => {
            const filterChips = document.querySelectorAll('.trade-filter-chip');
            filterChips.forEach(chip => {
                chip.classList.remove('active');

                chip.style.borderBottom = '';
                chip.style.setProperty('border-bottom', 'none', 'important');

                if (tradeName === 'all' && chip.dataset.tradeName === 'all') {
                    chip.classList.add('active');

                    chip.style.setProperty('border-bottom', '3px solid white', 'important');
                } else if (chip.dataset.tradeId === activeTradeId) {
                    chip.classList.add('active');

                    chip.style.setProperty('border-bottom', '3px solid white', 'important');
                }
            });
        }, 50);

        setTimeout(() => {
            loadUserAvatars();

        }, 100);

    }

    async function checkTradeStatus(tradeId) {
        try {

            const result = await callBridgeMethod('getTradeStatus', { tradeId }, 15000);
            return result;
        } catch (error) {
            console.error('❌ Error checking trade status:', error);

            if (error.message.includes('timeout')) {
                return { status: 'pending' };
            }

            return { status: 'pending' };
        }
    }

    async function updateTradeStatuses() {
        const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
        if (pendingTrades.length === 0) return;

        const statusChecks = await Promise.all(
            pendingTrades.map(trade => checkTradeStatus(trade.id))
        );

        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');
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

        localStorage.setItem('pendingExtensionTrades', JSON.stringify(stillPending));
        localStorage.setItem('finalizedExtensionTrades', JSON.stringify(finalizedTrades));

    }

    let statusCheckInterval = null;

    function startTradeStatusMonitoring() {

        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }

        checkAndUpdateTradeStatuses();
        statusCheckInterval = setInterval(checkAndUpdateTradeStatuses, 5 * 60 * 1000);
    }

    async function checkAndUpdateTradeStatuses() {
        const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
        if (pendingTrades.length === 0) return;

        const tradesToCheck = pendingTrades.slice(0, 3);

        for (const trade of tradesToCheck) {
            try {

                const response = await fetch(`https://trades.roblox.com/v1/trades/${trade.id}`);
                if (response.ok) {
                    const tradeData = await response.json();
                    const rawStatus = tradeData.status || 'Open';

                    const STATUS_MAP = {
                        "Open": "outbound",
                        "Declined": "declined",
                        "Accepted": "accepted",
                        "Expired": "declined",
                        "Completed": "completed",
                        "Countered": "countered"
                    };

                    const status = STATUS_MAP[rawStatus] || rawStatus.toLowerCase();

                    if (status !== 'outbound' && status !== 'pending' && status !== 'inbound') {

                        moveTradeToFinalized(trade, status);
                    }
                } else {
                }
            } catch (error) {
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    function moveTradeToFinalized(trade, status) {

        let pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
        pendingTrades = pendingTrades.filter(t => t.id !== trade.id);
        localStorage.setItem('pendingExtensionTrades', JSON.stringify(pendingTrades));

        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');
        finalizedTrades.push({
            ...trade,
            status: status,
            finalizedAt: Date.now()
        });
        localStorage.setItem('finalizedExtensionTrades', JSON.stringify(finalizedTrades));

        const outboundSection = document.getElementById('outbound-section');
        if (outboundSection && outboundSection.style.display === 'block') {
            setTimeout(() => loadOutboundTrades(), 500);
        }
    }

    async function loadEnhancedTradeItemThumbnails(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        try {

            const rolimonsItems = await loadRolimonsData();

            const itemNameToId = {};
            rolimonsItems.forEach(item => {
                itemNameToId[item.name] = item.id;
            });

            const itemIcons = container.querySelectorAll('.item-icon');

            const elementsToLoad = [];

            itemIcons.forEach(icon => {
                const itemName = icon.getAttribute('data-item-name') ||
                                 icon.getAttribute('title')?.split('\n')[0];

                if (!itemName) return;

                const itemId = itemNameToId[itemName];
                if (!itemId) {
                    return;
                }

                icon.dataset.id = itemId;
                elementsToLoad.push(icon);
            });

            if (elementsToLoad.length > 0) {
                window.loadThumbnailsForElements(elementsToLoad);
            } else {
            }

        } catch (error) {
            console.error('❌ Failed to load Rolimons data:', error);
        }
    }

    function setupSendTradeButtons() {
        document.querySelectorAll('.send-trade-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = parseInt(e.target.getAttribute('data-user-id'));
                const tradeId = e.target.getAttribute('data-trade-id');

                if (e.target.dataset.trading === 'true') {
                    return;
                }

                e.target.dataset.trading = 'true';
                e.target.textContent = 'Checking if tradable...';
                e.target.style.background = '#ffc107';
                e.target.disabled = true;

                try {

                    let canTradeResponse = null;
                    let attempts = 0;
                    const maxAttempts = 2;

                    while (attempts < maxAttempts && !canTradeResponse?.success) {
                        attempts++;

                        try {
                            canTradeResponse = await chrome.runtime.sendMessage({
                                action: 'checkCanTradeWith',
                                userId: userId
                            });

                            if (canTradeResponse?.success) {
                                break;
                            }
                        } catch (attemptError) {
                            if (attempts < maxAttempts) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    }

                    if (!canTradeResponse?.success) {

                        e.target.textContent = 'Sending Trade...';
                    } else {
                        const canTradeData = canTradeResponse.data;

                        if (!canTradeData.canTrade) {

                            e.target.textContent = 'Cannot Trade';
                            e.target.style.background = '#dc3545';
                            e.target.style.color = '#fff';
                            e.target.disabled = true;
                            e.target.dataset.trading = 'false';

                            const statusMessages = {
                                'CannotTrade': 'This user cannot trade',
                                'UnknownUser': 'User not found',
                                'InsufficientMembership': 'User needs premium membership',
                                'UserBlocked': 'You are blocked by this user',
                                'UserPrivacySettingsTooRestrictive': 'User\'s privacy settings prevent trading'
                            };

                            const friendlyMessage = statusMessages[canTradeData.status] || canTradeData.status || 'Cannot trade with this user';

                            return;
                        }

                        e.target.textContent = 'Sending Trade...';
                    }

                } catch (outerError) {

                    console.error(`💥 Unexpected error in trade eligibility check:`, outerError);
                }

                const opportunity = window.currentOpportunities.find(
                    opp => opp.id == tradeId && opp.targetUserId == userId
                );

                if (!opportunity) {
                    console.error('❌ Trade opportunity not found');
                    e.target.textContent = 'Trade Not Found';
                    e.target.style.background = '#dc3545';
                    e.target.disabled = true;
                    e.target.dataset.trading = 'false';
                    return;
                }

                e.target.textContent = 'GETTING INSTANCE IDs...';
                e.target.disabled = true;
                e.target.style.background = '#ffc107';

                try {

                    const currentUserId = await getCurrentUserId();

                    if (!currentUserId) {
                        throw new Error('Could not get current user ID');
                    }

                    const tradePayload = {
                        trade: [
                            {
                                user_id: currentUserId,
                                item_ids: await getItemIdsFromTrade(opportunity.giving, window.rolimonData || {}),
                                robux: opportunity.giving.reduce((sum, item) => sum + (item.robux || 0), 0)
                            },
                            {
                                user_id: userId,
                                item_ids: await getItemIdsFromTrade(opportunity.receiving, window.rolimonData || {}),
                                robux: opportunity.receiving.reduce((sum, item) => sum + (item.robux || 0), 0)
                            }
                        ]
                    };

                    const instanceResponse = await chrome.runtime.sendMessage({
                        action: 'fetchInstanceIds',
                        payload: tradePayload
                    });

                    if (instanceResponse.success && instanceResponse.data.trade) {
                        const tradeData = instanceResponse.data.trade;

                        btn.textContent = 'SENDING TRADE...';
                        btn.style.background = '#17a2b8';

                        try {

                            const currentUserId = await getCurrentUserId();

                            const ourTradeData = tradeData.find(t => t.user_id === currentUserId);
                            const theirTradeData = tradeData.find(t => t.user_id === userId);

                            const ourInstanceIds = (ourTradeData?.item_instance_ids || []).slice(0, opportunity.giving.length);
                            const theirInstanceIds = (theirTradeData?.item_instance_ids || []).slice(0, opportunity.receiving.length);

                            const angularTradeData = {
                                senderOffer: {
                                    userId: currentUserId,
                                    robux: opportunity.robuxGive || 0,
                                    collectibleItemInstanceIds: ourInstanceIds
                                },
                                recipientOffer: {
                                    userId: userId,
                                    robux: opportunity.robuxGet || 0,
                                    collectibleItemInstanceIds: theirInstanceIds
                                }
                            };

                            try {
                                const tradeResult = await callBridgeMethod('sendTrade', angularTradeData);

                                if (tradeResult && tradeResult.tradeId) {

                                    fetch(`https://users.roblox.com/v1/users/${userId}`)
                                        .then(response => {
                                            return response.json();
                                        })
                                        .then(userData => {
                                            const tradeRecord = {
                                                id: tradeResult.tradeId,
                                                autoTradeId: tradeId,
                                                targetUserId: userId,
                                                created: Date.now(),
                                                tradeName: opportunity.name || 'Unknown Trade',

                                                giving: opportunity.giving || [],
                                                receiving: opportunity.receiving || [],

                                                robuxGive: opportunity.robuxGive || 0,
                                                robuxGet: opportunity.robuxGet || 0,
                                                user: userData.name || userData.displayName || `User ${userId}`,
                                                status: 'outbound'
                                            };

                                            const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
                                            pendingTrades.push(tradeRecord);
                                            localStorage.setItem('pendingExtensionTrades', JSON.stringify(pendingTrades));
                                        })
                                        .catch(error => {
                                            const tradeRecord = {
                                                id: tradeResult.tradeId,
                                                autoTradeId: tradeId,
                                                targetUserId: userId,
                                                created: Date.now(),
                                                tradeName: opportunity.name || 'Unknown Trade',
                                                giving: opportunity.giving || [],
                                                receiving: opportunity.receiving || [],
                                                user: `User ${userId}`,
                                                status: 'outbound'
                                            };

                                            const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
                                            pendingTrades.push(tradeRecord);
                                            localStorage.setItem('pendingExtensionTrades', JSON.stringify(pendingTrades));
                                        });
                                } else {
                                }

                                const sentTradeKey = `${tradeId}-${userId}`;
                                window.sentTrades.add(sentTradeKey);

                                const newCount = incrementTradeCount(tradeId);

                                const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');
                                const storedTrade = autoTrades.find(at => at.id === tradeId);
                                if (storedTrade) {

                                    const maxTrades = storedTrade.settings?.maxTrades || 5;
                                    const completionStatus = newCount >= maxTrades ? 'COMPLETE' : 'INCOMPLETE';
                                    storedTrade.completionStatus = completionStatus;
                                    storedTrade.tradesExecutedToday = newCount;
                                    localStorage.setItem('autoTrades', JSON.stringify(autoTrades));
                                }

                                localStorage.setItem('sentTrades', JSON.stringify([...window.sentTrades]));

                                window.currentOpportunities = window.currentOpportunities.filter(
                                    opp => !(opp.id == tradeId && opp.targetUserId == userId)
                                );

                                window.filteredOpportunities = window.filteredOpportunities.filter(
                                    opp => !(opp.id == tradeId && opp.targetUserId == userId)
                                );

                                updateTradeFilterBar();
                                updateTotalUsersInfo();

                                e.target.textContent = 'TRADE SENT!';
                                e.target.style.background = '#28a745';
                                e.target.disabled = true;

                            } catch (bridgeError) {

                                e.target.dataset.trading = 'false';
                                e.target.textContent = 'Cannot Trade';
                                e.target.style.background = '#6c757d';
                                e.target.style.color = '#fff';
                                e.target.disabled = true;

                                return;
                            }

                        } catch (robloxError) {
                            console.error('❌ Roblox trading service error:', robloxError);

                            e.target.dataset.trading = 'false';
                            e.target.textContent = 'Cannot Trade';
                            e.target.style.background = '#6c757d';
                            e.target.style.color = '#fff';
                            e.target.disabled = true;

                            return;
                        }

                    } else {
                        throw new Error(instanceResponse.error || 'Failed to get instance IDs');
                    }

                } catch (error) {
                    console.error('❌ Error sending trade:', error);

                    e.target.dataset.trading = 'false';
                    e.target.textContent = 'Cannot Trade';
                    e.target.style.background = '#6c757d';
                    e.target.style.color = '#fff';
                    e.target.disabled = true;

                }
            });
        });
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
                } else {
                }
            });
        }

        return itemIds;
    }

    function checkForEditMode() {
        const editingTrade = localStorage.getItem('editingTrade');
        if (!editingTrade) return;

        try {
            const tradeData = JSON.parse(editingTrade);

            const pageTitle = document.querySelector('.auto-trades-header');
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

            const nameInput = document.getElementById('trade-name') ||
                             document.querySelector('input[placeholder*="trade name"]') ||
                             document.querySelector('input[placeholder*="Trade name"]') ||
                             document.querySelector('input[placeholder*="Enter your trade name"]') ||
                             document.querySelector('.trade-settings input[type="text"]');

            if (nameInput) {
                nameInput.value = tradeData.name;
                nameInput.placeholder = `Editing: ${tradeData.name}`;
            } else {
            }

            if (tradeData.giving && tradeData.giving.length > 0) {
                setTimeout(() => {

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

                            if (countToSelect < requiredCount) {
                            }
                        } else {

                            const allCards = document.querySelectorAll('#inventory-grid .item-card');
                        }
                    });

                    setTimeout(() => {
                        if (window.updateTradeSummaryGlobal) {
                            window.updateTradeSummaryGlobal();
                        }

                        setTimeout(() => {
                            const selectedInventoryItems = document.querySelectorAll('#inventory-grid .item-card.selected');
                            if (selectedInventoryItems.length > 0 && window.loadThumbnailsForElements) {
                                window.loadThumbnailsForElements(selectedInventoryItems, '#inventory-grid');
                            }
                        }, 100);
                    }, 200);
                }, 500);
            }

            const targetItems = tradeData.getting || tradeData.receiving || [];
            if (targetItems && targetItems.length > 0) {

                setTimeout(() => {

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

                            if (requiredCount > 4) {
                            }
                        } else {

                            const allCatalogCards = document.querySelectorAll('#catalog-grid .item-card');
                            let found = false;
                            for (let card of allCatalogCards) {
                                const cardTitle = card.getAttribute('title') || card.getAttribute('data-item') || '';
                                if (cardTitle && (cardTitle.toLowerCase().includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(cardTitle.toLowerCase()))) {

                                    card.dataset.quantity = Math.min(requiredCount, 4);
                                    card.classList.add('selected');
                                    card.style.setProperty('--quantity-number', `"${Math.min(requiredCount, 4)}"`);
                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                            }
                        }
                    });

                    setTimeout(() => {
                        if (window.updateTradeSummaryGlobal) {
                            window.updateTradeSummaryGlobal();
                        }

                        setTimeout(() => {
                            const selectedCatalogItems = document.querySelectorAll('#catalog-grid .item-card.selected');
                            if (selectedCatalogItems.length > 0 && window.loadThumbnailsForElements) {
                                window.loadThumbnailsForElements(selectedCatalogItems, '#catalog-grid');
                            }
                        }, 100);
                    }, 200);
                }, 1000);
            } else {
            }

            if (tradeData.settings && (tradeData.settings.maxTradesPerDay || tradeData.settings.maxTrades)) {
                const maxTradesInput = document.getElementById('max-trades');
                if (maxTradesInput) {
                    const maxTradesValue = tradeData.settings.maxTradesPerDay || tradeData.settings.maxTrades || 5;
                    maxTradesInput.value = maxTradesValue;
                } else {
                }
            }

            if (tradeData.robuxGive || tradeData.robuxGet) {
                setTimeout(() => {
                    const robuxGiveInput = document.getElementById('robux-give');
                    const robuxGetInput = document.getElementById('robux-get');

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
                }, 1200);
            } else {
            }

            window.editingTradeId = tradeData.id;

            setTimeout(() => {

                const allSelectedItems = document.querySelectorAll('#inventory-grid .item-card.selected, #catalog-grid .item-card.selected');
                if (allSelectedItems.length > 0) {

                    const selectedInventory = document.querySelectorAll('#inventory-grid .item-card.selected');
                    if (selectedInventory.length > 0 && window.loadThumbnailsForElements) {
                        window.loadThumbnailsForElements(selectedInventory, '#inventory-grid');
                    }

                    const selectedCatalog = document.querySelectorAll('#catalog-grid .item-card.selected');
                    if (selectedCatalog.length > 0 && window.loadThumbnailsForElements) {
                        window.loadThumbnailsForElements(selectedCatalog, '#catalog-grid');
                    }

                    setTimeout(() => {
                        if (window.updateTradeSummaryGlobal) {
                            window.updateTradeSummaryGlobal();
                        }
                    }, 300);
                }
            }, 1500);

            localStorage.removeItem('editingTrade');

        } catch (error) {
            console.error('❌ Error parsing edit trade data:', error);
            localStorage.removeItem('editingTrade');
        }
    }

    function startAutoUpdateSystem() {
        const UPDATE_INTERVAL = 30 * 1000;

        if (window.autoUpdateTimer) {
            clearInterval(window.autoUpdateTimer);
        }

        window.autoUpdateTimer = setInterval(() => {

            const isAutoTradesPage = document.body.classList.contains('path-auto-trades') ||
                                   document.body.classList.contains('path-auto-trades-send');

            if (isAutoTradesPage) {

                checkRobloxTradeStatuses().then(movedCount => {
                    if (movedCount > 0) {
                    }
                }).catch(error => {
                    console.error('❌ Error checking trade statuses:', error);
                });

                const activeTab = document.querySelector('.filter-btn.active');
                if (activeTab) {
                    const filter = activeTab.getAttribute('data-filter');

                    switch(filter) {
                        case 'outbound':
                            if (typeof loadOutboundTrades === 'function') {
                                loadOutboundTrades();
                            }
                            break;
                        case 'expired':
                            if (typeof loadExpiredTrades === 'function') {
                                loadExpiredTrades();
                            }
                            break;
                        case 'countered':
                            if (typeof loadCounteredTrades === 'function') {
                                loadCounteredTrades();
                            }
                            break;
                        case 'completed':
                            if (typeof loadCompletedTrades === 'function') {
                                loadCompletedTrades();
                            }
                            break;
                    }

                    setTimeout(() => {
                        const activeContainer = document.querySelector('.trades-grid[style*="block"]');
                        if (activeContainer) {
                            const containerId = activeContainer.id;
                            if (typeof loadEnhancedTradeItemThumbnails === 'function') {
                                loadEnhancedTradeItemThumbnails(containerId);
                            }
                        }
                    }, 1000);
                } else {

                    if (document.body.classList.contains('path-auto-trades') && typeof loadAutoTrades === 'function') {
                        loadAutoTrades();
                    }
                }
            }
        }, UPDATE_INTERVAL);

    }

    async function checkRobloxTradeStatuses() {

        const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');

        if (pendingTrades.length === 0) {
            return 0;
        }

        const STATUS_MAP = {
            "Open": "outbound",
            "Declined": "declined",
            "Accepted": "accepted",
            "Expired": "declined",
            "Completed": "completed",
            "Countered": "countered"
        };

        let movedTrades = 0;
        const stillPending = [];

        for (const trade of pendingTrades) {
            try {

                const response = await fetch(`https://trades.roblox.com/v1/trades/${trade.id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.warn(`⚠️ API call failed for trade ${trade.id}: ${response.status}`);
                    stillPending.push(trade);
                    continue;
                }

                const tradeData = await response.json();
                const robloxStatus = tradeData.status;
                const mappedStatus = STATUS_MAP[robloxStatus] || 'unknown';

                if (mappedStatus !== 'outbound') {

                    trade.status = mappedStatus;
                    trade.finalizedAt = Date.now();
                    trade.robloxStatus = robloxStatus;

                    finalizedTrades.push(trade);
                    movedTrades++;
                } else {

                    stillPending.push(trade);
                }

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`❌ Error checking trade ${trade.id}:`, error);
                stillPending.push(trade);
            }
        }

        if (movedTrades > 0) {
            localStorage.setItem('pendingExtensionTrades', JSON.stringify(stillPending));
            localStorage.setItem('finalizedExtensionTrades', JSON.stringify(finalizedTrades));

            if (typeof loadOutboundTrades === 'function') loadOutboundTrades();
            if (typeof loadExpiredTrades === 'function') loadExpiredTrades();
            if (typeof loadCompletedTrades === 'function') loadCompletedTrades();
        }

        return movedTrades;
    }

    function cleanupTradeCategories() {

        const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');

        let moveCount = 0;

        const toMove = pendingTrades.filter(trade =>
            trade.status && ['declined', 'accepted', 'completed', 'expired'].includes(trade.status)
        );

        if (toMove.length > 0) {

            toMove.forEach(trade => {
                trade.finalizedAt = trade.finalizedAt || Date.now();
                finalizedTrades.push(trade);
            });

            const stillPending = pendingTrades.filter(trade =>
                !trade.status || ['pending', 'Open', 'open', 'outbound'].includes(trade.status)
            );

            localStorage.setItem('pendingExtensionTrades', JSON.stringify(stillPending));
            localStorage.setItem('finalizedExtensionTrades', JSON.stringify(finalizedTrades));

            moveCount = toMove.length;
        }

        const misplacedOutbound = finalizedTrades.filter(trade =>
            ['outbound', 'pending', 'Open', 'open'].includes(trade.status)
        );

        if (misplacedOutbound.length > 0) {

            misplacedOutbound.forEach(trade => {
                trade.status = trade.status || 'pending';
                delete trade.finalizedAt;
                pendingTrades.push(trade);
            });

            const correctedFinalized = finalizedTrades.filter(trade =>
                !['outbound', 'pending', 'Open', 'open'].includes(trade.status)
            );

            localStorage.setItem('pendingExtensionTrades', JSON.stringify(pendingTrades));
            localStorage.setItem('finalizedExtensionTrades', JSON.stringify(correctedFinalized));

        }

        return moveCount;
    }

    function migrateTradesForRobux() {

        let migrated = 0;

        const pendingTrades = JSON.parse(localStorage.getItem('pendingExtensionTrades') || '[]');
        pendingTrades.forEach(trade => {
            if (trade.robuxGive === undefined) {
                trade.robuxGive = 0;
                migrated++;
            }
            if (trade.robuxGet === undefined) {
                trade.robuxGet = 0;
            }
        });
        localStorage.setItem('pendingExtensionTrades', JSON.stringify(pendingTrades));

        const finalizedTrades = JSON.parse(localStorage.getItem('finalizedExtensionTrades') || '[]');
        finalizedTrades.forEach(trade => {
            if (trade.robuxGive === undefined) {
                trade.robuxGive = 0;
                migrated++;
            }
            if (trade.robuxGet === undefined) {
                trade.robuxGet = 0;
            }
        });
        localStorage.setItem('finalizedExtensionTrades', JSON.stringify(finalizedTrades));

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

        Object.entries(itemGroups).forEach(([name, cards]) => {
            if (cards.length > 1) {
            }
        });

        const autoTrades = JSON.parse(localStorage.getItem('autoTrades') || '[]');
        autoTrades.forEach(trade => {
        });

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

                setTimeout(applyResponsiveItemSizing, 50);
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

    async function getUserRapAndValue(userId) {
        try {

            let rolimonData = {};
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'fetchRolimons'
                });
                if (response.success) {
                    rolimonData = response.data.items || {};
                }
            } catch (error) {
                console.warn('Failed to fetch Rolimons data:', error);
            }

            let totalRap = 0;
            let totalValue = 0;
            let limitedCount = 0;
            let cursor = null;
            let pageCount = 0;

            do {
                pageCount++;

                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: "fetchUserInventory",
                        userId: userId,
                        cursor: cursor
                    }, (response) => {
                        resolve(response);
                    });
                });

                if (!response || !response.success) {
                    break;
                }

                const data = response.data;

                if (data.data && data.data.length > 0) {
                    data.data.forEach(item => {
                        if (item.recentAveragePrice > 0) {

                            let rolimonItem = Object.values(rolimonData).find(r => r[0] === item.name);

                            if (!rolimonItem && item.assetId) {
                                rolimonItem = rolimonData[item.assetId.toString()];
                            }

                            let rap, value;

                            if (rolimonItem && (rolimonItem[2] > 0 || rolimonItem[4] > 0)) {

                                rap = rolimonItem[2] || 0;
                                value = rolimonItem[4] || 0;
                            } else {

                                rap = item.recentAveragePrice;
                                value = item.recentAveragePrice;
                            }

                            totalRap += rap;
                            totalValue += value;
                            limitedCount++;
                        }
                    });
                }

                cursor = data.nextPageCursor;

                if (cursor) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

            } while (cursor);

            const result = {
                totalRap,
                totalValue,
                limitedCount,
                isPartial: false
            };

            if (totalRap === 0 && totalValue === 0) {

                await new Promise(resolve => setTimeout(resolve, 500));
                const retryResult = await retryUserInventory(userId, rolimonData);

                if (retryResult && (retryResult.totalRap > 0 || retryResult.totalValue > 0)) {

                    const finalResult = retryResult;
                    return finalResult;
                }
            }

            return result;

        } catch (error) {
            console.error('Error fetching user RAP & Value:', error);
            return {
                totalRap: 0,
                totalValue: 0,
                limitedCount: 0,
                isPartial: false,
                error: true
            };
        }
    }

    async function retryUserInventory(userId, rolimonData) {
        try {
            let totalRap = 0;
            let totalValue = 0;
            let limitedCount = 0;
            let cursor = null;

            do {
                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: "fetchUserInventory",
                        userId: userId,
                        cursor: cursor
                    }, (response) => {
                        resolve(response);
                    });
                });

                if (!response || !response.success) {
                    break;
                }

                const data = response.data;

                if (data.data && data.data.length > 0) {
                    data.data.forEach(item => {
                        if (item.recentAveragePrice > 0) {

                            let rolimonItem = Object.values(rolimonData).find(r => r[0] === item.name);

                            if (!rolimonItem && item.assetId) {
                                rolimonItem = rolimonData[item.assetId.toString()];
                            }

                            let rap, value;

                            if (rolimonItem && (rolimonItem[2] > 0 || rolimonItem[4] > 0)) {

                                rap = rolimonItem[2] || 0;
                                value = rolimonItem[4] || 0;
                            } else {

                                rap = item.recentAveragePrice;
                                value = item.recentAveragePrice;
                            }

                            totalRap += rap;
                            totalValue += value;
                            limitedCount++;
                        }
                    });
                }

                cursor = data.nextPageCursor;

                if (cursor) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

            } while (cursor);

            return {
                totalRap,
                totalValue,
                limitedCount,
                isPartial: false
            };

        } catch (error) {
            console.error(`Retry failed for user ${userId}:`, error);
            return null;
        }
    }

    if (!window.globalUserStats) window.globalUserStats = new Map();
    if (!window.userStatsLoadingInProgress) window.userStatsLoadingInProgress = false;
    if (!window.allUsersToLoad) window.allUsersToLoad = new Set();

    function startBackgroundUserStatsLoading() {
        const userStatsToggle = document.getElementById('user-stats-toggle');
        if (!userStatsToggle || !userStatsToggle.checked) {

            loadUserStatsInBackground();
            return;
        }

        if (window.userStatsLoadingInProgress) {
            return;
        }

        window.userStatsLoadingInProgress = true;

        collectAllUsersToLoad();

        loadUsersInBackground();
    }

    function collectAllUsersToLoad() {

        window.allUsersToLoad.clear();

        if (window.currentOpportunities) {
            window.currentOpportunities.forEach(opportunity => {
                if (opportunity.targetUserId) {
                    window.allUsersToLoad.add(opportunity.targetUserId);
                } else if (opportunity.targetUser && opportunity.targetUser.id) {
                    window.allUsersToLoad.add(opportunity.targetUser.id);
                }
            });
        }

        const tradeCards = document.querySelectorAll('.send-trade-card');
        tradeCards.forEach(card => {
            const sendBtn = card.querySelector('.send-trade-btn');
            if (sendBtn) {
                const userId = parseInt(sendBtn.getAttribute('data-user-id'));
                if (userId && !isNaN(userId)) {
                    window.allUsersToLoad.add(userId);
                }
            }
        });
    }

    async function loadUsersInBackground() {
        const usersArray = Array.from(window.allUsersToLoad);
        const shuffledUsers = usersArray.sort(() => Math.random() - 0.5);

        for (const userId of shuffledUsers) {
            try {

                if (window.globalUserStats.has(userId)) {
                    continue;
                }

                const randomDelay = 100 + Math.random() * 400;
                await new Promise(resolve => setTimeout(resolve, randomDelay));

                const userStats = await getUserRapAndValue(userId);

                if (userStats && !userStats.error) {

                    window.globalUserStats.set(userId, userStats);

                    updateUserStatsDisplayIfVisible(userId, userStats);
                }

            } catch (error) {
                console.error(`Failed to load stats for user ${userId}:`, error);
            }
        }

        window.userStatsLoadingInProgress = false;
    }

    function displayCachedUserStatsForCurrentTab() {
        const tradeCards = document.querySelectorAll('.send-trade-card');

        tradeCards.forEach(card => {
            const sendBtn = card.querySelector('.send-trade-btn');
            if (sendBtn) {
                const userId = parseInt(sendBtn.getAttribute('data-user-id'));
                const cachedStats = window.globalUserStats.get(userId);

                if (cachedStats) {
                    addUserStatsToCard(card, cachedStats);
                }
            }
        });
    }

    function updateUserStatsDisplayIfVisible(userId, stats) {

        const userCards = document.querySelectorAll(`[data-user-id="${userId}"]`);

        userCards.forEach(card => {
            const tradeCard = card.closest('.send-trade-card');
            if (tradeCard) {
                addUserStatsToCard(tradeCard, stats);
            }
        });
    }

    async function loadUserStatsForTradeCards() {

        if (loadUserStatsForTradeCards.isRunning) {
            return;
        }
        loadUserStatsForTradeCards.isRunning = true;

        try {
            const userStatsToggle = document.getElementById('user-stats-toggle');

        if (!userStatsToggle || !userStatsToggle.checked) {
            loadUserStatsInBackground();
            return;
        }

        const tradeCards = document.querySelectorAll('.send-trade-card');
        const userIds = [...new Set(Array.from(tradeCards).map(card => {
            const sendBtn = card.querySelector('.send-trade-btn');
            return sendBtn ? parseInt(sendBtn.getAttribute('data-user-id')) : null;
        }).filter(Boolean))];

        const shuffledUserIds = userIds.sort(() => Math.random() - 0.5);

        for (const userId of shuffledUserIds) {
            try {

                const randomDelay = 100 + Math.random() * 400;
                await new Promise(resolve => setTimeout(resolve, randomDelay));

                const userStats = await getUserRapAndValue(userId);

                const userCards = document.querySelectorAll(`[data-user-id="${userId}"]`);
                userCards.forEach(card => {
                    const tradeCard = card.closest('.send-trade-card');
                    if (tradeCard) {
                        addUserStatsToCard(tradeCard, userStats);
                    }
                });

            } catch (error) {
                console.error(`Failed to load stats for user ${userId}:`, error);
            }
        }
        } finally {
            loadUserStatsForTradeCards.isRunning = false;
        }
    }

    async function loadUserStatsInBackground() {

        if (loadUserStatsInBackground.isRunning) {
            return;
        }
        loadUserStatsInBackground.isRunning = true;

        try {
            const tradeCards = document.querySelectorAll('.send-trade-card');
            const userIds = [...new Set(Array.from(tradeCards).map(card => {
                const sendBtn = card.querySelector('.send-trade-btn');
                return sendBtn ? parseInt(sendBtn.getAttribute('data-user-id')) : null;
            }).filter(Boolean))];

            for (const userId of userIds) {
                try {
                    const randomDelay = 100 + Math.random() * 400;
                    await new Promise(resolve => setTimeout(resolve, randomDelay));

                    await getUserRapAndValue(userId);
                } catch (error) {
                    console.error(`Background stats loading failed for user ${userId}:`, error);
                }
            }
        } finally {
            loadUserStatsInBackground.isRunning = false;
        }
    }

    function addUserStatsToCard(tradeCard, userStats) {

        const existingStats = tradeCard.querySelector('.user-stats-info');
        if (existingStats) {
            existingStats.remove();
        }

        const userStatsToggle = document.getElementById('user-stats-toggle');
        const headerRightSection = tradeCard.querySelector('.header-right-section');

        if (!userStatsToggle || !userStatsToggle.checked) {

            if (headerRightSection) {
                headerRightSection.classList.remove('stats-enabled');
            }
            return;
        }

        if (headerRightSection) {
            headerRightSection.classList.add('stats-enabled');
        }

        const statsElement = document.createElement('div');
        statsElement.className = 'user-stats-info';

        let rapText = userStats.totalRap.toLocaleString();
        let valueText = userStats.totalValue.toLocaleString();

        if (userStats.error) {
            rapText = 'Error';
            valueText = 'Error';
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
            ${userStats.limitedCount > 0 ? `<div class="limited-count">${userStats.limitedCount} limiteds</div>` : ''}
        `;

        const avatar = tradeCard.querySelector('.user-avatar-compact');

        if (headerRightSection && avatar) {
            headerRightSection.appendChild(statsElement);
        } else {

            const tradeHeader = tradeCard.querySelector('.send-trade-header');
            if (tradeHeader) {
                tradeHeader.appendChild(statsElement);
            }
        }
    }

    function toggleUserStatsVisibility() {
        const userStatsToggle = document.getElementById('user-stats-toggle');
        const allStatsElements = document.querySelectorAll('.user-stats-info');
        const allHeaderRightSections = document.querySelectorAll('.header-right-section');

        if (userStatsToggle && userStatsToggle.checked) {
            // Show warning about experimental feature
            alert('⚠️ User stats are loading. This may take a minute as it\'s an experimental feature.');
        }

        if (userStatsToggle && userStatsToggle.checked) {

            allStatsElements.forEach(stats => {
                stats.style.display = 'flex';
            });

            allHeaderRightSections.forEach(section => {
                section.classList.add('stats-enabled');
            });

            setTimeout(() => {
                loadUserStatsForTradeCards();
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

    if (window.location.pathname.includes('/auto-trades') ||
        document.querySelector('.auto-trades-injected')) {

        setTimeout(() => {
            applyResponsiveItemSizing();
            observeForItemChanges();
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
