# SDK TypeScript Unguess API

Questa cartella contiene l'SDK TypeScript generato automaticamente dalla reference OpenAPI (`src/reference/openapi.yml`).

## Comandi principali

- `yarn build`: genera l'SDK TypeScript (con funzioni fetch) e compila in `dist/`
- `yarn publish`: pubblica il pacchetto su npm (richiede NPM_TOKEN)

La generazione avviene tramite [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api).

## Versionamento automatico

La versione del pacchetto viene aggiornata automaticamente ad ogni pubblicazione tramite GitHub Action.
