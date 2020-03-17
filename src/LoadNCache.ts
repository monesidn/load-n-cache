import { EventEmitter } from 'eventemitter3';
import { AutoflushManager } from './autoflush/AutoflushManager';
import { DefaultAutoflushManager } from './autoflush/DefaultAutoflushManager';
import { Configuration } from './Configuration';
import { LocalStorageManager, NoopManager, SessionStorageManager } from './persistance/DefaultStorages';
import { PersistanceManager } from './persistance/PersistanceManager';
import { PromiseWithMetadata } from './util/PromiseWithMetadata';
import { isTimestampedValue } from './util/TimestampedValue';


const defaultCfg: Configuration<any> = {
    disableEvents: false,
    autoFlush: 0,
    persistance: new NoopManager()
};

const defaultPersistanceManagers: { [index: string]: (key: string) => PersistanceManager<any> } = {
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
    private readonly config: Configuration<T>;

    /**
     * AutoflushManager casted to right type.
     */
    private readonly autoflushManager?: AutoflushManager<T>;

    /**
     * Persistance manager casted to right type.
     */
    private readonly persistanceManager: PersistanceManager<T>;

    /**
     * Metadata associated to the promise below.
     */
    private metadata?: PromiseWithMetadata<T>;

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
    constructor(cfg: Configuration<T> | (() => Promise<T>)) {
        super();

        this.config = Object.assign({}, defaultCfg, typeof cfg === 'function' ? { loader: cfg } : cfg);

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
        } else if (this.config.persistance) {
            this.persistanceManager = this.config.persistance as PersistanceManager<T>;
        } else {
            this.persistanceManager = new NoopManager();
        }

        // Resolve autoflush manager when a number is passed.
        if (this.config.autoFlush !== undefined) {
            if (typeof this.config.autoFlush === 'number') {
                if (this.config.autoFlush <= 0) {
                    this.autoflushManager = undefined;
                } else {
                    this.autoflushManager = new DefaultAutoflushManager(this.config.autoFlush);
                }
            } else {
                this.autoflushManager = this.config.autoFlush;
            }
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
    private async loadNewValue(): Promise<PromiseWithMetadata<T>> {
        if (this.firstLoad) {
            try {
                const val = await this.persistanceManager.loadValue();

                // If val is not the type of object we expect or is already
                // expired we'r going to ignore it.
                if (isTimestampedValue(val)) {
                    const metadata = await PromiseWithMetadata.from(val);
                    if (this.autoflushManager) {
                        const expired = await this.autoflushManager.isExpired(metadata);
                        if (!expired)
                            return metadata;
                    } else {
                        return metadata;
                    }
                }
            } catch (err) {
                // If we have an error we print it for the sake of debugging but
                // no further actions are required.
                if (err)
                    console.warn('Persistance error while loading value.', err);
            }
        }

        return PromiseWithMetadata.from(this.callLoadFunction());
    }

    /**
     * Calls the persistanceManager saveValue method handling exceptions.
     * @param {PromiseWithMetadata} promise The PromiseWithMetadata object that stores the data to persist.
     */
    private async safelyCallPersist(promise: PromiseWithMetadata<T>) {
        const toPersist = promise.timestampedValue;
        try {
            if (toPersist)
                await this.persistanceManager.saveValue(toPersist);
        } catch (err) {
            console.warn('Error while persisting value', toPersist, err);
        }
    }

    /**
     * Calls the persistanceManager clear method handling exceptions.
     */
    private async safelyCallClear() {
        try {
            await this.persistanceManager.clear();
        } catch (err) {
            console.warn('Error while clearing persisted value', err);
        }
    }

    /**
     * Returns a new flush callback.
     * @param {PromiseWithMetadata} metadata The object that this callback will flush.
     * @return {Function} the callback function.
     */
    private prepareFlushCbFor(metadata: PromiseWithMetadata<T>) {
        return () => {
            if (this.metadata === metadata) {
                this.flush();
            }
        };
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

            /**
             * Can't use async here because the promise field must be setted
             * immediatly to avoid multiple calls to the loadFn.
             */
            this.promise = this.loadNewValue().then(async (metadata: PromiseWithMetadata<T>) => {
                this.metadata = metadata;

                if (this.metadata.resolved) {
                    await this.safelyCallPersist(this.metadata);
                }
                if (this.autoflushManager) {
                    const cb = this.prepareFlushCbFor(this.metadata);
                    this.autoflushManager.fetched(this.metadata, cb);
                }

                if (!this.config.disableEvents)
                    this.emit('after-load', this);

                return metadata.promise;
            });
        }

        return this.promise;
    }

    /**
     * Flush the current cached value.
     */
    public async flush() {
        if (!this.metadata) {
            return;
        }

        if (!this.config.disableEvents)
            this.emit('before-flush', this);


        if (this.autoflushManager) {
            this.autoflushManager.flushed(this.metadata);
        }

        this.metadata = this.metadata;
        this.promise = undefined;
        await this.safelyCallClear();

        if (!this.config.disableEvents)
            this.emit('after-flush', this);
    }

    /**
     * Shortcut to call flush() and get() one after the other.
     * @return {Promise} the same promise that .get() whould return.
     */
    public async refresh() {
        await this.flush();
        return this.get();
    }
}
