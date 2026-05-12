export class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    async login(credentials) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                return {
                    success: true,
                    token: this.token,
                    user: this.user
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    async validateToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.user = userData;
                localStorage.setItem('user', JSON.stringify(this.user));
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
            return false;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    hasAnyRole(roles) {
        return this.user && roles.includes(this.user.role);
    }
}