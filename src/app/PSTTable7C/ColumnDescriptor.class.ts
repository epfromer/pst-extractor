import * as long from 'long';
import { NodeInfo } from "../NodeInfo/NodeInfo.class";

export class ColumnDescriptor {
    private type: number;
    private ibData: number;
    private cbData: number;
    private iBit: number;

    private _id: number;
    public get id(): number {
        return this._id;
    }

    constructor(nodeInfo: NodeInfo, offset: number) {
        this.type = nodeInfo.seekAndReadLong(long.fromValue(offset), 2).toNumber(); // & 0xFFFF;
        this._id = nodeInfo.seekAndReadLong(long.fromValue(offset + 2), 2).toNumber(); // & 0xFFFF;
        this.ibData = nodeInfo.seekAndReadLong(long.fromValue(offset + 4), 2).toNumber(); // & 0xFFFF;
        this.cbData = nodeInfo.pstNodeInputStream.read(); // & 0xFFFF;
        this.iBit = nodeInfo.pstNodeInputStream.read(); // & 0xFFFF;
    }
}