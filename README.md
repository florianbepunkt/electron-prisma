# Prisma electron integration example

Integrate prisma in a secure and scalable manner.

Based on https://github.com/electron-react-boilerplate/electron-react-boilerplate. All initial work was done by Ayron Wohletz: https://dev.to/awohletz/an-electron-app-architecture-32hi

I highly recommend his articles.

## Install

Install project dependencies with `npm install`. Run `npm run prisma:init` for initial migration and prisma client generation. Then run `npm install` again to run the postinstall script (or you can run the postinstall script directly).

## Build

You need to understand the double package.json structure used by above boilerplate. Native modules go to `release/app/package.json`. So `prisma` and `@prisma/client` is added there. The prisma cli will also install this in the root `package.json`.

The output of the prisma client generated from `prisma/schema.prisma` needs to go to `../release/app/node_modules/@prisma/client` in order to get handled by the native binaries. Inside `prisma/schema.prisma` you can select the target binaries, depending on your compilation target: `binaryTargets = ["native", "windows"]`

Electron builder config takes care that these files are included in the build, outside the ASAR:

```json
"files": [
      "dist",
      "node_modules",
      "package.json",
      "prisma/**/*",
      "resources/**/*",
      "!**/node_modules/@prisma/engines/introspection-engine*",
      "!**/node_modules/@prisma/engines/migration-engine*",
      "!**/node_modules/@prisma/engines/prisma-fmt*",
      "!**/node_modules/@prisma/engines/query_engine-*",
      "!**/node_modules/@prisma/engines/libquery_engine*",
      "!**/node_modules/prisma/query_engine*",
      "!**/node_modules/prisma/libquery_engine*",
      "!**/node_modules/prisma/**/*.mjs"
    ],
    "extraResources": [
      "./assets/**",
      "prisma/**/*",
      "node_modules/@prisma/engines/migration-engine*",
      "node_modules/@prisma/engines/query*",
      "node_modules/@prisma/engines/libquery*"
    ],
```

## Electron integration / IPC

Prisma is exposed via ContextBridge to the renderer. In the main process we need to bootstrap the DB and set some IPC handlers to get our binary paths.

```js
// src/main/preload.js
const { PrismaClient } = require('@prisma/client');

const dbPath = ipcRenderer.sendSync('config:get-prisma-db-path');
const qePath = ipcRenderer.sendSync('config:get-prisma-qe-path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
  // see https://github.com/prisma/prisma/discussions/5200
  __internal: {
    engine: {
      // @ts-expect-error internal prop
      binaryPath: qePath,
    },
  },
});
```

## Prisma startup times

A postinstall script in `chore/post-install.js` is run to fix the prisma cold start time problem. Read more about it here: https://github.com/prisma/prisma/issues/8484

## DB Setup

If no db exists in the packaged app, the db from `prisma/dev.db` will be copied to the app's user data folder.

## TODO

Migrations/updates

## Resources

- https://dev.to/awohletz/an-electron-app-architecture-32hi
- https://github.com/TasinIshmam/prisma-electron-test
- https://github.com/prisma/prisma/discussions/5200
- https://github.com/prisma/prisma/issues/9613
