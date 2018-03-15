import { PSTObject } from './PSTObject.class';
import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { Log } from '../Log.class';
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

describe('PSTObject tests', () => {
    it('should have basic attributes', () => {
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
        // Log.debug1(JSON.stringify(comGroupFolder, null, 2));
        
        let msg: PSTMessage = comGroupFolder.getNextChild();
        // Log.debug1(JSON.stringify(msg, null, 2));
        expect(msg.messageClass).to.equal('IPM.Note');
        expect(msg.stringCodepage).to.equal('us-ascii');
        expect(msg.messageSize.toNumber()).to.equal(653764);
    });
});
