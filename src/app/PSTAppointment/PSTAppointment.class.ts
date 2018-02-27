import { PSTGlobalObjectId } from './../PSTGlobalObjectId/PSTGlobalObjectId.class';
import { PSTFile } from "../PSTFile/PSTFile.class";
import { DescriptorIndexNode } from "../DescriptorIndexNode/DescriptorIndexNode.class";
import { PSTTableBC } from "../PSTTableBC/PSTTableBC.class";
import { PSTDescriptorItem } from "../PSTDescriptorItem/PSTDescriptorItem.class";
import { PSTMessage } from "../PSTMessage/PSTMessage.class";

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
    
    public getSendAsICAL(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008200, PSTFile.PSETID_Appointment)));
    }

    public getBusyStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008205, PSTFile.PSETID_Appointment));
    }

    public getShowAsBusy(): boolean {
        return this.getBusyStatus() == 2;
    }

    public getLocation(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008208, PSTFile.PSETID_Appointment));
    }

    public getStartTime(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000820d, PSTFile.PSETID_Appointment));
    }

    public PSTTimeZone getStartTimeZone() {
        return this.getTimeZoneItem(this.pstFile.getNameToIdMapItem(0x0000825e, PSTFile.PSETID_Appointment));
    }

    public getEndTime(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000820e, PSTFile.PSETID_Appointment));
    }

    public PSTTimeZone getEndTimeZone() {
        return this.getTimeZoneItem(this.pstFile.getNameToIdMapItem(0x0000825f, PSTFile.PSETID_Appointment));
    }

    public PSTTimeZone getRecurrenceTimeZone() {
        final String desc = this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008234, PSTFile.PSETID_Appointment));
        if (desc != null && desc.length() != 0) {
            final byte[] tzData = this
                .getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008233, PSTFile.PSETID_Appointment));
            if (tzData != null && tzData.length != 0) {
                return new PSTTimeZone(desc, tzData);
            }
        }
        return null;
    }

    public getDuration(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008213, PSTFile.PSETID_Appointment));
    }

    public getColor(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008214, PSTFile.PSETID_Appointment));
    }

    public getSubType(): boolean {
        return (this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008215, PSTFile.PSETID_Appointment)) != 0);
    }

    public getMeetingStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008217, PSTFile.PSETID_Appointment));
    }

    public getResponseStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008218, PSTFile.PSETID_Appointment));
    }

    public isRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008223, PSTFile.PSETID_Appointment));
    }

    public getRecurrenceBase(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008228, PSTFile.PSETID_Appointment));
    }

    public getRecurrenceType(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008231, PSTFile.PSETID_Appointment));
    }

    public getRecurrencePattern(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008232, PSTFile.PSETID_Appointment));
    }

    public getRecurrenceStructure(): Buffer {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008216, PSTFile.PSETID_Appointment));
    }

    public getTimezone(): Buffer {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008233, PSTFile.PSETID_Appointment));
    }

    public getAllAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008238, PSTFile.PSETID_Appointment));
    }

    public getToAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000823b, PSTFile.PSETID_Appointment));
    }

    public getCCAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000823c, PSTFile.PSETID_Appointment));
    }

    public getAppointmentSequence(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008201, PSTFile.PSETID_Appointment));
    }

    // online meeting properties
    public isOnlineMeeting(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008240, PSTFile.PSETID_Appointment)));
    }

    public getNetMeetingType(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008241, PSTFile.PSETID_Appointment));
    }

    public getNetMeetingServer(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008242, PSTFile.PSETID_Appointment));
    }

    public getNetMeetingOrganizerAlias(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008243, PSTFile.PSETID_Appointment));
    }

    public getNetMeetingAutostart(): boolean {
        return (this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008245, PSTFile.PSETID_Appointment)) != 0);
    }

    public getConferenceServerAllowExternal(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008246, PSTFile.PSETID_Appointment)));
    }

    public getNetMeetingDocumentPathName(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008247, PSTFile.PSETID_Appointment));
    }

    public getNetShowURL(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008248, PSTFile.PSETID_Appointment));
    }

    public getAttendeeCriticalChange(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00000001, PSTFile.PSETID_Meeting));
    }

    public getOwnerCriticalChange(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000001a, PSTFile.PSETID_Meeting));
    }

    public getConferenceServerPassword(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008249, PSTFile.PSETID_Appointment));
    }

    public getAppointmentCounterProposal(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008257, PSTFile.PSETID_Appointment)));
    }

    public isSilent(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00000004, PSTFile.PSETID_Meeting)));
    }

    public getRequiredAttendees(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00000006, PSTFile.PSETID_Meeting));
    }

    public getLocaleId(): number {
        return this.getIntItem(0x3ff1);
    }

    public getGlobalObjectId(): PSTGlobalObjectId {
        return new PSTGlobalObjectId(this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00000003, PSTFile.PSETID_Meeting)));
    }

    public getCleanGlobalObjectId(): PSTGlobalObjectId {
        return new PSTGlobalObjectId(this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00000023, PSTFile.PSETID_Meeting)));
    }
}
