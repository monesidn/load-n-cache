import { TimestampedValue } from '../util/TimestampedValue';


/**
 * Provide logic to save and retrieve a value from storage.
 */
export interface PersistenceManager<T> {
    /**
     * This method must load the value from storage. If no value is available
     * return a rejected promise without error.
     */
    loadValue: () => Promise<TimestampedValue<T> | void>;

    /**
     * Save a new value to the storage.
     */
    saveValue: (value: TimestampedValue<T>) => Promise<any>;

    /**
     * When this method is called if a persisted value is available
     * it must be erased.
     */
    clear: ()=> void;
}
