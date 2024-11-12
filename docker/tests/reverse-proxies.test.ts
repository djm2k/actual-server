import { unlink } from 'fs/promises';
import request from 'supertest';
import { ActualServerBuild, startTraefikContainer } from './container-util.ts';
import { StartedTestContainer } from 'testcontainers';


// increase if docker build times out
const CONTAINER_START_TIMEOUT_SECONDS = 90;
// convert to milliseconds
const CONTAINER_START_TIMEOUT_MS = CONTAINER_START_TIMEOUT_SECONDS * 1000;

const ACTUAL_SERVER_DEFAULT_PORT = 5006;

// describe('Actual Server with Caddy', () => {
//   let actualServerContainer;
//   let caddyContainer;

//   beforeAll(async () => {
//     actualServerContainer = await startActualContainer();
//     caddyContainer = await startCaddyContainer(
//       actualServerContainer.getMappedPort(ACTUAL_SERVER_DEFAULT_PORT),
//     );
//   }, CONTAINER_START_TIMEOUT_MS);

//   it('should allow login', async () => {
//     const hostname = caddyContainer.getHost();
//     const port = caddyContainer.getMappedPort(80);
//     const caddyHost = `${hostname}:${port}`;
//     // console.log('Caddy host: ' + caddyHost);

//     const caddyRequest = request(caddyHost);

//     caddyRequest.get('/').then(res => {
//       expect(res.statusCode).toBe(200)
//     });
//   });

//   afterAll(async () => {
//     if (caddyContainer) await caddyContainer.stop();
//     if (actualServerContainer) await actualServerContainer.stop();

//     // Delete Caddyfile from disk, if it exists
//     await unlink('./Caddyfile').catch((_err) => {
//       // don't care about ENOENT
//       return;
//     });
//   });
// });

describe('Actual Server with Traefik', () => {
  let actualServer: StartedTestContainer;
  let traefik: StartedTestContainer;

  beforeAll(async () => {
    const builtActualServer = await ActualServerBuild();
    actualServer = await builtActualServer
      .withLabels({
        "traefik.http.routers.actual-server.entrypoints": "web",
      }).start()

    traefik = await startTraefikContainer(actualServer.getMappedPort(ACTUAL_SERVER_DEFAULT_PORT));
  }, CONTAINER_START_TIMEOUT_MS);

  it('should return info', async () => {
    const hostname = traefik.getHost();
    const port = traefik.getMappedPort(80);
    const hostConnectionString = `http://${hostname}:${port}`;

    request(hostConnectionString)
      .get('/info')
      .then(res => {
        // console.log(res);
        expect(res.statusCode).toBe(200)
      });

  });

  afterAll(async () => {
    if (actualServer) await actualServer.stop();
    if (traefik) await traefik.stop();

    // Delete traefik.yml from disk, if it exists
    await unlink('./traefik.yaml').catch((_err) => {
      // don't care about ENOENT
      return;
    });
  });
});

describe('Actual Server by itself', () => {
  let actualServer: StartedTestContainer;

  beforeAll(async () => {
    const builtActualServer = await ActualServerBuild();
    actualServer = await builtActualServer.start()
  }, CONTAINER_START_TIMEOUT_MS);

  it('should return info', async () => {
    const hostname = actualServer.getHost();
    const port = actualServer.getMappedPort(ACTUAL_SERVER_DEFAULT_PORT);
    const hostConnectionString = `http://${hostname}:${port}`;

    request(hostConnectionString)
      .get('/info')
      .then(res => {
        // console.log(res);
        expect(res.statusCode).toBe(200)
      });

  });

  afterAll(async () => {
    if (actualServer) await actualServer.stop();
  });
});