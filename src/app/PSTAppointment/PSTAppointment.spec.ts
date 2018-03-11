import { PSTAppointment } from './PSTAppointment.class';
import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
const resolve = require('path').resolve;
const expect = chai.expect;
let pstFile: PSTFile;
let folder: PSTFolder;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/mtnman1965@outlook.com.ost'));

    // get to Calendar folder
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
    folder = childFolders[1]; // Root - Mailbox
    childFolders = folder.getSubFolders();
    folder = childFolders[4]; // IPM_SUBTREE
    childFolders = folder.getSubFolders();
    folder = childFolders[11]; // Calendar
});

after(() => {
    pstFile.close();
});

describe('PSTAppointment tests', () => {
    it('should have a Journal folder', () => {
        expect(folder.displayName).to.equal('Calendar');
    });

    it('should have two calendar items', () => {
        let appt: PSTAppointment = folder.getNextChild();
        // console.log(appt.toJSONstring())
        expect(appt.messageClass).to.equal('IPM.Appointment');
        expect(appt.subject).to.equal('get lunch');
        expect(appt.startTime).to.eql(new Date("2018-03-04T19:00:00.000Z"));
        expect(appt.senderName).to.equal('Mountain Man');
        expect(appt.duration).to.equal(60);

        appt = folder.getNextChild();
        // console.log(appt.toJSONstring())
        expect(appt.messageClass).to.equal('IPM.Appointment');
        expect(appt.subject).to.equal('workout');
        expect(appt.creationTime).to.eql(new Date("2018-03-05T20:26:26.396Z"));
        expect(appt.senderName).to.equal('Mountain Man');
        expect(appt.duration).to.equal(60);
        expect(appt.transportMessageHeaders).to.equal('');
        expect(appt.location).to.equal('');
        expect(appt.allAttendees).to.equal('');
        expect(appt.toAttendees).to.equal('');
        expect(appt.ccAttendees).to.equal('');
        expect(appt.netMeetingServer).to.equal('');
        expect(appt.netMeetingOrganizerAlias).to.equal('');
        expect(appt.netMeetingDocumentPathName).to.equal('');
        expect(appt.netShowURL).to.equal('');
        expect(appt.requiredAttendees).to.equal('');
        expect(appt.recurrencePattern).to.equal('every day from 10:00 AM to 11:00 AM');
        expect(appt.importance).to.equal(2);
        expect(appt.busyStatus).to.equal(2);
        expect(appt.color).to.equal(0);
        expect(appt.meetingStatus).to.equal(0);
        expect(appt.responseStatus).to.equal(0);
        expect(appt.recurrenceType).to.equal(1);
        expect(appt.appointmentSequence).to.equal(0);
        expect(appt.netMeetingType).to.equal(0);
        expect(appt.localeId).to.equal(1033);
        expect(appt.startTime).to.eql(new Date("2018-03-05T17:00:00.000Z"));
        expect(appt.endTime).to.eql(new Date("2018-03-05T18:00:00.000Z"));
        expect(appt.showAsBusy).to.be.true;
        expect(appt.isRecurring).to.be.true;
        expect(appt.sendAsICAL).to.be.false;
        expect(appt.subType).to.be.false;
        expect(appt.isOnlineMeeting).to.be.false;
        expect(appt.appointmentCounterProposal).to.be.false;
        expect(appt.isSilent).to.be.false;
        expect(appt.recurrenceBase).to.equal(null);
        expect(appt.attendeeCriticalChange).to.equal(null);
        
    });
});