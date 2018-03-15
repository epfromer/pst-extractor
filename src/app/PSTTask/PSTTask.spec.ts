import * as chai from 'chai';
import * as mocha from 'mocha';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
import { PSTTask } from './PSTTask.class';
import { Log } from '../Log.class';
const resolve = require('path').resolve
const expect = chai.expect;
let pstFile: PSTFile;
let folder: PSTFolder;

before(() => {
    pstFile = new PSTFile(resolve('./src/testdata/mtnman1965@outlook.com.ost'));

    // get to Tasks folder
    let childFolders: PSTFolder[] = pstFile.getRootFolder().getSubFolders();
    folder = childFolders[1];  // Root - Mailbox
    childFolders = folder.getSubFolders();
    folder = childFolders[4];  // IPM_SUBTREE
    childFolders = folder.getSubFolders();
    folder = childFolders[17];  // Tasks
});

after(() => {
    pstFile.close();
});

describe('PSTTask tests', () => {
    it('should have a Tasks folder', () => {
        expect(folder.displayName).to.equal('Tasks');
    });

    it('should have two tasks', () => {
        // fully loaded task
        let task: PSTTask = folder.getNextChild();
        Log.debug1(JSON.stringify(task, null, 2));
        Log.error('foo')
        expect(task.messageClass).to.equal('IPM.Task');
        expect(task.subject).to.equal('fully loaded task');
        expect(task.isTaskRecurring).to.be.true;
        expect(task.isTaskComplete).to.be.false;
        expect(task.taskOwner).to.equal('Mountain Man');
        expect(task.taskStatus).to.equal(1); // started
        expect(task.percentComplete).to.equal(0.75);
        expect(task.bodyPrefix).to.contain('Blue category, high priority, 75% complete');

        // basic task
        task = folder.getNextChild();
        // Log.debug1(JSON.stringify(task, null, 2));
        expect(task.messageClass).to.equal('IPM.Task')
        expect(task.subject).to.equal('basic task')
        expect(task.isTaskRecurring).to.be.false;
        expect(task.isTaskComplete).to.be.false;
        expect(task.taskOwner).to.equal('Mountain Man');
        expect(task.taskStatus).to.equal(0); // not started
        expect(task.bodyPrefix).to.contain('Vanilla task, not started');
        expect(task.importance).to.equal(1); 
        expect(task.percentComplete).to.equal(0); 
        expect(task.taskActualEffort).to.equal(0); 
        expect(task.taskEstimatedEffort).to.equal(0); 
        expect(task.taskVersion).to.equal(5); 
        expect(task.taskOrdinal).to.equal(4294963296); 
        expect(task.taskOwnership).to.equal(0); 
        expect(task.acceptanceState).to.equal(0); 
        expect(task.transportMessageHeaders).to.equal('');
        expect(task.taskAssigner).to.equal('');
        expect(task.taskLastUser).to.equal('');
        expect(task.isTaskComplete).to.be.false;
        expect(task.isTaskRecurring).to.be.false;
        expect(task.taskDateCompleted).to.equal(null);
    });
});