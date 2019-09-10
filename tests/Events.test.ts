import {LoadNCache} from '../src';

/**
 * Events test suite.
 */
test('Check events flow on load.', async () => {
    const mockFn = jest.fn(() => new Promise((res) => {setTimeout(() => res('Hello World'), 100)}));
    const lnc = new LoadNCache(mockFn);

    const beforeLoad = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).toBe(undefined);
    });
    const afterLoad  = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).not.toBe(undefined);
    });

    lnc.on('before-load', beforeLoad);
    lnc.on('after-load', afterLoad);

    const promise = lnc.get().then(() => {
        expect(beforeLoad.mock.calls.length).toBe(1);
        expect(afterLoad.mock.calls.length).toBe(1);
    });
    
    expect(beforeLoad.mock.calls.length).toBe(1);
    expect(afterLoad.mock.calls.length).toBe(0);

    return promise;
});

test('Check events flow on load, flush, load.', async () => {
    const mockFn = jest.fn(() => new Promise((res) => {setTimeout(() => res('Hello World'), 100)}));
    const lnc = new LoadNCache(mockFn);
    
    const beforeLoad = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).toBe(undefined);
    });
    const afterLoad  = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).not.toBe(undefined);
    });
    const beforeFlush = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).not.toBe(undefined);
    });
    const afterFlush  = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).toBe(undefined);
    });


    lnc.on('before-load', beforeLoad);
    lnc.on('after-load', afterLoad);
    lnc.on('before-flush', beforeFlush);
    lnc.on('after-flush', afterFlush);

    let promise = lnc.get().then(() => {
        expect(beforeLoad.mock.calls.length).toBe(1);
        expect(afterLoad.mock.calls.length).toBe(1);
        expect(beforeFlush.mock.calls.length).toBe(0);
        expect(afterFlush.mock.calls.length).toBe(0);
    });
    
    expect(beforeLoad.mock.calls.length).toBe(1);
    expect(afterLoad.mock.calls.length).toBe(0);
    expect(beforeFlush.mock.calls.length).toBe(0);
    expect(afterFlush.mock.calls.length).toBe(0);

    await promise;
    
    lnc.flush();

    expect(beforeLoad.mock.calls.length).toBe(1);
    expect(afterLoad.mock.calls.length).toBe(1);
    expect(beforeFlush.mock.calls.length).toBe(1);
    expect(afterFlush.mock.calls.length).toBe(1);

    promise = lnc.get().then(() => {
        expect(beforeLoad.mock.calls.length).toBe(2);
        expect(afterLoad.mock.calls.length).toBe(2);
        expect(beforeFlush.mock.calls.length).toBe(1);
        expect(afterFlush.mock.calls.length).toBe(1);
    });

    expect(beforeLoad.mock.calls.length).toBe(2);
    expect(afterLoad.mock.calls.length).toBe(1);
    expect(beforeFlush.mock.calls.length).toBe(1);
    expect(afterFlush.mock.calls.length).toBe(1);
});


test('Check events flow on load, refresh.', async () => {
    const mockFn = jest.fn(() => new Promise((res) => {setTimeout(() => res('Hello World'), 100)}));
    const lnc = new LoadNCache(mockFn);
    
    const beforeLoad = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).toBe(undefined);
    });
    const afterLoad  = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).not.toBe(undefined);
    });
    const beforeFlush = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).not.toBe(undefined);
    });
    const afterFlush  = jest.fn((arg) => {
        expect(arg === lnc).toBe(true);
        expect((lnc as any).promise).toBe(undefined);
    });


    lnc.on('before-load', beforeLoad);
    lnc.on('after-load', afterLoad);
    lnc.on('before-flush', beforeFlush);
    lnc.on('after-flush', afterFlush);

    let promise = lnc.get().then(() => {
        expect(beforeLoad.mock.calls.length).toBe(1);
        expect(afterLoad.mock.calls.length).toBe(1);
        expect(beforeFlush.mock.calls.length).toBe(0);
        expect(afterFlush.mock.calls.length).toBe(0);
    });
    
    expect(beforeLoad.mock.calls.length).toBe(1);
    expect(afterLoad.mock.calls.length).toBe(0);
    expect(beforeFlush.mock.calls.length).toBe(0);
    expect(afterFlush.mock.calls.length).toBe(0);

    await promise;

    promise = lnc.refresh().then(() => {
        expect(beforeLoad.mock.calls.length).toBe(2);
        expect(afterLoad.mock.calls.length).toBe(2);
        expect(beforeFlush.mock.calls.length).toBe(1);
        expect(afterFlush.mock.calls.length).toBe(1);
    });

    expect(beforeLoad.mock.calls.length).toBe(2);
    expect(afterLoad.mock.calls.length).toBe(1);
    expect(beforeFlush.mock.calls.length).toBe(1);
    expect(afterFlush.mock.calls.length).toBe(1);
});

test('Check events not firing when disabled.', async () => {
    const beforeLoad = jest.fn();
    const afterLoad  = jest.fn();
    const beforeFlush = jest.fn();
    const afterFlush  = jest.fn();

    const mockFn = jest.fn(() => new Promise((res) => {setTimeout(() => res('Hello World'), 100)}));
    const lnc = new LoadNCache({loader: mockFn, disableEvents: true});

    lnc.on('before-load', beforeLoad);
    lnc.on('after-load', afterLoad);
    lnc.on('before-flush', beforeFlush);
    lnc.on('after-flush', afterFlush);

    await lnc.get();
    lnc.flush();
    await lnc.get();

    expect(beforeLoad.mock.calls.length).toBe(0);
    expect(afterLoad.mock.calls.length).toBe(0);
    expect(beforeFlush.mock.calls.length).toBe(0);
    expect(afterFlush.mock.calls.length).toBe(0);
});