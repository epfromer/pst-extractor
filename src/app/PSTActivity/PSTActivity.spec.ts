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

    // get to Journal folder
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
        // console.log(activity.toJSON())
        expect(activity.messageClass).to.equal('IPM.Activity');
        expect(activity.subject).to.equal('called Ed');
        expect(activity.logTypeDesc).to.equal('Phone call');
        expect(activity.bodyPrefix).to.contain('But no one was home');
        expect(activity.logStart).to.eql(new Date("2018-03-06T21:09:00.000Z"));
        expect(activity.logEnd).to.eql(new Date("2018-03-06T21:09:00.000Z"));
        expect(activity.importance).to.equal(1);
        expect(activity.logDuration).to.equal(0);
        expect(activity.logFlags).to.equal(0);
        expect(activity.isDocumentPrinted).to.equal(false);
        expect(activity.isDocumentSaved).to.equal(false);
        expect(activity.isDocumentRouted).to.equal(false);
        expect(activity.isDocumentPosted).to.equal(false);
    });
});