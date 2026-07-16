import * as fs from 'fs'
import * as zlib from 'node:zlib'
import Long from 'long'
import { DescriptorIndexNode } from './DescriptorIndexNode.class.js'
import { OffsetIndexItem } from './OffsetIndexItem.class.js'
import { PSTDescriptorItem } from './PSTDescriptorItem.class.js'
import { PSTFolder } from './PSTFolder.class.js'
import { PSTMessageStore } from './PSTMessageStore.class.js'
import { PSTNodeInputStream } from './PSTNodeInputStream.class.js'
import { PSTTableBC } from './PSTTableBC.class.js'
import { PSTTableItem } from './PSTTableItem.class.js'
import { PSTUtil } from './PSTUtil.class.js'
import { NodeMap } from './NodeMap.class.js'
import { PSTEOFError, PSTError } from './PSTError.js'

export interface PSTRandomAccessSource {
  readonly size?: number
  readSync(position: number, length: number): Buffer
  readIntoSync?(target: Buffer, position: number, length: number): number
  decompressSync?(data: Buffer): Buffer
}

function formatGuid(bytes: readonly number[]): string {
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export class PSTFile {
  public static ENCRYPTION_TYPE_NONE = 0
  public static ENCRYPTION_TYPE_COMPRESSIBLE = 1
  public static MESSAGE_STORE_DESCRIPTOR_IDENTIFIER = 33
  public static ROOT_FOLDER_DESCRIPTOR_IDENTIFIER = 290
  public static PST_TYPE_ANSI = 14
  public static PST_TYPE_ANSI_2 = 15
  public static PST_TYPE_UNICODE = 23
  public static PST_TYPE_2013_UNICODE = 36
  public static PS_PUBLIC_STRINGS = 0
  public static PS_INTERNET_HEADERS = 3
  public static PSETID_Messaging = 7
  public static PSETID_Note = 8
  public static PSETID_PostRss = 9
  public static PSETID_Task = 10
  public static PSETID_UnifiedMessaging = 11
  public static PS_MAPI = 12
  public static PSETID_AirSync = 13
  public static PSETID_Sharing = 14
  public static SLBLOCK_ENTRY = 0
  public static SIBLOCK_ENTRY = 1

  private guidMap: Map<string, number> = new Map([
    ['00020329-0000-0000-C000-000000000046', 0],
    ['00062008-0000-0000-C000-000000000046', 1],
    ['00062004-0000-0000-C000-000000000046', 2],
    ['00020386-0000-0000-C000-000000000046', 3],
    ['00062002-0000-0000-C000-000000000046', 4],
    ['6ED8DA90-450B-101B-98DA-00AA003F1305', 5],
    ['0006200A-0000-0000-C000-000000000046', 6],
    ['41F28F13-83F4-4114-A584-EEDB5A6B0BFF', 7],
    ['0006200E-0000-0000-C000-000000000046', 8],
    ['00062041-0000-0000-C000-000000000046', 9],
    ['00062003-0000-0000-C000-000000000046', 10],
    ['4442858E-A9E3-4E80-B900-317A210CC15B', 11],
    ['00020328-0000-0000-C000-000000000046', 12],
    ['71035549-0739-4DCB-9163-00F0580DBBDF', 13],
    ['00062040-0000-0000-C000-000000000046', 14]
  ])

  // the type of encryption the files uses
  private _encryptionType = 0
  get encryptionType(): number {
    return this._encryptionType
  }

  // type of file (e.g. ANSI)
  private _pstFileType = 0
  public get pstFileType(): number {
    return this._pstFileType
  }

  private _pstFilename = ''
  public get pstFilename(): string {
    return this._pstFilename
  }

  // b-tree
  private childrenDescriptorTree: Map<number, DescriptorIndexNode[]> | null =
    null

  // node tree maps
  private readonly nodeMap: NodeMap = new NodeMap()

  // file descriptor
  private pstFD = -1
  private closed = false

  // in-memory file buffer (instead of filesystem)
  private pstBuffer: Buffer = Buffer.alloc(0)
  private pstSource: PSTRandomAccessSource | null = null

  // position in file
  private position = 0
  private readonly scalarScratch = Buffer.allocUnsafe(8)

  /**
   * Creates an instance of PSTFile.  File is opened in constructor.
   * @param {string} fileName
   * @memberof PSTFile
   */
  public constructor(pstBuffer: Buffer)
  public constructor(fileName: string)
  public constructor(source: PSTRandomAccessSource)
  public constructor(arg: any) {
    if (arg instanceof Buffer) {
      // use an in-memory buffer of PST
      this.pstBuffer = arg
      this.pstFD = -1
    } else if (typeof arg === 'string') {
      // use PST in filesystem
      this._pstFilename = arg
      try {
        this.pstFD = fs.openSync(this._pstFilename, 'r')
      } catch (error) {
        throw new PSTError(
          'NOT_FOUND',
          `Unable to open PST source: ${this._pstFilename}`,
          { cause: error }
        )
      }
    } else if (arg && typeof arg.readSync === 'function') {
      this.pstSource = arg
    } else {
      throw new TypeError(
        'PST source must be a path, Buffer, or random-access source'
      )
    }

    try {
      // confirm first 4 bytes are !BDN
      const buffer = Buffer.alloc(514)
      this.readSync(buffer, 514, 0)
      const key = '!BDN'
      if (
        buffer[0] != key.charCodeAt(0) ||
        buffer[1] != key.charCodeAt(1) ||
        buffer[2] != key.charCodeAt(2) ||
        buffer[3] != key.charCodeAt(3)
      ) {
        throw new PSTError(
          'INVALID_HEADER',
          'Invalid PST file header (expected "!BDN")'
        )
      }

      // make sure we are using a supported version of a PST...
      if (buffer[10] === PSTFile.PST_TYPE_ANSI_2) {
        buffer[10] = PSTFile.PST_TYPE_ANSI
      }
      if (
        buffer[10] !== PSTFile.PST_TYPE_ANSI &&
        buffer[10] !== PSTFile.PST_TYPE_UNICODE &&
        buffer[10] !== PSTFile.PST_TYPE_2013_UNICODE
      ) {
        throw new PSTError(
          'UNSUPPORTED_VERSION',
          'Unrecognised PST file version: ' + buffer[10]
        )
      }
      this._pstFileType = buffer[10]

      // make sure no encryption
      if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
        this._encryptionType = buffer[461]
      } else {
        this._encryptionType = buffer[513]
      }
      if (this._encryptionType === 0x02) {
        throw new PSTError(
          'UNSUPPORTED_VERSION',
          'Encrypted PST files are unsupported'
        )
      }

      // build out name to id map
      this.processNameToIDMap()
    } catch (error) {
      this.close()
      throw error
    }
  }

  /**
   * Close the file.
   * @memberof PSTFile
   */
  public close(): void {
    if (this.closed) {
      return
    }
    this.closed = true
    if (this.pstFD >= 0) {
      fs.closeSync(this.pstFD)
      this.pstFD = -1
    }
  }

  /** Decompress parser data using the source-specific implementation. */
  public decompress(data: Buffer): Buffer {
    return this.pstSource?.decompressSync
      ? this.pstSource.decompressSync(data)
      : zlib.unzipSync(data)
  }

  /**
   * Process name to ID map.
   * @private
   * @memberof PSTFile
   */
  private processNameToIDMap() {
    const nameToIdMapDescriptorNode = this.getDescriptorIndexNode(
      Long.fromNumber(97)
    )

    // get the descriptors if we have them
    let localDescriptorItems = null
    if (
      nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier.toNumber() !=
      0
    ) {
      localDescriptorItems = this.getPSTDescriptorItems(
        nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier
      )
    }

    // process the map
    const off: OffsetIndexItem = this.getOffsetIndexNode(
      nameToIdMapDescriptorNode.dataOffsetIndexIdentifier
    )
    const nodein = new PSTNodeInputStream(this, off)
    const bcTable = new PSTTableBC(nodein)
    const tableItems: Map<number, PSTTableItem> = bcTable.getItems()

    // Get the guids
    const guidEntry = tableItems.get(2)
    if (!guidEntry) {
      throw new Error('PSTFile::processNameToIDMap guidEntry is null')
    }

    const guids = this.getData(guidEntry, localDescriptorItems)
    const nGuids = Math.trunc(guids.length / 16)
    const guidIndexes: number[] = []
    let offset = 0
    for (let i = 0; i < nGuids; ++i) {
      let leftQuad: Long = PSTUtil.convertLittleEndianBytesToLong(
        guids,
        offset,
        offset + 4
      )
      leftQuad = leftQuad.shiftLeft(32)
      let midQuad: Long = PSTUtil.convertLittleEndianBytesToLong(
        guids,
        offset + 4,
        offset + 6
      )
      midQuad = midQuad.shiftLeft(16)
      const rightQuad: Long = PSTUtil.convertLittleEndianBytesToLong(
        guids,
        offset + 6,
        offset + 8
      )
      const mostSigBits: Long = leftQuad.or(midQuad).or(rightQuad)
      const leastSigBits: Long = PSTUtil.convertBigEndianBytesToLong(
        guids,
        offset + 8,
        offset + 16
      )

      // weird that need to cast below to any to get tsc error to go away - why?
      // see https://github.com/Microsoft/TypeScript/issues/6436
      const mostBuffer: number[] = (mostSigBits as any).toBytes()
      const leastBuffer: number[] = (leastSigBits as any).toBytes()

      const arrUID = mostBuffer.concat(leastBuffer)
      const strUID = formatGuid(arrUID).toUpperCase()

      const guid = this.guidMap.get(strUID)
      if (guid) {
        guidIndexes[i] = guid
      } else {
        guidIndexes[i] = -1 // We don't know this guid
      }
      // console.log('PSTFile:: processNameToIdMap idx: ' + i + ', ' + strUID + ', ' + guidIndexes[i]);
      offset += 16
    }

    // if we have a reference to an internal descriptor
    const mapEntries = tableItems.get(3)
    if (!mapEntries) {
      throw new Error('PSTFile::processNameToIDMap mapEntries is null')
    }
    const nameToIdByte: Buffer = this.getData(mapEntries, localDescriptorItems)
    const stringMapEntries = tableItems.get(4)
    if (!stringMapEntries) {
      throw new Error('PSTFile::processNameToIDMap stringMapEntries is null')
    }
    const stringNameToIdByte: Buffer = this.getData(
      stringMapEntries,
      localDescriptorItems
    )

    // process the entries
    for (let x = 0; x + 8 < nameToIdByte.length; x += 8) {
      const key: number = PSTUtil.convertLittleEndianBytesToLong(
        nameToIdByte,
        x,
        x + 4
      ).toNumber()
      let guid: number = PSTUtil.convertLittleEndianBytesToLong(
        nameToIdByte,
        x + 4,
        x + 6
      ).toNumber()
      let propId: number = PSTUtil.convertLittleEndianBytesToLong(
        nameToIdByte,
        x + 6,
        x + 8
      ).toNumber()

      if ((guid & 0x0001) == 0) {
        // identifier is numeric
        propId += 0x8000
        guid >>= 1
        let guidIndex: number
        if (guid == 1) {
          guidIndex = PSTFile.PS_MAPI
        } else if (guid == 2) {
          guidIndex = PSTFile.PS_PUBLIC_STRINGS
        } else {
          guidIndex = guidIndexes[guid - 3]
        }
        this.nodeMap.setId(key, propId, guidIndex)
      } else {
        // identifier is a string
        // key is byte offset into the String stream in which the string name of the property is stored.
        const len = PSTUtil.convertLittleEndianBytesToLong(
          stringNameToIdByte,
          key,
          key + 4
        ).toNumber()
        if (len > 0 && len <= stringNameToIdByte.length) {
          const keyByteValue = Buffer.alloc(len)
          PSTUtil.arraycopy(
            stringNameToIdByte,
            key + 4,
            keyByteValue,
            0,
            keyByteValue.length
          )
          propId += 0x8000
          this.nodeMap.setId(
            keyByteValue.toString('utf16le').replace(/\0/g, ''),
            propId
          )
        }
      }
    }
  }

  /**
   * Get data from a descriptor and store in buffer.
   * @private
   * @param {PSTTableItem} item
   * @param {Map<number, PSTDescriptorItem>} localDescriptorItems
   * @returns {Buffer}
   * @memberof PSTFile
   */
  private getData(
    item: PSTTableItem,
    localDescriptorItems: Map<number, PSTDescriptorItem> | null
  ): Buffer {
    if (item.data.length != 0) {
      return item.data
    }

    if (localDescriptorItems == null) {
      throw new Error(
        'PSTFile::getData External reference but no localDescriptorItems in PSTFile.getData()'
      )
    }

    if (item.entryValueType != 0x0102) {
      throw new Error(
        'PSTFile::getData Attempting to get non-binary data in PSTFile.getData()'
      )
    }

    const mapDescriptorItem = localDescriptorItems.get(item.entryValueReference)
    if (mapDescriptorItem == null) {
      throw new Error(
        'PSTFile::getData Descriptor not found: ' + item.entryValueReference
      )
    }
    return mapDescriptorItem.getData()
  }

  /**
   * Get name to ID map item.
   * @param {number} key
   * @param {number} idx
   * @returns {number}
   * @memberof PSTFile
   */
  public getNameToIdMapItem(key: number, idx: number): number {
    return this.nodeMap.getId(key, idx)
  }

  /**
   * Get public string to id map item.
   * @static
   * @param {string} key
   * @returns {number}
   * @memberof PSTFile
   */
  public getPublicStringToIdMapItem(key: string): number {
    return this.nodeMap.getId(key)
  }

  /**
   * Get property name from id.
   * @static
   * @param {number} propertyId
   * @param {boolean} bNamed
   * @returns {string}
   * @memberof PSTFile
   */
  public getPropertyName(
    propertyId: number,
    bNamed: boolean
  ): string | undefined {
    return PSTUtil.propertyName.get(propertyId)
  }

  /**
   * Get name to id map key.
   * @static
   * @param {number} propId
   * @returns {long}
   * @memberof PSTFile
   */
  public getNameToIdMapKey(propId: number): Long | undefined {
    return this.nodeMap.getNumericName(propId)
  }

  /**
   * Get the message store of the PST file.  Note that this doesn't really
   * have much information, better to look under the root folder.
   * @returns {PSTMessageStore}
   * @memberof PSTFile
   */
  public getMessageStore(): PSTMessageStore {
    const messageStoreDescriptor: DescriptorIndexNode =
      this.getDescriptorIndexNode(
        Long.fromNumber(PSTFile.MESSAGE_STORE_DESCRIPTOR_IDENTIFIER)
      )
    return new PSTMessageStore(this, messageStoreDescriptor)
  }

  /**
   * Get the root folder for the PST file
   * @returns {PSTFolder}
   * @memberof PSTFile
   */
  public getRootFolder(): PSTFolder {
    const rootFolderDescriptor: DescriptorIndexNode =
      this.getDescriptorIndexNode(
        Long.fromValue(PSTFile.ROOT_FOLDER_DESCRIPTOR_IDENTIFIER)
      )
    const output: PSTFolder = new PSTFolder(this, rootFolderDescriptor)
    return output
  }

  /**
   * Read a leaf in the b-tree.
   * @param {long} bid
   * @returns {PSTNodeInputStream}
   * @memberof PSTFile
   */
  public readLeaf(bid: Long): PSTNodeInputStream {
    // get the index node for the descriptor index
    const offsetItem = this.getOffsetIndexNode(bid)
    return new PSTNodeInputStream(this, offsetItem)
  }

  /**
   * Read the size of the specified leaf.
   * @param {long} bid
   * @returns {number}
   * @memberof PSTFile
   */
  public getLeafSize(bid: Long): number {
    const offsetItem: OffsetIndexItem = this.getOffsetIndexNode(bid)

    // Internal block?
    if ((offsetItem.indexIdentifier.toNumber() & 0x02) == 0) {
      // No, return the raw size
      return offsetItem.size
    }

    // we only need the first 8 bytes
    const data: Buffer = Buffer.alloc(8)
    this.seek(offsetItem.fileOffset)
    this.readCompletely(data)

    // we are an array, get the sum of the sizes...
    return PSTUtil.convertLittleEndianBytesToLong(data, 4, 8).toNumber()
  }

  /**
   * Get file offset, which is sorted in 8 little endian bytes
   * @private
   * @param {long} startOffset
   * @returns {long}
   * @memberof PSTFile
   */
  private extractLEFileOffset(startOffset: Long): Long {
    const length = this._pstFileType == PSTFile.PST_TYPE_ANSI ? 4 : 8
    const position = startOffset.toNumber()
    this.readSync(this.scalarScratch, length, position)
    this.position = position + length
    return PSTUtil.convertLittleEndianBytesToLong(this.scalarScratch, 0, length)
  }

  /**
   * Navigate PST B-tree and find a specific item.
   * @private
   * @param {long} index
   * @param {boolean} descTree
   * @returns {Buffer}
   * @memberof PSTFile
   */
  private findBtreeItem(index: Long, descTree: boolean): Buffer {
    let btreeStartOffset: Long
    let fileTypeAdjustment: number

    // first find the starting point for the offset index
    if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
      btreeStartOffset = this.extractLEFileOffset(Long.fromValue(196))
      if (descTree) {
        btreeStartOffset = this.extractLEFileOffset(Long.fromValue(188))
      }
    } else {
      btreeStartOffset = this.extractLEFileOffset(Long.fromValue(240))
      if (descTree) {
        btreeStartOffset = this.extractLEFileOffset(Long.fromValue(224))
      }
    }

    // okay, what we want to do is navigate the tree until you reach the bottom....
    // try and read the index b-tree
    let buffer = Buffer.alloc(2)
    if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
      fileTypeAdjustment = 500
    } else if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
      fileTypeAdjustment = 0x1000 - 24
    } else {
      fileTypeAdjustment = 496
    }
    this.seek(btreeStartOffset.add(fileTypeAdjustment))
    this.readCompletely(buffer)

    const b2 = Buffer.alloc(2)
    b2[0] = 0xff80
    b2[1] = 0xff81

    // ensure apples to apples comparison
    while (
      (buffer[0] === b2[0] && buffer[1] === b2[0] && !descTree) ||
      (buffer[0] === b2[1] && buffer[1] === b2[1] && descTree)
    ) {
      // get the rest of the data
      let len: number
      if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
        len = 496
      } else if (this._pstFileType == PSTFile.PST_TYPE_2013_UNICODE) {
        len = 4056
      } else {
        len = 488
      }
      const branchNodeItems = Buffer.alloc(len)
      this.seek(btreeStartOffset)
      this.readCompletely(branchNodeItems)

      // console.log('PSTFile::findBtreeItem btreeStartOffset = ' + btreeStartOffset);

      let numberOfItems = 0
      if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
        const numberOfItemsBytes = Buffer.alloc(2)
        this.readCompletely(numberOfItemsBytes)
        numberOfItems =
          PSTUtil.convertLittleEndianBytesToLong(numberOfItemsBytes).toNumber()
        this.readCompletely(numberOfItemsBytes)
      } else {
        numberOfItems = this.read()
        this.read() // maxNumberOfItems
      }
      const itemSize = this.read() // itemSize
      const levelsToLeaf = this.read()

      if (levelsToLeaf > 0) {
        let found = false
        for (let x = 0; x < numberOfItems; x++) {
          if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            const indexIdOfFirstChildNode = this.extractLEFileOffset(
              btreeStartOffset.add(x * 12)
            )
            if (indexIdOfFirstChildNode > index) {
              // get the address for the child first node in this group
              btreeStartOffset = this.extractLEFileOffset(
                btreeStartOffset.add((x - 1) * 12 + 8)
              )
              this.seek(btreeStartOffset.add(500))
              this.readCompletely(buffer)
              found = true
              break
            }
          } else {
            const indexIdOfFirstChildNode = this.extractLEFileOffset(
              btreeStartOffset.add(x * 24)
            )
            if (indexIdOfFirstChildNode.greaterThan(index)) {
              // get the address for the child first node in this group
              btreeStartOffset = this.extractLEFileOffset(
                btreeStartOffset.add((x - 1) * 24 + 16)
              )
              this.seek(btreeStartOffset.add(fileTypeAdjustment))
              this.readCompletely(buffer)
              found = true
              break
            }
          }
        }
        if (!found) {
          // it must be in the very last branch...
          if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            btreeStartOffset = this.extractLEFileOffset(
              btreeStartOffset.add((numberOfItems - 1) * 12 + 8)
            )
            this.seek(btreeStartOffset.add(500))
            this.readCompletely(buffer)
          } else {
            btreeStartOffset = this.extractLEFileOffset(
              btreeStartOffset.add((numberOfItems - 1) * 24 + 16)
            )
            this.seek(btreeStartOffset.add(fileTypeAdjustment))
            this.readCompletely(buffer)
          }
        }
      } else {
        // we are at the bottom of the tree...
        // we want to get our file offset!
        for (let x = 0; x < numberOfItems; x++) {
          if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            if (descTree) {
              // The 32-bit descriptor index b-tree leaf node item
              buffer = Buffer.alloc(4)
              this.seek(btreeStartOffset.add(x * 16))
              this.readCompletely(buffer)
              if (
                PSTUtil.convertLittleEndianBytesToLong(buffer).equals(index)
              ) {
                // give me the offset index please!
                buffer = Buffer.alloc(16)
                this.seek(btreeStartOffset.add(x * 16))
                this.readCompletely(buffer)
                return buffer
              }
            } else {
              // The 32-bit (file) offset index item
              const indexIdOfFirstChildNode = this.extractLEFileOffset(
                btreeStartOffset.add(x * 12)
              )
              if (indexIdOfFirstChildNode.equals(index)) {
                // we found it!
                buffer = Buffer.alloc(12)
                this.seek(btreeStartOffset.add(x * 12))
                this.readCompletely(buffer)
                // console.log('PSTFile::findBtreeItem ' + index.toString() + ' found!');
                return buffer
              }
            }
          } else {
            if (descTree) {
              // The 64-bit descriptor index b-tree leaf node item
              buffer = Buffer.alloc(4)
              this.seek(btreeStartOffset.add(x * 32))
              this.readCompletely(buffer)
              if (
                PSTUtil.convertLittleEndianBytesToLong(buffer).equals(index)
              ) {
                // give me the offset index please!
                buffer = Buffer.alloc(32)
                this.seek(btreeStartOffset.add(x * 32))
                this.readCompletely(buffer)
                // console.log('PSTFile::findBtreeItem ' + index.toString() + ' found!');
                return buffer
              }
            } else {
              // The 64-bit (file) offset index item
              const indexIdOfFirstChildNode = this.extractLEFileOffset(
                btreeStartOffset.add(x * 24)
              )
              if (indexIdOfFirstChildNode.equals(index)) {
                // we found it
                buffer = Buffer.alloc(24)
                this.seek(btreeStartOffset.add(x * 24))
                this.readCompletely(buffer)
                // console.log('PSTFile::findBtreeItem ' + index.toString() + ' found!');
                return buffer
              }
            }
          }
        }
        throw new Error(
          'PSTFile::findBtreeItem Unable to find ' +
            index +
            ' is desc: ' +
            descTree
        )
      }
    }
    throw new Error(
      'PSTFile::findBtreeItem Unable to find node: ' +
        index +
        ' is desc: ' +
        descTree
    )
  }

  /**
   * Get a descriptor index node in the b-tree
   * @param {long} id
   * @returns {DescriptorIndexNode}
   * @memberof PSTFile
   */
  public getDescriptorIndexNode(id: Long): DescriptorIndexNode {
    // console.log('PSTFile::getDescriptorIndexNode ' + id.toString())
    return new DescriptorIndexNode(
      this.findBtreeItem(id, true),
      this._pstFileType
    )
  }

  /**
   * Get an offset index node in the b-tree
   * @param {long} id
   * @returns {OffsetIndexItem}
   * @memberof PSTFile
   */
  public getOffsetIndexNode(id: Long): OffsetIndexItem {
    return new OffsetIndexItem(this.findBtreeItem(id, false), this._pstFileType)
  }

  /**
   * Parse a PSTDescriptor and get all of its items
   * @param {long} localDescriptorsOffsetIndexIdentifier
   * @returns {Map<number, PSTDescriptorItem>}
   * @memberof PSTFile
   */
  public getPSTDescriptorItems(
    localDescriptorsOffsetIndexIdentifier: Long
  ): Map<number, PSTDescriptorItem>
  public getPSTDescriptorItems(
    inputStream: PSTNodeInputStream
  ): Map<number, PSTDescriptorItem>
  public getPSTDescriptorItems(arg: any): Map<number, PSTDescriptorItem> {
    let inputStream: PSTNodeInputStream = arg
    if (typeof arg === 'object' && arg.hasOwnProperty('low')) {
      inputStream = this.readLeaf(arg)
    }

    // make sure the signature is correct
    inputStream.seek(Long.ZERO)
    const sig = inputStream.read()
    if (sig != 0x2) {
      throw new Error(
        'PSTFile::getPSTDescriptorItems Unable to process descriptor node, bad signature: ' +
          sig
      )
    }

    // NID nodes defines in subnode can be either SLBLOCK (0) or SIBLOCK_ENTRY (1)
    const blockType = inputStream.read()
    if (
      blockType !== PSTFile.SLBLOCK_ENTRY &&
      blockType !== PSTFile.SIBLOCK_ENTRY
    ) {
      throw new Error(
        'Unable to process descriptor node, unknown BLOCK type: ' + blockType
      )
    }

    const output = new Map()
    const numberOfItems = inputStream.seekAndReadLong(Long.fromValue(2), 2)
    let offset
    if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
      offset = 4
    } else {
      offset = 8
    }

    const data = Buffer.alloc(inputStream.length.toNumber())
    inputStream.seek(Long.ZERO)
    inputStream.readCompletely(data)

    for (let x = 0; x < numberOfItems.toNumber(); x++) {
      const item: PSTDescriptorItem = new PSTDescriptorItem(
        data,
        offset,
        this,
        blockType
      )
      if (blockType == PSTFile.SLBLOCK_ENTRY) {
        output.set(item.descriptorIdentifier, item)
      } else {
        const subItems = this.getPSTDescriptorItems(
          Long.fromNumber(item.offsetIndexIdentifier)
        )
        subItems.forEach((value, key) => {
          output.set(key, value)
        })
      }

      if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
        if (blockType === PSTFile.SLBLOCK_ENTRY) {
          offset += 12
        } else {
          offset += 8
        }
      } else {
        if (blockType === PSTFile.SLBLOCK_ENTRY) {
          offset += 24
        } else {
          offset += 16
        }
      }
    }

    return output
  }

  /**
   * Build the children descriptor tree, used as a fallback when the nodes
   * that list file contents are broken.
   * @returns
   * @memberof PSTFile
   */
  public getChildDescriptorTree() {
    if (!this.childrenDescriptorTree) {
      let btreeStartOffset = Long.ZERO
      if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
        btreeStartOffset = this.extractLEFileOffset(Long.fromValue(188))
      } else {
        btreeStartOffset = this.extractLEFileOffset(Long.fromValue(224))
      }
      this.childrenDescriptorTree = new Map()
      this.processDescriptorBTree(btreeStartOffset)
    }
    return this.childrenDescriptorTree
  }

  /**
   * Recursively walk PST descriptor tree and create internal version.
   * @private
   * @param {long} btreeStartOffset
   * @memberof PSTFile
   */
  private processDescriptorBTree(btreeStartOffset: Long) {
    let fileTypeAdjustment: number

    let temp = Buffer.alloc(2)
    if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
      fileTypeAdjustment = 500
    } else if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
      fileTypeAdjustment = 0x1000 - 24
    } else {
      fileTypeAdjustment = 496
    }
    this.seek(btreeStartOffset.add(fileTypeAdjustment))
    this.readCompletely(temp)

    if (temp[0] == 129 && temp[1] == 129) {
      if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
        this.seek(btreeStartOffset.add(496))
      } else if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
        this.seek(btreeStartOffset.add(4056))
      } else {
        this.seek(btreeStartOffset.add(488))
      }

      let numberOfItems = 0
      if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
        const numberOfItemsBytes = Buffer.alloc(2)
        this.readCompletely(numberOfItemsBytes)
        numberOfItems =
          PSTUtil.convertLittleEndianBytesToLong(numberOfItemsBytes).toNumber()
        this.readCompletely(numberOfItemsBytes)
        const maxNumberOfItems =
          PSTUtil.convertLittleEndianBytesToLong(numberOfItemsBytes).toNumber()
      } else {
        numberOfItems = this.read()
        this.read() // maxNumberOfItems
      }
      this.read() // itemSize
      const levelsToLeaf: number = this.read()

      if (levelsToLeaf > 0) {
        for (let x = 0; x < numberOfItems; x++) {
          if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            const branchNodeItemStartIndex = btreeStartOffset.add(12 * x)
            const nextLevelStartsAt = this.extractLEFileOffset(
              branchNodeItemStartIndex.add(8)
            )
            this.processDescriptorBTree(nextLevelStartsAt)
          } else {
            const branchNodeItemStartIndex = btreeStartOffset.add(24 * x)
            const nextLevelStartsAt = this.extractLEFileOffset(
              branchNodeItemStartIndex.add(16)
            )
            this.processDescriptorBTree(nextLevelStartsAt)
          }
        }
      } else {
        for (let x = 0; x < numberOfItems; x++) {
          if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            this.seek(btreeStartOffset.add(x * 16))
            temp = Buffer.alloc(16)
            this.readCompletely(temp)
          } else {
            this.seek(btreeStartOffset.add(x * 32))
            temp = Buffer.alloc(32)
            this.readCompletely(temp)
          }

          const tempNode = new DescriptorIndexNode(temp, this._pstFileType)

          // we don't want to be children of ourselves...
          if (
            tempNode.parentDescriptorIndexIdentifier ==
            tempNode.descriptorIdentifier
          ) {
            // skip!
          } else if (
            this.childrenDescriptorTree!.has(
              tempNode.parentDescriptorIndexIdentifier
            )
          ) {
            // add this entry to the existing list of children
            const children = this.childrenDescriptorTree!.get(
              tempNode.parentDescriptorIndexIdentifier
            )
            if (!children) {
              throw new Error(
                'PSTFile::processDescriptorBTree children is null'
              )
            }
            children.push(tempNode)
          } else {
            // create a new entry and add this one to that
            const children: DescriptorIndexNode[] = []
            children.push(tempNode)
            this.childrenDescriptorTree!.set(
              tempNode.parentDescriptorIndexIdentifier,
              children
            )
          }
        }
      }
    } else {
      throw new Error(
        'PSTFile::processDescriptorBTree Unable to read descriptor node, is not a descriptor'
      )
    }
  }

  /* 
        Basic file functions.
    */
  /**
   * Read a single byte from the PST file.
   * @param {number} [position]
   * @returns {number}
   * @memberof PSTFile
   */
  public read(position?: number): number {
    const pos = position !== undefined ? position : this.position
    const bytesRead = this.readSync(this.scalarScratch, 1, pos)
    this.position =
      position !== undefined ? position + bytesRead : this.position + bytesRead
    return this.scalarScratch[0]
  }

  /**
   * Read a complete section from the file, storing in the supplied buffer.
   * @param {Buffer} buffer
   * @param {number} [position]
   * @returns
   * @memberof PSTFile
   */
  public readCompletely(buffer: Buffer, position?: number): void {
    const pos = position !== undefined ? position : this.position
    const bytesRead = this.readSync(buffer, buffer.length, pos)
    this.position =
      position !== undefined ? position + bytesRead : this.position + bytesRead
  }

  /**
   * Read from either file system, or in memory buffer.
   * @param {Buffer} buffer
   * @param {number} length
   * @param {number} position
   * @returns {number} of bytes read
   * @memberof PSTFile
   */
  private readSync(buffer: Buffer, length: number, position: number): number {
    if (this.closed) {
      throw new PSTError('CLOSED', 'The PST file is closed')
    }
    if (this.pstSource) {
      if (this.pstSource.readIntoSync) {
        return this.pstSource.readIntoSync(buffer, position, length)
      }
      const data = this.pstSource.readSync(position, length)
      if (data.length !== length) {
        throw new PSTEOFError(position, length, data)
      }
      data.copy(buffer)
      return length
    } else if (this.pstFD >= 0) {
      // read from file system
      const bytesRead = fs.readSync(this.pstFD, buffer, 0, length, position)
      if (bytesRead !== length) {
        throw new PSTEOFError(position, length, buffer.subarray(0, bytesRead))
      }
      return bytesRead
    } else {
      if (position + length > this.pstBuffer.length) {
        throw new PSTEOFError(
          position,
          length,
          this.pstBuffer.subarray(position, this.pstBuffer.length)
        )
      }
      // copy from in-memory buffer
      this.pstBuffer.copy(buffer, 0, position, position + length)
      return length
    }
  }

  /**
   * Seek to a specific position in PST file.
   * @param {long} index
   * @memberof PSTFile
   */
  public seek(index: Long) {
    this.position = index.toNumber()
  }

  /**
   * JSON stringify the object properties.
   * @returns {string}
   * @memberof PSTFile
   */
  public toJSON(): any {
    return this
  }
}
