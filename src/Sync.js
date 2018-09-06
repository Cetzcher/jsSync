import { ISyncProvider } from "./SyncProvider";
import { PRIMITIVE, LATE_BIND } from "./SyncDecorators";

// @flow

/**
 * Provides utility functions for syncing objects automagically
 * be aware that when you decorate a class with @autoSync this classes constructor wont get 
 * the arguments which may lead to errors, the best solution is to provide a speerate init method
 * 
 * description of the algorithms in use:
 *  1) autoSync marks a class for syncing, this automatically implements all methods in the IAutoSync interface
 *    1.1) you should still implement the interface and return DECORATED
 *    1.2) when a sync is in progress you can call isSyncInProgress() to lock certain members of the class
 * 
 *  2) sync(TYPE, NAME) marks a member (MUST BE A FUNCTION GETTER IS RECOMMENDED) for sync
 *    2.1) Type must either be the constructor function of a ISyncable type OR PRIMITIVE
 *     2.1.1) PRIMITIVE should be used for: Strings, Numbers, Lists and key/value objects i.e. {name: ..., age: ...}
 *    2.2) NAME is an optional argument for specifying to which field the data should be synced to, use this if you do not want to 
 *         implement setters example:
 *          when not using setters: 
 *          class X { 
 *             _val            <============= |
 *              @sync(PRIMITIVE, "_val")  ==> |  will sync to _val
 *              get val() { ... }
 *          }
  *         when using setters: 
 *          class X { 
 *             _val
 *              @sync(PRIMITIVE) ===========> |  will sync to _val BY CALLING THE SETTER FUNCTION
 *              get val() { ... }             |
 *              set val(v) { ... }  <=========|
 *          }
 *    2.3) syncPrimitive is an overload for sync(PRIMITIVE)
 *    
 *    3) createSyncData takes an object and attempts to create a syncable form of data see below
 *    4) syncTo takes an object and data and attemptrs to sync to that object in effect syncTo(a, createSyncData(b)) syncs a to b 
 */

/**
 * Interface for Syncable data
 */
export interface ISyncable<T : Object> {
    syncFrom(data: ?T): void;
    toSyncData(): ?T;
}

export interface IAutoSyncable<T: Object> extends ISyncable<T> {
    isSyncInProgress(): boolean;
}

export function isSyncable(obj: Object): boolean {
    // test if all of the syncable methods are on an object
    return obj && typeof obj.syncFrom === "function" && typeof obj.toSyncData === "function"
}

export function isSyncableType(type: Class<any>) {
    return isSyncable(type.prototype)
}


type SyncStructure = { prop: string, value: mixed }
export function createSyncData(aObject: Object): SyncStructure[] {
    // generates a syncstructure from an object
    const items = Object.getPrototypeOf(aObject).syncItems;
    if (!items)
        return []

    return Object.keys(items).map(
        item => {
            const current = items[item]
            const itemType = current.type
            let value = aObject[current.propName]
            if(itemType === LATE_BIND) 
                throw new Error("All late bound members must be bound before creating sync data")
            if(isSyncable(value)) {
                value = value.toSyncData()
            }
            return {
                prop: current.propName,
                value: value
            }
        }
    )
}

export function syncTo(obj: Object, syncData: SyncStructure[]): void {
    // syncs the given structure to the object
    const proto = Object.getPrototypeOf(obj)
    const items = proto.syncItems;
    if (!items || !syncData)
        return
    syncData.forEach(
        elem => {
            const current = items[elem.prop]
            const givenName = current.propName
            const itemType = current.type
            let elemValue = elem.value
            if (itemType === LATE_BIND)
                throw new Error("All late bound members must be bound before syncing")
            
            if (itemType !== PRIMITIVE && elemValue) {
                // if the element type is not a primitive, create the element via the sync provider
                // first get the sync provider on the element
                const syncProvider : ISyncProvider = Object.getPrototypeOf(obj).syncProvider
                if(!syncProvider) 
                    throw new Error("the object " + JSON.stringify(obj) +  " does not contain a sync provider, SYNC FAILED")
                // get the ctor name of type that should be created
                const ctorName = itemType.name
                if(!ctorName)
                    throw new Error("item name is not a function i.e. not a ctor given type was:" + itemType)
                // TODO: consider passing the data to the ctro OR calling sync afterwards
                const objInstance : ISyncable<any> = syncProvider.create(ctorName)
                // if we have the full object i.e. elemValue is an object that satisfies the syncable interface
                // and therefore has the necessary methods then we can use them directly
                // however if not then we pass the dict to the sync 
                if(isSyncable(elemValue)) {
                    objInstance.syncFrom(elemValue.toSyncData())                    
                } else {
                    objInstance.syncFrom(elemValue)
                }
                elemValue = objInstance
            }
            obj[givenName] = elemValue        
        }
    )
}

export function lateBindMember<T : Object>(obj: Object, name : string, type: ISyncable<T>) {
    const proto = Object.getPrototypeOf(obj)
    if(!proto.syncItems || !isSyncable(obj))
        throw new Error("Object is not syncable, is it annotated with @autoSync?")
    const syncElem = proto.syncItems[name]
    if(!syncElem.allowLateBinding)
        return
    if(syncElem) {
        if(syncElem.type === LATE_BIND) {
            syncElem.type = type
            syncElem.allowLateBinding = false
        } else {
            throw new Error("The member " + name + " was not correctly annotated for late binding you need to use @sync LATE_BIND")
        }
    } else {
        throw new Error("the member " + name + " was not found on the object with name: " + obj.constructor.name + " check for spelling errors" )
    }
}

export function syncListItems<T : Object>(authority: ISyncable<T>, clients: ISyncable<T>[]) {
    const syncData = authority.toSyncData()
    clients.forEach(client => {
        if (client !== authority)
            client.syncFrom(syncData)
    })
}

