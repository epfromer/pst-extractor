import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from './PSTFile.class';

const expect = chai.expect;

beforeEach(() => {});

describe('PSTfile tests', () => {
    it('should open the file', () => {
        let pstFile = new PSTFile('/media/sf_Outlook/test/michelle_lokay_000_1_1_1_1.pst');
        expect(pstFile.encryptionType).to.equal(1);
        expect(pstFile.pstFileType).to.equal(23);
        expect(pstFile.pstFilename).to.contain('michelle_lokay_000_1_1_1_1.pst');
    });
});