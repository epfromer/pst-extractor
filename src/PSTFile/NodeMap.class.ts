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
import * as long from 'long';

/**
 * Stores node names (both alpha and numeric) in node maps for quick lookup.
 * @export
 * @class NodeMap
 */
export class NodeMap {
    private nameToId: Map<string, number> = new Map();
    private idToNumericName: Map<number, long> = new Map();
    private idToStringName: Map<number, string> = new Map();

    /**
     * Set a node into the map.
     * @param {*} key 
     * @param {number} propId 
     * @param {number} [idx] 
     * @memberof NodeMap
     */
    public setId(key: any, propId: number, idx?: number) {
        if (typeof key === 'number' && idx !== undefined) {
            let lkey = this.transformKey(key, idx);
            this.nameToId.set(lkey.toString(), propId);
            this.idToNumericName.set(propId, lkey);
            // console.log('NodeMap::setId: propId = ' + propId + ', lkey = ' + lkey.toString());
        } else if (typeof key === 'string') {
            this.nameToId.set(key, propId);
            this.idToStringName.set(propId, key);
            // console.log('NodeMap::setId: propId = ' + propId + ', key = ' + key);
        } else {
            throw new Error('NodeMap::setId bad param type ' + typeof key);
        }
    }

    /**
     * Get a node from the map.
     * @param {*} key 
     * @param {number} [idx] 
     * @returns {number} 
     * @memberof NodeMap
     */
    public getId(key: any, idx?: number): number {
        let id: number | undefined = undefined;
        if (typeof key === 'number' && idx) {
            id = this.nameToId.get(this.transformKey(key, idx).toString());
        } else if (typeof key === 'string') {
            id = this.nameToId.get(key);
        } else {
            throw new Error('NodeMap::getId bad param type ' + typeof key);
        }
        if (!id) {
            return -1;
        }
        return id;
    }

    /**
     * Get a node from the map.
     * @param {number} propId 
     * @returns {long} 
     * @memberof NodeMap
     */
    public getNumericName(propId: number): long | undefined {
        let lkey = this.idToNumericName.get(propId);
        if (!lkey) {
            // console.log("NodeMap::getNumericName Name to Id mapping not found, propId = " + propId);
        }
        return lkey;
    }    

    private transformKey(key: number, idx: number): long {
        let lidx = long.fromNumber(idx);
        lidx = lidx.shiftLeft(32);
        lidx = lidx.or(key);
        return lidx;
    }

}