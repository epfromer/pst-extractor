import { PSTFile } from '../PSTFile.class.js'
import { PSTFolder } from '../PSTFolder.class.js'
import { PSTError } from '../PSTError.js'
import { PSTTableItem } from '../PSTTableItem.class.js'
import { jest } from '@jest/globals'
import { resolve } from 'node:path'
let pstFile: PSTFile

beforeAll(() => {
  pstFile = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
})

afterAll(() => {
  pstFile.close()
})

describe('PSTFolder tests', () => {
  it('should have a root folder', () => {
    const folder: PSTFolder = pstFile.getRootFolder()
    expect(folder).toBeTruthy()
    expect(folder.subFolderCount).toEqual(3)
    expect(folder.hasSubfolders).toBeTruthy()
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

  it('falls back to the descriptor tree when the hierarchy table is absent', () => {
    const isolated = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
    try {
      const root = isolated.getRootFolder()
      isolated.getChildDescriptorTree()
      const original = isolated.getDescriptorIndexNode.bind(isolated)
      jest
        .spyOn(isolated, 'getDescriptorIndexNode')
        .mockImplementation((id) => {
          if (id.equals(root.descriptorNodeId.add(11))) {
            throw new PSTError('NOT_FOUND', 'missing hierarchy table')
          }
          return original(id)
        })

      const folders = root.getSubFolders()
      expect(
        folders.map((folder) => folder.descriptorNodeId.toNumber())
      ).toEqual([
        ...new Set(folders.map((folder) => folder.descriptorNodeId.toNumber()))
      ])
      expect(root.subFolderCount).toBe(folders.length)
      expect(folders.length).toBeGreaterThan(0)
    } finally {
      isolated.close()
    }
  })

  it('falls back to deduplicated message descriptors when contents are absent', () => {
    const isolated = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
    try {
      let folder = isolated.getRootFolder().getSubFolders()[0]
      folder = folder.getSubFolders()[1].getSubFolders()[0]
      const tree = isolated.getChildDescriptorTree()
      const children = tree.get(folder.descriptorNodeId.toNumber()) ?? []
      const message = children.find(
        (node) => (node.descriptorIdentifier & 0x1f) === 0x04
      )
      expect(message).toBeDefined()
      if (message) children.push(message)
      const original = isolated.getDescriptorIndexNode.bind(isolated)
      jest
        .spyOn(isolated, 'getDescriptorIndexNode')
        .mockImplementation((id) => {
          if (id.equals(folder.descriptorNodeId.add(12))) {
            throw new PSTError('NOT_FOUND', 'missing contents table')
          }
          return original(id)
        })

      expect(folder.emailCount).toBe(1)
      expect(folder.getNextChild()).not.toBeNull()
      expect(folder.getNextChild()).toBeNull()
    } finally {
      isolated.close()
    }
  })

  it('skips missing content rows without ending traversal', () => {
    const isolated = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
    try {
      let folder = isolated.getRootFolder().getSubFolders()[0]
      folder = folder.getSubFolders()[1].getSubFolders()[0]
      const descriptor = isolated
        .getChildDescriptorTree()
        .get(folder.descriptorNodeId.toNumber())
        ?.find((node) => (node.descriptorIdentifier & 0x1f) === 0x04)
      expect(descriptor).toBeDefined()
      const rowId = new PSTTableItem()
      rowId.itemIndex = 0
      rowId.entryValueReference = descriptor!.descriptorIdentifier
      Object.assign(folder as object, {
        emailsTable: {
          rowCount: 2,
          getItems: (start: number) =>
            start === 0 ? [new Map()] : [new Map([[0x67f2, rowId]])]
        },
        currentEmailIndex: 0
      })

      expect(folder.getNextChild()).not.toBeNull()
      expect(folder.getNextChild()).toBeNull()
    } finally {
      isolated.close()
    }
  })

  it('skips hierarchy rows that do not reference folders', () => {
    const root = pstFile.getRootFolder()
    const rowId = new PSTTableItem()
    rowId.entryValueReference = 0x104
    Object.assign(root as object, {
      subfoldersTable: {
        getItems: () => [new Map([[26610, rowId]])]
      }
    })
    expect(root.getSubFolders()).toEqual([])
  })

  it('does not hide corrupt hierarchy tables behind the fallback', () => {
    const isolated = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))
    try {
      const root = isolated.getRootFolder()
      const original = isolated.getDescriptorIndexNode.bind(isolated)
      jest
        .spyOn(isolated, 'getDescriptorIndexNode')
        .mockImplementation((id) => {
          if (id.equals(root.descriptorNodeId.add(11))) {
            throw new PSTError('CORRUPT_DATA', 'invalid hierarchy page')
          }
          return original(id)
        })
      expect(() => root.getSubFolders()).toThrow(
        expect.objectContaining({ code: 'CORRUPT_DATA' })
      )
    } finally {
      isolated.close()
    }
  })

  it('treats search folders without contents as structurally empty', () => {
    const searchFolder = pstFile
      .getRootFolder()
      .getSubFolders()
      .find((folder) => folder.getNodeType() === 0x03)
    expect(searchFolder).toBeDefined()
    expect(searchFolder?.getNextChild()).toBeNull()
  })
})
