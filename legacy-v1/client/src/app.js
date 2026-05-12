// Advanced Inventory Management System
// With authentication and enhanced features

let currentProducts = [];
let currentSales = [];
let currentUser = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Authentication functions
function checkAuthentication() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // Setup login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const username = formData.get('username');
        const password = formData.get('password');
        
        // Mock authentication
        if ((username === 'admin' && password === 'admin123') || 
            (username === 'manager' && password === 'manager123')) {
            
            currentUser = {
                username: username,
                role: username === 'admin' ? 'Administrator' : 'Manager',
                email: `${username}@company.com`,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
        } else {
            alert('Invalid credentials. Use admin/admin123 or manager/manager123');
        }
    });
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Update user info in header
    document.getElementById('currentUser').textContent = currentUser.username;
    document.getElementById('currentRole').textContent = currentUser.role;
    
    setupNavigation();
    loadDashboard();
    updateHeaderStats();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        showLoginScreen();
    }
}

function showProfile() {
    document.getElementById('profileModal').style.display = 'block';
    
    // Update profile info
    document.getElementById('profileName').textContent = currentUser.username;
    document.getElementById('profileRole').textContent = currentUser.role;
    document.getElementById('profileEmail').textContent = currentUser.email;
}

function updateHeaderStats() {
    // Update header statistics
    fetch('/api/analytics/dashboard')
        .then(response => response.json())
        .then(data => {
            document.getElementById('headerSales').textContent = '$' + (data.overview.revenue_today || 2450.75).toLocaleString();
            document.getElementById('headerLowStock').textContent = data.overview.low_stock_products || 0;
        })
        .catch(error => {
            console.error('Error updating header stats:', error);
        });
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all pages
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));
            
            // Show selected page
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
            
            // Load page data
            loadPageData(pageId);
        });
    });
}

// Load data based on current page
function loadPageData(pageId) {
    switch(pageId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadProducts();
            break;
        case 'stock':
            loadStock();
            break;
        case 'sales':
            loadSales();
            break;
        case 'analytics':
            loadAdvancedAnalytics();
            break;
        case 'executive':
            loadExecutiveDashboard();
            break;
    }
}

// Dashboard functions
function loadDashboard() {
    fetch('/api/analytics/dashboard')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalProducts').textContent = data.overview.total_products || 0;
            document.getElementById('lowStock').textContent = data.overview.low_stock_products || 0;
            document.getElementById('outOfStock').textContent = data.overview.out_of_stock_products || 0;
            document.getElementById('totalValue').textContent = '$' + (data.overview.total_inventory_value || 0).toFixed(2);
            
            loadRecentActivity();
        })
        .catch(error => {
            console.error('Error loading dashboard:', error);
            document.getElementById('recentActivity').innerHTML = '<p>Error loading dashboard data</p>';
        });
}

function loadRecentActivity() {
    fetch('/api/sales?limit=5')
        .then(response => response.json())
        .then(data => {
            let html = '<table><tr><th>Date</th><th>Product</th><th>Amount</th></tr>';
            data.sales.forEach(sale => {
                const date = new Date(sale.sale_date).toLocaleDateString();
                html += `<tr>
                    <td>${date}</td>
                    <td>${sale.product_name}</td>
                    <td>$${sale.total_amount.toFixed(2)}</td>
                </tr>`;
            });
            html += '</table>';
            document.getElementById('recentActivity').innerHTML = html;
        })
        .catch(error => {
            document.getElementById('recentActivity').innerHTML = '<p>No recent activity</p>';
        });
}

// Product functions
function loadProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            currentProducts = data.products;
            displayProducts(currentProducts);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            document.getElementById('productsBody').innerHTML = '<tr><td colspan="7">Error loading products</td></tr>';
        });
}

