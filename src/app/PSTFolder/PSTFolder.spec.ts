import { PSTFolder } from './PSTFolder.class';
import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
const resolve = require('path').resolve
const expect = chai.expect;
let pstFile: PSTFile;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/michelle_lokay_000_1_1_1_1.pst'));
});

after(() => {
    pstFile.close();
});

describe('PSTFolder tests', () => {
    it('should have a root folder', () => {
        const folder: PSTFolder = pstFile.getRootFolder();
        expect(folder).to.not.be.null;
        expect(folder.hasSubfolders()).to.be.true;
    });
});