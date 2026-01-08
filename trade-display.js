(function() {
    'use strict';

    function displayAutoTrades(autoTrades) {
        const container = document.getElementById('auto-trades-container');
        const emptyState = document.getElementById('empty-state');
        const autoTradesSection = document.getElementById('auto-trades-section');

        if (!container) return;

        const isAutoTradesSectionVisible = autoTradesSection && 
                                          window.getComputedStyle(autoTradesSection).display !== 'none';

        if (autoTrades.length === 0) {
            container.style.display = 'grid';
            container.innerHTML = '';
            if (emptyState && isAutoTradesSectionVisible) {
                const emptyStateHTML = emptyState.outerHTML;
                container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🤖</div>
                    <div class="empty-state-title">No Auto Trades Yet</div>
                    <div class="empty-state-text">
                        Create your first automated trade to get started.<br>
                        Set up trades to run automatically and maximize your trading efficiency.
                    </div>
                </div>`;
            }
            if (emptyState) emptyState.style.display = 'none';
            return;
        }

        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        const cards = autoTrades.map(autoTrade => {
            const yourRap = autoTrade.giving.reduce((sum, item) => sum + item.rap, 0) + (autoTrade.robuxGive || 0);
            const yourVal = autoTrade.giving.reduce((sum, item) => sum + item.value, 0) + (autoTrade.robuxGive || 0);
            const theirRap = autoTrade.receiving.reduce((sum, item) => sum + item.rap, 0) + (autoTrade.robuxGet || 0);
            const theirVal = autoTrade.receiving.reduce((sum, item) => sum + item.value, 0) + (autoTrade.robuxGet || 0);

            const rapProfit = theirRap - yourRap;
            const valProfit = theirVal - yourVal;

            const maxTrades = autoTrade.settings?.maxTrades || autoTrade.settings?.maxTradesPerDay || 5;
            const tradesExecutedToday = Trades.getTodayTradeCount(autoTrade.id);

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
                                ${autoTrade.giving.map(item => {
                                    const itemId = item.id || item.itemId || '';
                                    const itemIdStr = itemId ? String(itemId) : '';
                                    return `<div class="item-icon" data-item-id="${itemIdStr}" data-id="${itemIdStr}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>`;
                                }).join('')}
                            </div>
                        </div>

                        <div class="items-section">
                            <div class="items-title">You Get</div>
                            <div class="items-list">
                                ${autoTrade.receiving.map(item => {
                                    const itemId = item.id || item.itemId || '';
                                    const itemIdStr = itemId ? String(itemId) : '';
                                    return `<div class="item-icon" data-item-id="${itemIdStr}" data-id="${itemIdStr}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>`;
                                }).join('')}
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
                        <div class="trade-actions-inline" style="display: flex; flex-direction: column; gap: 6px; align-items: center; min-width: 32px; flex-shrink: 0;">
                            <button class="edit-auto-trade" data-trade-id="${autoTrade.id}" style="
                                background: transparent !important;
                                border: 1px solid #444 !important;
                                color: #fff !important;
                                width: 32px !important;
                                min-width: 32px !important;
                                height: 32px !important;
                                min-height: 32px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                font-size: 14px !important;
                                padding: 0 !important;
                                box-shadow: none !important;
                                flex-shrink: 0 !important;
                                overflow: visible !important;
                            ">✏️</button>
                            <button class="delete-auto-trade" data-trade-id="${autoTrade.id}" style="
                                background: transparent !important;
                                border: 1px solid #444 !important;
                                color: #fff !important;
                                width: 32px !important;
                                min-width: 32px !important;
                                height: 32px !important;
                                min-height: 32px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                font-size: 14px !important;
                                padding: 0 !important;
                                box-shadow: none !important;
                                flex-shrink: 0 !important;
                                overflow: visible !important;
                            ">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;

        const autoTradesContainer = DOM.$('#auto-trades-container');
        if (autoTradesContainer) {
            autoTradesContainer.removeEventListener('click', handleAutoTradeActions);
            autoTradesContainer.addEventListener('click', handleAutoTradeActions);
        }

        const allItemIds = new Set();
        autoTrades.forEach(trade => {
            (trade.giving || []).forEach(item => {
                const itemId = item.id || item.itemId;
                if (itemId) allItemIds.add(String(itemId).trim());
            });
            (trade.receiving || []).forEach(item => {
                const itemId = item.id || item.itemId;
                if (itemId) allItemIds.add(String(itemId).trim());
            });
        });
        
        if (allItemIds.size > 0 && window.Thumbnails && window.Thumbnails.fetchBatch) {
            const itemIdsArray = Array.from(allItemIds);
            const batchSize = 100;
            for (let i = 0; i < itemIdsArray.length; i += batchSize) {
                const batch = itemIdsArray.slice(i, i + batchSize);
                Utils.delay(i / batchSize * 200).then(() => {
                    window.Thumbnails.fetchBatch(batch).catch(() => {});
                });
            }
        }

        Utils.nextFrame(() => {
            if (window.loadAutoTradeItemThumbnails) {
                window.loadAutoTradeItemThumbnails();
            }
        });
    }

    function displayTrades(trades, containerId) {
        const container = document.getElementById(containerId);

        if (!container) return;

        const sortKey = `${containerId}SortOrder`;
        const sortOrder = Storage.get(sortKey, 'newest');
        
        let sortedTrades = [...trades];
        sortedTrades.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.created || 0).getTime();
            const dateB = new Date(b.timestamp || b.created || 0).getTime();
            return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
        });

        const tradesPerPage = 12;
        const currentPageKey = `${containerId}CurrentPage`;
        let currentPage = parseInt(Storage.get(currentPageKey, '1'));

        const totalPages = Math.max(1, Math.ceil(sortedTrades.length / tradesPerPage));
        if (currentPage > totalPages) {
            currentPage = totalPages;
            Storage.set(currentPageKey, currentPage.toString());
        }

        const startIndex = (currentPage - 1) * tradesPerPage;
        const endIndex = startIndex + tradesPerPage;
        const tradesToShow = sortedTrades.slice(startIndex, endIndex);
        
        const tradesKey = containerId.replace('-container', '') + 'Trades';
        window[tradesKey] = sortedTrades;

        container.innerHTML = '';

        const isSendTradesStyle = containerId.includes('outbound') || containerId.includes('expired') || containerId.includes('countered') || containerId.includes('completed');

        if (trades.length === 0) {
            const paginationEl = document.getElementById(`${containerId.replace('-container', '')}-pagination`);
            if (paginationEl) paginationEl.style.display = 'none';
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-title">No Trades Found</div>
                    <div class="empty-state-text">
                        ${containerId.includes('completed') ? 'No completed trades yet.' :
                          containerId.includes('outbound') ? 'No outbound trades at the moment.' : 
                          containerId.includes('expired') ? 'No declined trades found.' :
                          containerId.includes('countered') ? 'No countered trades found.' : 'No trades found.'}
                    </div>
                </div>
            `;
            return;
        }

        const paginationEl = document.getElementById(`${containerId.replace('-container', '')}-pagination`);
        if (paginationEl) {
            paginationEl.style.display = 'flex';
            const currentSpan = paginationEl.querySelector(`#${containerId.replace('-container', '')}-pagination-current`);
            const totalSpan = paginationEl.querySelector(`#${containerId.replace('-container', '')}-pagination-total-pages`);
            const prevBtn = paginationEl.querySelector(`#${containerId.replace('-container', '')}-pagination-prev`);
            const nextBtn = paginationEl.querySelector(`#${containerId.replace('-container', '')}-pagination-next`);
            const sortBtn = paginationEl.querySelector(`#${containerId.replace('-container', '')}-sort-btn`);
            const sortIcon = paginationEl.querySelector(`#${containerId.replace('-container', '')}-sort-icon`);
            
            if (currentSpan) currentSpan.textContent = `Page ${currentPage}`;
            if (totalSpan) totalSpan.textContent = totalPages;
            if (prevBtn) {
                prevBtn.disabled = currentPage <= 1;
                prevBtn.onclick = () => {
                    if (currentPage > 1) {
                        Storage.set(currentPageKey, (currentPage - 1).toString());
                        const storedTrades = window[tradesKey] || trades;
                        displayTrades(storedTrades, containerId);
                    }
                };
            }
            if (nextBtn) {
                nextBtn.disabled = currentPage >= totalPages;
                nextBtn.onclick = () => {
                    if (currentPage < totalPages) {
                        Storage.set(currentPageKey, (currentPage + 1).toString());
                        const storedTrades = window[tradesKey] || trades;
                        displayTrades(storedTrades, containerId);
                    }
                };
            }
            if (sortBtn) {
                const currentSort = Storage.get(sortKey, 'newest');
                if (sortIcon) {
                    sortIcon.textContent = currentSort === 'oldest' ? '↓' : '↑';
                }
                sortBtn.innerHTML = `<span id="${containerId.replace('-container', '')}-sort-icon">${currentSort === 'oldest' ? '↓' : '↑'}</span> ${currentSort === 'oldest' ? 'Oldest First' : 'Newest First'}`;
                sortBtn.onclick = () => {
                    const newSort = currentSort === 'oldest' ? 'newest' : 'oldest';
                    Storage.set(sortKey, newSort);
                    Storage.set(currentPageKey, '1');
                    displayTrades(trades, containerId);
                };
            }
        }

        container.innerHTML = tradesToShow.map(trade => {
            const giving = Array.isArray(trade.giving) ? trade.giving : [];
            const receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
            const robuxGive = Number(trade.robuxGive) || 0;
            const robuxGet = Number(trade.robuxGet) || 0;
            
            if ((giving.length > 0 || receiving.length > 0) || robuxGive > 0 || robuxGet > 0) {
                const yourRap = giving.reduce((sum, item) => sum + (item.rap || 0), 0) + robuxGive;
                const yourVal = giving.reduce((sum, item) => sum + (item.value || 0), 0) + robuxGive;
                const theirRap = receiving.reduce((sum, item) => sum + (item.rap || 0), 0) + robuxGet;
                const theirVal = receiving.reduce((sum, item) => sum + (item.value || 0), 0) + robuxGet;

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
                                    ${giving.map(item => {
                                        const itemId = item.id || item.itemId;
                                        const itemIdStr = itemId ? String(itemId) : '';
                                        return `<div class="item-icon" data-item-id="${itemIdStr}" data-id="${itemIdStr}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>`;
                                    }).join('')}
                                    ${robuxGive > 0 ? `<div class="item-icon robux-icon" style="background: #00d26a; color: white; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center;" title="${robuxGive.toLocaleString()} Robux (${Math.floor(robuxGive * 0.7).toLocaleString()} after tax)">R${robuxGive >= 1000 ? (robuxGive / 1000).toFixed(1) + 'K' : robuxGive.toLocaleString()}</div>` : ''}
                                </div>
                            </div>

                            <div class="items-section">
                                <div class="items-title">YOU GET</div>
                                <div class="items-list">
                                    ${receiving.map(item => {
                                        const itemId = item.id || item.itemId;
                                        const itemIdStr = itemId ? String(itemId) : '';
                                        return `<div class="item-icon" data-item-id="${itemIdStr}" data-id="${itemIdStr}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>`;
                                    }).join('')}
                                    ${robuxGet > 0 ? `<div class="item-icon robux-icon" style="background: #00d26a; color: white; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center;" title="${robuxGet.toLocaleString()} Robux (${Math.floor(robuxGet * 0.7).toLocaleString()} after tax)">R${robuxGet >= 1000 ? (robuxGet / 1000).toFixed(1) + 'K' : robuxGet.toLocaleString()}</div>` : ''}
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

        function applyConsistentSizing() {
            const container = document.getElementById(containerId);
            if (!container) return;

            const tradeCards = container.querySelectorAll('.trade-card');
            tradeCards.forEach(card => {
                const itemsSections = card.querySelectorAll('.items-section');
                if (itemsSections.length === 2) {
                    const giveList = itemsSections[0].querySelector('.items-list');
                    const getList = itemsSections[1].querySelector('.items-list');
                    
                    if (giveList && getList) {
                        const giveItems = giveList.querySelectorAll('.item-icon:not(.robux-icon)').length;
                        const getItems = getList.querySelectorAll('.item-icon:not(.robux-icon)').length;
                        const maxItems = Math.max(giveItems, getItems, 1);
                        
                        [giveList, getList].forEach(list => {
                            list.classList.remove('items-2', 'items-3', 'items-4', 'items-5', 'items-6', 'items-7', 'items-8-plus');
                        });
                        
                        let sizeClass = '';
                        if (maxItems >= 8) {
                            sizeClass = 'items-8-plus';
                        } else if (maxItems === 7) {
                            sizeClass = 'items-7';
                        } else if (maxItems === 6) {
                            sizeClass = 'items-6';
                        } else if (maxItems === 5) {
                            sizeClass = 'items-5';
                        } else if (maxItems === 4) {
                            sizeClass = 'items-4';
                        } else if (maxItems === 3) {
                            sizeClass = 'items-3';
                        } else if (maxItems === 2) {
                            sizeClass = 'items-2';
                        } else {
                            sizeClass = 'items-2';
                        }
                        
                        if (sizeClass) {
                            giveList.classList.add(sizeClass);
                            getList.classList.add(sizeClass);
                        }
                    }
                }
            });
        }

        Utils.nextFrame(() => {
            applyConsistentSizing();
        });

        Utils.delay(100).then(() => {
            applyConsistentSizing();
        });

        Utils.delay(500).then(() => {
            applyConsistentSizing();
        });

        Utils.nextFrame(() => {
            if (window.loadAutoTradeItemThumbnails) {
                window.loadAutoTradeItemThumbnails(containerId);
            }
        });
    }

    async function displayTradeOpportunities(opportunities) {
        const grid = DOM.$('#send-trades-grid');
        if (!grid) return;

        if (opportunities.length === 0) {
            if (window.filteredOpportunities && window.filteredOpportunities.length > 0) {
                const totalPages = Pagination.getTotalPages();
                const currentPage = Pagination.getCurrentPage();
                if (currentPage > 1 && currentPage <= totalPages) {
                    Pagination.setCurrentPage(currentPage - 1);
                    Pagination.displayCurrentPage();
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

        let tradesToShow = opportunities;
        
        if (opportunities === window.filteredOpportunities) {
            const currentPage = Pagination.getCurrentPage();
            const tradesPerPage = Pagination.getTradesPerPage();
            const startIndex = (currentPage - 1) * tradesPerPage;
            const endIndex = startIndex + tradesPerPage;
            tradesToShow = opportunities.slice(startIndex, endIndex);
        }

        if (Object.keys(rolimonData).length > 0) {
            tradesToShow = tradesToShow.map(opportunity => {
                const enrichedGiving = opportunity.giving.map(item => {
                    const itemName = item.name;
                    const rolimonEntry = Object.entries(rolimonData).find(([id, data]) => data && Array.isArray(data) && data[0] === itemName);
                    if (rolimonEntry) {
                        const [itemId, rolimonItem] = rolimonEntry;
                        return {
                            ...item,
                            id: parseInt(itemId) || item.id || item.itemId,
                            itemId: parseInt(itemId) || item.id || item.itemId,
                            rap: item.rap || rolimonItem[2],
                            value: item.value || rolimonItem[4]
                        };
                    }
                    return item;
                });

                const enrichedReceiving = opportunity.receiving.map(item => {
                    const itemName = item.name;
                    const rolimonEntry = Object.entries(rolimonData).find(([id, data]) => data && Array.isArray(data) && data[0] === itemName);
                    if (rolimonEntry) {
                        const [itemId, rolimonItem] = rolimonEntry;
                        return {
                            ...item,
                            id: parseInt(itemId) || item.id || item.itemId,
                            itemId: parseInt(itemId) || item.id || item.itemId,
                            rap: item.rap || rolimonItem[2],
                            value: item.value || rolimonItem[4]
                        };
                    }
                    return item;
                });

                return {
                    ...opportunity,
                    giving: enrichedGiving,
                    receiving: enrichedReceiving
                };
            });
        }

        grid.innerHTML = tradesToShow.map(opportunity => {
            const givingItems = opportunity.giving.map(item =>
                `<div class="item-card-compact">
                    <div class="item-icon" data-item-id="${item.id || item.itemId || ''}" data-id="${item.id || item.itemId || ''}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>
                    <div class="item-info-compact">
                        <div class="item-name-compact">${item.name && item.name.length > 15 ? item.name.substring(0, 15) + '...' : (item.name || 'Unknown Item')}</div>
                        <div class="item-values-compact">
                            <span class="rap-text">RAP: ${(item.rap || 0).toLocaleString()}</span>
                            <span class="value-text">VAL: ${(item.value || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`
            ).join('');

            const receivingItems = opportunity.receiving.map(item =>
                `<div class="item-card-compact">
                    <div class="item-icon" data-item-id="${item.id || item.itemId || ''}" data-id="${item.id || item.itemId || ''}" data-item-name="${item.name || ''}" title="${item.name || 'Unknown Item'}&#10;RAP ${(item.rap || 0).toLocaleString()}&#10;VAL ${(item.value || 0).toLocaleString()}">${(item.name || 'UI').substring(0, 2).toUpperCase()}</div>
                    <div class="item-info-compact">
                        <div class="item-name-compact">${item.name && item.name.length > 15 ? item.name.substring(0, 15) + '...' : (item.name || 'Unknown Item')}</div>
                        <div class="item-values-compact">
                            <span class="rap-text">RAP: ${(item.rap || 0).toLocaleString()}</span>
                            <span class="value-text">VAL: ${(item.value || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`
            ).join('');

            let robuxGetHtml = '';
            if (opportunity.robuxGet && opportunity.robuxGet > 0) {
                const afterTaxRobux = Math.floor(opportunity.robuxGet * 0.7);
                robuxGetHtml = `
                    <div class="item-card-compact" style="margin-top: 8px;">
                        <div class="item-icon" style="background: #00d26a; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">R$</div>
                        <div class="item-info-compact">
                            <div class="item-name-compact">${opportunity.robuxGet.toLocaleString()} Robux</div>
                            <div class="item-values-compact" style="color: #888; font-size: 11px;">
                                (${afterTaxRobux.toLocaleString()} robux after tax)
                            </div>
                        </div>
                    </div>
                `;
            }

            let robuxGiveHtml = '';
            if (opportunity.robuxGive && opportunity.robuxGive > 0) {
                const afterTaxRobux = Math.floor(opportunity.robuxGive * 0.7);
                robuxGiveHtml = `
                    <div class="item-card-compact" style="margin-top: 8px;">
                        <div class="item-icon" style="background: #00d26a; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">R$</div>
                        <div class="item-info-compact">
                            <div class="item-name-compact">${opportunity.robuxGive.toLocaleString()} Robux</div>
                            <div class="item-values-compact" style="color: #888; font-size: 11px;">
                                (${afterTaxRobux.toLocaleString()} robux after tax)
                            </div>
                        </div>
                    </div>
                `;
            }

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
                                ${robuxGiveHtml}
                            </div>
                        </div>

                        <div class="trade-section-compact">
                            <div class="section-title-compact">GET</div>
                            <div class="trade-items-compact">
                                ${receivingItems}
                                ${robuxGetHtml}
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

        const allItemIds = new Set();
        tradesToShow.forEach(opportunity => {
            (opportunity.giving || []).forEach(item => {
                const itemId = item.id || item.itemId;
                if (itemId) allItemIds.add(String(itemId).trim());
            });
            (opportunity.receiving || []).forEach(item => {
                const itemId = item.id || item.itemId;
                if (itemId) allItemIds.add(String(itemId).trim());
            });
        });
        
        if (allItemIds.size > 0 && window.Thumbnails && window.Thumbnails.fetchBatch) {
            const itemIdsArray = Array.from(allItemIds);
            const batchSize = 100;
            for (let i = 0; i < itemIdsArray.length; i += batchSize) {
                const batch = itemIdsArray.slice(i, i + batchSize);
                Utils.delay(i / batchSize * 200).then(() => {
                    window.Thumbnails.fetchBatch(batch).catch(() => {});
                });
            }
        }

        Utils.nextFrame(() => {
            if (window.loadAutoTradeItemThumbnails) {
                window.loadAutoTradeItemThumbnails('send-trades-grid');
            }
        });

        if (window.setupSendTradeButtons) {
            window.setupSendTradeButtons();
        }
        Pagination.updatePaginationControls();
    }

    function handleAutoTradeActions(e) {
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
                }
            }
        }
    }

    window.TradeDisplay = {
        displayAutoTrades,
        displayTrades,
        displayTradeOpportunities,
        handleAutoTradeActions
    };

    window.displayTradeOpportunities = displayTradeOpportunities;
    window.displayAutoTrades = displayAutoTrades;
})();
