import Chart from 'chart.js/auto';

export class AnalyticsManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.charts = {};
        this.products = [];
    }

    async init() {
        this.setupEventListeners();
        await this.loadAnalyticsData();
    }

    setupEventListeners() {
        // Timeframe selector
        document.getElementById('analyticsTimeframe').addEventListener('change', (e) => {
            this.updateAnalytics(e.target.value);
        });

        // Export button
        document.getElementById('exportAnalyticsBtn').addEventListener('click', () => {
            this.exportAnalytics();
        });
    }

    async loadAnalyticsData() {
        try {
            // Load products for analysis
            const productsData = await this.api.getProducts({ limit: 100 });
            this.products = productsData.products || [];

            this.updateMetrics();
            this.createABCAnalysisChart();
            this.createSalesForecastChart();
            this.updateProductMatrix();
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }

    updateMetrics() {
        // Calculate inventory turnover (mock calculation)
        const totalValue = this.products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price || 0), 0);
        const avgInventory = totalValue / 12; // Monthly average
        const cogs = totalValue * 4.2; // Cost of goods sold (mock)
        const turnover = avgInventory > 0 ? (cogs / avgInventory).toFixed(1) : '0.0';

        document.getElementById('inventoryTurnover').textContent = turnover;

        // Calculate profit margin
        const totalRevenue = this.products.reduce((sum, p) => sum + (p.stock_quantity * p.price || 0), 0);
        const totalCost = this.products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price || 0), 0);
        const margin = totalRevenue > 0 ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1) : '0.0';

        document.getElementById('profitMargin').textContent = margin;
    }

    createABCAnalysisChart() {
        const ctx = document.getElementById('abcAnalysisChart').getContext('2d');

        // Mock ABC analysis data
        const abcData = {
            A: 20, // 20% of products generate 80% of revenue
            B: 30, // 30% of products generate 15% of revenue
            C: 50  // 50% of products generate 5% of revenue
        };

        this.charts.abcChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['A Items (High Value)', 'B Items (Medium Value)', 'C Items (Low Value)'],
                datasets: [{
                    data: [abcData.A, abcData.B, abcData.C],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createSalesForecastChart() {
        const ctx = document.getElementById('salesForecastChart').getContext('2d');

        // Generate forecast data
        const forecastData = this.generateForecastData();

        this.charts.forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: forecastData.labels,
                datasets: [
                    {
                        label: 'Historical Sales',
                        data: forecastData.historical,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Forecast',
                        data: forecastData.forecast,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sales ($)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    generateForecastData() {
        const labels = [];
        const historical = [];
        const forecast = [];

        // Generate 12 months of historical data
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            
            // Mock historical data with trend
            const baseValue = 15000 + (11 - i) * 500;
            const randomVariation = (Math.random() - 0.5) * 3000;
            historical.push(Math.max(0, baseValue + randomVariation));
            forecast.push(null);
        }

        // Generate 6 months of forecast data
        for (let i = 1; i <= 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            
            // Mock forecast with growth trend
            const lastHistorical = historical[historical.length - 1];
            const forecastValue = lastHistorical * (1 + (i * 0.05)); // 5% growth per month
            
            historical.push(null);
            forecast.push(forecastValue);
        }

        return { labels, historical, forecast };
    }

    updateProductMatrix() {
        // Categorize products into BCG matrix
        const matrix = this.categorizeProducts();

        this.renderMatrixProducts('starProducts', matrix.stars);
        this.renderMatrixProducts('cashCowProducts', matrix.cashCows);
        this.renderMatrixProducts('questionMarkProducts', matrix.questionMarks);
        this.renderMatrixProducts('dogProducts', matrix.dogs);
    }

    categorizeProducts() {
        const matrix = {
            stars: [],
            cashCows: [],
            questionMarks: [],
            dogs: []
        };

        this.products.forEach(product => {
            const volume = product.stock_quantity || 0;
            const margin = product.price && product.cost_price ? 
                ((product.price - product.cost_price) / product.price) * 100 : 0;

            const highVolume = volume > 20;
            const highMargin = margin > 25;

            if (highVolume && highMargin) {
                matrix.stars.push(product);
            } else if (highVolume && !highMargin) {
                matrix.cashCows.push(product);
            } else if (!highVolume && highMargin) {
                matrix.questionMarks.push(product);
            } else {
                matrix.dogs.push(product);
            }
        });

        return matrix;
    }

    renderMatrixProducts(containerId, products) {
        const container = document.getElementById(containerId);
        
        if (products.length === 0) {
            container.innerHTML = '<p>No products in this category</p>';
            return;
        }

        const html = products.slice(0, 3).map(product => `
            <div class="matrix-product">
                <strong>${product.name}</strong>
                <small>${product.sku}</small>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async updateAnalytics(timeframe) {
        // Update analytics based on selected timeframe
        console.log(`Updating analytics for ${timeframe} days`);
        // This would reload data with the new timeframe
    }

    exportAnalytics() {
        // Generate analytics report
        const reportData = this.generateAnalyticsReport();
        const blob = new Blob([reportData], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateAnalyticsReport() {
        const turnover = document.getElementById('inventoryTurnover').textContent;
        const margin = document.getElementById('profitMargin').textContent;
        
        return `
INVENTORY ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

KEY METRICS:
- Inventory Turnover: ${turnover} times per year
- Profit Margin: ${margin}%

PRODUCT DISTRIBUTION:
- Total Products: ${this.products.length}
- High Performers (Stars): ${this.categorizeProducts().stars.length}
- Cash Cows: ${this.categorizeProducts().cashCows.length}
- Question Marks: ${this.categorizeProducts().questionMarks.length}
- Underperformers (Dogs): ${this.categorizeProducts().dogs.length}

RECOMMENDATIONS:
1. Focus marketing efforts on Star products
2. Optimize pricing for Question Mark products
3. Consider discontinuing Dog products
4. Maintain steady supply of Cash Cow products
        `.trim();
    }
}