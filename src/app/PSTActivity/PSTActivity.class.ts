import { PSTFile } from './../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';

// PSTActivity represents Journal entries
export class PSTActivity extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Type
    public getLogType(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008700, PSTFile.PSETID_Log));
    }

    // Start
    public getLogStart(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008706, PSTFile.PSETID_Log));
    }

    // Duration
    public getLogDuration(): number  {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008707, PSTFile.PSETID_Log));
    }

    // End
    public getLogEnd(): Date  {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008708, PSTFile.PSETID_Log));
    }

    // LogFlags
    public getLogFlags(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x0000870c, PSTFile.PSETID_Log));
    }

    // DocPrinted
    public isDocumentPrinted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000870e, PSTFile.PSETID_Log)));
    }

    // DocSaved
    public isDocumentSaved(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000870f, PSTFile.PSETID_Log)));
    }

    // DocRouted
    public isDocumentRouted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008710, PSTFile.PSETID_Log)));
    }

    // DocPosted
    public isDocumentPosted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008711, PSTFile.PSETID_Log)));
    }

    // Type Description
    public getLogTypeDesc(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008712, PSTFile.PSETID_Log));
    }

    public toString() {
        return "Type ASCII or Unicode string: " + this.getLogType() + "\n" + "Start Filetime: " + this.getLogStart()
            + "\n" + "Duration Integer 32-bit signed: " + this.getLogDuration() + "\n" + "End Filetime: "
            + this.getLogEnd() + "\n" + "LogFlags Integer 32-bit signed: " + this.getLogFlags() + "\n"
            + "DocPrinted Boolean: " + this.isDocumentPrinted() + "\n" + "DocSaved Boolean: " + this.isDocumentSaved()
            + "\n" + "DocRouted Boolean: " + this.isDocumentRouted() + "\n" + "DocPosted Boolean: "
            + this.isDocumentPosted() + "\n" + "TypeDescription ASCII or Unicode string: " + this.getLogTypeDesc();

    }

}
