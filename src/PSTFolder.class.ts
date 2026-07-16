import Long from 'long'
import { DescriptorIndexNode } from './DescriptorIndexNode.class.js'
import { OutlookProperties } from './OutlookProperties.js'
import { PSTDescriptorItem } from './PSTDescriptorItem.class.js'
import { PSTFile } from './PSTFile.class.js'
import { PSTNodeInputStream } from './PSTNodeInputStream.class.js'
import { PSTTable7C } from './PSTTable7C.class.js'
import { PSTTableBC } from './PSTTableBC.class.js'
import { PSTTableItem } from './PSTTableItem.class.js'
import { PSTObject } from './PSTObject.class.js'
import { PSTUtil } from './PSTUtil.class.js'
import {
  asPSTError,
  hasPSTErrorCode,
  rethrowAsyncCacheMiss
} from './PSTError.js'

/**
 * Represents a folder in the PST File.  Allows you to access child folders or items.
 * Items are accessed through a sort of cursor arrangement.  This allows for
 * incremental reading of a folder which may have _lots_ of emails.
 * @export
 * @class PSTFolder
 * @extends {PSTObject}
 */
export class PSTFolder extends PSTObject {
  private currentEmailIndex = 0
  private subfoldersTable: PSTTable7C | null = null
  private fallbackSubfoldersTable: DescriptorIndexNode[] | null = null
  private emailsTable: PSTTable7C | null = null
  private fallbackEmailsTable: DescriptorIndexNode[] | null = null

  /** Current child cursor index for transactional asynchronous retries. */
  public get childCursorPosition(): number {
    return this.currentEmailIndex
  }

  /**
   * Creates an instance of PSTFolder.
   * Represents a folder in the PST File.  Allows you to access child folders or items.
   * Items are accessed through a sort of cursor arrangement.  This allows for
   * incremental reading of a folder which may have _lots_ of emails.
   * @param {PSTFile} pstFile
   * @param {DescriptorIndexNode} descriptorIndexNode
   * @param {PSTTableBC} [table]
   * @param {Map<number, PSTDescriptorItem>} [localDescriptorItems]
   * @memberof PSTFolder
   */
  constructor(
    pstFile: PSTFile,
    descriptorIndexNode: DescriptorIndexNode,
    table?: PSTTableBC,
    localDescriptorItems?: Map<number, PSTDescriptorItem>
  ) {
    super(pstFile, descriptorIndexNode)
    if (table) {
      // pre-populate folder object with values
      this.prePopulate(descriptorIndexNode, table, localDescriptorItems)
    }
  }

  /**
   * Get folders in one fell swoop, since there's not usually thousands of them.
   * @returns {PSTFolder[]}
   * @memberof PSTFolder
   */
  public getSubFolders(): PSTFolder[] {
    const output: PSTFolder[] = []
    try {
      this.initSubfoldersTable()
      if (this.subfoldersTable) {
        const itemMapSet = this.subfoldersTable.getItems()
        for (const itemMap of itemMapSet) {
          const item = itemMap.get(26610)
          if (item) {
            const nodeType = this.getNodeType(item.entryValueReference)
            if (
              nodeType !== PSTUtil.NID_TYPE_NORMAL_FOLDER &&
              nodeType !== PSTUtil.NID_TYPE_SEARCH_FOLDER
            ) {
              continue
            }
            try {
              const folder = PSTUtil.detectAndLoadPSTObject(
                this.pstFile,
                Long.fromNumber(item.entryValueReference)
              )
              if (folder instanceof PSTFolder) output.push(folder)
            } catch (error) {
              rethrowAsyncCacheMiss(error)
              if (!hasPSTErrorCode(error, 'NOT_FOUND')) throw error
            }
          }
        }
      } else if (this.fallbackSubfoldersTable) {
        for (const descriptor of this.fallbackSubfoldersTable) {
          output.push(PSTUtil.detectAndLoadPSTObject(this.pstFile, descriptor))
        }
      }
    } catch (err) {
      throw asPSTError(err, 'CORRUPT_DATA')
    }
    return output
  }