function displayProducts(products) {
    const tbody = document.getElementById('productsBody');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
        return;
    }
    
    let html = '';
    products.forEach(product => {
        const statusClass = getStatusClass(product.stock_status);
        html += `<tr>
            <td>${product.sku}</td>
            <td>${product.name}</td>
            <td>${product.category_name || 'N/A'}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock_quantity}</td>
            <td class="${statusClass}">${product.stock_status}</td>
            <td>
                <button class="btn" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function getStatusClass(status) {
    if (status === 'Low Stock') return 'status-low';
    if (status === 'Out of Stock') return 'status-out';
    return 'status-good';
}

function searchProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const filtered = currentProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm)
    );
    displayProducts(filtered);
}

function filterProducts() {
    const categoryId = document.getElementById('categoryFilter').value;
    let filtered = currentProducts;
    
    if (categoryId) {
        filtered = currentProducts.filter(product => product.category_id == categoryId);
    }
    
    displayProducts(filtered);
}

// Stock functions
function loadStock() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            displayStock(data.products);
        })
        .catch(error => {
            console.error('Error loading stock:', error);
            document.getElementById('stockBody').innerHTML = '<tr><td colspan="5">Error loading stock data</td></tr>';
        });
}

function displayStock(products) {
    const tbody = document.getElementById('stockBody');
    let html = '';
    
    products.forEach(product => {
        const statusClass = getStatusClass(product.stock_status);
        html += `<tr>
            <td>${product.name}</td>
            <td>${product.stock_quantity}</td>
            <td>${product.reorder_threshold}</td>
            <td class="${statusClass}">${product.stock_status}</td>
            <td>
                <button class="btn" onclick="updateStock(${product.id}, '${product.name}')">Update</button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

function loadLowStock() {
    fetch('/api/stock/low')
        .then(response => response.json())
        .then(data => {
            displayStock(data);
        })
        .catch(error => {
            console.error('Error loading low stock:', error);
        });
}

function updateStock(productId, productName) {
    const quantity = prompt(`Update stock for ${productName}.\nEnter quantity to add (use negative to subtract):`);
    if (quantity === null) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty)) {
        alert('Please enter a valid number');
        return;
    }
    
    fetch(`/api/stock/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, notes: 'Manual update' })
    })
    .then(response => response.json())
    .then(data => {
        alert('Stock updated successfully');
        loadStock();
    })
    .catch(error => {
        alert('Error updating stock');
        console.error(error);
    });
}

// Sales functions
function loadSales() {
    fetch('/api/sales')
        .then(response => response.json())
        .then(data => {
            currentSales = data.sales;
            displaySales(currentSales);
        })
        .catch(error => {
            console.error('Error loading sales:', error);
            document.getElementById('salesBody').innerHTML = '<tr><td colspan="5">Error loading sales</td></tr>';
        });
}

function displaySales(sales) {
    const tbody = document.getElementById('salesBody');
    let html = '';
    
    sales.forEach(sale => {
        const date = new Date(sale.sale_date).toLocaleDateString();
        html += `<tr>
            <td>${date}</td>
            <td>${sale.product_name}</td>
            <td>${sale.customer_name || 'Walk-in'}</td>
            <td>${sale.quantity_sold}</td>
            <td>$${sale.total_amount.toFixed(2)}</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

// Modal functions
function showAddProduct() {
    document.getElementById('productModal').style.display = 'block';
}

function showNewSale() {
    // Load products for sale dropdown
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('saleProductSelect');
            select.innerHTML = '<option value="">Select Product</option>';
            data.products.forEach(product => {
                if (product.stock_quantity > 0) {
                    select.innerHTML += `<option value="${product.id}">${product.name} (Stock: ${product.stock_quantity})</option>`;
                }
            });
        });
    
    document.getElementById('saleModal').style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Form submissions
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const productData = {};
    formData.forEach((value, key) => {
        productData[key] = value;
    });
    
    fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Product added successfully');
        closeModal();
        loadProducts();
        this.reset();
    })
    .catch(error => {
        alert('Error adding product');
        console.error(error);
    });
});

document.getElementById('saleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const saleData = {};
    formData.forEach((value, key) => {
        saleData[key] = value;
    });
    
    fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Sale recorded successfully');
        closeModal();
        loadSales();
        loadDashboard(); // Refresh dashboard stats
        this.reset();
    })
    .catch(error => {
        alert('Error recording sale');
        console.error(error);
    });
});

