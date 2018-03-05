import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from './PSTFile.class';
const resolve = require('path').resolve
const expect = chai.expect;
let pstFile: PSTFile;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/michelle_lokay_000_1_1_1_1.pst'));
});

after(() => {
    pstFile.close();
});

describe('PSTfile tests', () => {
    it('should open the file', () => {
        expect(pstFile.encryptionType).to.equal(1);
        expect(pstFile.pstFileType).to.equal(23);
        expect(pstFile.pstFilename).to.contain('michelle_lokay_000_1_1_1_1.pst');
        expect(pstFile.getMessageStore().getDisplayName()).to.equal('Personal folders');
        expect(pstFile.getRootFolder()).to.not.be.null;
    });
});