importScripts('utils.js');

let rolimonsCache = {
    data: null,
    timestamp: 0,
    promise: null,
    duration: 60000
};

let commonOwnersCache = {
    map: new Map(), 
    duration: 60000
};

let thumbnailCache = {
    map: new Map(),
    duration: 300000
};

let inventoryCache = {
    map: new Map(),
    duration: 60000
};

let playerAssetsCache = {
    map: new Map(),
    duration: 60000
};

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: 'https://roautotrade.com'
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchPlayerAssets") {
        const userIds = Array.isArray(request.userIds) ? request.userIds : [];
        const now = Date.now();

        if (userIds.length === 0) {
            sendResponse({ success: false, error: "No user IDs provided" });
            return true;
        }

        const cachedResults = {};
        const uncachedUserIds = [];

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const cached = playerAssetsCache.map.get(userId);
            if (cached && (now - cached.timestamp < playerAssetsCache.duration)) {
                cachedResults[userId] = cached.data;
            } else {
                uncachedUserIds.push(userId);
            }
        }

        if (uncachedUserIds.length === 0) {
            sendResponse({ success: true, data: { results: cachedResults, failedUsers: [] } });
            return true;
        }

        const results = {};
        const failedUsers = [];
        const BATCH_SIZE = 9;
        
        async function processUsersInBatches() {
            for (let i = 0; i < uncachedUserIds.length; i += BATCH_SIZE) {
                const batch = uncachedUserIds.slice(i, i + BATCH_SIZE);
                
                const batchPromises = batch.map(async (userId) => {
                    try {
                        const response = await fetch(`https://roautotrade.com/api/playerassets/${userId}`);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const data = await response.json();
                        
                        if (data && data.success && data.playerAssets) {
                            const playerAssets = data.playerAssets;
                            playerAssetsCache.map.set(userId, {
                                data: playerAssets,
                                timestamp: Date.now()
                            });
                            return { userId, success: true, data: playerAssets };
                        } else {
                            return { userId, success: false, reason: 'No assets or privacy enabled' };
                        }
                    } catch (error) {
                        return { userId, success: false, reason: error.message };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                
                batchResults.forEach(result => {
                    if (result.success) {
                        results[result.userId] = result.data;
                    } else {
                        failedUsers.push({ userId: result.userId, reason: result.reason });
                    }
                });

                if (i + BATCH_SIZE < uncachedUserIds.length) {
                    await Utils.delay(500);
                }
            }
        }

        processUsersInBatches()
            .then(() => {
                const finalResults = { ...cachedResults, ...results };
                const finalResult = { results: finalResults, failedUsers };
                sendResponse({ success: true, data: finalResult });
            })
            .catch(error => {
                console.error('Background: Error in player assets fetch:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }
    else if (request.action === "checkCanTradeWith") {
        fetch('https://auth.roblox.com/v1/logout', {
            method: 'POST',
            credentials: 'include'
        })
        .then(tokenResponse => {
            const csrfToken = tokenResponse.headers.get('x-csrf-token');

            const headers = {
                'Content-Type': 'application/json'
            };

            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            return fetch(`https://trades.roblox.com/v1/users/${request.userId}/can-trade-with`, {
                method: 'GET',
                credentials: 'include',
                headers: headers
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error('Background: Error checking can-trade:', error);
            sendResponse({ success: false, error: error.message });
        });

        return true;
    } else if (request.action === "fetchRolimons") {
        const cacheEntry = rolimonsCache;
        const now = Date.now();

        if (cacheEntry.data && (now - cacheEntry.timestamp < cacheEntry.duration)) {
            sendResponse({ success: true, data: cacheEntry.data });
            return true;
        }

        if (cacheEntry.promise) {
            cacheEntry.promise.then(data => {
                sendResponse({ success: true, data: data });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true;
        }

        cacheEntry.promise = (async () => {
            try {
                const response = await fetch("https://api.rolimons.com/items/v2/itemdetails");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (!data || typeof data !== 'object' || !data.items) {
                    throw new Error('Invalid Rolimons data format');
                }
                
                cacheEntry.data = data;
                cacheEntry.timestamp = Date.now();
                cacheEntry.promise = null;
                return data;
            } catch (error) {
                cacheEntry.promise = null;
                console.error('Background: Error fetching Rolimons data:', error);
                throw error;
            }
        })();

        cacheEntry.promise.then(data => {
            sendResponse({ success: true, data: data });
        }).catch(error => {
            console.error('Background: Error fetching Rolimons data:', error);
            sendResponse({ success: false, error: error.message || 'Failed to fetch Rolimons data' });
        });

        return true;
    } else if (request.action === "fetchCommonOwners") {
        const { itemIds, maxOwnerDays = 100000000, lastOnlineDays = 3 } = request;
        const cacheKey = JSON.stringify({ itemIds, maxOwnerDays, lastOnlineDays });
        const now = Date.now();

        const cached = commonOwnersCache.map.get(cacheKey);
        if (cached && (now - cached.timestamp < commonOwnersCache.duration)) {
            sendResponse({ success: true, data: cached.data });
            return true;
        }

        const url = `https://roautotrade.com/api/common-owners?item_ids=${itemIds.join(',')}&max_owner_days=${maxOwnerDays}&last_online_days=${lastOnlineDays}&detailed=true`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                commonOwnersCache.map.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error('Background: Error fetching common owners:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    } else if (request.action === "fetchInstanceIds") {
        fetch("https://roautotrade.com/api/instance-ids", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request.payload)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Background: API Error response:', text);
                        throw new Error(`HTTP error! status: ${response.status}, response: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error('Background: Error fetching instance IDs:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    } else if (request.action === "fetchUserAuth") {
        (async () => {
            const result = await Utils.safeFetch("https://users.roblox.com/v1/users/authenticated", {
                timeout: 8000,
                retries: 2
            });

            if (result.ok) {
                const userData = result.data?.data || result.data;
                
                if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
                    Utils.Logger.log('fetch_user_auth_validation_failed', { 
                        errors: ['userData is not a valid object'], 
                        resultData: result.data,
                        userData: userData,
                        userDataType: typeof userData,
                        isArray: Array.isArray(userData)
                    });
                    sendResponse({ success: false, error: 'Invalid user data format: data is not an object' });
                    return;
                }

                const validated = Utils.validateData(userData, {
                    id: { type: 'number', required: true},
                    name: { type: 'string', required: true, },
                    displayName: { type: 'string', required: true}
                });
                
                if (validated.valid) {
                    sendResponse({ success: true, data: validated.data });
                } else {
                    Utils.Logger.log('fetch_user_auth_validation_failed', { 
                        errors: validated.errors,
                        receivedData: userData
                    });
                    sendResponse({ success: false, error: 'Invalid user data format' });
                }
            } else {
                Utils.Logger.log('fetch_user_auth_failed', { error: result.error?.message });
                sendResponse({ success: false, error: result.error?.message || 'Failed to fetch user auth' });
            }
        })();

        return true;
    } else if (request.action === "fetchUserInventory") {
        const cacheKey = `${request.userId}_${request.cursor || ''}`;
        const now = Date.now();
        
        const cached = inventoryCache.map.get(cacheKey);
        if (cached && (now - cached.timestamp < inventoryCache.duration)) {
            sendResponse({ success: true, data: cached.data });
            return true;
        }

        let url = `https://inventory.roblox.com/v1/users/${request.userId}/assets/collectibles?sortOrder=Asc&limit=100`;
        if (request.cursor) {
            url += `&cursor=${request.cursor}`;
        }

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                inventoryCache.map.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error('Background: Error fetching user collectibles:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    } else if (request.action === "fetchThumbnail") {
        const itemId = request.itemId;
        const now = Date.now();
        
        const cached = thumbnailCache.map.get(itemId);
        if (cached && (now - cached.timestamp < thumbnailCache.duration)) {
            sendResponse({ success: true, data: cached.data });
            return true;
        }

        fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${itemId}&size=150x150&format=Png&isCircular=false`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                thumbnailCache.map.set(itemId, {
                    data: data,
                    timestamp: Date.now()
                });
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error('Background: Error fetching thumbnail:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }
});