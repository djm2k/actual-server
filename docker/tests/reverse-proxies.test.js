import { unlink } from 'fs/promises';
import { request } from 'http';
import { startActualContainer, startCaddyContainer } from './container-util.js';

// Requires testcontainers:
// `yarn add -D testcontainers`

// If using WSL, requires these steps:
// https://java.testcontainers.org/supported_docker_environment/windows/#windows-subsystem-for-linux-wsl
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

// debug with:
// DEBUG=testcontainers* DOCKER_HOST=unix:///var/run/docker.sock yarn run e2e-test

describe('Actual Server with Caddy', () => {
  let actualServerContainer;
  let caddyContainer;

  beforeAll(async () => {
    actualServerContainer = await startActualContainer();
    caddyContainer = await startCaddyContainer(
      actualServerContainer.getMappedPort(5006),
    );
  }, 61 * 1000);

  it('should work with default config', async () => {
    const host = caddyContainer.getHost();
    console.log('Caddy host: ' + host);
    request(
      {
        hostname: host,
        port: caddyContainer.getMappedPort(80),
        method: 'get',
        path: '/health',
      },
      (res) => {
        expect(res.statusCode).toBe(200);
      },
    );
  }, 30000);

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
