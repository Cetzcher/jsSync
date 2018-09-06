import { syncTo, createSyncData, isSyncableType, ISyncable } from "./Sync";
import { ISyncProvider } from "./SyncProvider";

// @flow

// declare this as the type
type LateBind = "LATE_BIND"
type Primitve = "PRIMITIVE"
export const PRIMITIVE : Primitve = "PRIMITIVE"
export const LATE_BIND : LateBind = "LATE_BIND"
export type AcceptableSyncVals = LateBind | Primitve | ISyncable<mixed> 

/**
 * @example
 * class Example {
 *  _value : number
 *  @sync(PRIMITIVE, "_value")
 *  get value() { return this.number }
 * 
 * }
 * this writes to the underlying _value when syncing.
 */
export function sync(type? : AcceptableSyncVals, attrName?: string) {
    // decorator to indicate an attribute can be synced
    return function decorator(target: any, key: any, descriptor: any) {
        if (!target.syncItems)
            target.syncItems = {}
        const stype = type || PRIMITIVE
        target.syncItems[key] = {propName: attrName || key, type: type, allowLateBinding: type === LATE_BIND}
        return descriptor
    }
}

export const syncPrimitive = sync(PRIMITIVE)

export const DECORATED: any = undefined

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