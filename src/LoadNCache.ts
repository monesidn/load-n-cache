import {EventEmitter} from 'eventemitter3';
import {toPromise} from './util/types';
import {Configuration} from './Configuration';
import {LocalStorageManager, SessionStorageManager, NoopManager} from './persistance/DefaultStorages';
import {PersistanceManager} from './persistance/PersistanceManager';
import { TimestampedValue } from './util/timestamped';


const defaultCfg : Configuration<any> = {
    disableEvents: false,
    autoFlushTime: 0,
    persistance: new NoopManager()
};

const defaultPersistanceManagers = {
    'localStorage': (key) => new LocalStorageManager(key),
    'sessionStorage': (key) => new SessionStorageManager(key)
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
     * The promise holding the value.
     */
    private promise: Promise<T>;

    /**
     * When was the value fetched? Primarily used to setup autoflush.
     */
    private promiseTs: number;

    /**
     * Is this the first time we load a value?
     */
    private firstLoad = true;

    /**
     * Initialize the object with given setting.
     * @param {any} cfg Instance settings or a load function.
     */
    constructor(cfg : ()=>any | Configuration<T>) {
        super();

        this.config = Object.assign({}, defaultCfg, typeof cfg === 'function' ? {loader: cfg} : cfg);

        if (typeof this.config.loader !== 'function') {
            throw new Error('No loader function given or it is not a function!');
        }

        // Resolve persistance manager if a name was given.
        if (typeof this.config.persistance === 'string') {
            let pm = defaultPersistanceManagers[this.config.persistance];
            if (pm === undefined) {
                console.error(`Unknown persistance manager requested (${this.config.persistance}). `+
                                `Defaulting to Noop.`);
                pm = new NoopManager();
            }
            this.config.persistance = pm(this.config.persistanceKey);
        }
    }

    /**
     * This async function try to load the value from the storage the first time it is
     * called, per instance. If no value is available or it was called already it returns
     * undefined. 
     * @return {Promise} a promise that is resolved with the value or undefined if no value is found.
     */
    private async loadFromStorageFirstTime() : Promise<TimestampedValue<T>>{
        if (!this.firstLoad)
            return;

        this.firstLoad = false;
        try{
            const v = await (this.config.persistance as PersistanceManager<T>).loadValue();
            if (!v || v.promise === undefined)
                return;
            return v;
        }
        catch(err){
            console.debug('Persistance manager error', err);
            return;
        }
    }

    /**
     * Try to load a value from the storage. If we don't find a value or an error occurs we fallback
     * to the loadFunction.
     * @return {Promise} a promise that is resolved with the value or undefined if no value is found.
     */
    private async loadNextValue() : Promise<TimestampedValue<T>>{
        const loaded = await this.loadFromStorageFirstTime();
        if (loaded !== undefined){
            return loaded;
        }else{
            return {
                ts: new Date().getTime(),
                promise: toPromise(this.config.loader())
            };
        }
    }

    private setupAutoflush(){
        if (!this.config.autoFlushTime || this.config.autoFlushTime < 0)
            return;
        
        const now = new Date().getTime();
        const flushAt = this.promiseTs + this.config.autoFlushTime;
        if (now <= flushAt){
            // Should already be flushed!
            this.flush();
        }
        else{
            setTimeout(() => this.flush(), now - flushAt);
        }
    }

    /**
     * This is the method responsible for storing a new value into
     * the value field.
     */
    private fetchNewValue() {
        this.emit('beforeLoad', this);
        
        this.promise = this.loadNextValue()
                            .then((value: TimestampedValue<T>) => {
                                // The value obtained from the loadFunction is decorated with 
                                // a timestamp. We need to unwrap it before returning the value
                                // to the caller.
                                this.promiseTs = value.ts;
                                this.setupAutoflush();
                                return value.promise;
                            },
                            (err) => {
                                // We cache the rejection that may still be autoflushed.
                                this.promiseTs = new Date().getTime();
                                this.setupAutoflush();
                                return Promise.reject(err);
                            });

        this.emit('afterLoad', this);
    }

    /**
     * Returns the requested value. Could be a freshly downloaded value
     * or a stored one.
     * @return {Promise} A promise that will be resolved with the value or reject if fetching fails.
     */
    public get() : Promise<T> {
        if (!this.promise) {
            this.fetchNewValue();
        }
        return this.promise;
    }

    /**
     * Flush the current cached value.
     */
    public flush() {
        this.emit('beforeFlush', this);
        this.promise = undefined;
        (this.config.persistance as PersistanceManager<T>).clear();
        this.emit('afterFlush', this);
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
