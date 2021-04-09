"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProxyContainer = exports.startProxyContainer = void 0;
const node_docker_api_1 = require("node-docker-api");
const tar_fs_1 = require("tar-fs");
const path_1 = require("path");
const startProxyContainer = (lang, env) => {
    const docker = new node_docker_api_1.Docker({ socketPath: '/var/run/docker.sock' });
    return checkImageExists(docker, lang)
        .then(exists => exists || createImage(docker, lang))
        .then(success => {
        if (!success)
            throw 'image creation failed';
    })
        .then(() => createContainer(docker, lang, env))
        .catch((err) => { console.log('error starting proxy container', err); });
};
exports.startProxyContainer = startProxyContainer;
const deleteProxyContainer = (lang) => {
    const docker = new node_docker_api_1.Docker({ socketPath: '/var/run/docker.sock' });
    const container = docker.container.get(`${lang}-proxy`);
    return container.stop()
        .finally(() => container.delete())
        .then(() => { })
        .catch(() => { console.log('unable to delete proxy container for', lang); }); // catch any errors because there might not be one.
};
exports.deleteProxyContainer = deleteProxyContainer;
const envToEnvArray = (env) => Object.keys(env).map(key => `${key}=${env[key]}`);
const createContainer = (docker, lang, env) => {
    return docker.container.create({
        Image: `${lang}-proxy`,
        name: `${lang}-proxy`,
        ExposedPorts: { "5000/tcp": {} },
        Tty: true,
        HostConfig: {
            PortBindings: {
                '5000/tcp': [{ HostPort: '5000' }],
            }
        },
        Env: envToEnvArray(env)
    })
        .then(container => container.start({}))
        .then(() => { });
};
const createImage = (docker, lang) => {
    const dockerfileDir = path_1.resolve(__dirname, lang);
    var tarStream = tar_fs_1.pack(dockerfileDir);
    return docker.image.build(tarStream, {
        t: `${lang}-proxy`,
        nocache: true
    })
        .then((stream) => promisifyStream(stream))
        .then(() => docker.image.get(`${lang}-proxy`).status())
        .then(status => !!status);
};
const promisifyStream = (stream) => new Promise((resolve, reject) => {
    stream.on('data', (data) => console.log(data.toString()));
    stream.on('end', resolve);
    stream.on('error', (err) => reject(err));
});
const checkImageExists = (docker, lang) => {
    return docker.image.list()
        .then(list => list.flatMap(it => it.data.RepoTags))
        .then((arr) => arr.flat())
        .then((tagArrays) => tagArrays.includes(`${lang}-proxy:latest`));
};
//# sourceMappingURL=DockerManager.js.map