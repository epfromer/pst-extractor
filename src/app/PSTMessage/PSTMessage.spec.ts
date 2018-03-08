import { PSTMessage } from './PSTMessage.class';
import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
const resolve = require('path').resolve;
const expect = chai.expect;
let pstFile: PSTFile;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/michelle_lokay_000_1_1_1_1.pst'));
});

after(() => {
    pstFile.close();
});

// get these emails
// Personal folders
//  |- Top of Personal Folders
//  |  |- Deleted Items
//  |  |- lokay-m
//  |  |  |- MLOKAY (Non-Privileged)
//  |  |  |  |- TW-Commercial Group
//  |  |  |  |  |- Email: 2097188 - New OBA's
//  |  |  |  |  |- Email: 2097220 - I/B Link Capacity for November and December 2001

describe('PSTMessage tests', () => {
    it('should have email messages', () => {
        let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
        expect(childFolders.length).to.equal(3);
        let folder = childFolders[0];
        expect(folder.subFolderCount).to.equal(2);
        expect(folder.displayName).to.equal('Top of Personal Folders');
        childFolders = folder.getSubFolders();
        folder = childFolders[0];
        expect(folder.displayName).to.equal('Deleted Items');
        folder = childFolders[1];
        expect(folder.displayName).to.equal('lokay-m');
        childFolders = folder.getSubFolders();
        folder = childFolders[0];
        expect(folder.displayName).to.equal('MLOKAY (Non-Privileged)');
        childFolders = folder.getSubFolders();
        expect(childFolders[0].displayName).to.equal('TW-Commercial Group');
        const comGroupFolder = childFolders[0];
        
        let msg: PSTMessage = comGroupFolder.getNextChild();
        expect(msg.messageClass).to.equal('IPM.Note');
        expect(msg.subject).to.equal("New OBA's");
        expect(msg.sentRepresentingEmailAddress).to.equal('Dennis.Lee@ENRON.com');
        expect(msg.displayTo).to.equal('Lindberg  Lorraine; Watson  Kimberly');
        let body = msg.body;
        expect(body).to.contain('Mojave (Effective date 12/02/01) and Williams Field Services')
        expect(body.length).to.equal(678);
        
        msg = comGroupFolder.getNextChild();
        expect(msg.messageClass).to.equal('IPM.Note');
        expect(msg.subject).to.equal("I/B Link Capacity for November and December 2001");
        expect(msg.sentRepresentingEmailAddress).to.equal('JReames@br-inc.com');
        expect(msg.displayTo).to.equal('Michelle Lokay (E-mail)');
        body = msg.body;
        expect(body).to.contain('Per our earlier conversation, Burlington Resources agrees to purchase 20,000')
        expect(body.length).to.equal(661);
    });
});
