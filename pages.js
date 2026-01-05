(function() {
    'use strict';

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
                    <button class="filter-btn" data-filter="expired">Declined</button>
                    <button class="filter-btn" data-filter="countered">Countered</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                </div>

                <div class="content-sections">
                    <div class="auto-trades-section" id="auto-trades-section">
                        <div class="auto-trades-grid" id="auto-trades-container">
                        </div>
                    </div>

                    <div class="trades-section" id="outbound-section" style="display: none;">
                        <div class="pagination-controls" id="outbound-pagination" style="display: none;">
                            <div class="pagination-info">
                                <span id="outbound-pagination-current">Page 1</span>
                                <span class="pagination-total">of <span id="outbound-pagination-total-pages">1</span></span>
                            </div>
                            <div class="sorting-controls">
                                <button class="sort-btn" id="outbound-sort-btn" title="Sort by date">
                                    <span id="outbound-sort-icon">↓</span> Oldest First
                                </button>
                            </div>
                            <div class="pagination-buttons">
                                <button class="pagination-btn" id="outbound-pagination-prev" disabled>Previous</button>
                                <button class="pagination-btn" id="outbound-pagination-next">Next</button>
                            </div>
                        </div>
                        <div class="trades-grid" id="outbound-container">
                        </div>
                    </div>

                    <div class="trades-section" id="expired-section" style="display: none;">
                        <div class="pagination-controls" id="expired-pagination" style="display: none;">
                            <div class="pagination-info">
                                <span id="expired-pagination-current">Page 1</span>
                                <span class="pagination-total">of <span id="expired-pagination-total-pages">1</span></span>
                            </div>
                            <div class="sorting-controls">
                                <button class="sort-btn" id="expired-sort-btn" title="Sort by date">
                                    <span id="expired-sort-icon">↓</span> Oldest First
                                </button>
                            </div>
                            <div class="pagination-buttons">
                                <button class="pagination-btn" id="expired-pagination-prev" disabled>Previous</button>
                                <button class="pagination-btn" id="expired-pagination-next">Next</button>
                            </div>
                        </div>
                        <div class="trades-grid" id="expired-container">
                        </div>
                    </div>

                    <div class="trades-section" id="countered-section" style="display: none;">
                        <div class="pagination-controls" id="countered-pagination" style="display: none;">
                            <div class="pagination-info">
                                <span id="countered-pagination-current">Page 1</span>
                                <span class="pagination-total">of <span id="countered-pagination-total-pages">1</span></span>
                            </div>
                            <div class="sorting-controls">
                                <button class="sort-btn" id="countered-sort-btn" title="Sort by date">
                                    <span id="countered-sort-icon">↓</span> Oldest First
                                </button>
                            </div>
                            <div class="pagination-buttons">
                                <button class="pagination-btn" id="countered-pagination-prev" disabled>Previous</button>
                                <button class="pagination-btn" id="countered-pagination-next">Next</button>
                            </div>
                        </div>
                        <div class="trades-grid" id="countered-container">
                        </div>
                    </div>

                    <div class="trades-section" id="completed-section" style="display: none;">
                        <div class="pagination-controls" id="completed-pagination" style="display: none;">
                            <div class="pagination-info">
                                <span id="completed-pagination-current">Page 1</span>
                                <span class="pagination-total">of <span id="completed-pagination-total-pages">1</span></span>
                            </div>
                            <div class="sorting-controls">
                                <button class="sort-btn" id="completed-sort-btn" title="Sort by date">
                                    <span id="completed-sort-icon">↓</span> Oldest First
                                </button>
                            </div>
                            <div class="pagination-buttons">
                                <button class="pagination-btn" id="completed-pagination-prev" disabled>Previous</button>
                                <button class="pagination-btn" id="completed-pagination-next">Next</button>
                            </div>
                        </div>
                        <div class="trades-grid" id="completed-container">
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

        UI.replacePageContent(content);
        if (window.setupAutoTradesEventListeners) {
            window.setupAutoTradesEventListeners();
        }

        Utils.nextFrame(() => {
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            if (activeFilterBtn) {
                activeFilterBtn.style.setProperty('border-bottom', '3px solid white', 'important');
            }
        });

        if (window.loadAutoTradeData) {
            window.loadAutoTradeData().then(() => {
                if (window.loadOutboundTrades) window.loadOutboundTrades();
                if (window.loadExpiredTrades) window.loadExpiredTrades();
                if (window.loadCompletedTrades) window.loadCompletedTrades();

                Utils.delay(500).then(async () => {
                    if (!window.rolimonData || Object.keys(window.rolimonData).length === 0) {
                        if (window.loadRolimonsData) {
                            await window.loadRolimonsData();
                        }
                    }

                    if (window.loadAutoTradeItemThumbnails) {
                        window.loadAutoTradeItemThumbnails();
                        window.loadAutoTradeItemThumbnails('outbound-container');
                        window.loadAutoTradeItemThumbnails('expired-container');
                        window.loadAutoTradeItemThumbnails('completed-container');
                    }
                });
            });
        }

        Utils.delay(500).then(() => {
            if (window.loadAutoTradeItemThumbnails) {
                window.loadAutoTradeItemThumbnails();
            }
        });
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

        UI.replacePageContent(content);
        if (window.setupCreateTradeEventListeners) {
            window.setupCreateTradeEventListeners();
        }
        if (window.loadInventoryData) window.loadInventoryData();
        if (window.loadCatalogData) window.loadCatalogData();

        Utils.delay(1500).then(() => {
            if (window.checkForEditMode) {
                window.checkForEditMode();
            }
        });
    }

    function loadSettingsPage() {
        const settings = Trades.getSettings();

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
                            <input type="number" id="maxOwnerDays" class="setting-input" value="${settings.maxOwnerDays}" min="8" max="999999999" />
                            <small class="setting-help">Maximum days since user owned the items (current: ${settings.maxOwnerDays.toLocaleString()})</small>
                        </div>

                        <div class="setting-group">
                            <label class="setting-label">Last Online Days</label>
                            <input type="number" id="lastOnlineDays" class="setting-input" value="${settings.lastOnlineDays}" min="1" max="365" />
                            <small class="setting-help">Maximum days since user was last online (current: ${settings.lastOnlineDays})</small>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Trade History</h3>
                        <p class="section-description">Manage how long the extension remembers sent trades.</p>

                        <div class="setting-group">
                            <label class="setting-label">Trade Memory Expiry (Days)</label>
                            <input type="number" id="tradeMemoryDays" class="setting-input" value="${settings.tradeMemoryDays}" min="1" max="30" />
                            <small class="setting-help">Prevents sending the same item combo to a user for this many days. Current: ${settings.tradeMemoryDays}</small>
                        </div>
                        
                        <div class="setting-actions">
                            <button class="btn btn-danger" id="clear-trade-history">Clear Sent Trade History</button>
                        </div>
                    </div>

                    <div class="setting-actions">
                        <button class="btn btn-secondary" id="save-settings">Save Settings</button>
                        <button class="btn btn-opposite" id="reset-settings">Reset to Defaults</button>
                    </div>
                </div>
            </div>
        `;

        UI.replacePageContent(content);
        if (window.setupSettingsEventListeners) {
            window.setupSettingsEventListeners();
        }
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

                <div class="pagination-controls">
                    <div class="pagination-info">
                        <span id="pagination-current">Page 1</span>
                        <span class="pagination-total">of <span id="pagination-total-pages">1</span></span>
                    </div>
                    
                    <div class="sorting-controls">
                        <select id="sort-type" class="sort-select">
                            <option value="lastOnline">Last Online</option>
                            <option value="ownerSince">Owned Since</option>
                        </select>
                        <select id="sort-order" class="sort-select">
                            <option value="desc">Newest</option>
                            <option value="asc">Oldest</option>
                        </select>
                    </div>

                    <div class="pagination-buttons">
                        <button class="pagination-btn" id="pagination-prev" disabled>Previous</button>
                        <button class="pagination-btn" id="pagination-next">Next</button>
                    </div>
                </div>

                <div class="send-trades-grid" id="send-trades-grid">
                </div>
            </div>
        `;

        UI.replacePageContent(content);

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

                    Utils.delay(3000).then(() => {
                        testAngularBtn.textContent = '🧪 Test Angular Now';
                        testAngularBtn.style.background = '#007bff';
                    });

                } catch (error) {
                    testAngularBtn.textContent = '❌ Test Failed';
                    testAngularBtn.style.background = '#dc3545';

                    Utils.delay(3000).then(() => {
                        testAngularBtn.textContent = '🧪 Test Angular Now';
                        testAngularBtn.style.background = '#007bff';
                    });
                }
            });
        }

        if (window.setupSendTradesEventListeners) {
            window.setupSendTradesEventListeners();
        }

        if (window.loadTradeOpportunities) {
            window.loadTradeOpportunities().then(() => {
                if (window.setupTradeFiltering) window.setupTradeFiltering();
                if (window.setupShuffleSystem) window.setupShuffleSystem();
                if (window.setupSortingSystem) window.setupSortingSystem();
                if (window.setupSendTradeButtons) window.setupSendTradeButtons();
            }).catch(error => {
            });
        }
    }

    function loadSendTradesPage() {
        loadBasicSendTradesInterface();
    }

    window.Pages = {
        loadAutoTradesPage,
        loadCreateTradePage,
        loadSettingsPage,
        loadSendTradesPage,
        loadBasicSendTradesInterface
    };

    window.loadAutoTradesPage = loadAutoTradesPage;
    window.loadCreateTradePage = loadCreateTradePage;
    window.loadSettingsPage = loadSettingsPage;
    window.loadSendTradesPage = loadSendTradesPage;
})();
