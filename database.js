/**
 * Loy Krathong Database & Storage Engine
 * Hybrid storage: IndexedDB (Client) + REST API / SQLite (Server)
 * Works seamlessly offline, on static hosting (GitHub Pages), or with Node server.
 */

class LoyKrathongDB {
  constructor() {
    this.dbName = 'LoyKrathongDB';
    this.dbVersion = 1;
    this.db = null;
    this.isServerAvailable = false;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve) => {
      // Check if server API is reachable
      fetch('/api/health')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.status === 'ok') {
            this.isServerAvailable = true;
          }
        })
        .catch(() => {
          this.isServerAvailable = false;
        });

      if (!window.indexedDB) {
        resolve(null);
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('wishes')) {
          const store = db.createObjectStore('wishes', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB open error:', e);
        resolve(null);
      };
    });
  }

  /**
   * Save a wish/message record
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async saveWish(data) {
    const id = data.id || 'wish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const formattedDate = `๒๔ พฤศจิกายน ${thaiYear} • วันขึ้น ๑๕ ค่ำ เดือน ๑๒`;
    const formattedTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    const record = {
      id: id,
      name1: data.name1 || 'คนที่ 1',
      name2: data.name2 || 'คนที่ 2',
      tagText: data.tagText || 'ลอยกระทง ๒๔ พ.ย.',
      wish: data.wish || '',
      letter: data.letter || '',
      baseType: data.baseType || 'banana-leaf',
      flowerType: data.flowerType || 'lotus-bud',
      candleColor: data.candleColor || 'gold',
      coinType: data.coinType || 'gold',
      isCoupleMode: data.isCoupleMode !== false,
      createdAt: now.toISOString(),
      formattedDate: formattedDate,
      formattedTime: formattedTime
    };

    // 1. Save to IndexedDB
    if (this.db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction('wishes', 'readwrite');
          const store = tx.objectStore('wishes');
          const req = store.put(record);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('IndexedDB save error:', err);
      }
    }

    // 2. Also save to Server API (if server is running)
    try {
      fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch(() => {});
    } catch (e) {}

    // 3. Fallback LocalStorage backup
    try {
      const existing = JSON.parse(localStorage.getItem('loykrathong_wishes') || '[]');
      existing.unshift(record);
      if (existing.length > 50) existing.pop();
      localStorage.setItem('loykrathong_wishes', JSON.stringify(existing));
    } catch (e) {}

    return record;
  }

  /**
   * Fetch all stored wishes/messages
   * @returns {Promise<Array>}
   */
  async getAllWishes() {
    // 1. Try server first
    try {
      const res = await fetch('/api/wishes');
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData)) {
          // Sync into IndexedDB
          if (this.db) {
            const tx = this.db.transaction('wishes', 'readwrite');
            const store = tx.objectStore('wishes');
            serverData.forEach(item => store.put(item));
          }
          return serverData;
        }
      }
    } catch (e) {}

    // 2. Fallback to IndexedDB
    if (this.db) {
      try {
        const idbData = await new Promise((resolve) => {
          const tx = this.db.transaction('wishes', 'readonly');
          const store = tx.objectStore('wishes');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        if (idbData && idbData.length > 0) {
          // Sort newest first
          idbData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return idbData;
        }
      } catch (err) {
        console.warn('IndexedDB fetch error:', err);
      }
    }

    // 3. Fallback to LocalStorage
    try {
      const localData = JSON.parse(localStorage.getItem('loykrathong_wishes') || '[]');
      return localData;
    } catch (e) {
      return [];
    }
  }

  /**
   * Delete a wish by ID
   * @param {string} id 
   */
  async deleteWish(id) {
    if (this.db) {
      try {
        await new Promise((resolve) => {
          const tx = this.db.transaction('wishes', 'readwrite');
          const store = tx.objectStore('wishes');
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch (e) {}
    }

    // Server delete
    try {
      fetch(`/api/wishes/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    // LocalStorage delete
    try {
      let localData = JSON.parse(localStorage.getItem('loykrathong_wishes') || '[]');
      localData = localData.filter(item => item.id !== id);
      localStorage.setItem('loykrathong_wishes', JSON.stringify(localData));
    } catch (e) {}
  }

  /**
   * Export all wishes as a JSON file download
   */
  async exportJSON() {
    const wishes = await this.getAllWishes();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(wishes, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `loy-krathong-wishes-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }
}

window.loyKrathongDB = new LoyKrathongDB();