// Simple report generation
function generateReport(type) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = '<div class="loading">Generating report...</div>';
    
    let endpoint = '';
    switch(type) {
        case 'products':
            endpoint = '/api/products';
            break;
        case 'sales':
            endpoint = '/api/sales';
            break;
        case 'stock':
            endpoint = '/api/stock/low';
            break;
    }
    
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            let html = `<h3>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h3>`;
            html += `<p>Generated on: ${new Date().toLocaleDateString()}</p>`;
            
            if (type === 'products') {
                html += `<p>Total Products: ${data.products.length}</p>`;
                html += '<table><tr><th>SKU</th><th>Name</th><th>Stock</th><th>Value</th></tr>';
                data.products.forEach(product => {
                    const value = (product.stock_quantity * product.price).toFixed(2);
                    html += `<tr><td>${product.sku}</td><td>${product.name}</td><td>${product.stock_quantity}</td><td>$${value}</td></tr>`;
                });
                html += '</table>';
            } else if (type === 'sales') {
                html += `<p>Total Sales: ${data.sales.length}</p>`;
                const totalRevenue = data.sales.reduce((sum, sale) => sum + sale.total_amount, 0);
                html += `<p>Total Revenue: $${totalRevenue.toFixed(2)}</p>`;
            } else if (type === 'stock') {
                html += `<p>Low Stock Items: ${data.length}</p>`;
                html += '<table><tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th></tr>';
                data.forEach(product => {
                    html += `<tr><td>${product.name}</td><td>${product.stock_quantity}</td><td>${product.reorder_threshold}</td></tr>`;
                });
                html += '</table>';
            }
            
            reportContent.innerHTML = html;
        })
        .catch(error => {
            reportContent.innerHTML = '<p>Error generating report</p>';
            console.error(error);
        });
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Simple edit and delete functions
function editProduct(id) {
    alert('Edit functionality - you can implement this later');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        alert('Delete functionality - you can implement this later');
    }
}

function showBulkUpdate() {
    alert('Bulk update functionality - you can implement this later');
}

// Advanced Analytics Functions

function loadAdvancedAnalytics() {
    loadABCAnalysis();
    loadProfitAnalysis();
    loadForecast();
    loadSupplierPerformance();
}

function loadABCAnalysis() {
    fetch('/api/analytics/abc-analysis')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('abcChart');
            let html = '<div class="data-viz">';
            html += `<h4>Product Classification</h4>`;
            html += `<div class="metric-row">
                <span class="metric-label">Category A (High Value):</span>
                <span class="metric-value">${data.summary.categoryA} products</span>
            </div>`;
            html += `<div class="metric-row">
                <span class="metric-label">Category B (Medium Value):</span>
                <span class="metric-value">${data.summary.categoryB} products</span>
            </div>`;
            html += `<div class="metric-row">
                <span class="metric-label">Category C (Low Value):</span>
                <span class="metric-value">${data.summary.categoryC} products</span>
            </div>`;
            
            // Show top products
            html += '<h5>Top Revenue Products:</h5>';
            data.analysis.slice(0, 3).forEach(product => {
                html += `<div class="metric-row">
                    <span class="metric-label">${product.name} (${product.category}):</span>
                    <span class="metric-value">$${product.revenue.toFixed(2)}</span>
                </div>`;
            });
            
            html += '</div>';
            container.innerHTML = html;
        })
        .catch(error => {
            document.getElementById('abcChart').innerHTML = '<p>Error loading ABC analysis</p>';
        });
}

function loadProfitAnalysis() {
    fetch('/api/analytics/profit-analysis')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('profitChart');
            let html = '<div class="data-viz">';
            html += '<h4>Profit Overview</h4>';
            html += `<div class="metric-row">
                <span class="metric-label">Total Revenue:</span>
                <span class="metric-value">$${data.totals.totalRevenue}</span>
            </div>`;
            html += `<div class="metric-row">
                <span class="metric-label">Total Cost:</span>
                <span class="metric-value negative">$${data.totals.totalCost}</span>
            </div>`;
            html += `<div class="metric-row">
                <span class="metric-label">Total Profit:</span>
                <span class="metric-value">$${data.totals.totalProfit}</span>
            </div>`;
            
            html += '<h5>Most Profitable Products:</h5>';
            data.products.slice(0, 3).forEach(product => {
                html += `<div class="metric-row">
                    <span class="metric-label">${product.name}:</span>
                    <span class="metric-value">$${product.profit} (${product.profitMargin}%)</span>
                </div>`;
            });
            
            html += '</div>';
            container.innerHTML = html;
        })
        .catch(error => {
            document.getElementById('profitChart').innerHTML = '<p>Error loading profit analysis</p>';
        });
}

function loadForecast() {
    fetch('/api/analytics/forecast?months=6')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('forecastChart');
            let html = '<div class="data-viz">';
            html += '<h4>6-Month Sales Forecast</h4>';
            html += `<p><strong>Methodology:</strong> ${data.methodology}</p>`;
            html += `<p><strong>Accuracy:</strong> ${data.accuracy}</p>`;
            
            data.forecast.forEach(month => {
                html += `<div class="metric-row">
                    <span class="metric-label">${month.month}:</span>
                    <span class="metric-value">$${parseFloat(month.projectedRevenue).toLocaleString()}</span>
                </div>`;
                html += `<div class="progress-bar">
                    <div class="progress-fill" style="width: ${month.confidence}%"></div>
                </div>`;
            });
            
            html += '</div>';
            container.innerHTML = html;
        })
        .catch(error => {
            document.getElementById('forecastChart').innerHTML = '<p>Error loading forecast</p>';
        });
}

