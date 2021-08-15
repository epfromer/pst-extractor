import { PSTMessage } from '../src/PSTMessage.class'
import { PSTFile } from '../src/PSTFile.class'
import { PSTFolder } from '../src/PSTFolder.class'
const resolve = require('path').resolve

let depth = -1
let col = 0

/**
 * Returns a string with visual indication of depth in tree.
 * @param {number} depth
 * @returns {string}
 */
function getDepth(depth: number): string {
  let sdepth = ''
  if (col > 0) {
    col = 0
    sdepth += '\n'
  }
  for (let x = 0; x < depth - 1; x++) {
    sdepth += ' | '
  }
  sdepth += ' |- '
  return sdepth
}

/**
 * Walk the folder tree recursively and process emails.
 * @param {PSTFolder} folder
 */
function processFolder(folder: PSTFolder): void {
  depth++

  // the root folder doesn't have a display name
  if (depth > 0) {
    console.log(getDepth(depth) + folder.displayName)
  }

  // go through the folders...
  if (folder.hasSubfolders) {
    const childFolders: PSTFolder[] = folder.getSubFolders()
    for (const childFolder of childFolders) {
      processFolder(childFolder)
    }
  }

  // and now the emails for this folder
  if (folder.contentCount > 0) {
    depth++
    let email: PSTMessage = folder.getNextChild()
    while (email != null) {
      console.log(
        getDepth(depth) +
          'Sender: ' +
          email.senderName +
          ', Subject: ' +
          email.subject
      )
      email = folder.getNextChild()
    }
    depth--
  }
  depth--
}

console.log('======================= Enron =======================')
const pstFile1 = new PSTFile(resolve('./testdata/enron.pst'))
console.log(pstFile1.getMessageStore().displayName)
processFolder(pstFile1.getRootFolder())

console.log('======================= Repeating events, attachments =======================')
const pstFile2 = new PSTFile(resolve('./testdata/pstextractortest@outlook.com.ost'))
console.log(pstFile2.getMessageStore().displayName)
processFolder(pstFile2.getRootFolder())