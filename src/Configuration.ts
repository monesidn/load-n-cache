import {PersistanceManager} from './persistance/PersistanceManager';

export interface Configuration<T>{
    /**
     * The load function. Must be provided.
     */
    loader?: () => any;

    /**
     * Don't want events to be dispathed? Set this to true. Defaults to false.
     */
    disableEvents?: boolean;

    /**
     * How long (in millis) the value should be kept. As soon as time elapsed
     * an automatic call to .flush() is executed. Setting it to 0 or a negative
     * value disable this feature. Defaults to 0.
     */
    autoFlushTime?: number;

    /**
     * Specify the persistance method to use. You can supply a string that identify one
     * of the default methods or an implementation of the PersistanceManager interface.
     * Default persistance methods assume that the promise result is JSON-serializable if this is not
     * the case use a custom serialization method or avoid persistance.
     * Currently there are 2 supported string values:
     * 'localStorage': the value is serialized as JSON and stored into localStorage.
     * 'sessionStorage': the value result is serialized as JSON and stored into sessionStorage.
     * Being localStorage and sessionStorage key-values storages you must also specify a "persistanceKey"
     * parameter.
     * Not specifying this parameter disable persistance.
     */
    persistance? : string | PersistanceManager<T>,

    /**
     * If persisting on a default key-value storage (like localStorage or sessionStorage) this option
     * specify the key to use to store data.
     */
    persistanceKey? : string;
}
