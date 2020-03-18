import { PersistenceManager } from './PersistenceManager';
import { TimestampedValue } from '../util/TimestampedValue';

/**
 * Simple root class for both localStorage and sessionStorage.
 */
class BasicBrowserStorage implements PersistenceManager<any> {
    /**
     * @param {any} storage Where to store values, local or session Storage.
     * @param {string} Key used to save/retrieve the value.
     */
    constructor(private storage: Storage, private key: string) {
    }

    /**
     * @param {any} value The value to persist.
     * @return {Promise} a Promise rejected if an error occurs.
     */
    saveValue(value: TimestampedValue<any>): Promise<any> {
        try {
            this.storage.setItem(this.key, JSON.stringify(value));
            return Promise.resolve();
        } catch (ex) {
            return Promise.reject(ex);
        }
    }
    /**
     * @return {Promise} a Promise containing the loaded value.
     */
    async loadValue(): Promise<any> {
        const data = this.storage.getItem(this.key);
        if (!data) return;
        return JSON.parse(data!);
    }

    /**
     * Clears the storage
     */
    clear() {
        this.storage.removeItem(this.key);
    }
}

/**
 * The local storage implementation.
 */
export class LocalStorageManager extends BasicBrowserStorage {
    /**
     * @param {string} key The key where data are saved to.
     */
    constructor(key: string) {
        super(localStorage, key);
    }
}

/**
 * The session storage implementation.
 */
export class SessionStorageManager extends BasicBrowserStorage {
    /**
     * @param {string} key The key where data are saved to.
     */
    constructor(key: string) {
        super(sessionStorage, key);
    }
}

/**
 * Dummy persistence manager. Used as a default.
 */
export class NoopManager implements PersistenceManager<any> {
    /**
     * Noop.
     * @return {Promise} a resolved promise
     */
    saveValue() {
        return Promise.resolve();
    }

    /**
     * Noop.
     * @return {Promise} a resolved promise
     */
    loadValue() {
        return Promise.resolve();
    }

    /**
     * Noop.
     */
    clear() {
    }
}
