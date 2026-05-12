export class ProductManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilters = {};
        this.products = [];
        this.categories = [];
        
        this.modal = document.getElementById('productModal');
        this.form = document.getElementById('productForm');
        this.editingProductId = null;
    }

    async init() {
        this.setupEventListeners();
        await this.loadCategories();
        await this.loadProducts();
    }

    setupEventListeners() {
        // Add product button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.showProductModal();
        });

        // Search and filters
        document.getElementById('productSearch').addEventListener('input', 
            this.debounce(() => this.handleSearch(), 300)
        );

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.handleFilterChange();
        });

        document.getElementById('stockStatusFilter').addEventListener('change', () => {
            this.handleFilterChange();
        });

        // Modal events
        this.modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideProductModal();
        });

        this.modal.querySelector('.modal-cancel').addEventListener('click', () => {
            this.hideProductModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideProductModal();
            }
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    async loadCategories() {
        try {
            // For now, use hardcoded categories since we don't have a categories endpoint
            this.categories = [
                { id: 1, name: 'Electronics' },
                { id: 2, name: 'Clothing' },
                { id: 3, name: 'Books' },
                { id: 4, name: 'Home & Garden' }
            ];

            this.populateCategorySelects();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategorySelects() {
        const categoryFilter = document.getElementById('categoryFilter');
        const productCategory = document.getElementById('productCategory');

        // Clear existing options (except first)
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        productCategory.innerHTML = '<option value="">Select Category</option>';

        this.categories.forEach(category => {
            const filterOption = new Option(category.name, category.id);
            const formOption = new Option(category.name, category.id);
            
            categoryFilter.appendChild(filterOption);
            productCategory.appendChild(formOption);
        });
    }

    async loadProducts() {
        try {
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            };

            const data = await this.api.getProducts(params);
            this.products = data.products;
            
            this.renderProductsTable();
            this.renderPagination(data.pagination);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    renderProductsTable() {
        const tbody = document.getElementById('productsTableBody');
        
        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>No products found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const html = this.products.map(product => `
            <tr>
                <td>${product.sku}</td>
                <td>
                    <div class="product-info">
                        <strong>${product.name}</strong>
                        ${product.description ? `<br><small class="text-muted">${product.description}</small>` : ''}
                    </div>
                </td>
                <td>${product.category_name || 'Uncategorized'}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <span class="stock-quantity">${product.stock_quantity}</span>
                    <small class="text-muted">/ ${product.reorder_threshold}</small>
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(product.stock_status)}">
                        ${product.stock_status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="window.app.productManager.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="window.app.productManager.viewProduct(${product.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.productManager.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    getStatusClass(status) {
        switch (status) {
            case 'In Stock': return 'in-stock';
            case 'Low Stock': return 'low-stock';
            case 'Out of Stock': return 'out-of-stock';
            default: return '';
        }
    }

    renderPagination(pagination) {
        const container = document.getElementById('productsPagination');
        
        if (pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Previous button
        html += `
            <button ${pagination.currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.app.productManager.goToPage(${pagination.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

        if (startPage > 1) {
            html += `<button onclick="window.app.productManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span>...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button ${i === pagination.currentPage ? 'class="active"' : ''} 
                        onclick="window.app.productManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                html += `<span>...</span>`;
            }
            html += `<button onclick="window.app.productManager.goToPage(${pagination.totalPages})">${pagination.totalPages}</button>`;
        }

        // Next button
        html += `
            <button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} 
                    onclick="window.app.productManager.goToPage(${pagination.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadProducts();
    }

    handleSearch() {
        const searchTerm = document.getElementById('productSearch').value.trim();
        this.currentFilters.search = searchTerm || undefined;
        this.currentPage = 1;
        this.loadProducts();
    }

    handleFilterChange() {
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('stockStatusFilter').value;

        this.currentFilters.category = category || undefined;
        this.currentFilters.status = status === 'all' ? undefined : status;
        this.currentPage = 1;
        this.loadProducts();
    }

    showProductModal(product = null) {
        this.editingProductId = product ? product.id : null;
        
        const title = document.getElementById('productModalTitle');
        title.textContent = product ? 'Edit Product' : 'Add Product';

        // Reset form
        this.form.reset();

        // Populate form if editing
        if (product) {
            Object.keys(product).forEach(key => {
                const field = this.form.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = product[key] || '';
                }
            });
        }

        this.modal.classList.add('show');
        this.modal.style.display = 'flex';
    }

    hideProductModal() {
        this.modal.classList.remove('show');
        this.modal.style.display = 'none';
        this.editingProductId = null;
        this.form.reset();
    }

    async handleFormSubmit() {
        try {
            const formData = new FormData(this.form);
            const productData = {};

            for (let [key, value] of formData.entries()) {
                if (value.trim() !== '') {
                    // Convert numeric fields
                    if (['price', 'cost_price'].includes(key)) {
                        productData[key] = parseFloat(value);
                    } else if (['stock_quantity', 'reorder_threshold', 'max_stock_level', 'category_id'].includes(key)) {
                        productData[key] = parseInt(value);
                    } else {
                        productData[key] = value;
                    }
                }
            }

            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            if (this.editingProductId) {
                await this.api.updateProduct(this.editingProductId, productData);
                this.showSuccess('Product updated successfully');
            } else {
                await this.api.createProduct(productData);
                this.showSuccess('Product created successfully');
            }

            this.hideProductModal();
            await this.loadProducts();

        } catch (error) {
            console.error('Error saving product:', error);
            this.showError(error.message || 'Failed to save product');
        } finally {
            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Product';
        }
    }

    async editProduct(id) {
        try {
            const product = await this.api.getProduct(id);
            this.showProductModal(product);
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Failed to load product details');
        }
    }

    async viewProduct(id) {
        // For now, just edit - could implement a view-only modal later
        this.editProduct(id);
    }

    async deleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        const confirmed = confirm(`Are you sure you want to delete "${product.name}"?`);
        if (!confirmed) return;

        try {
            await this.api.deleteProduct(id);
            this.showSuccess('Product deleted successfully');
            await this.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Failed to delete product');
        }
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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