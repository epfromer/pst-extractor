import { PSTMessage } from './PSTMessage.class';
import * as chai from 'chai';
import * as long from 'long';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
const resolve = require('path').resolve;
const expect = chai.expect;
let pstFile: PSTFile;
let childFolders: PSTFolder[];

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/michelle_lokay_000_1_1_1_1.pst'));

    // get to this point in hierarchy
    // Personal folders
    //  |- Top of Personal Folders
    //  |  |- Deleted Items
    //  |  |- lokay-m
    //  |  |  |- MLOKAY (Non-Privileged)

    childFolders = pstFile.getRootFolder().getSubFolders();
    expect(childFolders.length).to.equal(3);
    let folder = childFolders[0];
    expect(folder.subFolderCount).to.equal(2);
    expect(folder.displayName).to.equal('Top of Personal Folders');
    childFolders = folder.getSubFolders();
    folder = childFolders[0];
    expect(folder.displayName).to.equal('Deleted Items');
    folder = childFolders[1];
    expect(folder.displayName).to.equal('lokay-m');
    childFolders = folder.getSubFolders();
    folder = childFolders[0];
    expect(folder.displayName).to.equal('MLOKAY (Non-Privileged)');
    childFolders = folder.getSubFolders();
});

after(() => {
    pstFile.close();
});

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
        expect(childFolders[0].displayName).to.equal('TW-Commercial Group');
        const comGroupFolder = childFolders[0];
        
        let msg: PSTMessage = comGroupFolder.getNextChild();
        expect(msg.messageClass).to.equal('IPM.Note');
        expect(msg.subject).to.equal("New OBA's");
        expect(msg.sentRepresentingEmailAddress).to.equal('Dennis.Lee@ENRON.com');
        expect(msg.displayTo).to.equal('Lindberg  Lorraine; Watson  Kimberly');
        let body = msg.body;
        expect(body).to.contain('Mojave (Effective date 12/02/01) and Williams Field Services')
        expect(body.length).to.equal(678);
        
        msg = comGroupFolder.getNextChild();
        expect(msg.messageClass).to.equal('IPM.Note');
        expect(msg.displayTo).to.equal('Michelle Lokay (E-mail)');
        body = msg.body;
        expect(body).to.contain('Per our earlier conversation, Burlington Resources agrees to purchase 20,000')
        expect(body.length).to.equal(661);
        expect(msg.emailAddress).to.equal('');
        expect(msg.addrType).to.equal('');
        expect(msg.comment).to.equal('');
        expect(msg.creationTime).to.eql(new Date("2009-05-11T19:17:11.999Z"));
        expect(msg.modificationTime).to.eql(new Date("2009-05-11T19:17:12.061Z"));
        expect(msg.importance).to.equal(0);
        expect(msg.transportMessageHeaders).to.contain('date: Wed, 24 Oct 2001 10:07:37 -0700 (PDT) Wed, 24 Oct 2001 10:07:37 -0500\r\nM');
        expect(msg.clientSubmitTime).to.eql(new Date("2001-10-24T17:07:37.000Z"));
        expect(msg.receivedByName).to.equal('');
        expect(msg.sentRepresentingName).to.equal('Reames Julie');
        expect(msg.sentRepresentingAddressType).to.equal('SMTP');
        expect(msg.sentRepresentingEmailAddress).to.equal('JReames@br-inc.com');
        expect(msg.subject).to.equal("I/B Link Capacity for November and December 2001");
        expect(msg.conversationTopic).to.equal('I/B Link Capacity for November and December 2001');
        expect(msg.receivedByAddressType).to.equal('');
        expect(msg.receivedByAddress).to.equal('');
        expect(msg.isRead).to.equal(true);
        expect(msg.isUnmodified).to.equal(false);
        expect(msg.isSubmitted).to.equal(false);
        expect(msg.isUnsent).to.equal(false);
        expect(msg.hasAttachments).to.equal(false);
        expect(msg.isFromMe).to.equal(false);
        expect(msg.isAssociated).to.equal(false);
        expect(msg.isResent).to.equal(false);
        expect(msg.acknowledgementMode).to.equal(0);
        expect(msg.originatorDeliveryReportRequested).to.equal(false);
        expect(msg.recipientReassignmentProhibited).to.equal(false);
        expect(msg.isUnmodified).to.equal(false);
        expect(msg.originalSensitivity).to.equal(0);
        expect(msg.sensitivity).to.equal(0);
        expect(msg.rcvdRepresentingName).to.equal('');
        expect(msg.originalSubject).to.equal('');
        expect(msg.replyRecipientNames).to.equal('');
        expect(msg.messageToMe).to.equal(false);
        expect(msg.readReceiptRequested).to.equal(false);
        expect(msg.messageCcMe).to.equal(false);
        expect(msg.messageRecipMe).to.equal(false);
        expect(msg.responseRequested).to.equal(false);
        expect(msg.originalDisplayBcc).to.equal('');
        expect(msg.originalDisplayCc).to.equal('');
        expect(msg.originalDisplayTo).to.equal('');
        expect(msg.rcvdRepresentingAddrtype).to.equal('');
        expect(msg.rcvdRepresentingEmailAddress).to.equal('');
        expect(msg.isNonReceiptNotificationRequested).to.equal(false);
        expect(msg.isOriginatorNonDeliveryReportRequested).to.equal(false);
        expect(msg.recipientType).to.equal(0);
        expect(msg.isReplyRequested).to.equal(false);
        expect(msg.senderName).to.equal('Reames Julie');
        expect(msg.senderAddrtype).to.equal('SMTP');
        expect(msg.senderEmailAddress).to.equal('JReames@br-inc.com');
        expect(msg.internetArticleNumber).to.equal(0);
        expect(msg.primarySendAccount).to.equal('');
        expect(msg.objectType).to.equal(0);
        expect(msg.deleteAfterSubmit).to.equal(false);
        expect(msg.responsibility).to.equal(false);
        expect(msg.isRTFInSync).to.equal(false);
        expect(msg.isURLCompNameSet).to.equal(false);
        expect(msg.displayBCC).to.equal('');
        expect(msg.displayCC).to.equal('');
        expect(msg.displayTo).to.equal('Michelle Lokay (E-mail)');
        expect(msg.messageDeliveryTime).to.eql(new Date("2001-10-24T17:07:37.000Z"));
        expect(msg.bodyPrefix).to.equal('');
        expect(msg.rtfSyncBodyTag).to.equal('');
        expect(msg.inReplyToId).to.equal('');
        expect(msg.nativeBodyType).to.equal(0);
        expect(msg.rtfSyncBodyCRC).to.equal(0);
        expect(msg.rtfSyncBodyCount).to.equal(0);
        expect(msg.rtfSyncPrefixCount).to.equal(0);
        expect(msg.rtfSyncTrailingCount).to.equal(0);
        expect(msg.iconIndex).to.equal(0);
        expect(msg.actionFlag).to.equal(0);
        expect(msg.reminderDelta).to.equal(0);
        expect(msg.numberOfAttachments).to.equal(0);
        expect(msg.internetMessageId).to.equal('<OXDAXN4L22RH32V3FYRFYTV2QE0MXYONB@zlsvr22>');
        expect(msg.returnPath).to.equal('JReames@br-inc.com');
        expect(msg.hasReplied).to.equal(false);
        expect(msg.disableFullFidelity).to.equal(false);
        expect(msg.attrHidden).to.equal(false);
        expect(msg.attrSystem).to.equal(false);
        expect(msg.attrReadonly).to.equal(false);
        expect(msg.reminderSet).to.equal(false);
        expect(msg.isFlagged).to.equal(false);
        expect(msg.urlCompName).to.equal('');
        expect(msg.actionDate).to.equal(null);
        expect(msg.taskStartDate).to.equal(null);
        expect(msg.taskDueDate).to.equal(null);
        expect(msg.conversationId).to.equal(null);
        expect(msg.priority).to.equal(0);
        expect(msg.colorCategories).to.eql([]);
        expect(msg.hasForwarded).to.equal(false);
        expect(msg.bodyHTML).to.equal('');
        expect(msg.senderEntryId.toString()).to.contain('JReames@br-inc.com');
    });

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
        expect(childFolders[3].displayName).to.equal('Personal');
        const personalFolder = childFolders[3];
        
        let msg: PSTMessage = personalFolder.getNextChild();
        expect(msg.messageClass).to.equal('IPM.Note');
        expect(msg.subject).to.equal("Fwd: Enjoy fall in an Alamo midsize car -- just $169 a week!");
    });
});