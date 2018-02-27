import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';

export class PSTContact extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Contact's Account name
    public getAccount(): string {
        return this.getStringItem(0x3a00);
    }

    // Callback telephone number
    public getCallbackTelephoneNumber(): string {
        return this.getStringItem(0x3a02);
    }

    // Contact's generational abbreviation FTK: Name suffix
    public getGeneration(): string {
        return this.getStringItem(0x3a05);
    }

    // Contacts given name
    public getGivenName(): string {
        return this.getStringItem(0x3a06);
    }

    // Contacts Government ID Number
    public getGovernmentIdNumber(): string {
        return this.getStringItem(0x3a07);
    }

    // Business/Office Telephone Number
    public getBusinessTelephoneNumber(): string {
        return this.getStringItem(0x3a08);
    }

    // Home Telephone Number
    public getHomeTelephoneNumber(): string {
        return this.getStringItem(0x3a09);
    }

    // Contacts initials
    public getInitials(): string {
        return this.getStringItem(0x3a0a);
    }

    // Keyword
    public getKeyword(): string {
        return this.getStringItem(0x3a0b);
    }

    // Contact's language
    public getLanguage(): string {
        return this.getStringItem(0x3a0c);
    }

    // Contact's location
    public getLocation(): string {
        return this.getStringItem(0x3a0d);
    }

    // MHS Common Name
    public getMhsCommonName(): string {
        return this.getStringItem(0x3a0f);
    }

    // Organizational identification number
    public getOrganizationalIdNumber(): string {
        return this.getStringItem(0x3a10);
    }

    // Contact's surname FTK: Last name
    public getSurname(): string {
        return this.getStringItem(0x3a11);
    }

    // Original display name
    public getOriginalDisplayName(): string {
        return this.getStringItem(0x3a13);
    }

    // Default Postal Address
    public getPostalAddress(): string {
        return this.getStringItem(0x3a15);
    }

    // Contact's company name
    public getCompanyName(): string {
        return this.getStringItem(0x3a16);
    }

    // Contact's job title FTK: Profession
    public getTitle(): string {
        return this.getStringItem(0x3a17);
    }

    // Contact's department name Used in contact item
    public getDepartmentName(): string {
        return this.getStringItem(0x3a18);
    }

    // Contact's office location
    public getOfficeLocation(): string {
        return this.getStringItem(0x3a19);
    }

    // Primary Telephone
    public getPrimaryTelephoneNumber(): string {
        return this.getStringItem(0x3a1a);
    }

    // Contact's secondary office (business) phone number
    public getBusiness2TelephoneNumber(): string {
        return this.getStringItem(0x3a1b);
    }

    // Mobile Phone Number
    public getMobileTelephoneNumber(): string {
        return this.getStringItem(0x3a1c);
    }

    // Radio Phone Number
    public getRadioTelephoneNumber(): string {
        return this.getStringItem(0x3a1d);
    }

    // Car Phone Number
    public getCarTelephoneNumber(): string {
        return this.getStringItem(0x3a1e);
    }

    // Other Phone Number
    public getOtherTelephoneNumber(): string {
        return this.getStringItem(0x3a1f);
    }

    // Transmittable display name
    public getTransmittableDisplayName(): string {
        return this.getStringItem(0x3a20);
    }

    // Pager Phone Number
    public getPagerTelephoneNumber(): string {
        return this.getStringItem(0x3a21);
    }

    // Primary Fax Number
    public getPrimaryFaxNumber(): string {
        return this.getStringItem(0x3a23);
    }

    // Contact's office (business) fax number
    public getBusinessFaxNumber(): string {
        return this.getStringItem(0x3a24);
    }

    // Contact's home fax number
    public getHomeFaxNumber(): string {
        return this.getStringItem(0x3a25);
    }

    // Business Address Country
    public getBusinessAddressCountry(): string {
        return this.getStringItem(0x3a26);
    }

    // Business Address City
    public getBusinessAddressCity(): string {
        return this.getStringItem(0x3a27);
    }

    // Business Address State
    public getBusinessAddressStateOrProvince(): string {
        return this.getStringItem(0x3a28);
    }

    // Business Address Street
    public getBusinessAddressStreet(): string {
        return this.getStringItem(0x3a29);
    }

    // Business Postal Code
    public getBusinessPostalCode(): string {
        return this.getStringItem(0x3a2a);
    }

    // Business PO Box
    public getBusinessPoBox(): string {
        return this.getStringItem(0x3a2b);
    }

    // Telex Number
    public getTelexNumber(): string {
        return this.getStringItem(0x3a2c);
    }

    // ISDN Number
    public getIsdnNumber(): string {
        return this.getStringItem(0x3a2d);
    }

    // Assistant Phone Number
    public getAssistantTelephoneNumber(): string {
        return this.getStringItem(0x3a2e);
    }

    // Home Phone 2
    public getHome2TelephoneNumber(): string {
        return this.getStringItem(0x3a2f);
    }

    // Assistant�s Name
    public getAssistant(): string {
        return this.getStringItem(0x3a30);
    }

    // Hobbies
    public getHobbies(): string {
        return this.getStringItem(0x3a43);
    }

    // Middle Name
    public getMiddleName(): string {
        return this.getStringItem(0x3a44);
    }

    // Display Name Prefix (Contact Title)
    public getDisplayNamePrefix(): string {
        return this.getStringItem(0x3a45);
    }

    // Profession
    public getProfession(): string {
        return this.getStringItem(0x3a46);
    }

    // Preferred By Name
    public getPreferredByName(): string {
        return this.getStringItem(0x3a47);
    }

    // Spouse�s Name
    public getSpouseName(): string {
        return this.getStringItem(0x3a48);
    }

    // Computer Network Name
    public getComputerNetworkName(): string {
        return this.getStringItem(0x3a49);
    }

    // Customer ID
    public getCustomerId(): string {
        return this.getStringItem(0x3a4a);
    }

    // TTY/TDD Phone
    public getTtytddPhoneNumber(): string {
        return this.getStringItem(0x3a4b);
    }

    // Ftp Site
    public getFtpSite(): string {
        return this.getStringItem(0x3a4c);
    }

    // Manager�s Name
    public getManagerName(): string {
        return this.getStringItem(0x3a4e);
    }

    // Nickname
    public getNickname(): string {
        return this.getStringItem(0x3a4f);
    }

    // Personal Home Page
    public getPersonalHomePage(): string {
        return this.getStringItem(0x3a50);
    }

    // Business Home Page
    public getBusinessHomePage(): string {
        return this.getStringItem(0x3a51);
    }

    // Note
    public getNote(): string {
        return this.getStringItem(0x6619);
    }

    getNamedStringItem(key: number): string {
        let id = this.pstFile.getNameToIdMapItem(key, PSTFile.PSETID_Address);
        if (id != -1) {
            return this.getStringItem(id);
        }
        return '';
    }

    public getSMTPAddress(): string {
        return this.getNamedStringItem(0x00008084);
    }

    // Company Main Phone
    public getCompanyMainPhoneNumber(): string {
        return this.getStringItem(0x3a57);
    }

    // Children's names
    public getChildrensNames(): string {
        return this.getStringItem(0x3a58);
    }

    // Home Address City
    public getHomeAddressCity(): string {
        return this.getStringItem(0x3a59);
    }

    // Home Address Country
    public getHomeAddressCountry(): string {
        return this.getStringItem(0x3a5a);
    }

    // Home Address Postal Code
    public getHomeAddressPostalCode(): string {
        return this.getStringItem(0x3a5b);
    }

    // Home Address State or Province
    public getHomeAddressStateOrProvince(): string {
        return this.getStringItem(0x3a5c);
    }

    // Home Address Street
    public getHomeAddressStreet(): string {
        return this.getStringItem(0x3a5d);
    }

    // Home Address Post Office Box
    public getHomeAddressPostOfficeBox(): string {
        return this.getStringItem(0x3a5e);
    }

    // Other Address City
    public getOtherAddressCity(): string {
        return this.getStringItem(0x3a5f);
    }

    // Other Address Country
    public getOtherAddressCountry(): string {
        return this.getStringItem(0x3a60);
    }

    // Other Address Postal Code
    public getOtherAddressPostalCode(): string {
        return this.getStringItem(0x3a61);
    }

    // Other Address State
    public getOtherAddressStateOrProvince(): string {
        return this.getStringItem(0x3a62);
    }

    // Other Address Street
    public getOtherAddressStreet(): string {
        return this.getStringItem(0x3a63);
    }

    // Other Address Post Office box
    public getOtherAddressPostOfficeBox(): string {
        return this.getStringItem(0x3a64);
    }

    ///////////////////////////////////////////////////
    // Below are the values from the name to id map...
    ///////////////////////////////////////////////////

    // File under FTK: File as
    public getFileUnder(): string {
        return this.getNamedStringItem(0x00008005);
    }

    // Home Address
    public getHomeAddress(): string {
        return this.getNamedStringItem(0x0000801a);
    }

    // Business Address
    public getWorkAddress(): string {
        return this.getNamedStringItem(0x0000801b);
    }

    // Other Address
    public getOtherAddress(): string {
        return this.getNamedStringItem(0x0000801c);
    }

    // Selected Mailing Address
    public getPostalAddressId(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008022, PSTFile.PSETID_Address));
    }

    // Webpage
    public getHtml(): string {
        return this.getNamedStringItem(0x0000802b);
    }

    // Business Address City
    public getWorkAddressStreet(): string {
        return this.getNamedStringItem(0x00008045);
    }

    // Business Address Street
    public getWorkAddressCity(): string {
        return this.getNamedStringItem(0x00008046);
    }

    // Business Address State
    public getWorkAddressState(): string {
        return this.getNamedStringItem(0x00008047);
    }

    // Business Address Postal Code
    public getWorkAddressPostalCode(): string {
        return this.getNamedStringItem(0x00008048);
    }

    // Business Address Country
    public getWorkAddressCountry(): string {
        return this.getNamedStringItem(0x00008049);
    }

    // Business Address Country
    public getWorkAddressPostOfficeBox(): string {
        return this.getNamedStringItem(0x0000804a);
    }

    // IM Address
    public getInstantMessagingAddress(): string {
        return this.getNamedStringItem(0x00008062);
    }

    // E-mail1 Display Name
    public getEmail1DisplayName(): string {
        return this.getNamedStringItem(0x00008080);
    }

    // E-mail1 Address Type
    public getEmail1AddressType(): string {
        return this.getNamedStringItem(0x00008082);
    }

    // E-mail1 Address
    public getEmail1EmailAddress(): string {
        return this.getNamedStringItem(0x00008083);
    }

    // E-mail1 Display Name
    public getEmail1OriginalDisplayName(): string {
        return this.getNamedStringItem(0x00008084);
    }

    // E-mail1 type
    public getEmail1EmailType(): string {
        return this.getNamedStringItem(0x00008087);
    }

    // E-mail2 display name
    public getEmail2DisplayName(): string {
        return this.getNamedStringItem(0x00008090);
    }

    // E-mail2 address type
    public getEmail2AddressType(): string {
        return this.getNamedStringItem(0x00008092);
    }

    // E-mail2 e-mail address
    public getEmail2EmailAddress(): string {
        return this.getNamedStringItem(0x00008093);
    }

    // E-mail2 original display name
    public getEmail2OriginalDisplayName(): string {
        return this.getNamedStringItem(0x00008094);
    }

    // E-mail3 display name
    public getEmail3DisplayName(): string {
        return this.getNamedStringItem(0x000080a0);
    }

    // E-mail3 address type
    public getEmail3AddressType(): string {
        return this.getNamedStringItem(0x000080a2);
    }

    // E-mail3 e-mail address
    public getEmail3EmailAddress(): string {
        return this.getNamedStringItem(0x000080a3);
    }

    // E-mail3 original display name
    public getEmail3OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080a4);
    }

    // Fax1 Address Type
    public getFax1AddressType(): string {
        return this.getNamedStringItem(0x000080b2);
    }

    // Fax1 Email Address
    public getFax1EmailAddress(): string {
        return this.getNamedStringItem(0x000080b3);
    }

    // Fax1 Original Display Name
    public getFax1OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080b4);
    }

    // Fax2 Address Type
    public getFax2AddressType(): string {
        return this.getNamedStringItem(0x000080c2);
    }

    // Fax2 Email Address
    public getFax2EmailAddress(): string {
        return this.getNamedStringItem(0x000080c3);
    }

    // Fax2 Original Display Name
    public getFax2OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080c4);
    }

    // Fax3 Address Type
    public getFax3AddressType(): string {
        return this.getNamedStringItem(0x000080d2);
    }

    // Fax3 Email Address
    public getFax3EmailAddress(): string {
        return this.getNamedStringItem(0x000080d3);
    }

    // Fax3 Original Display Name
    public getFax3OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080d4);
    }

    // Free/Busy Location (URL)
    public getFreeBusyLocation(): string {
        return this.getNamedStringItem(0x000080d8);
    }

    // Birthday
    public getBirthday(): Date {
        return this.getDateItem(0x3a42);
    }

    // (Wedding) Anniversary
    public getAnniversary(): Date {
        return this.getDateItem(0x3a41);
    }

    public toString(): string {
        return (
            "Contact's Account name: " +
            this.getAccount() +
            '\n' +
            'Display Name: ' +
            this.getGivenName() +
            ' ' +
            this.getSurname() +
            ' (' +
            this.getSMTPAddress() +
            ')\n' +
            'Email1 Address Type: ' +
            this.getEmail1AddressType() +
            '\n' +
            'Email1 Address: ' +
            this.getEmail1EmailAddress() +
            '\n' +
            'Callback telephone number: ' +
            this.getCallbackTelephoneNumber() +
            '\n' +
            "Contact's generational abbreviation (name suffix): " +
            this.getGeneration() +
            '\n' +
            'Contacts given name: ' +
            this.getGivenName() +
            '\n' +
            'Contacts Government ID Number: ' +
            this.getGovernmentIdNumber() +
            '\n' +
            'Business/Office Telephone Number: ' +
            this.getBusinessTelephoneNumber() +
            '\n' +
            'Home Telephone Number: ' +
            this.getHomeTelephoneNumber() +
            '\n' +
            'Contacts initials: ' +
            this.getInitials() +
            '\n' +
            'Keyword: ' +
            this.getKeyword() +
            '\n' +
            "Contact's language: " +
            this.getLanguage() +
            '\n' +
            "Contact's location: " +
            this.getLocation() +
            '\n' +
            'MHS Common Name: ' +
            this.getMhsCommonName() +
            '\n' +
            'Organizational identification number: ' +
            this.getOrganizationalIdNumber() +
            '\n' +
            "Contact's surname  (Last name): " +
            this.getSurname() +
            '\n' +
            'Original display name: ' +
            this.getOriginalDisplayName() +
            '\n' +
            'Default Postal Address: ' +
            this.getPostalAddress() +
            '\n' +
            "Contact's company name: " +
            this.getCompanyName() +
            '\n' +
            "Contact's job title (Profession): " +
            this.getTitle() +
            '\n' +
            "Contact's department name  Used in contact ite: " +
            this.getDepartmentName() +
            '\n' +
            "Contact's office location: " +
            this.getOfficeLocation() +
            '\n' +
            'Primary Telephone: ' +
            this.getPrimaryTelephoneNumber() +
            '\n' +
            "Contact's secondary office (business) phone number: " +
            this.getBusiness2TelephoneNumber() +
            '\n' +
            'Mobile Phone Number: ' +
            this.getMobileTelephoneNumber() +
            '\n' +
            'Radio Phone Number: ' +
            this.getRadioTelephoneNumber() +
            '\n' +
            'Car Phone Number: ' +
            this.getCarTelephoneNumber() +
            '\n' +
            'Other Phone Number: ' +
            this.getOtherTelephoneNumber() +
            '\n' +
            'Transmittable display name: ' +
            this.getTransmittableDisplayName() +
            '\n' +
            'Pager Phone Number: ' +
            this.getPagerTelephoneNumber() +
            '\n' +
            'Primary Fax Number: ' +
            this.getPrimaryFaxNumber() +
            '\n' +
            "Contact's office (business) fax numbe: " +
            this.getBusinessFaxNumber() +
            '\n' +
            "Contact's home fax number: " +
            this.getHomeFaxNumber() +
            '\n' +
            'Business Address Country: ' +
            this.getBusinessAddressCountry() +
            '\n' +
            'Business Address City: ' +
            this.getBusinessAddressCity() +
            '\n' +
            'Business Address State: ' +
            this.getBusinessAddressStateOrProvince() +
            '\n' +
            'Business Address Street: ' +
            this.getBusinessAddressStreet() +
            '\n' +
            'Business Postal Code: ' +
            this.getBusinessPostalCode() +
            '\n' +
            'Business PO Box: ' +
            this.getBusinessPoBox() +
            '\n' +
            'Telex Number: ' +
            this.getTelexNumber() +
            '\n' +
            'ISDN Number: ' +
            this.getIsdnNumber() +
            '\n' +
            'Assistant Phone Number: ' +
            this.getAssistantTelephoneNumber() +
            '\n' +
            'Home Phone 2: ' +
            this.getHome2TelephoneNumber() +
            '\n' +
            "Assistant's Name: " +
            this.getAssistant() +
            '\n' +
            'Hobbies: ' +
            this.getHobbies() +
            '\n' +
            'Middle Name: ' +
            this.getMiddleName() +
            '\n' +
            'Display Name Prefix (Contact Title): ' +
            this.getDisplayNamePrefix() +
            '\n' +
            'Profession: ' +
            this.getProfession() +
            '\n' +
            'Preferred By Name: ' +
            this.getPreferredByName() +
            '\n' +
            "Spouse's Name: " +
            this.getSpouseName() +
            '\n' +
            'Computer Network Name: ' +
            this.getComputerNetworkName() +
            '\n' +
            'Customer ID: ' +
            this.getCustomerId() +
            '\n' +
            'TTY/TDD Phone: ' +
            this.getTtytddPhoneNumber() +
            '\n' +
            'Ftp Site: ' +
            this.getFtpSite() +
            '\n' +
            "Manager's Name: " +
            this.getManagerName() +
            '\n' +
            'Nickname: ' +
            this.getNickname() +
            '\n' +
            'Personal Home Page: ' +
            this.getPersonalHomePage() +
            '\n' +
            'Business Home Page: ' +
            this.getBusinessHomePage() +
            '\n' +
            'Company Main Phone: ' +
            this.getCompanyMainPhoneNumber() +
            '\n' +
            'Childrens names: ' +
            this.getChildrensNames() +
            '\n' +
            'Home Address City: ' +
            this.getHomeAddressCity() +
            '\n' +
            'Home Address Country: ' +
            this.getHomeAddressCountry() +
            '\n' +
            'Home Address Postal Code: ' +
            this.getHomeAddressPostalCode() +
            '\n' +
            'Home Address State or Province: ' +
            this.getHomeAddressStateOrProvince() +
            '\n' +
            'Home Address Street: ' +
            this.getHomeAddressStreet() +
            '\n' +
            'Home Address Post Office Box: ' +
            this.getHomeAddressPostOfficeBox() +
            '\n' +
            'Other Address City: ' +
            this.getOtherAddressCity() +
            '\n' +
            'Other Address Country: ' +
            this.getOtherAddressCountry() +
            '\n' +
            'Other Address Postal Code: ' +
            this.getOtherAddressPostalCode() +
            '\n' +
            'Other Address State: ' +
            this.getOtherAddressStateOrProvince() +
            '\n' +
            'Other Address Street: ' +
            this.getOtherAddressStreet() +
            '\n' +
            'Other Address Post Office box: ' +
            this.getOtherAddressPostOfficeBox() +
            '\n' +
            '\n' +
            this.getBody()
        );
    }
}
