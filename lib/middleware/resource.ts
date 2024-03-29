import { RequestHandler } from 'express'
import log from '../log.js'
import { ResourceLoader } from '../../index.js'

const { debug } = log('resource')

export default function factory({ loader }: { loader: ResourceLoader }): RequestHandler {
  return async (req, res, next) => {
    const classResources = await loader.forClassOperation(req.hydra.term, req)
    const propertyObjectResources = await loader.forPropertyOperation(req.hydra.term, req)

    res.locals.hydra.resources = [
      ...classResources,
      ...propertyObjectResources,
    ]
    if (res.locals.hydra.resources.length === 0) {
      debug(`no matching resource found: ${req.hydra.term.value}`)
    }
    if (res.locals.hydra.resources.length > 1) {
      debug('multiple resource candidates found')
    }

    return next()
  }
}
