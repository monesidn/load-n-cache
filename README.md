# Load 'n' Cache
*Read it like "Rock 'n' roll" or "Lock 'n' load"*

This is a simple library that I initially wrote while working on a large AngularJS application. The goal is to make it easier to perform an async resource load and cache the result. It started as a simple aid to store user informations for 10 minutes but it quickly become a corner stone of the project. 

Being this useful i thought it was a pity not to make it public and available for modern javascript frameworks. Enough said, I decided to rewrite it from scratch and make it freely available.

## The problem 
As any other library this one solves a common problem, load a resource, the result of a REST service for instance, and make it available for subsequent calls without calling the service again or impacting calling code. Check the following code as an example of what **NOT TO DO**.

```javascript
var user;

function getUser() {
    function loadUser() {
        return fetch('/myself').then(u => user = u);
    }

    if (!user){
        loadUser();
    }
    return user;
}
```
The code above is loosely based on something i found in a production environment and has a lot of problems:
1. Invoking getUser() multiple times may trigger multiple subsequent calls to the backend.
1. You can never be sure if user is undefined because the backend did not worked or it's not loaded yet.
You can improve this code by making wise usage of promises patterns but, as you take more scenarios into account, handling gets harder.

## A simple yet powerful solution
This library solves the above problems in a very easy-to-write way:

```javascript
var user = new LoadNCache(() => fetch('/myself'));

function getUser() {
    return user.get();
}

```
The LoadNCache object will take care of:
* Call the provided "loadFunction" the first time the `get()` method is called;
* call the function again if the cached value is invalidated (e.g. for an explicit call to `.flush()` or the configured "autoflush" occurred);
* return the same promise over and over again, this mean that it is immediatly resolved if the value was already fetched;
* returning the same promise also mean that you can `.catch()` the error multiple times from different callers;
* emit events upon status changes. You need to update something when a new value is fetched? Just listen for the `'after-load'` event.

## In depth Documentation
LoadNCache is a class that is only responsible for calling a "loadFunction" at the right moment and then store the returned value for the future. Each class instance can be configured to work in a different way so data can be stored using the right policy. The following are all use cases that can be easily implemented using LoadNCache:
* Load user data and store them for up to 10 hours, minutes or seconds.
* Load action available and store them on localStorage so after refreshing the page data are not downloaded again.
* Perform some CPU intensive task and store the result to avoid computing the value again.
* Load a short-lived value from the server only if it is actually needed, like the server date and time. 

### What is a "loadFunction"?
As the names goes it's a javascript function responsible for loading the data that are going to be stored. It may return a primitive value, an object or a promise, so also async functions are welcome. There are no constraints on how the value can obtained. 
The return value of the loadFunction is handled as follows
* if it is undefined, null or any other value, except for Promises, it is wrapped into a resolved promise and stored;
* If it is a Promise the value is stored as is.
The loadFunction should be stateless as it may be called immediatly, in the future or never. 

So when the loadFunction is called? Anytime a new value needs to be retrieved. This usually happen after a call to the .get() method if no cached value is available. If a persisted value is available it may happen that the loadFunction is never called.

### LoadNCache API
#### Constructor
The LoadNCache constructor accept an options object. If default options are ok for you then you can pass in a function. Passing a function is the same as passing only the loader option in the options parameter.

##### Options
* `loader: () => any`: the loadFunction. This is the only option that must be provided.
* `disableEvents: boolean`: don't want events to be dispathed? Set this to true. Defaults to false.
* `autoFlushTime: number`: how long (in millis) the value should be kept. As soon as time elapsed an automatic call to .flush() is executed. Setting it to 0 or a negative value disable this feature. Defaults to 0.
* `persistance: string | PersistanceManager`: there are 2 supported string values:
    * `localStorage`: the promise result is serialized as JSON and stored into localStorage. You must provide a storageKey option to specify the name of the localStorage key.
    * `sessionStorage`: the promise result is serialized as JSON and stored into sessionStorage. You must provide a storageKey option to specify the name of the sessionStorage key.
    * Or you can provied your own PersistanceManager by implementing the interface. 
