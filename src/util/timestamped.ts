

export interface TimestampedValue<T>{
    readonly ts: number;
    readonly promise: Promise<T>;
}


export class Timestamped<T>{
    constructor(public readonly promise: Promise<T>, 
                public readonly ts = new Date().getTime() ){
    }
}