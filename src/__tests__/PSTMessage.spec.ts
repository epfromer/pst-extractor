import * as chai from 'chai'
import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
import { PSTMessage } from '../PSTMessage.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile
let childFolders: PSTFolder[]

before(() => {
  pstFile = new PSTFile(resolve('./src/__tests__/testdata/enron.pst'))

  // get to this point in hierarchy
  // Personal folders
  //  |- Top of Personal Folders
  //  |  |- Deleted Items
  //  |  |- lokay-m
  //  |  |  |- MLOKAY (Non-Privileged)

  childFolders = pstFile.getRootFolder().getSubFolders()
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

describe('PSTMessage tests', () => {
  it('should have email messages', () => {
    expect(childFolders[0].displayName).toEqual('TW-Commercial Group')
    const comGroupFolder = childFolders[0]

    let msg: PSTMessage = comGroupFolder.getNextChild()
    // Log.debug1(JSON.stringify(msg, null, 2));
    expect(msg.messageClass).toEqual('IPM.Note')
    expect(msg.subject).toEqual("New OBA's")
    expect(msg.sentRepresentingEmailAddress).toEqual('Dennis.Lee@ENRON.com')
    expect(msg.displayTo).toEqual('Lindberg  Lorraine; Watson  Kimberly')
    let body = msg.body
    expect(body).to.contain(
      'Mojave (Effective date 12/02/01) and Williams Field Services'
    )
    expect(body.length).toEqual(678)

    msg = comGroupFolder.getNextChild()
    expect(msg.messageClass).toEqual('IPM.Note')
    expect(msg.displayTo).toEqual('Michelle Lokay (E-mail)')
    body = msg.body
    expect(body).to.contain(
      'Per our earlier conversation, Burlington Resources agrees to purchase 20,000'
    )
    expect(body.length).toEqual(661)
    expect(msg.emailAddress).toEqual('')
    expect(msg.addrType).toEqual('')
    expect(msg.comment).toEqual('')
    expect(msg.creationTime).toEqual(new Date('2009-05-11T19:17:11.999Z'))
    expect(msg.modificationTime).toEqual(new Date('2009-05-11T19:17:12.061Z'))
    expect(msg.importance).toEqual(0)
    expect(msg.transportMessageHeaders).to.contain(
      'date: Wed, 24 Oct 2001 10:07:37 -0700 (PDT) Wed, 24 Oct 2001 10:07:37 -0500\r\nM'
    )
    expect(msg.clientSubmitTime).toEqual(new Date('2001-10-24T17:07:37.000Z'))
    expect(msg.receivedByName).toEqual('')
    expect(msg.sentRepresentingName).toEqual('Reames Julie')
    expect(msg.sentRepresentingAddressType).toEqual('SMTP')
    expect(msg.sentRepresentingEmailAddress).toEqual('JReames@br-inc.com')
    expect(msg.subject).toEqual(
      'I/B Link Capacity for November and December 2001'
    )
    expect(msg.conversationTopic).toEqual(
      'I/B Link Capacity for November and December 2001'
    )
    expect(msg.receivedByAddressType).toEqual('')
    expect(msg.receivedByAddress).toEqual('')
    expect(msg.isRead).toEqual(true)
    expect(msg.isUnmodified).toEqual(false)
    expect(msg.isSubmitted).toEqual(false)
    expect(msg.isUnsent).toEqual(false)
    expect(msg.hasAttachments).toEqual(false)
    expect(msg.isFromMe).toEqual(false)
    expect(msg.isAssociated).toEqual(false)
    expect(msg.isResent).toEqual(false)
    expect(msg.acknowledgementMode).toEqual(0)
    expect(msg.originatorDeliveryReportRequested).toEqual(false)
    expect(msg.recipientReassignmentProhibited).toEqual(false)
    expect(msg.isUnmodified).toEqual(false)
    expect(msg.originalSensitivity).toEqual(0)
    expect(msg.sensitivity).toEqual(0)
    expect(msg.rcvdRepresentingName).toEqual('')
    expect(msg.originalSubject).toEqual('')
    expect(msg.replyRecipientNames).toEqual('')
    expect(msg.messageToMe).toEqual(false)
    expect(msg.readReceiptRequested).toEqual(false)
    expect(msg.messageCcMe).toEqual(false)
    expect(msg.messageRecipMe).toEqual(false)
    expect(msg.responseRequested).toEqual(false)
    expect(msg.originalDisplayBcc).toEqual('')
    expect(msg.originalDisplayCc).toEqual('')
    expect(msg.originalDisplayTo).toEqual('')
    expect(msg.rcvdRepresentingAddrtype).toEqual('')
    expect(msg.rcvdRepresentingEmailAddress).toEqual('')
    expect(msg.isNonReceiptNotificationRequested).toEqual(false)
    expect(msg.isOriginatorNonDeliveryReportRequested).toEqual(false)
    expect(msg.recipientType).toEqual(0)
    expect(msg.isReplyRequested).toEqual(false)
    expect(msg.senderName).toEqual('Reames Julie')
    expect(msg.senderAddrtype).toEqual('SMTP')
    expect(msg.senderEmailAddress).toEqual('JReames@br-inc.com')
    expect(msg.internetArticleNumber).toEqual(0)
    expect(msg.primarySendAccount).toEqual('')
    expect(msg.objectType).toEqual(0)
    expect(msg.deleteAfterSubmit).toEqual(false)
    expect(msg.responsibility).toEqual(false)
    expect(msg.isRTFInSync).toEqual(false)
    expect(msg.displayBCC).toEqual('')
    expect(msg.displayCC).toEqual('')
    expect(msg.displayTo).toEqual('Michelle Lokay (E-mail)')
    expect(msg.messageDeliveryTime).toEqual(
      new Date('2001-10-24T17:07:37.000Z')
    )
    expect(msg.bodyPrefix).toEqual('')
    expect(msg.rtfSyncBodyTag).toEqual('')
    expect(msg.inReplyToId).toEqual('')
    expect(msg.rtfSyncBodyCRC).toEqual(0)
    expect(msg.rtfSyncBodyCount).toEqual(0)
    expect(msg.rtfSyncPrefixCount).toEqual(0)
    expect(msg.rtfSyncTrailingCount).toEqual(0)
    expect(msg.iconIndex).toEqual(0)
    expect(msg.reminderDelta).toEqual(0)
    expect(msg.numberOfAttachments).toEqual(0)
    expect(msg.internetMessageId).toEqual(
      '<OXDAXN4L22RH32V3FYRFYTV2QE0MXYONB@zlsvr22>'
    )
    expect(msg.returnPath).toEqual('JReames@br-inc.com')
    expect(msg.attrHidden).toEqual(false)
    expect(msg.reminderSet).toEqual(false)
    expect(msg.urlCompName).toEqual('')
    expect(msg.lastVerbExecutionTime).toEqual(null)
    expect(msg.taskStartDate).toEqual(null)
    expect(msg.taskDueDate).toEqual(null)
    expect(msg.conversationId).toEqual(null)
    expect(msg.priority).toEqual(0)
    expect(msg.colorCategories).toEqual([])
    expect(msg.bodyHTML).toEqual('')
    expect(msg.senderEntryId).to.not.be.null
    if (msg.senderEntryId) {
      expect(msg.senderEntryId.toString()).to.contain('JReames@br-inc.com')
    }
  })

  // get this email, which uses block skip points
  // Personal folders
  //  |- Top of Personal Folders
  //  |  |- Deleted Items
  //  |  |- lokay-m
  //  |  |  |- MLOKAY (Non-Privileged)
  //  |  |  |  |- TW-Commercial Group
  //  |  |  |  |- Systems
  //  |  |  |  |- Sent Items
  //  |  |  |  |- Personal
  //  |  |  |  |  |- Email: 2097924 - Fwd: Enjoy fall in an Alamo midsize car -- just $169 a week!
  it('should have email message which uses block skip points', () => {
    expect(childFolders[3].displayName).toEqual('Personal')
    const personalFolder = childFolders[3]

    const msg: PSTMessage = personalFolder.getNextChild()
    // Log.debug1(JSON.stringify(msg, null, 2));
    expect(msg.messageClass).toEqual('IPM.Note')
    expect(msg.subject).toEqual(
      'Fwd: Enjoy fall in an Alamo midsize car -- just $169 a week!'
    )
  })
})
