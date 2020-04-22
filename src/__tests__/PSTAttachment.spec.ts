import * as chai from 'chai'
import { PSTContact } from '../PSTContact.class'
import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
import { PSTMessage } from '../PSTMessage.class'
import { PSTTask } from '../PSTTask.class'
import { PSTAttachment } from '../PSTAttachment.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile
let subtreeFolder: PSTFolder

before(() => {
  pstFile = new PSTFile(
    resolve('./src/__tests__/testdata/mtnman1965@outlook.com.ost')
  )

  // get to IPM_SUBTREE folder
  let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders()
  subtreeFolder = childFolders[1] // Root - Mailbox
  childFolders = subtreeFolder.getSubFolders()
  subtreeFolder = childFolders[4] // IPM_SUBTREE
})

after(() => {
  pstFile.close()
})

describe('PSTAttachment tests', () => {
  it('should have a contact with an attachment', () => {
    const childFolders = subtreeFolder.getSubFolders()
    const folder = childFolders[10] // Contacts
    const contact: PSTContact = folder.getNextChild()
    // Log.debug1(JSON.stringify(contact, null, 2));
    expect(contact.messageClass).toEqual('IPM.Contact')
    expect(contact.hasAttachments).to.be.true

    // first attachment is contact picture
    let attachment: PSTAttachment = contact.getAttachment(0)
    expect(attachment.size).toEqual(14055)
    expect(attachment.longFilename).toEqual('ContactPicture.jpg')
    expect(attachment.creationTime).toEqual(
      new Date('2018-03-07T16:50:00.000Z')
    )

    // second attachment is never gonna give you up
    attachment = contact.getAttachment(1)
    // Log.debug1(JSON.stringify(attachment, null, 2));
    expect(attachment.size).toEqual(8447)
    expect(attachment.longFilename).toEqual('rickroll.jpg')
    expect(attachment.creationTime).toEqual(
      new Date('2018-03-07T16:49:32.964Z')
    )
  })

  it('should have a task with an attachment', () => {
    const childFolders = subtreeFolder.getSubFolders()
    const folder = childFolders[17] // Tasks
    const task: PSTTask = folder.getNextChild()
    // Log.debug1(JSON.stringify(task, null, 2));
    expect(task.messageClass).toEqual('IPM.Task')
    expect(task.hasAttachments).to.be.true
    const attachment: PSTAttachment = task.getAttachment(0)
    // Log.debug1(JSON.stringify(attachment, null, 2));
    expect(attachment.size).toEqual(8447)
    expect(attachment.longFilename).toEqual('rickroll.jpg')
    expect(attachment.creationTime).toEqual(
      new Date('2018-03-07T16:49:32.964Z')
    )
    expect(attachment.modificationTime).toEqual(
      new Date('2018-03-07T16:49:32.959Z')
    )
    expect(attachment.filename).toEqual('rickroll.jpg')
    expect(attachment.attachMethod).toEqual(1)
    expect(attachment.attachNum).toEqual(0)
    expect(attachment.renderingPosition).toEqual(60)
    expect(attachment.mimeSequence).toEqual(0)
    expect(attachment.pathname).toEqual('')
    expect(attachment.longPathname).toEqual('')
    expect(attachment.mimeTag).toEqual('')
    expect(attachment.contentId).toEqual('')
    expect(attachment.isAttachmentInvisibleInHtml).toEqual(false)
    expect(attachment.isAttachmentInvisibleInRTF).toEqual(false)
    expect(attachment.filesize).toEqual(4796)
    expect(attachment.fileInputStream).to.not.equal(null)
    expect(attachment.embeddedPSTMessage).toEqual(null)
  })

  it('should have email with word attachment', () => {
    const childFolders = subtreeFolder.getSubFolders()
    const folder = childFolders[1] // Inbox
    let msg: PSTMessage = folder.getNextChild()
    msg = folder.getNextChild()
    msg = folder.getNextChild()

    // Email: 2110308 - word attachment
    expect(msg.hasAttachments).to.be.true
    const attachment: PSTAttachment = msg.getAttachment(0)
    // Log.debug1(JSON.stringify(attachment, null, 2));
    expect(attachment.size).toEqual(54044)
    expect(attachment.longFilename).toEqual('OBA_2760.doc')
    expect(attachment.creationTime).toEqual(
      new Date('2018-03-07T16:26:20.724Z')
    )
  })

  it('should have email with excel attachment', () => {
    const childFolders = subtreeFolder.getSubFolders()
    const folder = childFolders[1] // Inbox
    let msg: PSTMessage = folder.getNextChild()
    msg = folder.getNextChild()
    msg = folder.getNextChild()
    msg = folder.getNextChild()

    // Email: 2110724 - excel attachment
    expect(msg.hasAttachments).to.be.true
    const attachment: PSTAttachment = msg.getAttachment(0)
    // Log.debug1(JSON.stringify(attachment, null, 2));
    expect(attachment.size).toEqual(31016)
    expect(attachment.longFilename).toEqual('RedRockA.xls')
    expect(attachment.creationTime).toEqual(
      new Date('2018-03-07T16:31:56.075Z')
    )
  })

  it('should have email with jpg attachment', () => {
    const childFolders = subtreeFolder.getSubFolders()
    const folder = childFolders[1] // Inbox
    let msg: PSTMessage = folder.getNextChild()
    msg = folder.getNextChild()
    msg = folder.getNextChild()
    msg = folder.getNextChild()
    msg = folder.getNextChild()

    // Email: 2111140 - never gonna give you up
    expect(msg.hasAttachments).to.be.true
    const attachment: PSTAttachment = msg.getAttachment(0)
    // Log.debug1(JSON.stringify(attachment, null, 2));
    expect(attachment.size).toEqual(5020)
    expect(attachment.longFilename).toEqual('rickroll.jpg')
    expect(attachment.creationTime).toEqual(
      new Date('2018-03-07T16:43:36.995Z')
    )
  })
})
