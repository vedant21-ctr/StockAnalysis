import Chart from 'chart.js/auto';

export class SalesManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.salesChart = null;
        this.products = [];
        this.sales = [];
    }

    async init() {
        this.setupEventListeners();
        await this.loadSalesData();
    }

    setupEventListeners() {
        // New sale button
        document.getElementById('newSaleBtn').addEventListener('click', () => {
            this.showSaleModal();
        });

        // Sales report button
        document.getElementById('salesReportBtn').addEventListener('click', () => {
            this.generateSalesReport();
        });

        // Chart period selector
        document.getElementById('salesChartPeriod').addEventListener('change', (e) => {
            this.updateSalesChart(e.target.value);
        });

        // Sale form
        document.getElementById('saleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaleSubmit();
        });

        // Product selection change
        document.getElementById('saleProduct').addEventListener('change', (e) => {
            this.updateSalePrice(e.target.value);
        });

        // Quantity change
        document.getElementById('saleQuantity').addEventListener('input', () => {
            this.updateSaleTotal();
        });

        // Modal close events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById('saleModal');
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideSaleModal();
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            this.hideSaleModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideSaleModal();
            }
        });
    }

    async loadSalesData() {
        try {
            // Load products for sale form
            const productsData = await this.api.getProducts({ limit: 100 });
            this.products = productsData.products || [];

            // Load sales data
            const salesData = await this.api.getSales({ limit: 50 });
            this.sales = salesData.sales || [];

            this.updateSalesStats();
            this.populateProductSelect();
            this.renderRecentSales();
            this.updateSalesChart(30);
        } catch (error) {
            console.error('Error loading sales data:', error);
        }
    }

    updateSalesStats() {
        // Mock data for demo
        const today = new Date();
        const todayRevenue = 2450.75;
        const todayTransactions = 8;
        const weekRevenue = 12340.50;
        const monthRevenue = 45670.25;
        const bestSeller = 'iPhone 14 Pro';
        const bestSellerCount = 25;

        document.getElementById('todayRevenue').textContent = `$${todayRevenue.toLocaleString()}`;
        document.getElementById('todayTransactions').textContent = `${todayTransactions} transactions`;
        document.getElementById('weekRevenue').textContent = `$${weekRevenue.toLocaleString()}`;
        document.getElementById('weekGrowth').textContent = '+15% from last week';
        document.getElementById('monthRevenue').textContent = `$${monthRevenue.toLocaleString()}`;
        document.getElementById('monthGrowth').textContent = '+8% from last month';
        document.getElementById('bestSellingProduct').textContent = bestSeller;
        document.getElementById('bestSellerCount').textContent = `${bestSellerCount} units sold`;
    }

    populateProductSelect() {
        const select = document.getElementById('saleProduct');
        select.innerHTML = '<option value="">Select Product</option>';
        
        // Only show products with stock
        const availableProducts = this.products.filter(p => p.stock_quantity > 0);
        
        availableProducts.forEach(product => {
            const option = new Option(
                `${product.name} (Stock: ${product.stock_quantity})`, 
                product.id
            );
            option.dataset.price = product.price;
            option.dataset.stock = product.stock_quantity;
            select.appendChild(option);
        });
    }

    renderRecentSales() {
        const tbody = document.getElementById('recentSalesTable');
        
        if (this.sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent sales</td></tr>';
            return;
        }

        const html = this.sales.slice(0, 10).map(sale => `
            <tr>
                <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                <td>${sale.product_name}</td>
                <td>${sale.customer_name || 'Walk-in Customer'}</td>
                <td>${sale.quantity_sold}</td>
                <td>$${parseFloat(sale.total_amount).toFixed(2)}</td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    async updateSalesChart(days) {
        try {
            const trendsData = await this.api.getSalesTrends(days);
            const ctx = document.getElementById('salesPerformanceChart').getContext('2d');

            if (this.salesChart) {
                this.salesChart.destroy();
            }

            const labels = trendsData.trends.map(item => {
                const date = new Date(item.period);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });

            const revenueData = trendsData.trends.map(item => parseFloat(item.revenue) || 0);
            const transactionData = trendsData.trends.map(item => parseInt(item.transactions) || 0);

            this.salesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Revenue ($)',
                            data: revenueData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Transactions',
                            data: transactionData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Revenue ($)'
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
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating sales chart:', error);
        }
    }

    showSaleModal() {
        const modal = document.getElementById('saleModal');
        document.getElementById('saleForm').reset();
        this.updateSaleTotal();
        modal.classList.add('show');
        modal.style.display = 'flex';
    }

    hideSaleModal() {
        const modal = document.getElementById('saleModal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    updateSalePrice(productId) {
        const priceField = document.getElementById('salePrice');
        const quantityField = document.getElementById('saleQuantity');
        
        if (productId) {
            const product = this.products.find(p => p.id == productId);
            if (product) {
                priceField.value = product.price;
                quantityField.max = product.stock_quantity;
                quantityField.placeholder = `Max: ${product.stock_quantity}`;
            }
        } else {
            priceField.value = '';
            quantityField.max = '';
            quantityField.placeholder = 'Quantity';
        }
        
        this.updateSaleTotal();
    }

    updateSaleTotal() {
        const quantity = parseFloat(document.getElementById('saleQuantity').value) || 0;
        const price = parseFloat(document.getElementById('salePrice').value) || 0;
        const total = quantity * price;

        document.getElementById('saleSubtotal').textContent = `$${total.toFixed(2)}`;
        document.getElementById('saleTotal').textContent = `$${total.toFixed(2)}`;
    }

    async handleSaleSubmit() {
        try {
            const form = document.getElementById('saleForm');
            const formData = new FormData(form);
            
            const saleData = {
                product_id: parseInt(formData.get('product_id')),
                quantity_sold: parseInt(formData.get('quantity')),
                customer_name: formData.get('customer_name') || 'Walk-in Customer',
                notes: formData.get('notes')
            };

            if (!saleData.product_id || !saleData.quantity_sold) {
                this.showError('Please select a product and enter quantity');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Recording...';

            await this.api.recordSale(saleData);
            
            this.showSuccess('Sale recorded successfully');
            this.hideSaleModal();
            await this.loadSalesData();
        } catch (error) {
            console.error('Error recording sale:', error);
            this.showError('Failed to record sale');
        } finally {
            const submitBtn = document.getElementById('saleForm').querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Record Sale';
        }
    }

    generateSalesReport() {
        const csvContent = this.generateSalesCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateSalesCSV() {
        const headers = ['Date', 'Product', 'Customer', 'Quantity', 'Unit Price', 'Total'];
        const rows = this.sales.map(sale => [
            new Date(sale.sale_date).toLocaleDateString(),
            sale.product_name,
            sale.customer_name || 'Walk-in Customer',
            sale.quantity_sold,
            sale.unit_price,
            sale.total_amount
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    showSuccess(message) {
        if (window.app && window.app.notifications) {
            window.app.notifications.success(message);
        }
    }

    showError(message) {
        if (window.app && window.app.notifications) {
            window.app.notifications.error(message);
        }
    }
}