import * as chai from 'chai'
import { PSTFile } from '../PSTFile.class'
import { PSTFolder } from '../PSTFolder.class'
import { PSTTask } from '../PSTTask.class'
const resolve = require('path').resolve
const expect = chai.expect
let pstFile: PSTFile
let folder: PSTFolder

before(() => {
  pstFile = new PSTFile(
    resolve('./src/__tests__/testdata/mtnman1965@outlook.com.ost')
  )

  // get to Tasks folder
  let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders()
  folder = childFolders[1] // Root - Mailbox
  childFolders = folder.getSubFolders()
  folder = childFolders[4] // IPM_SUBTREE
  childFolders = folder.getSubFolders()
  folder = childFolders[17] // Tasks
})

after(() => {
  pstFile.close()
})

describe('PSTTask tests', () => {
  it('should have a Tasks folder', () => {
    expect(folder.displayName).toEqual('Tasks')
  })

  it('should have two tasks', () => {
    // fully loaded task
    let task: PSTTask = folder.getNextChild()
    // Log.debug1(JSON.stringify(task, null, 2));
    expect(task.messageClass).toEqual('IPM.Task')
    expect(task.subject).toEqual('fully loaded task')
    expect(task.isTaskRecurring).to.be.true
    expect(task.isTaskComplete).to.be.false
    expect(task.taskOwner).toEqual('Mountain Man')
    expect(task.taskStatus).toEqual(1) // started
    expect(task.percentComplete).toEqual(0.75)
    expect(task.bodyPrefix).to.contain(
      'Blue category, high priority, 75% complete'
    )

    // basic task
    task = folder.getNextChild()
    // Log.debug1(JSON.stringify(task, null, 2));
    expect(task.messageClass).toEqual('IPM.Task')
    expect(task.subject).toEqual('basic task')
    expect(task.isTaskRecurring).to.be.false
    expect(task.isTaskComplete).to.be.false
    expect(task.taskOwner).toEqual('Mountain Man')
    expect(task.taskStatus).toEqual(0) // not started
    expect(task.bodyPrefix).to.contain('Vanilla task, not started')
    expect(task.importance).toEqual(1)
    expect(task.percentComplete).toEqual(0)
    expect(task.taskActualEffort).toEqual(0)
    expect(task.taskEstimatedEffort).toEqual(0)
    expect(task.taskVersion).toEqual(5)
    expect(task.taskOrdinal).toEqual(4294963296)
    expect(task.taskOwnership).toEqual(0)
    expect(task.acceptanceState).toEqual(0)
    expect(task.transportMessageHeaders).toEqual('')
    expect(task.taskAssigner).toEqual('')
    expect(task.taskLastUser).toEqual('')
    expect(task.isTaskComplete).to.be.false
    expect(task.isTaskRecurring).to.be.false
    expect(task.taskDateCompleted).toEqual(null)
  })
})
