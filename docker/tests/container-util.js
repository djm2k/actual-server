import { writeFile } from 'fs/promises';
import { GenericContainer, Wait } from 'testcontainers';


export async function buildActionServer(buildContextPath) {
  return  GenericContainer.fromDockerfile(buildContextPath).build();
}

/**
 * Start an `actual-server` instance from the local Dockerfile.
 * @param {GenericContainer} newContainer
 * @returns {Promise<import('testcontainers').StartedTestContainer>}
 */
export async function startActualContainer(newContainer) {
  newContainer = newContainer.withExposedPorts(5006)
                             .withWaitStrategy(Wait.forListeningPorts());

  return newContainer.start();
}

/**
 * Start a `caddy` instance with a generated Caddyfile.
 *
 * https://actualbudget.org/docs/config/reverse-proxies/#caddy
 * @param {number} actualServerPort Mapped port of the actual-server container.
 * @returns {Promise<import('testcontainers').StartedTestContainer>}
 */
export async function startCaddyContainer(actualServerPort) {
  let caddyContainer = new GenericContainer('caddy:latest')
    .withExposedPorts(80)
    .withWaitStrategy(Wait.forHttp('/', 80).forStatusCode(200));

  await writeFile(
    './Caddyfile',
    'http://localhost {\n\tencode gzip zstd\n\treverse_proxy ' +
      `actual_server:${actualServerPort.toString()}\n}\n`,
  );

  caddyContainer = caddyContainer.withCopyFilesToContainer([
    {
      source: './Caddyfile',
      target: '/etc/caddyContainer/Caddyfile',
    },
  ]);

  return caddyContainer.start();
}
