import * as fs from 'fs';

export class PSTFile {
    public static ENCRYPTION_TYPE_NONE: number = 0;
    public static ENCRYPTION_TYPE_COMPRESSIBLE: number = 1;
    static MESSAGE_STORE_DESCRIPTOR_IDENTIFIER: number = 33;
    static ROOT_FOLDER_DESCRIPTOR_IDENTIFIER: number = 290;
    public static PST_TYPE_ANSI: number = 14;
    static PST_TYPE_ANSI_2: number = 15;
    public static PST_TYPE_UNICODE: number = 23;
    public static PST_TYPE_2013_UNICODE: number = 36;
    public static PS_PUBLIC_STRINGS: number = 0;
    public static PSETID_Common: number = 1;
    public static PSETID_Address: number = 2;
    public static PS_INTERNET_HEADERS: number = 3;
    public static PSETID_Appointment: number = 4;
    public static PSETID_Meeting: number = 5;
    public static PSETID_Log: number = 6;
    public static PSETID_Messaging: number = 7;
    public static PSETID_Note: number = 8;
    public static PSETID_PostRss: number = 9;
    public static PSETID_Task: number = 10;
    public static PSETID_UnifiedMessaging: number = 11;
    public static PS_MAPI: number = 12;
    public static PSETID_AirSync: number = 13;
    public static PSETID_Sharing: number = 14;

    public constructor(fileName: string) {
        // attempt to open file
        // confirm first 4 bytes are !BDN
        let data = '';
        let stream = fs.createReadStream(fileName, { start: 0, end: 3 });
        stream.on('error', function() {
            throw new Error('Error opening ' + fileName);
        });
        stream.on('data', function(chunk) {
            if (chunk != '!BDN') {
                throw new Error(
                    'Invalid file header: ' + chunk + ', expected: !BDN'
                );
            }
        });
    }
}
