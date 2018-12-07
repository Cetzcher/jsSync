// @flow

import { ISyncProvider } from "./SyncProvider";
import { PRIMITIVE, LATE_BIND, type AcceptableSyncVals } from "./SyncDecorators";


/**
 * Provides utility functions for syncing objects automagically (see examples in the tests for more information)
 * be aware that when you decorate a class with @autoSync this classes constructor wont get 
 * the arguments which may lead to errors, the best solution is to provide a speerate init method
 * 
 *  1) autoSync marks a class for syncing, this automatically implements all methods in the IAutoSync interface
 *    1.1) you must still declare the interface methods and return DECORATED
 *    1.2) when a sync is in progress you can call isSyncInProgress() to lock certain members of the class
 * 
 *  2) sync(TYPE) marks a member (MUST BE A FUNCTION, GETTER IS RECOMMENDED) for sync
 *    2.1) Type must either be the constructor function of a ISyncable type or PRIMITIVE or LATE_BIND 
 *     2.1.1) PRIMITIVE should be used for: Strings, Numbers, Lists and key/value objects i.e. {name: ..., age: ...}
 *          implement setters example:
  *         when using setters: 
 *          class X { 
 *             _val
 *              @sync(PRIMITIVE) ===========> |  will sync to _val BY CALLING THE SETTER
 *              get val() { ... }             |
 *              set val(v) { ... }  <=========|
 *          }
 *    2.3) syncPrimitive is an overload for sync(PRIMITIVE)
 */

/**
 * Interface for Syncable data
 */
export interface ISyncable {
    syncFrom(data: ?Object): void;
    toSyncData(): ?Object;
}

export interface IAutoSyncable extends ISyncable {
    isSyncInProgress(): boolean;
}

/**
 * checks wether an object contains the syncFrom and toSyncData functions
 * @param {Object} obj the object to check 
 * @returns {boolean} true if the object satisfies the interface
 */
export function isSyncable(obj: Object | Object[]): boolean {
    // test if all of the syncable methods are on an object
    if (obj instanceof Array)
        return obj.every(val => isSyncable(val))
    return obj && typeof obj.syncFrom === "function" && typeof obj.toSyncData === "function"
}

/**
 * checks wether a type satisfies the ISyncable interface
 */
export function isSyncableType(type: Class<any>) {
    return isSyncable(type.prototype)
}


type SyncStructure = { prop: string, value: any, isArray?: boolean }
/**
 * Creates data akin to JSON.parse from any object that is declared as syncable
 * @param {Object} aObject 
 * @returns {Array} an array of {prop: string, value : any} that is used for applying the sync to an object some time later
 */
export function createSyncData(aObject: Object): SyncStructure[] {
    // generates a syncstructure from an object
    if (!isSyncable(aObject)) {
        throw new Error("the object " + aObject.constructor.name + " passed to create sync data is not syncable")
    }
    const items = Object.getPrototypeOf(aObject).syncItems;
    if (!items)
        return []

    return Object.keys(items).map(
        item => {
            const current = items[item]
            const itemType = current.type
            let value = aObject[current.propName]
            let isArray = false
            if (itemType === LATE_BIND)
                throw new Error("All late bound members must be bound before creating sync data")
            if (isSyncable(value)) {
                if (value instanceof Array && value.constructor === "Array") {
                    isArray = true
                    value = value.map(item => {
                        if (item.toSyncData)
                            return item.toSyncData()
                        throw new Error("could nor convert an item in a array to sync data")
                    })
                } else {
                    value = value.toSyncData()
                }
            }
            return {
                prop: current.propName,
                value: value,
                isArray: isArray
            }
        }
    )
}
/**
 * 
 * @param {Object} obj the object instance
 * @param {PRIMITIVE | LATE_BIND | Class<ISyncable> } itemType the type descriptor of the element
 * @param {SyncStructure[] | PRIMITIVE} elemValue the value of the element 
 */
