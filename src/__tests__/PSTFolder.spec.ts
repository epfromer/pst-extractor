import * as chai from 'chai'
import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile

before(() => {
  pstFile = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
})

after(() => {
  pstFile.close()
})

describe('PSTFolder tests', () => {
  it('should have a root folder', () => {
    const folder: PSTFolder = pstFile.getRootFolder()
    expect(folder).to.not.be.null
    expect(folder.subFolderCount).toEqual(3)
    expect(folder.hasSubfolders).to.be.true
  })

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
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders()
    expect(childFolders.length).toEqual(3)
    let folder = childFolders[0]
    expect(folder.subFolderCount).toEqual(2)
    expect(folder.displayName).toEqual('Top of Personal Folders')
    childFolders = folder.getSubFolders()
    folder = childFolders[0]
    expect(folder.displayName).toEqual('Deleted Items')
    folder = childFolders[1]
    expect(folder.displayName).toEqual('lokay-m')
    // Log.debug1(JSON.stringify(folder, null, 2));
    childFolders = folder.getSubFolders()
    folder = childFolders[0]
    expect(folder.displayName).toEqual('MLOKAY (Non-Privileged)')
    childFolders = folder.getSubFolders()
    expect(childFolders[0].displayName).toEqual('TW-Commercial Group')
    expect(childFolders[1].displayName).toEqual('Systems')
    expect(childFolders[2].displayName).toEqual('Sent Items')
    expect(childFolders[3].displayName).toEqual('Personal')
    expect(folder.subFolderCount).toEqual(4)
    expect(folder.emailCount).toEqual(1)
    expect(folder.folderType).toEqual(0)
    expect(folder.contentCount).toEqual(1)
    expect(folder.unreadCount).toEqual(0)
    expect(folder.containerFlags).toEqual(0)
    expect(folder.containerClass).toEqual('IPF.Note')
    expect(folder.hasSubfolders).toEqual(true)
    // Log.debug1(JSON.stringify(folder, null, 2));

    folder.moveChildCursorTo(0)
    folder.moveChildCursorTo(1)
    folder.moveChildCursorTo(100)
  })
})
