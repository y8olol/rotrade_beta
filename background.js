

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: 'https://roautotrade.com'
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkCanTradeWith") {

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
    }

    if (request.action === "fetchRolimons") {

        fetch("https://api.rolimons.com/items/v2/itemdetails")
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
                console.error('Background: Error fetching Rolimons data:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }

    if (request.action === "fetchCommonOwners") {

        const { itemIds, maxOwnerDays = 100000000, lastOnlineDays = 3 } = request;
        const url = `https://roautotrade.com/api/common-owners?item_ids=${itemIds.join(',')}&max_owner_days=${maxOwnerDays}&last_online_days=${lastOnlineDays}`;

        fetch(url)
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
                console.error('Background: Error fetching common owners:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }

    if (request.action === "fetchInstanceIds") {

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
    }

    if (request.action === "fetchUserAuth") {

        fetch("https://users.roblox.com/v1/users/authenticated")
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
                console.error('Background: Error fetching user auth:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }

    if (request.action === "fetchUserInventory") {

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
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error('Background: Error fetching user collectibles:', error);
                console.error('Background: Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }

    if (request.action === "fetchThumbnail") {

        fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${request.itemId}&size=150x150&format=Png&isCircular=false`)
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
                console.error('Background: Error fetching thumbnail:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }
});

