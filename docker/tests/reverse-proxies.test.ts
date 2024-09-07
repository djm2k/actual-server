import { unlink } from 'fs/promises';
import request from 'supertest';
import { startActualContainer, startActualContainerWithTraefik, startCaddyContainer, startTraefikContainer } from './container-util.ts';
import { StartedTestContainer } from 'testcontainers';


// describe('Actual Server with Caddy', () => {
//   let actualServerContainer;
//   let caddyContainer;

//   beforeAll(async () => {
//     actualServerContainer = await startActualContainer();
//     caddyContainer = await startCaddyContainer(
//       actualServerContainer.getMappedPort(5006),
//     );
//   }, 66 * 1000);

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

// Traefik, TODO modularise
describe('Actual Server with Traefik', () => {
  let actualServerContainer: StartedTestContainer;
  let traefikContainer: StartedTestContainer;

  beforeAll(async () => {
    actualServerContainer = await startActualContainerWithTraefik();
    traefikContainer = await startTraefikContainer(
      actualServerContainer.getMappedPort(5006),
    );
  }, 66 * 1000);

  it('should allow login', async () => {
    const hostname = traefikContainer.getHost();
    const port = traefikContainer.getMappedPort(80);
    const traefikHost = `${hostname}:${port}`;
    // console.log('Traefik host: ' + traefikHost);

    const traefikRequest = request(traefikHost);

    traefikRequest.get('/').then(res => {
      expect(res.statusCode).toBe(200)
    });
  });

  afterAll(async () => {
    if (traefikContainer) await traefikContainer.stop();
    if (actualServerContainer) await actualServerContainer.stop();

    // Delete traefik.yml from disk, if it exists
    await unlink('./traefik.yaml').catch((_err) => {
      // don't care about ENOENT
      return;
    });
  });
});



