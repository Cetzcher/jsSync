//@flow

import Chai, { assert, expect} from "chai"

Chai.should()
Chai.use(require("chai-things"))

import { describe, it, before } from "mocha"

import Sync from "../src"
const {createSyncData, isSyncable, isSyncableType, lateBindMember, syncListItems, syncTo} = Sync.util
const { SyncProvider } = Sync.provider
const {autoImplementSyncable, autoSync, sync, DECORATED, LATE_BIND, PRIMITIVE} = Sync.decorator
const { declareSyncable } = Sync.imperative
import { IAutoSyncable, ISyncable } from "../src/Sync"
 
const syncProvider = new SyncProvider()

@autoSync(syncProvider)
class Complex implements IAutoSyncable {
    _real: number
    _imaginary: number

    @sync(PRIMITIVE)
    get real() { return this._real }
    @sync(PRIMITIVE)
    get imaginary() { return this._imaginary }

    set real(r) { this._real = r }
    set imaginary(i) { this._imaginary = i }

    getSum() { return this.real + this.imaginary}

    constructor() {
        this.imaginary = 0
        this.real = 0
    }

    syncFrom(data : any) { return DECORATED }
    toSyncData() : any { return DECORATED }
    isSyncInProgress() : boolean { return DECORATED }

}

// TODO: sync(TYPE, NAME) // name is broken
@autoSync(syncProvider)
class ADataClass implements IAutoSyncable{

    _numval: number            // full sync with setter
    _stringval: string         // string val without setter sync
    _complexVal: Complex       // complex type
    _val: string               // will not be synced

    @sync(PRIMITIVE)
    get numval() { return this._numval }
    @sync(PRIMITIVE)
    get stringval() { return this._stringval }
    @sync(Complex)
    get complexVal() { return this._complexVal }
    get val() { return this._val }

    set numval(v) { this._numval = v }
    set complexVal(v) { this._complexVal = v }
    set val(v) { this._val = v }
    set stringval(x) {this._stringval = x}

    constructor() {
        this._numval = 1
        this._stringval = "hello "
        this._complexVal = new Complex()
        this._val = "dont sync this"
    }

    syncFrom(data : any) { return DECORATED }
    toSyncData() : any { return DECORATED }
    isSyncInProgress() : boolean { return DECORATED }

}

class AImperativeDataClass implements IAutoSyncable {

    _numval: number            // full sync with setter
    _stringval: string         // string val without setter sync
    _complexVal: Complex       // complex type
    _val: string               // will not be synced

    get numval() { return this._numval }
    get stringval() { return this._stringval }
    get complexVal() { return this._complexVal }
    get val() { return this._val }

    set numval(v) { this._numval = v }
    set complexVal(v) { this._complexVal = v }
    set val(v) { this._val = v }
    set stringval(x) {this._stringval = x}

    constructor() {
        this._numval = 1
        this._stringval = "hello "
        this._complexVal = new Complex()
        this._val = "dont sync this"

        declareSyncable(this, syncProvider, (defineSyncableProp) => {
            defineSyncableProp("numval", PRIMITIVE)
            defineSyncableProp("stringval", PRIMITIVE),
            defineSyncableProp("complexVal", Complex)
        })
    }

    syncFrom(data : any) { return DECORATED }
    toSyncData() : any { return DECORATED }
    isSyncInProgress() : boolean { return DECORATED }

}

