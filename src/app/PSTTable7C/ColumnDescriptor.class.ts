import * as long from 'long';
import { NodeInfo } from "../NodeInfo/NodeInfo.class";

export class ColumnDescriptor {
    private _ibData: number;
    public get ibData(): number {
        return this._ibData;
    }

    private _cbData: number;
    public get cbData(): number {
        return this._cbData;
    }

    private _type: number;
    public get type(): number {
        return this._type;
    }
    
    private _iBit: number;
    public get iBit(): number {
        return this._iBit;
    }
    
    private _id: number;
    public get id(): number {
        return this._id;
    }

    constructor(nodeInfo: NodeInfo, offset: number) {
        this._type = nodeInfo.seekAndReadLong(long.fromValue(offset), 2).toNumber(); // & 0xFFFF;
        this._id = nodeInfo.seekAndReadLong(long.fromValue(offset + 2), 2).toNumber(); // & 0xFFFF;
        this._ibData = nodeInfo.seekAndReadLong(long.fromValue(offset + 4), 2).toNumber(); // & 0xFFFF;
        this._cbData = nodeInfo.pstNodeInputStream.read(); // & 0xFFFF;
        this._iBit = nodeInfo.pstNodeInputStream.read(); // & 0xFFFF;
    }
}