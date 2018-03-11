/**
 * Copyright 2010-2018 Richard Johnson, Orin Eman & Ed Pfromer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This file is part of pst-extractor.
 *
 * pst-extractor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * pst-extractor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with pst-extractor. If not, see <http://www.gnu.org/licenses/>.
 */
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { OutlookProperties } from '../OutlookProperties';

export class PSTContact extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    /**
     * Contains the recipient's account name.
     * https://msdn.microsoft.com/en-us/library/office/cc842401.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get account(): string {
        return this.getStringItem(OutlookProperties.PR_ACCOUNT);
    }

    /**
     * Contains a telephone number that the message recipient can use to reach the sender.
     * https://msdn.microsoft.com/en-us/library/office/cc839943.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get callbackTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_CALLBACK_TELEPHONE_NUMBER);
    }

    /**
     * Contains a generational abbreviation that follows the full name of the recipient.
     * https://msdn.microsoft.com/en-us/library/office/cc842136.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get generation(): string {
        return this.getStringItem(OutlookProperties.PR_GENERATION);
    }

    /**
     * Contains the first or given name of the recipient.
     * https://msdn.microsoft.com/en-us/library/office/cc815351.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get givenName(): string {
        return this.getStringItem(OutlookProperties.PR_GIVEN_NAME);
    }

    /**
     * Contains a government identifier for the recipient.
     * https://msdn.microsoft.com/en-us/library/office/cc815890.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get governmentIdNumber(): string {
        return this.getStringItem(OutlookProperties.PR_GOVERNMENT_ID_NUMBER);
    }

    /**
     * Contains the primary telephone number of the recipient's place of business.
     * https://msdn.microsoft.com/en-us/library/office/cc839937.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_BUSINESS_TELEPHONE_NUMBER);
    }

    /**
     * Contains the primary telephone number of the recipient's home.
     * https://msdn.microsoft.com/en-us/library/office/cc815389.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_TELEPHONE_NUMBER);
    }

    /**
     * Contains the initials for parts of the full name of the recipient.
     * https://msdn.microsoft.com/en-us/library/office/cc839843.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get initials(): string {
        return this.getStringItem(OutlookProperties.PR_INITIALS);
    }

    /**
     * Contains a keyword that identifies the recipient to the recipient's system administrator.
     * https://msdn.microsoft.com/en-us/library/office/cc842250.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get keyword(): string {
        return this.getStringItem(OutlookProperties.PR_KEYWORD);
    }

    /**
     * Contains a value that indicates the language in which the messaging user is writing messages.
     * https://msdn.microsoft.com/en-us/library/office/cc839724.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get language(): string {
        return this.getStringItem(OutlookProperties.PR_LANGUAGE);
    }

    /**
     * Contains the location of the recipient in a format that is useful to the recipient's organization.
     * https://msdn.microsoft.com/en-us/library/office/cc815567.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get location(): string {
        return this.getStringItem(OutlookProperties.PR_LOCATION);
    }

    /**
     * Contains the common name of the message handling system.
     * https://msdn.microsoft.com/en-us/library/office/cc842474.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get mhsCommonName(): string {
        return this.getStringItem(OutlookProperties.PR_MHS_COMMON_NAME);
    }

    /**
     * Contains an organizational ID number for the contact, such as an employee ID number.
     * https://msdn.microsoft.com/en-us/library/office/cc765672.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get organizationalIdNumber(): string {
        return this.getStringItem(OutlookProperties.PR_ORGANIZATIONAL_ID_NUMBER);
    }

    /**
     * Contains the last or surname of the recipient.
     * https://msdn.microsoft.com/en-us/library/office/cc765704.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get surname(): string {
        return this.getStringItem(OutlookProperties.PR_SURNAME);
    }

    /**
     * Contains the original display name for an entry copied from an address book to a personal address book or other writable address book.
     * https://msdn.microsoft.com/en-us/library/office/cc765709.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get originalDisplayName(): string {
        return this.getStringItem(OutlookProperties.PR_ORIGINAL_DISPLAY_NAME);
    }

    /**
     * Contains the recipient's postal address.
     * https://msdn.microsoft.com/en-us/library/office/cc842549.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get postalAddress(): string {
        return this.getStringItem(OutlookProperties.PR_POSTAL_ADDRESS);
    }

    /**
     * Contains the recipient's company name.
     * https://msdn.microsoft.com/en-us/library/office/cc842192.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get companyName(): string {
        return this.getStringItem(OutlookProperties.PT_UNICODE);
    }

    /**
     * Contains the recipient's job title.
     * https://msdn.microsoft.com/en-us/library/office/cc815831.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get title(): string {
        return this.getStringItem(OutlookProperties.PR_TITLE);
    }

    /**
     * Contains a name for the department in which the recipient works.
     * https://msdn.microsoft.com/en-us/library/office/cc839825.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get departmentName(): string {
        return this.getStringItem(OutlookProperties.PR_DEPARTMENT_NAME);
    }

    /**
     * Contains the recipient's office location.
     * https://msdn.microsoft.com/en-us/library/office/cc842269.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get officeLocation(): string {
        return this.getStringItem(OutlookProperties.PR_OFFICE_LOCATION);
    }

    /**
     * Contains the recipient's primary telephone number.
     * https://msdn.microsoft.com/en-us/library/office/cc839969.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get primaryTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_PRIMARY_TELEPHONE_NUMBER);
    }

    /**
     * Contains a secondary telephone number at the recipient's place of business.
     * https://msdn.microsoft.com/en-us/library/office/cc841990.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get business2TelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_BUSINESS2_TELEPHONE_NUMBER);
    }

    /**
     * Contains the recipient's cellular telephone number.
     * https://msdn.microsoft.com/en-us/library/office/cc839798.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get mobileTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_MOBILE_TELEPHONE_NUMBER);
    }

    /**
     * Contains the recipient's radio telephone number.
     * https://msdn.microsoft.com/en-us/library/office/cc839806.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get radioTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_RADIO_TELEPHONE_NUMBER);
    }

    /**
     * Contains the recipient's car telephone number.
     * https://msdn.microsoft.com/en-us/library/office/cc815394.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get carTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_CAR_TELEPHONE_NUMBER);
    }

    /**
     * Contains an alternate telephone number for the recipient.
     * https://msdn.microsoft.com/en-us/library/office/cc839561.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_TELEPHONE_NUMBER);
    }

    /**
     * Contains a recipient's display name in a secure form that cannot be changed.
     * https://msdn.microsoft.com/en-us/library/office/cc815723.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get transmittableDisplayName(): string {
        return this.getStringItem(OutlookProperties.PR_TRANSMITABLE_DISPLAY_NAME);
    }

    /**
     * Contains the recipient's pager telephone number.
     * https://msdn.microsoft.com/en-us/library/office/cc765824.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get pagerTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_PAGER_TELEPHONE_NUMBER);
    }

    /**
     * Contains the telephone number of the recipient's primary fax machine.
     * https://msdn.microsoft.com/en-us/library/office/cc815713.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get primaryFaxNumber(): string {
        return this.getStringItem(OutlookProperties.PR_PRIMARY_FAX_NUMBER);
    }

    /**
     * Contains the telephone number of the recipient's business fax machine.
     * https://msdn.microsoft.com/en-us/library/office/cc765799.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessFaxNumber(): string {
        return this.getStringItem(OutlookProperties.PR_BUSINESS_FAX_NUMBER);
    }

    /**
     * Contains the telephone number of the recipient's home fax machine.
     * https://msdn.microsoft.com/en-us/library/office/cc842109.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeFaxNumber(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_FAX_NUMBER);
    }

    /**
     * Contains the name of the recipient's country/region.
     * https://msdn.microsoft.com/en-us/library/office/cc842494.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessAddressCountry(): string {
        return this.getStringItem(OutlookProperties.PR_COUNTRY);
    }

    /**
     * Contains the name of the recipient's locality, such as the town or city.
     * https://msdn.microsoft.com/en-us/library/office/cc815711.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessAddressCity(): string {
        return this.getStringItem(OutlookProperties.PR_LOCALITY);
    }

    /**
     * Contains the name of the recipient's state or province.
     * https://msdn.microsoft.com/en-us/library/office/cc839544.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessAddressStateOrProvince(): string {
        return this.getStringItem(OutlookProperties.PR_STATE_OR_PROVINCE);
    }

    /**
     * Contains the recipient's street address.
     * https://msdn.microsoft.com/en-us/library/office/cc765810.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessAddressStreet(): string {
        return this.getStringItem(OutlookProperties.PR_STREET_ADDRESS);
    }

    /**
     * Contains the postal code for the recipient's postal address.
     * https://msdn.microsoft.com/en-us/library/office/cc839851.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessPostalCode(): string {
        return this.getStringItem(OutlookProperties.PR_POSTAL_CODE);
    }

    /**
     * Contains the number or identifier of the recipient's post office box.
     * https://msdn.microsoft.com/en-us/library/office/cc815522.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessPoBox(): string {
        return this.getStringItem(OutlookProperties.PR_POST_OFFICE_BOX);
    }

    /**
     * Contains the recipient's telex number.
     * https://msdn.microsoft.com/en-us/library/office/cc765894.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get telexNumber(): string {
        return this.getStringItem(OutlookProperties.PR_TELEX_NUMBER);
    }

    /**
     * Contains the recipient's ISDN-capable telephone number.
     * https://msdn.microsoft.com/en-us/library/office/cc765863.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get isdnNumber(): string {
        return this.getStringItem(OutlookProperties.PR_ISDN_NUMBER);
    }

    /**
     * Contains the telephone number of the recipient's administrative assistant.
     * https://msdn.microsoft.com/en-us/library/office/cc840012.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get assistantTelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_ASSISTANT_TELEPHONE_NUMBER);
    }

    /**
     * Contains a secondary telephone number at the recipient's home.
     * https://msdn.microsoft.com/en-us/library/office/cc815540.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get home2TelephoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_HOME2_TELEPHONE_NUMBER);
    }

    /**
     * Contains the name of the recipient's administrative assistant.
     * https://msdn.microsoft.com/en-us/library/office/cc815319.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get assistant(): string {
        return this.getStringItem(OutlookProperties.PR_ASSISTANT);
    }

    /**
     * Contains the names of the hobbies of the messaging user.
     * https://msdn.microsoft.com/en-us/library/office/cc815391.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get hobbies(): string {
        return this.getStringItem(OutlookProperties.PR_HOBBIES);
    }

    /**
     * Contains the middle name of a contact.
     * https://msdn.microsoft.com/en-us/library/office/cc815329.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get middleName(): string {
        return this.getStringItem(OutlookProperties.PR_MIDDLE_NAME);
    }

    /**
     * Contains the display name prefix (such as Miss, Mr., Mrs.) for the messaging user.
     * https://msdn.microsoft.com/en-us/library/office/cc765538.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get displayNamePrefix(): string {
        return this.getStringItem(OutlookProperties.PR_DISPLAY_NAME_PREFIX);
    }

    /**
     * Contains the profession of the user.
     * https://msdn.microsoft.com/en-us/library/office/cc765792.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get profession(): string {
        return this.getStringItem(OutlookProperties.PR_PROFESSION);
    }

    /**
     * Contains the name of the mail user's referral.
     * https://msdn.microsoft.com/en-us/library/office/cc765803.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get preferredByName(): string {
        return this.getStringItem(OutlookProperties.PR_REFERRED_BY_NAME);
    }

    /**
     * Contains the user’s spouse name.
     * https://msdn.microsoft.com/en-us/library/office/cc765832.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get spouseName(): string {
        return this.getStringItem(OutlookProperties.PR_SPOUSE_NAME);
    }

    /**
     * Contains the name of the network used to transmit the message.
     * https://msdn.microsoft.com/en-us/library/office/cc839633.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get computerNetworkName(): string {
        return this.getStringItem(OutlookProperties.PR_COMPUTER_NETWORK_NAME);
    }

    /**
     * Contains the contact’s customer ID number.
     * https://msdn.microsoft.com/en-us/library/office/cc842178.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get customerId(): string {
        return this.getStringItem(OutlookProperties.PR_CUSTOMER_ID);
    }

    /**
     * Contains the telephone number for the contact’s text telephone (TTY) or telecommunication device for the deaf (TDD).
     * https://msdn.microsoft.com/en-us/library/office/cc765580.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get ttytddPhoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_TTYTDD_PHONE_NUMBER);
    }

    /**
     * Contains the contact’s File Transfer Protocol (FTP) URL. FTP is a protocol that is used to transfer data, as specified in [RFC959].
     * https://msdn.microsoft.com/en-us/library/office/cc839830.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get ftpSite(): string {
        return this.getStringItem(OutlookProperties.PR_FTP_SITE);
    }

    /**
     * Contains the name of the recipient's manager.
     * https://msdn.microsoft.com/en-us/library/office/cc842009.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get managerName(): string {
        return this.getStringItem(OutlookProperties.PR_MANAGER_NAME);
    }

    /**
     * Contains the nickname of the contact.
     * https://msdn.microsoft.com/en-us/library/office/cc765603.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get nickname(): string {
        return this.getStringItem(OutlookProperties.PR_NICKNAME);
    }

    /**
     * Contains the URL of a user's personal home page.
     * https://msdn.microsoft.com/en-us/library/office/cc765751.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get personalHomePage(): string {
        return this.getStringItem(OutlookProperties.PR_PERSONAL_HOME_PAGE);
    }

    /**
     * Contains the URL of the home page for the business.
     * https://msdn.microsoft.com/en-us/library/office/cc842385.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get businessHomePage(): string {
        return this.getStringItem(OutlookProperties.PR_BUSINESS_HOME_PAGE);
    }

    /**
     * Get the note associated with the contact.
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get note(): string {
        return this.getStringItem(0x6619);
    }

    /**
     * Get a named string item from the map
     * @param {number} key 
     * @returns {string} 
     * @memberof PSTContact
     */
    public getNamedStringItem(key: number): string {
        let id = this.pstFile.getNameToIdMapItem(key, OutlookProperties.PSETID_Address);
        if (id != -1) {
            return this.getStringItem(id);
        }
        return '';
    }

    /**
     * Specifies the first display name that corresponds to the e-mail address that is specified for the contact.
     * https://msdn.microsoft.com/en-us/library/partnercenter/cc815564(v=office.14).aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get smtpAddress(): string {
        return this.getNamedStringItem(OutlookProperties.PidLidEmail1OriginalDisplayName);
    }

    /**
     * Contains the main telephone number for a company
     * https://msdn.microsoft.com/en-us/library/office/cc839651.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get companyMainPhoneNumber(): string {
        return this.getStringItem(OutlookProperties.PR_COMPANY_MAIN_PHONE_NUMBER);
    }

    /**
     * Contains a list of names of children
     * https://msdn.microsoft.com/en-us/library/office/cc839533.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get childrensNames(): string {
        return this.getStringItem(OutlookProperties.PR_CHILDRENS_NAMES);
    }

    /**
     * Contains the city for the recipient's home address.
     * https://msdn.microsoft.com/en-us/library/office/cc815582.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddressCity(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_ADDRESS_CITY);
    }

    /**
     * Contains the county in a contact's address.
     * https://msdn.microsoft.com/en-us/library/office/cc842548.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddressCountry(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_ADDRESS_COUNTRY);
    }

    /**
     * Contains the postal code for the user's home address.
     * https://msdn.microsoft.com/en-us/library/office/cc815880.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddressPostalCode(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_ADDRESS_POSTAL_CODE);
    }

    /**
     * Contains the state or province portion of a user's address.
     * https://msdn.microsoft.com/en-us/library/office/cc839958.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddressStateOrProvince(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_ADDRESS_STATE_OR_PROVINCE);
    }

    /**
     * Contains the street portion of a user's address.
     * https://msdn.microsoft.com/en-us/library/office/cc841997.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddressStreet(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_ADDRESS_STREET);
    }

    /**
     * Contains the post office box information for a user's address.
     * https://msdn.microsoft.com/en-us/library/office/cc842440.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddressPostOfficeBox(): string {
        return this.getStringItem(OutlookProperties.PR_HOME_ADDRESS_POST_OFFICE_BOX);
    }

    /**
     * Contains the name of the mail user's other locality, such as the town or city.
     * https://msdn.microsoft.com/en-us/library/office/cc765881.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddressCity(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_ADDRESS_CITY);
    }

    /**
     * Contains the mail user's other country/region.
     * https://msdn.microsoft.com/en-us/library/office/cc765814.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddressCountry(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_ADDRESS_CITY);
    }

    /**
     * Contains the postal code for the mail user's other postal address.
     * https://msdn.microsoft.com/en-us/library/office/cc842261.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddressPostalCode(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_ADDRESS_POSTAL_CODE);
    }

    /**
     * Contains the name of state or province used in the other address.
     * https://msdn.microsoft.com/en-us/library/office/cc815782.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddressStateOrProvince(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_ADDRESS_STATE_OR_PROVINCE);
    }

    /**
     * Contains the mail user's other street address.
     * https://msdn.microsoft.com/en-us/library/office/cc839546.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddressStreet(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_ADDRESS_STREET);
    }

    /**
     * Contains the post office box for a contact's other address.
     * https://msdn.microsoft.com/en-us/library/office/cc842396.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddressPostOfficeBox(): string {
        return this.getStringItem(OutlookProperties.PR_OTHER_ADDRESS_POST_OFFICE_BOX);
    }

    ///////////////////////////////////////////////////
    // Below are the values from the name to id map...
    ///////////////////////////////////////////////////

    /**
     * Specifies the name under which the contact is filed when displaying a list of contacts.
     * https://msdn.microsoft.com/en-us/library/office/cc842002.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get fileUnder(): string {
        return this.getNamedStringItem(OutlookProperties.PidLidFileUnder);
    }

    /**
     * Specifies the complete address of the contact’s home address.
     * https://msdn.microsoft.com/en-us/library/office/cc839539.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get homeAddress(): string {
        return this.getNamedStringItem(OutlookProperties.PidLidHomeAddress);
    }

    /**
     * Specifies the contact's complete work address.
     * https://msdn.microsoft.com/en-us/library/office/cc815905.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get workAddress(): string {
        return this.getNamedStringItem(OutlookProperties.PidLidWorkAddress);
    }

    /**
     * Specifies the complete address of the contact’s other address.
     * https://msdn.microsoft.com/en-us/library/office/cc815383.aspx
     * @readonly
     * @type {string}
     * @memberof PSTContact
     */
    public get otherAddress(): string {
        return this.getNamedStringItem(OutlookProperties.PidLidOtherAddress);
    }

    /**
     * Specifies which physical address is the contact’s mailing address.
     * https://msdn.microsoft.com/en-us/library/office/cc815430.aspx
     * @readonly
     * @type {number}
     * @memberof PSTContact
     */
    public get postalAddressId(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidPostalAddressId, OutlookProperties.PSETID_Address));
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

    public toJSONstring(): string {
        return (
            'PSTContact: ' +
            JSON.stringify(
                {
                    messageClass: this.messageClass,
                    subject: this.subject,
                    importance: this.importance,
                    transportMessageHeaders: this.transportMessageHeaders,
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
                },
                null,
                2
            ) +
            '\n' +
            super.toJSONstring()
        );
    }
}
