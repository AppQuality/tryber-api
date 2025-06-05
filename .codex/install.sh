yarn config set npmRegistryServer 'https://registry.npmjs.org/'
yarn config set npmAuthToken $NPM_TOKEN
yarn config set nodeLinker 'node-modules'

yarn install --immutable

LATEST_DB_VERSION=$(yarn npm info @appquality/tryber-database --json | jq -r '.["dist-tags"].latest' )
CURRENT_DB_VERSION=$(yarn info @appquality/tryber-database --json | jq -r .children.Version)

if [ "$LATEST_DB_VERSION" != "$CURRENT_DB_VERSION" ]; then
  echo "Updating @appquality/tryber-database from $CURRENT_DB_VERSION to $LATEST_DB_VERSION"
  yarn add @appquality/tryber-database@$LATEST_DB_VERSION
  touch .database-updated
else
  echo "@appquality/tryber-database is already up to date ($CURRENT_DB_VERSION)"
fi

rm -rf .yarnrc.yml
yarn config set nodeLinker 'node-modules'
