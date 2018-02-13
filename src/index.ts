import { PSTFile } from './app/PSTFile/PSTFile.class';

let file = new PSTFile('/home/ed/Desktop/outlook/2005-02.pst');
file.open().then((result) => {
    console.log(result);
});
console.log('exiting');

 