# 🚀 Git Repository Setup Script
# Run this in PowerShell from your project directory

Write-Host "🎯 Setting up Git repository for Professional Stock Calculator..." -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    git --version | Out-Null
    Write-Host "✅ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Initialize git repository
Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
git init

# Add all files
Write-Host "📋 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
git commit -m "🚀 Initial commit: Professional Stock Price Calculator"

Write-Host ""
Write-Host "✅ Git repository initialized successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a repository on GitHub.com" -ForegroundColor White
Write-Host "2. Copy your repository URL (e.g., https://github.com/username/stock-price-calculator.git)" -ForegroundColor White
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin YOUR_REPOSITORY_URL" -ForegroundColor Magenta
Write-Host "   git push -u origin main" -ForegroundColor Magenta
Write-Host ""
Write-Host "4. Enable GitHub Pages in your repository settings" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full deployment guide available in DEPLOYMENT.md" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue..."