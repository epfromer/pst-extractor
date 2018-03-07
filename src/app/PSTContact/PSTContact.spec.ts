import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
import { PSTContact } from './PSTContact.class';
const resolve = require('path').resolve;
const expect = chai.expect;
let pstFile: PSTFile;
let folder: PSTFolder;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/mtnman1965@outlook.com.ost'));

    // get to Contact folder
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
    folder = childFolders[1]; // Root - Mailbox
    childFolders = folder.getSubFolders();
    folder = childFolders[4]; // IPM_SUBTREE
    childFolders = folder.getSubFolders();
    folder = childFolders[10]; // Calendar
});

after(() => {
    pstFile.close();
});

describe('PSTContact tests', () => {
    it('should have a Contact folder', () => {
        expect(folder.displayName).to.equal('Contacts');
    });
 
    it('should have a contact', () => {
        let contact: PSTContact = folder.getNextChild();
        console.log(contact.toJSONstring())
        expect(contact.messageClass).to.equal('IPM.Contact');
        // expect(appt.subject).to.equal('get lunch');
        // expect(appt.startTime).to.eql(new Date("2018-03-04T19:00:00.000Z"));
        // expect(appt.senderName).to.equal('Mountain Man');
        // expect(appt.duration).to.equal(60);
    });
});
