(function() {
    'use strict';

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

                // Hide all sections first
                document.getElementById('auto-trades-section').style.display = 'none';
                document.getElementById('outbound-section').style.display = 'none';
                document.getElementById('expired-section').style.display = 'none';
                document.getElementById('countered-section').style.display = 'none';
                document.getElementById('completed-section').style.display = 'none';
                
                // Hide empty state when switching to other sections
                const emptyState = document.getElementById('empty-state');
                if (emptyState) {
                    emptyState.style.display = 'none';
                }

                if (filter === 'auto-trades') {
                    document.getElementById('auto-trades-section').style.display = 'block';
                    // Reload auto trades data - this will handle showing empty state if needed
                    if (window.loadAutoTradeData) {
                        window.loadAutoTradeData();
                    }
                } else if (filter === 'outbound') {
                    document.getElementById('outbound-section').style.display = 'block';
                    const container = document.getElementById('outbound-container');
                    if (container) container.innerHTML = '';
                    Storage.set('outbound-containerCurrentPage', '1');
                    setTimeout(() => {
                        if (window.loadOutboundTrades) {
                            window.loadOutboundTrades();
                        } else if (typeof TradeLoading !== 'undefined' && TradeLoading.loadOutboundTrades) {
                            TradeLoading.loadOutboundTrades();
                        }
                    }, 100);
                } else if (filter === 'expired') {
                    document.getElementById('expired-section').style.display = 'block';
                    const container = document.getElementById('expired-container');
                    if (container) container.innerHTML = '';
                    Storage.set('expired-containerCurrentPage', '1');
                    if (window.loadExpiredTrades) window.loadExpiredTrades();
                } else if (filter === 'countered') {
                    document.getElementById('countered-section').style.display = 'block';
                    const container = document.getElementById('countered-container');
                    if (container) container.innerHTML = '';
                    Storage.set('countered-containerCurrentPage', '1');
                    if (window.loadCounteredTrades) window.loadCounteredTrades();
                } else if (filter === 'completed') {
                    document.getElementById('completed-section').style.display = 'block';
                    const container = document.getElementById('completed-container');
                    if (container) container.innerHTML = '';
                    Storage.set('completed-containerCurrentPage', '1');
                    if (window.loadCompletedTrades) window.loadCompletedTrades();
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
                if (stopBtn) stopBtn.style.display = 'inline-flex';
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                stopBtn.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-flex';
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
                if (window.filterInventory) {
                    window.filterInventory(e.target.value);
                }
            });
        }

        const catalogSearch = document.getElementById('catalog-search');
        if (catalogSearch) {
            catalogSearch.addEventListener('input', (e) => {
                if (window.filterCatalog) {
                    window.filterCatalog(e.target.value);
                }
            });
        }

        const createBtn = document.getElementById('create-auto-trade');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (window.createAutoTrade) {
                    window.createAutoTrade();
                }
            });
        }

        const robuxGiveInput = document.getElementById('robux-give');
        const robuxGetInput = document.getElementById('robux-get');
        const robuxGiveInfo = document.getElementById('robux-give-info');
        const robuxGetInfo = document.getElementById('robux-get-info');

        if (robuxGiveInput && robuxGiveInfo) {
            robuxGiveInput.addEventListener('input', () => {
                if (window.validateRobuxInput) {
                    window.validateRobuxInput('give');
                }
            });
        }
        if (robuxGetInput && robuxGetInfo) {
            robuxGetInput.addEventListener('input', () => {
                if (window.validateRobuxInput) {
                    window.validateRobuxInput('get');
                }
            });
        }

        function updateRobuxValidation() {
            if (robuxGiveInput && robuxGiveInput.value && window.validateRobuxInput) {
                window.validateRobuxInput('give');
            }
            if (robuxGetInput && robuxGetInput.value && window.validateRobuxInput) {
                window.validateRobuxInput('get');
            }
            if (window.updateTradeSummaryGlobal) {
                window.updateTradeSummaryGlobal();
            }
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('item-card')) {
                setTimeout(updateRobuxValidation, 100);
            }
        });

        if (robuxGiveInput) {
            robuxGiveInput.addEventListener('input', () => {
                if (window.validateRobuxInput) {
                    window.validateRobuxInput('give');
                }
                Utils.nextFrame(() => {
                    if (window.updateTradeSummaryGlobal) {
                        window.updateTradeSummaryGlobal();
                    }
                });
            });
        }
        if (robuxGetInput) {
            robuxGetInput.addEventListener('input', () => {
                if (window.validateRobuxInput) {
                    window.validateRobuxInput('get');
                }
                Utils.nextFrame(() => {
                    if (window.updateTradeSummaryGlobal) {
                        window.updateTradeSummaryGlobal();
                    }
                });
            });
        }

        if (window.validateRobuxInput) {
            window.validateRobuxInput = window.validateRobuxInput;
        }
    }

    function setupSettingsEventListeners() {
        const saveBtn = document.getElementById('save-settings');
        const resetBtn = document.getElementById('reset-settings');
        const clearHistoryBtn = document.getElementById('clear-trade-history');

        const updateCurrentValuesInUI = () => {
            const currentSettings = Trades.getSettings();
            const maxOwnerSmall = document.querySelector('#maxOwnerDays + small');
            const lastOnlineSmall = document.querySelector('#lastOnlineDays + small');
            const tradeMemorySmall = document.querySelector('#tradeMemoryDays + small');

            if (maxOwnerSmall) {
                maxOwnerSmall.textContent = `Maximum days since user owned the items (current: ${currentSettings.maxOwnerDays.toLocaleString()})`;
            }
            if (lastOnlineSmall) {
                lastOnlineSmall.textContent = `Maximum days since user was last online (current: ${currentSettings.lastOnlineDays})`;
            }
            if (tradeMemorySmall) {
                tradeMemorySmall.textContent = `Prevents sending the same item combo to a user for this many days. Current: ${currentSettings.tradeMemoryDays}`;
            }
        };

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const maxOwnerDays = parseInt(document.getElementById('maxOwnerDays').value) || 100000000;
                const lastOnlineDays = parseInt(document.getElementById('lastOnlineDays').value) || 3;
                const tradeMemoryDays = parseInt(document.getElementById('tradeMemoryDays').value) || 7;

                if (maxOwnerDays < 8 || maxOwnerDays > 999999999) {
                    Dialogs.alert('Invalid Value', 'Max Owner Days must be between 8 and 999,999,999', 'error');
                    return;
                }

                if (lastOnlineDays < 1 || lastOnlineDays > 365) {
                    Dialogs.alert('Invalid Value', 'Last Online Days must be between 1 and 365', 'error');
                    return;
                }

                if (tradeMemoryDays < 1 || tradeMemoryDays > 30) {
                    Dialogs.alert('Invalid Value', 'Trade Memory Days must be between 1 and 30', 'error');
                    return;
                }

                const settings = { maxOwnerDays, lastOnlineDays, tradeMemoryDays };
                Trades.saveSettings(settings);
                updateCurrentValuesInUI();
                saveBtn.textContent = 'Settings Saved!';
                Utils.delay(2000).then(() => {
                    saveBtn.textContent = 'Save Settings';
                });
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmed = await Dialogs.confirm('Reset Settings', 'Are you sure you want to reset settings to default values?', 'Reset', 'Cancel');
                if (confirmed) {
                    document.getElementById('maxOwnerDays').value = 100000000;
                    document.getElementById('lastOnlineDays').value = 3;
                    document.getElementById('tradeMemoryDays').value = 7;
                    updateCurrentValuesInUI();
                }
            });
        }

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                const confirmed = await Dialogs.confirm('Clear Trade History', 'Are you sure you want to clear all sent trade history? This will allow you to send trades to users again immediately.', 'Clear History', 'Cancel');
                if (confirmed) {
                    Storage.remove('sentTradeHistory');
                    clearHistoryBtn.textContent = 'History Cleared';
                    Utils.delay(2000).then(() => {
                        clearHistoryBtn.textContent = 'Clear Sent Trade History';
                    });
                }
            });
        }
    }

    function setupSendTradesEventListeners() {
        const backBtn = document.querySelector('.back-link');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();

                window.cachedAngularService = null;

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

                sessionStorage.removeItem('loadSendTrades');
                window.location.href = '/auto-trades';
            });
        }

        const userStatsToggle = document.getElementById('user-stats-toggle');
        if (userStatsToggle) {
            userStatsToggle.addEventListener('change', () => {
                if (window.toggleUserStatsVisibility) {
                    window.toggleUserStatsVisibility();
                }
            });
        }

        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentPage = Pagination.getCurrentPage();
                if (currentPage > 1) {
                    Pagination.setCurrentPage(currentPage - 1);
                    Pagination.displayCurrentPage();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentPage = Pagination.getCurrentPage();
                const totalPages = Pagination.getTotalPages();
                if (currentPage < totalPages) {
                    Pagination.setCurrentPage(currentPage + 1);
                    Pagination.displayCurrentPage();
                }
            });
        }
    }

    window.EventListeners = {
        setupAutoTradesEventListeners,
        setupCreateTradeEventListeners,
        setupSettingsEventListeners,
        setupSendTradesEventListeners
    };

    window.setupAutoTradesEventListeners = setupAutoTradesEventListeners;
    window.setupCreateTradeEventListeners = setupCreateTradeEventListeners;
    window.setupSettingsEventListeners = setupSettingsEventListeners;
    window.setupSendTradesEventListeners = setupSendTradesEventListeners;
})();
