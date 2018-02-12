import * as fs from 'fs';
export class MyObj {
    stream: fs.ReadStream;
    str = "hey there";

    constructor(fileName: string) {
        this.stream = fs.createReadStream(fileName, { start: 0, end: 514 });
        this.stream.on('open', (fd) => {
            // at this point, 'this' is a ReadStream object
            // how do I get to MyObj instance in this callback?
            console.log('fd = ' + JSON.stringify(fd));
            console.log('this = ' + JSON.stringify(this));
        });
        this.stream.on('data', (chunk) => {
            // console.log('chunk = ' + JSON.stringify(chunk));
            // console.log('this = ' + JSON.stringify(this));
        });
    }
}