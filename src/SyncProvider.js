import { isSyncableType, ISyncable } from "./Sync";

export interface ISyncProvider {
    registerType(name: string, ctor: Function): void;
    create(name: string, ...args: any): mixed;
}

export class SyncProvider implements ISyncProvider {

    ctors: { [key: string]: Function }

    constructor() {
        this.ctors = {}
    }

    registerType(name: string, ctor: Class<ISyncable<any>>): void {
        if(isSyncableType(ctor))
            this.ctors[name] = ctor
        else 
            throw new Error("the type with name " + name + " is not implementing the ISyncable interface ")
    }

    create(name: string, ...args: any): ISyncable<any> {
        // FIXME: Is order guaranteed when sending ???
        if (this.ctors[name])
            return new this.ctors[name](...args)
        else 
            throw new Error("There is no ctor with the name " + name + " within the sync provider ")
    }

}