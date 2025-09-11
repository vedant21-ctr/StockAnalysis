export class ApiClient {
    constructor() {
        this.baseURL = '/api';
        this.useMockData = true; // Use mock data for demo
        this.initMockData();
    }

    initMockData() {
        this.mockProducts = [
            {
                id: 1,
                name: 'iPhone 14 Pro',
                description: 'Latest Apple smartphone with advanced camera system',
                sku: 'IPH14PRO-128',
                category_id: 1,
                category_name: 'Electronics',
                price: 999.99,
                cost_price: 750.00,
                stock_quantity: 25,
                reorder_threshold: 5,
                max_stock_level: 100,
                stock_status: 'In Stock',
                created_at: '2024-01-01T00:00:00Z'
            },
            {
                id: 2,
                name: 'Samsung Galaxy S23',
                description: 'Premium Android smartphone with excellent display',
                sku: 'SAM-S23-256',
                category_id: 1,
                category_name: 'Electronics',
                price: 899.99,
                cost_price: 650.00,
                stock_quantity: 3,
                reorder_threshold: 5,
                max_stock_level: 80,
                stock_status: 'Low Stock',
                created_at: '2024-01-01T00:00:00Z'
            },
            {
                id: 3,
                name: 'MacBook Air M2',
                description: 'Lightweight laptop with Apple M2 chip',
                sku: 'MBA-M2-256',
                category_id: 1,
                category_name: 'Electronics',
                price: 1199.99,
                cost_price: 900.00,
                stock_quantity: 0,
                reorder_threshold: 3,
                max_stock_level: 50,
                stock_status: 'Out of Stock',
                created_at: '2024-01-01T00:00:00Z'
            },
            {
                id: 4,
                name: 'Nike Air Max 270',
                description: 'Comfortable running shoes',
                sku: 'NIKE-AM270-10',
                category_id: 2,
                category_name: 'Clothing',
                price: 149.99,
                cost_price: 75.00,
                stock_quantity: 45,
                reorder_threshold: 15,
                max_stock_level: 200,
                stock_status: 'In Stock',
                created_at: '2024-01-01T00:00:00Z'
            },
            {
                id: 5,
                name: 'Dyson V15 Detect',
                description: 'Cordless vacuum cleaner with laser detection',
                sku: 'DYSON-V15',
                category_id: 4,
                category_name: 'Home & Garden',
                price: 749.99,
                cost_price: 500.00,
                stock_quantity: 6,
                reorder_threshold: 2,
                max_stock_level: 25,
                stock_status: 'Low Stock',
                created_at: '2024-01-01T00:00:00Z'
            }
        ];

        this.mockSales = [];
        
        // Generate more realistic sales data
        const customers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'Robert Brown', 'Lisa Garcia', 'David Martinez', 'Jennifer Lopez', 'Christopher Lee', 'Amanda White'];
        
        for (let i = 0; i < 50; i++) {
            const productIndex = Math.floor(Math.random() * this.mockProducts.length);
            const product = this.mockProducts[productIndex];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const daysAgo = Math.floor(Math.random() * 30);
            const saleDate = new Date();
            saleDate.setDate(saleDate.getDate() - daysAgo);
            
            this.mockSales.push({
                id: i + 1,
                product_id: product.id,
                product_name: product.name,
                quantity_sold: quantity,
                unit_price: product.price,
                total_amount: quantity * product.price,
                customer_name: customers[Math.floor(Math.random() * customers.length)],
                sale_date: saleDate.toISOString()
            });
        }
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        if (this.useMockData) {
            return this.handleMockRequest(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async handleMockRequest(endpoint, options = {}) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const method = options.method || 'GET';
        
        // Handle different endpoints
        if (endpoint === '/analytics/dashboard') {
            return {
                overview: {
                    total_products: this.mockProducts.length,
                    low_stock_products: this.mockProducts.filter(p => p.stock_status === 'Low Stock').length,
                    out_of_stock_products: this.mockProducts.filter(p => p.stock_status === 'Out of Stock').length,
                    total_inventory_value: this.mockProducts.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0),
                    sales_today: 2,
                    revenue_today: 1149.98,
                    sales_this_month: 15,
                    revenue_this_month: 12450.50
                },
                topSellingProducts: [
                    { id: 1, name: 'iPhone 14 Pro', sku: 'IPH14PRO-128', total_sold: 25, total_revenue: 24999.75 },
                    { id: 4, name: 'Nike Air Max 270', sku: 'NIKE-AM270-10', total_sold: 18, total_revenue: 2699.82 },
                    { id: 2, name: 'Samsung Galaxy S23', sku: 'SAM-S23-256', total_sold: 12, total_revenue: 10799.88 }
                ]
            };
        }

        if (endpoint.startsWith('/analytics/trends')) {
            const trends = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                trends.push({
                    period: date.toISOString().split('T')[0],
                    transactions: Math.floor(Math.random() * 10) + 1,
                    items_sold: Math.floor(Math.random() * 20) + 5,
                    revenue: Math.floor(Math.random() * 2000) + 500,
                    unique_products: Math.floor(Math.random() * 5) + 2
                });
            }
            return { trends };
        }

        if (endpoint === '/stock/low') {
            return this.mockProducts.filter(p => p.stock_status === 'Low Stock' || p.stock_status === 'Out of Stock');
        }

        if (endpoint.startsWith('/products')) {
            if (method === 'GET') {
                const params = new URLSearchParams(endpoint.split('?')[1] || '');
                const page = parseInt(params.get('page')) || 1;
                const limit = parseInt(params.get('limit')) || 10;
                const search = params.get('search') || '';
                
                let filteredProducts = this.mockProducts;
                
                if (search) {
                    filteredProducts = filteredProducts.filter(p => 
                        p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase())
                    );
                }
                
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
                
                return {
                    products: paginatedProducts,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(filteredProducts.length / limit),
                        totalItems: filteredProducts.length,
                        itemsPerPage: limit
                    }
                };
            }
            
            if (method === 'POST') {
                const newProduct = JSON.parse(options.body);
                newProduct.id = this.mockProducts.length + 1;
                newProduct.stock_status = 'In Stock';
                newProduct.category_name = 'Electronics';
                this.mockProducts.push(newProduct);
                return { message: 'Product created successfully', productId: newProduct.id };
            }
        }

        if (endpoint.startsWith('/sales')) {
            if (endpoint === '/sales' || endpoint.startsWith('/sales?')) {
                const params = new URLSearchParams(endpoint.split('?')[1] || '');
                const page = parseInt(params.get('page')) || 1;
                const limit = parseInt(params.get('limit')) || 20;
                
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedSales = this.mockSales.slice(startIndex, endIndex);
                
                return {
                    sales: paginatedSales,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(this.mockSales.length / limit),
                        totalItems: this.mockSales.length,
                        itemsPerPage: limit
                    }
                };
            }
            
            if (endpoint.startsWith('/sales/summary')) {
                const today = new Date();
                const todaySales = this.mockSales.filter(s => {
                    const saleDate = new Date(s.sale_date);
                    return saleDate.toDateString() === today.toDateString();
                });
                
                return {
                    total_transactions: todaySales.length,
                    total_items_sold: todaySales.reduce((sum, s) => sum + s.quantity_sold, 0),
                    total_revenue: todaySales.reduce((sum, s) => sum + s.total_amount, 0)
                };
            }
        }

        if (endpoint.startsWith('/stock')) {
            if (endpoint === '/stock/low') {
                return this.mockProducts.filter(p => p.stock_status === 'Low Stock' || p.stock_status === 'Out of Stock');
            }
            
            if (endpoint.startsWith('/stock/') && method === 'PUT') {
                // Mock stock update
                return { message: 'Stock updated successfully' };
            }
        }

        // Default response
        return { message: 'Mock API response', data: [] };
    }

    // Mock auth for demo
    async validateToken() {
        return true;
    }

    // Dashboard endpoints
    async getDashboardData() {
        return this.request('/analytics/dashboard');
    }

    async getSalesTrends(period = '30') {
        return this.request(`/analytics/trends?period=${period}`);
    }

    // Products endpoints
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products?${queryString}`);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Stock endpoints
    async getLowStockProducts() {
        return this.request('/stock/low');
    }

    async updateStock(productId, quantity, notes = '') {
        return this.request(`/stock/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity, notes })
        });
    }

    async getReorderSuggestions() {
        return this.request('/stock/reorder-suggestions');
    }

    // Sales endpoints
    async getSales(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/sales?${queryString}`);
    }

    async recordSale(saleData) {
        return this.request('/sales', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });
    }

    async getSalesSummary(period = '30') {
        return this.request(`/sales/summary?period=${period}`);
    }

    // Analytics endpoints
    async getInventoryAnalytics() {
        return this.request('/analytics/inventory');
    }

    async getPredictions(productId = null) {
        const params = productId ? `?productId=${productId}` : '';
        return this.request(`/analytics/predictions${params}`);
    }

    async getProfitAnalysis(period = '30') {
        return this.request(`/analytics/profit?period=${period}`);
    }

    // Suppliers endpoints
    async getSuppliers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/suppliers?${queryString}`);
    }

    async getSupplier(id) {
        return this.request(`/suppliers/${id}`);
    }

    async createSupplier(supplierData) {
        return this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(supplierData)
        });
    }

    async updateSupplier(id, supplierData) {
        return this.request(`/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(supplierData)
        });
    }

    async deleteSupplier(id) {
        return this.request(`/suppliers/${id}`, {
            method: 'DELETE'
        });
    }

    // Categories (if needed)
    async getCategories() {
        // This would need to be implemented in the backend
        return this.request('/categories');
    }
}