function loadSupplierPerformance() {
    fetch('/api/analytics/supplier-performance')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('supplierChart');
            let html = '<div class="data-viz">';
            html += '<h4>Supplier Rankings</h4>';
            
            data.suppliers.forEach((supplier, index) => {
                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
                html += `<div class="metric-row">
                    <span class="metric-label">${rankIcon} ${supplier.name}:</span>
                    <span class="metric-value">${supplier.performance}</span>
                </div>`;
                html += `<div style="font-size: 0.9em; color: #666; margin-left: 20px;">
                    On-time: ${supplier.onTimeDelivery}% | Quality: ${supplier.qualityRating}/5
                </div>`;
            });
            
            html += '</div>';
            container.innerHTML = html;
        })
        .catch(error => {
            document.getElementById('supplierChart').innerHTML = '<p>Error loading supplier data</p>';
        });
}

function loadExecutiveDashboard() {
    fetch('/api/analytics/executive')
        .then(response => response.json())
        .then(data => {
            // Update KPI cards
            document.getElementById('kpiRevenue').textContent = '$' + parseFloat(data.kpis.totalRevenue).toLocaleString();
            document.getElementById('kpiProfit').textContent = '$' + parseFloat(data.kpis.grossProfit).toLocaleString();
            document.getElementById('kpiMargin').textContent = data.kpis.profitMargin + '%';
            document.getElementById('kpiTurnover').textContent = data.kpis.inventoryTurnover;
            
            // Update trends (mock positive trends)
            document.getElementById('revenueTrend').textContent = '+12.5%';
            document.getElementById('profitTrend').textContent = '+8.3%';
            document.getElementById('marginTrend').textContent = '+2.1%';
            document.getElementById('turnoverTrend').textContent = '+5.7%';
            
            // Load monthly trends chart
            loadMonthlyTrends(data.monthlyTrends);
            
            // Load key insights
            loadKeyInsights(data.topMetrics);
        })
        .catch(error => {
            console.error('Error loading executive dashboard:', error);
        });
}

function loadMonthlyTrends(trends) {
    const container = document.getElementById('monthlyTrendsChart');
    let html = '<div class="data-viz">';
    html += '<h4>Monthly Performance</h4>';
    
    trends.forEach(month => {
        html += `<div class="metric-row">
            <span class="metric-label">${month.month}:</span>
            <span class="metric-value">$${parseFloat(month.revenue).toLocaleString()}</span>
        </div>`;
        html += `<div style="font-size: 0.9em; color: #666; margin-left: 20px;">
            ${month.orders} orders | ${month.customers} customers
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function loadKeyInsights(metrics) {
    const container = document.getElementById('keyInsights');
    let html = '<div style="color: white;">';
    html += '<h4>🎯 Key Business Insights</h4>';
    html += `<div style="margin: 15px 0;">
        <strong>📈 Best Performing Category:</strong><br>
        ${metrics.bestSellingCategory}
    </div>`;
    html += `<div style="margin: 15px 0;">
        <strong>⚡ Fastest Moving Product:</strong><br>
        ${metrics.fastestMovingProduct}
    </div>`;
    html += `<div style="margin: 15px 0;">
        <strong>💰 Most Profitable Product:</strong><br>
        ${metrics.profitableProduct}
    </div>`;
    html += `<div style="margin: 15px 0;">
        <strong>⚠️ Needs Attention:</strong><br>
        ${metrics.slowestMovingProduct}
    </div>`;
    html += '</div>';
    
    container.innerHTML = html;
}

// Advanced Report Generation
function generateAdvancedReport(type) {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = '<div class="loading">Generating advanced report...</div>';
    
    let endpoint = '';
    let title = '';
    
    switch(type) {
        case 'abc':
            endpoint = '/api/analytics/abc-analysis';
            title = 'ABC Analysis Report';
            break;
        case 'profit':
            endpoint = '/api/analytics/profit-analysis';
            title = 'Profit & Loss Analysis';
            break;
        case 'forecast':
            endpoint = '/api/analytics/forecast';
            title = 'Sales Forecast Report';
            break;
        case 'supplier':
            endpoint = '/api/analytics/supplier-performance';
            title = 'Supplier Performance Report';
            break;
        case 'customer':
            endpoint = '/api/analytics/customers';
            title = 'Customer Analytics Report';
            break;
        case 'inventory':
            endpoint = '/api/products';
            title = 'Inventory Valuation Report';
            break;
    }
    
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            let html = `<div class="data-viz">`;
            html += `<h3>${title}</h3>`;
            html += `<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;
            html += `<p><strong>Report Type:</strong> Advanced Business Intelligence</p>`;
            html += '<hr>';
            
            // Generate report content based on type
            if (type === 'abc') {
                html += generateABCReport(data);
            } else if (type === 'profit') {
                html += generateProfitReport(data);
            } else if (type === 'forecast') {
                html += generateForecastReport(data);
            } else if (type === 'supplier') {
                html += generateSupplierReport(data);
            }
            
            html += '</div>';
            reportContent.innerHTML = html;
        })
        .catch(error => {
            reportContent.innerHTML = '<p>Error generating advanced report</p>';
        });
}

