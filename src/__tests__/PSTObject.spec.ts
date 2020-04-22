import * as chai from 'chai'
import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
import { PSTMessage } from '../PSTMessage.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile

before(() => {
  pstFile = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
})

after(() => {
  pstFile.close()
})

// get these emails
// Personal folders
//  |- Top of Personal Folders
//  |  |- Deleted Items
//  |  |- lokay-m
//  |  |  |- MLOKAY (Non-Privileged)
//  |  |  |  |- TW-Commercial Group
//  |  |  |  |  |- Email: 2097188 - New OBA's
//  |  |  |  |  |- Email: 2097220 - I/B Link Capacity for November and December 2001

describe('PSTObject tests', () => {
  it('should have basic attributes', () => {
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
    childFolders = folder.getSubFolders()
    folder = childFolders[0]
    expect(folder.displayName).toEqual('MLOKAY (Non-Privileged)')
    childFolders = folder.getSubFolders()
    expect(childFolders[0].displayName).toEqual('TW-Commercial Group')
    const comGroupFolder = childFolders[0]
    // Log.debug1(JSON.stringify(comGroupFolder, null, 2));

    const msg: PSTMessage = comGroupFolder.getNextChild()
    // Log.debug1(JSON.stringify(msg, null, 2));
    expect(msg.messageClass).toEqual('IPM.Note')
    expect(msg.stringCodepage).toEqual('us-ascii')
    expect(msg.messageSize.toNumber()).toEqual(653764)
  })
})
