import { PSTFile } from '../PSTFile.class'
const resolve = require('path').resolve
let pstFile: PSTFile

beforeAll(() => {
  pstFile = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
})

afterAll(() => {
  pstFile.close()
})

describe('PSTfile tests', () => {
  it('should open the file', () => {
    expect(pstFile.encryptionType).toEqual(1)
    expect(pstFile.pstFileType).toEqual(23)
    expect(pstFile.pstFilename).toContain('enron.pst')
    expect(pstFile.getMessageStore().displayName).toEqual('Personal folders')
    expect(pstFile.getRootFolder()).toBeTruthy()
  })
})
