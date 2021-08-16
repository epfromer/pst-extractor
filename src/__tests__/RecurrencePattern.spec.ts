import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
import { PSTAppointment } from '../PSTAppointment.class'
import { PatternType, RecurrencePattern } from '../RecurrencePattern.class'
const resolve = require('path').resolve
let pstFile: PSTFile
let folder: PSTFolder

/*
 |- Root - Public
 |  |- IPM_SUBTREE
 |  |- NON_IPM_SUBTREE
 |  |  |- EFORMS REGISTRY
 |  |  |  |- Organization Forms
 |- Root - Mailbox
 |  |- Common Views
 |  |- Finder
 |  |  |- Reminders
 |  |  |- Contact Search
 |  |  |- To-Do Search
 |  |  |- Tracked Mail Processing
 |  |- Shortcuts
 |  |- Views
 |  |- IPM_SUBTREE
 |  |  |- Deleted Items
 |  |  |  |- Sender: Google Calendar, Subject: Invitation: meeting from Ed @ Fri Aug 13, 2021 4pm - 4:30pm (MDT) (pstextractortest@outlook.com)
 |  |  |- Inbox
 |  |  |  |- Sender: Microsoft OneDrive, Subject: Get started with OneDrive
 |  |  |  |- Sender: Outlook Team, Subject: Welcome to your new Outlook.com account
 |  |  |  |- Sender: Ed, Subject: test, no attachment
 |  |  |  |- Sender: Ed, Subject: text file attachment
 |  |  |  |- Sender: Ed, Subject: jpg attachment
 |  |  |  |- Sender: Ed, Subject: pdf attachment
 |  |  |  |- Sender: Ed, Subject: text, jpg, pdf attachments
 |  |  |  |- Sender: Google Calendar, Subject: Invitation: unanswered meeting @ Sat Aug 14, 2021 (pstextractortest@outlook.com)
 |  |  |  |- Sender: Google Calendar, Subject: Invitation: meeting with attachments @ Tue Aug 17, 2021 (pstextractortest@outlook.com)
 |  |  |  |- Sender: Google Calendar, Subject: Accepted: meeting with attachments (jpg, pdf, text) @ Tue Aug 24, 2021 11am - 12pm (MDT) (Pst Extractor)
 |  |  |- Outbox
 |  |  |- Sent Items
 |  |  |  |- Sender: Pst Extractor, Subject: Accepted: meeting from Ed
 |  |  |  |- Sender: Pst Extractor, Subject: meeting with attachments (jpg, pdf, text)
 |  |  |- Archive
 |  |  |- Yammer Root
 |  |  |  |- Inbound
 |  |  |  |- Outbound
 |  |  |  |- Feeds
 |  |  |- Conversation History
 |  |  |  |- Team Chat
 |  |  |- Files
 |  |  |- Conversation Action Settings
 |  |  |- Junk Email
 |  |  |- ExternalContacts
 |  |  |- Journal
 |  |  |- Tasks
 |  |  |- Drafts
 |  |  |- Contacts
 |  |  |  |- Companies
 |  |  |  |- Organizational Contacts
 |  |  |  |- PeopleCentricConversation Buddies
 |  |  |  |- GAL Contacts
 |  |  |  |- {06967759-274D-40B2-A3EB-D7F9E73727D7}
 |  |  |  |- Recipient Cache
 |  |  |  |- {A9E2BC46-B3A0-4243-B315-60D991004455}
 |  |  |- Calendar
 |  |  |  |- United States holidays
 |  |  |  |  |- Sender: Pst Extractor, Subject: Day After Thanksgiving Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Thanksgiving Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Election Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Columbus Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Labor Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Independence Day (Observed)
 |  |  |  |  |- Sender: Pst Extractor, Subject: Father's Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Memorial Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Mother's Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Administrative Professionals Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Tax Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Easter Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Presidents' Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Martin Luther King Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Day After Thanksgiving Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Thanksgiving Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Election Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Columbus Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Labor Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Father's Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Memorial Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Mother's Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Administrative Professionals Day
 |  |  |  |  |- Sender: Pst Extractor, Subject: Easter Day
 |  |  |  |- Birthdays
 |  |  |  |- Sender: pstextractortest@outlook.com, Subject: repeats every monday for 10 weeks
 |  |  |  |- Sender: pstextractortest@outlook.com, Subject: repeats for 3 days
 |  |  |  |- Sender: pstextractortest@outlook.com, Subject: just a regular meeting
 |  |  |  |- Sender: pstextractortest@outlook.com, Subject: Occurs every August 13 effective 8/13/2021 from 10:00 AM to 10:30 AM
 |  |  |  |- Sender: epfromer@gmail.com, Subject: meeting from Ed
 |  |  |  |- Sender: epfromer@gmail.com, Subject: unanswered meeting
 |  |  |  |- Sender: pstextractortest@outlook.com, Subject: all day event for 3 days
 |  |  |  |- Sender: epfromer@gmail.com, Subject: meeting with attachments
 |  |  |  |- Sender: pstextractortest@outlook.com, Subject: meeting with attachments (jpg, pdf, text)
 |  |  |- Notes
 |  |  |- Sync Issues
 |  |  |  |- Conflicts
 |  |  |  |- Local Failures
 |  |  |  |- Server Failures
 |  |  |  |- Sender: Pst Extractor, Subject: Synchronization Log: 
 |  |  |- RSS Feeds
 |  |  |- Quick Step Settings
 |  |- ~MAPISP(Internal)
 |  |- Drizzle
 |  |- Shared Data
 |  |- SPAM Search Folder 2
 |  |- ItemProcSearch
*/

