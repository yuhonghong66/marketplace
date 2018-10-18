import { utils } from 'decentraland-commons'

const BLACKLISTED_PROPERTIES = [
  'message',
  'signature',
  'created_at',
  'updated_at'
]

export function sanitizeContributions(contributions) {
  return utils.mapOmit(contributions, BLACKLISTED_PROPERTIES)
}

export function sanitizeContributionProps(props) {
  return props.filter(prop => !BLACKLISTED_PROPERTIES.includes(prop))
}
