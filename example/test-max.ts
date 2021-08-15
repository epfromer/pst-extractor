import * as fs from 'fs'
import { PSTAttachment } from '../src/PSTAttachment.class'
import { PSTFile } from '../src/PSTFile.class'
import { PSTFolder } from '../src/PSTFolder.class'
import { PSTMessage } from '../src/PSTMessage.class'

// TODO - location of pst files
const pstFolder = 'C:/github/testdata/'
// TODO - if saveToFS true, location to store extracted files
const saveToFS = true
const topOutputFolder = 'C:/github/testdataoutput/'

const verbose = true
const displaySender = true
const displayBody = false
const displayBodyRTF = false
const displayBodyHTML = true
let outputFolder = ''
let depth = -1
let col = 0

// make a top level folder to hold content
try {
  if (saveToFS) {
    fs.mkdirSync(topOutputFolder)
  }
} catch (err) {
  console.error(err)
}

const directoryListing = fs.readdirSync(pstFolder)
directoryListing.forEach((filename) => {
  console.log(pstFolder + filename)

  // time for performance comparison to Java and improvement
  const start = Date.now()
  const pstFile = new PSTFile(pstFolder + filename)

  // make a sub folder for each PST
  try {
    if (saveToFS) {
      outputFolder = topOutputFolder + filename + '/'
      fs.mkdirSync(outputFolder)
    }
  } catch (err) {
    console.error(err)
  }

  console.log(pstFile.getMessageStore().displayName)
  processFolder(pstFile.getRootFolder())

  const end = Date.now()
  console.log('processed in ' + (end - start) + ' ms')
})

/**
 * Walk the folder tree recursively and process emails.
 * @param {PSTFolder} folder
 */
function processFolder(folder: PSTFolder) {
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
      if (verbose) {
        console.log(
          getDepth(depth) +
          'Email: ' +
          email.descriptorNodeId +
          ' - ' +
          email.subject
        )
      } else {
        printDot()
      }

      // sender
      const sender = getSender(email)

      // recipients
      const recipients = getRecipients(email)

      // display body?
      if (displayBody) console.log(email.body)
      if (displayBodyRTF) console.log(email.bodyRTF)
      if (displayBodyHTML) console.log(email.bodyHTML.length)

      // save content to fs?
      if (saveToFS) {
        // create date string in format YYYY-MM-DD
        let strDate = ''
        let d = email.clientSubmitTime
        if (!d && email.creationTime) {
          d = email.creationTime
        }
        if (d) {
          const month = ('0' + (d.getMonth() + 1)).slice(-2)
          const day = ('0' + d.getDate()).slice(-2)
          strDate = d.getFullYear() + '-' + month + '-' + day
        }

        // create a folder for each day (client submit time)
        const emailFolder = outputFolder + strDate + '/'
        if (!fs.existsSync(emailFolder)) {
          try {
            fs.mkdirSync(emailFolder)
          } catch (err) {
            console.error(err)
          }
        }

        doSaveToFS(email, emailFolder, sender, recipients)
      }
      email = folder.getNextChild()
    }
    depth--
  }
  depth--
}

/**
 * Save items to filesystem.
 * @param {PSTMessage} msg
 * @param {string} emailFolder
 * @param {string} sender
 * @param {string} recipients
 */
function doSaveToFS(
  msg: PSTMessage,
  emailFolder: string,
  sender: string,
  recipients: string
) {
  try {
    // save the msg as a txt file
    const filename = emailFolder + msg.descriptorNodeId + '.txt'
    if (verbose) {
      console.log('saving msg to ' + filename)
    }
    const fd = fs.openSync(filename, 'w')
    fs.writeSync(fd, msg.clientSubmitTime + '\r\n')
    fs.writeSync(fd, 'Type: ' + msg.messageClass + '\r\n')
    fs.writeSync(fd, 'From: ' + sender + '\r\n')
    fs.writeSync(fd, 'To: ' + recipients + '\r\n')
    fs.writeSync(fd, 'Subject: ' + msg.subject)
    fs.writeSync(fd, msg.body)
    fs.closeSync(fd)
  } catch (err) {
    console.error(err)
  }

  // walk list of attachments and save to fs
  for (let i = 0; i < msg.numberOfAttachments; i++) {
    const attachment: PSTAttachment = msg.getAttachment(i)
    // Log.debug1(JSON.stringify(activity, null, 2));
    if (attachment.filename) {
      const filename =
        emailFolder + msg.descriptorNodeId + '-' + attachment.longFilename
      if (verbose) {
        console.log('saving attachment to ' + filename)
      }
      try {
        const fd = fs.openSync(filename, 'w')
        const attachmentStream = attachment.fileInputStream
        if (attachmentStream) {
          const bufferSize = 8176
          const buffer = Buffer.alloc(bufferSize)
          let bytesRead
          do {
            bytesRead = attachmentStream.read(buffer)
            fs.writeSync(fd, buffer, 0, bytesRead)
          } while (bytesRead == bufferSize)
          fs.closeSync(fd)
        }
      } catch (err) {
        console.error(err)
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
  let sender = email.senderName
  if (sender !== email.senderEmailAddress) {
    sender += ' (' + email.senderEmailAddress + ')'
  }
  if (verbose && displaySender && email.messageClass === 'IPM.Note') {
    console.log(getDepth(depth) + ' sender: ' + sender)
  }
  return sender
}

/**
 * Get the recipients and display.
 * @param {PSTMessage} email
 * @returns {string}
 */
function getRecipients(email: PSTMessage): string {
  // could walk recipients table, but be fast and cheap
  return email.displayTo
}

/**
 * Print a dot representing a message.
 */
function printDot() {
  process.stdout.write('.')
  if (col++ > 100) {
    console.log('')
    col = 0
  }
}

/**
 * Returns a string with visual indicattion of depth in tree.
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