  /**
   * Load subfolders table.
   * @private
   * @returns
   * @memberof PSTFolder
   */
  private initSubfoldersTable(): void {
    if (this.subfoldersTable || this.fallbackSubfoldersTable) {
      return
    }
    if (!this.descriptorIndexNode) {
      throw new Error(
        'PSTFolder::initSubfoldersTable descriptorIndexNode is null'
      )
    }

    const folderDescriptorIndex: Long = Long.fromValue(
      this.descriptorIndexNode.descriptorIdentifier + 11
    )
    try {
      const folderDescriptor: DescriptorIndexNode =
        this.pstFile.getDescriptorIndexNode(folderDescriptorIndex)
      let tmp = undefined
      if (
        folderDescriptor.localDescriptorsOffsetIndexIdentifier.greaterThan(0)
      ) {
        tmp = this.pstFile.getPSTDescriptorItems(
          folderDescriptor.localDescriptorsOffsetIndexIdentifier
        )
      }
      const offsetIndexItem = this.pstFile.getOffsetIndexNode(
        folderDescriptor.dataOffsetIndexIdentifier
      )
      const pstNodeInputStream = new PSTNodeInputStream(
        this.pstFile,
        offsetIndexItem
      )
      this.subfoldersTable = new PSTTable7C(pstNodeInputStream, tmp)
    } catch (err) {
      rethrowAsyncCacheMiss(err)
      if (!hasPSTErrorCode(err, 'NOT_FOUND')) {
        throw asPSTError(err, 'CORRUPT_DATA')
      }
      this.fallbackSubfoldersTable = this.getFallbackChildren([
        PSTUtil.NID_TYPE_NORMAL_FOLDER,
        PSTUtil.NID_TYPE_SEARCH_FOLDER
      ])
    }
  }

  // get all of the children
  private initEmailsTable(): void {
    if (this.emailsTable || this.fallbackEmailsTable) {
      return
    }

    // some folder types don't have children:
    if (this.getNodeType() == PSTUtil.NID_TYPE_SEARCH_FOLDER) {
      return
    }
    if (!this.descriptorIndexNode) {
      throw new Error('PSTFolder::initEmailsTable descriptorIndexNode is null')
    }

    try {
      const folderDescriptorIndex =
        this.descriptorIndexNode.descriptorIdentifier + 12
      const folderDescriptor: DescriptorIndexNode =
        this.pstFile.getDescriptorIndexNode(
          Long.fromNumber(folderDescriptorIndex)
        )
      let tmp = undefined
      if (
        folderDescriptor.localDescriptorsOffsetIndexIdentifier.greaterThan(0)
      ) {
        tmp = this.pstFile.getPSTDescriptorItems(
          folderDescriptor.localDescriptorsOffsetIndexIdentifier
        )
      }
      const offsetIndexItem = this.pstFile.getOffsetIndexNode(
        folderDescriptor.dataOffsetIndexIdentifier
      )
      const pstNodeInputStream = new PSTNodeInputStream(
        this.pstFile,
        offsetIndexItem
      )
      this.emailsTable = new PSTTable7C(pstNodeInputStream, tmp, 0x67f2)
    } catch (err) {
      rethrowAsyncCacheMiss(err)
      if (!hasPSTErrorCode(err, 'NOT_FOUND')) {
        throw asPSTError(err, 'CORRUPT_DATA')
      }
      this.fallbackEmailsTable = this.getFallbackChildren([
        PSTUtil.NID_TYPE_NORMAL_MESSAGE
      ])
    }
  }

  private getFallbackChildren(nodeTypes: number[]): DescriptorIndexNode[] {
    if (!this.descriptorIndexNode) return []
    const children =
      this.pstFile
        .getChildDescriptorTree()
        .get(this.descriptorIndexNode.descriptorIdentifier) ?? []
    const seen = new Set<number>()
    return children.filter((node) => {
      if (
        !node ||
        !nodeTypes.includes(this.getNodeType(node.descriptorIdentifier)) ||
        seen.has(node.descriptorIdentifier)
      ) {
        return false
      }
      try {
        this.pstFile.getOffsetIndexNode(node.dataOffsetIndexIdentifier)
      } catch (error) {
        rethrowAsyncCacheMiss(error)
        if (hasPSTErrorCode(error, 'NOT_FOUND')) return false
        throw error
      }
      seen.add(node.descriptorIdentifier)
      return true
    })
  }

