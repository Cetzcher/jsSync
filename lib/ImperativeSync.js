"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.declareSyncable = declareSyncable;

var _ = require(".");

var _2 = _interopRequireDefault(_);

var _Sync = require("./Sync");

var _SyncProvider = require("./SyncProvider");

var _SyncDecorators = require("./SyncDecorators");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function declareSyncable(obj, syncProvider, defineProperty) {
    const prototype = Object.getPrototypeOf(obj);
    if (!prototype) throw new Error("could not get prototype of object");
    // check failure conditions
    if (!_2.default.util.isSyncable(obj)) throw new Error("the object must be a syncable" + String(prototype));

    // check if prototype does already have syncitems / syncProvider
    //$FlowFixMe
    if (prototype.syncItems && prototype.syncProvider) return;

    //$FlowFixMe    
    prototype.syncItems = {};

    //$FlowFixMe    
    prototype.syncProvider = syncProvider;
    (0, _SyncDecorators.autoImplementSyncable)(prototype); // implements the methods on the syncable

    const _defPropFunc = (name, type) => {
        //$FlowFixMe        
        prototype.syncItems[name] = { propName: name, type: type, allowLateBinding: type === _SyncDecorators.LATE_BIND };
    };

    defineProperty(_defPropFunc);
}