describe("auto sync should setup the required fields on the prototype", () => {
    it("all annotated getters of ADataClass should be within the prototype.syncItems member", () => {
        const p = ADataClass.prototype
        //$FlowFixMe
        const sItems = p.syncItems
        expect(sItems).to.have.keys("numval", "complexVal", "stringval")
    })
    it("test completeness of all keys of the prototype.syncItems", () =>  {
        const p = ADataClass.prototype
        //$FlowFixMe
        const sItems = p.syncItems
        const numvalP = sItems["numval"]
        const complexvalP = sItems["complexVal"]
        const stringvalP = sItems["stringval"]
        expect(sItems).to.exist
        expect(complexvalP).to.exist
        expect(stringvalP).to.exist

        expect(complexvalP).to.have.keys("propName", "type", "allowLateBinding")
        expect(complexvalP.propName).to.eql("complexVal")
        expect(complexvalP.type).to.eql(Complex)
        expect(complexvalP.allowLateBinding).to.eql(false)

        expect(stringvalP).to.have.keys("propName", "type", "allowLateBinding")
        expect(stringvalP.propName).to.eql("stringval")
        expect(stringvalP.type).to.eql(PRIMITIVE)
        expect(stringvalP.allowLateBinding).to.eql(false)

    })
    it("test that val does not occur in data class", () => {
        const p = ADataClass.prototype
        //$FlowFixMe
        const sItems = p.syncItems
        expect(sItems).not.to.contain.keys("val")
    })
    it("prototype of autoSync annotated type should contain a field for the syncProvider", () => {
        const p = ADataClass.prototype
        //$FlowFixMe
        const provider = p.syncProvider
        expect(provider).to.exist.and.to.eql(syncProvider)
    })
}) 

describe("SyncProvider should be able to create instances of ADataClass and Complex", () => {
    it("SyncProvider should contain ctors for Complex and ADataClass", () => {
        expect(syncProvider.ctors).to.have.keys([ADataClass.name, Complex.name])
    })
    it("SyncProvider should be able to create instance of an object", () => {
        expect(syncProvider.create(Complex.name)).to.eql(new Complex())
    })
    it("sync provider should fail when the type is unknown", () => {
        const f = () => syncProvider.create("non existing string")
        expect(f).to.throw()
    })
    it("when adding a type to the syncProvider that is not syncable the provider should fail", () => {
        expect(syncProvider.registerType.bind(syncProvider,  "some name", Number)).to.throw()
    })
    it("adding a new type should work", () => {
        class X implements IAutoSyncable {
            syncFrom(data : any) { return DECORATED }
            toSyncData() : any { return DECORATED }
            isSyncInProgress() : boolean { return DECORATED }
        }
        syncProvider.registerType(X.name, X)
        expect(syncProvider.create(X.name)).to.eql(new X())
    })
})

describe("test wether types are syncable", () => {
    it("test object is syncable", () => {
        expect(isSyncable(new Complex())).to.eql(true)
    })
    it("test type is syncable", () => {
        expect(isSyncableType(Complex)).to.eqls(true)
    })
    it("test unsyncable type", () => {
        class Unsycable {}
        expect(isSyncableType(Unsycable)).to.eqls(false)
    })
})

describe("creating sync data from given objects", () => {
    it("when calling createSyncData on a object of type complex, it should create a json like structure", () => {
        const item = new Complex()
        item.real = 21
        item.imaginary = 7
        const syncData = createSyncData(item)

        const realMemberResult = {prop: "real", value: 21}
        const imaginaryMemberResult = {prop: "imaginary", value: 7}

        expect(syncData).to.eql([realMemberResult, imaginaryMemberResult])
    })
    it("when adding a new property to the object, the result of create sync data should not change", () => {
        const item = new Complex()
        item.real = 21
        item.imaginary = 7
        //$FlowFixMe
        item.x = 3

        const realMemberResult = {prop: "real", value: 21}
        const imaginaryMemberResult = {prop: "imaginary", value: 7}

        const syncData = createSyncData(item)
        expect(syncData).to.eql([realMemberResult, imaginaryMemberResult])
    })
})

describe("test synchronization of two complex values", () => {
    it("complex values should mirror each other after sync", () => {
        const c1 = new Complex()
        c1.real = 7
        const c2 = new Complex()
        // before sync
        expect(c1.real).to.eq(7)
        expect(c2.real).to.eq(0)

        c2.syncFrom(c1.toSyncData())

        // after sync
        expect(c1.real).to.eq(7)
        expect(c2.real).to.eq(7)
    })

    it("complex data should be mirrored using JSON", () => {
        const c1 = new Complex()
        c1.real = 7
        const c2 = new Complex()
        const c1JSON = JSON.stringify(c1.toSyncData())
        c2.syncFrom(JSON.parse(c1JSON))
        expect(c1.real).to.eq(7)
        expect(c2.real).to.eq(7)
    })
})

