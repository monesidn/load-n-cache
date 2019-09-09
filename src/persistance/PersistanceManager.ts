import { TimestampedValue } from "../util/timestamped";


export interface PersistanceManager<T> {
    loadValue: () => Promise<TimestampedValue<T> | undefined>;
    saveValue: (value: TimestampedValue<T>) => Promise<any>;
    clear: ()=> void;
}
