import { LoadNCache } from '../src';
import { NoopManager } from '../src/persistance/DefaultStorages';


test('Persistance: store a value into sessionStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey
    });

    await lnc.get();

    const json = sessionStorage.getItem(persistanceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty('value', randVal);
    expect(persisted).toHaveProperty('ts');

    expect(typeof persisted.ts).toBe('number');
});

test('Persistance: unknown storage defaults to Noop.', async () => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    const randVal = `Hello World ${Math.random()}`;

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'fooBar'
    });

    expect(console.error).toBeCalled();
    expect((lnc as any).persistanceManager).toBeInstanceOf(NoopManager);
});

test('Persistance: store "null" into sessionStorage.', async () => {
    debugger;
    sessionStorage.clear();
    const persistanceKey = 'test';

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(null), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey
    });

    await lnc.get();

    const json = sessionStorage.getItem(persistanceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty('value', null);
    expect(persisted).toHaveProperty('ts');

    expect(typeof persisted.ts).toBe('number');
});

test('Persistance: store "undefined" into sessionStorage.', async () => {
    sessionStorage.clear();
    const persistanceKey = 'test';

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(undefined), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey
    });

    await lnc.get();

    const json = sessionStorage.getItem(persistanceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty('value', undefined);
    expect(persisted).toHaveProperty('ts');

    expect(typeof persisted.ts).toBe('number');
});

test('Persistance: restore a value from sessionStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';
    const json = { ts: 0, value: randVal };

    sessionStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey
    });

    const value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).not.toBeCalled();
});

test('Persistance: restore "null" from sessionStorage.', async () => {
    const persistanceKey = 'test';
    const json = { ts: 0, value: null };

    sessionStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res('Hello World'), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey
    });

    const value = await lnc.get();
    expect(value).toBeNull();
    expect(mockFn).not.toBeCalled();
});

test('Persistance: restore "undefined" from sessionStorage.', async () => {
    const persistanceKey = 'test';
    const json = { ts: 0, value: undefined };

    sessionStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res('Hello World'), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey
    });

    const value = await lnc.get();
    expect(value).toBeUndefined();
    expect(mockFn).not.toBeCalled();
});

test('Persistance: autoflush an expired value from sessionStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';
    const json = { ts: 0, value: randVal };

    sessionStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey,
        autoFlush: 1000
    });

    const value = await lnc.get();
    expect(value).toBe(randVal2);
    expect(mockFn).toBeCalled();
});

test('Persistance: autoflush of a soon to expire value from sessionStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';
    const json = { ts: new Date().getTime()-100, value: randVal };

    sessionStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'sessionStorage',
        persistanceKey,
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

test('Persistance: store a value into localStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey
    });

    await lnc.get();

    const json = localStorage.getItem(persistanceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty('value', randVal);
    expect(persisted).toHaveProperty('ts');

    expect(typeof persisted.ts).toBe('number');
});

test('Persistance: store "null" into localStorage.', async () => {
    localStorage.clear();
    const persistanceKey = 'test';

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(null), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey
    });

    await lnc.get();

    const json = localStorage.getItem(persistanceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty('value', null);
    expect(persisted).toHaveProperty('ts');

    expect(typeof persisted.ts).toBe('number');
});

test('Persistance: store "undefined" into localStorage.', async () => {
    localStorage.clear();
    const persistanceKey = 'test';

    const mockFn = jest.fn(() => new Promise<any>((res) => setTimeout(() => res(undefined), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey
    });

    await lnc.get();

    const json = localStorage.getItem(persistanceKey);
    expect(json).not.toBeNull();
    const persisted = JSON.parse(json!);
    expect(persisted).toHaveProperty('value', undefined);
    expect(persisted).toHaveProperty('ts');

    expect(typeof persisted.ts).toBe('number');
});

test('Persistance: restore a value from localStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';
    const json = { ts: 0, value: randVal };

    localStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey
    });

    const value = await lnc.get();
    expect(value).toBe(randVal);
    expect(mockFn).not.toBeCalled();
});

test('Persistance: restore "null" from localStorage.', async () => {
    const persistanceKey = 'test';
    const json = { ts: 0, value: null };

    localStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res('Hello World'), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey
    });

    const value = await lnc.get();
    expect(value).toBeNull();
    expect(mockFn).not.toBeCalled();
});

test('Persistance: restore "undefined" from localStorage.', async () => {
    const persistanceKey = 'test';
    const json = { ts: 0, value: undefined };

    localStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res('Hello World'), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey
    });

    const value = await lnc.get();
    expect(value).toBeUndefined();
    expect(mockFn).not.toBeCalled();
});

test('Persistance: autoflush an expired value from localStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';
    const json = { ts: 0, value: randVal };

    localStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey,
        autoFlush: 1000
    });

    const value = await lnc.get();
    expect(value).toBe(randVal2);
    expect(mockFn).toBeCalled();
});

test('Persistance: autoflush of a soon to expire value from localStorage.', async () => {
    const randVal = `Hello World ${Math.random()}`;
    const randVal2 = `Hello World ${Math.random()}`;
    const persistanceKey = 'test';
    const json = { ts: new Date().getTime()-100, value: randVal };

    localStorage.setItem(persistanceKey, JSON.stringify(json));

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal2), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: 'localStorage',
        persistanceKey,
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

test('Persistance: error loading value is handled right.', async () => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    const badStorage = {
        loadValue: jest.fn(() => {
            throw new Error('Mock error while loading.');
        }),
        saveValue: jest.fn(() => {
            throw new Error('Mock error while saving.');
        }),
        clear: jest.fn(() => {
            throw new Error('Mock error while flushing.');
        })
    };

    const randVal = `Hello World ${Math.random()}`;

    const mockFn = jest.fn(() => new Promise((res) => setTimeout(() => res(randVal), 100)));
    const lnc = new LoadNCache({
        loader: mockFn,
        persistance: badStorage
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
