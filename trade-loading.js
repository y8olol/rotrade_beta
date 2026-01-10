(function() {
    'use strict';

    function createRolimonsIndex(rolimonData) {
        const nameIndex = new Map();
        const idIndex = new Map();
        
        for (const [itemId, itemData] of Object.entries(rolimonData)) {
            if (Array.isArray(itemData) && itemData.length >= 5) {
                const name = itemData[0];
                if (name && typeof name === 'string') {
                    nameIndex.set(name, { id: parseInt(itemId), data: itemData });
                }
                idIndex.set(itemId, itemData);
            }
        }
        
        return { nameIndex, idIndex };
    }

    function enrichItemWithRolimons(item, nameIndex) {
        if (!item.name) return item;
        const itemName = (item.name || '').trim();
        
        let rolimonEntry = nameIndex.get(itemName);
        if (!rolimonEntry && itemName) {
            for (const [key, value] of nameIndex.entries()) {
                if (key && typeof key === 'string' && key.trim().toLowerCase() === itemName.toLowerCase()) {
                    rolimonEntry = value;
                    break;
                }
            }
        }
        
        if (!rolimonEntry) return item;
        
        const { id: itemId, data: rolimonItem } = rolimonEntry;
        return {
            ...item,
            id: itemId || item.id || item.itemId,
            itemId: itemId || item.id || item.itemId,
            rap: rolimonItem[2],
            value: rolimonItem[4]
        };
    }

    async function loadAutoTradeData() {
        let autoTrades = Storage.get('autoTrades', []);

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

        if (Object.keys(rolimonData).length > 0) {
            const { nameIndex } = createRolimonsIndex(rolimonData);
            
            for (let i = 0; i < autoTrades.length; i++) {
                const trade = autoTrades[i];
                const giving = trade.giving || [];
                const receiving = trade.receiving || [];
                
                for (let j = 0; j < giving.length; j++) {
                    giving[j] = enrichItemWithRolimons(giving[j], nameIndex);
                }
                
                for (let j = 0; j < receiving.length; j++) {
                    receiving[j] = enrichItemWithRolimons(receiving[j], nameIndex);
                }
                
                autoTrades[i] = {
                    ...trade,
                    giving,
                    receiving
                };
            }
        }

        if (typeof TradeDisplay !== 'undefined' && TradeDisplay.displayAutoTrades) {
            TradeDisplay.displayAutoTrades(autoTrades);
        } else if (window.displayAutoTrades) {
            window.displayAutoTrades(autoTrades);
        }
    }

    async function loadOutboundTrades() {
        Storage.clearCache('pendingExtensionTrades');
        Storage.flush();
        const pendingTrades = Storage.get('pendingExtensionTrades', []);

        if (pendingTrades.length === 0) {
            if (window.displayTrades) {
                window.displayTrades([], 'outbound-container');
            }
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

        const formattedTrades = pendingTrades.map(trade => {
            let giving = Array.isArray(trade.giving) ? trade.giving : [];
            let receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
            const robuxGive = Number(trade.robuxGive) || 0;
            const robuxGet = Number(trade.robuxGet) || 0;

        if (Object.keys(rolimonData).length > 0) {
            const { nameIndex } = createRolimonsIndex(rolimonData);
            
            for (let i = 0; i < giving.length; i++) {
                const enriched = enrichItemWithRolimons(giving[i], nameIndex);
                if (enriched.rap) giving[i] = { ...giving[i], rap: giving[i].rap || enriched.rap };
                if (enriched.value) giving[i] = { ...giving[i], value: giving[i].value || enriched.value };
                if (enriched.id) giving[i] = { ...giving[i], id: enriched.id, itemId: enriched.itemId };
            }

            for (let i = 0; i < receiving.length; i++) {
                const enriched = enrichItemWithRolimons(receiving[i], nameIndex);
                if (enriched.rap) receiving[i] = { ...receiving[i], rap: receiving[i].rap || enriched.rap };
                if (enriched.value) receiving[i] = { ...receiving[i], value: receiving[i].value || enriched.value };
                if (enriched.id) receiving[i] = { ...receiving[i], id: enriched.id, itemId: enriched.itemId };
            }
        }
            
            if ((giving.length > 0 || receiving.length > 0) || robuxGive > 0 || robuxGet > 0) {
                return {
                    ...trade,
                    giving: giving,
                    receiving: receiving,
                    robuxGive: robuxGive,
                    robuxGet: robuxGet,
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

        const container = document.getElementById('outbound-container');
        if (!container) {
            console.warn('Outbound container not found');
            return;
        }

        window.outboundTrades = formattedTrades;
        
        preloadTradeThumbnails(formattedTrades);
        
        if (window.displayTrades) {
            window.displayTrades(formattedTrades, 'outbound-container');
        } else if (typeof TradeDisplay !== 'undefined' && TradeDisplay.displayTrades) {
            TradeDisplay.displayTrades(formattedTrades, 'outbound-container');
        } else {
            console.error('displayTrades function not found');
        }
    }

    function preloadTradeThumbnails(trades) {
        const allItemIds = new Set();
        
        for (let i = 0; i < trades.length; i++) {
            const trade = trades[i];
            const giving = Array.isArray(trade.giving) ? trade.giving : [];
            const receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
            
            for (let j = 0; j < giving.length; j++) {
                const itemId = giving[j].id || giving[j].itemId;
                if (itemId) allItemIds.add(String(itemId).trim());
            }
            
            for (let j = 0; j < receiving.length; j++) {
                const itemId = receiving[j].id || receiving[j].itemId;
                if (itemId) allItemIds.add(String(itemId).trim());
            }
        }
        
        if (allItemIds.size === 0) return;
        
        if (!window.thumbnailCache) {
            window.thumbnailCache = {};
            try {
                const stored = localStorage.getItem('thumbnailCache');
                if (stored) {
                    window.thumbnailCache = JSON.parse(stored);
                }
            } catch {}
        }
        
        const itemIdsToLoad = [];
        for (const id of allItemIds) {
            const itemIdStr = String(id).trim();
            if (!window.thumbnailCache[itemIdStr]) {
                itemIdsToLoad.push(itemIdStr);
            }
        }
        
        if (itemIdsToLoad.length === 0) return;
        
        const batchSize = 100;
        const batchCount = Math.ceil(itemIdsToLoad.length / batchSize);
        
        for (let i = 0; i < batchCount; i++) {
            const batch = itemIdsToLoad.slice(i * batchSize, (i + 1) * batchSize);
            Utils.delay(i * 200).then(() => {
                if (window.Thumbnails && window.Thumbnails.fetchBatch) {
                    window.Thumbnails.fetchBatch(batch).catch(() => {});
                }
            });
        }
    }

    async function loadExpiredTrades() {
        Storage.clearCache('finalizedExtensionTrades');
        Storage.flush();
        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);

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

        const expiredTrades = finalizedTrades
            .filter(trade => {
                const status = (trade.status || '').toLowerCase();
                const robloxStatus = (trade.robloxStatus || '').toLowerCase();
                return status === 'expired' || status === 'declined' || robloxStatus === 'expired';
            })
            .map(trade => {
                let giving = Array.isArray(trade.giving) ? trade.giving : [];
                let receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
                
        if (Object.keys(rolimonData).length > 0) {
            const { nameIndex } = createRolimonsIndex(rolimonData);
            
            for (let i = 0; i < giving.length; i++) {
                const enriched = enrichItemWithRolimons(giving[i], nameIndex);
                if (enriched.rap) giving[i] = { ...giving[i], rap: giving[i].rap || enriched.rap };
                if (enriched.value) giving[i] = { ...giving[i], value: giving[i].value || enriched.value };
                if (enriched.id) giving[i] = { ...giving[i], id: enriched.id, itemId: enriched.itemId };
            }

            for (let i = 0; i < receiving.length; i++) {
                const enriched = enrichItemWithRolimons(receiving[i], nameIndex);
                if (enriched.rap) receiving[i] = { ...receiving[i], rap: receiving[i].rap || enriched.rap };
                if (enriched.value) receiving[i] = { ...receiving[i], value: receiving[i].value || enriched.value };
                if (enriched.id) receiving[i] = { ...receiving[i], id: enriched.id, itemId: enriched.itemId };
            }
        }
                
                return {
                    ...trade,
                    giving: giving,
                    receiving: receiving,
                    robuxGive: Number(trade.robuxGive) || 0,
                    robuxGet: Number(trade.robuxGet) || 0,
                    type: 'Extension Trade',
                    timestamp: trade.finalizedAt || trade.created,
                    expired: new Date(trade.finalizedAt || trade.created).toLocaleString()
                };
            });

        const container = document.getElementById('expired-container');
        if (!container) {
            console.warn('Expired container not found');
            return;
        }

        window.expiredTrades = expiredTrades;
        
        preloadTradeThumbnails(expiredTrades);
        
        if (window.displayTrades) {
            window.displayTrades(expiredTrades, 'expired-container');
        } else if (typeof TradeDisplay !== 'undefined' && TradeDisplay.displayTrades) {
            TradeDisplay.displayTrades(expiredTrades, 'expired-container');
        }
    }

    async function loadCounteredTrades() {
        Storage.clearCache('finalizedExtensionTrades');
        Storage.flush();
        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);

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

        const counteredTrades = finalizedTrades
            .filter(trade => {
                const status = (trade.status || '').toLowerCase();
                return status === 'countered';
            })
            .map(trade => {
                let giving = Array.isArray(trade.giving) ? trade.giving : [];
                let receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
                
        if (Object.keys(rolimonData).length > 0) {
            const { nameIndex } = createRolimonsIndex(rolimonData);
            
            for (let i = 0; i < giving.length; i++) {
                const enriched = enrichItemWithRolimons(giving[i], nameIndex);
                if (enriched.rap) giving[i] = { ...giving[i], rap: giving[i].rap || enriched.rap };
                if (enriched.value) giving[i] = { ...giving[i], value: giving[i].value || enriched.value };
                if (enriched.id) giving[i] = { ...giving[i], id: enriched.id, itemId: enriched.itemId };
            }

            for (let i = 0; i < receiving.length; i++) {
                const enriched = enrichItemWithRolimons(receiving[i], nameIndex);
                if (enriched.rap) receiving[i] = { ...receiving[i], rap: receiving[i].rap || enriched.rap };
                if (enriched.value) receiving[i] = { ...receiving[i], value: receiving[i].value || enriched.value };
                if (enriched.id) receiving[i] = { ...receiving[i], id: enriched.id, itemId: enriched.itemId };
            }
        }
                
                return {
                    ...trade,
                    giving: giving,
                    receiving: receiving,
                    robuxGive: Number(trade.robuxGive) || 0,
                    robuxGet: Number(trade.robuxGet) || 0,
                    type: 'Extension Trade',
                    timestamp: trade.finalizedAt || trade.created,
                    countered: new Date(trade.finalizedAt || trade.created).toLocaleString()
                };
            });

        const container = document.getElementById('countered-container');
        if (!container) {
            console.warn('Countered container not found');
            return;
        }

        window.counteredTrades = counteredTrades;
        
        preloadTradeThumbnails(counteredTrades);
        
        if (window.displayTrades) {
            window.displayTrades(counteredTrades, 'countered-container');
        } else if (typeof TradeDisplay !== 'undefined' && TradeDisplay.displayTrades) {
            TradeDisplay.displayTrades(counteredTrades, 'countered-container');
        }
    }

    async function loadCompletedTrades() {
        Storage.clearCache('finalizedExtensionTrades');
        Storage.flush();
        const finalizedTrades = Storage.get('finalizedExtensionTrades', []);

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

        const completedTrades = finalizedTrades
            .filter(trade => {
                const status = (trade.status || '').toLowerCase();
                return status === 'completed' || status === 'accepted';
            })
            .map(trade => {
                let giving = Array.isArray(trade.giving) ? trade.giving : [];
                let receiving = Array.isArray(trade.receiving) ? trade.receiving : [];
                
        if (Object.keys(rolimonData).length > 0) {
            const { nameIndex } = createRolimonsIndex(rolimonData);
            
            for (let i = 0; i < giving.length; i++) {
                const enriched = enrichItemWithRolimons(giving[i], nameIndex);
                if (enriched.rap) giving[i] = { ...giving[i], rap: giving[i].rap || enriched.rap };
                if (enriched.value) giving[i] = { ...giving[i], value: giving[i].value || enriched.value };
                if (enriched.id) giving[i] = { ...giving[i], id: enriched.id, itemId: enriched.itemId };
            }

            for (let i = 0; i < receiving.length; i++) {
                const enriched = enrichItemWithRolimons(receiving[i], nameIndex);
                if (enriched.rap) receiving[i] = { ...receiving[i], rap: receiving[i].rap || enriched.rap };
                if (enriched.value) receiving[i] = { ...receiving[i], value: receiving[i].value || enriched.value };
                if (enriched.id) receiving[i] = { ...receiving[i], id: enriched.id, itemId: enriched.itemId };
            }
        }
                
                return {
                    ...trade,
                    giving: giving,
                    receiving: receiving,
                    robuxGive: Number(trade.robuxGive) || 0,
                    robuxGet: Number(trade.robuxGet) || 0,
                    type: 'Extension Trade',
                    timestamp: trade.finalizedAt || trade.created,
                    completed: new Date(trade.finalizedAt || trade.created).toLocaleString()
                };
            });

        const container = document.getElementById('completed-container');
        if (!container) {
            console.warn('Completed container not found');
            return;
        }

        window.completedTrades = completedTrades;
        
        preloadTradeThumbnails(completedTrades);
        
        if (window.displayTrades) {
            window.displayTrades(completedTrades, 'completed-container');
        } else if (typeof TradeDisplay !== 'undefined' && TradeDisplay.displayTrades) {
            TradeDisplay.displayTrades(completedTrades, 'completed-container');
        }
    }

    window.TradeLoading = {
        loadAutoTradeData,
        loadOutboundTrades,
        loadExpiredTrades,
        loadCounteredTrades,
        loadCompletedTrades
    };

    window.loadAutoTradeData = loadAutoTradeData;
    window.loadOutboundTrades = loadOutboundTrades;
    window.loadExpiredTrades = loadExpiredTrades;
    window.loadCounteredTrades = loadCounteredTrades;
    window.loadCompletedTrades = loadCompletedTrades;
})();
