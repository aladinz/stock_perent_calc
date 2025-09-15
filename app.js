/**
 * Stock Price Calculator Application
 * A comprehensive web app for tracking stock prices and setting alerts
 */

class StockPriceCalculator {
    constructor() {
        // Application state
        this.currentStock = null;
        this.currentPrice = 0;
        this.alerts = [];
        this.autoRefreshInterval = null;
        this.isAutoRefreshEnabled = false;
        this.refreshIntervalSeconds = 300; // Default: 5 minutes
        this.chart = null;
        
        // Market hours configuration
        this.marketConfig = {
            openHour: 9,
            openMinute: 30,
            closeHour: 16,
            closeMinute: 0,
            timezone: 'America/New_York'
        };
        
        // DOM elements
        this.elements = {
            form: document.getElementById('stock-form'),
            tickerInput: document.getElementById('ticker-input'),
            searchBtn: document.getElementById('search-btn'),
            loading: document.getElementById('loading'),
            errorMessage: document.getElementById('error-message'),
            errorText: document.getElementById('error-text'),
            stockDisplay: document.getElementById('stock-display'),
            stockSymbol: document.getElementById('stock-symbol'),
            currentPrice: document.getElementById('current-price'),
            lastUpdated: document.getElementById('last-updated'),
            alertsSection: document.getElementById('alerts-section'),
            refreshSection: document.getElementById('refresh-section'),
            notificationPrompt: document.getElementById('notification-prompt')
        };
        
        // Debug element existence
        console.log('Element initialization check:', {
            lastUpdated: !!this.elements.lastUpdated,
            lastUpdatedText: this.elements.lastUpdated?.textContent,
            dataStatus: !!document.getElementById('data-status')
        });
        
        // Recent searches functionality
        this.recentSearches = [];
        this.maxRecentSearches = 8;
        this.recentSearchesKey = 'stockCalc_recentSearches';
        
        // Initialize the application
        this.init();
        this.initDarkMode();
    }
    
    /**
     * Initialize the application with event listeners and setup
     */
    init() {
        this.setupEventListeners();
        this.checkNotificationPermission();
        
        // Initialize market status and set up periodic updates
        this.initMarketStatus();
        
        // Initialize hybrid data system  
        this.initHybridData();
        
        // Initialize recent searches
        this.initRecentSearches();
        
        console.log('Stock Price Calculator initialized');
    }
    
