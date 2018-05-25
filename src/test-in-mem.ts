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
import { PSTMessage } from './PSTMessage/PSTMessage.class';
import { PSTFile } from './PSTFile/PSTFile.class';
import { PSTFolder } from './PSTFolder/PSTFolder.class';
import { Log } from './Log.class';
import { PSTAttachment } from './PSTAttachment/PSTAttachment.class';
import * as fs from 'fs';
import { PSTRecipient } from './PSTRecipient/PSTRecipient.class';

const pstFolder = '/media/sf_Outlook/test/';
const topOutputFolder = '/media/sf_Outlook/pst-extractor/';
let outputFolder = '';
const saveToFS = false;
const displaySender = true;
const displayRecipients = true;
const displayBody = false;
const verbose = true;
let depth = -1;
let col = 0;

// make a top level folder to hold content
try {
    if (saveToFS) {
        fs.mkdirSync(topOutputFolder);
    }
} catch (err) {
    Log.error(err);
}

let directoryListing = fs.readdirSync(pstFolder);
directoryListing.forEach(filename => {
    console.log(pstFolder + filename);

    // time for performance comparison to Java and improvement
    const start = Date.now();

    // load file into memory buffer, then open as PSTFile
    let pstFile = new PSTFile(fs.readFileSync(pstFolder + filename));

    // make a sub folder for each PST
    try {
        if (saveToFS) {
            outputFolder = topOutputFolder + filename + '/';
            fs.mkdirSync(outputFolder);
        }
    } catch (err) {
        Log.error(err);
    }

    console.log(pstFile.getMessageStore().displayName);
    processFolder(pstFile.getRootFolder());

    const end = Date.now();
    console.log('processed in ' + (end - start) + ' ms');
});

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
            if (verbose) {
                console.log(getDepth(depth) + 'Email: ' + email.descriptorNodeId + ' - ' + email.subject);
            } else {
                printDot();
            }

            // sender
            let sender = getSender(email);

            // recipients
            let recipients = getRecipients(email);

            // display body?
            if (verbose && displayBody) {
                console.log(email.body);
                console.log(email.bodyRTF);
            }

            // save content to fs?
            if (saveToFS) {
                // create date string in format YYYY-MM-DD
                let strDate = '';
                let d = email.clientSubmitTime;
                if (!d && email.creationTime) {
                    d = email.creationTime;
                }
                if (d) {
                    const month = ('0' + (d.getMonth()+1)).slice(-2);
                    const day = ('0' + d.getDate()).slice(-2);
                    strDate = d.getFullYear() + '-' + month + '-' + day;
                }

                // create a folder for each day (client submit time)
                const emailFolder = outputFolder + strDate + '/';
                if (!fs.existsSync(emailFolder)) {
                    try {
                        fs.mkdirSync(emailFolder);
                    } catch (err) {
                        Log.error(err);
                    }
                }

                doSaveToFS(email, emailFolder, sender, recipients);
            }
            email = folder.getNextChild();
        }
        depth--;
    }
    depth--;
}

/**
 * Save items to filesystem.
 * @param {PSTMessage} msg 
 * @param {string} emailFolder 
 * @param {string} sender 
 * @param {string} recipients 
 */
function doSaveToFS(msg: PSTMessage, emailFolder: string, sender: string, recipients: string) {
    try {
        // save the msg as a txt file
        const filename = emailFolder + msg.descriptorNodeId + '.txt';
        if (verbose) {
            console.log('saving msg to ' + filename);
        }
        const fd = fs.openSync(filename, 'w');
        fs.writeSync(fd, msg.clientSubmitTime + '\r\n');
        fs.writeSync(fd, 'Type: ' + msg.messageClass + '\r\n');
        fs.writeSync(fd, 'From: ' + sender + '\r\n');
        fs.writeSync(fd, 'To: ' + recipients + '\r\n');
        fs.writeSync(fd, 'Subject: ' + msg.subject);
        fs.writeSync(fd, msg.body);
        fs.closeSync(fd);
    } catch (err) {
        Log.error(err);
    }

    // walk list of attachments and save to fs
    for (let i = 0; i < msg.numberOfAttachments; i++) {
        const attachment: PSTAttachment = msg.getAttachment(i);
        // Log.debug1(JSON.stringify(activity, null, 2));
        if (attachment.filename) {
            const filename = emailFolder + msg.descriptorNodeId + '-' + attachment.longFilename;
            if (verbose) {
                console.log('saving attachment to ' + filename);
            }
            try {
                const fd = fs.openSync(filename, 'w');
                const attachmentStream = attachment.fileInputStream;
                if (attachmentStream) {
                    const bufferSize = 8176;
                    const buffer = new Buffer(bufferSize);
                    let bytesRead;
                    do {
                        bytesRead = attachmentStream.read(buffer);
                        fs.writeSync(fd, buffer, 0, bytesRead);
                    } while (bytesRead == bufferSize);
                    fs.closeSync(fd);
                }
            } catch (err) {
                Log.error(err);
            }
        }
    }
}

/**
 * Get the sender and display.
 * @param {PSTMessage} email 
 * @returns {string} 
 */
function getSender(email: PSTMessage): string {

    let sender = email.senderName;
    if (sender !== email.senderEmailAddress) {
        sender += ' (' + email.senderEmailAddress + ')';
    }
    if (verbose && displaySender && email.messageClass === 'IPM.Note') {
        console.log(getDepth(depth) + ' sender: ' + sender);
    }
    return sender;
}

/**
 * Get the recipients and display.
 * @param {PSTMessage} email 
 * @returns {string} 
 */
function getRecipients(email: PSTMessage): string {
    // could walk recipients table, but be fast and cheap
    return email.displayTo;
}

/**
 * Print a dot representing a message.
 */
function printDot() {
    process.stdout.write('.');
    if (col++ > 100) {
        console.log('');
        col = 0;
    }
}

/**
 * Returns a string with visual indicattion of depth in tree.
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