function createElem(obj: Object, itemType: any, elemValue: Object) {
    if (itemType === PRIMITIVE || itemType === LATE_BIND) {
        return elemValue
    } else if (elemValue) {
        //if the element type is not a primitive, create the element via the sync provider
        // first get the sync provider on the element
        const syncProvider: ISyncProvider = Object.getPrototypeOf(obj).syncProvider
        if (!syncProvider)
            throw new Error("the object " + JSON.stringify(obj) + " does not contain a sync provider, SYNC FAILED")
        // get the ctor name of type that should be created
        const ctorName = itemType.name
        if (!ctorName)
            throw new Error("item name is not a function i.e. not a ctor given type was:" + itemType)
        const objInstance: ISyncable = syncProvider.create(ctorName)
        // if we have the full object i.e. elemValue is an object that satisfies the syncable interface
        // and therefore has the necessary methods then we can use them directly
        // however if not then we pass the dict to the sync 
        if (isSyncable(elemValue)) {
            objInstance.syncFrom(elemValue.toSyncData())
        } else {
            objInstance.syncFrom(elemValue)
        }
        return objInstance
    }


}

/**
 * synchronizes an object with the syncData
 * @param {Object} obj an object on which the sync should be performed
 * @param {Array} syncData an array of sync data, this is generated by createSyncData
 */
export function syncTo(obj: Object, syncData: SyncStructure[]): void {
    // syncs the given structure to the object
    const proto = Object.getPrototypeOf(obj)
    const items = proto.syncItems;
    if (!items || !syncData)
        return
    syncData.forEach(elem => {
        const syncableItem = items[elem.prop]   // this contains the name of the prop and the type of the prop
        const { propName, type } = syncableItem   // propName: the name of the prop in obj that we want to change, type: PRIMITVE | ...
        let elemValue = elem.value              // the value we consider for assigning
        let toAssign
        // elem value is: an array or not
        // the elements are either PRIMITIVE or NON-PRIMITIVE
        if (type == LATE_BIND)
            throw new Error("All late bound members must be bound before syncing")

        if (elemValue instanceof Array && elem.isArray) {
            toAssign = elemValue.map(arrElem => createElem(obj, type, arrElem))
        } else {
            toAssign = createElem(obj, type, elemValue)
        }
        obj[propName] = toAssign
    })
}
/**
 * When using the annotation style of declaring sync objects and need 
 * to synchronize cyclical types you cannot use sync(TYPE) since TYPE is not defined before the complete
 * class is parsed, consider the following example
 * ```js
 * @autoSync(syncProvider)
 * class SelfRef {
 *   _sr : SelfRef
 *   set selfRef(sr) { ... }
 *   @sync(LATE_BIND)
 *   get selfRef() { ... }
 *   
 *   constructor() {
 *     lateBindMember(this, "selfRef", SelfRef)
 *   }
 *   
 * }
 * ```
 * here, instead of using sync(SelfRef) we use sync(LATE_BIND) and then bind the member in the constructor
 * 
 * @param {Object} obj the object on which the member is defined 
 * @param {string} name the name of the member 
 * @param {Function} type a constructor to a Syncable object 
 */
export function lateBindMember<T : Object>(obj: Object, name: string, type: Class<ISyncable>) {
    const proto = Object.getPrototypeOf(obj)
    if (!proto.syncItems || !isSyncable(obj))
        throw new Error("Object is not syncable, is it annotated with @autoSync?")
    const syncElem = proto.syncItems[name]
    if (!syncElem.allowLateBinding)
        return
    if (syncElem) {
        if (syncElem.type === LATE_BIND) {
            syncElem.type = type
            syncElem.allowLateBinding = false
        } else {
            throw new Error("The member " + name + " was not correctly annotated for late binding you need to use @sync LATE_BIND")
        }
    } else {
        throw new Error("the member " + name + " was not found on the object with name: " + obj.constructor.name + " check for spelling errors")
    }
}

/**
 * syncs all items of a list to another itme
 */
export function syncListItems<T : Object>(authority: ISyncable, clients: ISyncable[]) {
    const syncData = authority.toSyncData()
    clients.forEach(client => {
        if (client !== authority)
            client.syncFrom(syncData)
    })
}

