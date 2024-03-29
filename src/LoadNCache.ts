import { EventEmitter } from "eventemitter3";
import { AutoflushManager } from "./autoflush/AutoflushManager";
import { DefaultAutoflushManager } from "./autoflush/DefaultAutoflushManager";
import { Configuration } from "./Configuration";
import { LocalStorageManager, NoopManager, SessionStorageManager } from "./persistence/DefaultStorages";
import { PersistenceManager } from "./persistence/PersistenceManager";
import { PromiseWithMetadata } from "./util/PromiseWithMetadata";
import { isTimestampedValue } from "./util/TimestampedValue";

const defaultCfg: Partial<Configuration<unknown>> = {
    disableEvents: false,
    autoFlush: 0,
    persistence: new NoopManager()
};

const defaultPersistenceManagers: { [index: string]: (key: string) => PersistenceManager<any> } = {
    localStorage: (key: string) => new LocalStorageManager(key),
    sessionStorage: (key: string) => new SessionStorageManager(key)
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
     * Persistence manager casted to right type.
     */
    private readonly persistenceManager: PersistenceManager<T>;

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
     * The LoadNCache constructor accept an options object. If default options
     * are ok for you then you can pass in a function. Passing a function is equivalent to  passing
     * only the loader option in the options parameter.
     * @param {any} cfg Instance settings or a load function.
     */
    constructor(cfg: Configuration<T> | (() => Promise<T>)) {
        super();

        this.config = Object.assign({}, defaultCfg, typeof cfg === "function" ? { loader: cfg } : cfg);

        if (typeof this.config.loader !== "function") {
            throw new Error("No loader function given or it is not a function!");
        }

        // Resolve persistence manager if a name was given.
        if (typeof this.config.persistence === "string") {
            const pm = defaultPersistenceManagers[this.config.persistence];
            const pmKey = this.config.persistenceKey;
            if (pm && pmKey) {
                this.persistenceManager = pm(pmKey);
            } else {
                console.error(
                    `Unknown persistence manager requested (${this.config.persistence}) ` +
                        `or empty persistenceKey. Defaulting to Noop.`
                );
                this.persistenceManager = new NoopManager();
            }
        } else if (this.config.persistence) {
            this.persistenceManager = this.config.persistence as PersistenceManager<T>;
        } else {
            this.persistenceManager = new NoopManager();
        }

        // Resolve autoflush manager when a number is passed.
        if (this.config.autoFlush !== undefined) {
            if (typeof this.config.autoFlush === "number") {
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
        return this.config.loader();
    }

    /**
     * This method load a new value from storage or by calling a loadFunction.
     * As soon as the value is available (which can be also a rejected promise) its
     * stored as a promise along with the timestamp.
     */
    private async loadNewValue(): Promise<PromiseWithMetadata<T>> {
        if (this.firstLoad) {
            try {
                const val = await this.persistenceManager.loadValue();

                // If val is not the type of object we expect or is already
                // expired we're going to ignore it.
                if (isTimestampedValue(val)) {
                    const metadata = await PromiseWithMetadata.from(val);
                    if (this.autoflushManager) {
                        const expired = await this.autoflushManager.isExpired(metadata);
                        if (!expired) return metadata;
                    } else {
                        return metadata;
                    }
                }
            } catch (err) {
                // If we have an error we print it for the sake of debugging but
                // no further actions are required.
                if (err) console.warn("Persistence error while loading value.", err);
            }
        }

        return PromiseWithMetadata.from(this.callLoadFunction());
    }

    /**
     * Calls the persistenceManager saveValue method handling exceptions.
     * @param {PromiseWithMetadata} promise The PromiseWithMetadata object that stores the data to persist.
     */
    private async safelyCallPersist(promise: PromiseWithMetadata<T>) {
        const toPersist = promise.timestampedValue;
        try {
            if (toPersist) await this.persistenceManager.saveValue(toPersist);
        } catch (err) {
            console.warn("Error while persisting value", toPersist, err);
        }
    }

    /**
     * Calls the persistenceManager clear method handling exceptions.
     */
    private async safelyCallClear() {
        try {
            await this.persistenceManager.clear();
        } catch (err) {
            console.warn("Error while clearing persisted value", err);
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
     * Retrieve the value. Always returns a promise. This call will result in the invocation of
     * loadFunction if no cached value is available at the time.
     * @return {Promise} A promise that will be resolved with the value or reject if fetching fails.
     */
    public get() {
        if (!this.promise) {
            if (!this.config.disableEvents) this.emit("before-load", this);

            /**
             * Can't use async here because the promise field must be setted
             * immediately to avoid multiple calls to the loadFn.
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

                if (!this.config.disableEvents) this.emit("after-load", this);

                return metadata.promise;
            });
        }

        return this.promise;
    }

    /**
     * Invalidate the currently cached value if any. If no value is cached then this method does nothing.
     * Each subsequent call to `.get()` will get a different promise object then before.
     */
    public async flush() {
        if (!this.metadata) {
            return;
        }

        if (!this.config.disableEvents) this.emit("before-flush", this);

        if (this.autoflushManager) {
            this.autoflushManager.flushed(this.metadata);
        }

        this.metadata = undefined;
        this.promise = undefined;
        await this.safelyCallClear();

        if (!this.config.disableEvents) this.emit("after-flush", this);
    }

    /**
     * Shortcut for calling `.flush()` and `.get()`. Returns the promise from `.get()`.
     * @return {Promise} the same promise that .get() would return.
     */
    public async refresh() {
        await this.flush();
        return this.get();
    }
}
