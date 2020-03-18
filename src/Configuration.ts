import { PersistenceManager } from './persistence/PersistenceManager';
import { AutoflushManager } from './autoflush/AutoflushManager';

export interface Configuration<T>{
    /**
     * The load function. Must be provided.
     */
    loader?: () => any;

    /**
     * Don't want events to be dispatched? Set this to true. Defaults to false.
     */
    disableEvents?: boolean;

    /**
     * This configuration can be provided in two ways:
     * - Passing a number will specify how long (in milliseconds) the value should be kept.
     * As soon as time elapsed an automatic call to .flush() is executed.
     * - Passing a flushFn that will be called each time a new value is fetched.
     * Omitting this value or setting it to a value <= 0 will disable `autoFlush` entirely.
     */
    autoFlush?: number | AutoflushManager<T>;

    /**
     * Specify the persistence method to use. You can supply a string that identify one
     * of the default methods or an implementation of the PersistenceManager interface.
     * Default persistence methods assume that the promise result is JSON-serializable if this is not
     * the case use a custom serialization method or avoid persistence.
     * Currently there are 2 supported string values:
     * 'localStorage': the value is serialized as JSON and stored into localStorage.
     * 'sessionStorage': the value result is serialized as JSON and stored into sessionStorage.
     * Being localStorage and sessionStorage key-values storages you must also specify a "persistenceKey"
     * parameter.
     * Not specifying this parameter disable persistence.
     */
    persistence? : string | PersistenceManager<T>,

    /**
     * If persisting on a default key-value storage (like localStorage or sessionStorage) this option
     * specify the key to use to store data.
     */
    persistenceKey? : string;
}
