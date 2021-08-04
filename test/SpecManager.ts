const dirTree = require("directory-tree");
const tree: any = dirTree("specs/client");

// TODO: This is a hack because the ssh connection listens for exit and there are a lot of them
process.setMaxListeners(1000);

const loop = (files: any[]) => {
    files.forEach((file: any) => {
        file.type === 'directory' ? describe(file.name, () => loop(file.children)) : file.path.includes('ts') && require(`./${file.path}`)
    })
};

const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('all specifications', () => {
    // beforeEach(async () => {
    //     await exec('killall -9 ssh').catch((e: Error) => {e});
    // });
    loop(tree.children);
});