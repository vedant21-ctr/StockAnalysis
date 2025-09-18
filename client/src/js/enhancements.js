export class EnhancementManager {
    constructor() {
        this.selectedRows = new Set();
        this.sortState = { column: null, direction: 'asc' };
        this.init();
    }

    init() {
        this.setupAdvancedSearch();
        this.setupTableEnhancements();
        this.setupKeyboardShortcuts();
        this.setupLoadingStates();
        this.setupAnimations();
    }

    setupAdvancedSearch() {
        const advancedToggle = document.getElementById('advancedSearchToggle');
        const advancedFilters = document.getElementById('advancedFilters');
        const clearFilters = document.getElementById('clearFilters');

        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                const isVisible = advancedFilters.style.display !== 'none';
                advancedFilters.style.display = isVisible ? 'none' : 'block';
                
                if (!isVisible) {
                    advancedFilters.classList.add('slide-in-right');
                }
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Setup filter change listeners
        const filters = ['categoryFilter', 'stockStatusFilter', 'minPrice', 'maxPrice', 'dateFrom', 'dateTo'];
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
    }

    setupTableEnhancements() {
        // Setup sortable columns
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                this.handleSort(header);
            });
        });

        // Setup row selection
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }

        // Setup bulk actions
        const bulkActions = document.getElementById('bulkActions');
        if (bulkActions) {
            bulkActions.addEventListener('click', () => {
                this.showBulkActionsMenu();
            });
        }

        // Setup export
        const exportBtn = document.getElementById('exportProducts');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Setup column toggle
        const columnToggle = document.getElementById('columnToggle');
        if (columnToggle) {
            columnToggle.addEventListener('click', () => {
                this.showColumnToggle();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('productSearch')?.focus();
                this.showKeyboardShortcut('Search focused');
            }

            // Ctrl/Cmd + N for new product
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('addProductBtn')?.click();
                this.showKeyboardShortcut('New product dialog opened');
            }

            // Ctrl/Cmd + E for export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportData();
                this.showKeyboardShortcut('Data exported');
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupLoadingStates() {
        // Add loading states to buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.disabled) {
                    this.addLoadingState(btn);
                }
            });
        });
    }

    setupAnimations() {
        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        });

        document.querySelectorAll('.stat-card, .dashboard-card').forEach(card => {
            observer.observe(card);
        });

        // Counter animations
        this.animateCounters();
    }

    handleSort(header) {
        const column = header.dataset.sort;
        
        // Reset other headers
        document.querySelectorAll('.sortable').forEach(h => {
            if (h !== header) {
                h.classList.remove('sort-asc', 'sort-desc');
            }
        });

        // Toggle sort direction
        if (this.sortState.column === column) {
            this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortState.column = column;
            this.sortState.direction = 'asc';
        }

        // Update header classes
        header.classList.remove('sort-asc', 'sort-desc');
        header.classList.add(`sort-${this.sortState.direction}`);

        // Apply sort (would integrate with your existing table logic)
        this.applySorting();
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const row = checkbox.closest('tr');
            if (checked) {
                row.classList.add('selected');
                this.selectedRows.add(row.dataset.id);
            } else {
                row.classList.remove('selected');
                this.selectedRows.delete(row.dataset.id);
            }
        });

        this.updateBulkActionsState();
    }

    updateBulkActionsState() {
        const bulkActions = document.getElementById('bulkActions');
        if (bulkActions) {
            bulkActions.disabled = this.selectedRows.size === 0;
            bulkActions.textContent = this.selectedRows.size > 0 
                ? `Bulk Actions (${this.selectedRows.size})` 
                : 'Bulk Actions';
        }
    }

    showBulkActionsMenu() {
        // Create dropdown menu for bulk actions
        const menu = document.createElement('div');
        menu.className = 'bulk-actions-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="delete">
                <i class="fas fa-trash"></i> Delete Selected
            </div>
            <div class="menu-item" data-action="export">
                <i class="fas fa-download"></i> Export Selected
            </div>
            <div class="menu-item" data-action="update-category">
                <i class="fas fa-tag"></i> Update Category
            </div>
        `;

        // Position and show menu
        document.body.appendChild(menu);
        // Add positioning logic here
    }

    exportData() {
        // Get current table data
        const table = document.getElementById('productsTable');
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        const data = rows.map(row => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).slice(1, -1).map(cell => cell.textContent.trim());
        });

        // Create CSV
        const headers = ['SKU', 'Name', 'Category', 'Price', 'Stock', 'Status'];
        const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    showColumnToggle() {
        // Create column visibility toggle
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Show/Hide Columns</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <label><input type="checkbox" checked> SKU</label>
                    <label><input type="checkbox" checked> Name</label>
                    <label><input type="checkbox" checked> Category</label>
                    <label><input type="checkbox" checked> Price</label>
                    <label><input type="checkbox" checked> Stock</label>
                    <label><input type="checkbox" checked> Status</label>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    clearAllFilters() {
        document.getElementById('productSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockStatusFilter').value = 'all';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';

        this.applyFilters();
    }

    applyFilters() {
        // This would integrate with your existing filtering logic
        console.log('Applying filters...');
    }

    applySorting() {
        // This would integrate with your existing sorting logic
        console.log(`Sorting by ${this.sortState.column} ${this.sortState.direction}`);
    }

    addLoadingState(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;

        // Remove loading state after 2 seconds (or when operation completes)
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }

    showKeyboardShortcut(message) {
        const shortcut = document.createElement('div');
        shortcut.className = 'keyboard-shortcut show';
        shortcut.textContent = message;
        document.body.appendChild(shortcut);

        setTimeout(() => {
            shortcut.classList.remove('show');
            setTimeout(() => shortcut.remove(), 300);
        }, 2000);
    }

    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
    }

    animateCounters() {
        const counters = document.querySelectorAll('.counter-animation');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent) || 0;
            let current = 0;
            const increment = target / 50;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 20);
        });
    }
}