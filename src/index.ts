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
import { PSTMessage } from './app/PSTMessage/PSTMessage.class';
import { PSTFile } from './app/PSTFile/PSTFile.class';
import { PSTFolder } from './app/PSTFolder/PSTFolder.class';
import { Log } from './app/Log.class';
import { PSTAttachment } from './app/PSTAttachment/PSTAttachment.class';
import * as fs from 'fs';
import * as fsext from 'fs-ext';

let depth = -1;
let tmpDirIndex = 1;
let saveAttachmentsToFS = false;
let verbose = true;
let col = 0;

// make a temp dir for the attachments
try {
    if (saveAttachmentsToFS) {
        fs.mkdirSync('/media/sf_Outlook/0pst-extractor/');
    }
} catch (err) {
    Log.debug1(err);
}

let directoryListing = fs.readdirSync('/media/sf_Outlook/test');
directoryListing.forEach(filename => {
    console.log('/media/sf_Outlook/test/' + filename);
    const start = Date.now();
    let pstFile = new PSTFile('/media/sf_Outlook/test/' + filename);
    console.log(pstFile.getMessageStore().getDisplayName());
    processFolder(pstFile.getRootFolder());
    const end = Date.now();
    console.log('processed in ' + (end - start) + ' ms');
});

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
                if (email.descriptorNodeId.equals(2106532)) {
                    console.log(email.toJSONstring());
                    debugger;
                }
            } else {
                printDot();
            }
            if (email.hasAttachments && saveAttachmentsToFS) {
                // make a temp dir for the attachments
                try {
                    fs.mkdirSync('/media/sf_Outlook/0pst-extractor/' + tmpDirIndex);
                } catch (err) {
                    Log.debug1(err);
                }

                // walk list of attachments and save to fs
                for (let i = 0; i < email.numberOfAttachments; i++) {
                    let attachment: PSTAttachment = email.getAttachment(i);
                    Log.debug1(attachment.toJSONstring());
                    if (attachment.filename) {
                        let filename = '/media/sf_Outlook/0pst-extractor/' + tmpDirIndex + '/' + attachment.filename;
                        if (verbose) {
                            Log.debug1('saving attachment to ' + filename);
                        }

                        let fd = fsext.openSync(filename, 'w');
                        let attachmentStream = attachment.fileInputStream;
                        let bufferSize = 8176;
                        let buffer = new Buffer(bufferSize);
                        let bytesRead;
                        do {
                            bytesRead = attachmentStream.read(buffer);
                            fsext.writeSync(fd, buffer, 0, bytesRead);
                        } while (bytesRead == bufferSize);
                        fsext.closeSync(fd);
                    }
                }
                tmpDirIndex++;
            }
            email = folder.getNextChild();
        }
        depth--;
    }
    depth--;
}

function printDot() {
    process.stdout.write('.');
    if (col++ > 100) {
        console.log('');
        col = 0;
    }
}

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
