import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
import { PSTActivity } from '../PSTActivity.class'
const resolve = require('path').resolve
let pstFile: PSTFile
let folder: PSTFolder

beforeAll(() => {
  pstFile = new PSTFile(
    resolve('./src/__tests__/testdata/mtnman1965@outlook.com.ost')
  )

  // get to Journal folder
  let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders()
  folder = childFolders[1] // Root - Mailbox
  childFolders = folder.getSubFolders()
  folder = childFolders[4] // IPM_SUBTREE
  childFolders = folder.getSubFolders()
  folder = childFolders[15] // Journal
})

afterAll(() => {
  // pstFile.close()
})

describe('PSTActivity tests', () => {
  it('should have a Journal folder', () => {
    expect(folder.displayName).toEqual('Journal')
  })

  it('root folder should have a journal entry', () => {
    const activity: PSTActivity = folder.getNextChild()
    // console.log(JSON.stringify(activity, null, 2));
    expect(activity.messageClass).toEqual('IPM.Activity')
    expect(activity.subject).toEqual('called Ed')
    expect(activity.logTypeDesc).toEqual('Phone call')
    expect(activity.bodyPrefix).toContain('But no one was home')
    expect(activity.logStart).toEqual(new Date('2018-03-06T21:09:00.000Z'))
    expect(activity.logEnd).toEqual(new Date('2018-03-06T21:09:00.000Z'))
    expect(activity.importance).toEqual(1)
    expect(activity.logDuration).toEqual(0)
    expect(activity.logFlags).toEqual(0)
    expect(activity.isDocumentPrinted).toEqual(false)
    expect(activity.isDocumentSaved).toEqual(false)
    expect(activity.isDocumentRouted).toEqual(false)
    // expect(activity.isDocumentPosted).toEqual(false)
  })
})
