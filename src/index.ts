import { PSTFile } from './app/PSTFile/PSTFile.class';

let file = new PSTFile('/home/ed/Desktop/outlook/2005-02.pst');
file.open();

// var i = 0;
// setInterval(() => {
// 	console.log('hello world:' + i++);
// }, 1000);

console.log('exiting');