describe("test sync of types that contain non primitive, sync-annotated, fields", () => {
    it("complex fields of data class should be identical", () => {
        const a1 = new ADataClass()
        const a2 = new ADataClass()
        a1.complexVal.real = 22
        a1.complexVal.imaginary = 8
        const aVal = a1.complexVal.getSum()
        expect(aVal).to.not.eql(a2.complexVal.getSum())

        // sync 
        a2.syncFrom(a1.toSyncData())
        expect(aVal).to.eql(a2.complexVal.getSum())

        // a2.complexVal and a1.complexVal are synced,  however they are two different objects
        a2.complexVal.imaginary = 2
        expect(a1.complexVal.imaginary).to.not.eql(2)

    })
    it("complex fields of data class should be identical after sync with json, methods should also be callable on both objects", () => {
        const a1 = new ADataClass()
        const a2 = new ADataClass()
        a1.complexVal.real = 22
        a1.complexVal.imaginary = 8
        const aVal = a1.complexVal.getSum()
        expect(aVal).to.not.eql(a2.complexVal.getSum())

        // sync 
        const json = JSON.stringify(a1.toSyncData())
        a2.syncFrom(JSON.parse(json))
        expect(aVal).to.eql(a2.complexVal.getSum())

        // a2.complexVal and a1.complexVal are synced,  however they are two different objects
        a2.complexVal.imaginary = 2
        expect(a1.complexVal.imaginary).to.not.eql(2)

    })
    it("test late binding of cyclic references", () => {
        @autoSync(syncProvider)
        class X implements IAutoSyncable{
            _someX : ?X
            @sync(LATE_BIND)
            get x() { return this._someX}
            set x(x) { this._someX = x}
            @sync(PRIMITIVE)
            get num() {return this._n}
            set num(x) {this._n=x}
            _n: number 

            constructor() {
                this._someX = undefined
                this._n = 0
                lateBindMember(this, "x", X)  // always the name of the getter
            }

            syncFrom(data : any) { return DECORATED }
            toSyncData() : any { return DECORATED }
            isSyncInProgress() : boolean { return DECORATED }
        }

        const obj1 = new X()
        obj1.num = 1020
        const inner = new X()
        inner.num = 27
        obj1.x = inner
        const otherObj = new X()
        otherObj.syncFrom(obj1.toSyncData())

        expect(obj1.num).to.eq(otherObj.num)
        //$FlowFixMe
        expect(obj1.x.num).to.eq(otherObj.x.num)
        // before sync
        // obj1 <NUM 27>
        //  |-> inner <NUM 1020>

        // otherObj <NUM 0>
        //  |-> undefined

        // after sync
        // obj1 <NUM 27>
        //  |-> inner <NUM 1020>  <====== |
        //                                | Objects are equal but not shared
        // otherObj <NUM 27>              | i.e otherObj.num = -1 wont change obj1
        //  |-> inner <NUM 1020>  =====>  |


    })

})

describe("test sync of types that contain non primitive, explicitly declared fields", () => {
    it("complex fields of data class should be identical", () => {
        const a1 = new AImperativeDataClass()
        const a2 = new AImperativeDataClass()
        a1.complexVal.real = 22
        a1.complexVal.imaginary = 8
        const aVal = a1.complexVal.getSum()
        expect(aVal).to.not.eql(a2.complexVal.getSum())

        // sync 
        a2.syncFrom(a1.toSyncData())
        expect(aVal).to.eql(a2.complexVal.getSum())

        // a2.complexVal and a1.complexVal are synced,  however they are two different objects
        a2.complexVal.imaginary = 2
        expect(a1.complexVal.imaginary).to.not.eql(2)

    })
    it("complex fields of data class should be identical after sync with json, methods should also be callable on both objects", () => {
        const a1 = new AImperativeDataClass()
        const a2 = new AImperativeDataClass()
        a1.complexVal.real = 22
        a1.complexVal.imaginary = 8
        const aVal = a1.complexVal.getSum()
        expect(aVal).to.not.eql(a2.complexVal.getSum())

        // sync 
        const json = JSON.stringify(a1.toSyncData())
        a2.syncFrom(JSON.parse(json))
        expect(aVal).to.eql(a2.complexVal.getSum())

        // a2.complexVal and a1.complexVal are synced,  however they are two different objects
        a2.complexVal.imaginary = 2
        expect(a1.complexVal.imaginary).to.not.eql(2)

    })
})