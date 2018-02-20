import { PSTNodeInputStream } from "../PSTNodeInputStream/PSTNodeInputStream.class";
import * as long from 'long';

export class NodeInfo {
    private _startOffset: number;
    get startOffset() { return this._startOffset; }

    private _endOffset: number;
    get endOffset() { return this._endOffset; }

    private _pstNodeInputStream: PSTNodeInputStream;
    get pstNodeInputStream() { return this._pstNodeInputStream; }

    constructor(start: number, end: number, pstNodeInputStream: PSTNodeInputStream) {
        if (start > end) {
            throw new Error(`Invalid NodeInfo parameters: start ${start} is greater than end ${end}`);
        }
        this._startOffset = start;
        this._endOffset = end;
        this._pstNodeInputStream = pstNodeInputStream;
    }

    public length(): number {
        return this.endOffset - this.startOffset;
    }

    public seekAndReadLong(offset: number, length: number): long {
        return this.pstNodeInputStream.seekAndReadLong(this.startOffset + offset, length);
    }
}