    /**
     * Set up all event listeners for the application
     */
    setupEventListeners() {
        // Stock form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.fetchStockPrice();
        });
        
        // Alert management
        const setAlertBtn = document.getElementById('set-alert-btn');
        if (setAlertBtn) {
            setAlertBtn.addEventListener('click', () => {
                console.log('Set Alert button clicked!');
                this.setAlert();
            });
            console.log('Alert button event listener set up successfully');
        } else {
            console.error('ERROR: set-alert-btn element not found!');
        }
        
        // Projection calculator - both manual and automatic calculation
        const percentageInput = document.getElementById('projection-percentage');
        const projectionType = document.getElementById('projection-type');
        const calculateBtn = document.getElementById('calculate-projection-btn');
        
        if (percentageInput && projectionType && calculateBtn) {
            // Manual calculate button
            calculateBtn.addEventListener('click', () => {
                console.log('Calculate button clicked');
                this.calculateProjection();
            });
            
            // Automatic updates - Input event (fires as user types)
            percentageInput.addEventListener('input', (e) => {
                console.log('Input event - Percentage changed:', e.target.value);
                this.calculateProjection();
            });
            
            // Automatic updates - Change event (fires when input loses focus)
            percentageInput.addEventListener('change', (e) => {
                console.log('Change event - Percentage changed:', e.target.value);
                this.calculateProjection();
            });
            
            // Automatic updates - Keyup event (fires on every key release)
            percentageInput.addEventListener('keyup', (e) => {
                console.log('Keyup event - Percentage changed:', e.target.value);
                this.calculateProjection();
            });
            
            // Auto-calculate when type changes
            projectionType.addEventListener('change', (e) => {
                console.log('Type changed:', e.target.value);
                this.calculateProjection();
            });
        } else {
            console.error('Projection elements not found:', { percentageInput, projectionType, calculateBtn });
        }
        
        // Auto-refresh controls
        const toggleRefreshBtn = document.getElementById('toggle-refresh-btn');
        const refreshInterval = document.getElementById('refresh-interval');
        
        if (toggleRefreshBtn) {
            toggleRefreshBtn.addEventListener('click', () => {
                console.log('Toggle auto-refresh button clicked!');
                this.toggleAutoRefresh();
            });
            console.log('Auto-refresh toggle button event listener set up successfully');
        } else {
            console.error('ERROR: toggle-refresh-btn element not found!');
        }
        
        if (refreshInterval) {
            refreshInterval.addEventListener('change', (e) => {
                console.log('Refresh interval changed to:', e.target.value);
                this.refreshIntervalSeconds = parseInt(e.target.value);
                if (this.isAutoRefreshEnabled) {
                    this.restartAutoRefresh();
                }
            });
            console.log('Refresh interval dropdown event listener set up successfully');
        } else {
            console.error('ERROR: refresh-interval element not found!');
        }
        
        // Notification permission
        document.getElementById('enable-notifications').addEventListener('click', () => {
            this.requestNotificationPermission();
        });
        
        document.getElementById('dismiss-notifications').addEventListener('click', () => {
            this.dismissNotificationPrompt();
        });
    }
    
    /**
     * Fetch stock price from multiple API sources with fallback
     * Using CORS-enabled APIs and proxies for reliable access
     */
    async fetchStockPrice() {
        const ticker = this.elements.tickerInput.value.trim().toUpperCase();
        
        if (!ticker) {
            this.showError('Please enter a stock ticker symbol');
            return;
        }
        
        console.log(`=== Starting fetchStockPrice for: ${ticker} ===`);
        this.showLoading(true);
        this.hideError();
        
        // Check if we have offline data available first (faster and more reliable)
        if (this.hasOfflineData(ticker) || this.isDemoTicker(ticker)) {
            console.log(`Using offline data for ${ticker}`);
            this.showDemoData(ticker);
            return;
        }
        
        // For unknown tickers, try a simple API call with quick timeout
        try {
            console.log(`Attempting to fetch real data for ${ticker}...`);
            
            // Use a simple, reliable API with short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`)}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                const price = await this.parseProxiedYahooData(data, ticker);
                
                if (price && price > 0) {
                    this.currentStock = ticker;
                    this.currentPrice = price;
                    
                    // Generate enhanced stock data for API-fetched price
                    const stockData = this.getEnhancedStockData(ticker);
                    stockData.currentPrice = price; // Use real price
                    this.currentStockData = stockData;
                    
                    this.displayStockData(ticker, stockData);
                    this.showSections();
                    this.checkAlerts();
                    this.showLoading(false); // Ensure loading is hidden for real data
                    
                    console.log(`Successfully fetched real data: $${price}`);
                    return;
                }
            }
            
            throw new Error('API returned invalid data');
            
        } catch (error) {
            console.log(`Real data fetch failed (${error.message}), using demo data for ${ticker}`);
            
            // Always fall back to demo data instead of showing errors
            this.showDemoData(ticker);
            return;
        }
    }
    
    /**
     * Check if ticker is a demo ticker
     */
    isDemoTicker(ticker) {
        const demoTickers = ['DEMO', 'TEST', 'SAMPLE'];
        return demoTickers.includes(ticker.toUpperCase());
    }
    
    /**
     * Check if we have offline demo data for this ticker
     */
    hasOfflineData(ticker) {
        const availableTickers = [
            // Popular tech stocks
            'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX',
            // Other major stocks
            'SPY', 'QQQ', 'BRK.B', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA',
            // Popular names people might try
            'DISNEY', 'DIS', 'COCA', 'KO', 'WALMART', 'WMT', 'NIKE', 'NKE',
            // Crypto-related
            'COIN', 'MSTR', 'SQ', 'PYPL',
            // Meme stocks
            'GME', 'AMC', 'BB', 'NOK'
        ];
        return availableTickers.includes(ticker.toUpperCase());
    }
    
    /**
     * Show demo data when APIs are unavailable
     */
    showDemoData(ticker) {
        console.log(`showDemoData called for ${ticker}`);
        
        // FIRST: Hide loading immediately
        this.showLoading(false);
        
        // Get enhanced stock data with all the new features
        const stockData = this.getEnhancedStockData(ticker);
        
        this.currentStock = ticker;
        this.currentPrice = stockData.currentPrice;
        
        // Store additional data for charts and display
        this.currentStockData = stockData;
        
        this.displayStockData(ticker, stockData);
        this.showSections();
        
        // Remove any existing demo notice
        const existingNotice = this.elements.stockDisplay.querySelector('.demo-notice');
        if (existingNotice) {
            existingNotice.remove();
        }
        
        // Show demo notice
        const demoNotice = document.createElement('div');
        demoNotice.className = 'demo-notice';
        demoNotice.style.cssText = `
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            color: #1565c0;
            padding: 15px;
            margin: 15px 0;
            border-radius: 12px;
            border-left: 4px solid #2196f3;
            text-align: center;
            font-size: 0.9em;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
        `;
        
        const isKnownTicker = stockData.isKnownTicker;
        const isDemo = this.isDemoTicker(ticker);
        
        demoNotice.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 1.2em;">📊</span>
                <strong>${isDemo ? 'Demo Mode' : (isKnownTicker ? 'Offline Mode' : 'Sample Data')}</strong>
            </div>
            <div style="margin-bottom: 8px;">
                ${isDemo ? 
                    'This is demonstration data showing how the app works.' : 
                    isKnownTicker ?
                        `Showing realistic sample data for ${ticker}. All features are fully functional!` :
                        `Generated sample data for "${ticker}". All features work normally.`
                }
            </div>
            <div style="font-size: 0.85em; opacity: 0.8;">
                ${isDemo ? 
                    'Try: AAPL, GOOGL, TSLA, MSFT for realistic stock prices.' :
                    'Set alerts, enable auto-refresh, and test notifications!'
                }
            </div>
        `;
        
        this.elements.stockDisplay.insertBefore(demoNotice, this.elements.stockDisplay.firstChild);
        
        // FINAL: Ensure loading is hidden and log completion
        this.showLoading(false);
        console.log(`Offline mode activated for ${ticker}: $${stockData.currentPrice.toFixed(2)} - Loading state should be hidden`);
    }
    
    /**
     * Get enhanced stock data with price history, daily change, and 52-week data
     */
    getEnhancedStockData(ticker) {
        // Comprehensive demo data with all enhancements (Updated Sept 14, 2025)
        const dataTimestamp = '2025-09-14T12:00:00Z';
        const stockDatabase = {
            // Demo tickers
            'DEMO': { base: 165.50, name: 'Demo Corporation', sector: 'Technology' },
            'TEST': { base: 89.25, name: 'Test Industries', sector: 'Financial' },
            'SAMPLE': { base: 234.75, name: 'Sample Corp', sector: 'Healthcare' },
            
            // Major tech stocks
            'AAPL': { 
                base: 234.07, 
                name: 'Apple Inc.', 
                sector: 'Technology', 
                weekHigh52: 260.10, 
                weekLow52: 169.21, 
                earningsDate: '2025-10-30',
                marketCap: '3.6T',
                peRatio: 28.5,
                targetPrice: 275.0,
                avgVolume: '58.5M'
            },
            'GOOGL': { 
                base: 240.80, 
                name: 'Alphabet Inc.', 
                sector: 'Technology', 
                weekHigh52: 242.25, 
                weekLow52: 140.53, 
                earningsDate: '2025-10-23',
                marketCap: '2.1T',
                peRatio: 23.8,
                targetPrice: 280.0,
                avgVolume: '34.2M'
            },
            'MSFT': { 
                base: 509.90, 
                name: 'Microsoft Corporation', 
                sector: 'Technology', 
                weekHigh52: 555.45, 
                weekLow52: 344.79, 
                earningsDate: '2025-10-29',
                marketCap: '3.1T',
                peRatio: 31.2,
                targetPrice: 580.0,
                avgVolume: '28.7M'
            },
            'TSLA': { 
                base: 395.94, 
                name: 'Tesla Inc.', 
                sector: 'Consumer Cyclical', 
                weekHigh52: 488.54, 
                weekLow52: 212.11, 
                earningsDate: '2025-10-22',
                marketCap: '1.3T',
                peRatio: 65.4,
                targetPrice: 420.0,
                avgVolume: '89.3M'
            },
            'AMZN': { base: 228.15, name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', weekHigh52: 242.52, weekLow52: 161.38, earningsDate: '2025-10-30' },
            'NVDA': { base: 177.82, name: 'NVIDIA Corporation', sector: 'Technology', weekHigh52: 184.48, weekLow52: 86.62, earningsDate: '2025-11-19' },
            'META': { base: 755.59, name: 'Meta Platforms Inc.', sector: 'Technology', weekHigh52: 755.59, weekLow52: 455.72, earningsDate: '2025-10-25' },
            'NFLX': { base: 1188.44, name: 'Netflix Inc.', sector: 'Communication Services', weekHigh52: 1188.44, weekLow52: 865.23, earningsDate: '2025-10-17' },
            
            // ETFs
            'SPY': { base: 435.20, name: 'SPDR S&P 500 ETF', sector: 'ETF' },
            'QQQ': { base: 365.80, name: 'Invesco QQQ ETF', sector: 'ETF' },
            
            // Financial
            'BRK.B': { base: 342.50, name: 'Berkshire Hathaway Inc.', sector: 'Financial' },
            'JPM': { base: 145.75, name: 'JPMorgan Chase & Co.', sector: 'Financial', earningsDate: '2025-10-11' },
            'V': { base: 245.30, name: 'Visa Inc.', sector: 'Financial', earningsDate: '2025-10-24' },
            'MA': { base: 415.60, name: 'Mastercard Inc.', sector: 'Financial' },
            
            // Healthcare & Consumer
            'JNJ': { base: 160.25, name: 'Johnson & Johnson', sector: 'Healthcare', earningsDate: '2025-10-16' },
            'PG': { base: 155.40, name: 'Procter & Gamble Co.', sector: 'Consumer Defensive' },
            'UNH': { base: 485.90, name: 'UnitedHealth Group Inc.', sector: 'Healthcare', earningsDate: '2025-10-17' },
            'HD': { base: 325.15, name: 'Home Depot Inc.', sector: 'Consumer Cyclical' },
            
            // Entertainment
            'DIS': { base: 95.50, name: 'Walt Disney Co.', sector: 'Communication Services' },
            'DISNEY': { base: 95.50, name: 'Walt Disney Co.', sector: 'Communication Services' },
            
            // Beverages
            'KO': { base: 58.75, name: 'Coca-Cola Co.', sector: 'Consumer Defensive' },
            'COCA': { base: 58.75, name: 'Coca-Cola Co.', sector: 'Consumer Defensive' },
            
            // Retail
            'WMT': { base: 155.80, name: 'Walmart Inc.', sector: 'Consumer Defensive' },
            'WALMART': { base: 155.80, name: 'Walmart Inc.', sector: 'Consumer Defensive' },
            
            // Apparel
            'NKE': { base: 105.25, name: 'Nike Inc.', sector: 'Consumer Cyclical' },
            'NIKE': { base: 105.25, name: 'Nike Inc.', sector: 'Consumer Cyclical' },
            
            // Fintech/Crypto
            'COIN': { base: 185.40, name: 'Coinbase Global Inc.', sector: 'Financial' },
            'SQ': { base: 65.25, name: 'Block Inc.', sector: 'Technology' },
            'PYPL': { base: 78.90, name: 'PayPal Holdings Inc.', sector: 'Financial' },
            'MSTR': { base: 1245.75, name: 'MicroStrategy Inc.', sector: 'Technology' },
            
            // Meme stocks
            'GME': { base: 18.50, name: 'GameStop Corp.', sector: 'Consumer Cyclical' },
            'AMC': { base: 5.25, name: 'AMC Entertainment Holdings', sector: 'Communication Services' },
            'BB': { base: 3.45, name: 'BlackBerry Ltd.', sector: 'Technology' },
            'NOK': { base: 4.15, name: 'Nokia Corporation', sector: 'Technology' },
            
            // Mining & Resources
            'CCJ': { base: 78.11, name: 'Cameco Corporation', sector: 'Energy' },
            'FCX': { base: 42.30, name: 'Freeport-McMoRan Inc.', sector: 'Basic Materials' },
            'NEM': { base: 38.75, name: 'Newmont Corporation', sector: 'Basic Materials' }
        };
        
        const tickerUpper = ticker.toUpperCase();
        const stockInfo = stockDatabase[tickerUpper];
        const isKnownTicker = !!stockInfo;
        
        console.log('Stock database lookup:', {
            ticker: tickerUpper,
            stockInfo: stockInfo,
            hasEarningsDate: stockInfo && stockInfo.earningsDate
        });
        
        // Generate base price with daily variation
        const basePrice = stockInfo ? stockInfo.base : (50 + (Math.random() * 200));
        const dailyChangePercent = (Math.random() - 0.5) * 0.08; // ±4% daily change
        const currentPrice = basePrice * (1 + dailyChangePercent);
        
        // Calculate 52-week high/low (use real data if available, otherwise generate)
        let weekHigh, weekLow;
        if (stockInfo && stockInfo.weekHigh52 && stockInfo.weekLow52) {
            // Use real 52W data
            weekHigh = stockInfo.weekHigh52;
            weekLow = stockInfo.weekLow52;
        } else {
            // Generate realistic ranges for unknown tickers
            const yearlyVariation = 0.6; // ±60% for 52-week range
            weekHigh = basePrice * (1 + (Math.random() * yearlyVariation * 0.7 + 0.1));
            weekLow = basePrice * (1 - (Math.random() * yearlyVariation * 0.7 + 0.1));
        }
        
        // Generate 30-day price history
        const priceHistory = this.generatePriceHistory(basePrice, 30);
        
        // Calculate earnings info
        const earningsDate = stockInfo && stockInfo.earningsDate ? stockInfo.earningsDate : this.generateFutureEarningsDate();
        const daysToEarnings = this.calculateDaysToEarnings(earningsDate);
        
        // Generate day's range
        const dayRange = this.generateDayRange(currentPrice);
        
        // Generate volume
        const baseVolume = stockInfo && stockInfo.avgVolume ? 
            parseFloat(stockInfo.avgVolume.replace('M', '')) * 1000000 : 
            Math.floor(Math.random() * 50000000) + 5000000;
        const todayVolume = baseVolume * (0.7 + Math.random() * 0.6); // ±30% from average
        
        const result = {
            ticker: tickerUpper,
            name: stockInfo ? stockInfo.name : `${ticker} Corporation`,
            sector: stockInfo ? stockInfo.sector : 'Unknown',
            currentPrice: currentPrice,
            dailyChange: currentPrice - basePrice,
            dailyChangePercent: dailyChangePercent * 100,
            weekHigh52: weekHigh,
            weekLow52: weekLow,
            priceHistory: priceHistory,
            isKnownTicker: isKnownTicker,
            dataTimestamp: dataTimestamp,
            isLiveData: this.lastApiUpdate && (Date.now() - this.lastApiUpdate) < this.updateFrequency,
            earningsDate: earningsDate,
            daysToEarnings: daysToEarnings,
            dayRangeLow: dayRange.low,
            dayRangeHigh: dayRange.high,
            volume: todayVolume,
            marketCap: stockInfo ? stockInfo.marketCap : 'N/A',
            peRatio: stockInfo ? stockInfo.peRatio : null,
            targetPrice: stockInfo ? stockInfo.targetPrice : null
        };
        
        console.log(`Generated stock data for ${tickerUpper}:`, {
            weekHigh52: weekHigh,
            weekLow52: weekLow,
            currentPrice: currentPrice
        });
        
        return result;
    }
    
    /**
     * Generate realistic price history for charts
     */
    generatePriceHistory(basePrice, days) {
        const history = [];
        let currentPrice = basePrice;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Add realistic daily volatility
            const dailyChange = (Math.random() - 0.5) * 0.06; // ±3% daily max
            currentPrice = currentPrice * (1 + dailyChange);
            
            history.push({
                date: date.toISOString().split('T')[0],
                price: currentPrice,
                volume: Math.floor(Math.random() * 50000000) + 5000000 // 5M-55M volume
            });
        }
        
        return history;
    }
    
    /**
     * Create price history chart using Chart.js
     */
    createPriceChart(priceHistory) {
        console.log('Creating price chart with history:', priceHistory);
        
        const chartElement = document.getElementById('price-chart');
        if (!chartElement) {
            console.error('Chart canvas element not found!');
            return;
        }
        
        const ctx = chartElement.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.priceChart) {
            this.priceChart.destroy();
        }
        
        const labels = priceHistory.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const prices = priceHistory.map(item => item.price);
        
        // Determine color based on overall trend
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const isUpTrend = lastPrice > firstPrice;
        
        // Get current theme for colors
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = currentTheme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#cbd5e1' : '#374151';
        
        try {
        this.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: isUpTrend ? '#10b981' : '#ef4444',
                    backgroundColor: isUpTrend ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointBackgroundColor: isUpTrend ? '#10b981' : '#ef4444',
                    pointBorderColor: isDark ? '#1e293b' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: isDark ? '#475569' : '#e5e7eb',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Price: ${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }).format(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date',
                            color: textColor,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            maxTicksLimit: 8,
                            color: textColor,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Price ($)',
                            color: textColor,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            },
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Price chart created successfully with theme support');
    } catch (error) {
        console.error('Error creating price chart:', error);
    }
    }
    
    /**
     * Initialize hybrid data system
     */
    initHybridData() {
        // Try to get cached API update time
        const cachedUpdate = localStorage.getItem('lastApiUpdate');
        if (cachedUpdate) {
            this.lastApiUpdate = parseInt(cachedUpdate);
        }
        
        // Start background API refresh if enabled
        if (this.isLiveDataEnabled) {
            this.startDataRefresh();
        }
        
        console.log('Hybrid data system initialized');
    }
    
    /**
     * Start background data refresh
     */
    startDataRefresh() {
        // Clear existing interval
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval);
        }
        
        // Start periodic refresh
        this.dataUpdateInterval = setInterval(() => {
            this.refreshStockData();
        }, this.updateFrequency);
        
        // Try immediate refresh
        setTimeout(() => this.refreshStockData(), 2000);
        
        console.log('Background data refresh started');
    }
    
    /**
     * Stop background data refresh
     */
    stopDataRefresh() {
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval);
            this.dataUpdateInterval = null;
        }
        console.log('Background data refresh stopped');
    }
    
    /**
     * Refresh stock data from API
     */
    async refreshStockData() {
        // Only refresh if we have a current stock
        if (!this.currentStock) return;
        
        try {
            console.log(`Attempting to refresh data for ${this.currentStock}...`);
            
            // Try to fetch fresh data (reuse existing API logic)
            const data = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${this.currentStock}`)}`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (data.ok) {
                const jsonData = await data.json();
                const price = await this.parseProxiedYahooData(jsonData, this.currentStock);
                
                if (price && price > 0) {
                    // Update with fresh API data
                    this.updateWithFreshData(price);
                    this.lastApiUpdate = Date.now();
                    localStorage.setItem('lastApiUpdate', this.lastApiUpdate.toString());
                    console.log(`✅ Fresh data updated: ${this.currentStock} = $${price}`);
                } else {
                    throw new Error('Invalid price data');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.log(`⚠️  API refresh failed: ${error.message} - using static data`);
            // Continue with static data - no action needed
        }
    }
    
    /**
     * Update display with fresh API data
     */
    updateWithFreshData(newPrice) {
        if (this.currentStockData) {
            // Calculate new daily change
            const basePrice = this.currentStockData.currentPrice - this.currentStockData.dailyChange;
            
            // Update current data
            this.currentStockData.currentPrice = newPrice;
            this.currentStockData.dailyChange = newPrice - basePrice;
            this.currentStockData.dailyChangePercent = ((newPrice - basePrice) / basePrice) * 100;
            this.currentStockData.isLiveData = true;
            
            // Update display
            this.displayStockData(this.currentStock, this.currentStockData);
            
            // Update stored price
            this.currentPrice = newPrice;
        }
    }
    
    /**
     * Get current Eastern Time
     */
    getEasternTime() {
        const now = new Date();
        return new Date(now.toLocaleString("en-US", {timeZone: this.marketConfig.timezone}));
    }
    
    /**
     * Check if current time is during market hours
     */
    isMarketOpen() {
        const et = this.getEasternTime();
        const day = et.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Weekend check
        if (day === 0 || day === 6) {
            return false;
        }
        
        // Time check
        const currentMinutes = et.getHours() * 60 + et.getMinutes();
        const openMinutes = this.marketConfig.openHour * 60 + this.marketConfig.openMinute;
        const closeMinutes = this.marketConfig.closeHour * 60 + this.marketConfig.closeMinute;
        
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
    
    /**
     * Get market status with details
     */
    getMarketStatus() {
        const et = this.getEasternTime();
        const day = et.getDay();
        const currentMinutes = et.getHours() * 60 + et.getMinutes();
        const openMinutes = this.marketConfig.openHour * 60 + this.marketConfig.openMinute;
        const closeMinutes = this.marketConfig.closeHour * 60 + this.marketConfig.closeMinute;
        
        // Weekend
        if (day === 0 || day === 6) {
            return {
                status: 'closed',
                description: 'Market Closed - Weekend',
                nextEvent: this.getNextMarketOpen(),
                color: '#ff6b6b'
            };
        }
        
        // Weekday market hours logic
        if (currentMinutes < openMinutes) {
            const preMarketStart = 4 * 60; // 4:00 AM ET
            if (currentMinutes >= preMarketStart) {
                return {
                    status: 'pre-market',
                    description: 'Pre-Market Trading',
                    nextEvent: `Market opens at ${this.formatTime(openMinutes)}`,
                    color: '#ffa726'
                };
            } else {
                return {
                    status: 'closed',
                    description: 'Market Closed',
                    nextEvent: `Pre-market starts at ${this.formatTime(preMarketStart)}`,
                    color: '#ff6b6b'
                };
            }
        } else if (currentMinutes < closeMinutes) {
            return {
                status: 'open',
                description: 'Market Open',
                nextEvent: `Market closes at ${this.formatTime(closeMinutes)}`,
                color: '#4caf50'
            };
        } else {
            const afterHoursEnd = 20 * 60; // 8:00 PM ET
            if (currentMinutes < afterHoursEnd) {
                return {
                    status: 'after-hours',
                    description: 'After-Hours Trading',
                    nextEvent: `After-hours ends at ${this.formatTime(afterHoursEnd)}`,
                    color: '#ff9800'
                };
            } else {
                return {
                    status: 'closed',
                    description: 'Market Closed',
                    nextEvent: this.getNextMarketOpen(),
                    color: '#ff6b6b'
                };
            }
        }
    }
    
    /**
     * Get next market open time
     */
    getNextMarketOpen() {
        const et = this.getEasternTime();
        const day = et.getDay();
        let daysToAdd = 1;
        
        // If it's Friday after hours or weekend, next open is Monday
        if (day === 5 && et.getHours() >= this.marketConfig.closeHour) {
            daysToAdd = 3; // Friday -> Monday
        } else if (day === 6) {
            daysToAdd = 2; // Saturday -> Monday
        } else if (day === 0) {
            daysToAdd = 1; // Sunday -> Monday
        }
        
        const nextOpen = new Date(et);
        nextOpen.setDate(nextOpen.getDate() + daysToAdd);
        nextOpen.setHours(this.marketConfig.openHour, this.marketConfig.openMinute, 0, 0);
        
        return `Next open: ${nextOpen.toLocaleDateString()} at ${this.formatTime(this.marketConfig.openHour * 60 + this.marketConfig.openMinute)}`;
    }
    
    /**
     * Format minutes to time string
     */
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${period} ET`;
    }
    
    /**
     * Update market status display
     */
    updateMarketStatus() {
        const status = this.getMarketStatus();
        const statusDot = document.getElementById('market-status-dot');
        const statusText = document.getElementById('market-status-text');
        const nextEvent = document.getElementById('market-next-event');
        
        if (statusDot && statusText && nextEvent) {
            // Update status dot color and animation
            statusDot.className = `status-dot ${status.status}`;
            statusDot.style.background = status.color;
            
            // Update text content
            statusText.textContent = status.description;
            nextEvent.textContent = status.nextEvent;
            
            console.log('Market status updated:', status);
        }
    }
    
    /**
     * Update data indicator to show data freshness
     */
    updateDataIndicator(isLiveData = false) {
        const dataStatus = document.getElementById('data-status');
        const lastUpdated = document.getElementById('last-updated');
        
        console.log('updateDataIndicator called:', { 
            isLiveData, 
            dataStatusExists: !!dataStatus, 
            lastUpdatedExists: !!lastUpdated,
            currentLastUpdatedValue: lastUpdated?.textContent 
        });
        
        if (dataStatus && lastUpdated) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            
            // Ensure the element is visible
            lastUpdated.style.display = '';
            lastUpdated.style.visibility = 'visible';
            
            if (isLiveData) {
                dataStatus.textContent = '🔴 Live Data';
                dataStatus.className = 'data-status live';
                lastUpdated.textContent = `Updated: ${timeString}`;
                console.log('Set live data lastUpdated to:', `Updated: ${timeString}`);
            } else {
                dataStatus.textContent = '📊 Static Data';
                dataStatus.className = 'data-status static';
                lastUpdated.textContent = `Demo data - ${timeString}`;
                console.log('Set demo data lastUpdated to:', `Demo data - ${timeString}`);
            }
            
            // Force a repaint
            lastUpdated.offsetHeight;
            
            console.log('Data indicator updated:', { 
                isLiveData, 
                time: timeString,
                finalText: lastUpdated.textContent,
                isVisible: lastUpdated.offsetParent !== null
            });
        } else {
            console.error('updateDataIndicator: Missing elements', { dataStatus: !!dataStatus, lastUpdated: !!lastUpdated });
        }
    }
    
    /**
     * Initialize market status with periodic updates
     */
    initMarketStatus() {
        console.log('=== Initializing Market Status ===');
        
        // Test market status detection immediately
        const testStatus = this.getMarketStatus();
        console.log('Current market status:', testStatus);
        console.log('Eastern Time:', this.getEasternTime());
        console.log('Is market open?', this.isMarketOpen());
        
        // Update immediately
        this.updateMarketStatus();
        
        // Update every minute to keep status current
        setInterval(() => {
            this.updateMarketStatus();
        }, 60000); // 1 minute
        
        console.log('Market status monitoring initialized');
    }
    
    /**
     * Initialize dark mode functionality
     */
    initDarkMode() {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Add event listener to dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
            console.log('Dark mode toggle initialized successfully');
        } else {
            console.error('Dark mode toggle button not found');
        }
    }
    
    /**
     * Toggle between light and dark modes
     */
    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        console.log(`Theme switched to: ${newTheme}`);
    }

    // Earnings date utility methods
    generateFutureEarningsDate() {
        const today = new Date();
        const randomDays = Math.floor(Math.random() * 90) + 14; // 14-104 days from now
        const futureDate = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
        return futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    calculateDaysToEarnings(earningsDate) {
        const today = new Date();
        const earningsDateTime = new Date(earningsDate);
        const diffTime = earningsDateTime.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    formatEarningsDisplay(earningsDate, daysToEarnings) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = new Date(earningsDate).toLocaleDateString('en-US', options);
        
        if (daysToEarnings < 0) {
            return `${formattedDate} (${Math.abs(daysToEarnings)} days ago)`;
        } else if (daysToEarnings === 0) {
            return `${formattedDate} (Today!)`;
        } else if (daysToEarnings === 1) {
            return `${formattedDate} (Tomorrow)`;
        } else if (daysToEarnings <= 7) {
            return `${formattedDate} (${daysToEarnings} days)`;
        } else {
            return `${formattedDate} (${daysToEarnings} days)`;
        }
    }

    // Generate realistic day's range
    generateDayRange(currentPrice) {
        const volatility = 0.03; // 3% daily volatility
        const lowMultiplier = 1 - (Math.random() * volatility);
        const highMultiplier = 1 + (Math.random() * volatility);
        
        const rangeLow = currentPrice * lowMultiplier;
        const rangeHigh = currentPrice * highMultiplier;
        
        return {
            low: Math.min(rangeLow, currentPrice),
            high: Math.max(rangeHigh, currentPrice)
        };
    }

    // Format volume numbers
    formatVolume(volume) {
        if (!volume || isNaN(volume)) return 'N/A';
        
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return volume.toString();
    }

    // Recent Searches Functionality
    initRecentSearches() {
        this.loadRecentSearches();
        this.setupRecentSearchesEvents();
    }

    loadRecentSearches() {
        try {
            const saved = localStorage.getItem(this.recentSearchesKey);
            this.recentSearches = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading recent searches:', error);
            this.recentSearches = [];
        }
    }

    saveRecentSearches() {
        try {
            localStorage.setItem(this.recentSearchesKey, JSON.stringify(this.recentSearches));
        } catch (error) {
            console.error('Error saving recent searches:', error);
        }
    }

    addRecentSearch(ticker, stockData) {
        const search = {
            ticker: ticker.toUpperCase(),
            name: stockData.name,
            timestamp: Date.now()
        };

        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(s => s.ticker !== search.ticker);
        
        // Add to beginning
        this.recentSearches.unshift(search);
        
        // Limit to max searches
        if (this.recentSearches.length > this.maxRecentSearches) {
            this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches);
        }

        this.saveRecentSearches();
    }

    setupRecentSearchesEvents() {
        const input = document.getElementById('ticker-input');
        const dropdown = document.getElementById('recent-searches-dropdown');
        const clearBtn = document.getElementById('clear-recent');

        // Show dropdown on input focus if there are recent searches
        input.addEventListener('focus', () => {
            if (this.recentSearches.length > 0) {
                this.showRecentSearches();
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-container')) {
                this.hideRecentSearches();
            }
        });

        // Clear recent searches
        clearBtn.addEventListener('click', () => {
            this.clearRecentSearches();
        });
    }

    showRecentSearches() {
        const dropdown = document.getElementById('recent-searches-dropdown');
        const list = document.getElementById('recent-searches-list');
        
        if (this.recentSearches.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }

        // Populate the list
        list.innerHTML = '';
        this.recentSearches.forEach(search => {
            const li = document.createElement('li');
            li.className = 'recent-search-item';
            li.innerHTML = `
                <div>
                    <span class="recent-search-ticker">${search.ticker}</span>
                    <span class="recent-search-name">${search.name}</span>
                </div>
                <span class="recent-search-time">${this.formatTimeAgo(search.timestamp)}</span>
            `;
            
            li.addEventListener('click', () => {
                document.getElementById('ticker-input').value = search.ticker;
                this.hideRecentSearches();
                this.handleSearch();
            });
            
            list.appendChild(li);
        });

        dropdown.classList.remove('hidden');
    }

    hideRecentSearches() {
        const dropdown = document.getElementById('recent-searches-dropdown');
        dropdown.classList.add('hidden');
    }

    clearRecentSearches() {
        this.recentSearches = [];
        this.saveRecentSearches();
        this.hideRecentSearches();
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
    
    /**
     * Set the theme and update UI accordingly
     */
    setTheme(theme) {
        const html = document.documentElement;
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const darkModeIcon = darkModeToggle?.querySelector('.dark-mode-icon');
        
        // Set theme attribute
        html.setAttribute('data-theme', theme);
        
        // Update toggle button icon
        if (darkModeIcon) {
            darkModeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Save preference
        localStorage.setItem('theme', theme);
        
        // Update chart colors if chart exists
        if (this.priceChart) {
            this.updateChartTheme(theme);
        }
        
        console.log(`Theme set to: ${theme}`);
    }
    
    /**
     * Update chart colors based on current theme
     */
    updateChartTheme(theme) {
        if (!this.priceChart) return;
        
        const isDark = theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#cbd5e1' : '#374151';
        
        // Update chart options
        this.priceChart.options.scales.x.grid.color = gridColor;
        this.priceChart.options.scales.y.grid.color = gridColor;
        this.priceChart.options.scales.x.ticks.color = textColor;
        this.priceChart.options.scales.y.ticks.color = textColor;
        this.priceChart.options.scales.x.title.color = textColor;
        this.priceChart.options.scales.y.title.color = textColor;
        
        // Update chart
        this.priceChart.update('none'); // No animation for theme changes
        
        console.log(`Chart theme updated to: ${theme}`);
    }
    
    /**
     * Parse Yahoo Finance API response
     */
    async parseYahooFinanceData(data, ticker) {
        if (data.chart && data.chart.error) {
            throw new Error(data.chart.error.description || 'Invalid ticker symbol');
        }
        
        if (!data.chart || !data.chart.result || !data.chart.result[0]) {
            throw new Error('Invalid response format from Yahoo Finance');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        return meta.regularMarketPrice || meta.previousClose || null;
    }
    
    /**
     * Parse Alpha Vantage API response
     */
    async parseAlphaVantageData(data, ticker) {
        if (data['Error Message']) {
            throw new Error('Invalid ticker symbol');
        }
        
        if (data['Note']) {
            throw new Error('API rate limit exceeded - please try again later');
        }
        
        const quote = data['Global Quote'];
        if (quote && quote['05. price']) {
            return parseFloat(quote['05. price']);
        }
        
        throw new Error('Unable to parse Alpha Vantage response');
    }
    
    /**
     * Parse FinnHub API response
     */
    async parseFinnHubData(data, ticker) {
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (data.c && data.c > 0) {
            return parseFloat(data.c); // 'c' is current price in FinnHub
        }
        
        throw new Error('Unable to parse FinnHub response');
    }
    
    /**
     * Parse Financial Modeling Prep API response
     */
    async parseFinancialModelingPrepData(data, ticker) {
        if (data['Error Message']) {
            throw new Error('Invalid ticker symbol');
        }
        
        if (Array.isArray(data) && data.length > 0) {
            const quote = data[0];
            if (quote.price && quote.price > 0) {
                return parseFloat(quote.price);
            }
        }
        
        throw new Error('Unable to parse Financial Modeling Prep response');
    }
    
    /**
     * Parse proxied Yahoo Finance data (from AllOrigins)
     */
    async parseProxiedYahooData(data, ticker) {
        if (!data.contents) {
            throw new Error('No data in proxy response');
        }
        
        const yahooData = JSON.parse(data.contents);
        return await this.parseYahooFinanceData(yahooData, ticker);
    }
    
    /**
     * Display stock data and initial projection
     */
    displayStockData(symbol, stockData) {
        console.log(`displayStockData called: ${symbol} = $${stockData.currentPrice || stockData}`);
        
        // Add to recent searches if it's valid stock data
        if (typeof stockData === 'object' && stockData.name) {
            this.addRecentSearch(symbol, stockData);
        }
        
        // Handle both old format (just price) and new format (full stock data)
        if (typeof stockData === 'number') {
            // Old format - just a price number
            this.elements.stockSymbol.textContent = symbol;
            this.elements.currentPrice.textContent = this.formatCurrency(stockData);
            
            // Hide enhanced elements if they exist
            const stockName = document.getElementById('stock-name');
            const stockSector = document.getElementById('stock-sector');
            if (stockName) stockName.style.display = 'none';
            if (stockSector) stockSector.style.display = 'none';
            
            // Store the current price for calculations
            this.currentPrice = stockData;
        } else {
            // New enhanced format - full stock data object
            console.log('Displaying enhanced stock data:', stockData);
            
            // Update basic info
            this.elements.stockSymbol.textContent = stockData.ticker;
            this.elements.currentPrice.textContent = this.formatCurrency(stockData.currentPrice);
            
            // Update enhanced info
            const stockNameEl = document.getElementById('stock-name');
            const stockSectorEl = document.getElementById('stock-sector');
            const dailyChangeValueEl = document.getElementById('daily-change-value');
            const dailyChangePercentEl = document.getElementById('daily-change-percent');
            const weekHighEl = document.getElementById('week-high');
            const weekLowEl = document.getElementById('week-low');
            
            if (stockNameEl) stockNameEl.textContent = stockData.name;
            if (stockSectorEl) stockSectorEl.textContent = stockData.sector;
            
            // Update daily change with color coding
            if (dailyChangeValueEl && dailyChangePercentEl) {
                const isPositive = stockData.dailyChange >= 0;
                const changeClass = isPositive ? 'positive' : 'negative';
                
                dailyChangeValueEl.textContent = `${isPositive ? '+' : ''}${this.formatCurrency(stockData.dailyChange)}`;
                dailyChangePercentEl.textContent = `(${isPositive ? '+' : ''}${stockData.dailyChangePercent.toFixed(2)}%)`;
                
                // Apply color classes
                dailyChangeValueEl.className = `change-value ${changeClass}`;
                dailyChangePercentEl.className = `change-percent ${changeClass}`;
            }
            
            // Update 52-week range with debugging
            console.log('52W data being displayed:', {
                weekHigh52: stockData.weekHigh52,
                weekLow52: stockData.weekLow52
            });
            
            if (weekHighEl && stockData.weekHigh52 !== undefined) {
                weekHighEl.textContent = this.formatCurrency(stockData.weekHigh52);
            } else {
                console.warn('52W High element not found or data undefined:', { 
                    element: !!weekHighEl, 
                    data: stockData.weekHigh52 
                });
            }
            
            if (weekLowEl && stockData.weekLow52 !== undefined) {
                weekLowEl.textContent = this.formatCurrency(stockData.weekLow52);
            } else {
                console.warn('52W Low element not found or data undefined:', { 
                    element: !!weekLowEl, 
                    data: stockData.weekLow52 
                });
            }
            
            // Update earnings date
            const earningsDateEl = document.getElementById('earnings-date');
            console.log('Earnings debugging:', {
                element: !!earningsDateEl,
                earningsDate: stockData.earningsDate,
                daysToEarnings: stockData.daysToEarnings,
                stockData: stockData
            });
            
            if (earningsDateEl && stockData.earningsDate) {
                const formattedEarnings = this.formatEarningsDisplay(stockData.earningsDate, stockData.daysToEarnings);
                console.log('Formatted earnings:', formattedEarnings);
                earningsDateEl.textContent = formattedEarnings;
                
                // Add urgency class for upcoming earnings
                if (stockData.daysToEarnings <= 7 && stockData.daysToEarnings >= 0) {
                    earningsDateEl.classList.add('upcoming');
                } else {
                    earningsDateEl.classList.remove('upcoming');
                }
            } else if (earningsDateEl) {
                console.log('Setting earnings to TBD - no earnings date found');
                earningsDateEl.textContent = 'TBD';
            }
            
            // Update additional financial metrics
            const dayRangeEl = document.getElementById('day-range');
            const volumeEl = document.getElementById('volume');
            const marketCapEl = document.getElementById('market-cap');
            const peRatioEl = document.getElementById('pe-ratio');
            const targetPriceEl = document.getElementById('target-price');
            
            console.log('Financial metrics debugging:', {
                dayRangeLow: stockData.dayRangeLow,
                dayRangeHigh: stockData.dayRangeHigh,
                volume: stockData.volume,
                marketCap: stockData.marketCap,
                peRatio: stockData.peRatio,
                targetPrice: stockData.targetPrice
            });
            
            if (dayRangeEl) {
                const rangeText = `${this.formatCurrency(stockData.dayRangeLow)} - ${this.formatCurrency(stockData.dayRangeHigh)}`;
                console.log('Setting day range:', rangeText);
                dayRangeEl.textContent = rangeText;
            }
            
            if (volumeEl) {
                const volumeText = this.formatVolume(Math.floor(stockData.volume));
                console.log('Setting volume:', volumeText);
                volumeEl.textContent = volumeText;
            }
            
            if (marketCapEl) {
                console.log('Setting market cap:', stockData.marketCap);
                marketCapEl.textContent = stockData.marketCap || 'N/A';
            }
            
            if (peRatioEl) {
                const peText = stockData.peRatio ? stockData.peRatio.toFixed(1) : 'N/A';
                console.log('Setting P/E ratio:', peText);
                peRatioEl.textContent = peText;
            }
            
            if (targetPriceEl) {
                if (stockData.targetPrice) {
                    const targetText = this.formatCurrency(stockData.targetPrice);
                    const upside = ((stockData.targetPrice - stockData.currentPrice) / stockData.currentPrice * 100);
                    const upsideText = upside >= 0 ? `+${upside.toFixed(1)}%` : `${upside.toFixed(1)}%`;
                    const fullTargetText = `${targetText} (${upsideText})`;
                    console.log('Setting target price:', fullTargetText);
                    targetPriceEl.textContent = fullTargetText;
                } else {
                    targetPriceEl.textContent = 'N/A';
                }
            }
            
            // Create price history chart
            if (stockData.priceHistory && stockData.priceHistory.length > 0) {
                setTimeout(() => {
                    this.createPriceChart(stockData.priceHistory);
                }, 100); // Small delay to ensure DOM is ready
            }
            
            // Store the current price for calculations
            this.currentPrice = stockData.currentPrice;
        }
        
        // Make stock display visible first
        this.elements.stockDisplay.classList.remove('hidden');
        console.log('Stock display updated and made visible');
        
        // Update data indicator after display is visible
        if (typeof stockData === 'number') {
            this.updateDataIndicator(false); // Old format - always demo
        } else {
            this.updateDataIndicator(stockData.isLiveData); // Enhanced format
        }
        
        // Fallback: Ensure last-updated text is visible (in case updateDataIndicator fails)
        setTimeout(() => {
            const lastUpdatedEl = document.getElementById('last-updated');
            if (lastUpdatedEl && (!lastUpdatedEl.textContent || lastUpdatedEl.textContent.trim() === '')) {
                console.warn('Last updated field is empty, applying fallback');
                lastUpdatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
                lastUpdatedEl.style.display = 'inline';
                lastUpdatedEl.style.visibility = 'visible';
            }
        }, 100);
        
        // Update market status
        this.updateMarketStatus();
        
        // Hide projection notice since we now have a stock price
        this.hideProjectionNotice();
        
        // Calculate initial projection (default 5% rise)
        this.calculateProjection();
    }
    
    /**
     * Calculate and display price projection based on user input
     */
    calculateProjection() {
        console.log('calculateProjection called, currentPrice:', this.currentPrice);
        
        // Check if projection section is visible (stock data loaded)
        const projectionSection = document.getElementById('projection-section');
        if (!projectionSection || projectionSection.classList.contains('hidden')) {
            console.log('Projection calculator not visible yet - no stock data');
            return;
        }
        
        if (!this.currentPrice || this.currentPrice <= 0) {
            document.getElementById('projection-result').classList.add('hidden');
            this.showProjectionNotice('Please enter a stock ticker first to calculate projections');
            return;
        }
        
        const projectionType = document.getElementById('projection-type').value;
        const percentageInput = document.getElementById('projection-percentage');
        const percentage = parseFloat(percentageInput.value);
        
        console.log('Projection inputs:', { projectionType, percentage, currentPrice: this.currentPrice });
        
        if (!percentage || percentage <= 0 || percentage > 100) {
            document.getElementById('projection-result').classList.add('hidden');
            this.showProjectionNotice('Please enter a valid percentage between 1 and 100');
            return;
        }
        
        // Hide notice when calculation is valid
        this.hideProjectionNotice();
        
        // Calculate projected price
        const multiplier = projectionType === 'drop' ? (1 - percentage / 100) : (1 + percentage / 100);
        const projectedPrice = this.currentPrice * multiplier;
        const difference = projectedPrice - this.currentPrice;
        
        console.log('Calculation result:', { projectedPrice, difference });
        
        // Update display
        const changeDisplay = document.getElementById('projection-change-display');
        const typeDisplay = document.getElementById('projection-type-display');
        const priceDisplay = document.getElementById('projected-price-display');
        const diffDisplay = document.getElementById('projected-difference-display');
        const projectionHeader = document.querySelector('.projection-header');
        
        if (!changeDisplay || !typeDisplay || !priceDisplay || !diffDisplay || !projectionHeader) {
            console.error('Missing projection display elements');
            return;
        }
        
        // Update values
        changeDisplay.textContent = `${projectionType === 'drop' ? '-' : '+'}${percentage}%`;
        typeDisplay.textContent = projectionType === 'drop' ? 'Price Drop' : 'Price Rise';
        priceDisplay.textContent = this.formatCurrency(projectedPrice);
        diffDisplay.textContent = `${difference >= 0 ? '+' : ''}${this.formatCurrency(difference)}`;
        
        // Update styling based on gain/loss
        projectionHeader.classList.remove('gain', 'loss');
        diffDisplay.classList.remove('positive', 'negative');
        
        if (projectionType === 'rise') {
            projectionHeader.classList.add('gain');
            diffDisplay.classList.add('positive');
        } else {
            projectionHeader.classList.add('loss');
            diffDisplay.classList.add('negative');
        }
        
        // Show result
        document.getElementById('projection-result').classList.remove('hidden');
        
        console.log(`Projection calculated: ${projectionType} ${percentage}% = ${this.formatCurrency(projectedPrice)} (${this.formatCurrency(difference)})`);
    }
    
    /**
     * Show projection notice message
     */
    showProjectionNotice(message) {
        const notice = document.getElementById('projection-calculator-notice');
        if (notice) {
            notice.innerHTML = `<p>🧮 ${message}</p>`;
            notice.style.display = 'block';
        }
    }
    
    /**
     * Hide projection notice
     */
    hideProjectionNotice() {
        const notice = document.getElementById('projection-calculator-notice');
        if (notice) {
            notice.style.display = 'none';
        }
    }
    
    /**
     * Show additional sections after successful stock fetch
     */
    showSections() {
        console.log('=== showSections() called ===');
        
        this.elements.alertsSection.classList.remove('hidden');
        this.elements.refreshSection.classList.remove('hidden');
        console.log('Alerts and refresh sections unhidden');
        
        // Show projection calculator after stock data is loaded
        const projectionSection = document.getElementById('projection-section');
        console.log('Projection section element:', projectionSection);
        
        if (projectionSection) {
            const wasHidden = projectionSection.classList.contains('hidden');
            console.log('Projection section was hidden:', wasHidden);
            
            projectionSection.classList.remove('hidden');
            
            const isHiddenNow = projectionSection.classList.contains('hidden');
            console.log('Projection section is hidden now:', isHiddenNow);
            console.log('Projection section classes:', projectionSection.className);
            console.log('Projection calculator should now be visible!');
        } else {
            console.error('ERROR: Could not find projection-section element!');
        }
    }
    
    /**
     * Set up a price alert
     */
    setAlert() {
        console.log('=== setAlert() called ===');
        
        const alertType = document.getElementById('alert-type').value;
        const percentage = parseFloat(document.getElementById('alert-percentage').value);
        
        console.log('Alert inputs:', { alertType, percentage, currentStock: this.currentStock, currentPrice: this.currentPrice });
        
        if (!percentage || percentage <= 0 || percentage > 50) {
            console.log('Invalid percentage:', percentage);
            this.showError('Please enter a valid percentage between 1 and 50');
            return;
        }
        
        if (!this.currentStock) {
            console.log('No current stock');
            this.showError('Please fetch a stock price first');
            return;
        }
        
        const alert = {
            id: Date.now(),
            symbol: this.currentStock,
            type: alertType,
            percentage: percentage,
            basePrice: this.currentPrice,
            targetPrice: alertType === 'drop' 
                ? this.currentPrice * (1 - percentage / 100)
                : this.currentPrice * (1 + percentage / 100),
            created: new Date()
        };
        
        this.alerts.push(alert);
        this.updateAlertsDisplay();
        this.clearAlertInputs();
        
        console.log('Alert set:', alert);
    }
    
    /**
     * Update the alerts display
     */
    updateAlertsDisplay() {
        const alertsList = document.getElementById('alerts-list');
        
        if (this.alerts.length === 0) {
            alertsList.innerHTML = '<p class="no-alerts">No active alerts</p>';
            return;
        }
        
        alertsList.innerHTML = this.alerts.map(alert => `
            <div class="alert-item">
                <span class="alert-text">
                    ${alert.symbol}: Alert me if price ${alert.type}s by ${alert.percentage}% 
                    (target: ${this.formatCurrency(alert.targetPrice)})
                </span>
                <button class="remove-alert" onclick="stockApp.removeAlert(${alert.id})">Remove</button>
            </div>
        `).join('');
    }
    
    /**
     * Remove an alert
     */
    removeAlert(alertId) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.updateAlertsDisplay();
    }
    
    /**
     * Clear alert input fields
     */
    clearAlertInputs() {
        document.getElementById('alert-percentage').value = '';
    }
    
    /**
     * Check if any alerts should be triggered
     */
    checkAlerts() {
        if (!this.currentPrice || this.alerts.length === 0) return;
        
        this.alerts.forEach(alert => {
            const shouldTrigger = (
                (alert.type === 'drop' && this.currentPrice <= alert.targetPrice) ||
                (alert.type === 'rise' && this.currentPrice >= alert.targetPrice)
            );
            
            if (shouldTrigger) {
                this.triggerAlert(alert);
            }
        });
    }
    
    /**
     * Trigger an alert notification
     */
    triggerAlert(alert) {
        const message = `${alert.symbol} has ${alert.type === 'drop' ? 'dropped' : 'risen'} by ${alert.percentage}%! Current price: ${this.formatCurrency(this.currentPrice)}`;
        
        this.showNotification('Price Alert!', message);
        
        // Remove the triggered alert
        this.removeAlert(alert.id);
        
        console.log('Alert triggered:', alert);
    }
    
    /**
     * Toggle auto-refresh functionality
     */
    toggleAutoRefresh() {
        console.log('=== toggleAutoRefresh() called ===');
        console.log('Current state - isAutoRefreshEnabled:', this.isAutoRefreshEnabled);
        console.log('Current stock:', this.currentStock);
        
        const toggleBtn = document.getElementById('toggle-refresh-btn');
        const statusElement = document.getElementById('refresh-status');
        
        console.log('Toggle button element:', toggleBtn);
        console.log('Status element:', statusElement);
        
        if (this.isAutoRefreshEnabled) {
            console.log('Stopping auto-refresh...');
            this.stopAutoRefresh();
            toggleBtn.textContent = 'Start Auto-Refresh';
            toggleBtn.classList.remove('active');
            statusElement.textContent = 'Auto-refresh: OFF';
        } else {
            console.log('Starting auto-refresh...');
            this.startAutoRefresh();
            toggleBtn.textContent = 'Stop Auto-Refresh';
            toggleBtn.classList.add('active');
            statusElement.textContent = `Auto-refresh: ON (every ${this.getRefreshIntervalText()})`;
        }
        
        console.log('New state - isAutoRefreshEnabled:', this.isAutoRefreshEnabled);
    }
    
    /**
     * Start auto-refresh with market-aware intervals
     */
    startAutoRefresh() {
        console.log('=== startAutoRefresh() called ===');
        console.log('Current stock:', this.currentStock);
        
        if (!this.currentStock) {
            console.log('No current stock - cannot start auto-refresh');
            this.showError('Please fetch a stock price first');
            return;
        }
        
        this.isAutoRefreshEnabled = true;
        
        // Get market-aware refresh interval
        const intervalSeconds = this.getMarketAwareInterval();
        console.log(`Market-aware refresh interval: ${intervalSeconds} seconds`);
        
        console.log('Auto-refresh enabled, setting up interval...');
        
        this.autoRefreshInterval = setInterval(() => {
            console.log('Auto-refresh interval triggered!');
            // Update market status on each refresh
            this.updateMarketStatus();
            
            // In demo mode, simulate price changes with market awareness
            if (this.isDemoMode()) {
                console.log('Demo mode - simulating market-aware price change');
                this.simulateMarketAwarePriceChange();
            } else {
                console.log('Real mode - fetching fresh data');
                this.fetchStockPrice();
            }
        }, intervalSeconds * 1000);
        
        console.log(`Auto-refresh started: every ${intervalSeconds} seconds`);
        console.log('Interval ID:', this.autoRefreshInterval);
    }
    
    /**
     * Get refresh interval based on market status
     */
    getMarketAwareInterval() {
        const status = this.getMarketStatus();
        
        switch (status.status) {
            case 'open':
                return Math.max(30, this.refreshIntervalSeconds); // Minimum 30 seconds during market hours
            case 'pre-market':
            case 'after-hours':
                return Math.max(120, this.refreshIntervalSeconds * 2); // Slower during extended hours
            case 'closed':
                const et = this.getEasternTime();
                const day = et.getDay();
                if (day === 0 || day === 6) {
                    return 600; // 10 minutes on weekends
                }
                return Math.max(300, this.refreshIntervalSeconds * 4); // Much slower when closed
            default:
                return this.refreshIntervalSeconds;
        }
    }
    
    /**
     * Check if currently in demo mode
     */
    isDemoMode() {
        return document.querySelector('.demo-notice') !== null;
    }
    
    /**
     * Simulate realistic price changes for demo mode with market awareness
     */
    simulateMarketAwarePriceChange() {
        if (!this.currentStock || !this.currentPrice) return;
        
        const marketStatus = this.getMarketStatus();
        let maxChangePercent;
        let changeFrequency;
        
        // Adjust volatility based on market status
        switch (marketStatus.status) {
            case 'open':
                maxChangePercent = 0.03; // ±3% during market hours
                changeFrequency = 0.8; // 80% chance of price change
                break;
            case 'pre-market':
            case 'after-hours':
                maxChangePercent = 0.015; // ±1.5% during extended hours
                changeFrequency = 0.4; // 40% chance of price change
                break;
            case 'closed':
                maxChangePercent = 0.005; // ±0.5% when market is closed
                changeFrequency = 0.1; // 10% chance of price change
                break;
            default:
                maxChangePercent = 0.01;
                changeFrequency = 0.3;
        }
        
        // Only change price based on frequency
        if (Math.random() > changeFrequency) {
            console.log(`No price change - market ${marketStatus.status}, low activity`);
            return;
        }
        
        // Simulate realistic price movement
        const changePercent = (Math.random() - 0.5) * maxChangePercent * 2;
        const newPrice = this.currentPrice * (1 + changePercent);
        
        // Update price
        this.currentPrice = newPrice;
        
        // Update the stored stock data with new price and recalculate daily change
        if (this.currentStockData) {
            const originalPrice = this.currentStockData.currentPrice - this.currentStockData.dailyChange;
            this.currentStockData.currentPrice = newPrice;
            this.currentStockData.dailyChange = newPrice - originalPrice;
            this.currentStockData.dailyChangePercent = ((newPrice - originalPrice) / originalPrice) * 100;
            
            // Display with full stock data to preserve 52W info
            this.displayStockData(this.currentStock, this.currentStockData);
        } else {
            // Fallback to price-only display if no stored data
            this.displayStockData(this.currentStock, newPrice);
        }
        
        // Check alerts with new price
        this.checkAlerts();
        
        console.log(`Market-aware price update for ${this.currentStock}: $${newPrice.toFixed(2)} (${changePercent > 0 ? '+' : ''}${(changePercent * 100).toFixed(2)}%) [${marketStatus.status}]`);
    }
    
    /**
     * Legacy price simulation (kept for compatibility)
     */
    simulatePriceChange() {
        this.simulateMarketAwarePriceChange();
    }
    
    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        this.isAutoRefreshEnabled = false;
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        console.log('Auto-refresh stopped');
    }
    
    /**
     * Restart auto-refresh with new interval
     */
    restartAutoRefresh() {
        this.stopAutoRefresh();
        this.startAutoRefresh();
        
        const statusElement = document.getElementById('refresh-status');
        statusElement.textContent = `Auto-refresh: ON (every ${this.getRefreshIntervalText()})`;
    }
    
    /**
     * Get refresh interval text for display
     */
    getRefreshIntervalText() {
        const minutes = this.refreshIntervalSeconds / 60;
        return minutes < 60 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : `${minutes / 60} hour${minutes !== 60 ? 's' : ''}`;
    }
    
    /**
     * Check and handle notification permissions
     */
    checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                this.elements.notificationPrompt.classList.remove('hidden');
            }
        }
    }
    
    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.dismissNotificationPrompt();
            
            if (permission === 'granted') {
                this.showNotification('Notifications Enabled', 'You will now receive price alerts!');
            }
        }
    }
    
    /**
     * Dismiss notification permission prompt
     */
    dismissNotificationPrompt() {
        this.elements.notificationPrompt.classList.add('hidden');
    }
    
    /**
     * Show desktop notification
     */
    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzRmYWNmZSIvPgo8cGF0aCBkPSJNMTYgOEMxMiA4IDggMTIgOCAxNlYyMEgxNkg4VjE2QzggMTIgMTIgOCAxNiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
                badge: 'https://via.placeholder.com/96x96/4facfe/ffffff?text=$'
            });
        } else {
            // Fallback: show alert if notifications not supported/allowed
            alert(`${title}: ${message}`);
        }
    }
    
    /**
     * Handle API errors with appropriate user feedback
     */
    handleApiError(error) {
        let errorMessage = 'An error occurred while fetching stock data.';
        
        if (error.message.includes('Invalid ticker') || error.message.includes('Invalid symbol')) {
            errorMessage = 'Invalid ticker symbol. Please check the symbol and try again.';
        } else if (error.message.includes('CORS') || error.message.includes('cors')) {
            errorMessage = 'Unable to access stock data due to browser security restrictions. Please try refreshing the page or using a different ticker.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Stock not found. Please verify the ticker symbol is correct.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('503') || error.message.includes('502') || error.message.includes('unavailable')) {
            errorMessage = 'Stock data service temporarily unavailable. Please try again in a few minutes.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('All data sources')) {
            errorMessage = 'All stock data sources are currently unavailable. This may be due to:\n• Network connectivity issues\n• API service maintenance\n• Browser security restrictions\n\nTry using demo tickers: AAPL, GOOGL, MSFT, TSLA, DEMO, or TEST to see how the app works offline.';
        }
        
        this.showError(errorMessage);
        
        // Add troubleshooting button for persistent errors
        this.addTroubleshootingInfo(error);
    }
    
    /**
     * Add troubleshooting information for persistent errors
     */
    addTroubleshootingInfo(error) {
        const errorContainer = this.elements.errorMessage;
        
        // Remove existing troubleshooting info
        const existingInfo = errorContainer.querySelector('.troubleshooting-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // Add troubleshooting info for CORS or persistent errors
        if (error.message.includes('CORS') || error.message.includes('All data sources')) {
            const troubleshootingDiv = document.createElement('div');
            troubleshootingDiv.className = 'troubleshooting-info';
            troubleshootingDiv.innerHTML = `
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; font-weight: bold;">Troubleshooting Tips</summary>
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 0.9em;">
                        <p><strong>If you're seeing this error repeatedly:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)</li>
                            <li>Check that the ticker symbol exists (try AAPL, GOOGL, or MSFT)</li>
                            <li>Ensure you have a stable internet connection</li>
                            <li>Try accessing the page later (services may be temporarily down)</li>
                        </ul>
                        <p><strong>For developers:</strong> Consider hosting on HTTPS or using a proper CORS proxy for production use.</p>
                    </div>
                </details>
            `;
            errorContainer.appendChild(troubleshootingDiv);
        }
    }
    
    /**
     * Show loading state
     */
    showLoading(show) {
        console.log(`showLoading called with: ${show}`);
        
        if (show) {
            this.elements.loading.classList.remove('hidden');
            this.elements.searchBtn.disabled = true;
            this.elements.searchBtn.textContent = 'Loading...';
            console.log('Loading state: SHOWN');
        } else {
            this.elements.loading.classList.add('hidden');
            this.elements.searchBtn.disabled = false;
            this.elements.searchBtn.textContent = 'Get Price';
            console.log('Loading state: HIDDEN');
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }
    
    /**
     * Format number as currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.stockApp = new StockPriceCalculator();
});

// Handle page visibility changes to pause/resume auto-refresh
document.addEventListener('visibilitychange', () => {
    if (window.stockApp) {
        if (document.hidden && window.stockApp.isAutoRefreshEnabled) {
            console.log('Page hidden - pausing auto-refresh');
            window.stockApp.stopAutoRefresh();
        } else if (!document.hidden && window.stockApp.currentStock) {
            console.log('Page visible - resuming auto-refresh if it was enabled');
            // Note: We don't automatically restart here to avoid unexpected behavior
        }
    }
});

// Handle network status changes
window.addEventListener('online', () => {
    console.log('Network connection restored');
    if (window.stockApp) {
        window.stockApp.hideError();
    }
});

window.addEventListener('offline', () => {
    console.log('Network connection lost');
    if (window.stockApp) {
        window.stockApp.showError('No internet connection. Please check your network and try again.');
        window.stockApp.stopAutoRefresh();
    }
});