* `persistanceKey: string`: if persisting on a default key-value storage (localStorage or sessionStorage) this option specify the key to use to store data.

#### .get()
Retrieve the value. Always returns a promise. This call may result in the loadFunction being called but is up to the instance to decide whatever this should happen or not.

#### .flush()
Invalidate the currently cached value if any. If no value is cached then this method does nothing. Each subsequent call to `.get()` will get a different promise object then before. 

#### .refresh()
Shortcut for calling `.flush()` and `.get()`. Returns the promise from `.get()`.

### About persistance

As stated above when you want to allow your data to survive across reloads you need to persist them. Out of the box this library provide only 2 very trivial strategies to achieve this result: `localStorage` and `sessionStorage`.
If you need to store "pure" JSON object not too large these two implementation may be enough. Many projects however will require a more complex approach, to solve this issue provide an implementation of "PersistanceManager". Below there is an example that
will use custom logic to retrieve objects from storage.


### LoadNCache events
You are able to react to status changes listening to the following events:
* *before-load*: the instance is about to call the loadFunction to fetch a new promise. No promise currently cached.
* *after-load*: the instance has called the loaderFunction and a new promise is available. The event is fired after the promise resolves or reject.
* *before-flush*: someone called the .flush() method. This is your last chance to do something before the current promise is removed and a new one will be created.
* *after-flush*: the old promise was removed. No promise currently cached.
Each event is emitted with the LoadNCache instance as argument.

## Dependancies
This library was meant to have as few dependancies as possibile. Currently at runtime it only depends on an EventEmitter implementation. I choosed not to use the node.js implementation because is not available on browsers.
Also be sure that Promises are supported by your target platform both natively or using a polyfill.

## Pitfalls
### Rejected promises are not persisted!
Only promises fulfilled are persisted using the persistance manager. Rejected promises are not persisted as design. The main reason behind this choice is to make it easier to handle persistance errors. I can refactor the code to allow for storing refused promises but I can't see a useful use case right now. Let me know if you have a different opinion.

### Autoflush is relative to promise resolution/rejection
The autoflush time is measured starting at promise resolution or rejection. So if 5000ms are configured and promise resolution took 60000ms then the .flush() method will be called after 65000ms.
Also remember that the autoflush may be subject to short delays due to javascript event queue. 

## Examples
I've created an angular 9 project to show what this library can do with few lines of codes. You can find it here:
XXXXXXXXXXXXx
Also you can play with the related stackblitz. Have fun! 

## Recipes
### Load user data and store them for up to 10 minutes.

```javascript
class UserService{
    constructor(){
        this._user = new LoadNCache({
           loader: () => fetch('/myself'),
           autoFlushTime: 10 * 60 * 1000
        });
    }

    getUser(){
        return this._user.get();
    }
}

```

### Load action available and store them on localStorage.
```javascript
class PrivilegeService{
    constructor(){
        this._roles = new LoadNCache({
           loader: () => fetch('/roles'),
           persistance: 'localStorage',
           persistanceKey: 'security-roles'
        });
    }

    hasRole(role){
        return this._roles.get().then(r => !!r.find(i => role === i));
    }
}
```

### Perform some CPU intensive task and store the result to avoid computing the value again.
```javascript
function heavyJob(){
    return new Promise((resolve) => setTimeout(resolve, 1000));
}

let heavyJobResult = new LoadNCache(heavyJob);
let result = await heavyJobResult.get();
```


### Load a short-lived value from the server.
```javascript 
class TimeService{
    constructor(){
        this._serverTime = new LoadNCache({
           loader: () => fetch('/api/current-time').then(t => new Date(parseInt(t))),
           autoFlushTime: 500
        });
    }

    getServerTime(){
        return this._serverTime.get();
    }
}
```