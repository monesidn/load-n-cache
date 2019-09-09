import {TimestampedValue} from '../persistance/PersistanceManager';

/**
 * Check if the given value is a promise, if so returns it as is;
 * If value is undefined a rejected promise is returned;
 * Otherwise wraps value into a Promise.
 * value is returned as-is.
 * @param  {any} value A value to wrap if necessary.
 * @return {Promise} The wrapped value or value itself.
 */
export async function toPromise(value: any): Promise<any> {
    if (value === undefined)
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject();

    // Using async this is autormatically wrapped into a promise so no explicit
    // check is required.
    return Promise.resolve(value);
}

/**
 * Type guard that checks that an is actually a TimestampedValue.
 * @param  {any} obj a javacript value
 * @return {boolean} Type check result.
 */
export function isTimestampedValue(obj: any): obj is TimestampedValue {
    return typeof obj.ts === 'number' && typeof obj.value !== 'undefined';
}