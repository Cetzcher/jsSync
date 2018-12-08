"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SyncProvider = undefined;

var _Sync = require("./Sync");

/**
 * provides a mapping of types to instances.
 */
let SyncProvider = exports.SyncProvider = class SyncProvider {

    constructor() {
        this.ctors = {};
    }

    registerType(name, ctor) {
        if ((0, _Sync.isSyncableType)(ctor)) this.ctors[name] = ctor;else throw new Error("the type with name " + name + " is not implementing the ISyncable interface ");
    }

    // TODO: fix the type here
    create(name, ...args) {
        // FIXME: Is order guaranteed when sending ???
        if (this.ctors[name]) {
            const ctor = this.ctors[name];
            return new ctor(...args);
        } else {
            throw new Error("There is no ctor with the name " + name + " within the sync provider ");
        }
    }

};