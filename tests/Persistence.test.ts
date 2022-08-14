/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LoadNCache } from "../src";
import { NoopManager } from "../src/persistence/DefaultStorages";

test("Persistence: store a value into sessionStorage.", async () => {
    sessionStorage.clear();
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = "test";

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey
    });

    await lnc.get();

    const json = sessionStorage.getItem(persistenceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty("value", randVal);
    expect(persisted).toHaveProperty("ts");

    expect(typeof persisted.ts).toBe("number");
});

test("Persistence: unknown storage defaults to Noop.", async () => {
    sessionStorage.clear();
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    const randVal = `Hello World ${Math.random()}`;

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "fooBar"
    });

    expect(console.error).toBeCalled();
    expect((lnc as any).persistenceManager).toBeInstanceOf(NoopManager);
});

test('Persistence: store "null" into sessionStorage.', async () => {
    sessionStorage.clear();
    const persistenceKey = "test";

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(null), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey
    });

    await lnc.get();

    const json = sessionStorage.getItem(persistenceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty("value", null);
    expect(persisted).toHaveProperty("ts");

    expect(typeof persisted.ts).toBe("number");
});

test('Persistence: store "undefined" into sessionStorage.', async () => {
    sessionStorage.clear();
    const persistenceKey = "test";

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(undefined), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey
    });

    await lnc.get();

    const json = sessionStorage.getItem(persistenceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted.value === undefined || !("value" in persisted.value)).toBeTruthy();
    expect(persisted).toHaveProperty("ts");

    expect(typeof persisted.ts).toBe("number");
});

test("Persistence: restore a value from sessionStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = "test";
    const json = { ts: 0, value: randVal };

    sessionStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey
    });

    const value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).not.toBeCalled();
});

test('Persistence: restore "null" from sessionStorage.', async () => {
    const persistenceKey = "test";
    const json = { ts: 0, value: null };

    sessionStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res("Hello World"), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey
    });

    const value = await lnc.get();
    expect(value).toBeNull();
    expect(mockFn).not.toBeCalled();
});

test('Persistence: restore "undefined" from sessionStorage.', async () => {
    const persistenceKey = "test";
    const json = { ts: 0, value: undefined };

    sessionStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res("Hello World"), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey
    });

    const value = await lnc.get();
    expect(value).toBeUndefined();
    expect(mockFn).not.toBeCalled();
});

test("Persistence: autoflush an expired value from sessionStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistenceKey = "test";
    const json = { ts: 0, value: randVal };

    sessionStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey,
        autoFlush: 1000
    });

    const value = await lnc.get();
    expect(value).toBe(randVal2);
    expect(mockFn).toBeCalled();
});

test("Persistence: autoflush of a soon to expire value from sessionStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistenceKey = "test";
    const json = { ts: new Date().getTime() - 100, value: randVal };

    sessionStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "sessionStorage",
        persistenceKey,
        autoFlush: 300
    });

    let value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).not.toBeCalled();

    await new Promise((res) => setTimeout(res, 300));
    value = await lnc.get();

    expect(value).toBe(randVal2);
    expect(mockFn).toBeCalled();
});

// Local storage

test("Persistence: store a value into localStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = "test";

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey
    });

    await lnc.get();

    const json = localStorage.getItem(persistenceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty("value", randVal);
    expect(persisted).toHaveProperty("ts");

    expect(typeof persisted.ts).toBe("number");
});

test('Persistence: store "null" into localStorage.', async () => {
    localStorage.clear();
    const persistenceKey = "test";

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(null), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey
    });

    await lnc.get();

    const json = localStorage.getItem(persistenceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty("value", null);
    expect(persisted).toHaveProperty("ts");

    expect(typeof persisted.ts).toBe("number");
});

test('Persistence: store "undefined" into localStorage.', async () => {
    localStorage.clear();
    const persistenceKey = "test";

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(undefined), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey
    });

    await lnc.get();

    const json = localStorage.getItem(persistenceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted.value === undefined || !("value" in persisted.value)).toBeTruthy();
    expect(persisted).toHaveProperty("ts");

    expect(typeof persisted.ts).toBe("number");
});

test("Persistence: restore a value from localStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistenceKey = "test";
    const json = { ts: 0, value: randVal };

    localStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey
    });

    const value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).not.toBeCalled();
});

test('Persistence: restore "null" from localStorage.', async () => {
    const persistenceKey = "test";
    const json = { ts: 0, value: null };

    localStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res("Hello World"), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey
    });

    const value = await lnc.get();
    expect(value).toBeNull();
    expect(mockFn).not.toBeCalled();
});

test('Persistence: restore "undefined" from localStorage.', async () => {
    const persistenceKey = "test";
    const json = { ts: 0, value: undefined };

    localStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res("Hello World"), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey
    });

    const value = await lnc.get();
    expect(value).toBeUndefined();
    expect(mockFn).not.toBeCalled();
});

test("Persistence: autoflush an expired value from localStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistenceKey = "test";
    const json = { ts: 0, value: randVal };

    localStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey,
        autoFlush: 1000
    });

    const value = await lnc.get();
    expect(value).toBe(randVal2);
    expect(mockFn).toBeCalled();
});

test("Persistence: autoflush of a soon to expire value from localStorage.", async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistenceKey = "test";
    const json = { ts: new Date().getTime() - 100, value: randVal };

    localStorage.setItem(persistenceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: "localStorage",
        persistenceKey,
        autoFlush: 300
    });

    let value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).not.toBeCalled();

    await new Promise((res) => setTimeout(res, 300));
    value = await lnc.get();

    expect(value).toBe(randVal2);
    expect(mockFn).toBeCalled();
});

test("Persistence: error loading value is handled right.", async () => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    const badStorage = {
        loadValue: jest.fn(() => {
            throw new Error("Mock error while loading.");
        }),
        saveValue: jest.fn(() => {
            throw new Error("Mock error while saving.");
        }),
        clear: jest.fn(() => {
            throw new Error("Mock error while flushing.");
        })
    };

    const randVal = `Hello World ${Math.random()}`;

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistence: badStorage
    });

    const value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).toBeCalled();
    expect(badStorage.loadValue).toBeCalled();
    expect(badStorage.saveValue).toBeCalled();
    expect(console.warn).toBeCalledTimes(2);

    lnc.flush();
    expect(badStorage.clear).toBeCalled();
    expect(console.warn).toBeCalledTimes(3);
});
