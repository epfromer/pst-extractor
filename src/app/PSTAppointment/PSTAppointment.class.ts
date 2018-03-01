import { PSTGlobalObjectId } from './../PSTGlobalObjectId/PSTGlobalObjectId.class';
import { PSTFile } from "../PSTFile/PSTFile.class";
import { DescriptorIndexNode } from "../DescriptorIndexNode/DescriptorIndexNode.class";
import { PSTTableBC } from "../PSTTableBC/PSTTableBC.class";
import { PSTDescriptorItem } from "../PSTDescriptorItem/PSTDescriptorItem.class";
import { PSTMessage } from "../PSTMessage/PSTMessage.class";
import { PSTTimeZone } from '../PSTTimeZone/PSTTimeZone.class';

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
    
    public get sendAsICAL(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008200, PSTFile.PSETID_Appointment));
    }

    public get busyStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008205, PSTFile.PSETID_Appointment));
    }

    public get showAsBusy(): boolean {
        return this.busyStatus == 2;
    }

    public get location(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008208, PSTFile.PSETID_Appointment));
    }

    public get startTime(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000820d, PSTFile.PSETID_Appointment));
    }

    public get startTimeZone(): PSTTimeZone {
        return this.getTimeZoneItem(this.pstFile.getNameToIdMapItem(0x0000825e, PSTFile.PSETID_Appointment));
    }

    public get endTime(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000820e, PSTFile.PSETID_Appointment));
    }

    public get endTimeZone(): PSTTimeZone {
        return this.getTimeZoneItem(this.pstFile.getNameToIdMapItem(0x0000825f, PSTFile.PSETID_Appointment));
    }

    public get recurrenceTimeZone(): PSTTimeZone {
        let desc = this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008234, PSTFile.PSETID_Appointment));
        if (desc != null && desc.length != 0) {
            let tzData: Buffer = this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008233, PSTFile.PSETID_Appointment));
            if (tzData != null && tzData.length != 0) {
                return new PSTTimeZone(tzData, desc);
            }
        }
        return null;
    }

    public get duration(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008213, PSTFile.PSETID_Appointment));
    }

    public get color(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008214, PSTFile.PSETID_Appointment));
    }

    public get subType(): boolean {
        return (this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008215, PSTFile.PSETID_Appointment)) != 0);
    }

    public get meetingStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008217, PSTFile.PSETID_Appointment));
    }

    public get responseStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008218, PSTFile.PSETID_Appointment));
    }

    public get isRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008223, PSTFile.PSETID_Appointment));
    }

    public get recurrenceBase(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008228, PSTFile.PSETID_Appointment));
    }

    public get recurrenceType(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008231, PSTFile.PSETID_Appointment));
    }

    public get recurrencePattern(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008232, PSTFile.PSETID_Appointment));
    }

    public get recurrenceStructure(): Buffer {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008216, PSTFile.PSETID_Appointment));
    }

    public get timezone(): Buffer {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008233, PSTFile.PSETID_Appointment));
    }

    public get allAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008238, PSTFile.PSETID_Appointment));
    }

    public get toAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000823b, PSTFile.PSETID_Appointment));
    }

    public get ccAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000823c, PSTFile.PSETID_Appointment));
    }

    public get appointmentSequence(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008201, PSTFile.PSETID_Appointment));
    }

    public get isOnlineMeeting(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008240, PSTFile.PSETID_Appointment)));
    }

    public get netMeetingType(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008241, PSTFile.PSETID_Appointment));
    }

    public get netMeetingServer(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008242, PSTFile.PSETID_Appointment));
    }

    public get netMeetingOrganizerAlias(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008243, PSTFile.PSETID_Appointment));
    }

    public get netMeetingAutostart(): boolean {
        return (this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008245, PSTFile.PSETID_Appointment)) != 0);
    }

    public get conferenceServerAllowExternal(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008246, PSTFile.PSETID_Appointment)));
    }

    public get netMeetingDocumentPathName(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008247, PSTFile.PSETID_Appointment));
    }

    public get netShowURL(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008248, PSTFile.PSETID_Appointment));
    }

    public get attendeeCriticalChange(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00000001, PSTFile.PSETID_Meeting));
    }

    public get ownerCriticalChange(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000001a, PSTFile.PSETID_Meeting));
    }

    public get conferenceServerPassword(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008249, PSTFile.PSETID_Appointment));
    }

    public get appointmentCounterProposal(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008257, PSTFile.PSETID_Appointment)));
    }

    public get isSilent(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00000004, PSTFile.PSETID_Meeting)));
    }

    public get requiredAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00000006, PSTFile.PSETID_Meeting));
    }

    public get localeId(): number {
        return this.getIntItem(0x3ff1);
    }

    public get globalObjectId(): PSTGlobalObjectId {
        return new PSTGlobalObjectId(this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00000003, PSTFile.PSETID_Meeting)));
    }

    public get cleanGlobalObjectId(): PSTGlobalObjectId {
        return new PSTGlobalObjectId(this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00000023, PSTFile.PSETID_Meeting)));
    }

    public toString(): string {
        return (
            '\n messageClass: ' + this.messageClass + 
            '\n subject: ' + this.subject + 
            '\n importance: ' + this.importance + 
            '\n transportMessageHeaders: ' + this.transportMessageHeaders + 
            '\n sendAsICAL: ' + this.sendAsICAL + 
            '\n busyStatus: ' + this.busyStatus + 
            '\n showAsBusy: ' + this.showAsBusy + 
            '\n location: ' + this.location + 
            '\n startTime: ' + this.startTime + 
            '\n endTime: ' + this.endTime + 
            '\n endTimeZone: ' + this.endTimeZone +
            '\n recurrenceTimeZone: ' + this.recurrenceTimeZone +
            '\n duration: ' + this.duration +
            '\n color: ' + this.color +
            '\n subType: ' + this.subType +
            '\n meetingStatus: ' + this.meetingStatus +
            '\n isRecurring: ' + this.isRecurring +
            '\n recurrenceBase: ' + this.recurrenceBase +
            '\n recurrenceType: ' + this.recurrenceType +
            '\n recurrencePattern: ' + this.recurrencePattern +
            '\n recurrenceStructure: ' + this.recurrenceStructure +
            '\n timezone: ' + this.timezone +
            '\n allAttendees: ' + this.allAttendees +
            '\n toAttendees: ' + this.toAttendees +
            '\n ccAttendees: ' + this.ccAttendees +
            '\n appointmentSequence: ' + this.appointmentSequence +
            '\n isOnlineMeeting: ' + this.isOnlineMeeting +
            '\n netMeetingType: ' + this.netMeetingType +
            '\n netMeetingServer: ' + this.netMeetingServer +
            '\n netMeetingOrganizerAlias: ' + this.netMeetingOrganizerAlias +
            '\n netMeetingAutostart: ' + this.netMeetingAutostart +
            '\n conferenceServerAllowExternal: ' + this.conferenceServerAllowExternal +
            '\n netMeetingDocumentPathName: ' + this.netMeetingDocumentPathName +
            '\n attendeeCriticalChange: ' + this.attendeeCriticalChange +
            '\n ownerCriticalChange: ' + this.ownerCriticalChange +
            '\n conferenceServerPassword: ' + this.conferenceServerPassword +
            '\n appointmentCounterProposal: ' + this.appointmentCounterProposal +
            '\n isSilent: ' + this.isSilent +
            '\n requiredAttendees: ' + this.requiredAttendees +
            '\n localeId: ' + this.localeId +
            '\n globalObjectId: ' + this.globalObjectId +
            '\n cleanGlobalObjectId: ' + this.cleanGlobalObjectId
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
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
            endTimeZone: this.endTimeZone,
            recurrenceTimeZone: this.recurrenceTimeZone,
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
            netMeetingAutostart: this.netMeetingAutostart,
            conferenceServerAllowExternal: this.conferenceServerAllowExternal,
            netMeetingDocumentPathName: this.netMeetingDocumentPathName,
            attendeeCriticalChange: this.attendeeCriticalChange,
            ownerCriticalChange: this.ownerCriticalChange,
            conferenceServerPassword: this.conferenceServerPassword,
            appointmentCounterProposal: this.appointmentCounterProposal,
            isSilent: this.isSilent,
            requiredAttendees: this.requiredAttendees,
            localeId: this.localeId,
            globalObjectId: this.globalObjectId,
            cleanGlobalObjectId: this.cleanGlobalObjectId
        }, null, 2);
    }
}
