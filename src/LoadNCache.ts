import {EventEmitter} from 'eventemitter3';
import {Configuration} from './Configuration';
import {LocalStorageManager, SessionStorageManager, NoopManager} from './persistance/DefaultStorages';
import {PersistanceManager, isTimestampedValue, TimestampedValue} from './persistance/PersistanceManager';
import {PromiseAndTimestamp} from './util/dtos';


const defaultCfg : Configuration<any> = {
    disableEvents: false,
    autoFlushTime: 0,
    persistance: new NoopManager()
};

const defaultPersistanceManagers : {[index:string]: (key:string) => PersistanceManager<any>} = {
    'localStorage': (key: string) => new LocalStorageManager(key),
    'sessionStorage': (key: string) => new SessionStorageManager(key)
};

/**
 * The main class of this project. Check README.md for documentation.
 */
export class LoadNCache<T> extends EventEmitter {
    /**
     * The actual configuration including defaults.
     */
    private config : Configuration<T>;

    /**
     * Persistance manager casted to right type.
     */
    private persistanceManager: PersistanceManager<T>;

    /**
     * The promise holding the value.
     */
    private promise?: Promise<T>;

    /**
     * Is this the first time we load a value?
     */
    private firstLoad = true;

    /**
     * Initialize the object with given setting.
     * @param {any} cfg Instance settings or a load function.
     */
    constructor(cfg : Configuration<T> | (()=> Promise<T>)) {
        super();

        this.config = Object.assign({}, defaultCfg, typeof cfg === 'function' ? {loader: cfg} : cfg);

        if (typeof this.config.loader !== 'function') {
            throw new Error('No loader function given or it is not a function!');
        }

        // Resolve persistance manager if a name was given.
        if (typeof this.config.persistance === 'string') {
            const pm = defaultPersistanceManagers[this.config.persistance];
            const pmKey = this.config.persistanceKey;
            if (pm && pmKey) {
                this.persistanceManager = pm(pmKey);
            } else {
                console.error(`Unknown persistance manager requested (${this.config.persistance}) ` +
                                `or empty persistanceKey. Defaulting to Noop.`);
                this.persistanceManager = new NoopManager();
            }
        } else {
            this.persistanceManager = this.config.persistance as PersistanceManager<T>;
        }
    }

    /**
     * Prepare the auto flush according to configuration. If this feature
     * is disabled by configuration this method does nothing.
     * @param {number} fetchTs When was the value fetched.
     */
    private setupAutoflush(fetchTs: number) {
        const ttl = this.computeTtl(fetchTs!);
        if (ttl === Infinity)
            return;

        if (ttl <= 0) {
            // Should already be flushed!
            this.flush();
        } else {
            setTimeout(() => this.flush(), ttl);
        }
    }

    /**
     * This method computes how long a value fetched at the given timestamp
     * has left to live according to the configuration. If autoflush is
     * disable this method always returns Infinity.
     * @param {number} timestamp The timestamp to inspect
     * @return {number} Infinity if the value should not autoexpire, a positive number if it still
     * valid, 0 or negative if it is expired.
     */
    private computeTtl(timestamp: number) {
        if (!this.config.autoFlushTime || this.config.autoFlushTime < 0)
            return Infinity;

        const now = new Date().getTime();
        const flushAt = timestamp + this.config.autoFlushTime;
        return flushAt - now;
    }

    /**
     * Calls the saveValue() method and handle errors.
     * @param {TimestampedValue<T>} val The value
     */
    private async persistData(val: TimestampedValue<T>) {
        try {
            await this.persistanceManager.saveValue(val);
        } catch (err) {
            console.warn('Persistance error while saving data: ', err);
        }
    }

    /**
     * Invoke the loadFunction ensuring that its returned value is a promise.
     * The check is ensured implicitly by using the async qualifier.
     */
    private async callLoadFunction() {
        return this.config.loader!();
    }

    /**
     * This method load a new value from storage or by calling a loadFunction.
     * As soon as the value is available (which can be also a rejected promise) its
     * stored as a promise along with the timestamp.
     */
    private async loadNewValue() : Promise<PromiseAndTimestamp<T>> {
        if (this.firstLoad) {
            try {
                const val = await this.persistanceManager.loadValue();

                // If val is not the type of object we expect we ignore it. This
                // is also the case when no value was found.
                if (isTimestampedValue(val)) {
                    if (this.computeTtl(val.ts) > 0) {
                        return {ts: val.ts, promise: Promise.resolve(val.value)};
                    }
                }
            } catch (err) {
                // If we have an error we print it for the sake of debugging but
                // no further actions are required.
                if (err)
                    console.warn('Persistance error while loading value.', err);
            }
        }

        // We need to call the loading function.
        let promise : Promise<T>;
        let ts;
        try {
            // Resolved promise handling
            const value = await this.callLoadFunction();
            promise = Promise.resolve(value);
            ts = new Date().getTime();
            await this.persistData({ts, value});
        } catch (err) {
            // Rejected promises
            promise = Promise.reject(err);
            ts = new Date().getTime();
        }

        return {ts, promise: promise!};
    }

    /**
     * Returns the requested value. Could be a freshly downloaded value
     * or a stored one.
     * @return {Promise} A promise that will be resolved with the value or reject if fetching fails.
     */
    public get() {
        if (!this.promise) {
            if (!this.config.disableEvents)
                this.emit('before-load', this);

            this.promise = this.loadNewValue().then((pnt) => {
                this.setupAutoflush(pnt.ts);

                if (!this.config.disableEvents)
                    this.emit('after-load', this);

                return pnt.promise;
            });
        }


        return this.promise;
    }

    /**
     * Flush the current cached value.
     */
    public flush() {
        if (!this.config.disableEvents)
            this.emit('before-flush', this);

        this.promise = undefined;
        try {
            this.persistanceManager.clear();
        } catch (err) {
            console.warn('Persistance error while flushing value.', err);
        }


        if (!this.config.disableEvents)
            this.emit('after-flush', this);
    }

    /**
     * Shortcut to call flush() and get() one after the other.
     * @return {Promise} the same promise that .get() whould return.
     */
    public refresh() {
        this.flush();
        return this.get();
    }
}
