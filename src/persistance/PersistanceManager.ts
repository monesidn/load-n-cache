
/**
 * DTO used to exchange data with the persistance Layer
 */
export interface TimestampedValue<T>{
    /**
     * The timestamp
     */
    ts: number;

    /**
     * The value.
     */
    value: T;
}

/**
 * Type guard to check that the object is a TimestampedValue.
 * @param obj 
 */
export function isTimestampedValue(obj: any): obj is TimestampedValue<any>{
    return obj && typeof obj.ts === 'number';
} 

/**
 * Provide logic to save and retrieve a value from storage.
 */
export interface PersistanceManager<T> {
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
