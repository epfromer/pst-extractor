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
    public get logType(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008700, PSTFile.PSETID_Log));
    }

    // Start
    public get logStart(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008706, PSTFile.PSETID_Log));
    }

    // Duration
    public get logDuration(): number  {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008707, PSTFile.PSETID_Log));
    }

    // End
    public get logEnd(): Date  {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008708, PSTFile.PSETID_Log));
    }

    // LogFlags
    public get logFlags(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x0000870c, PSTFile.PSETID_Log));
    }

    // DocPrinted
    public get isDocumentPrinted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000870e, PSTFile.PSETID_Log)));
    }

    // DocSaved
    public get isDocumentSaved(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000870f, PSTFile.PSETID_Log)));
    }

    // DocRouted
    public get isDocumentRouted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008710, PSTFile.PSETID_Log)));
    }

    // DocPosted
    public get isDocumentPosted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008711, PSTFile.PSETID_Log)));
    }

    // Type Description
    public get logTypeDesc(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008712, PSTFile.PSETID_Log));
    }

    public toString() {
        return (
            '\n messageClass: ' + this.messageClass + 
            '\n subject: ' + this.subject + 
            '\n importance: ' + this.importance + 
            '\n transportMessageHeaders: ' + this.transportMessageHeaders + 
            '\n logType: ' + this.logType + 
            '\n logStart: ' + this.logStart + 
            '\n logDuration: ' + this.logDuration + 
            '\n logEnd: ' + this.logEnd + 
            '\n logFlags: ' + this.logFlags + 
            '\n isDocumentPrinted: ' + this.isDocumentPrinted + 
            '\n isDocumentSaved: ' + this.isDocumentSaved + 
            '\n isDocumentRouted: ' + this.isDocumentRouted + 
            '\n isDocumentPosted: ' + this.isDocumentPosted + 
            '\n logTypeDesc: ' + this.logTypeDesc 
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
            messageClass: this.messageClass,
            subject: this.subject,
            importance: this.importance,
            transportMessageHeaders: this.transportMessageHeaders,
            logType: this.logType,
            logStart: this.logStart,
            logDuration: this.logDuration,
            logEnd: this.logEnd,
            logFlags: this.logFlags,
            isDocumentPrinted: this.isDocumentPrinted,
            isDocumentSaved: this.isDocumentSaved,
            isDocumentRouted: this.isDocumentRouted,
            isDocumentPosted: this.isDocumentPosted,
            logTypeDesc: this.logTypeDesc 
        }, null, 2);
    }
}
