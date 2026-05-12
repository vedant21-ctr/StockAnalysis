export class StockManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.products = [];
    }

    async init() {
        this.setupEventListeners();
        await this.loadStockData();
    }

    setupEventListeners() {
        // Quick stock form
        document.getElementById('quickStockForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuickStockUpdate();
        });

        // Bulk update button
        document.getElementById('bulkUpdateBtn').addEventListener('click', () => {
            this.showBulkUpdateModal();
        });

        // Stock report button
        document.getElementById('stockReportBtn').addEventListener('click', () => {
            this.exportStockReport();
        });
    }

    async loadStockData() {
        try {
            // Load products for stock management
            const productsData = await this.api.getProducts({ limit: 100 });
            this.products = productsData.products || [];

            this.updateStockOverview();
            this.populateProductSelects();
            this.renderStockTable();
        } catch (error) {
            console.error('Error loading stock data:', error);
        }
    }

    updateStockOverview() {
        const critical = this.products.filter(p => p.stock_quantity === 0).length;
        const low = this.products.filter(p => p.stock_status === 'Low Stock').length;
        const good = this.products.filter(p => p.stock_status === 'In Stock' && p.stock_quantity > p.reorder_threshold * 2).length;
        const overstock = this.products.filter(p => p.stock_quantity > p.max_stock_level * 0.8).length;

        document.getElementById('criticalStockCount').textContent = critical;
        document.getElementById('lowStockCount').textContent = low;
        document.getElementById('goodStockCount').textContent = good;
        document.getElementById('overstockCount').textContent = overstock;
    }

    populateProductSelects() {
        const select = document.getElementById('quickProductSelect');
        select.innerHTML = '<option value="">Select Product</option>';
        
        this.products.forEach(product => {
            const option = new Option(`${product.name} (${product.sku})`, product.id);
            select.appendChild(option);
        });
    }

    renderStockTable() {
        const tbody = document.getElementById('stockTableBody');
        
        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
            return;
        }

        const html = this.products.map(product => `
            <tr>
                <td>
                    <div class="product-info">
                        <strong>${product.name}</strong>
                        <br><small class="text-muted">${product.sku}</small>
                    </div>
                </td>
                <td>
                    <span class="stock-quantity ${this.getStockClass(product)}">${product.stock_quantity}</span>
                </td>
                <td>${product.reorder_threshold}</td>
                <td>
                    <span class="status-badge ${this.getStatusClass(product.stock_status)}">
                        ${product.stock_status}
                    </span>
                </td>
                <td>${new Date(product.updated_at || product.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="window.app.stockManager.adjustStock(${product.id})">
                            <i class="fas fa-edit"></i> Adjust
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.app.stockManager.viewHistory(${product.id})">
                            <i class="fas fa-history"></i> History
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    getStockClass(product) {
        if (product.stock_quantity === 0) return 'critical';
        if (product.stock_quantity <= product.reorder_threshold) return 'low';
        if (product.stock_quantity > product.max_stock_level * 0.8) return 'overstock';
        return 'good';
    }

    getStatusClass(status) {
        switch (status) {
            case 'In Stock': return 'in-stock';
            case 'Low Stock': return 'low-stock';
            case 'Out of Stock': return 'out-of-stock';
            default: return '';
        }
    }

    async handleQuickStockUpdate() {
        try {
            const form = document.getElementById('quickStockForm');
            const formData = new FormData(form);
            
            const productId = formData.get('product_id');
            const quantity = parseInt(formData.get('quantity'));
            const action = formData.get('action');

            if (!productId || !quantity) {
                this.showError('Please select a product and enter quantity');
                return;
            }

            let adjustmentQuantity;
            switch (action) {
                case 'add':
                    adjustmentQuantity = quantity;
                    break;
                case 'remove':
                    adjustmentQuantity = -quantity;
                    break;
                case 'set':
                    const product = this.products.find(p => p.id == productId);
                    adjustmentQuantity = quantity - product.stock_quantity;
                    break;
            }

            await this.api.updateStock(productId, adjustmentQuantity, `Quick ${action} via stock management`);
            
            this.showSuccess('Stock updated successfully');
            form.reset();
            await this.loadStockData();
        } catch (error) {
            console.error('Error updating stock:', error);
            this.showError('Failed to update stock');
        }
    }

    showBulkUpdateModal() {
        const modal = document.getElementById('bulkStockModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
    }

    exportStockReport() {
        const csvContent = this.generateStockCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateStockCSV() {
        const headers = ['SKU', 'Product Name', 'Current Stock', 'Reorder Level', 'Status', 'Value'];
        const rows = this.products.map(product => [
            product.sku,
            product.name,
            product.stock_quantity,
            product.reorder_threshold,
            product.stock_status,
            (product.stock_quantity * product.price).toFixed(2)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    adjustStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const newQuantity = prompt(`Current stock: ${product.stock_quantity}\nEnter new quantity:`, product.stock_quantity);
        if (newQuantity === null) return;

        const quantity = parseInt(newQuantity);
        if (isNaN(quantity) || quantity < 0) {
            this.showError('Please enter a valid quantity');
            return;
        }

        const adjustment = quantity - product.stock_quantity;
        this.api.updateStock(productId, adjustment, 'Manual adjustment')
            .then(() => {
                this.showSuccess('Stock adjusted successfully');
                this.loadStockData();
            })
            .catch(error => {
                console.error('Error adjusting stock:', error);
                this.showError('Failed to adjust stock');
            });
    }

    viewHistory(productId) {
        // This would open a modal showing stock movement history
        this.showInfo('Stock history feature coming soon');
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

    showInfo(message) {
        if (window.app && window.app.notifications) {
            window.app.notifications.info(message);
        }
    }
}