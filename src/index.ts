import { PSTFile } from './app/PSTFile/PSTFile.class';
import { PSTFolder } from './app/PSTFolder/PSTFolder.class';
import { Log } from './app/Log.class';

let depth = -1;

let pstFile = new PSTFile('/home/ed/Desktop/outlook/2005-02.pst');
pstFile.open();
console.log(pstFile.getMessageStore().getDisplayName());
processFolder(pstFile.getRootFolder());
debugger;
console.log('exiting');

function processFolder(folder: PSTFolder) {
    depth++;

    debugger;

    // the root folder doesn't have a display name
    if (depth > 0) {
        printDepth();
        console.log(folder.getDisplayName());
    }

    // go through the folders...
    if (folder.hasSubfolders()) {
        let childFolders: PSTFolder[] = folder.getSubFolders();
        for (let childFolder of childFolders) {
            printDepth();
            processFolder(childFolder);
        }
    }

    // // and now the emails for this folder
    // if (folder.getContentCount() > 0) {
    //     this.depth++;
    //     PSTMessage email = (PSTMessage) folder.getNextChild();
    //     while (email != null) {
    //         this.printDepth();
    //         System.out.println("Email: " + email.getDescriptorNodeId() + " - " + email.getSubject());
    //         email = (PSTMessage) folder.getNextChild();
    //     }
    //     this.depth--;
    // }

    depth--;
}

function printDepth() {}
