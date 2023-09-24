export const StringType = String.prototype
export const NumberType = Number.prototype
export const ArrayType = Array.prototype
export const ObjectType = Object.prototype
export const BooleanType = Boolean.prototype
export const BigIntType = BigInt.prototype
export const SymbolType = Symbol.prototype
export const DateType = Date.prototype
export const AutoIncrement = BigIntType
export const DBTypesArray = [StringType, NumberType, ArrayType, ObjectType, BooleanType, BigIntType, SymbolType, DateType, AutoIncrement] as const
const READWRITE = "readwrite"

export interface IDBQueries<T> {
  getOne: (column: keyof T | number, value?: string | number) => Promise<T | null>;
  getMany: (column?: keyof T, value?: string | number, order?: 'asc' | 'desc') => Promise<T[]>
  createOne: (value: Omit<T, 'id'>) => Promise<T>
  createMany: (value: Omit<T, 'id'>[]) => Promise<T[]>
  updateOne: (option: { column: keyof T, value: string | number } | number, update: Partial<T>) => Promise<boolean>
  updateMany: (option: { column: keyof T, value: string | number }, update: Partial<T>) => Promise<boolean>
  deleteOne: (option: { column: keyof T, value: string | number } | number) => Promise<boolean>
  deleteMany: (option?: { column: keyof T, value: string | number }) => Promise<boolean>
}

export interface IDBExtMethods<T> {
  $transaction: {
    deleteDatabase: () => Promise<boolean>
  }
}

export type IDBResponse<T> = {
  [key in keyof T]: IDBQueries<T[key]>
} & IDBExtMethods<keyof T>;

