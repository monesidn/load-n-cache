import { AutoflushManager } from './AutoflushManager';
import { TimestampedValue } from '../util/TimestampedValue';
import { PromiseWithMetadata } from '../util/PromiseWithMetadata';

/**
 * Default implementation of AutoflushManager that mark a value expired after
 * a fixed amount of time.
 */
export class DefaultAutoflushManager implements AutoflushManager<any> {
    private timeout?: number;

    /**
     * Construct the manager providing the ttl to use.
     * @param {number} ttl The ttl. Milliseconds.
     */
    constructor(private readonly ttl: number) {
    }

    /**
     * This method computes how long a value fetched at the given timestamp
     * has left to live according to the configuration.
     * @param {number} timestamp The timestamp to inspect
     * @return {number} How long the value should be retained.
     */
    private computeTtl(timestamp: number) {
        const now = new Date().getTime();
        const flushAt = timestamp + this.ttl;
        return flushAt - now;
    }

    /**
     * Performs a check on the timestamp.
     * @param {TimestampedValue} value
     */
    async isExpired(value: PromiseWithMetadata<any>) {
        return this.computeTtl(value.completedAt) <= 0;
    }


    /**
     * Setup the timeout.
     * @param {PromiseWithMetadata} value
     * @param {Function }flushCb
     */
    fetched(value: PromiseWithMetadata<any>, flushCb: () => void): void {
        setTimeout(flushCb, this.computeTtl(value.completedAt));
    }

    /**
     * Clear the timeout.
     */
    flushed(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }
}
