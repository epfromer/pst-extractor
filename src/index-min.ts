import { PSTMessage } from './app/PSTMessage/PSTMessage.class';
import { PSTFile } from './app/PSTFile/PSTFile.class';
import { PSTFolder } from './app/PSTFolder/PSTFolder.class';
const resolve = require('path').resolve;

let depth = -1;
let col = 0;

const pstFile = new PSTFile(resolve('./src/testdata/michelle_lokay_000_1_1_1_1.pst'));
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
