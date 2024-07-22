import { unlink } from 'fs/promises';
import request from 'supertest';
import { buildActionServer, startActualContainer, startCaddyContainer } from './container-util.js';

// Requires testcontainers:
// `yarn add -D testcontainers`

// If using WSL, requires these steps:
// - Expose the Docker for Windows daemon on tcp port 2375 without TLS.
// (Right-click the Docker Desktop icon on the task bar > Change Settings).
// - edit /etc/docker and add the following:
// {
//   "hosts": [
//       "tcp://0.0.0.0:2375",
//       "unix:///var/run/docker.sock"
//   ]
// }
// - Set the DOCKER_HOST environment variable inside the WSL shell to tcp://localhost:2375.
// It is recommended to add this to your ~/.bashrc file, so it’s available every time you open your terminal.
// https://java.testcontainers.org/supported_docker_environment/windows/#windows-subsystem-for-linux-wsl
// https://stackoverflow.com/questions/63416280/how-to-expose-docker-tcp-socket-on-wsl2-wsl-installed-docker-not-docker-deskt

// debug with:
// DEBUG=testcontainers* DOCKER_HOST=unix:///var/run/docker.sock yarn run e2e-test
// https://node.testcontainers.org/configuration/

let newActualServerBuild = await buildActionServer('./');
describe('Actual Server with Caddy', () => {
  let actualServerContainer;
  let caddyContainer;

  beforeAll(async () => {
    actualServerContainer = await startActualContainer(newActualServerBuild);
    caddyContainer = await startCaddyContainer(
      actualServerContainer.getMappedPort(5006),
    );
  }, 66 * 1000);

  it('should not allow login with no password', async () => {
    const hostname = caddyContainer.getHost();
    const port = caddyContainer.getMappedPort(80);
    const caddyHost = `${hostname}:${port}`;
    console.log('Caddy host: ' + caddyHost);
    
    const caddyRequest = request(caddyHost);
    
    caddyRequest.post('/account/login').expect({"status":"error","reason":"invalid-password"}, (err) => {
      throw err;
    });
  });

  afterAll(async () => {
    if (caddyContainer) await caddyContainer.stop();
    if (actualServerContainer) await actualServerContainer.stop();
    await unlink('./Caddyfile').catch((_err) => {
      // silence ENOENT
      return;
    });
  });
});

// NGINX

// TODO rename current implementation to allowedAuthCIDRs
//  - populate it by default with whatever folks have set in their trustedProxies
//  - we also need to fix the current implementation so it's not needed to be set if folks just want header auth, without restricting it
//  - it SHOULD only need to be set if someone wants to lock header auth to a specific endpoint.
// TODO use trustedProxies for what you have here
//
