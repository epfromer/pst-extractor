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
        // console.log(contact.toJSONstring());
        expect(contact.messageClass).to.equal('IPM.Contact');
        expect(contact.businessTelephoneNumber).to.equal('(720) 666-9776');
        expect(contact.postalAddress).to.equal('300 Edison Place\r\nSuperior, CO  80027');
        expect(contact.email1EmailAddress).to.equal('epfromer@gmail.com');
        expect(contact.html).to.equal('www.tomoab.com');
        expect(contact.companyName).to.equal('Klonzo, LLC');
        expect(contact.email1DisplayName).to.equal('Ed Pfromer (epfromer@gmail.com)');
        expect(contact.creationTime).to.eql(new Date("2018-03-05T20:27:06.017Z"));  
        expect(contact.displayName).to.equal('Ed Pfromer');
    });
});
