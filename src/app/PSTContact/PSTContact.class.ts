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
    public get account(): string {
        return this.getStringItem(0x3a00);
    }

    // Callback telephone number
    public get callbackTelephoneNumber(): string {
        return this.getStringItem(0x3a02);
    }

    // Contact's generational abbreviation FTK: Name suffix
    public get generation(): string {
        return this.getStringItem(0x3a05);
    }

    // Contacts given name
    public get givenName(): string {
        return this.getStringItem(0x3a06);
    }

    // Contacts Government ID Number
    public get governmentIdNumber(): string {
        return this.getStringItem(0x3a07);
    }

    // Business/Office Telephone Number
    public get businessTelephoneNumber(): string {
        return this.getStringItem(0x3a08);
    }

    // Home Telephone Number
    public get homeTelephoneNumber(): string {
        return this.getStringItem(0x3a09);
    }

    // Contacts initials
    public get initials(): string {
        return this.getStringItem(0x3a0a);
    }

    // Keyword
    public get keyword(): string {
        return this.getStringItem(0x3a0b);
    }

    // Contact's language
    public get language(): string {
        return this.getStringItem(0x3a0c);
    }

    // Contact's location
    public get location(): string {
        return this.getStringItem(0x3a0d);
    }

    // MHS Common Name
    public get mhsCommonName(): string {
        return this.getStringItem(0x3a0f);
    }

    // Organizational identification number
    public get organizationalIdNumber(): string {
        return this.getStringItem(0x3a10);
    }

    // Contact's surname FTK: Last name
    public get surname(): string {
        return this.getStringItem(0x3a11);
    }

    // Original display name
    public get originalDisplayName(): string {
        return this.getStringItem(0x3a13);
    }

    // Default Postal Address
    public get postalAddress(): string {
        return this.getStringItem(0x3a15);
    }

    // Contact's company name
    public get companyName(): string {
        return this.getStringItem(0x3a16);
    }

    // Contact's job title FTK: Profession
    public get title(): string {
        return this.getStringItem(0x3a17);
    }

    // Contact's department name Used in contact item
    public get departmentName(): string {
        return this.getStringItem(0x3a18);
    }

    // Contact's office location
    public get officeLocation(): string {
        return this.getStringItem(0x3a19);
    }

    // Primary Telephone
    public get primaryTelephoneNumber(): string {
        return this.getStringItem(0x3a1a);
    }

    // Contact's secondary office (business) phone number
    public get business2TelephoneNumber(): string {
        return this.getStringItem(0x3a1b);
    }

    // Mobile Phone Number
    public get mobileTelephoneNumber(): string {
        return this.getStringItem(0x3a1c);
    }

    // Radio Phone Number
    public get radioTelephoneNumber(): string {
        return this.getStringItem(0x3a1d);
    }

    // Car Phone Number
    public get carTelephoneNumber(): string {
        return this.getStringItem(0x3a1e);
    }

    // Other Phone Number
    public get otherTelephoneNumber(): string {
        return this.getStringItem(0x3a1f);
    }

    // Transmittable display name
    public get transmittableDisplayName(): string {
        return this.getStringItem(0x3a20);
    }

    // Pager Phone Number
    public get pagerTelephoneNumber(): string {
        return this.getStringItem(0x3a21);
    }

    // Primary Fax Number
    public get primaryFaxNumber(): string {
        return this.getStringItem(0x3a23);
    }

    // Contact's office (business) fax number
    public get businessFaxNumber(): string {
        return this.getStringItem(0x3a24);
    }

    // Contact's home fax number
    public get homeFaxNumber(): string {
        return this.getStringItem(0x3a25);
    }

    // Business Address Country
    public get businessAddressCountry(): string {
        return this.getStringItem(0x3a26);
    }

    // Business Address City
    public get businessAddressCity(): string {
        return this.getStringItem(0x3a27);
    }

    // Business Address State
    public get businessAddressStateOrProvince(): string {
        return this.getStringItem(0x3a28);
    }

    // Business Address Street
    public get businessAddressStreet(): string {
        return this.getStringItem(0x3a29);
    }

    // Business Postal Code
    public get businessPostalCode(): string {
        return this.getStringItem(0x3a2a);
    }

    // Business PO Box
    public get businessPoBox(): string {
        return this.getStringItem(0x3a2b);
    }

    // Telex Number
    public get telexNumber(): string {
        return this.getStringItem(0x3a2c);
    }

    // ISDN Number
    public get isdnNumber(): string {
        return this.getStringItem(0x3a2d);
    }

    // Assistant Phone Number
    public get assistantTelephoneNumber(): string {
        return this.getStringItem(0x3a2e);
    }

    // Home Phone 2
    public get home2TelephoneNumber(): string {
        return this.getStringItem(0x3a2f);
    }

    // Assistant�s Name
    public get assistant(): string {
        return this.getStringItem(0x3a30);
    }

    // Hobbies
    public get hobbies(): string {
        return this.getStringItem(0x3a43);
    }

    // Middle Name
    public get middleName(): string {
        return this.getStringItem(0x3a44);
    }

    // Display Name Prefix (Contact Title)
    public get displayNamePrefix(): string {
        return this.getStringItem(0x3a45);
    }

    // Profession
    public get profession(): string {
        return this.getStringItem(0x3a46);
    }

    // Preferred By Name
    public get preferredByName(): string {
        return this.getStringItem(0x3a47);
    }

    // Spouse�s Name
    public get spouseName(): string {
        return this.getStringItem(0x3a48);
    }

    // Computer Network Name
    public get computerNetworkName(): string {
        return this.getStringItem(0x3a49);
    }

    // Customer ID
    public get customerId(): string {
        return this.getStringItem(0x3a4a);
    }

    // TTY/TDD Phone
    public get ttytddPhoneNumber(): string {
        return this.getStringItem(0x3a4b);
    }

    // Ftp Site
    public get ftpSite(): string {
        return this.getStringItem(0x3a4c);
    }

    // Manager�s Name
    public get managerName(): string {
        return this.getStringItem(0x3a4e);
    }

    // Nickname
    public get nickname(): string {
        return this.getStringItem(0x3a4f);
    }

    // Personal Home Page
    public get personalHomePage(): string {
        return this.getStringItem(0x3a50);
    }

    // Business Home Page
    public get businessHomePage(): string {
        return this.getStringItem(0x3a51);
    }

    // Note
    public get note(): string {
        return this.getStringItem(0x6619);
    }

    public getNamedStringItem(key: number): string {
        let id = this.pstFile.getNameToIdMapItem(key, PSTFile.PSETID_Address);
        if (id != -1) {
            return this.getStringItem(id);
        }
        return '';
    }

    public get smtpAddress(): string {
        return this.getNamedStringItem(0x00008084);
    }

    // Company Main Phone
    public get companyMainPhoneNumber(): string {
        return this.getStringItem(0x3a57);
    }

    // Children's names
    public get childrensNames(): string {
        return this.getStringItem(0x3a58);
    }

    // Home Address City
    public get homeAddressCity(): string {
        return this.getStringItem(0x3a59);
    }

    // Home Address Country
    public get homeAddressCountry(): string {
        return this.getStringItem(0x3a5a);
    }

    // Home Address Postal Code
    public get homeAddressPostalCode(): string {
        return this.getStringItem(0x3a5b);
    }

    // Home Address State or Province
    public get homeAddressStateOrProvince(): string {
        return this.getStringItem(0x3a5c);
    }

    // Home Address Street
    public get homeAddressStreet(): string {
        return this.getStringItem(0x3a5d);
    }

    // Home Address Post Office Box
    public get homeAddressPostOfficeBox(): string {
        return this.getStringItem(0x3a5e);
    }

    // Other Address City
    public get otherAddressCity(): string {
        return this.getStringItem(0x3a5f);
    }

    // Other Address Country
    public get otherAddressCountry(): string {
        return this.getStringItem(0x3a60);
    }

    // Other Address Postal Code
    public get otherAddressPostalCode(): string {
        return this.getStringItem(0x3a61);
    }

    // Other Address State
    public get otherAddressStateOrProvince(): string {
        return this.getStringItem(0x3a62);
    }

    // Other Address Street
    public get otherAddressStreet(): string {
        return this.getStringItem(0x3a63);
    }

    // Other Address Post Office box
    public get otherAddressPostOfficeBox(): string {
        return this.getStringItem(0x3a64);
    }

    ///////////////////////////////////////////////////
    // Below are the values from the name to id map...
    ///////////////////////////////////////////////////

    // File under FTK: File as
    public get fileUnder(): string {
        return this.getNamedStringItem(0x00008005);
    }

    // Home Address
    public get homeAddress(): string {
        return this.getNamedStringItem(0x0000801a);
    }

    // Business Address
    public get workAddress(): string {
        return this.getNamedStringItem(0x0000801b);
    }

    // Other Address
    public get otherAddress(): string {
        return this.getNamedStringItem(0x0000801c);
    }

    // Selected Mailing Address
    public get postalAddressId(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008022, PSTFile.PSETID_Address));
    }

    // Webpage
    public get html(): string {
        return this.getNamedStringItem(0x0000802b);
    }

    // Business Address City
    public get workAddressStreet(): string {
        return this.getNamedStringItem(0x00008045);
    }

    // Business Address Street
    public get workAddressCity(): string {
        return this.getNamedStringItem(0x00008046);
    }

    // Business Address State
    public get workAddressState(): string {
        return this.getNamedStringItem(0x00008047);
    }

    // Business Address Postal Code
    public get workAddressPostalCode(): string {
        return this.getNamedStringItem(0x00008048);
    }

    // Business Address Country
    public get workAddressCountry(): string {
        return this.getNamedStringItem(0x00008049);
    }

    // Business Address Country
    public get workAddressPostOfficeBox(): string {
        return this.getNamedStringItem(0x0000804a);
    }

    // IM Address
    public get instantMessagingAddress(): string {
        return this.getNamedStringItem(0x00008062);
    }

    // E-mail1 Display Name
    public get email1DisplayName(): string {
        return this.getNamedStringItem(0x00008080);
    }

    // E-mail1 Address Type
    public get email1AddressType(): string {
        return this.getNamedStringItem(0x00008082);
    }

    // E-mail1 Address
    public get email1EmailAddress(): string {
        return this.getNamedStringItem(0x00008083);
    }

    // E-mail1 Display Name
    public get email1OriginalDisplayName(): string {
        return this.getNamedStringItem(0x00008084);
    }

    // E-mail1 type
    public get email1EmailType(): string {
        return this.getNamedStringItem(0x00008087);
    }

    // E-mail2 display name
    public get email2DisplayName(): string {
        return this.getNamedStringItem(0x00008090);
    }

    // E-mail2 address type
    public get email2AddressType(): string {
        return this.getNamedStringItem(0x00008092);
    }

    // E-mail2 e-mail address
    public get email2EmailAddress(): string {
        return this.getNamedStringItem(0x00008093);
    }

    // E-mail2 original display name
    public get email2OriginalDisplayName(): string {
        return this.getNamedStringItem(0x00008094);
    }

    // E-mail3 display name
    public get email3DisplayName(): string {
        return this.getNamedStringItem(0x000080a0);
    }

    // E-mail3 address type
    public get email3AddressType(): string {
        return this.getNamedStringItem(0x000080a2);
    }

    // E-mail3 e-mail address
    public get email3EmailAddress(): string {
        return this.getNamedStringItem(0x000080a3);
    }

    // E-mail3 original display name
    public get email3OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080a4);
    }

    // Fax1 Address Type
    public get fax1AddressType(): string {
        return this.getNamedStringItem(0x000080b2);
    }

    // Fax1 Email Address
    public get fax1EmailAddress(): string {
        return this.getNamedStringItem(0x000080b3);
    }

    // Fax1 Original Display Name
    public get fax1OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080b4);
    }

    // Fax2 Address Type
    public get fax2AddressType(): string {
        return this.getNamedStringItem(0x000080c2);
    }

    // Fax2 Email Address
    public get fax2EmailAddress(): string {
        return this.getNamedStringItem(0x000080c3);
    }

    // Fax2 Original Display Name
    public get fax2OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080c4);
    }

    // Fax3 Address Type
    public get fax3AddressType(): string {
        return this.getNamedStringItem(0x000080d2);
    }

    // Fax3 Email Address
    public get fax3EmailAddress(): string {
        return this.getNamedStringItem(0x000080d3);
    }

    // Fax3 Original Display Name
    public get fax3OriginalDisplayName(): string {
        return this.getNamedStringItem(0x000080d4);
    }

    // Free/Busy Location (URL)
    public get freeBusyLocation(): string {
        return this.getNamedStringItem(0x000080d8);
    }

    // Birthday
    public get birthday(): Date {
        return this.getDateItem(0x3a42);
    }

    // (Wedding) Anniversary
    public get anniversary(): Date {
        return this.getDateItem(0x3a41);
    }

    public toString(): string {
        return (
            '\n message class: ' + this.getMessageClass() + 
            '\n subject: ' + this.getSubject() + 
            '\n importance: ' + this.getImportance() + 
            '\n transport message headers: ' + this.getTransportMessageHeaders() + 
            '\n account: ' + this.account + 
            '\n callbackTelephoneNumber: ' + this.callbackTelephoneNumber + 
            '\n generation: ' + this.generation + 
            '\n givenName: ' + this.givenName + 
            '\n governmentIdNumber: ' + this.governmentIdNumber + 
            '\n businessTelephoneNumber: ' + this.businessTelephoneNumber + 
            '\n homeTelephoneNumber: ' + this.homeTelephoneNumber + 
            '\n initials: ' + this.initials + 
            '\n keyword: ' + this.keyword + 
            '\n language: ' + this.language + 
            '\n location: ' + this.location + 
            '\n mhsCommonName: ' + this.mhsCommonName + 
            '\n organizationalIdNumber: ' + this.organizationalIdNumber + 
            '\n surname: ' + this.surname + 
            '\n originalDisplayName: ' + this.originalDisplayName + 
            '\n postalAddress: ' + this.postalAddress + 
            '\n companyName: ' + this.companyName + 
            '\n title: ' + this.title + 
            '\n departmentName: ' + this.departmentName + 
            '\n officeLocation: ' + this.officeLocation + 
            '\n primaryTelephoneNumber: ' + this.primaryTelephoneNumber + 
            '\n business2TelephoneNumber: ' + this.business2TelephoneNumber + 
            '\n mobileTelephoneNumber: ' + this.mobileTelephoneNumber + 
            '\n radioTelephoneNumber: ' + this.radioTelephoneNumber + 
            '\n carTelephoneNumber: ' + this.carTelephoneNumber + 
            '\n otherTelephoneNumber: ' + this.otherTelephoneNumber + 
            '\n transmittableDisplayName: ' + this.transmittableDisplayName + 
            '\n pagerTelephoneNumber: ' + this.pagerTelephoneNumber + 
            '\n primaryFaxNumber: ' + this.primaryFaxNumber + 
            '\n businessFaxNumber: ' + this.businessFaxNumber + 
            '\n homeFaxNumber: ' + this.homeFaxNumber + 
            '\n businessAddressCountry: ' + this.businessAddressCountry + 
            '\n businessAddressCity: ' + this.businessAddressCity + 
            '\n businessAddressStateOrProvince: ' + this.businessAddressStateOrProvince + 
            '\n businessAddressStreet: ' + this.businessAddressStreet + 
            '\n businessPostalCode: ' + this.businessPostalCode + 
            '\n businessPoBox: ' + this.businessPoBox + 
            '\n telexNumber: ' + this.telexNumber + 
            '\n isdnNumber: ' + this.isdnNumber + 
            '\n assistantTelephoneNumber: ' + this.assistantTelephoneNumber + 
            '\n home2TelephoneNumber: ' + this.home2TelephoneNumber + 
            '\n assistant: ' + this.assistant + 
            '\n hobbies: ' + this.hobbies + 
            '\n middleName: ' + this.middleName + 
            '\n displayNamePrefix: ' + this.displayNamePrefix + 
            '\n profession: ' + this.profession + 
            '\n preferredByName: ' + this.preferredByName + 
            '\n spouseName: ' + this.spouseName + 
            '\n computerNetworkName: ' + this.computerNetworkName + 
            '\n customerId: ' + this.customerId + 
            '\n ttytddPhoneNumber: ' + this.ttytddPhoneNumber + 
            '\n ftpSite: ' + this.ftpSite + 
            '\n managerName: ' + this.managerName + 
            '\n nickname: ' + this.nickname + 
            '\n personalHomePage: ' + this.personalHomePage + 
            '\n businessHomePage: ' + this.businessHomePage + 
            '\n smtpAddress: ' + this.smtpAddress + 
            '\n companyMainPhoneNumber: ' + this.companyMainPhoneNumber + 
            '\n childrensNames: ' + this.childrensNames + 
            '\n homeAddressCity: ' + this.homeAddressCity + 
            '\n homeAddressCountry: ' + this.homeAddressCountry + 
            '\n homeAddressPostalCode: ' + this.homeAddressPostalCode + 
            '\n homeAddressStateOrProvince: ' + this.homeAddressStateOrProvince + 
            '\n homeAddressStreet: ' + this.homeAddressStreet + 
            '\n homeAddressPostOfficeBox: ' + this.homeAddressPostOfficeBox + 
            '\n otherAddressCity: ' + this.otherAddressCity + 
            '\n otherAddressCountry: ' + this.otherAddressCountry + 
            '\n otherAddressPostalCode: ' + this.otherAddressPostalCode + 
            '\n otherAddressStateOrProvince: ' + this.otherAddressStateOrProvince + 
            '\n otherAddressStreet: ' + this.otherAddressStreet + 
            '\n otherAddressPostOfficeBox: ' + this.otherAddressPostOfficeBox + 
            '\n fileUnder: ' + this.fileUnder + 
            '\n homeAddress: ' + this.homeAddress + 
            '\n workAddress: ' + this.workAddress + 
            '\n otherAddress: ' + this.otherAddress + 
            '\n postalAddressId: ' + this.postalAddressId + 
            '\n html: ' + this.html + 
            '\n workAddressStreet: ' + this.workAddressStreet + 
            '\n workAddressCity: ' + this.workAddressCity + 
            '\n workAddressState: ' + this.workAddressState + 
            '\n workAddressPostalCode: ' + this.workAddressPostalCode + 
            '\n workAddressCountry: ' + this.workAddressCountry + 
            '\n workAddressPostOfficeBox: ' + this.workAddressPostOfficeBox + 
            '\n instantMessagingAddress: ' + this.instantMessagingAddress + 
            '\n email1DisplayName: ' + this.email1DisplayName + 
            '\n email1AddressType: ' + this.email1AddressType + 
            '\n email1EmailAddress: ' + this.email1EmailAddress + 
            '\n email1OriginalDisplayName: ' + this.email1OriginalDisplayName + 
            '\n email1EmailType: ' + this.email1EmailType + 
            '\n email2DisplayName: ' + this.email2DisplayName + 
            '\n email2AddressType: ' + this.email2AddressType + 
            '\n email2EmailAddress: ' + this.email2EmailAddress + 
            '\n email2OriginalDisplayName: ' + this.email2OriginalDisplayName + 
            '\n email3DisplayName: ' + this.email3DisplayName + 
            '\n email3AddressType: ' + this.email3AddressType + 
            '\n email3EmailAddress: ' + this.email3EmailAddress + 
            '\n email3OriginalDisplayName: ' + this.email3OriginalDisplayName + 
            '\n fax1AddressType: ' + this.fax1AddressType + 
            '\n fax1EmailAddress: ' + this.fax1EmailAddress + 
            '\n fax1OriginalDisplayName: ' + this.fax1OriginalDisplayName + 
            '\n fax2AddressType: ' + this.fax2AddressType + 
            '\n fax2EmailAddress: ' + this.fax2EmailAddress + 
            '\n fax2OriginalDisplayName: ' + this.fax2OriginalDisplayName + 
            '\n fax3AddressType: ' + this.fax3AddressType + 
            '\n fax3EmailAddress: ' + this.fax3EmailAddress + 
            '\n fax3OriginalDisplayName: ' + this.fax3OriginalDisplayName + 
            '\n freeBusyLocation: ' + this.freeBusyLocation + 
            '\n birthday: ' + this.birthday + 
            '\n anniversary: ' + this.anniversary 
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
            messageClass: this.getMessageClass(),
            subject: this.getSubject(), 
            importance: this.getImportance(),
            transportMessageHeaders: this.getTransportMessageHeaders(),
            account: this.account,
            callbackTelephoneNumber: this.callbackTelephoneNumber,
            generation: this.generation,
            givenName: this.givenName,
            governmentIdNumber: this.governmentIdNumber,
            businessTelephoneNumber: this.businessTelephoneNumber,
            homeTelephoneNumber: this.homeTelephoneNumber,
            initials: this.initials,
            keyword: this.keyword,
            language: this.language,
            location: this.location,
            mhsCommonName: this.mhsCommonName,
            organizationalIdNumber: this.organizationalIdNumber,
            surname: this.surname,
            originalDisplayName: this.originalDisplayName,
            postalAddress: this.postalAddress,
            companyName: this.companyName,
            title: this.title,
            departmentName: this.departmentName,
            officeLocation: this.officeLocation,
            primaryTelephoneNumber: this.primaryTelephoneNumber,
            business2TelephoneNumber: this.business2TelephoneNumber,
            mobileTelephoneNumber: this.mobileTelephoneNumber,
            radioTelephoneNumber: this.radioTelephoneNumber,
            carTelephoneNumber: this.carTelephoneNumber,
            otherTelephoneNumber: this.otherTelephoneNumber,
            transmittableDisplayName: this.transmittableDisplayName,
            pagerTelephoneNumber: this.pagerTelephoneNumber,
            primaryFaxNumber: this.primaryFaxNumber,
            businessFaxNumber: this.businessFaxNumber,
            homeFaxNumber: this.homeFaxNumber,
            businessAddressCountry: this.businessAddressCountry,
            businessAddressCity: this.businessAddressCity,
            businessAddressStateOrProvince: this.businessAddressStateOrProvince,
            businessAddressStreet: this.businessAddressStreet,
            businessPostalCode: this.businessPostalCode,
            businessPoBox: this.businessPoBox,
            telexNumber: this.telexNumber,
            isdnNumber: this.isdnNumber,
            assistantTelephoneNumber: this.assistantTelephoneNumber,
            home2TelephoneNumber: this.home2TelephoneNumber,
            assistant: this.assistant,
            hobbies: this.hobbies,
            middleName: this.middleName,
            displayNamePrefix: this.displayNamePrefix,
            profession: this.profession,
            preferredByName: this.preferredByName,
            spouseName: this.spouseName,
            computerNetworkName: this.computerNetworkName,
            customerId: this.customerId,
            ttytddPhoneNumber: this.ttytddPhoneNumber,
            ftpSite: this.ftpSite,
            managerName: this.managerName,
            nickname: this.nickname,
            personalHomePage: this.personalHomePage,
            businessHomePage: this.businessHomePage,
            smtpAddress: this.smtpAddress,
            companyMainPhoneNumber: this.companyMainPhoneNumber,
            childrensNames: this.childrensNames,
            homeAddressCity: this.homeAddressCity,
            homeAddressCountry: this.homeAddressCountry,
            homeAddressPostalCode: this.homeAddressPostalCode,
            homeAddressStateOrProvince: this.homeAddressStateOrProvince,
            homeAddressStreet: this.homeAddressStreet,
            homeAddressPostOfficeBox: this.homeAddressPostOfficeBox,
            otherAddressCity: this.otherAddressCity,
            otherAddressCountry: this.otherAddressCountry,
            otherAddressPostalCode: this.otherAddressPostalCode,
            otherAddressStateOrProvince: this.otherAddressStateOrProvince,
            otherAddressStreet: this.otherAddressStreet,
            otherAddressPostOfficeBox: this.otherAddressPostOfficeBox,
            fileUnder: this.fileUnder,
            homeAddress: this.homeAddress,
            workAddress: this.workAddress,
            otherAddress: this.otherAddress,
            postalAddressId: this.postalAddressId,
            html: this.html,
            workAddressStreet: this.workAddressStreet,
            workAddressCity: this.workAddressCity,
            workAddressState: this.workAddressState,
            workAddressPostalCode: this.workAddressPostalCode,
            workAddressCountry: this.workAddressCountry,
            workAddressPostOfficeBox: this.workAddressPostOfficeBox,
            instantMessagingAddress: this.instantMessagingAddress,
            email1DisplayName: this.email1DisplayName,
            email1AddressType: this.email1AddressType,
            email1EmailAddress: this.email1EmailAddress,
            email1OriginalDisplayName: this.email1OriginalDisplayName,
            email1EmailType: this.email1EmailType,
            email2DisplayName: this.email2DisplayName,
            email2AddressType: this.email2AddressType,
            email2EmailAddress: this.email2EmailAddress,
            email2OriginalDisplayName: this.email2OriginalDisplayName,
            email3DisplayName: this.email3DisplayName,
            email3AddressType: this.email3AddressType,
            email3EmailAddress: this.email3EmailAddress,
            email3OriginalDisplayName: this.email3OriginalDisplayName,
            fax1AddressType: this.fax1AddressType,
            fax1EmailAddress: this.fax1EmailAddress,
            fax1OriginalDisplayName: this.fax1OriginalDisplayName,
            fax2AddressType: this.fax2AddressType,
            fax2EmailAddress: this.fax2EmailAddress,
            fax2OriginalDisplayName: this.fax2OriginalDisplayName,
            fax3AddressType: this.fax3AddressType,
            fax3EmailAddress: this.fax3EmailAddress,
            fax3OriginalDisplayName: this.fax3OriginalDisplayName,
            freeBusyLocation: this.freeBusyLocation,
            birthday: this.birthday,
            anniversary: this.anniversary 
        });
    }
}
