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

  it('keeps named property maps isolated between files', () => {
    const firstValue = pstFile.getPublicStringToIdMapItem('Keywords')
    const second = new PSTFile(
      resolve('./src/__tests__/testdata/mtnman1965@outlook.com.ost')
    )
    try {
      expect(firstValue).toBe(32786)
      expect(second.getPublicStringToIdMapItem('Keywords')).toBe(32801)
      expect(pstFile.getPublicStringToIdMapItem('Keywords')).toBe(firstValue)
    } finally {
      second.close()
    }
  })

  it('closes idempotently and rejects reads after close', () => {
    const isolated = new PSTFile(
      resolve('./src/__tests__/testdata/enron.pst')
    )
    isolated.close()
    isolated.close()
    expect(() => isolated.read(0)).toThrow(
      expect.objectContaining({ code: 'CLOSED' })
    )
  })
})
