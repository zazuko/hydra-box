import path from 'node:path'
import rdf from '@zazuko/env-node'
import { RequestHandler, Router } from 'express'
import { middleware as absoluteUrl } from 'absolute-url'
import { asyncMiddleware } from 'middleware-async'
import { defer } from 'promise-the-world'
import rdfHandler from '@rdfjs/express-handler'
import setLink from 'set-link'
import type { Store } from '@rdfjs/types'
import apiHeader from './lib/middleware/apiHeader.js'
import iriTemplate from './lib/middleware/iriTemplate.js'
import operation from './lib/middleware/operation.js'
import resource from './lib/middleware/resource.js'
import waitFor from './lib/middleware/waitFor.js'
import StoreResourceLoader from './StoreResourceLoader.js'
import log from './lib/log.js'
import Api from './Api.js'
import { HydraBox, ResourceLoader } from './index.js'

declare module 'express-serve-static-core' {
  interface Request {
    hydra: HydraBox
  }
}

const { debug } = log('middleware')

export interface HydraBoxMiddleware {
  resource?: RequestHandler | RequestHandler[] | undefined
  operations?: RequestHandler | RequestHandler[] | undefined
}

interface Options {
  baseIriFromRequest?: boolean
  loader?: ResourceLoader
  store?: Store
  middleware?: HydraBoxMiddleware
}

function middleware(api: Api, { baseIriFromRequest, loader, store, middleware = {} }: Options) {
  const init = defer()
  const router = Router()

  router.use(absoluteUrl())
  router.use(setLink)
  router.use(asyncMiddleware(async (req, res, next) => {
    const iri = new URL(req.absoluteUrl())

    iri.search = ''

    const term = rdf.namedNode(iri.toString())

    debug(`${req.method} to ${term.value}`)

    req.hydra = <HydraBox>{
      api,
      store,
      term,
    }

    if (!api.term && api.path) {
      const apiIri = new URL(path.join(req.baseUrl, api.path), iri)

      api.term = rdf.namedNode(apiIri.toString())

      debug(`api.term was not set. Will use: ${api.term.value}`)
    }

    try {
      await api.init()

      init.resolve()

      next()
    } catch (/** @type {unknown} */ err) {
      if (err instanceof Error) {
        init.reject(err)
      }

      next(err)
    }
  }))

  router.use(rdfHandler({ baseIriFromRequest, sendTriples: true }))
  router.use(waitFor(init, () => apiHeader(api)))
  router.use(waitFor(init, () => iriTemplate(api)))

  router.use((req, res, next) => {
    res.locals.hydra = {}
    next()
  })

  if (loader) {
    router.use(resource({ loader }))
  } else if (store) {
    router.use(resource({ loader: new StoreResourceLoader({ store }) }))
  } else {
    throw new Error('no loader or store provided')
  }

  router.use(operation(middleware))

  return router
}

export default middleware
