import * as long from 'long';
import { Log } from '../Log.class';

export class NodeMap {
    private nameToId: Map<string, number> = new Map();
    //private nameStrToId: Map<string, number> = new Map();
    //private stringToId: Map<string, number> = new Map();
    private idToName: Map<number, long> = new Map();
    //private idToString: Map<number, string> = new Map();

    public setNumeric(key: number, idx: number, propId: number) {
        let lkey = this.transformKey(key, idx);
        this.nameToId.set(lkey, propId);
        Log.debug1('PSTFile::processNameToIDMap numeric key: ' + lkey.toString());
    }

    public getID(key: number, idx: number): number {
        let id = this.nameToId.get(this.transformKey(key, idx));
        if (id == null) {
            return -1;
        }
        return id;
    }

    private transformKey(key: number, idx: number): string {
        let lidx = long.fromNumber(idx);
        lidx = lidx.shiftLeft(32);
        lidx = lidx.or(key);
        // console.log(lidx.toString())
        return lidx.toString();
    }

}