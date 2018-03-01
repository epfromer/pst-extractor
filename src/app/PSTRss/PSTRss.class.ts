import { PSTFile } from "../PSTFile/PSTFile.class";
import { DescriptorIndexNode } from "../DescriptorIndexNode/DescriptorIndexNode.class";
import { PSTTableBC } from "../PSTTableBC/PSTTableBC.class";
import { PSTDescriptorItem } from "../PSTDescriptorItem/PSTDescriptorItem.class";
import { PSTMessage } from "../PSTMessage/PSTMessage.class";

// Object that represents a RSS item
export class PSTRss extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Channel
    public get postRssChannelLink(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008900, PSTFile.PSETID_PostRss));
    }

    // Item link
    public get postRssItemLink(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008901, PSTFile.PSETID_PostRss));
    }

    // Item hash Integer 32-bit signed
    public get postRssItemHash(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008902, PSTFile.PSETID_PostRss));
    }

    // Item GUID
    public get postRssItemGuid(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008903, PSTFile.PSETID_PostRss));
    }

    // Channel GUID
    public get postRssChannel(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008904, PSTFile.PSETID_PostRss));
    }

    // Item XML
    public get postRssItemXml(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008905, PSTFile.PSETID_PostRss));
    }

    // Subscription
    public get postRssSubscription(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008906, PSTFile.PSETID_PostRss));
    }

    public toString() {
        return (
            '\n messageClass: ' + this.messageClass + 
            '\n subject: ' + this.subject + 
            '\n importance: ' + this.importance + 
            '\n transportMessageHeaders: ' + this.transportMessageHeaders + 
            '\n postRssChannelLink: ' + this.postRssChannelLink + 
            '\n postRssItemLink: ' + this.postRssItemLink + 
            '\n postRssItemHash: ' + this.postRssItemHash + 
            '\n postRssItemGuid: ' + this.postRssItemGuid + 
            '\n postRssChannel: ' + this.postRssChannel + 
            '\n postRssItemXml: ' + this.postRssItemXml + 
            '\n postRssSubscription: ' + this.postRssSubscription
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
            messageClass: this.messageClass,
            subject: this.subject, 
            importance: this.importance, 
            transportMessageHeaders: this.transportMessageHeaders, 
            postRssChannelLink: this.postRssChannelLink,
            postRssItemLink: this.postRssItemLink,
            postRssItemHash: this.postRssItemHash,
            postRssItemGuid: this.postRssItemGuid,
            postRssChannel: this.postRssChannel,
            postRssItemXml: this.postRssItemXml,
            postRssSubscription: this.postRssSubscription
        }, null, 2);
    }
}
