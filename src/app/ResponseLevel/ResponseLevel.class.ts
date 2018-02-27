import * as long from 'long';

export class ResponseLevel {
    private _deltaCode: number;
    private _timeDelta: long;
    private _random: number;

    constructor(deltaCode: number, timeDelta: long, random: number) {
        this._deltaCode = deltaCode;
        this._timeDelta = timeDelta;
        this._random = random;
    }

    public deltaCode(): number {
        return this._deltaCode;
    }

    public timeDelta(): long {
        return this._timeDelta;
    }

    public random(): number {
        return this._random;
    }

    public withOffset(anchorDate: Date): Date {
        // TODO
        debugger;
        return new Date();
        //return new Date(anchorDate.getTime() + this.timeDelta);
    }
}
