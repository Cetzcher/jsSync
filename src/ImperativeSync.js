//@flow
import { ISyncable, ISyncProvider, isSyncable } from ".";
import { autoImplementSyncable, LATE_BIND } from "./SyncDecorators";
import type {AcceptableSyncVals} from "./SyncDecorators"

type DefineProperty =  (name: string, type: AcceptableSyncVals) => void
type DefinePropertyCallback = (defineProperty: DefineProperty) => void

/**
 * If you do not want to use decorators, as they can be flimsy at times, you can also imperativly
 * declare syncables by calling the below function in the constructor.
 * @param {ISyncable} obj the object that should be made syncable, this will autImplement the members of ISyncable 
 * @param {ISyncProvider} syncProvider the syncProvider to use when marking the object for sync
 * @param {Function} defineProperty a function that takes a function as the argument 
 * calling this function will define the properties on 'obj'
 * 
 * @example
 * class S implements IAutoSyncable {
 *  get a() {...}
 *  set a() { ... }
 *  
 *  // more getter / setter
 * 
 *  constructor() {
 *    declareSyncable(this, syncProvider, (defineProp) => {
 *      // call defineProp(name, type ) to define a prop on S as syncable
 *      defineProp("a", PRIMITIVE)
 *      defineProp("foo", FOO)
 *      ...
 *    })
 *  }
 *  ...
 * }
 */
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