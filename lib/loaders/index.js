const LoaderRegistry = require('rdf-loaders-registry')
const EcmaScriptLoader = require('rdf-loader-code/ecmaScript')
const {hydraBox} = require('../namespaces')
const SparqlViewLoader = require('./SparqlViewLoader')
const SparqlUpdate = require('../SparqlUpdate')
const SparqlQuery = require('../SparqlQuery')
const ExpressMiddlewareLoader = require('./HandlersLoader')

module.exports = () => {
  const registry = new LoaderRegistry()

  registry.registerNodeLoader(hydraBox.SparqlQuery, SparqlViewLoader(SparqlQuery))
  registry.registerNodeLoader(hydraBox.SparqlUpdate, SparqlViewLoader(SparqlUpdate))
  registry.registerNodeLoader(hydraBox.middlewareChain, ExpressMiddlewareLoader)
  EcmaScriptLoader.register(registry)

  return registry
}
