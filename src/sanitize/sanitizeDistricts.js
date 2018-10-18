import { utils } from 'decentraland-commons'

const BLACKLISTED_PROPERTIES = [
  'disabled',
  'address',
  'parcel_ids',
  'created_at',
  'updated_at'
]

export function sanitizeDistricts(districts) {
  return utils.mapOmit(districts, BLACKLISTED_PROPERTIES)
}

export function sanitizeDistrictProps(props) {
  return props.filter(prop => !BLACKLISTED_PROPERTIES.includes(prop))
}