  /**
   * Get the next child of this folder. As there could be thousands of emails, we have these
   * kind of cursor operations.
   * @returns {*}
   * @memberof PSTFolder
   */
  public getNextChild(): any {
    this.initEmailsTable()

    if (this.emailsTable) {
      while (this.currentEmailIndex < this.emailsTable.rowCount) {
        const rows = this.emailsTable.getItems(this.currentEmailIndex, 1)
        this.currentEmailIndex++
        const emailRow = rows[0]?.get(0x67f2)
        if (!emailRow || emailRow.itemIndex == -1) continue
        try {
          const childDescriptor = this.pstFile.getDescriptorIndexNode(
            Long.fromNumber(emailRow.entryValueReference)
          )
          return PSTUtil.detectAndLoadPSTObject(this.pstFile, childDescriptor)
        } catch (error) {
          rethrowAsyncCacheMiss(error)
          if (!hasPSTErrorCode(error, 'NOT_FOUND')) throw error
        }
      }
    } else if (this.fallbackEmailsTable) {
      while (this.currentEmailIndex < this.fallbackEmailsTable.length) {
        const childDescriptor =
          this.fallbackEmailsTable[this.currentEmailIndex++]
        try {
          return PSTUtil.detectAndLoadPSTObject(this.pstFile, childDescriptor)
        } catch (error) {
          rethrowAsyncCacheMiss(error)
          if (!hasPSTErrorCode(error, 'NOT_FOUND')) throw error
        }
      }
    }
    return null
  }

  /** @internal Fetch the next row descriptor without materializing its object. */
  public getNextChildDescriptor(): DescriptorIndexNode | null {
    this.initEmailsTable()
    if (this.emailsTable) {
      while (this.currentEmailIndex < this.emailsTable.rowCount) {
        const rows = this.emailsTable.getItems(this.currentEmailIndex++, 1)
        const emailRow = rows[0]?.get(0x67f2)
        if (!emailRow || emailRow.itemIndex == -1) continue
        try {
          const descriptor = this.pstFile.getDescriptorIndexNode(
            Long.fromNumber(emailRow.entryValueReference)
          )
          this.pstFile.getOffsetIndexNode(descriptor.dataOffsetIndexIdentifier)
          return descriptor
        } catch (error) {
          rethrowAsyncCacheMiss(error)
          if (!hasPSTErrorCode(error, 'NOT_FOUND')) throw error
        }
      }
      return null
    }
    if (
      !this.fallbackEmailsTable ||
      this.currentEmailIndex >= this.fallbackEmailsTable.length
    ) {
      return null
    }
    while (this.currentEmailIndex < this.fallbackEmailsTable.length) {
      const descriptor = this.fallbackEmailsTable[this.currentEmailIndex++]
      try {
        this.pstFile.getOffsetIndexNode(descriptor.dataOffsetIndexIdentifier)
        return descriptor
      } catch (error) {
        rethrowAsyncCacheMiss(error)
        if (!hasPSTErrorCode(error, 'NOT_FOUND')) throw error
      }
    }
    return null
  }

  /** @internal Load a message property table independently from subnodes. */
  public loadChildTable(descriptor: DescriptorIndexNode): PSTTableBC {
    return new PSTTableBC(
      new PSTNodeInputStream(
        this.pstFile,
        this.pstFile.getOffsetIndexNode(descriptor.dataOffsetIndexIdentifier)
      )
    )
  }

  /** @internal Load subnode metadata independently from the property table. */
  public loadChildLocalDescriptors(
    descriptor: DescriptorIndexNode
  ): Map<number, PSTDescriptorItem> | undefined {
    return descriptor.localDescriptorsOffsetIndexIdentifier.equals(Long.ZERO)
      ? undefined
      : this.pstFile.getPSTDescriptorItems(
          descriptor.localDescriptorsOffsetIndexIdentifier
        )
  }

