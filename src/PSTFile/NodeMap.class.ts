import * as long from 'long'

/**
 * Stores node names (both alpha and numeric) in node maps for quick lookup.
 * @export
 * @class NodeMap
 */
export class NodeMap {
  private nameToId: Map<string, number> = new Map()
  private idToNumericName: Map<number, long> = new Map()
  private idToStringName: Map<number, string> = new Map()

  /**
   * Set a node into the map.
   * @param {*} key
   * @param {number} propId
   * @param {number} [idx]
   * @memberof NodeMap
   */
  public setId(key: any, propId: number, idx?: number) {
    if (typeof key === 'number' && idx !== undefined) {
      const lkey = this.transformKey(key, idx)
      this.nameToId.set(lkey.toString(), propId)
      this.idToNumericName.set(propId, lkey)
      // console.log('NodeMap::setId: propId = ' + propId + ', lkey = ' + lkey.toString());
    } else if (typeof key === 'string') {
      this.nameToId.set(key, propId)
      this.idToStringName.set(propId, key)
      // console.log('NodeMap::setId: propId = ' + propId + ', key = ' + key);
    } else {
      throw new Error('NodeMap::setId bad param type ' + typeof key)
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
    let id: number | undefined = undefined
    if (typeof key === 'number' && idx) {
      id = this.nameToId.get(this.transformKey(key, idx).toString())
    } else if (typeof key === 'string') {
      id = this.nameToId.get(key)
    } else {
      throw new Error('NodeMap::getId bad param type ' + typeof key)
    }
    if (!id) {
      return -1
    }
    return id
  }

  /**
   * Get a node from the map.
   * @param {number} propId
   * @returns {long}
   * @memberof NodeMap
   */
  public getNumericName(propId: number): long | undefined {
    const lkey = this.idToNumericName.get(propId)
    if (!lkey) {
      // console.log("NodeMap::getNumericName Name to Id mapping not found, propId = " + propId);
    }
    return lkey
  }

  private transformKey(key: number, idx: number): long {
    let lidx = long.fromNumber(idx)
    lidx = lidx.shiftLeft(32)
    lidx = lidx.or(key)
    return lidx
  }
}
