import { PromiseWithMetadata } from '../util/PromiseWithMetadata';


/**
 * Defines an object, providing a single method that will provide the
 * logic to autoflush fetched values.
 */
export interface AutoflushManager<T> {

    /**
     * When a value is fetched from persistance it may be already expired. This
     * method is called after a value is read to check this condition. If this
     * method return resolve to true the `fetched` method will be called.
     * @param value
     */
    isExpired(value: PromiseWithMetadata<T>): Promise<boolean>;

    /**
     * Every time a new value is fetched this method will be called. When the
     * passed value will expire the implementation must invoke the provided
     * `flushCb`.
     *
     * Remember that:
     * - Never call the LoadNCache flush() method directly. Calling the provided
     *   callback will ensure that you will flush exactly the value you were passed
     *   that is not necessarly the last one.
     * - If the flush policy is based on time use the timestamp from the `value`
     *   object, never the current one. Thus will prevent inconsistant behaviour
     *   with values fetched from persistance.
     */
    fetched(value: PromiseWithMetadata<T>, flushCb: () => void): void;

    /**
     * When a value is flushed by other means this method will be called. This
     * call allow implementation to perform cleanup like clearTimeout or similar.
     * The `value` object will be the same that was passed to the `fetched` method.
     */
    flushed(value: PromiseWithMetadata<T>): void;
}