export const IndexedDatabase = <T extends { [key: string]: any }>(dbName: string,
  {
    schema,
    version = 1,
  }: {
    schema: T,
    version?: number,
  })
  : Promise<IDBResponse<typeof schema>> => new Promise((resolve, reject) => {
    const methods = (db: IDBDatabase) => (({
      ...Object.fromEntries(tables.map(tableName =>
        [tableName, {
          getOne: (column: string | number, value?: string | number, order: 'asc' | 'desc' = 'asc') => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            const get = typeof column === 'string' && value ? store.index(column).get(value) : store.get(column);
            get.onsuccess = (e) => {
              resolve((e.target as any).result ?? null)
            }
            get.onerror = () => reject('Unable to retrieve data');
          }),
          getMany: (column?: string, value?: string | number, order: 'asc' | 'desc' = 'asc') => new Promise((resolve, reject) => {
            if (!column || !value) {
              const store = db.transaction([tableName], READWRITE).objectStore(tableName)
              store.getAll().onerror = () => reject('Unable to retrieve data');
              store.getAll().onsuccess = (e) => resolve((e.target as any).result)
            } else {
              const data: any = [];
              const store = db.transaction([tableName], READWRITE).objectStore(tableName).index(column);
              store.openCursor(IDBKeyRange.only(value)).onerror = (e) => reject('Unable to retrieve data');
              store.openCursor(IDBKeyRange.only(value), order === 'asc' ? 'next' : 'prev').onsuccess = (e) => {
                const cursor = (e.target as any).result;
                if (cursor) {
                  data.push(cursor.value)
                  cursor.continue();
                } else {
                  resolve(data)
                }
              }
            }
          }),
          createOne: (value: any) => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            if (schema[tableName]?.id === AutoIncrement) {
              store.openCursor(null, 'prev').onsuccess = (e) => {
                const id = ((e.target as any)?.result?.primaryKey ?? 0) + 1
                value = { ...value, id }
                store.add(value);
              };
            } else {
              store.add(value);
            }
            store.transaction.oncomplete = () => resolve(value)
            store.transaction.onerror = () => reject('Unable to insert value')
          }),
          createMany: (values: any[]) => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            if (schema[tableName]?.id === AutoIncrement) {
              store.openCursor(null, 'prev').onsuccess = (e) => {
                const id = ((e.target as any)?.result?.primaryKey ?? 0) + 1
                for (let i = 0; i < values.length; i++) {
                  store.add({ ...values[i], id: id + i })
                }
              }
            } else {
              values.forEach(value => {
                store.add(value)
              });
            }
            store.transaction.oncomplete = () => resolve(values)
            store.transaction.onerror = () => reject('Unable to insert values')
          }),
          updateOne: (option: { column: string, value: any } | number, update: any) => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            const result = typeof option === 'number' ? store.openCursor(option) : store.index(option.column).openCursor(option.value)
            result.onsuccess = (e) => {
              const cursor = (e.target as any).result;
              if (cursor) {
                const newValue = cursor.value?.id ? { ...cursor.value, ...update, id: cursor.value?.id } : { ...cursor.value, ...update }
                cursor.update(newValue)
                resolve(true)
              } else {
                reject(false)
              }
            }
          }),
          updateMany: (option: { column: string, value: any }, update: any) => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            store.index(option.column).openCursor(IDBKeyRange.only(option.value)).onsuccess = (e) => {
              const cursor = (e.target as any).result;
              if (cursor) {
                cursor.update({ ...cursor.value, ...update })
                cursor.continue();
              }
            }
            store.transaction.oncomplete = () => resolve(true);
            store.transaction.onerror = () => reject(false);
          }),
          deleteOne: (option: { column: string, value: any } | number,) => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            const result = typeof option === 'number' ? store.openCursor(option) : store.index(option.column).openCursor(option.value)
            result.onsuccess = (e) => {
              const cursor = (e.target as any).result;
              if (cursor) {
                cursor.delete()
                resolve(true)
              } else {
                reject(false)
              }
            }
          }),
          deleteMany: (option?: { column: string, value: any }) => new Promise((resolve, reject) => {
            const store = db.transaction([tableName], READWRITE).objectStore(tableName);
            if (!option) {
              store.clear();
            } else {
              store.index(option.column).openCursor(option.value).onsuccess = (e) => {
                const cursor = (e.target as any).result;
                if (cursor) {
                  cursor.delete()
                  cursor.continue();
                }
              }
            }
            store.transaction.oncomplete = () => resolve(true);
            store.transaction.onerror = () => reject(false);
          }),
        }]
      )),
      $transaction: {
        deleteDatabase: () => new Promise((resolve, reject) => {
          let store = indexedDB.deleteDatabase(dbName)
          store.onsuccess = () => resolve(true);
          store.onerror = () => reject(false);
        })
      }
    } as IDBResponse<typeof schema>))

    const tables = Object.keys(schema);

    for (let i = 0; i < tables.length; i++) {
      const object = schema[tables[i]]
      for (const key in object) {
        if (!DBTypesArray.includes(object[key])) {
          reject('Invalid schema')
        }
      }
    }

    const openDB = window.indexedDB.open(dbName, version);
    openDB.onerror = () => {
      reject('IndexedDB not available on this browser')
    }
    openDB.onsuccess = (e) => {
      resolve(methods((e.target as any)?.result as IDBDatabase))
    }
    openDB.onupgradeneeded = (e) => {
      const db = (e.target as any)?.result as IDBDatabase
      const deleteTables = Array.from(db.objectStoreNames).filter(tableName=> !tables.includes(tableName))
      deleteTables.map((tableName) => {
        try {
          db.deleteObjectStore(tableName);
          return true;
        } catch (error: any) {
          return false;
        }
      })
      tables.forEach(tableName => {
        const tableKeys = Object.keys(schema[tableName]);
        try {
          const objectStore = db.createObjectStore(tableName, { autoIncrement: true });
          tableKeys.forEach(tableKey => {
            objectStore.createIndex(tableKey, tableKey, { unique: false });
          });
        } catch (error: any) {
        }
      });
    }
  })
