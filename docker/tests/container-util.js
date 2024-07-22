import { writeFile } from 'fs/promises';
import { GenericContainer, Wait } from 'testcontainers';

/**
 * Add a log consumer to container which captures and logs events.
 * @param {GenericContainer} container
 * @param {string} logPrefix
 * @returns {GenericContainer}
 */
export function consumeLogsWithPrefix(container, logPrefix) {
  return container.withLogConsumer((stream) => {
    stream.on('data', (line) => console.log(logPrefix + line));
    stream.on('err', (line) => console.error(logPrefix + line));
    stream.on('end', () => console.log(logPrefix + 'Stream closed'));
  });
}

/**
 * Start an `actual-server` instance from the local Dockerfile.
 * @returns {Promise<import('testcontainers').StartedTestContainer>}
 */
export async function startActualContainer() {
  let newContainer = new GenericContainer('../../Dockerfile')
    .withExposedPorts(5006)
    .withWaitStrategy(Wait.forListeningPorts());

  newContainer = consumeLogsWithPrefix(newContainer, 'ActualServer: ');

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
  let caddyContainer = new GenericContainer('caddyContainer:latest')
    .withExposedPorts(80)
    .withWaitStrategy(Wait.forListeningPorts());

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
