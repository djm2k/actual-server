import { writeFile } from 'fs/promises';
import { GenericContainer, Wait } from 'testcontainers';


/**
 * Start an `actual-server` from the root build context, using port 5006.
 */
export async function startActualContainer(buildContext = './') {
  const newContainer = await GenericContainer
    .fromDockerfile(buildContext)
    .build();

  return newContainer
    .withExposedPorts(5006)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
}

/**
 * Start a `caddy` instance with a generated Caddyfile.
 *
 * https://actualbudget.org/docs/config/reverse-proxies/#caddy
 */
export async function startCaddyContainer(actualServerPort: number):
  Promise<import('testcontainers').StartedTestContainer> {
  if (typeof actualServerPort !== 'number') throw Error("actualServerPort must be number!");

  // write Caddyfile to disk for copying
  const source = './Caddyfile';
  const testCaddyfileContents = 'http://localhost {\n\tencode gzip zstd\n' +
    '\treverse_proxy actual_server:' + actualServerPort.toString() + '\n}\n';
  await writeFile(source, testCaddyfileContents);

  const caddyContainer = new GenericContainer('caddy:latest')
    .withCopyFilesToContainer([{ source, target: '/etc/caddyContainer/Caddyfile' }])
    .withExposedPorts(80)
    .withWaitStrategy(Wait.forListeningPorts());

  return caddyContainer.start();
}

// services:\
export async function startTraefikContainer(actualServerPort: number) {
  // write Caddyfile to disk for copying
  const source = './traefik.yaml';
  const testTraeFikYamlContents = `
  logLevel: "DEBUG"
  entryPoints:
    web:
      address: ":80"
  
  providers:
    docker: {}
  `;
  await writeFile(source, testTraeFikYamlContents);

  const traefikContainer = new GenericContainer("traefik:latest")
    .withExposedPorts(80)
    .withCopyFilesToContainer([{ source, target: "/etc/traefik/traefik.yaml" }])
    .withBindMounts([{ source: "/var/run/docker.sock", target: "/var/run/docker.sock" }])
    .withWaitStrategy(Wait.forListeningPorts())


  return traefikContainer.start();


}

/**
 * Start an `actual-server` from the root build context, using port 5006.
 */
export async function startActualContainerWithTraefik(buildContext = './') {
  const newContainer = await GenericContainer
    .fromDockerfile(buildContext)
    .build();

  return newContainer.withLabels({
    // "traefik.enable": "true",
    "traefik.http.routers.actual-server.entrypoints": "web",
    // "traefik.http.services.actual-server.loadbalancer.server.port": "5006"
  })
    .withExposedPorts(5006)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
}
//   traefik:
//     image: traefik:latest
//     restart: unless-stopped
//     ports:
//       - "80:80"
//     volumes:
//       - "./traefik.yaml:/etc/traefik/traefik.yaml"
//       - "./traefik/data:/data"
//       - "/var/run/docker.sock:/var/run/docker.sock"

//   actual-server:
//     image: actualbudget/actual-server:latest-alpine
//     restart: unless-stopped
//     labels:

//     volumes:
//       - ./actual-data:/data