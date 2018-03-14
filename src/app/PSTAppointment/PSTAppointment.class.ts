/**
 * Copyright 2010-2018 Richard Johnson, Orin Eman & Ed Pfromer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This file is part of pst-extractor.
 *
 * pst-extractor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * pst-extractor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with pst-extractor. If not, see <http://www.gnu.org/licenses/>.
 */
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { OutlookProperties } from '../OutlookProperties';

// PSTAppointment is for Calendar items
export class PSTAppointment extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    /**
     * Specifies if a meeting request should be sent as an iCal message.
     * https://msdn.microsoft.com/en-us/library/office/cc839802.aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get sendAsICAL(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidSendMeetingAsIcal, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Represents the user’s availability for an appointment.
     * https://msdn.microsoft.com/en-us/library/office/cc841972.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get busyStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidBusyStatus, OutlookProperties.PSETID_Appointment));
    }

    /**
     * The user is busy.
     * https://msdn.microsoft.com/en-us/library/office/cc841972.aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get showAsBusy(): boolean {
        return this.busyStatus == 2;
    }

    /**
     * Represents the location of an appointment.
     * https://msdn.microsoft.com/en-us/library/office/cc842419.aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get location(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidLocation, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Represents the date and time when an appointment begins.
     * https://msdn.microsoft.com/en-us/library/office/cc839929.aspx
     * @readonly
     * @type {Date}
     * @memberof PSTAppointment
     */
    public get startTime(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentStartWhole, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Represents the date and time that an appointment ends.
     * https://msdn.microsoft.com/en-us/library/office/cc815864.aspx
     * @readonly
     * @type {Date}
     * @memberof PSTAppointment
     */
    public get endTime(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentEndWhole, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Represents the length of time, in minutes, when an appointment is scheduled.
     * https://msdn.microsoft.com/en-us/library/office/cc842287.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get duration(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentDuration, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the color to use when displaying the calendar.
     * https://msdn.microsoft.com/en-us/library/office/cc842274.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get color(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentColor, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies whether or not the event is all day.
     * https://msdn.microsoft.com/en-us/library/office/cc839901.aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get subType(): boolean {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentSubType, OutlookProperties.PSETID_Appointment)) != 0;
    }

    /**
     * Specifies a bit field that describes the state of the object.
     * https://msdn.microsoft.com/en-us/library/office/cc765762.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get meetingStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentStateFlags, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the response status of an attendee.
     * https://msdn.microsoft.com/en-us/library/office/cc839923.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get responseStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidResponseStatus, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies whether an appointment message is recurrent.
     * https://msdn.microsoft.com/en-us/library/office/cc765772.aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get isRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidRecurring, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the date and time within the recurrence pattern that the exception will replace.
     * https://msdn.microsoft.com/en-us/library/office/cc842450.aspx
     * @readonly
     * @type {Date}
     * @memberof PSTAppointment
     */
    public get recurrenceBase(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidExceptionReplaceTime, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the recurrence type of the recurring series.
     * https://msdn.microsoft.com/en-us/library/office/cc842135.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get recurrenceType(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidRecurrenceType, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies a description of the recurrence pattern of the calendar object.
     * https://msdn.microsoft.com/en-us/library/office/cc815733.aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get recurrencePattern(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidRecurrencePattern, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the dates and times when a recurring series occurs by using one of the recurrence patterns and ranges that are specified in [MS-OXOCAL].
     * https://msdn.microsoft.com/en-us/library/office/cc842017.aspx
     * @readonly
     * @type {Buffer}
     * @memberof PSTAppointment
     */
    public get recurrenceStructure(): Buffer {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentRecur, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Contains a stream that maps to the persisted format of a TZREG structure, which describes the time zone to be used for the start and end time of a recurring appointment or meeting request.
     * https://msdn.microsoft.com/en-us/library/office/cc815376.aspx
     * @readonly
     * @type {Buffer}
     * @memberof PSTAppointment
     */
    public get timezone(): Buffer {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTimeZoneStruct, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies a list of all the attendees except for the organizer, including resources and unsendable attendees.
     * https://msdn.microsoft.com/en-us/library/office/cc815418.aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get allAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAllAttendeesString, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Contains a list of all the sendable attendees who are also required attendees.
     * https://msdn.microsoft.com/en-us/library/office/cc842502.aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get toAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidToAttendeesString, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Contains a list of all the sendable attendees who are also optional attendees.
     * https://msdn.microsoft.com/en-us/library/office/cc839636.aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get ccAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidCcAttendeesString, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the sequence number of a Meeting object.
     * https://msdn.microsoft.com/en-us/library/office/cc765937.aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get appointmentSequence(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentSequence, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Is a hosted meeting?
     * https://msdn.microsoft.com/en-us/library/ee200872(v=exchg.80).aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get isOnlineMeeting(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidConferencingCheck, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the type of the meeting. 
     * https://msdn.microsoft.com/en-us/library/ee158396(v=exchg.80).aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get netMeetingType(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidConferencingType, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the directory server to be used.
     * https://msdn.microsoft.com/en-us/library/ee201516(v=exchg.80).aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get netMeetingServer(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidDirectory, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the email address of the organizer.
     * https://msdn.microsoft.com/en-us/library/ee203317(v=exchg.80).aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get netMeetingOrganizerAlias(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidOrganizerAlias, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the document to be launched when the user joins the meeting.
     * https://msdn.microsoft.com/en-us/library/ee204395(v=exchg.80).aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get netMeetingDocumentPathName(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidCollaborateDoc, OutlookProperties.PSETID_Appointment));
    }

    /**
     * The PidLidNetShowUrl property ([MS-OXPROPS] section 2.175) specifies the URL to be launched when the user joins the meeting
     * https://msdn.microsoft.com/en-us/library/ee179451(v=exchg.80).aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get netShowURL(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidNetShowUrl, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Specifies the date and time at which the meeting-related object was sent.
     * https://msdn.microsoft.com/en-us/library/ee237112(v=exchg.80).aspx
     * @readonly
     * @type {Date}
     * @memberof PSTAppointment
     */
    public get attendeeCriticalChange(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAttendeeCriticalChange, OutlookProperties.PSETID_Meeting));
    }

    /**
     * Indicates that this meeting response is a counter proposal.
     * https://msdn.microsoft.com/en-us/magazine/cc815846.aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get appointmentCounterProposal(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidAppointmentCounterProposal, OutlookProperties.PSETID_Appointment));
    }

    /**
     * Indicates whether the user did not include any text in the body of the Meeting Response object.
     * https://msdn.microsoft.com/en-us/library/ee159822(v=exchg.80).aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTAppointment
     */
    public get isSilent(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidIsSilent, OutlookProperties.PSETID_Meeting));
    }

    /**
     * Identifies required attendees for the appointment or meeting.
     * https://msdn.microsoft.com/en-us/library/ee160700(v=exchg.80).aspx
     * @readonly
     * @type {string}
     * @memberof PSTAppointment
     */
    public get requiredAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidRequiredAttendees, OutlookProperties.PSETID_Meeting));
    }

    /**
     * Contains the Windows Locale ID of the end-user who created this message.
     * https://msdn.microsoft.com/en-us/library/ee201602(v=exchg.80).aspx
     * @readonly
     * @type {number}
     * @memberof PSTAppointment
     */
    public get localeId(): number {
        return this.getIntItem(OutlookProperties.PidTagMessageLocaleId);
    }

    /**
     * JSON stringify the object properties.  Large fields (like body) aren't included.
     * @returns {string} 
     * @memberof PSTAppointment
     */
    public toJSON(): string {
        return (
            'PSTAppointment: ' +
            JSON.stringify(
                {
                    messageClass: this.messageClass,
                    subject: this.subject,
                    importance: this.importance,
                    transportMessageHeaders: this.transportMessageHeaders,
                    sendAsICAL: this.sendAsICAL,
                    busyStatus: this.busyStatus,
                    showAsBusy: this.showAsBusy,
                    location: this.location,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    duration: this.duration,
                    color: this.color,
                    subType: this.subType,
                    meetingStatus: this.meetingStatus,
                    isRecurring: this.isRecurring,
                    recurrenceBase: this.recurrenceBase,
                    recurrenceType: this.recurrenceType,
                    recurrencePattern: this.recurrencePattern,
                    recurrenceStructure: this.recurrenceStructure,
                    timezone: this.timezone,
                    allAttendees: this.allAttendees,
                    toAttendees: this.toAttendees,
                    ccAttendees: this.ccAttendees,
                    appointmentSequence: this.appointmentSequence,
                    isOnlineMeeting: this.isOnlineMeeting,
                    netMeetingType: this.netMeetingType,
                    netMeetingServer: this.netMeetingServer,
                    netMeetingOrganizerAlias: this.netMeetingOrganizerAlias,
                    netMeetingDocumentPathName: this.netMeetingDocumentPathName,
                    attendeeCriticalChange: this.attendeeCriticalChange,
                    appointmentCounterProposal: this.appointmentCounterProposal,
                    isSilent: this.isSilent,
                    requiredAttendees: this.requiredAttendees,
                    localeId: this.localeId,
                },
                null,
                2
            ) +
            '\n' +
            super.toJSON()
        );
    }
}
