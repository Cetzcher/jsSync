"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DECORATED = exports.syncPrimitive = exports.LATE_BIND = exports.PRIMITIVE = undefined;
exports.sync = sync;
exports.autoImplementSyncable = autoImplementSyncable;
exports.autoSync = autoSync;

var _Sync = require("./Sync");

var _SyncProvider = require("./SyncProvider");

// declare this as the type
const PRIMITIVE = exports.PRIMITIVE = "PRIMITIVE";
const LATE_BIND = exports.LATE_BIND = "LATE_BIND";


/**
 * decorates class functions, for example when applying the decorator to a getter like:
 * @example 
 * @sync(PRIMITIVE)
 * get name()  {... }
 * will mark the getter for sync, you also need to provide a setter
 * @param {Object | string} type either a syncable object or "LATE_BIND" or "PRIMITIVE" use PRIMITIVE for built-in types like
 * Number, String, booleans, etz.
 * use LATE_BIND for types that are bound in the constructor, see lateBindMember(...)
 * otherwise specify the type you want to sync to.
 * ```js
 * @autoSync(syncProvider) class S implements ISyncable {...}
 * @autoSync(syncProvider) class Syn2 implements ISyncable {
 *  ...
 *     @sync(S) get s() { ... }
 *     set s(val) { ... }
 *  ...
 * }
 * ```
 * 
 */
function sync(type) {
    // decorator to indicate an attribute can be synced
    return function decorator(target, key, descriptor) {
        if (!target.syncItems) target.syncItems = {};
        const stype = type || PRIMITIVE;
        target.syncItems[key] = { propName: key, type: type, allowLateBinding: type === LATE_BIND };
        return descriptor;
    };
}

/**
 * shorthand for sync(PRIMITIVE)
 */
const syncPrimitive = exports.syncPrimitive = sync(PRIMITIVE);

/**
 * helper value for implementing methods from ISyncable to make typechecking shut up as well as give a hint that these methods
 * are implemented by autoImplement, see below
 */
const DECORATED = exports.DECORATED = undefined;

/**
 * Automatically implements prototype.syncFrom, prototype.toSyncData and prototype.isSyncInProgress
 * this is done by calling the syncTo and create sync data functions and supplying the this arg
 * @param {*} prototype 
 */
function autoImplementSyncable(prototype) {
    const define = (name, func) => {
        const desc = Object.getOwnPropertyDescriptor(prototype, name);
        if (desc) {
            desc.value = func;
            Object.defineProperty(prototype, name, desc);
        }
    };

    define("syncFrom", function (data) {
        this.$SYNC_IN_PROGRESS = true;
        (0, _Sync.syncTo)(this, data);
        this.$SYNC_IN_PROGRESS = false;
    });

    define("toSyncData", function () {
        return (0, _Sync.createSyncData)(this);
    });

    define("isSyncInProgress", function () {
        return this.$SYNC_IN_PROGRESS;
    });
}

/**
 * class-level decorator, this automatically implements all necessary member functions of ISyncable
 * and also adds the class to the syncProvider given as the first argument
 * @param {ISyncProvider} provider the sync provider to use for syncing
 * ```js @autoSync(syncProvider) class S { ... } ```
 */
function autoSync(provider) {
    return function (ClassReference) {
        autoImplementSyncable(ClassReference.prototype);

        ClassReference.prototype.syncProvider = provider;

        if ((0, _Sync.isSyncableType)(ClassReference)) {
            if (provider) {
                provider.registerType(ClassReference.name, ClassReference);
            }
        } else {
            throw new Error("Type " + ClassReference.name + " must implement ISyncable");
        }

        return ClassReference;
    };
}

autoSync();