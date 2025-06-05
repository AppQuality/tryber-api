yarn config set npmRegistryServer 'https://registry.npmjs.org/'
yarn config set npmAuthToken $NPM_TOKEN
yarn config set nodeLinker 'node-modules'

yarn install --immutable