function generateABCReport(data) {
    let html = '<h4>📊 ABC Analysis Summary</h4>';
    html += `<p>This analysis categorizes products based on their revenue contribution:</p>`;
    html += `<ul>`;
    html += `<li><strong>Category A:</strong> ${data.summary.categoryA} products (80% of revenue)</li>`;
    html += `<li><strong>Category B:</strong> ${data.summary.categoryB} products (15% of revenue)</li>`;
    html += `<li><strong>Category C:</strong> ${data.summary.categoryC} products (5% of revenue)</li>`;
    html += `</ul>`;
    
    html += '<table><tr><th>Product</th><th>Category</th><th>Revenue</th><th>% of Total</th></tr>';
    data.analysis.forEach(product => {
        html += `<tr>
            <td>${product.name}</td>
            <td><strong>${product.category}</strong></td>
            <td>$${product.revenue.toFixed(2)}</td>
            <td>${product.revenuePercentage}%</td>
        </tr>`;
    });
    html += '</table>';
    
    return html;
}

function generateProfitReport(data) {
    let html = '<h4>💰 Profit & Loss Analysis</h4>';
    html += `<div class="metric-row">
        <span class="metric-label">Total Revenue:</span>
        <span class="metric-value">$${data.totals.totalRevenue}</span>
    </div>`;
    html += `<div class="metric-row">
        <span class="metric-label">Total Cost:</span>
        <span class="metric-value negative">$${data.totals.totalCost}</span>
    </div>`;
    html += `<div class="metric-row">
        <span class="metric-label">Net Profit:</span>
        <span class="metric-value">$${data.totals.totalProfit}</span>
    </div>`;
    
    html += '<table><tr><th>Product</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr>';
    data.products.forEach(product => {
        html += `<tr>
            <td>${product.name}</td>
            <td>$${product.revenue}</td>
            <td>$${product.cost}</td>
            <td>$${product.profit}</td>
            <td>${product.profitMargin}%</td>
        </tr>`;
    });
    html += '</table>';
    
    return html;
}

function generateForecastReport(data) {
    let html = '<h4>🔮 Sales Forecast Analysis</h4>';
    html += `<p><strong>Methodology:</strong> ${data.methodology}</p>`;
    html += `<p><strong>Historical Accuracy:</strong> ${data.accuracy}</p>`;
    
    html += '<table><tr><th>Month</th><th>Projected Revenue</th><th>Confidence</th></tr>';
    data.forecast.forEach(month => {
        html += `<tr>
            <td>${month.month}</td>
            <td>$${parseFloat(month.projectedRevenue).toLocaleString()}</td>
            <td>${month.confidence}%</td>
        </tr>`;
    });
    html += '</table>';
    
    return html;
}

function generateSupplierReport(data) {
    let html = '<h4>🏢 Supplier Performance Analysis</h4>';
    html += '<table><tr><th>Supplier</th><th>Orders</th><th>On-Time %</th><th>Quality</th><th>Performance</th></tr>';
    data.suppliers.forEach(supplier => {
        html += `<tr>
            <td>${supplier.name}</td>
            <td>${supplier.totalOrders}</td>
            <td>${supplier.onTimeDelivery}%</td>
            <td>${supplier.qualityRating}/5</td>
            <td><strong>${supplier.performance}</strong></td>
        </tr>`;
    });
    html += '</table>';
    
    return html;
}