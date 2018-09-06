//@flow
import { ISyncable, ISyncProvider, isSyncable } from ".";
import { autoImplementSyncable, LATE_BIND } from "./SyncDecorators";
import type {AcceptableSyncVals} from "./SyncDecorators"

type DefineProperty =  (name: string, type: AcceptableSyncVals) => void
type DefinePropertyCallback = (defineProperty: DefineProperty) => void

export function declareSyncable<T>(obj: ISyncable<T>, syncProvider: ISyncProvider, defineProperty: DefinePropertyCallback): void {
    const prototype = Object.getPrototypeOf(obj)
    // check failure conditions
    if(!isSyncable(obj))
        throw new Error("the object must be a syncable"  + prototype.name)
    
    // check if prototype does already have syncitems / syncProvider
    if(prototype.syncItems && prototype.syncProvider) 
        return
    
    prototype.syncItems = {}
    prototype.syncProvider = syncProvider
    autoImplementSyncable(prototype)  // implements the methods on the syncable

    const _defPropFunc : DefineProperty = (name : string, type: AcceptableSyncVals) => {
        prototype.syncItems[name] = {propName: name, type: type, allowLateBinding: type === LATE_BIND}
    }
    
    defineProperty(_defPropFunc)

}