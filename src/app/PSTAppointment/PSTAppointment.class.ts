// PSTAppointment is for Calendar items
export class PSTAppointment extends PSTMessage {

    PSTAppointment(final PSTFile theFile, final DescriptorIndexNode descriptorIndexNode)
        throws PSTException, IOException {
        super(theFile, descriptorIndexNode);
    }

    PSTAppointment(final PSTFile theFile, final DescriptorIndexNode folderIndexNode, final PSTTableBC table,
        final HashMap<Integer, PSTDescriptorItem> localDescriptorItems) {
        super(theFile, folderIndexNode, table, localDescriptorItems);
    }

    public boolean getSendAsICAL() {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008200, PSTFile.PSETID_Appointment)));
    }

    public int getBusyStatus() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008205, PSTFile.PSETID_Appointment));
    }

    public boolean getShowAsBusy() {
        return this.getBusyStatus() == 2;
    }

    public String getLocation() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008208, PSTFile.PSETID_Appointment));
    }

    public Date getStartTime() {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000820d, PSTFile.PSETID_Appointment));
    }

    public PSTTimeZone getStartTimeZone() {
        return this.getTimeZoneItem(this.pstFile.getNameToIdMapItem(0x0000825e, PSTFile.PSETID_Appointment));
    }

    public Date getEndTime() {
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

    public int getDuration() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008213, PSTFile.PSETID_Appointment));
    }

    public int getColor() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008214, PSTFile.PSETID_Appointment));
    }

    public boolean getSubType() {
        return (this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008215, PSTFile.PSETID_Appointment)) != 0);
    }

    public int getMeetingStatus() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008217, PSTFile.PSETID_Appointment));
    }

    public int getResponseStatus() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008218, PSTFile.PSETID_Appointment));
    }

    public boolean isRecurring() {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008223, PSTFile.PSETID_Appointment));
    }

    public Date getRecurrenceBase() {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008228, PSTFile.PSETID_Appointment));
    }

    public int getRecurrenceType() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008231, PSTFile.PSETID_Appointment));
    }

    public String getRecurrencePattern() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008232, PSTFile.PSETID_Appointment));
    }

    public byte[] getRecurrenceStructure() {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008216, PSTFile.PSETID_Appointment));
    }

    public byte[] getTimezone() {
        return this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00008233, PSTFile.PSETID_Appointment));
    }

    public String getAllAttendees() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008238, PSTFile.PSETID_Appointment));
    }

    public String getToAttendees() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000823b, PSTFile.PSETID_Appointment));
    }

    public String getCCAttendees() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000823c, PSTFile.PSETID_Appointment));
    }

    public int getAppointmentSequence() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008201, PSTFile.PSETID_Appointment));
    }

    // online meeting properties
    public boolean isOnlineMeeting() {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008240, PSTFile.PSETID_Appointment)));
    }

    public int getNetMeetingType() {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008241, PSTFile.PSETID_Appointment));
    }

    public String getNetMeetingServer() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008242, PSTFile.PSETID_Appointment));
    }

    public String getNetMeetingOrganizerAlias() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008243, PSTFile.PSETID_Appointment));
    }

    public boolean getNetMeetingAutostart() {
        return (this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008245, PSTFile.PSETID_Appointment)) != 0);
    }

    public boolean getConferenceServerAllowExternal() {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008246, PSTFile.PSETID_Appointment)));
    }

    public String getNetMeetingDocumentPathName() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008247, PSTFile.PSETID_Appointment));
    }

    public String getNetShowURL() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008248, PSTFile.PSETID_Appointment));
    }

    public Date getAttendeeCriticalChange() {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00000001, PSTFile.PSETID_Meeting));
    }

    public Date getOwnerCriticalChange() {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000001a, PSTFile.PSETID_Meeting));
    }

    public String getConferenceServerPassword() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008249, PSTFile.PSETID_Appointment));
    }

    public boolean getAppointmentCounterProposal() {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008257, PSTFile.PSETID_Appointment)));
    }

    public boolean isSilent() {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00000004, PSTFile.PSETID_Meeting)));
    }

    public String getRequiredAttendees() {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00000006, PSTFile.PSETID_Meeting));
    }

    public int getLocaleId() {
        return this.getIntItem(0x3ff1);
    }

    public PSTGlobalObjectId getGlobalObjectId() {
        return new PSTGlobalObjectId(
            this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00000003, PSTFile.PSETID_Meeting)));
    }

    public PSTGlobalObjectId getCleanGlobalObjectId() {
        return new PSTGlobalObjectId(
            this.getBinaryItem(this.pstFile.getNameToIdMapItem(0x00000023, PSTFile.PSETID_Meeting)));
    }
}