  /** @internal Create an object from parser data already loaded. */
  public createChildFromTable(
    descriptor: DescriptorIndexNode,
    table: PSTTableBC,
    localDescriptors?: Map<number, PSTDescriptorItem>
  ): PSTObject {
    return PSTUtil.createAppropriatePSTMessageObject(
      this.pstFile,
      descriptor,
      table,
      localDescriptors
    )
  }

  /**
   *  Move the internal folder cursor to the desired position position 0 is before the first record.
   * @param {number} newIndex
   * @returns
   * @memberof PSTFolder
   */
  public moveChildCursorTo(newIndex: number): void {
    this.initEmailsTable()

    if (newIndex < 1) {
      this.currentEmailIndex = 0
      return
    }
    if (newIndex > this.contentCount) {
      newIndex = this.contentCount
    }
    this.currentEmailIndex = newIndex
  }

  /**
   * The number of child folders in this folder
   * @readonly
   * @type {number}
   * @memberof PSTFolder
   */
  public get subFolderCount(): number {
    this.initSubfoldersTable()
    if (this.subfoldersTable != null) {
      return this.subfoldersTable.rowCount
    }
    return this.fallbackSubfoldersTable?.length ?? 0
  }

  /**
   * Number of emails in this folder
   * @readonly
   * @type {number}
   * @memberof PSTFolder
   */
  public get emailCount(): number {
    this.initEmailsTable()
    if (this.emailsTable == null) {
      return this.fallbackEmailsTable?.length ?? -1
    }
    return this.emailsTable.rowCount
  }

  /**
   * Contains a constant that indicates the folder type.
   * https://msdn.microsoft.com/en-us/library/office/cc815373.aspx
   * @readonly
   * @type {number}
   * @memberof PSTFolder
   */
  public get folderType(): number {
    return this.getIntItem(OutlookProperties.PR_FOLDER_TYPE)
  }

  /**
   * Contains the number of messages in a folder, as computed by the message store.
   * For a number calculated by the library use getEmailCount
   * @readonly
   * @type {number}
   * @memberof PSTFolder
   */
  public get contentCount(): number {
    return this.getIntItem(OutlookProperties.PR_CONTENT_COUNT)
  }

  /**
   * Contains the number of unread messages in a folder, as computed by the message store.
   * https://msdn.microsoft.com/en-us/library/office/cc841964.aspx
   * @readonly
   * @type {number}
   * @memberof PSTFolder
   */
  public get unreadCount(): number {
    return this.getIntItem(OutlookProperties.PR_CONTENT_UNREAD)
  }

  /**
   * Contains TRUE if a folder contains subfolders.
   * once again, read from the PST, use getSubFolderCount if you want to know
   * @readonly
   * @type {boolean}
   * @memberof PSTFolder
   */
  public get hasSubfolders(): boolean {
    return this.getIntItem(OutlookProperties.PR_SUBFOLDERS) != 0
  }

  /**
   * Contains a text string describing the type of a folder. Although this property is
   * generally ignored, versions of Microsoft® Exchange Server prior to Exchange Server
   * 2003 Mailbox Manager expect this property to be present.
   * https://msdn.microsoft.com/en-us/library/office/cc839839.aspx
   * @readonly
   * @type {string}
   * @memberof PSTFolder
   */
  public get containerClass(): string {
    return this.getStringItem(OutlookProperties.PR_CONTAINER_CLASS)
  }

  /**
   * Contains a bitmask of flags describing capabilities of an address book container.
   * https://msdn.microsoft.com/en-us/library/office/cc839610.aspx
   * @readonly
   * @type {number}
   * @memberof PSTFolder
   */
  public get containerFlags(): number {
    return this.getIntItem(OutlookProperties.PR_CONTAINER_FLAGS)
  }

  /**
   * JSON stringify the object properties.
   * @returns {string}
   * @memberof PSTFolder
   */
  public toJSON(): any {
    const clone = Object.assign(
      {
        subFolderCount: this.subFolderCount,
        emailCount: this.emailCount,
        folderType: this.folderType,
        contentCount: this.contentCount,
        unreadCount: this.unreadCount,
        hasSubfolders: this.hasSubfolders,
        containerClass: this.containerClass,
        containerFlags: this.containerFlags
      },
      this
    )
    return clone
  }
}
