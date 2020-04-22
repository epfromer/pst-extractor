/* eslint-disable @typescript-eslint/no-explicit-any */
import * as long from 'long'
import { DescriptorIndexNode } from './DescriptorIndexNode.class'
import { OutlookProperties } from './OutlookProperties'
import { PSTDescriptorItem } from './PSTDescriptorItem.class'
import { PSTFile } from './PSTFile.class'
import { PSTNodeInputStream } from './PSTNodeInputStream.class'
import { PSTTable7C } from './PSTTable7C.class'
import { PSTTableBC } from './PSTTableBC.class'
import { PSTTableItem } from './PSTTableItem.class'
import { PSTObject } from './PSTObject.class'
import { PSTUtil } from './PSTUtil.class'

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
  private emailsTable: PSTTable7C | null = null
  private fallbackEmailsTable: DescriptorIndexNode[] | null = null

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
            output.push(
              PSTUtil.detectAndLoadPSTObject(
                this.pstFile,
                long.fromNumber(item.entryValueReference)
              )
            )
          }
        }
      }
    } catch (err) {
      console.error(
        "PSTFolder::getSubFolders Can't get child folders for folder " +
          this.displayName +
          '\n' +
          err
      )
      throw err
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
    if (this.subfoldersTable) {
      return
    }
    if (!this.descriptorIndexNode) {
      throw new Error(
        'PSTFolder::initSubfoldersTable descriptorIndexNode is null'
      )
    }

    const folderDescriptorIndex: long = long.fromValue(
      this.descriptorIndexNode.descriptorIdentifier + 11
    )
    try {
      const folderDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(
        folderDescriptorIndex
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
      this.subfoldersTable = new PSTTable7C(pstNodeInputStream, tmp)
    } catch (err) {
      console.error(
        "PSTFolder::initSubfoldersTable Can't get child folders for folder " +
          this.displayName +
          '\n' +
          err
      )
      throw err
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
      const folderDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(
        long.fromNumber(folderDescriptorIndex)
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
      // fallback to children as listed in the descriptor b-tree
      // console.log(`PSTFolder::initEmailsTable Can't get child folders for folder {this.displayName}, resorting to using alternate tree`);
      const tree = this.pstFile.getChildDescriptorTree()
      this.fallbackEmailsTable = []
      const allChildren = tree.get(
        this.descriptorIndexNode.descriptorIdentifier
      )
      if (allChildren) {
        // remove items that aren't messages
        for (const node of allChildren) {
          if (
            node != null &&
            this.getNodeType(node.descriptorIdentifier) ==
              PSTUtil.NID_TYPE_NORMAL_MESSAGE
          ) {
            this.fallbackEmailsTable.push(node)
          }
        }
      }
    }
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
      if (this.currentEmailIndex == this.contentCount) {
        // no more!
        return null
      }

      // get the emails from the rows in the main email table
      const rows: Map<number, PSTTableItem>[] = this.emailsTable.getItems(
        this.currentEmailIndex,
        1
      )
      const emailRow = rows[0].get(0x67f2)
      if ((emailRow && emailRow.itemIndex == -1) || !emailRow) {
        // no more!
        return null
      }

      const childDescriptor = this.pstFile.getDescriptorIndexNode(
        long.fromNumber(emailRow.entryValueReference)
      )
      const child = PSTUtil.detectAndLoadPSTObject(
        this.pstFile,
        childDescriptor
      )
      this.currentEmailIndex++
      return child
    } else if (this.fallbackEmailsTable) {
      if (
        this.currentEmailIndex >= this.contentCount ||
        this.currentEmailIndex >= this.fallbackEmailsTable.length
      ) {
        // no more!
        return null
      }

      const childDescriptor = this.fallbackEmailsTable[this.currentEmailIndex]
      const child = PSTUtil.detectAndLoadPSTObject(
        this.pstFile,
        childDescriptor
      )
      this.currentEmailIndex++
      return child
    }
    return null
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
    } else {
      return 0
    }
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
      return -1
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
        containerFlags: this.containerFlags,
      },
      this
    )
    return clone
  }
}
