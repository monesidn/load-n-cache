import { PersistenceManager } from "./persistence/PersistenceManager";
import { AutoflushManager } from "./autoflush/AutoflushManager";

export interface Configuration<T> {
    /**
     * The load function. Must be provided.
     * As the name suggests, this is a function responsible for loading the data
     * that are going to catchd. It may return a primitive value, an object or a promise,
     * so also async functions are welcome. There are no constraints on how the value can obtained.
     *
     * @returns The return value of the loadFunction is handled as follows
     * - if it is undefined, null or any other value, except for Promises, it is wrapped into a
     * resolved promise and stored;
     * - If it is a Promise the value is stored as is.
     * The loadFunction should be stateless as it may be called immediately, in the future or never.
     */
    loader: () => T | Promise<T>;

    /**
     * Don't want events to be dispatched? Set this to true. Defaults to false.
     */
    disableEvents?: boolean;

    /**
     * Specify the autoflush policy. It can be an object that implements a custom logic or a number.
     * - Passing a number will specify how long (in milliseconds) the value should be kept. In other words
     * the number is handled like a time to live. This means that, after a value is fetched, it is
     * retained for up to the specified number of milliseconds and then `flush()` is called.
     * - You can pass an object implementing the {@link AutoflushManager} interface to specify a custom
     * behavior.
     *
     * Omitting this value or setting it to a value <= 0 will disable `autoFlush` entirely.
     */
    autoFlush?: number | AutoflushManager<T>;

    /**
     * Specify the persistence method to use. You can supply a string that identify one
     * of the default methods or an implementation of the PersistenceManager interface.
     * Default persistence methods assume that the promise result is JSON-serializable. If this is not
     * the case use a custom serialization method or avoid persistence.
     * Currently there are 2 supported string values:
     * - 'localStorage': the value is serialized as JSON and stored into localStorage.
     * - 'sessionStorage': the value result is serialized as JSON and stored into sessionStorage.
     * Being localStorage and sessionStorage key-values storages you must also specify a "persistenceKey"
     * parameter.
     * Not specifying this parameter disable persistence.
     */
    persistence?: string | PersistenceManager<T>;

    /**
     * If persisting on a default key-value storage (like localStorage or sessionStorage) this option
     * specify the key to use to store data.
     */
    persistenceKey?: string;
}
