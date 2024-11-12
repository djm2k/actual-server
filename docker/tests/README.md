# Container End to End Tests

- Run with `yarn run e2e-test`

### Prequisites

1. Install testcontainers: `yarn add -D testcontainers`

2. Docker daemon running
    - If using WSL and Docker Desktop, requires these steps:
        1. Expose the Docker for Windows daemon on tcp port 2375 without TLS.
    (Right-click the Docker Desktop icon on the task bar > Change Settings).
        2. edit `/etc/docker` and add the following:
        ```json
            {"hosts": [
                "tcp://0.0.0.0:2375",
                "unix:///var/run/docker.sock"
            ]}
        ```

        3. Set the DOCKER_HOST environment variable inside the WSL shell to tcp://localhost:2375. It is recommended to add this to your ~/.bashrc file, so it’s available every time you open your terminal: `export DOCKER_HOST=tcp://localhost:2375`
            - https://java.testcontainers.org/supported_docker_environment/windows/#windows-subsystem-for-linux-wsl
            - https://stackoverflow.com/questions/63416280/how-to-expose-docker-tcp-socket-on-wsl2-wsl-installed-docker-not-docker-deskt
        - Debug with: `DEBUG=testcontainers* DOCKER_HOST=unix:///var/run/docker.sock yarn run e2e-test`
            - https://node.testcontainers.org/configuration/#logs
