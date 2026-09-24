/* Crafted Quarters – offline storage (IndexedDB) */
const DB = (() => {
  const NAME = 'crafted-quarters-db';
  const VERSION = 1;
  const STORES = ['docs', 'clients', 'items', 'meta'];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach(s => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      let result;
      Promise.resolve(fn(s)).then(r => { result = r; });
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  return {
    all: store => tx(store, 'readonly', s => reqP(s.getAll())),
    get: (store, id) => tx(store, 'readonly', s => reqP(s.get(id))),
    put: (store, obj) => tx(store, 'readwrite', s => reqP(s.put(obj))),
    del: (store, id) => tx(store, 'readwrite', s => reqP(s.delete(id))),
    clear: store => tx(store, 'readwrite', s => reqP(s.clear())),
    async bulkPut(store, arr) {
      return tx(store, 'readwrite', s => { arr.forEach(o => s.put(o)); });
    },
    async exportAll() {
      const out = { app: 'crafted-quarters', version: 1, exportedAt: new Date().toISOString() };
      for (const s of STORES) out[s] = await this.all(s);
      return out;
    },
    async importAll(data) {
      if (!data || data.app !== 'crafted-quarters') throw new Error('This is not a Crafted Quarters backup file.');
      for (const s of STORES) {
        await this.clear(s);
        if (Array.isArray(data[s]) && data[s].length) await this.bulkPut(s, data[s]);
      }
    }
  };
})();
