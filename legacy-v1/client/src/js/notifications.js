export class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        this.notifications = [];
    }

    show(message, type = 'info', title = null, duration = 5000) {
        const notification = this.createNotification(message, type, title);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type, title) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease-out';

        const defaultTitles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };

        const notificationTitle = title || defaultTitles[type] || 'Notification';

        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${notificationTitle}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;

        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    success(message, title = null) {
        return this.show(message, 'success', title);
    }

    error(message, title = null) {
        return this.show(message, 'error', title);
    }

    warning(message, title = null) {
        return this.show(message, 'warning', title);
    }

    info(message, title = null) {
        return this.show(message, 'info', title);
    }
}