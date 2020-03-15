import { TimestampedValue, isTimestampedValue } from './TimestampedValue';

/**
 * Utility object to store a single promise and associated metadata that
 * will make handling easier.
 */
export class PromiseWithMetadata<T> {
    public readonly timestampedValue?: TimestampedValue<T>;

    /**
     * Creates a new Promise wrapper
     * @param {boolean} resolved Was this promise resolved?
     * @param {boolean} rejected  Was this promise rejected?
     * @param {number} completedAt When was this promise resolved or rejected?
     * @param {Promise} promise The promise this object wraps.
     * @param {any} value If the promise resolved the unwrapped value.
     */
    private constructor(
        public readonly resolved: boolean,
        public readonly rejected: boolean,
        public readonly completedAt: number,
        public readonly promise: Promise<T>,
        public readonly value?: T
    ) {
        if (resolved) {
            this.timestampedValue = {
                ts: this.completedAt,
                value: value!
            };
        }
    }

    /**
     * Static method to create a PromiseWithMetadata object.
     * @param {Promise | TimestampedValue} arg1
     */
    public static async from<T>(arg1: Promise<T> | TimestampedValue<T>): Promise<PromiseWithMetadata<T>> {
        if (isTimestampedValue(arg1)) {
            return new PromiseWithMetadata(true, false, arg1.ts, Promise.resolve(arg1.value), arg1.value);
        }

        let resolved: boolean;
        let value: T | undefined;
        try {
            value = await arg1;
            resolved = true;
        } catch (err) {
            resolved = false;
        }

        const ts = new Date().getTime();
        return new PromiseWithMetadata(resolved, !resolved, ts, arg1, value);
    }
}
