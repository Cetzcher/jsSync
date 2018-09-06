//@flow

import { sync, autoSync, DECORATED, PRIMITIVE } from "./SyncDecorators";
import { IAutoSyncable, isSyncable, isSyncableType, ISyncable } from "./Sync";
import { SyncProvider } from "./SyncProvider";

const s = new SyncProvider()
type UserSyncable = {name: string, age: number}
@autoSync(s)
class UselessType  implements ISyncable<any>{
    static counter : number

    _uselessValue: number
    _id : number 
    @sync(PRIMITIVE)
    get uselessValue() {
        return this._uselessValue
    }

    set uselessValue(x : number) {
        this._uselessValue = x
    }

    addTo(n : number) {
        return this._uselessValue + n
    }

    constructor() {
        console.log("creating useless object")
        if(!UselessType.counter)
            UselessType.counter = 1
        this._uselessValue = 1
        UselessType.counter += 1
        this._id = UselessType.counter
    }


    syncFrom(data : ?any) { return DECORATED }
    toSyncData() : ?any { return DECORATED }
    isSyncInProgress() { return DECORATED }
}

@autoSync(s)
class UselessType2  implements ISyncable<any>{
    static counter : number

    _uselessValue: number
    _id : number 
    @sync(PRIMITIVE)
    get uselessValue() {
        return this._uselessValue
    }

    set uselessValue(x : number) {
        this._uselessValue = x
    }

    addTo(n : number) {
        return this._uselessValue + n
    }

    constructor() {
        this._uselessValue = 1
        this._id = UselessType.counter
    }


    syncFrom(data : ?any) { return DECORATED }
    toSyncData() : ?any { return DECORATED }
    isSyncInProgress() { return DECORATED }
}

@autoSync(s)
class User implements IAutoSyncable<UserSyncable> {
    
    _name: string
    _age: number
    _useless : UselessType
    _useless2 : UselessType2


    @sync(PRIMITIVE)
     get age() : number{
        return this._age
    }

    set age(x : number) {
        this._age = x
    }

    @sync(PRIMITIVE)
     get name() : string {
        return this._name
    }

    set name(n : string) {
        this._name = n
    }

    @sync(UselessType)
    get uselessValue() {
        return this._useless
    }

    set uselessValue(val : UselessType2) {
        this._useless = val
    }
    @sync(UselessType)
    get uselessValue2() {
        return this._useless
    }

    set uselessValue2(val : UselessType2) {
        this._useless = val
    }


    constructor(name : string, age : number) {
        this._name = name
        this._age = age
        this._useless = new UselessType()
        this._useless2 = new UselessType2()
    }

    syncFrom(data : ?UserSyncable) { return DECORATED }
    toSyncData() : ?UserSyncable { return DECORATED }
    isSyncInProgress() { return DECORATED }
}




const user = new User("Mark", 22)
user.uselessValue.uselessValue = 22
const json = JSON.stringify(user.toSyncData())
console.log("user1 json", json)

const user2 = new User("Mike", 28)
user2.syncFrom(JSON.parse(json))
user.uselessValue.uselessValue = 10
console.log("===========================")
console.log(user2.uselessValue.addTo(0), user.uselessValue.addTo(0))
console.log(user)

//console.log(User.prototype)
//console.log(isSyncable(user))

//const user3 = s.create(User.name, "Haily", 102)

console.log()