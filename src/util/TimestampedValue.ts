/**
 * DTO used to exchange data with the persistence Layer
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
 * @param {any} obj The object to inspect
 * @return {boolean} whatever it is.
 */
export function isTimestampedValue(obj: any): obj is TimestampedValue<any> {
    return obj && typeof obj.ts === 'number';
}
