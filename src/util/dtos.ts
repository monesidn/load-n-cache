
export interface PromiseAndTimestamp<T>{
    /**
     * The timestamp.
     */
    ts: number;

    /**
     * The promise.
     */
    promise: Promise<T>;
}