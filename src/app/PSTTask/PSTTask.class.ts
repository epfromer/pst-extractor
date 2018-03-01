import { PSTFile } from './../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';

export class PSTTask extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Status Integer 32-bit signed 0x0 => Not started
    public get taskStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008101, PSTFile.PSETID_Task));
    }

    // Percent Complete Floating point double precision (64-bit)
    public get percentComplete(): number {
        return this.getDoubleItem(this.pstFile.getNameToIdMapItem(0x00008102, PSTFile.PSETID_Task));
    }

    // Is team task Boolean
    public get isTeamTask(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008103, PSTFile.PSETID_Task));
    }

    // Date completed Filetime
    public get taskDateCompleted(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000810f, PSTFile.PSETID_Task));
    }

    // Actual effort in minutes Integer 32-bit signed
    public get taskActualEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008110, PSTFile.PSETID_Task));
    }

    // Total effort in minutes Integer 32-bit signed
    public get taskEstimatedEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008111, PSTFile.PSETID_Task));
    }

    // Task version Integer 32-bit signed FTK: Access count
    public get taskVersion(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008112, PSTFile.PSETID_Task));
    }

    // Complete Boolean
    public get isTaskComplete(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000811c, PSTFile.PSETID_Task));
    }

    // Owner ASCII or Unicode string
    public get taskOwner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000811f, PSTFile.PSETID_Task));
    }

    // Delegator ASCII or Unicode string
    public get taskAssigner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008121, PSTFile.PSETID_Task));
    }

    // Unknown ASCII or Unicode string
    public get taskLastUser(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008122, PSTFile.PSETID_Task));
    }

    // Ordinal Integer 32-bit signed
    public get taskOrdinal(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008123, PSTFile.PSETID_Task));
    }

    // Is recurring Boolean
    public get isTaskRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008126, PSTFile.PSETID_Task));
    }

    // Role ASCII or Unicode string
    public get taskRole(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008127, PSTFile.PSETID_Task));
    }

    // Ownership Integer 32-bit signed
    public get taskOwnership(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008129, PSTFile.PSETID_Task));
    }

    // Delegation State
    public get acceptanceState(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x0000812a, PSTFile.PSETID_Task));
    }

    public toString() {
        return (
            '\n messageClass: ' + this.messageClass + 
            '\n subject: ' + this.subject + 
            '\n importance: ' + this.importance + 
            '\n transportMessageHeaders: ' + this.transportMessageHeaders + 
            '\n taskStatus: ' + this.taskStatus + 
            '\n percentComplete: ' + this.percentComplete + 
            '\n isTeamTask: ' + this.isTeamTask + 
            '\n taskDateCompleted: ' + this.taskDateCompleted + 
            '\n taskActualEffort: ' + this.taskActualEffort + 
            '\n taskEstimatedEffort: ' + this.taskEstimatedEffort + 
            '\n taskVersion: ' + this.taskVersion + 
            '\n isTaskComplete: ' + this.isTaskComplete + 
            '\n taskOwner: ' + this.taskOwner + 
            '\n taskAssigner: ' + this.taskAssigner + 
            '\n taskLastUser: ' + this.taskLastUser + 
            '\n taskOrdinal: ' + this.taskOrdinal + 
            '\n isTaskRecurring: ' + this.isTaskRecurring + 
            '\n taskRole: ' + this.taskRole + 
            '\n taskOwnership: ' + this.taskOwnership + 
            '\n acceptanceState: ' + this.acceptanceState 
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
            messageClass: this.messageClass,
            subject: this.subject, 
            importance: this.importance, 
            transportMessageHeaders: this.transportMessageHeaders, 
            taskStatus: this.taskStatus,
            percentComplete: this.percentComplete,
            isTeamTask: this.isTeamTask,
            taskDateCompleted: this.taskDateCompleted,
            taskActualEffort: this.taskActualEffort,
            taskEstimatedEffort: this.taskEstimatedEffort,
            taskVersion: this.taskVersion,
            isTaskComplete: this.isTaskComplete,
            taskOwner: this.taskOwner,
            taskAssigner: this.taskAssigner,
            taskLastUser: this.taskLastUser,
            taskOrdinal: this.taskOrdinal,
            isTaskRecurring: this.isTaskRecurring,
            taskRole: this.taskRole,
            taskOwnership: this.taskOwnership,
            acceptanceState: this.acceptanceState 
        }, null, 2);
    }
}
