import { syncTo, createSyncData, isSyncableType, ISyncable } from "./Sync";
import { ISyncProvider } from "./SyncProvider";

// @flow

// declare this as the type
export const PRIMITIVE = "PRIMITIVE"

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
export function sync(type? : mixed, attrName?: string) {
    // decorator to indicate an attribute can be synced
    return function decorator(target: any, key: any, descriptor: any) {
        if (!target.syncItems)
            target.syncItems = {}
        const stype = type || PRIMITIVE
        target.syncItems[key] = {propName: attrName || key, type: type }
        return descriptor
    }
}

export const syncPrimitive = sync(PRIMITIVE)

export const DECORATED: any = undefined


export function autoSync(provider?: ISyncProvider): Function {
    return function (ClassReference: Function): Function {
        const define = (name : string, func : Function) => {
            const desc = Object.getOwnPropertyDescriptor(ClassReference.prototype, name)
            if (desc) {
                desc.value = func
                Object.defineProperty(ClassReference.prototype, name, desc);
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

        ClassReference.prototype.syncProvider = provider

        if(isSyncableType(ClassReference)) {
            if(provider) {
                provider.registerType(ClassReference.name, ClassReference)
            }
        }

        return ClassReference
    }
}