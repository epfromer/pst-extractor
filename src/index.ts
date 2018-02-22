import { PSTFile } from './app/PSTFile/PSTFile.class';

debugger; 
let pstFile = new PSTFile('/home/ed/Desktop/outlook/2005-02.pst');
pstFile.open();

debugger;
console.log(pstFile.getMessageStore().getDisplayName());

debugger;
console.log('exiting');