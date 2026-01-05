(function() {
    'use strict';

    function debounce(func, wait, options = {}) {
        const { leading = false, trailing = true, maxWait } = options;
        let timeoutId;
        let maxTimeoutId;
        let lastCallTime;
        let lastInvokeTime = 0;
        let lastArgs;
        let result;

        const invokeFunc = (time) => {
            const args = lastArgs;
            lastArgs = undefined;
            lastInvokeTime = time;
            result = func.apply(this, args);
            return result;
        };

        const leadingEdge = (time) => {
            lastInvokeTime = time;
            timeoutId = undefined;
            if (leading) {
                return invokeFunc(time);
            }
        };

        const trailingEdge = (time) => {
            timeoutId = undefined;
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            lastArgs = undefined;
            return result;
        };

        const shouldInvoke = (time) => {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;
            return (
                lastCallTime === undefined ||
                timeSinceLastCall >= wait ||
                timeSinceLastCall < 0 ||
                (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
            );
        };

        const timerExpired = () => {
            const time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            timeoutId = setTimeout(timerExpired, wait - (time - lastCallTime));
        };

        const maxTimerExpired = () => {
            const time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            maxTimeoutId = setTimeout(maxTimerExpired, maxWait - (time - lastInvokeTime));
        };

        const debounced = function(...args) {
            const time = Date.now();
            const isInvoking = shouldInvoke(time);

            lastArgs = args;
            lastCallTime = time;

            if (isInvoking) {
                if (timeoutId === undefined) {
                    return leadingEdge(lastCallTime);
                }
                if (maxWait !== undefined) {
                    clearTimeout(maxTimeoutId);
                    maxTimeoutId = setTimeout(maxTimerExpired, maxWait);
                    return invokeFunc(lastCallTime);
                }
            }
            if (timeoutId === undefined) {
                timeoutId = setTimeout(timerExpired, wait);
            }
            return result;
        };

        debounced.cancel = () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            if (maxTimeoutId !== undefined) {
                clearTimeout(maxTimeoutId);
            }
            lastInvokeTime = 0;
            lastArgs = undefined;
            lastCallTime = undefined;
            timeoutId = undefined;
            maxTimeoutId = undefined;
        };

        debounced.flush = () => {
            return timeoutId === undefined ? result : trailingEdge(Date.now());
        };

        debounced.pending = () => {
            return timeoutId !== undefined;
        };

        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                debounced.cancel();
            });
        }

        return debounced;
    }

    function throttle(func, wait, options = {}) {
        const { leading = true, trailing = true } = options;
        let timeoutId;
        let lastCallTime;
        let lastInvokeTime = 0;
        let lastArgs;
        let result;

        const shouldInvoke = (time) => {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;
            return (
                lastCallTime === undefined ||
                timeSinceLastCall >= wait ||
                timeSinceLastCall < 0 ||
                timeSinceLastInvoke >= wait
            );
        };

        const invokeFunc = (time) => {
            const args = lastArgs;
            lastArgs = undefined;
            lastInvokeTime = time;
            result = func.apply(this, args);
            return result;
        };

        const leadingEdge = (time) => {
            lastInvokeTime = time;
            timeoutId = setTimeout(timerExpired, wait);
            return leading ? invokeFunc(time) : result;
        };

        const trailingEdge = (time) => {
            timeoutId = undefined;
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            lastArgs = undefined;
            return result;
        };

        const timerExpired = () => {
            const time = Date.now();
            if (trailing && lastArgs) {
                return trailingEdge(time);
            }
            timeoutId = undefined;
            return result;
        };

        const throttled = function(...args) {
            const time = Date.now();
            const isInvoking = shouldInvoke(time);

            lastArgs = args;
            lastCallTime = time;

            if (isInvoking) {
                if (timeoutId === undefined) {
                    return leadingEdge(lastCallTime);
                }
            }
            return result;
        };

        throttled.cancel = () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            lastInvokeTime = 0;
            lastArgs = undefined;
            lastCallTime = undefined;
            timeoutId = undefined;
        };

        throttled.flush = () => {
            return timeoutId === undefined ? result : trailingEdge(Date.now());
        };

        throttled.pending = () => {
            return timeoutId !== undefined;
        };

        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                throttled.cancel();
            });
        }

        return throttled;
    }

    function nextMicrotask(callback) {
        return Promise.resolve().then(() => callback());
    }

    function nextFrame(callback) {
        if (typeof requestAnimationFrame !== 'undefined') {
            return requestAnimationFrame(callback);
        }
        return setTimeout(callback, 0);
    }

    function nextMacrotask(callback) {
        return setTimeout(callback, 0);
    }

    function delay(ms, options = {}) {
        const { signal } = options;
        
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
                return;
            }

            const timeoutId = setTimeout(() => {
                if (!signal?.aborted) {
                    resolve();
                }
            }, ms);

            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }
        });
    }

    const Logger = {
        log(event, context = {}) {
            if (typeof event !== 'string') return;
            const timestamp = new Date().toISOString();
            const logEntry = { timestamp, event, ...context };
            
            if (event.includes('error') || event.includes('fail')) {
                console.error(`[RoTrade] ${event}`, logEntry);
            } else if (event.includes('warn')) {
                console.warn(`[RoTrade] ${event}`, logEntry);
            } else {
                console.log(`[RoTrade] ${event}`, logEntry);
            }
        }
    };

    async function withRetry(fn, options = {}) {
        const { retries = 3, backoff = 500, retryable = () => true, signal } = options;
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            if (signal?.aborted) {
                return { ok: false, error: new DOMException('Aborted', 'AbortError'), aborted: true };
            }

            try {
                const result = await fn();
                if (attempt > 0) {
                    Logger.log('retry_success', { attempt, totalAttempts: attempt + 1 });
                }
                return { ok: true, data: result, attempts: attempt + 1 };
            } catch (error) {
                lastError = error;
                
                if (attempt < retries && retryable(error)) {
                    const waitTime = backoff * Math.pow(2, attempt);
                    Logger.log('retry_attempt', { attempt: attempt + 1, maxRetries: retries, waitTime, error: error.message });
                    try {
                        await delay(waitTime, { signal });
                    } catch (delayError) {
                        return { ok: false, error: delayError, aborted: true };
                    }
                } else {
                    break;
                }
            }
        }
        
        return { ok: false, error: lastError, retryable: retryable(lastError), attempts: retries + 1 };
    }

    async function withTimeout(promise, timeoutMs, options = {}) {
        const { signal } = options;
        const timeout = new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }
        });
        
        try {
            const result = await Promise.race([promise, timeout]);
            return { ok: true, data: result };
        } catch (error) {
            return { ok: false, error, timeout: error.message?.includes('timed out'), aborted: error.name === 'AbortError' };
        }
    }

    async function safeFetch(url, options = {}) {
        const { timeout = 10000, retries = 2, signal, ...fetchOptions } = options;
        
        const fetchWithRetry = () => withRetry(
            async () => {
                const controller = new AbortController();
                const fetchSignal = signal || controller.signal;
                
                if (signal) {
                    signal.addEventListener('abort', () => controller.abort());
                }

                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: fetchSignal,
                    credentials: fetchOptions.credentials || 'include',
                    headers: {
                        'Accept': 'application/json',
                        ...fetchOptions.headers
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
                }

                return await response.json();
            },
            {
                retries,
                backoff: 500,
                retryable: (error) => {
                    if (error.name === 'AbortError') return false;
                    const message = error.message || '';
                    return message.includes('429') || message.includes('timeout') || message.includes('network');
                },
                signal
            }
        );

        return withTimeout(fetchWithRetry(), timeout, { signal });
    }

    function validateData(data, schema) {
        if (!schema) return { valid: true, data };
        
        const errors = [];
        const validated = {};
        
        for (const [key, validator] of Object.entries(schema)) {
            const value = data[key];
            
            if (validator.required && (value === undefined || value === null)) {
                errors.push(`Missing required field: ${key}`);
                continue;
            }
            
            if (value !== undefined && value !== null) {
                if (validator.type && typeof value !== validator.type) {
                    errors.push(`Invalid type for ${key}: expected ${validator.type}, got ${typeof value}`);
                    continue;
                }
                
                if (validator.validate && !validator.validate(value)) {
                    errors.push(`Validation failed for ${key}`);
                    continue;
                }
                
                validated[key] = value;
            } else if (validator.default !== undefined) {
                validated[key] = validator.default;
            }
        }
        
        if (errors.length > 0) {
            return { valid: false, errors, data: null };
        }
        
        return { valid: true, data: validated };
    }

    function ensureArray(value, fallback = []) {
        if (Array.isArray(value)) return value;
        return fallback;
    }

    function ensureNumber(value, fallback = 0) {
        const num = Number(value);
        if (!isNaN(num) && isFinite(num)) return num;
        return fallback;
    }

    function ensureString(value, fallback = '') {
        if (typeof value === 'string') return value.trim();
        if (value != null) return String(value).trim();
        return fallback;
    }

    const Cache = {
        stores: new Map(),

        create(name, options = {}) {
            const { ttl = 300000, maxSize = 1000 } = options;
            const store = {
                data: new Map(),
                ttl,
                maxSize,
                get(key) {
                    const entry = this.data.get(key);
                    if (!entry) return null;
                    if (Date.now() - entry.timestamp > this.ttl) {
                        this.data.delete(key);
                        return null;
                    }
                    return entry.value;
                },
                set(key, value) {
                    if (this.data.size >= this.maxSize) {
                        const firstKey = this.data.keys().next().value;
                        this.data.delete(firstKey);
                    }
                    this.data.set(key, { value, timestamp: Date.now() });
                },
                invalidate(key) {
                    if (key) {
                        this.data.delete(key);
                    } else {
                        this.data.clear();
                    }
                },
                has(key) {
                    const entry = this.data.get(key);
                    if (!entry) return false;
                    if (Date.now() - entry.timestamp > this.ttl) {
                        this.data.delete(key);
                        return false;
                    }
                    return true;
                }
            };
            this.stores.set(name, store);
            return store;
        },

        get(name) {
            return this.stores.get(name);
        }
    };

    const Utils = {
        debounce,
        throttle,
        nextMicrotask,
        nextFrame,
        nextMacrotask,
        delay,
        Logger,
        withRetry,
        withTimeout,
        safeFetch,
        validateData,
        ensureArray,
        ensureNumber,
        ensureString,
        Cache
    };

    if (typeof window !== 'undefined') {
        window.Utils = Utils;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Utils;
    }

    if (typeof exports !== 'undefined') {
        Object.assign(exports, Utils);
    }
})();
