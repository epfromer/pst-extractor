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
    public getPostRssChannelLink(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008900, PSTFile.PSETID_PostRss));
    }

    // Item link
    public getPostRssItemLink(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008901, PSTFile.PSETID_PostRss));
    }

    // Item hash Integer 32-bit signed
    public getPostRssItemHash(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008902, PSTFile.PSETID_PostRss));
    }

    // Item GUID
    public getPostRssItemGuid(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008903, PSTFile.PSETID_PostRss));
    }

    // Channel GUID
    public getPostRssChannel(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008904, PSTFile.PSETID_PostRss));
    }

    // Item XML
    public getPostRssItemXml(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008905, PSTFile.PSETID_PostRss));
    }

    // Subscription
    public getPostRssSubscription(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008906, PSTFile.PSETID_PostRss));
    }

    public toString() {
        return "Channel ASCII or Unicode string values: " + this.getPostRssChannelLink() + "\n"
            + "Item link ASCII or Unicode string values: " + this.getPostRssItemLink() + "\n"
            + "Item hash Integer 32-bit signed: " + this.getPostRssItemHash() + "\n"
            + "Item GUID ASCII or Unicode string values: " + this.getPostRssItemGuid() + "\n"
            + "Channel GUID ASCII or Unicode string values: " + this.getPostRssChannel() + "\n"
            + "Item XML ASCII or Unicode string values: " + this.getPostRssItemXml() + "\n"
            + "Subscription ASCII or Unicode string values: " + this.getPostRssSubscription();
    }
}
