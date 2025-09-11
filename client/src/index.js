import './styles.css';
import { ApiClient } from './js/api.js';
import { Dashboard } from './js/dashboard.js';
import { ProductManager } from './js/products.js';
import { StockManager } from './js/stock.js';
import { SalesManager } from './js/sales.js';
import { AnalyticsManager } from './js/analytics.js';
import { NotificationManager } from './js/notifications.js';

class InventoryApp {
    constructor() {
        this.api = new ApiClient();
        this.dashboard = new Dashboard(this.api);
        this.productManager = new ProductManager(this.api);
        this.stockManager = new StockManager(this.api);
        this.salesManager = new SalesManager(this.api);
        this.analyticsManager = new AnalyticsManager(this.api);
        this.notifications = new NotificationManager();
        
        this.currentPage = 'dashboard';
        this.init();
    }

    async init() {
        try {
            // Show loading
            this.showLoading();

            // Small delay to show loading screen
            setTimeout(() => {
                this.showWelcome();
            }, 1000);
        } catch (error) {
            console.error('App initialization error:', error);
            this.showWelcome();
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'none';
    }

    showWelcome() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        
        this.setupWelcomeScreen();
    }

    async showMainApp() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        await this.setupMainApp();
    }

    setupWelcomeScreen() {
        const enterBtn = document.getElementById('enterSystemBtn');
        enterBtn.addEventListener('click', async () => {
            enterBtn.disabled = true;
            enterBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            setTimeout(async () => {
                await this.showMainApp();
                this.notifications.show('Welcome to Inventory Manager!', 'success');
            }, 500);
        });
    }

    async setupMainApp() {
        // Setup navigation
        this.setupNavigation();

        // Setup refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshCurrentPage();
        });

        // Initialize all managers
        await this.dashboard.init();
        await this.productManager.init();
        await this.stockManager.init();
        await this.salesManager.init();
        await this.analyticsManager.init();

        // Load initial page
        this.showPage('dashboard');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
            });
        });
    }

    showPage(pageName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // Show page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`${pageName}Page`).classList.add('active');

        // Load page data
        this.loadPageData(pageName);
        this.currentPage = pageName;
    }

    async loadPageData(pageName) {
        try {
            switch (pageName) {
                case 'dashboard':
                    await this.dashboard.loadData();
                    break;
                case 'products':
                    await this.productManager.loadProducts();
                    break;
                case 'stock':
                    await this.stockManager.loadStockData();
                    break;
                case 'sales':
                    await this.salesManager.loadSalesData();
                    break;
                case 'analytics':
                    await this.analyticsManager.loadAnalyticsData();
                    break;
                case 'suppliers':
                case 'reports':
                case 'orders':
                case 'categories':
                    // These pages are static for now
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${pageName} data:`, error);
            this.notifications.show(`Failed to load ${pageName} data`, 'error');
        }
    }

    refreshCurrentPage() {
        this.loadPageData(this.currentPage);
        this.notifications.show('Page refreshed', 'info');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InventoryApp();
});