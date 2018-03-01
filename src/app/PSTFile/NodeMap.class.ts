import { Log } from '../Log.class';
import * as long from 'long';

// TODO - doco
export class NodeMap {
    private nameToId: Map<string, number> = new Map();
    private idToNumericName: Map<number, long> = new Map();
    private idToStringName: Map<number, string> = new Map();

    public setId(key: any, propId: number, idx?: number) {
        if (typeof key === 'number') {
            let lkey = this.transformKey(key, idx);
            this.nameToId.set(lkey.toString(), propId);
            this.idToNumericName.set(propId, lkey);
            Log.debug1('NodeMap::setId: propId = ' + propId + ', lkey = ' + lkey.toString());
        } else if (typeof key === 'string') {
            this.nameToId.set(key, propId);
            this.idToStringName.set(propId, key);
            Log.debug1('NodeMap::setId: propId = ' + propId + ', key = ' + key);
        } else {
            throw new Error('NodeMap::setId bad param type ' + typeof key);
        }
    }

    public getId(key: any, idx?: number): number {
        let id: number;
        if (typeof key === 'number') {
            id = this.nameToId.get(this.transformKey(key, idx).toString());
        } else if (typeof key === 'string') {
            id = this.nameToId.get(key);
        } else {
            throw new Error('NodeMap::getId bad param type ' + typeof key);
        }
        if (!id) {
            return -1;
        }
        return id;
    }

    public getNumericName(propId: number): long {
        let lkey = this.idToNumericName.get(propId);
        if (!lkey) {
            Log.debug2("NodeMap::getNumericName Name to Id mapping not found, propId = " + propId);
        }
        return lkey;
    }    

    private transformKey(key: number, idx: number): long {
        let lidx = long.fromNumber(idx);
        lidx = lidx.shiftLeft(32);
        lidx = lidx.or(key);
        // console.log(lidx.toString())
        return lidx;
    }

}