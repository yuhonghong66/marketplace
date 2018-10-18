import { Model } from 'decentraland-commons'

import { Publication, PublicationQueries } from '../../Publication'
import { District } from '../../District'
import { MortgageQueries } from '../../Mortgage'
import { SQL, raw } from '../../database'
import { coordinates } from '../../lib'
import { sanitizeParcelProps, sanitizePublicationProps } from '../../sanitize'
import { isExpired } from '../../shared/asset'
import { Asset } from '../Asset'

export class Parcel extends Model {
  static tableName = 'parcels'
  static columnNames = [
    'id',
    'x',
    'y',
    'token_id',
    'owner',
    'update_operator',
    'data',
    'district_id',
    'estate_id',
    'tags',
    'auction_price',
    'auction_owner',
    'last_transferred_at'
  ]

  static buildId(x, y) {
    if (x == null || y == null) {
      throw new Error(
        `You need to supply both coordinates to be able to hash them. x = ${x} y = ${y}`
      )
    }

    return `${x},${y}`
  }

  static splitId(id = '') {
    const coordinates = id.split(',')

    if (coordinates.length !== 2) {
      throw new Error(`You need to supply a valid id to split. id = ${id}`)
    }

    return coordinates
  }

  static findByIds(ids) {
    return new Asset(this).findByIds(ids)
  }

  static async findByOwner(owner) {
    return new Asset(this).findByOwner(owner)
  }

  static async findByOwnerAndStatus(owner, status) {
    return new Asset(this).findByOwnerAndStatus(owner, status)
  }

  static async findOwneableParcels() {
    return this.db.query(
      SQL`SELECT *
        FROM ${raw(this.tableName)}
        WHERE district_id IS NULL`
    )
  }

  static async findLandmarks() {
    return this.db.query(
      SQL`SELECT *
        FROM ${raw(this.tableName)}
        WHERE district_id IS NOT NULL`
    )
  }

  static findWithLastActiveMortgageByBorrower(borrower) {
    return this.db.query(
      SQL`SELECT *, (
        ${PublicationQueries.findLastAssetPublicationJsonSql(this.tableName)}
      ) as publication
        FROM ${raw(this.tableName)}
        WHERE EXISTS(${MortgageQueries.findLastByBorrowerSql(borrower)})`
    )
  }

  static async inRange(min, max) {
    const [minx, maxy] =
      typeof min === 'string' ? coordinates.toArray(min) : [min.x, min.y]
    const [maxx, miny] =
      typeof max === 'string' ? coordinates.toArray(max) : [max.x, max.y]

    // Perf improvement: We filter columns via sanitize to improve SQL performance.
    // It's a double edge sword, as we're not returning the entire dataset always. So be careful when debugging here.
    // Also keep in mind that we moved the expired check to JS (below the query) in an effort to make things faster

    const parcelProps = sanitizeParcelProps(Parcel.columnNames).map(
      columnName => `p.${columnName}`
    )
    const publicationProps = sanitizePublicationProps(
      Publication.columnNames
    ).map(columnName => `pub.${columnName}`)

    // prettier-ignore
    const parcels = await this.db.query(
      SQL`SELECT ${raw(parcelProps)}, row_to_json(row(${raw(publicationProps)})) as publication
        FROM ${raw(this.tableName)} AS p
        LEFT JOIN ${raw(Publication.tableName)} AS pub ON p.id = pub.asset_id AND pub.is_latest = true
        WHERE x BETWEEN ${minx} AND ${maxx}
          AND y BETWEEN ${miny} AND ${maxy}
        ORDER BY x ASC, y DESC`
    )
    const result = parcels.filter(
      ({ publication }) => !publication || !isExpired(publication.expires_at)
    )

    return result
  }

  static async encodeTokenId(x, y) {
    const rows = await this.db.query(
      SQL`SELECT token_id
        FROM ${raw(this.tableName)}
        WHERE x = ${x}
          AND y = ${y}
        LIMIT 1`
    )
    return rows.length ? rows[0].token_id : null
  }

  static async decodeTokenId(tokenId) {
    const rows = await this.db.query(
      SQL`SELECT id
        FROM ${raw(this.tableName)}
        WHERE token_id = ${tokenId}
        LIMIT 1`
    )
    return rows.length ? rows[0].id : null
  }

  static async insert(parcel) {
    const { x, y } = parcel
    parcel.id = Parcel.buildId(x, y)

    return super.insert(parcel)
  }

  isEqual(parcel) {
    return (
      this.attributes.id === parcel.attributes.id ||
      (this.attributes.x === parcel.attributes.x &&
        this.attributes.y === parcel.attributes.y)
    )
  }

  distanceTo(parcel) {
    // Chebyshev distance
    return Math.max(
      Math.abs(this.attributes.x - parcel.attributes.x),
      Math.abs(this.attributes.y - parcel.attributes.y)
    )
  }

  isWithinBoundingBox(parcel, size) {
    return (
      Math.abs(this.attributes.x - parcel.attributes.x) <= size &&
      Math.abs(this.attributes.y - parcel.attributes.y) <= size
    )
  }

  isPlaza() {
    return District.isPlaza(this.attributes.district_id)
  }

  isRoad() {
    return District.isRoad(this.attributes.district_id)
  }
}
