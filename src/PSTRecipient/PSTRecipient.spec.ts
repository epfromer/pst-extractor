import * as chai from 'chai'
import { PSTFile } from '../PSTFile/PSTFile.class'
import { PSTFolder } from '../PSTFolder/PSTFolder.class'
import { PSTMessage } from '../PSTMessage/PSTMessage.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile

before(() => {
  pstFile = new PSTFile(
    resolve('./src/testdata/michelle_lokay_000_1_1_1_1.pst')
  )
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
//  |  |  |  |  |-  sender: Lee  Dennis (Dennis.Lee@ENRON.com)
//  |  |  |  |  |-  recipient: Lindberg  Lorraine (Lorraine.Lindberg@ENRON.com)
//  |  |  |  |  |-  recipient: Watson  Kimberly (Kimberly.Watson@ENRON.com)
//  |  |  |  |  |-  recipient: Lee  Dennis (Dennis.Lee@ENRON.com)
//  |  |  |  |  |- Email: 2097220 - I/B Link Capacity for November and December 2001
//  |  |  |  |  |-  sender: Reames Julie (JReames@br-inc.com)
//  |  |  |  |  |-  recipient: Michelle Lokay (E-mail) (michelle.lokay@enron.com)

describe('PSTRecipient tests', () => {
  it('should have email messages', () => {
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders()
    expect(childFolders.length).to.equal(3)
    let folder = childFolders[0]
    expect(folder.subFolderCount).to.equal(2)
    expect(folder.displayName).to.equal('Top of Personal Folders')
    childFolders = folder.getSubFolders()
    folder = childFolders[0]
    expect(folder.displayName).to.equal('Deleted Items')
    folder = childFolders[1]
    expect(folder.displayName).to.equal('lokay-m')
    childFolders = folder.getSubFolders()
    folder = childFolders[0]
    expect(folder.displayName).to.equal('MLOKAY (Non-Privileged)')
    childFolders = folder.getSubFolders()
    expect(childFolders[0].displayName).to.equal('TW-Commercial Group')
    const comGroupFolder = childFolders[0]

    let msg: PSTMessage = comGroupFolder.getNextChild()
    expect(msg.messageClass).to.equal('IPM.Note')
    expect(msg.subject).to.equal("New OBA's")
    expect(msg.senderName).to.equal('Lee  Dennis')
    expect(msg.senderEmailAddress).to.equal('Dennis.Lee@ENRON.com')
    expect(msg.displayTo).to.equal('Lindberg  Lorraine; Watson  Kimberly')

    let recipient = msg.getRecipient(0)
    expect(recipient).is.not.null
    if (recipient) {
      // Log.debug1(JSON.stringify(recipient, null, 2));
      expect(recipient.displayName).to.equal('Lindberg  Lorraine')
      expect(recipient.smtpAddress).to.equal('Lorraine.Lindberg@ENRON.com')
    }

    recipient = msg.getRecipient(1)
    expect(recipient).is.not.null
    if (recipient) {
      expect(recipient.displayName).to.equal('Watson  Kimberly')
      expect(recipient.smtpAddress).to.equal('Kimberly.Watson@ENRON.com')
    }

    recipient = msg.getRecipient(2)
    expect(recipient).is.not.null
    if (recipient) {
      expect(recipient.displayName).to.equal('Lee  Dennis')
      expect(recipient.smtpAddress).to.equal('Dennis.Lee@ENRON.com')
    }

    msg = comGroupFolder.getNextChild()
    expect(msg.messageClass).to.equal('IPM.Note')
    expect(msg.subject).to.equal(
      'I/B Link Capacity for November and December 2001'
    )
    expect(msg.sentRepresentingEmailAddress).to.equal('JReames@br-inc.com')
    expect(msg.displayTo).to.equal('Michelle Lokay (E-mail)')

    recipient = msg.getRecipient(0)
    expect(recipient).is.not.null
    if (recipient) {
      // Log.debug1(JSON.stringify(recipient, null, 2));
      expect(recipient.displayName).to.equal('Michelle Lokay (E-mail)')
      expect(recipient.smtpAddress).to.equal('michelle.lokay@enron.com')
    }
  })
})
