import {PersistanceManager} from './PersistanceManager';
import { isTimestampedValue } from '../util/types';
import { TimestampedValue } from '../util/timestamped';

/**
 * Simple root class for both localStorage and sessionStorage.
 */
class BasicBrowserStorage implements PersistanceManager<any> {
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
    loadValue(): Promise<any> {
        try {
            const readValue = JSON.parse(this.storage.getItem(this.key));
            if (isTimestampedValue(readValue)) {
                return Promise.resolve(readValue);
            }
            return Promise.resolve(); // Ignore not well formed value.
        } catch (ex) {
            return Promise.reject(ex);
        }
    }

    /**
     * Clears the storage
     */
    clear() {
        this.storage.removeItem(this.key);
    }
}

/**
 * The local storage implemenetation.
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
 * Dummy persistance manager. Used as a default.
 */
export class NoopManager implements PersistanceManager<any> {
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
        return Promise.resolve(undefined);
    }

    /**
     * Noop.
     */
    clear() {
    }
}
