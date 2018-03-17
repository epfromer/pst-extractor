# pst-extractor

![npm](https://img.shields.io/npm/v/pst-extractor.svg) ![license](https://img.shields.io/npm/l/pst-extractor.svg) ![github-issues](https://img.shields.io/github/issues/epfromer/pst-extractor.svg)  ![Circle CI build status](https://circleci.com/gh/epfromer/pst-extractor.svg?style=svg)

Extract objects from MS Outlook/Exchange PST files

![nodei.co](https://nodei.co/npm/pst-extractor.png?downloads=true&downloadRank=true&stars=true)

![travis-status](https://img.shields.io/travis/epfromer/pst-extractor.svg)
![stars](https://img.shields.io/github/stars/epfromer/pst-extractor.svg)
![forks](https://img.shields.io/github/forks/epfromer/pst-extractor.svg)

![forks](https://img.shields.io/github/forks/epfromer/pst-extractor.svg)

![](https://david-dm.org/epfromer/pst-extractor/status.svg)
![](https://david-dm.org/epfromer/pst-extractor/dev-status.svg)

## Features

Extract objects from MS Outlook/Exchange PST files.

This is based off the code from https://github.com/rjohnsondev/java-libpst. Thanks to Richard Johnson and Orin Eman.

A spec from Microsoft on the PST file format is at https://msdn.microsoft.com/en-us/library/ff385210(v=office.12).aspx.

## Install

`npm install --save pst-extractor`

## Usage

Start with test.ts for sample code to walk the PST and print out the folder structure to the console. Also, most of the major objects have Mocha test specs which show how the object attributes can be accessed.

A simple test-min.ts script like this.

```
import { PSTMessage } from 'pst-extractor';
import { PSTFile } from 'pst-extractor';
import { PSTFolder } from 'pst-extractor';
const resolve = require('path').resolve;

let depth = -1;
let col = 0;

const pstFile = new PSTFile(resolve('/path/to/some/pst.pst'));
console.log(pstFile.getMessageStore().displayName);
processFolder(pstFile.getRootFolder());

/**
 * Walk the folder tree recursively and process emails.
 * @param {PSTFolder} folder
 */
function processFolder(folder: PSTFolder) {
    depth++;

    // the root folder doesn't have a display name
    if (depth > 0) {
        console.log(getDepth(depth) + folder.displayName);
    }

    // go through the folders...
    if (folder.hasSubfolders) {
        let childFolders: PSTFolder[] = folder.getSubFolders();
        for (let childFolder of childFolders) {
            processFolder(childFolder);
        }
    }

    // and now the emails for this folder
    if (folder.contentCount > 0) {
        depth++;
        let email: PSTMessage = folder.getNextChild();
        while (email != null) {
            console.log(getDepth(depth) + 
                'Sender: ' + email.senderName + 
                ', Subject: ' + email.subject);
            email = folder.getNextChild();
        }
        depth--;
    }
    depth--;
}

/**
 * Returns a string with visual indication of depth in tree.
 * @param {number} depth
 * @returns {string}
 */
function getDepth(depth: number): string {
    let sdepth = '';
    if (col > 0) {
        col = 0;
        sdepth += '\n';
    }
    for (let x = 0; x < depth - 1; x++) {
        sdepth += ' | ';
    }
    sdepth += ' |- ';
    return sdepth;
}
```
will generate the following output:
```
Personal folders
 |- Top of Personal Folders
 |  |- Deleted Items
 |  |- lokay-m
 |  |  |- MLOKAY (Non-Privileged)
 |  |  |  |- TW-Commercial Group
 |  |  |  |  |- Sender: Lee  Dennis, Subject: New OBA's
 |  |  |  |  |- Sender: Reames Julie, Subject: I/B Link Capacity for November and December 2001
 |  |  |  |  |- Sender: dlsmith@pplweb.com, Subject: West Texas Capacity
 |  |  |  |  |- Sender: Buehler  Craig, Subject: EOL Confirmation -Transwestern Pipeline Company
 |  |  |  |  |- Sender: Buehler  Craig, Subject: EOL Confirmation -Transwestern Pipeline Company
 |  |  |  |  |- Sender: Brostad  Karen, Subject: New PNR points for Transwestern
 |  |  |  |  |- Sender: Frazier  Perry, Subject: RR expansion contracts.
 |  |  |  |  |- Sender: Buehler  Craig, Subject: TW EOLs
 |  |  |  |  |- Sender: Lokay, Subject: Bullets 10/26/01
 |  |  |  |  |- Sender: Frazier  Perry, Subject: Verify RR expansion cr's for ROFR.
 |  |  |  |  |- Sender: Frazier  Perry, Subject: Red Rock Adm. cr # 27698 revisions.
 |  |  |  |  |- Sender: Moore, Subject: TW Weekly Report for October 26, 2001
 |  |  |  |  |- Sender: Cabrera  Reyna, Subject: FW: New PNR points for Transwestern
 |  |  |  |  |- Sender: Lee  Dennis, Subject: TW administrative contract # 27698
 |  |  |  |- Systems
 |  |  |  |  |- Sender: ETS General Announcement/ET&S/Enron@ENRON, Subject: How to prepare your expense report
 |  |  |  |  |- Sender: Carl Carter, Subject: eRequest
 |  |  |  |  |- Sender: Puthigai  Savita, Subject: EnronOnline -Stack Manager Changes
 |  |  |  |  |- Sender: Enron Announcements/Corp/Enron@ENRON, Subject: LIM Software Upgrade Notice
 |  |  |  |  |- Sender: Lee  Dennis, Subject: Sending customer information from ENVISION
 |  |  |  |  |- Sender: Enron Global Technology@ENRON, Subject: Email Retention Policy
 |  |  |  |  |- Sender: Enron Messaging Administration, Subject: Supported Internet Email Addresses
 |  |  |  |- Sent Items
 |  |  |  |  |- Sender: Lokay, Subject: Cirque du Soleil - Dralion
 |  |  |  |  |- Sender: Lokay, Subject: Accepted: Updated: Finalize Transwestern Presentations
 |  |  |  |- Personal
 |  |  |  |  |- Sender: Jim Lokay jimbomania@hotmail.com@ENRON, Subject: Fwd: Enjoy fall in an Alamo midsize car -- just $169 a week!
 |  |  |  |  |- Sender: cbulf, Subject: TRIP INFO
 |  |  |  |  |- Sender: Michelle Lokay, Subject: Check out page 7!
 |  |  |  |  |- Sender: ClickAtHome, Subject: ClickAtHome is Coming Soon!
 |  |  |  |  |- Sender: Lisa Norwood, Subject: contact
 |  |  |  |  |- Sender: Jim Lokay jimboman@bigfoot.com@ENRON, Subject: [Fwd: New email address - again!]
 |  |  |  |  |- Sender: Jim Lokay jimboman@bigfoot.com@ENRON, Subject: file
 |  |  |  |  |- Sender: Enron Announcements/Corp/Enron@ENRON, Subject: An Opportunity to Change Your Electricity Provider
 |  |  |  |  |- Sender: James Lokay jlokay@yahoo.com@ENRON, Subject: Fwd: RE: Party Request-the Galleria - Sat 8/11/2001 4:00 PM
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: links
 |  |  |  |  |- Sender: Clickathome,, Subject: Re: Time Warner Cable question
 |  |  |  |  |- Sender: Ramirez  Pilar, Subject: RE: Good Web
 |  |  |  |  |- Sender: Schoolcraft  Darrell, Subject: Wedding
 |  |  |  |  |- Sender: PostOffice@DILBERT.COM@ENRON, Subject: Dilbert Strip from Jim is waiting for you!
 |  |  |  |  |- Sender: Lokay, Subject: eBay item 576466888 (Ends Apr-10-01 104814 PDT) - !!!!Green Is In!!!!! Erin Bud
 |  |  |  |  |- Sender: Lokay, Subject: eBay item 576853567 (Ends Apr-09-01 134449 PDT) - TY Beanie Buddies ERIN Buddy!
 |  |  |  |  |- Sender: Lokay, Subject: eBay item 577532611 (Ends Apr-09-01 175133 PDT) - VALENTINA BUDDY beanie buddie
 |  |  |  |  |- Sender: Lokay, Subject: eBay item 577242315 (Ends Apr-12-01 175442 PDT) - Ty Beanie Buddy & Baby - Vale
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: scans
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: Re: VALENTINA BUDDY beanie buddies RETIRED  Item #577532611
 |  |  |  |  |- Sender: Lokay, Subject: Job Opportunity?
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: Quickie
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: In case you needed to know...
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: graphic
 |  |  |  |  |- Sender: Hitschel  Bonnie V. BHitschel@tesoropetroleum.com@ENRON, Subject: RE:FIESTA
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: Houston
 |  |  |  |  |- Sender: Fawcett  Jeffery, Subject: California Sing-along
 |  |  |  |  |- Sender: Loe  David DLoe@UtiliCorp.com@ENRON, Subject: FW: ONEOK ski trip
 |  |  |  |  |- Sender: Loe  David DLoe@UtiliCorp.com@ENRON, Subject: FW: ONEOK ski trip
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: unit for sale
 |  |  |  |  |- Sender: Hitschel  Bonnie V. BHitschel@tesoropetroleum.com@ENRON, Subject: FW: Even For You
 |  |  |  |  |- Sender: Jennifer Smith @ENRON, Subject: Learn Technical Analysis, Early Bird Special for Houston Class
 |  |  |  |  |- Sender: Watson  Kimberly, Subject: Lindy's B-day
 |  |  |  |  |- Sender: Ramirez  Pilar, Subject: FW: Breast Cancer
 |  |  |  |  |- Sender: Jim Lokay Lokay@bigfoot.com@ENRON, Subject: unverified news report
 |  |  |  |  |- Sender: Lokay, Subject: Accomplishments for Year 2001, as of 05/10
 |  |  |  |  |- Sender: Lokay, Subject: Rose Rec
 |  |  |  |  |- Sender: Hitschel  Bonnie V. BHitschel@tesoropetroleum.com@ENRON, Subject: Voluntary Spyware
 |  |  |  |  |- Sender: Yee  Danny danny.yee@sap.com@ENRON, Subject: Possible Spreadsheet
 |  |  |  |  |- Sender: eserver@enron.com@ENRON, Subject: <<Concur Expense Document>> - Expense060501
 |  |  |  |  |- Sender: Hitschel  Bonnie V. BHitschel@tesoropetroleum.com@ENRON, Subject: Just for fun
 |  |  |  |  |- Sender: Stevens  Missy, Subject: RE: Enron Efforts to the Flood victims
 |  |  |  |  |- Sender: Stuart  Charla, Subject: RE: OPEN ENROLLMENT FOR ENRON KIDS' CENTER IS UNDERWAY!!!
 |  |  |  |  |- Sender: Goradia, Subject: 
 |  |  |  |  |- Sender: jacammarano@pplweb.com@ENRON, Subject: Invitation to Golf Outing
 |  |  |  |  |- Sender: Horton  Stanley, Subject: GOOD JOB!
 |  |  |  |  |- Sender: tsschuler@pplweb.com@ENRON, Subject: PPL EnergyPlus Golf Outing
 |  |  |  |- Sender: Mailbox - Ftenergy1, Subject: Power Mart '01 - Register online for your FREE exhibition pass!
 |- Search Root
 |- SPAM Search Folder 2
```

## Scripts

 - **npm run build** : `tsc`
 - **npm run test** : `nyc --reporter=html mocha --opts mocha.opts`
 - **npm run readme** : `node ./node_modules/.bin/node-readme`

## Dependencies

Package | Version | Dev
--- |:---:|:---:
[fs-ext](https://www.npmjs.com/package/fs-ext) | ^1.0.0 | ✖
[long](https://www.npmjs.com/package/long) | ^4.0.0 | ✖
[math-float64-from-bits](https://www.npmjs.com/package/math-float64-from-bits) | ^1.0.0 | ✖
[uuid-parse](https://www.npmjs.com/package/uuid-parse) | ^1.0.0 | ✖
[winston](https://www.npmjs.com/package/winston) | ^2.4.1 | ✖
[winston-loggly](https://www.npmjs.com/package/winston-loggly) | ^1.3.1 | ✖
[winston-loggly-bulk](https://www.npmjs.com/package/winston-loggly-bulk) | ^2.0.2 | ✖
[@types/chai](https://www.npmjs.com/package/@types/chai) | ^4.1.2 | ✔
[@types/debug](https://www.npmjs.com/package/@types/debug) | 0.0.30 | ✔
[@types/fs-ext](https://www.npmjs.com/package/@types/fs-ext) | 0.0.29 | ✔
[@types/long](https://www.npmjs.com/package/@types/long) | ^3.0.32 | ✔
[@types/mocha](https://www.npmjs.com/package/@types/mocha) | ^2.2.48 | ✔
[@types/node](https://www.npmjs.com/package/@types/node) | ^9.4.7 | ✔
[@types/typescript](https://www.npmjs.com/package/@types/typescript) | ^2.0.0 | ✔
[@types/winston](https://www.npmjs.com/package/@types/winston) | ^2.3.8 | ✔
[chai](https://www.npmjs.com/package/chai) | ^4.1.2 | ✔
[chai-datetime](https://www.npmjs.com/package/chai-datetime) | ^1.5.0 | ✔
[debug](https://www.npmjs.com/package/debug) | ^3.1.0 | ✔
[mocha](https://www.npmjs.com/package/mocha) | ^5.0.4 | ✔
[node-readme](https://www.npmjs.com/package/node-readme) | ^0.1.9 | ✔
[nyc](https://www.npmjs.com/package/nyc) | ^11.6.0 | ✔
[source-map-support](https://www.npmjs.com/package/source-map-support) | ^0.5.4 | ✔
[supports-color](https://www.npmjs.com/package/supports-color) | ^5.3.0 | ✔
[ts-node](https://www.npmjs.com/package/ts-node) | ^5.0.1 | ✔
[typescript](https://www.npmjs.com/package/typescript) | ^2.7.2 | ✔


## Contributing

Contributions welcome; Please submit all pull requests the against master branch. If your pull request contains JavaScript patches or features, you should include relevant unit tests. Please check the [Contributing Guidelines](contributing.md) for more details. Thanks!

## Author

Ed Pfromer, epfromer@gmail.com

## License

 - **(Apache-2.0 OR GPL-3.0)** : null
