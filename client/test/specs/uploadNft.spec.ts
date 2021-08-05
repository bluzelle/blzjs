import {expect} from 'chai'

import fs from 'fs'
import path from "path";
import {sha256} from "js-sha256";
import {passThrough} from "promise-passthrough";
import {uploadNft} from "../../lib/bluzelle-node";

describe('uploadNft()', () => {

    it("should store entire file", () => {
        let hashedFilename: string
        return Promise.resolve(fs.readFileSync(path.resolve(__dirname, "../nftTest.txt")))
            .then(passThrough(resp => uploadNft("http://localhost:1317", resp, 'Mintable')))
            .then(data => hashedFilename = `${sha256(data)}-0000`)
            .then(() => fs.existsSync(path.resolve(__dirname, `${process.env.HOME}/.blzd/nft-upload/Mintable/${hashedFilename}`)))
            .then(resp => expect(resp).to.be.true)
            .then(() => fs.readFileSync(path.resolve(__dirname, `${process.env.HOME}/.blzd/nft-upload/Mintable/${hashedFilename}`)))
            .then(resp => expect(new TextDecoder().decode(resp)).to.equal("this is my nft\n"))
    });

    it('should store a .tiff image', () => {
        let hashedFilename: string
        return Promise.resolve(fs.readFileSync(path.resolve(__dirname, "./nft/tx/test.tiff")))
            .then(passThrough(resp => uploadNft("http://localhost:1317", resp, 'Mintable')))
            .then(data => hashedFilename = `${sha256(data)}-0000`)
            .then(() => fs.existsSync(path.resolve(__dirname, `${process.env.HOME}/.blzd/nft-upload/Mintable/${hashedFilename}`)))
            .then(resp => expect(resp).to.be.true)
            .then(() => fs.readFileSync(path.resolve(__dirname, `${process.env.HOME}/.blzd/nft-upload/Mintable/${hashedFilename}`)))
            .then(resp => expect(new TextDecoder().decode(resp)).to.equal("this is my nft\n"))
    })

});