# 📈 Professional Stock Price Calculator

A comprehensive, modern web application for stock analysis featuring real-time price tracking, financial metrics, earnings calendar, and interactive projections.

![Stock Calculator Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time Stock Data** - Current prices with daily change indicators
- **Interactive Price Projections** - Calculate target prices with percentage changes
- **Price Alerts & Notifications** - Browser-based alert system
- **Auto-refresh Capability** - Periodic data updates during market hours

### 📊 **Advanced Analytics**
- **30-Day Price History Charts** - Interactive Chart.js visualizations
- **Comprehensive Financial Metrics**:
  - Day's Trading Range (High/Low)
  - 52-Week High/Low ranges
  - Market Capitalization
  - P/E Ratios
  - 1-Year Price Targets with upside calculations
  - Trading Volume with smart formatting
- **Earnings Calendar** - Upcoming earnings dates with countdown timers

### 🎨 **Modern Design**
- **Professional Dark Mode** - Optimized for extended use
- **Glassmorphism UI** - Modern frosted glass effects
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Color-coded Data** - Intuitive green/red indicators for gains/losses

### 🚀 **User Experience**
- **Recent Searches Dropdown** - Quick access to previously searched stocks
- **Market Hours Awareness** - Different behavior during trading vs after-hours
- **Hybrid Data System** - Static fallback + live API integration
- **Professional Typography** - Clean Inter font throughout

## 🛠️ **Technology Stack**

- **Frontend**: HTML5, CSS3 (CSS Variables), Vanilla JavaScript ES6+
- **Charts**: Chart.js for interactive price visualizations
- **APIs**: Yahoo Finance (with CORS proxy fallbacks)
- **Storage**: localStorage for preferences and recent searches
- **Architecture**: Class-based JavaScript with modular design

## 🎮 **Supported Stocks**

### **Major Tech Giants**
- **AAPL** - Apple Inc. (Market Cap: 3.6T, P/E: 28.5)
- **GOOGL** - Alphabet Inc. (Market Cap: 2.1T, P/E: 23.8)
- **MSFT** - Microsoft Corporation (Market Cap: 3.1T, P/E: 31.2)
- **TSLA** - Tesla Inc. (Market Cap: 1.3T, P/E: 65.4)
- **AMZN** - Amazon.com Inc. (Market Cap: 1.7T)
- **NVDA** - NVIDIA Corporation (Hot AI stock)
- **META** - Meta Platforms Inc. (Social media giant)
- **NFLX** - Netflix Inc. (Streaming leader)

### **Financial & Healthcare**
- **JPM** - JPMorgan Chase & Co.
- **V** - Visa Inc.
- **JNJ** - Johnson & Johnson
- **UNH** - UnitedHealth Group Inc.

*Plus 30+ additional stocks including crypto, energy, and consumer sectors*

## 🚀 **Quick Start**

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/yourusername/stock-price-calculator.git

# Navigate to project directory
cd stock-price-calculator

# Start local server (choose one):
npx http-server -p 8000
# OR
python -m http.server 8000

# Open in browser
http://localhost:8000
```

### **Usage**
1. **Enter a stock ticker** (e.g., AAPL, TSLA, GOOGL)
2. **View comprehensive data** including price, metrics, and charts
3. **Set price projections** using the interactive calculator
4. **Create price alerts** for target levels
5. **Access recent searches** via the dropdown menu
6. **Toggle dark mode** for comfortable viewing

## 📱 **Key Features Demo**

### **Professional Financial Dashboard**
- **Light Mode**: Clean glassmorphism cards with professional styling
- **Dark Mode**: Optimized for extended trading sessions
- **Responsive**: Perfect experience on all devices

### **Comprehensive Stock Analysis**
| Metric | Description | Example |
|--------|-------------|---------|
| **Current Price** | Real-time/latest price | $234.07 |
| **Daily Change** | Today's price movement | +$2.15 (+0.93%) |
| **Day's Range** | Intraday high/low | $232.45 - $236.80 |
| **52W High/Low** | Annual trading range | $260.10 / $169.21 |
| **Volume** | Trading volume | 58.5M |
| **Market Cap** | Total market value | 3.6T |
| **P/E Ratio** | Price-to-earnings | 28.5 |
| **1Y Target** | Analyst price target | $275.00 (+17.2%) |
| **Next Earnings** | Upcoming earnings date | Oct 30, 2025 (46 days) |

## 🌐 **Deployment Options**

### **GitHub Pages** (Recommended)
1. Create a new repository on GitHub
2. Upload your files to the main branch
3. Enable GitHub Pages in repository settings
4. Your app will be live at: `https://yourusername.github.io/repository-name`

### **Netlify** (Automatic Deployment)
1. Connect your GitHub repository to Netlify
2. Auto-deploy on every commit
3. Custom domain support available

### **Vercel** (Zero Config)
1. Import GitHub repository to Vercel
2. Zero-configuration deployment
3. Edge network optimization

## 🔧 **Configuration**

### **Customization Options**
- **Color Themes**: Modify CSS variables for custom branding
- **Stock Database**: Add new tickers in `app.js` stockDatabase
- **Refresh Intervals**: Adjust data update frequency
- **Alert Settings**: Customize notification preferences

### **Environment Setup**
The app works out-of-the-box with:
- Static data fallbacks for reliable operation
- Automatic API integration with Yahoo Finance
- Market hours detection (Eastern Time)
- Recent searches persistence

## 📊 **Performance Features**

- **Efficient Loading**: Lazy loading for charts and components
- **Smart Caching**: localStorage for user preferences
- **Optimized Updates**: Market hours-aware refresh cycles
- **Minimal Dependencies**: Lightweight with only Chart.js dependency

## 🔒 **Privacy & Security**

- **Client-Side Only**: No server-side data collection
- **Local Storage**: All user data stays in browser
- **CORS-Safe**: Proper API handling with secure fallbacks
- **No Tracking**: Zero analytics or user tracking

## 🤝 **Getting Started with GitHub**

### **1. Create GitHub Repository**
```bash
# Initialize git in your project folder
cd Stock-Percent-Calc
git init

# Add all files
git add .

# Make initial commit
git commit -m "🚀 Initial commit: Professional Stock Price Calculator"

# Add your GitHub repository as origin
git remote add origin https://github.com/yourusername/stock-price-calculator.git

# Push to GitHub
git push -u origin main
```

### **2. Repository Setup**
- **Repository Name**: `stock-price-calculator`
- **Description**: "Professional stock analysis dashboard with real-time data, charts, and financial metrics"
- **Visibility**: Public (for GitHub Pages)
- **Add README**: ✅ (this file)
- **Add .gitignore**: ✅ (Node.js template)
- **License**: MIT

### **3. Enable GitHub Pages**
1. Go to repository Settings
2. Scroll to "Pages" section
3. Source: "Deploy from a branch"
4. Branch: `main` / `(root)`
5. Click "Save"
6. Your app will be live in minutes!

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Chart.js** for beautiful, responsive charts
- **Yahoo Finance API** for real-time stock data
- **Inter Font** for professional typography
- **Modern CSS** glassmorphism design patterns

---

⭐ **Star this repository if you find it useful!**

*Built with ❤️ for traders and investors*