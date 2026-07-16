import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  AsyncPSTActivity,
  AsyncPSTAppointment,
  AsyncPSTContact,
  AsyncPSTFile,
  AsyncPSTMessage,
  AsyncPSTTask
} from '../AsyncPST.class'
import { AsyncRandomAccessReader } from '../AsyncRandomAccessReader'

const enronPath = resolve('./src/__tests__/testdata/enron.pst')

describe('Async PST API', () => {
  it('opens paths without synchronous filesystem I/O and matches sync metadata', async () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const zlib = require('node:zlib') as typeof import('node:zlib')
    const openSync = jest.spyOn(fs, 'openSync').mockImplementation(() => {
      throw new Error('synchronous open used by async API')
    })
    const readSync = jest.spyOn(fs, 'readSync').mockImplementation(() => {
      throw new Error('synchronous read used by async API')
    })
    const closeSync = jest.spyOn(fs, 'closeSync').mockImplementation(() => {
      throw new Error('synchronous close used by async API')
    })
    const unzipSync = jest.spyOn(zlib, 'unzipSync').mockImplementation(() => {
      throw new Error('synchronous unzip used by async API')
    })
    const pst = await AsyncPSTFile.open(enronPath)
    try {
      const store = await pst.getMessageStore()
      expect(store.displayName).toBe('Personal folders')
      const root = await pst.getRootFolder()
      expect(root.subFolderCount).toBe(3)
      expect(root.hasSubfolders).toBe(true)
      const names: string[] = []
      for await (const folder of root.subFolders()) {
        names.push(folder.displayName)
      }
      expect(names).toEqual([
        'Top of Personal Folders',
        'Search Root',
        'SPAM Search Folder 2'
      ])
      const top = (await root.getSubFolders())[0]
      const lokay = (await top.getSubFolders())[1]
      const mailbox = (await lokay.getSubFolders())[0]
      const commercial = (await mailbox.getSubFolders())[0]
      const message = (await commercial.getNextChild()) as AsyncPSTMessage
      await expect(message.getBody()).resolves.toContain('Mojave')
    } finally {
      await pst.close()
      await pst.close()
      openSync.mockRestore()
      readSync.mockRestore()
      closeSync.mockRestore()
      unzipSync.mockRestore()
    }
    await expect(pst.getRootFolder()).rejects.toMatchObject({ code: 'CLOSED' })
  })

  it('provides independent child iterators and cached lazy values', async () => {
    await using pst = await AsyncPSTFile.open(enronPath)
    const root = await pst.getRootFolder()
    const top = (await root.getSubFolders())[0]
    const lokay = (await top.getSubFolders())[1]
    const mailbox = (await lokay.getSubFolders())[0]
    const commercial = (await mailbox.getSubFolders())[0]

    const first = commercial.children()[Symbol.asyncIterator]()
    const second = commercial.children()[Symbol.asyncIterator]()
    const [a, b] = await Promise.all([first.next(), second.next()])
    expect(a.value).toBeInstanceOf(AsyncPSTMessage)
    expect(b.value).toBeInstanceOf(AsyncPSTMessage)
    const messageA = a.value as AsyncPSTMessage
    const messageB = b.value as AsyncPSTMessage
    expect(messageA.subject).toBe("New OBA's")
    expect(messageB.subject).toBe(messageA.subject)
    expect('subject' in messageA).toBe(true)
    expect(messageA.descriptorNodeId.toNumber()).toBeGreaterThan(0)
    const bodyA = messageA.getBody()
    const bodyB = messageA.getBody()
    expect(bodyA).toBe(bodyB)
    await expect(bodyA).resolves.toContain('Mojave')
    await expect(messageA.getBodyHTML()).resolves.toEqual(expect.any(String))
    await expect(messageA.getBodyRTF()).resolves.toEqual(expect.any(String))
    await expect(messageA.getBinaryProperty(0x3013)).resolves.toBeDefined()
    const recipient = await messageA.getRecipient(0)
    expect(recipient?.smtpAddress).toBe('Lorraine.Lindberg@ENRON.com')

    const controller = new AbortController()
    const traversal = commercial
      .children({ signal: controller.signal })
      [Symbol.asyncIterator]()
    await expect(traversal.next()).resolves.toMatchObject({ done: false })
    controller.abort()
    await expect(traversal.next()).rejects.toMatchObject({ code: 'ABORTED' })
  })

  it('honors reader ownership and opening limits', async () => {
    const data = await readFile(enronPath)
    let closes = 0
    const reader: AsyncRandomAccessReader = {
      size: data.length,
      async read(position, length) {
        return Buffer.from(data.subarray(position, position + length))
      },
      async close() {
        closes++
      }
    }

    const borrowed = await AsyncPSTFile.open(reader)
    await borrowed.close()
    expect(closes).toBe(0)

    const owned = await AsyncPSTFile.open(reader, { ownsReader: true })
    await owned.close()
    expect(closes).toBe(1)

    await expect(
      AsyncPSTFile.open(Buffer.from(data), {
        limits: { maxFileBytes: data.length - 1 }
      })
    ).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' })
    await expect(AsyncPSTFile.open(null as never)).rejects.toBeInstanceOf(
      TypeError
    )
    await expect(AsyncPSTFile.open(Buffer.alloc(514))).rejects.toMatchObject({
      code: 'INVALID_HEADER'
    })
    await expect(
      AsyncPSTFile.open(resolve('./src/__tests__/testdata/missing.pst'))
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('rejects pre-aborted operations without poisoning lazy caches', async () => {
    await using pst = await AsyncPSTFile.open(enronPath)
    const controller = new AbortController()
    controller.abort()
    await expect(
      pst.getRootFolder({ signal: controller.signal })
    ).rejects.toMatchObject({
      name: 'AbortError',
      code: 'ABORTED'
    })
    await expect(pst.getRootFolder()).resolves.toBeTruthy()
  })

  it('enforces lazy value and table row limits', async () => {
    await using pst = await AsyncPSTFile.open(enronPath, {
      limits: { maxBufferedValueBytes: 10, maxTableRows: 1 }
    })
    const root = await pst.getRootFolder()
    await expect(root.getSubFolders()).rejects.toMatchObject({
      code: 'LIMIT_EXCEEDED'
    })

    const unrestricted = await AsyncPSTFile.open(enronPath)
    try {
      const unrestrictedRoot = await unrestricted.getRootFolder()
      const top = (await unrestrictedRoot.getSubFolders())[0]
      const lokay = (await top.getSubFolders())[1]
      const mailbox = (await lokay.getSubFolders())[0]
      const commercial = (await mailbox.getSubFolders())[0]
      const message = (await commercial.getNextChild()) as AsyncPSTMessage

      const limited = await AsyncPSTFile.open(enronPath, {
        limits: { maxBufferedValueBytes: 10 }
      })
      try {
        const limitedRoot = await limited.getRootFolder()
        const limitedTop = (await limitedRoot.getSubFolders())[0]
        const limitedLokay = (await limitedTop.getSubFolders())[1]
        const limitedMailbox = (await limitedLokay.getSubFolders())[0]
        const limitedCommercial = (await limitedMailbox.getSubFolders())[0]
        const limitedMessage =
          (await limitedCommercial.getNextChild()) as AsyncPSTMessage
        await expect(limitedMessage.getBody()).rejects.toMatchObject({
          code: 'LIMIT_EXCEEDED'
        })
        await expect(limitedMessage.getBody()).rejects.toMatchObject({
          code: 'LIMIT_EXCEEDED'
        })
      } finally {
        await limited.close()
      }
      expect(message.subject).toBe("New OBA's")
    } finally {
      await unrestricted.close()
    }
  })

  it('streams attachments in order and enforces materialization limits', async () => {
    await using pst = await AsyncPSTFile.open(
      resolve('./src/__tests__/testdata/mtnman1965@outlook.com.ost')
    )
    const root = await pst.getRootFolder()
    const mailbox = (await root.getSubFolders())[1]
    const subtree = (await mailbox.getSubFolders())[4]
    const tasks = (await subtree.getSubFolders())[17]
    const task = (await tasks.getNextChild()) as AsyncPSTMessage
    const attachment = await task.getAttachment(0)

    const chunks: Buffer[] = []
    for await (const chunk of attachment.chunks({ chunkSize: 1000 })) {
      chunks.push(chunk)
    }
    expect(chunks.map((chunk) => chunk.length)).toEqual([
      1000, 1000, 1000, 1000, 796
    ])
    expect(Buffer.concat(chunks)).toEqual(
      await readFile(resolve('./src/__tests__/testdata/rickroll.jpg'))
    )
    await expect(attachment.readBuffer()).resolves.toEqual(
      Buffer.concat(chunks)
    )
    await expect(attachment.getEmbeddedMessage()).resolves.toBeNull()
    expect(() => attachment.chunks({ chunkSize: 0 })).toThrow(RangeError)
    const streamed: Buffer[] = []
    for await (const chunk of attachment.createReadStream({
      chunkSize: 2048
    })) {
      streamed.push(chunk as Buffer)
    }
    expect(Buffer.concat(streamed)).toEqual(Buffer.concat(chunks))
    const controller = new AbortController()
    const aborting = attachment
      .chunks({
        chunkSize: 1000,
        signal: controller.signal
      })
      [Symbol.asyncIterator]()
    await expect(aborting.next()).resolves.toMatchObject({ done: false })
    controller.abort()
    await expect(aborting.next()).rejects.toMatchObject({ code: 'ABORTED' })
    await expect(
      attachment.readBuffer({ maxBytes: 100 })
    ).rejects.toMatchObject({
      code: 'LIMIT_EXCEEDED'
    })
  })

  it('preserves specialized object types and their primitive metadata', async () => {
    await using pst = await AsyncPSTFile.open(
      resolve('./src/__tests__/testdata/mtnman1965@outlook.com.ost')
    )
    const root = await pst.getRootFolder()
    const mailbox = (await root.getSubFolders())[1]
    const subtree = (await mailbox.getSubFolders())[4]
    const folders = await subtree.getSubFolders()

    const contact = await folders[10].getNextChild()
    expect(contact).toBeInstanceOf(AsyncPSTContact)
    expect((contact as AsyncPSTContact).givenName).toBe('Ed')

    const appointment = await folders[11].getNextChild()
    expect(appointment).toBeInstanceOf(AsyncPSTAppointment)
    expect((appointment as AsyncPSTAppointment).duration).toBe(60)

    const activity = await folders[15].getNextChild()
    expect(activity).toBeInstanceOf(AsyncPSTActivity)
    expect((activity as AsyncPSTActivity).logTypeDesc).toBe('Phone call')

    const task = await folders[17].getNextChild()
    expect(task).toBeInstanceOf(AsyncPSTTask)
    expect((task as AsyncPSTTask).taskOwner).toBe('Mountain Man')
  })
})
