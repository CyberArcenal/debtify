const Store = require('electron-store').default;
const fetch = require('electron-fetch').default;
const { logger } = require('./logger');
const { BrowserWindow } = require('electron');

const store = new Store({ name: 'auth' });

class OnlineClient {
  constructor() {
    this.baseUrl = null;
    this.token = null;
    this.refreshPromise = null;
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getToken() {
    if (this.token) return this.token;
    this.token = store.get('jwt_token');
    return this.token;
  }

  setToken(token) {
    this.token = token;
    store.set('jwt_token', token);
  }

  clearToken() {
    this.token = null;
    store.delete('jwt_token');
    store.delete('refresh_token');
  }

  async refreshToken() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = store.get('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) throw new Error('Refresh failed');
        const data = await response.json();
        this.setToken(data.access_token);
        if (data.refresh_token) store.set('refresh_token', data.refresh_token);
        return data.access_token;
      } catch (err) {
        this.clearToken();
        // Notify renderer to redirect to login
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('auth:unauthorized');
        });
        throw err;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  async request(method, endpoint, body = null, headers = {}) {
    if (!this.baseUrl) throw new Error('Server URL not set');
    const url = `${this.baseUrl}${endpoint}`;
    const makeRequest = async (token) => {
      return await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...headers,
        },
        body: body ? JSON.stringify(body) : null,
      });
    };

    let token = this.getToken();
    let response = await makeRequest(token);

    if (response.status === 401 && token) {
      try {
        const newToken = await this.refreshToken();
        response = await makeRequest(newToken);
      } catch (refreshErr) {
        // refresh failed – return original 401 response
        return response;
      }
    }
    return response;
  }

  async get(endpoint) { return this.request('GET', endpoint); }
  async post(endpoint, body) { return this.request('POST', endpoint, body); }
  async put(endpoint, body) { return this.request('PUT', endpoint, body); }
  async delete(endpoint) { return this.request('DELETE', endpoint); }
}

module.exports = new OnlineClient();