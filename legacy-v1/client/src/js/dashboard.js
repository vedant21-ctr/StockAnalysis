import Chart from 'chart.js/auto';

export class Dashboard {
    constructor(apiClient) {
        this.api = apiClient;
        this.salesChart = null;
        this.refreshBtn = document.getElementById('refreshDashboard');
    }

    async init() {
        // Setup refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.loadData();
        });

        // Load initial data
        await this.loadData();
    }

    async loadData() {
        try {
            this.showLoading();

            // Load dashboard data
            const [dashboardData, salesTrends, lowStockProducts] = await Promise.all([
                this.api.getDashboardData(),
                this.api.getSalesTrends(30),
                this.api.getLowStockProducts()
            ]);

            // Update stats cards
            this.updateStatsCards(dashboardData.overview);

            // Update charts
            this.updateSalesChart(salesTrends.trends);

            // Update lists
            this.updateTopProductsList(dashboardData.topSellingProducts);
            this.updateLowStockList(lowStockProducts);
            this.updateRecentSalesList();

            this.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.hideLoading();
            throw error;
        }
    }

    updateStatsCards(overview) {
        document.getElementById('totalProducts').textContent = overview.total_products || 0;
        document.getElementById('lowStockProducts').textContent = overview.low_stock_products || 0;
        document.getElementById('outOfStockProducts').textContent = overview.out_of_stock_products || 0;
        
        const inventoryValue = overview.total_inventory_value || 0;
        document.getElementById('totalInventoryValue').textContent = 
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inventoryValue);
    }

    updateSalesChart(trendsData) {
        const ctx = document.getElementById('salesChart').getContext('2d');

        // Destroy existing chart
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        // Prepare data
        const labels = trendsData.map(item => {
            const date = new Date(item.period);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const revenueData = trendsData.map(item => parseFloat(item.revenue) || 0);
        const transactionData = trendsData.map(item => parseInt(item.transactions) || 0);

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue ($)',
                        data: revenueData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Transactions',
                        data: transactionData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Transactions'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.label === 'Revenue ($)') {
                                    label += '$' + context.parsed.y.toLocaleString();
                                } else {
                                    label += context.parsed.y.toLocaleString();
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    updateTopProductsList(products) {
        const container = document.getElementById('topProductsList');
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="text-muted">No sales data available</p>';
            return;
        }

        const html = products.map(product => `
            <div class="list-item">
                <div class="item-info">
                    <strong>${product.name}</strong>
                    <small class="text-muted">${product.sku}</small>
                </div>
                <div class="item-stats">
                    <span class="stat-value">${product.total_sold} sold</span>
                    <span class="stat-revenue">$${parseFloat(product.total_revenue || 0).toLocaleString()}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateLowStockList(products) {
        const container = document.getElementById('lowStockList');
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="text-success">All products are well stocked!</p>';
            return;
        }

        const html = products.slice(0, 5).map(product => `
            <div class="list-item alert-item">
                <div class="item-info">
                    <strong>${product.name}</strong>
                    <small class="text-muted">${product.sku}</small>
                </div>
                <div class="item-stats">
                    <span class="stock-level ${product.stock_quantity === 0 ? 'out-of-stock' : 'low-stock'}">
                        ${product.stock_quantity} / ${product.reorder_threshold}
                    </span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async updateRecentSalesList() {
        try {
            const salesData = await this.api.getSales({ limit: 5, page: 1 });
            const container = document.getElementById('recentSalesList');
            
            if (!salesData.sales || salesData.sales.length === 0) {
                container.innerHTML = '<p class="text-muted">No recent sales</p>';
                return;
            }

            const html = salesData.sales.map(sale => `
                <div class="list-item">
                    <div class="item-info">
                        <strong>${sale.product_name}</strong>
                        <small class="text-muted">${sale.customer_name || 'Walk-in Customer'}</small>
                    </div>
                    <div class="item-stats">
                        <span class="stat-value">${sale.quantity_sold} × $${parseFloat(sale.unit_price).toFixed(2)}</span>
                        <span class="stat-revenue">$${parseFloat(sale.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            `).join('');

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading recent sales:', error);
            document.getElementById('recentSalesList').innerHTML = 
                '<p class="text-muted">Error loading recent sales</p>';
        }
    }

    showLoading() {
        this.refreshBtn.disabled = true;
        this.refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }

    hideLoading() {
        this.refreshBtn.disabled = false;
        this.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    }
}