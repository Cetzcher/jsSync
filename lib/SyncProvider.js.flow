// @flow

import { isSyncableType, ISyncable } from "./Sync";

export interface ISyncProvider {
    registerType(name: string, ctor: Function): void;
    create(name: string, ...args: any): ISyncable;
}

/**
 * provides a mapping of types to instances.
 */
export class SyncProvider implements ISyncProvider {

    ctors: { [key: string]: Class<ISyncable> }

    constructor() {
        this.ctors = {}
    }

    registerType(name: string, ctor: Class<ISyncable>): void {
        if (isSyncableType(ctor))
            this.ctors[name] = ctor
        else
            throw new Error("the type with name " + name + " is not implementing the ISyncable interface ")
    }

    // TODO: fix the type here
    create(name: string, ...args: any): ISyncable {
        // FIXME: Is order guaranteed when sending ???
        if (this.ctors[name]) {
            const ctor : any = this.ctors[name]
            return new ctor(...args)
        } else {
            throw new Error("There is no ctor with the name " + name + " within the sync provider ")
        }
    }

}