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
import { PSTFile } from './../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { OutlookProperties } from '../OutlookProperties';

export class PSTTask extends PSTMessage {
    /**
     * Creates an instance of PSTTask.
     * @param {PSTFile} pstFile 
     * @param {DescriptorIndexNode} descriptorIndexNode 
     * @param {PSTTableBC} [table] 
     * @param {Map<number, PSTDescriptorItem>} [localDescriptorItems] 
     * @memberof PSTTask
     */
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    /**
     * Specifies the status of the user's progress on the task.
     * https://msdn.microsoft.com/en-us/library/office/cc842120.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get taskStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskStatus, PSTFile.PSETID_Task));
    }

    /**
     * Indicates the progress the user has made on a task.
     * https://msdn.microsoft.com/en-us/library/office/cc839932.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get percentComplete(): number {
        return this.getDoubleItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidPercentComplete, PSTFile.PSETID_Task));
    }

    /**
     * Specifies the date when the user completes the task.
     * https://msdn.microsoft.com/en-us/library/office/cc815753.aspx
     * @readonly
     * @type {Date}
     * @memberof PSTTask
     */
    public get taskDateCompleted(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskDateCompleted, PSTFile.PSETID_Task));
    }

    /**
     * Indicates the number of minutes that the user performed a task.
     * https://msdn.microsoft.com/en-us/library/office/cc842253.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get taskActualEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskActualEffort, PSTFile.PSETID_Task));
    }

    /**
     * Indicates the amount of time, in minutes, that the user expects to perform a task.
     * https://msdn.microsoft.com/en-us/library/office/cc842485.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get taskEstimatedEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskEstimatedEffort, PSTFile.PSETID_Task));
    }

    /**
     * Indicates which copy is the latest update of a task.
     * https://msdn.microsoft.com/en-us/library/office/cc815510.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get taskVersion(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskVersion, PSTFile.PSETID_Task));
    }

    /**
     * Indicates the task is complete.
     * https://msdn.microsoft.com/en-us/library/office/cc839514.aspx
     * @readonly
     * @type {boolean}
     * @memberof PSTTask
     */
    public get isTaskComplete(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskComplete, PSTFile.PSETID_Task));
    }

    /**
     * Contains the name of the task owner.
     * https://msdn.microsoft.com/en-us/library/office/cc842363.aspx
     * @readonly
     * @type {string}
     * @memberof PSTTask
     */
    public get taskOwner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskOwner, PSTFile.PSETID_Task));
    }

    /**
     * Names the user who was last assigned the task.
     * https://msdn.microsoft.com/en-us/library/office/cc815865.aspx
     * @readonly
     * @type {string}
     * @memberof PSTTask
     */
    public get taskAssigner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskAssigner, PSTFile.PSETID_Task));
    }

    /**
     * Names the most recent user who was the task owner.
     * https://msdn.microsoft.com/en-us/library/office/cc842278.aspx
     * @readonly
     * @type {string}
     * @memberof PSTTask
     */
    public get taskLastUser(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskLastUser, PSTFile.PSETID_Task));
    }

    /**
     * Provides an aid to custom sorting tasks.
     * https://msdn.microsoft.com/en-us/library/office/cc765654.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get taskOrdinal(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskOrdinal, PSTFile.PSETID_Task));
    }

    /**
     * Indicates whether the task includes a recurrence pattern.
     * https://msdn.microsoft.com/en-us/library/office/cc765875.aspx
     * @type {boolean}
     * @memberof PSTTask
     */
    public get isTaskRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskFRecurring, PSTFile.PSETID_Task));
    }

    /**
     * Indicates the role of the current user relative to the task.
     * https://msdn.microsoft.com/en-us/library/office/cc842113.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get taskOwnership(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskOwnership, PSTFile.PSETID_Task));
    }

    /**
     * Indicates the acceptance state of the task.
     * https://msdn.microsoft.com/en-us/library/office/cc839689.aspx
     * @readonly
     * @type {number}
     * @memberof PSTTask
     */
    public get acceptanceState(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(OutlookProperties.PidLidTaskAcceptanceState, PSTFile.PSETID_Task));
    }

    /**
     * JSON stringify the object properties.
     * @returns {string} 
     * @memberof PSTTask
     */
    public toJSONstring(): string {
        return (
            'PSTTask:' +
            JSON.stringify(
                {
                    messageClass: this.messageClass,
                    subject: this.subject,
                    importance: this.importance,
                    transportMessageHeaders: this.transportMessageHeaders,
                    taskStatus: this.taskStatus,
                    percentComplete: this.percentComplete,
                    taskDateCompleted: this.taskDateCompleted,
                    taskActualEffort: this.taskActualEffort,
                    taskEstimatedEffort: this.taskEstimatedEffort,
                    taskVersion: this.taskVersion,
                    isTaskComplete: this.isTaskComplete,
                    taskOwner: this.taskOwner,
                    taskAssigner: this.taskAssigner,
                    taskLastUser: this.taskLastUser,
                    taskOrdinal: this.taskOrdinal,
                    isTaskRecurring: this.isTaskRecurring,
                    taskOwnership: this.taskOwnership,
                    acceptanceState: this.acceptanceState
                },
                null,
                2
            ) +
            '\n' +
            super.toJSONstring()
        );
    }
}
