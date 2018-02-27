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
    public getTaskStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008101, PSTFile.PSETID_Task));
    }

    // Percent Complete Floating point double precision (64-bit)
    public getPercentComplete(): number {
        return this.getDoubleItem(this.pstFile.getNameToIdMapItem(0x00008102, PSTFile.PSETID_Task));
    }

    // Is team task Boolean
    public isTeamTask(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008103, PSTFile.PSETID_Task));
    }

    // Date completed Filetime
    public getTaskDateCompleted(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000810f, PSTFile.PSETID_Task));
    }

    // Actual effort in minutes Integer 32-bit signed
    public getTaskActualEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008110, PSTFile.PSETID_Task));
    }

    // Total effort in minutes Integer 32-bit signed
    public getTaskEstimatedEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008111, PSTFile.PSETID_Task));
    }

    // Task version Integer 32-bit signed FTK: Access count
    public getTaskVersion(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008112, PSTFile.PSETID_Task));
    }

    // Complete Boolean
    public isTaskComplete(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000811c, PSTFile.PSETID_Task));
    }

    // Owner ASCII or Unicode string
    public getTaskOwner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000811f, PSTFile.PSETID_Task));
    }

    // Delegator ASCII or Unicode string
    public getTaskAssigner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008121, PSTFile.PSETID_Task));
    }

    // Unknown ASCII or Unicode string
    public getTaskLastUser(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008122, PSTFile.PSETID_Task));
    }

    // Ordinal Integer 32-bit signed
    public getTaskOrdinal(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008123, PSTFile.PSETID_Task));
    }

    // Is recurring Boolean
    public isTaskFRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008126, PSTFile.PSETID_Task));
    }

    // Role ASCII or Unicode string
    public getTaskRole(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008127, PSTFile.PSETID_Task));
    }

    // Ownership Integer 32-bit signed
    public getTaskOwnership(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008129, PSTFile.PSETID_Task));
    }

    // Delegation State
    public getAcceptanceState(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x0000812a, PSTFile.PSETID_Task));
    }

    public toString() {
        return "Status Integer 32-bit signed 0x0 => Not started [TODO]: " + this.getTaskStatus() + "\n"
            + "Percent Complete Floating point double precision (64-bit): " + this.getPercentComplete() + "\n"
            + "Is team task Boolean: " + this.isTeamTask() + "\n" + "Start date Filetime: " + this.getTaskStartDate()
            + "\n" + "Due date Filetime: " + this.getTaskDueDate() + "\n" + "Date completed Filetime: "
            + this.getTaskDateCompleted() + "\n" + "Actual effort in minutes Integer 32-bit signed: "
            + this.getTaskActualEffort() + "\n" + "Total effort in minutes Integer 32-bit signed: "
            + this.getTaskEstimatedEffort() + "\n" + "Task version Integer 32-bit signed FTK: Access count: "
            + this.getTaskVersion() + "\n" + "Complete Boolean: " + this.isTaskComplete() + "\n"
            + "Owner ASCII or Unicode string: " + this.getTaskOwner() + "\n" + "Delegator ASCII or Unicode string: "
            + this.getTaskAssigner() + "\n" + "Unknown ASCII or Unicode string: " + this.getTaskLastUser() + "\n"
            + "Ordinal Integer 32-bit signed: " + this.getTaskOrdinal() + "\n" + "Is recurring Boolean: "
            + this.isTaskFRecurring() + "\n" + "Role ASCII or Unicode string: " + this.getTaskRole() + "\n"
            + "Ownership Integer 32-bit signed: " + this.getTaskOwnership() + "\n" + "Delegation State: "
            + this.getAcceptanceState();

    }
}
