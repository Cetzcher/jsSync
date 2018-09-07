// @flow

import { syncTo, createSyncData, isSyncableType, ISyncable, IAutoSyncable } from "./Sync";
import { ISyncProvider, SyncProvider } from "./SyncProvider";

// declare this as the type
type LateBind = "LATE_BIND"
type Primitive = "PRIMITIVE"
export const PRIMITIVE : Primitive = "PRIMITIVE"
export const LATE_BIND : LateBind = "LATE_BIND"
export type AcceptableSyncVals = LateBind | Primitive | Class<ISyncable>

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
export function sync(type? : AcceptableSyncVals) {
    // decorator to indicate an attribute can be synced
    return function decorator(target: any, key: any, descriptor: any) {
        if (!target.syncItems)
            target.syncItems = {}
        const stype = type || PRIMITIVE
        target.syncItems[key] = {propName: key, type: type, allowLateBinding: type === LATE_BIND}
        return descriptor
    }
}

/**
 * shorthand for sync(PRIMITIVE)
 */
export const syncPrimitive = sync(PRIMITIVE)

/**
 * helper value for implementing methods from ISyncable to make typechecking shut up as well as give a hint that these methods
 * are implemented by autoImplement, see below
 */
export const DECORATED: any = undefined

/**
 * Automatically implements prototype.syncFrom, prototype.toSyncData and prototype.isSyncInProgress
 * this is done by calling the syncTo and create sync data functions and supplying the this arg
 * @param {*} prototype 
 */
export function autoImplementSyncable(prototype : any) {
    const define = (name : string, func : Function) => {
        const desc = Object.getOwnPropertyDescriptor(prototype, name)
        if (desc) {
            desc.value = func
            Object.defineProperty(prototype, name, desc);
        }
    } 

    define("syncFrom", function(data) {
            this.$SYNC_IN_PROGRESS = true;
            syncTo(this, data)
            this.$SYNC_IN_PROGRESS = false
    })

    define("toSyncData", function() {
        return createSyncData(this)
        
    })

    define("isSyncInProgress", function() {
        return this.$SYNC_IN_PROGRESS
    })
}

/**
 * class-level decorator, this automatically implements all necessary member functions of ISyncable
 * and also adds the class to the syncProvider given as the first argument
 * @param {ISyncProvider} provider the sync provider to use for syncing
 * ```js @autoSync(syncProvider) class S { ... } ```
 */
export function autoSync(provider?: ISyncProvider): Function {
    return function (ClassReference: Function): Function {
        autoImplementSyncable(ClassReference.prototype)

        ClassReference.prototype.syncProvider = provider

        if(isSyncableType(ClassReference)) {
            if(provider) {
                provider.registerType(ClassReference.name, ClassReference)
            }
        } else {
            throw new Error("Type " + ClassReference.name + " must implement ISyncable")
        }

        return ClassReference
    }
}

autoSync()