import * as fs from 'fs'
import { PSTMessage } from '../src/PSTMessage.class'
import { PSTFile } from '../src/PSTFile.class'
import { PSTFolder } from '../src/PSTFolder.class'
const resolve = require('path').resolve

const pstFolder = './testdata/'
const topOutputFolder = './testdataoutput/'
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

const directoryListing = fs.readdirSync(pstFolder)
directoryListing.forEach((filename) => {
  if (filename.endsWith('.pst') || filename.endsWith('.ost')) {
    console.log(pstFolder + filename)

    // time for performance comparison to Java and improvement
    const start = Date.now()

    // load file into memory buffer, then open as PSTFile
    const pstFile = new PSTFile(fs.readFileSync(pstFolder + filename))

    console.log(pstFile.getMessageStore().displayName)
    processFolder(pstFile.getRootFolder())

    const end = Date.now()
    console.log(pstFolder + filename + ' processed in ' + (end - start) + ' ms')
  }
})
