import * as chai from 'chai'
import { PSTFile } from '../PSTFile.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile

before(() => {
  pstFile = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
})

after(() => {
  pstFile.close()
})

describe('PSTfile tests', () => {
  it('should open the file', () => {
    expect(pstFile.encryptionType).to.equal(1)
    expect(pstFile.pstFileType).to.equal(23)
    expect(pstFile.pstFilename).to.contain('enron.pst')
    expect(pstFile.getMessageStore().displayName).to.equal('Personal folders')
    expect(pstFile.getRootFolder()).to.not.be.null
    // Log.debug1(JSON.stringify(pstFile, null, 2));
  })
})
