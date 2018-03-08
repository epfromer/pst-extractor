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
        expect(contact.subject).to.equal('Ed Pfromer');
        expect(contact.importance).to.equal(1);
        expect(contact.account).to.equal('');
        expect(contact.callbackTelephoneNumber).to.equal('');
        expect(contact.transportMessageHeaders).to.equal('');
        expect(contact.generation).to.equal('');
        expect(contact.givenName).to.equal('Ed');
        expect(contact.governmentIdNumber).to.equal('');
        expect(contact.businessTelephoneNumber).to.equal('(720) 666-9776');
        expect(contact.homeTelephoneNumber).to.equal('');
        expect(contact.initials).to.equal('E.P.');
        expect(contact.keyword).to.equal('');
        expect(contact.language).to.equal('');
        expect(contact.location).to.equal('');
        expect(contact.mhsCommonName).to.equal('');
        expect(contact.organizationalIdNumber).to.equal('');
        expect(contact.surname).to.equal('Pfromer');
        expect(contact.originalDisplayName).to.equal('');
        expect(contact.postalAddress).to.equal('300 Edison Place\r\nSuperior, CO  80027');
        expect(contact.companyName).to.equal('Klonzo, LLC');
        expect(contact.title).to.equal('President');
        expect(contact.departmentName).to.equal('');
        expect(contact.officeLocation).to.equal('');
        expect(contact.primaryTelephoneNumber).to.equal('');
        expect(contact.business2TelephoneNumber).to.equal('');
        expect(contact.mobileTelephoneNumber).to.equal('');
        expect(contact.radioTelephoneNumber).to.equal('');
        expect(contact.carTelephoneNumber).to.equal('');
        expect(contact.otherTelephoneNumber).to.equal('');
        expect(contact.transmittableDisplayName).to.equal('');
        expect(contact.pagerTelephoneNumber).to.equal('');
        expect(contact.primaryFaxNumber).to.equal('');
        expect(contact.businessFaxNumber).to.equal('');
        expect(contact.homeFaxNumber).to.equal('');
        expect(contact.businessAddressCountry).to.equal('United States of America');
        expect(contact.businessAddressCity).to.equal('Superior');
        expect(contact.businessAddressStateOrProvince).to.equal('CO');
        expect(contact.businessAddressStreet).to.equal('300 Edison Place');
        expect(contact.businessPostalCode).to.equal('80027');
        expect(contact.businessPoBox).to.equal('');
        expect(contact.isdnNumber).to.equal('');
        expect(contact.assistantTelephoneNumber).to.equal('');
        expect(contact.home2TelephoneNumber).to.equal('');
        expect(contact.assistant).to.equal('');
        expect(contact.hobbies).to.equal('');
        expect(contact.middleName).to.equal('');
        expect(contact.displayNamePrefix).to.equal('');
        expect(contact.profession).to.equal('');
        expect(contact.preferredByName).to.equal('');
        expect(contact.spouseName).to.equal('');
        expect(contact.computerNetworkName).to.equal('');
        expect(contact.customerId).to.equal('');
        expect(contact.ttytddPhoneNumber).to.equal('');
        expect(contact.ftpSite).to.equal('');
        expect(contact.managerName).to.equal('');
        expect(contact.nickname).to.equal('');
        expect(contact.personalHomePage).to.equal('');
        expect(contact.businessHomePage).to.equal('www.tomoab.com');
        expect(contact.smtpAddress).to.equal('epfromer@gmail.com');
        expect(contact.childrensNames).to.equal('');
        expect(contact.homeAddressCity).to.equal('');
        expect(contact.homeAddressCountry).to.equal('');
        expect(contact.homeAddressPostalCode).to.equal('');
        expect(contact.homeAddressStateOrProvince).to.equal('');
        expect(contact.homeAddressStreet).to.equal('');
        expect(contact.homeAddressPostOfficeBox).to.equal('');
        expect(contact.otherAddressCity).to.equal('');
        expect(contact.otherAddressCountry).to.equal('');
        expect(contact.otherAddressPostalCode).to.equal('');
        expect(contact.otherAddressStateOrProvince).to.equal('');
        expect(contact.otherAddressStreet).to.equal('');
        expect(contact.otherAddressPostOfficeBox).to.equal('');
        expect(contact.fileUnder).to.equal('Pfromer, Ed');
        expect(contact.homeAddress).to.equal('');
        expect(contact.workAddress).to.equal('300 Edison Place\r\nSuperior, CO  80027');
        expect(contact.otherAddress).to.equal('');
        expect(contact.postalAddressId).to.equal(2);
        expect(contact.html).to.equal('www.tomoab.com');
        expect(contact.workAddressStreet).to.equal('300 Edison Place');
        expect(contact.workAddressCity).to.equal('Superior');
        expect(contact.workAddressState).to.equal('CO');
        expect(contact.workAddressPostalCode).to.equal('80027');
        expect(contact.workAddressCountry).to.equal('United States of America');
        expect(contact.workAddressPostOfficeBox).to.equal('');
        expect(contact.email1DisplayName).to.equal('Ed Pfromer (epfromer@gmail.com)');
        expect(contact.email1AddressType).to.equal('SMTP');
        expect(contact.email1EmailAddress).to.equal('epfromer@gmail.com');
        expect(contact.email1OriginalDisplayName).to.equal('epfromer@gmail.com');
        expect(contact.email1EmailType).to.equal('');
        expect(contact.email2DisplayName).to.equal('');
        expect(contact.email2AddressType).to.equal('');
        expect(contact.transportMessageHeaders).to.equal('');


        expect(contact.email1DisplayName).to.equal('Ed Pfromer (epfromer@gmail.com)');
        expect(contact.creationTime).to.eql(new Date("2018-03-05T20:27:06.017Z"));  
        expect(contact.displayName).to.equal('Ed Pfromer');
        expect(contact.rtfBody).to.contain('ever gonna let you down');
    });
});

    // "email1EmailType": "",
    // "email2DisplayName": "",
    // "email2AddressType": "",
    // "email2EmailAddress": "",
    // "email2OriginalDisplayName": "",
    // "email3DisplayName": "",
    // "email3AddressType": "",
    // "email3EmailAddress": "",
    // "email3OriginalDisplayName": "",
    // "fax1AddressType": "FAX",
    // "fax1EmailAddress": "",
    // "fax1OriginalDisplayName": "",
    // "fax2AddressType": "FAX",
    // "fax2EmailAddress": "",
    // "fax2OriginalDisplayName": "",
    // "fax3AddressType": "FAX",
    // "fax3EmailAddress": "",
    // "fax3OriginalDisplayName": "",
    // "freeBusyLocation": "",
    // "birthday": null,
    // "anniversary": null