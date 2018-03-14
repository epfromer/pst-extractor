import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
import { PSTContact } from '../PSTContact/PSTContact.class';
import { PSTAttachment } from './PSTAttachment.class';
import { PSTTask } from '../PSTTask/PSTTask.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
const resolve = require('path').resolve;
const expect = chai.expect;
let pstFile: PSTFile;
let subtreeFolder: PSTFolder;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/mtnman1965@outlook.com.ost'));

    // get to IPM_SUBTREE folder
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
    subtreeFolder = childFolders[1]; // Root - Mailbox
    childFolders = subtreeFolder.getSubFolders();
    subtreeFolder = childFolders[4]; // IPM_SUBTREE
});

after(() => {
    pstFile.close();
});

describe('PSTAttachment tests', () => {
    it('should have a contact with an attachment', () => {
        let childFolders = subtreeFolder.getSubFolders();
        let folder = childFolders[10]; // Contacts
        let contact: PSTContact = folder.getNextChild();
        // console.log(contact.toJSON())
        expect(contact.messageClass).to.equal('IPM.Contact');
        expect(contact.hasAttachments).to.be.true;

        // first attachment is contact picture
        let attachment: PSTAttachment = contact.getAttachment(0);
        expect(attachment.size).to.equal(14055);
        expect(attachment.longFilename).to.equal('ContactPicture.jpg');
        expect(attachment.creationTime).to.eql(new Date("2018-03-07T16:50:00.000Z"));
        
        // second attachment is never gonna give you up
        attachment = contact.getAttachment(1);
        // console.log(attachment.toJSON())
        expect(attachment.size).to.equal(8447);
        expect(attachment.longFilename).to.equal('rickroll.jpg');
        expect(attachment.creationTime).to.eql(new Date("2018-03-07T16:49:32.964Z"));
    });

    it('should have a task with an attachment', () => {
        let childFolders = subtreeFolder.getSubFolders();
        let folder = childFolders[17];  // Tasks
        let task: PSTTask = folder.getNextChild();
        // console.log(task.toJSON())
        expect(task.messageClass).to.equal('IPM.Task');
        expect(task.hasAttachments).to.be.true;
        let attachment: PSTAttachment = task.getAttachment(0);
        // console.log(attachment.toJSON())
        expect(attachment.size).to.equal(8447);
        expect(attachment.longFilename).to.equal('rickroll.jpg');
        expect(attachment.creationTime).to.eql(new Date("2018-03-07T16:49:32.964Z"));
        expect(attachment.modificationTime).to.eql(new Date("2018-03-07T16:49:32.959Z"));
        expect(attachment.filename).to.equal('rickroll.jpg');
        expect(attachment.attachMethod).to.equal(1);
        expect(attachment.attachNum).to.equal(0);
        expect(attachment.renderingPosition).to.equal(60);
        expect(attachment.mimeSequence).to.equal(0);
        expect(attachment.pathname).to.equal('');
        expect(attachment.longPathname).to.equal('');
        expect(attachment.mimeTag).to.equal('');
        expect(attachment.contentId).to.equal('');
        expect(attachment.isAttachmentInvisibleInHtml).to.equal(false);
        expect(attachment.isAttachmentInvisibleInRTF).to.equal(false);
        expect(attachment.filesize).to.equal(4796);
        expect(attachment.fileInputStream).to.not.equal(null);
        expect(attachment.embeddedPSTMessage).to.equal(null);
    });

    it('should have email with word attachment', () => {
        let childFolders = subtreeFolder.getSubFolders();
        let folder = childFolders[1];  // Inbox
        let msg: PSTMessage = folder.getNextChild();
        msg = folder.getNextChild();
        msg = folder.getNextChild();

        // Email: 2110308 - word attachment
        expect(msg.hasAttachments).to.be.true;
        let attachment: PSTAttachment = msg.getAttachment(0);
        // console.log(attachment.toJSON())
        expect(attachment.size).to.equal(54044);
        expect(attachment.longFilename).to.equal('OBA_2760.doc');
        expect(attachment.creationTime).to.eql(new Date("2018-03-07T16:26:20.724Z"));
    });

    it('should have email with excel attachment', () => {
        let childFolders = subtreeFolder.getSubFolders();
        let folder = childFolders[1];  // Inbox
        let msg: PSTMessage = folder.getNextChild();
        msg = folder.getNextChild();
        msg = folder.getNextChild();
        msg = folder.getNextChild();

        // Email: 2110724 - excel attachment
        expect(msg.hasAttachments).to.be.true;
        let attachment: PSTAttachment = msg.getAttachment(0);
        // console.log(attachment.toJSON())
        expect(attachment.size).to.equal(31016);
        expect(attachment.longFilename).to.equal('RedRockA.xls');
        expect(attachment.creationTime).to.eql(new Date("2018-03-07T16:31:56.075Z"));
    });

    it('should have email with jpg attachment', () => {
        let childFolders = subtreeFolder.getSubFolders();
        let folder = childFolders[1];  // Inbox
        let msg: PSTMessage = folder.getNextChild();
        msg = folder.getNextChild();
        msg = folder.getNextChild();
        msg = folder.getNextChild();
        msg = folder.getNextChild();

        // Email: 2111140 - never gonna give you up
        expect(msg.hasAttachments).to.be.true;
        let attachment: PSTAttachment = msg.getAttachment(0);
        // console.log(attachment.toJSON())
        expect(attachment.size).to.equal(5020);
        expect(attachment.longFilename).to.equal('rickroll.jpg');
        expect(attachment.creationTime).to.eql(new Date("2018-03-07T16:43:36.995Z"));
    });
});
