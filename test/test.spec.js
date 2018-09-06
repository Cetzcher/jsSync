//@flow

import Chai, { assert, expect} from "chai"

Chai.should()
Chai.use(require("chai-things"))

import { describe, it, before } from "mocha"

import{sync, PRIMITIVE, SyncProvider, autoSync, ISyncable, createSyncData, DECORATED, IAutoSyncable, isSyncable, isSyncableType} from "../src"

const syncProvider = new SyncProvider()

@autoSync(syncProvider)
class Complex implements IAutoSyncable<any> {
    _real: number
    _imaginary: number

    @sync(PRIMITIVE)
    get real() { return this._real }
    @sync(PRIMITIVE)
    get imaginary() { return this._imaginary }

    set real(r) { this._real = r }
    set imaginary(i) { this._imaginary = i }

    constructor() {
        this.imaginary = 0
        this.real = 0
    }

    syncFrom(data : any) { return DECORATED }
    toSyncData() : any { return DECORATED }
    isSyncInProgress() : boolean { return DECORATED }

}

@autoSync(syncProvider)
class ADataClass implements IAutoSyncable{

    _numval: number            // full sync with setter
    _stringval: string         // string val without setter sync
    _complexVal: Complex       // complex type
    _val: string               // will not be synced

    @sync(PRIMITIVE)
    get numval() { return this._numval }
    @sync(PRIMITIVE, "_stringval")
    get stringval() { return this._stringval }
    @sync(Complex)
    get complexVal() { return this._complexVal }
    get val() { return this._val }

    set numval(v) { this._numval = v }
    set complexVal(v) { this._complexVal = v }
    set val(v) { this._val = v }

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
        expect(stringvalP.propName).to.eql("_stringval")
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
        class X implements IAutoSyncable<any> {
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