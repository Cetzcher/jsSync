"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ISyncProvider = exports.IAutoSyncable = exports.ISyncable = undefined;

var _Sync = require("./Sync");

Object.defineProperty(exports, "ISyncable", {
    enumerable: true,
    get: function () {
        return _Sync.ISyncable;
    }
});
Object.defineProperty(exports, "IAutoSyncable", {
    enumerable: true,
    get: function () {
        return _Sync.IAutoSyncable;
    }
});

var _SyncProvider = require("./SyncProvider");

Object.defineProperty(exports, "ISyncProvider", {
    enumerable: true,
    get: function () {
        return _SyncProvider.ISyncProvider;
    }
});

var Util = _interopRequireWildcard(_Sync);

var _SyncDecorators = require("./SyncDecorators");

var Decorator = _interopRequireWildcard(_SyncDecorators);

var Provider = _interopRequireWildcard(_SyncProvider);

var _ImperativeSync = require("./ImperativeSync");

var Imperative = _interopRequireWildcard(_ImperativeSync);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//export type { IAutoSyncable, ISyncable } from "./Sync"
// export type { ISyncProvider } from "./SyncProvider"
//export {isSyncable, lateBindMember, createSyncData, isSyncableType, syncListItems, syncTo} from "./Sync"
//export {autoSync, sync, DECORATED, LATE_BIND, PRIMITIVE, syncPrimitive, autoImplementSyncable} from "./SyncDecorators"
//export {SyncProvider} from "./SyncProvider"
//export {declareSyncable} from "./ImperativeSync"

exports.default = {
    util: Util,
    decorator: Decorator,
    provider: Provider,
    imperative: Imperative
};