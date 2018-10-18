import { utils } from 'decentraland-commons'

export const BLACKLISTED_PROPERTIES = ['is_latest', 'created_at', 'updated_at']

export function sanitizePublications(publications) {
  return utils.mapOmit(publications, BLACKLISTED_PROPERTIES)
}

export function sanitizePublication(publication) {
  return utils.omit(publication, BLACKLISTED_PROPERTIES)
}

export function sanitizePublicationProps(props) {
  return props.filter(prop => !BLACKLISTED_PROPERTIES.includes(prop))
}
