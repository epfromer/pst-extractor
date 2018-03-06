import { PSTActivity } from './PSTActivity.class';
import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
const resolve = require('path').resolve;
const expect = chai.expect;
let pstFile: PSTFile;
let folder: PSTFolder;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/mtnman1965@outlook.com.ost'));

    // get to Tasks folder
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
    folder = childFolders[1]; // Root - Mailbox
    childFolders = folder.getSubFolders();
    folder = childFolders[4]; // IPM_SUBTREE
    childFolders = folder.getSubFolders();
    folder = childFolders[15]; // Journal
});

after(() => {
    pstFile.close();
});

describe('PSTActivity tests', () => {
    it('should have a Journal folder', () => {
        expect(folder.displayName).to.equal('Journal');
    });

    it('root folder should have a journal entry', () => {
        let activity: PSTActivity = folder.getNextChild();
        console.log(activity.toJSONstring())
        
    });
});
