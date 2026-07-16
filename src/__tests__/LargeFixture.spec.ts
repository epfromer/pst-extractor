import {
  AsyncPSTFile,
  AsyncPSTFolder,
  AsyncPSTMessage
} from '../AsyncPST.class.js'
import { jest } from '@jest/globals'
import { PSTFile } from '../PSTFile.class.js'
import { PSTFolder } from '../PSTFolder.class.js'
import { PSTMessage } from '../PSTMessage.class.js'
import { hasPSTErrorCode } from '../PSTError.js'

const fixture = process.env.PST_LARGE_FIXTURE
const minimum = {
  folders: Number(process.env.PST_LARGE_MIN_FOLDERS ?? 716),
  messages: Number(process.env.PST_LARGE_MIN_MESSAGES ?? 2875),
  attachments: Number(process.env.PST_LARGE_MIN_ATTACHMENTS ?? 2678)
}

interface Counts {
  folders: number
  messages: number
  attachments: number
  sampledBodies: number
  sampledAttachments: number
}

function expectMinimums(counts: Counts): void {
  expect(counts.folders).toBeGreaterThanOrEqual(minimum.folders)
  expect(counts.messages).toBeGreaterThanOrEqual(minimum.messages)
  expect(counts.attachments).toBeGreaterThanOrEqual(minimum.attachments)
  expect(counts.sampledBodies).toBeGreaterThan(0)
  if (counts.attachments > 0) {
    expect(counts.sampledAttachments).toBeGreaterThan(0)
  }
}

function discardAttachment(message: PSTMessage, index: number): boolean {
  let input
  try {
    input = message.getAttachment(index).fileInputStream
  } catch (error) {
    if (hasPSTErrorCode(error, 'NOT_FOUND')) return false
    throw error
  }
  if (!input) return false
  const buffer = Buffer.alloc(64 * 1024)
  while (input.read(buffer) > 0) {
    // Deliberately discard private fixture content.
  }
  return true
}

function traverseSync(path: string): Counts {
  const pst = new PSTFile(path)
  const counts: Counts = {
    folders: 0,
    messages: 0,
    attachments: 0,
    sampledBodies: 0,
    sampledAttachments: 0
  }
  try {
    const pending: PSTFolder[] = [pst.getRootFolder()]
    while (pending.length > 0) {
      const folder = pending.pop()!
      counts.folders++
      pending.push(...folder.getSubFolders())
      folder.moveChildCursorTo(0)
      while (true) {
        const child = folder.getNextChild()
        if (child === null) break
        if (!(child instanceof PSTMessage)) continue
        const messageIndex = counts.messages++
        if (messageIndex % 257 === 0) {
          void child.body
          counts.sampledBodies++
        }
        const attachmentCount = child.numberOfAttachments
        for (let index = 0; index < attachmentCount; index++) {
          const attachmentIndex = counts.attachments++
          if (attachmentIndex % 251 === 0) {
            if (discardAttachment(child, index)) counts.sampledAttachments++
          }
        }
      }
    }
    return counts
  } finally {
    pst.close()
  }
}

async function traverseAsync(path: string): Promise<Counts> {
  const pst = await AsyncPSTFile.open(path)
  const counts: Counts = {
    folders: 0,
    messages: 0,
    attachments: 0,
    sampledBodies: 0,
    sampledAttachments: 0
  }
  try {
    const pending: AsyncPSTFolder[] = [await pst.getRootFolder()]
    while (pending.length > 0) {
      const folder = pending.pop()!
      counts.folders++
      pending.push(...(await folder.getSubFolders()))
      for await (const child of folder.children()) {
        if (!(child instanceof AsyncPSTMessage)) continue
        const messageIndex = counts.messages++
        if (messageIndex % 257 === 0) {
          await child.getBody()
          counts.sampledBodies++
        }
        for (let index = 0; index < child.numberOfAttachments; index++) {
          const attachmentIndex = counts.attachments++
          if (attachmentIndex % 251 === 0) {
            const attachment = await child.getAttachment(index)
            for await (const _chunk of attachment.chunks()) {
              // Deliberately discard private fixture content.
            }
            counts.sampledAttachments++
          }
        }
      }
    }
    return counts
  } finally {
    await pst.close()
  }
}

const describeLarge = fixture ? describe : describe.skip

describeLarge('opt-in large PST/OST structural acceptance', () => {
  jest.setTimeout(12 * 60 * 60 * 1000)

  it('traverses the fixture synchronously without parser errors', () => {
    const counts = traverseSync(fixture!)
    expect(counts).toBeDefined()
    expectMinimums(counts)
  })

  it('traverses the fixture asynchronously without parser errors', async () => {
    const counts = await traverseAsync(fixture!)
    expect(counts).toBeDefined()
    expectMinimums(counts)
  })
})
