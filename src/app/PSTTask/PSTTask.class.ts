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

export class PSTTask extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Status Integer 0 = Not started
    public get taskStatus(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008101, PSTFile.PSETID_Task));
    }

    // Percent Complete Floating point double precision (64-bit)
    public get percentComplete(): number {
        return this.getDoubleItem(this.pstFile.getNameToIdMapItem(0x00008102, PSTFile.PSETID_Task));
    }

    // Is team task Boolean
    public get isTeamTask(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008103, PSTFile.PSETID_Task));
    }

    // Date completed Filetime
    public get taskDateCompleted(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x0000810f, PSTFile.PSETID_Task));
    }

    // Actual effort in minutes Integer 32-bit signed
    public get taskActualEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008110, PSTFile.PSETID_Task));
    }

    // Total effort in minutes Integer 32-bit signed
    public get taskEstimatedEffort(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008111, PSTFile.PSETID_Task));
    }

    // Task version Integer 32-bit signed FTK: Access count
    public get taskVersion(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008112, PSTFile.PSETID_Task));
    }

    // Complete Boolean
    public get isTaskComplete(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000811c, PSTFile.PSETID_Task));
    }

    // Owner ASCII or Unicode string
    public get taskOwner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x0000811f, PSTFile.PSETID_Task));
    }

    // Delegator ASCII or Unicode string
    public get taskAssigner(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008121, PSTFile.PSETID_Task));
    }

    // Unknown ASCII or Unicode string
    public get taskLastUser(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008122, PSTFile.PSETID_Task));
    }

    // Ordinal Integer 32-bit signed
    public get taskOrdinal(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008123, PSTFile.PSETID_Task));
    }

    // Is recurring Boolean
    public get isTaskRecurring(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008126, PSTFile.PSETID_Task));
    }

    // Role ASCII or Unicode string
    public get taskRole(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008127, PSTFile.PSETID_Task));
    }

    // Ownership Integer 32-bit signed
    public get taskOwnership(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008129, PSTFile.PSETID_Task));
    }

    // Delegation State
    public get acceptanceState(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x0000812a, PSTFile.PSETID_Task));
    }

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
                    isTeamTask: this.isTeamTask,
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
                    taskRole: this.taskRole,
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
