/**
 * Loy Krathong Database & Storage Engine
 * Multi-tier storage: Supabase Cloud + SQLite / Node Server + IndexedDB (Client) + LocalStorage
 * Works seamlessly online, offline, on GitHub Pages, and with Node server.
 */

class LoyKrathongDB {
  constructor() {
    this.dbName = 'LoyKrathongDB';
    this.dbVersion = 1;
    this.db = null;
    this.isServerAvailable = false;
    
    // Supabase Configuration
    this.supabaseUrl = 'https://gulhecqxxmxhhtioxgxo.supabase.co';
    this.supabaseKey = 'sb_publishable_NQcm7PoWsEORk7ECgXTblQ_dU2o8iXR';
    this.isSupabaseConnected = false;
  }

  // Initialize storage providers
  async init() {
    // 1. Try to fetch dynamic config from server (if running)
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        if (config.supabaseUrl) this.supabaseUrl = config.supabaseUrl;
        if (config.supabasePublishableKey) this.supabaseKey = config.supabasePublishableKey;
        this.isServerAvailable = true;
      }
    } catch (e) {
      this.isServerAvailable = false;
    }

    // 2. Test Supabase connection
    this.testSupabaseConnection();

    // 3. Initialize IndexedDB
    return new Promise((resolve) => {
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

  // Check Supabase availability
  async testSupabaseConnection() {
    if (!this.supabaseUrl || !this.supabaseKey) return false;
    try {
      const res = await fetch(`${this.supabaseUrl}/rest/v1/wishes?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });
      if (res.ok) {
        this.isSupabaseConnected = true;
        return true;
      }
    } catch (e) {}
    this.isSupabaseConnected = false;
    return false;
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

    // 1. Direct save to Supabase (Cloud Database)
    this.saveToSupabase(record);

    // 2. Save to Server API (if node server is running, syncs SQLite)
    try {
      fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch(() => {});
    } catch (e) {}

    // 3. Save to local IndexedDB (Client Browser)
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

    // 4. Fallback LocalStorage backup
    try {
      const existing = JSON.parse(localStorage.getItem('loykrathong_wishes') || '[]');
      existing.unshift(record);
      if (existing.length > 50) existing.pop();
      localStorage.setItem('loykrathong_wishes', JSON.stringify(existing));
    } catch (e) {}

    return record;
  }

  // Supabase save helper
  async saveToSupabase(record) {
    if (!this.supabaseUrl || !this.supabaseKey) return null;
    try {
      const res = await fetch(`${this.supabaseUrl}/rest/v1/wishes`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        this.isSupabaseConnected = true;
        const data = await res.json();
        return Array.isArray(data) ? data[0] : record;
      }
    } catch (e) {
      console.warn('Supabase save error:', e);
    }
    return null;
  }

  /**
   * Fetch all stored wishes/messages
   * @returns {Promise<Array>}
   */
  async getAllWishes() {
    // 1. Try Server API first (handles Supabase + SQLite)
    try {
      const res = await fetch('/api/wishes');
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          this.cacheToIndexedDB(serverData);
          return serverData;
        }
      }
    } catch (e) {}

    // 2. Try direct Supabase Cloud query
    try {
      if (this.supabaseUrl && this.supabaseKey) {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/wishes?select=*&order=createdAt.desc`, {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        });
        if (res.ok) {
          const supabaseData = await res.json();
          if (Array.isArray(supabaseData) && supabaseData.length > 0) {
            this.cacheToIndexedDB(supabaseData);
            return supabaseData;
          }
        }
      }
    } catch (e) {}

    // 3. Fallback to IndexedDB (Client Offline Storage)
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
          idbData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return idbData;
        }
      } catch (err) {
        console.warn('IndexedDB fetch error:', err);
      }
    }

    // 4. Fallback to LocalStorage
    try {
      const localData = JSON.parse(localStorage.getItem('loykrathong_wishes') || '[]');
      return localData;
    } catch (e) {
      return [];
    }
  }

  // Cache list to IndexedDB
  cacheToIndexedDB(list) {
    if (!this.db || !Array.isArray(list)) return;
    try {
      const tx = this.db.transaction('wishes', 'readwrite');
      const store = tx.objectStore('wishes');
      list.forEach(item => {
        if (item && item.id) store.put(item);
      });
    } catch (e) {}
  }

  /**
   * Delete a wish by ID
   * @param {string} id 
   */
  async deleteWish(id) {
    // 1. Supabase delete
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        fetch(`${this.supabaseUrl}/rest/v1/wishes?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }).catch(() => {});
      } catch (e) {}
    }

    // 2. Server delete
    try {
      fetch(`/api/wishes/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    // 3. IndexedDB delete
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

    // 4. LocalStorage delete
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