beforeAll(() => {
  pstFile = new PSTFile(
    resolve('./src/__tests__/testdata/pstextractortest@outlook.com.ost')
  )

  // get to Calendar folder
  let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders()
  folder = childFolders[1] // Root - Mailbox
  childFolders = folder.getSubFolders()
  folder = childFolders[4] // IPM_SUBTREE
  childFolders = folder.getSubFolders()
  folder = childFolders[15] // Calendar
})

afterAll(() => {
  pstFile.close()
})

function winToJsDate(dateInt: number): Date {
  return new Date(dateInt * 60 * 1000 - 1.16444736e13) // subtract milliseconds between 1601-01-01 and 1970-01-01
}

describe('RecurrencePattern tests', () => {
  it('should have a Calendar folder', () => {
    expect(folder.displayName).toEqual('Calendar')
  })

  it('should have repeating events', () => {
    // occurs weekly for 10 weeks
    let appt: PSTAppointment = folder.getNextChild()
    expect(appt.messageClass).toEqual('IPM.Appointment')
    expect(appt.subject).toEqual('repeats every monday for 10 weeks')
    expect(appt.startTime).toEqual(new Date('2021-08-09T17:00:00.000Z'))
    expect(appt.endTime).toEqual(new Date('2021-08-09T18:00:00.000Z'))
    expect(appt.recurrencePattern).toEqual('every Monday from 10:00 AM to 11:00 AM')
    expect(appt.duration).toEqual(60)
    let recurrencePattern = new RecurrencePattern(appt.recurrenceStructure)
    expect(recurrencePattern.occurrenceCount).toEqual(10)
    expect(recurrencePattern.patternType).toEqual(PatternType.Week)

    // occurs daily for 3 days
    appt = folder.getNextChild()
    expect(appt.messageClass).toEqual('IPM.Appointment')
    expect(appt.subject).toEqual('repeats for 3 days')
    expect(appt.startTime).toEqual(new Date('2021-08-10T19:00:00.000Z'))
    expect(appt.endTime).toEqual(new Date('2021-08-10T19:30:00.000Z'))
    expect(appt.recurrencePattern).toEqual('every day from 12:00 PM to 12:30 PM')
    expect(appt.duration).toEqual(30)
    recurrencePattern = new RecurrencePattern(appt.recurrenceStructure)
    // console.log(JSON.stringify(recurrencePattern, null, 2));
    expect(recurrencePattern.occurrenceCount).toEqual(3)
    expect(recurrencePattern.patternType).toEqual(PatternType.Day)
  })
})
