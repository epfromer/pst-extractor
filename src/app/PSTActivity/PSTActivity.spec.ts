import { PSTActivity } from './PSTActivity.class';
import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
const resolve = require('path').resolve
const expect = chai.expect;
let pstFile: PSTFile;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/mtnman1965@outlook.com.ost'));
});

after(() => {
    pstFile.close();
});

describe('PSTActivity tests', () => {
    it('should have a Journal folder', () => {
        // let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
        // let folder = childFolders[1];  // Root - Mailbox
        // childFolders = folder.getSubFolders();
        // folder = childFolders[4];  // IPM_SUBTREE
        // childFolders = folder.getSubFolders();
        // folder = childFolders[17];  // Tasks
        // expect(folder.displayName).to.equal('Tasks');
        // let task: PSTActivity = folder.getNextChild();
        // console.log(task.subject)
        // console.log(task.toJSONstring())

    });

    // folder structure should look like:
    // Personal folders
    //  |- Top of Personal Folders
    //  |  |- Deleted Items
    //  |  |- lokay-m
    //  |  |  |- MLOKAY (Non-Privileged)
    //  |  |  |  |- TW-Commercial Group
    //  |  |  |  |- Systems
    //  |  |  |  |- Sent Items
    //  |  |  |  |- Personal
    //  |- Search Root
    //  |- SPAM Search Folder 2

    it('root folder should have sub folders', () => {
        // let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
        // console.log(childFolders.length)
        // expect(childFolders.length).to.equal(3);
        // let folder = childFolders[0];
        // expect(folder.subFolderCount).to.equal(2);
        // expect(folder.displayName).to.equal('Top of Personal Folders');
        // childFolders = folder.getSubFolders();
        // folder = childFolders[0];
        // expect(folder.displayName).to.equal('Deleted Items');
        // folder = childFolders[1];
        // expect(folder.displayName).to.equal('lokay-m');
        // childFolders = folder.getSubFolders();
        // folder = childFolders[0];
        // expect(folder.displayName).to.equal('MLOKAY (Non-Privileged)');
        // childFolders = folder.getSubFolders();
        // expect(childFolders[0].displayName).to.equal('TW-Commercial Group');
        // expect(childFolders[1].displayName).to.equal('Systems');
        // expect(childFolders[2].displayName).to.equal('Sent Items');
        // expect(childFolders[3].displayName).to.equal('Personal');
    });
});

