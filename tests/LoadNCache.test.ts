/* eslint-disable prefer-promise-reject-errors */
import { LoadNCache } from "../src";

/**
 * Basic functionality test suite.
 */

test("Basic functionality with loadFunction only.", async () => {
    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res("Hello World"), 500)));
    const lnc = new LoadNCache(mockFn);

    const results = await Promise.all([lnc.get(), lnc.get(), lnc.get()]);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(results).toEqual(["Hello World", "Hello World", "Hello World"]);
});

test("Basic functionality with no additional options.", async () => {
    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res("Hello World"), 500)));
    const lnc = new LoadNCache({ loader: mockFn });

    const results = await Promise.all([lnc.get(), lnc.get(), lnc.get()]);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(results).toEqual(["Hello World", "Hello World", "Hello World"]);
});

test("Basic functionality with rejected promise.", async () => {
    const mockFn = jest.fn(() => Promise.reject("Hello World"));
    const lnc = new LoadNCache(mockFn);

    for (let i = 0; i < 3; i++) await expect(lnc.get()).rejects.toBe("Hello World");
    expect(mockFn.mock.calls.length).toBe(1);
});

test("Throws on missing load function.", () => {
    expect(() => new LoadNCache({} as any)).toThrow(Error);
});

test("Caching null.", async () => {
    const mockFn = jest.fn(() => new Promise<null>((res) => setTimeout(() => res(null), 500)));
    const lnc = new LoadNCache(mockFn);

    const results = await Promise.all([lnc.get(), lnc.get(), lnc.get()]);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(results).toEqual([null, null, null]);
});

test("Caching undefined.", async () => {
    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(undefined), 500)));
    const lnc = new LoadNCache(mockFn);

    const results = await Promise.all([lnc.get(), lnc.get(), lnc.get()]);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(results).toEqual([undefined, undefined, undefined]);
});

test("Autoflush works as expected.", async () => {
    let counter = 0;
    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(`Hello World ${++counter}`), 100)));
    const lnc = new LoadNCache({ loader: mockFn, autoFlush: 300 });

    let value = await lnc.get();
    expect(value).toBe("Hello World 1");

    value = await lnc.get();
    expect(value).toBe("Hello World 1");

    lnc.flush();

    value = await lnc.get();
    expect(value).toBe("Hello World 2");

    await new Promise((res) => setTimeout(res, 500));

    value = await lnc.get();
    expect(value).toBe("Hello World 3");

    expect(mockFn.mock.calls.length).toBe(3);
});
