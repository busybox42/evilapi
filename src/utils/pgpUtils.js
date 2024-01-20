const openpgp = require('openpgp');
const config = require('../config/config');

async function generateStaticKeys(name, email, passphrase) {
    try {
        const keyOptions = {
            type: 'rsa',
            rsaBits: 4096,
            userIDs: [{ name, email }],
            passphrase: passphrase
        };
        const keyPair = await openpgp.generateKey(keyOptions);
        return {
            publicKeyArmored: keyPair.publicKey,
            privateKeyArmored: keyPair.privateKey,
            passphrase: passphrase
        };
    } catch (error) {
        console.error('Error generating keyPair:', error);
        return {
            publicKeyArmored: undefined,
            privateKeyArmored: undefined,
            passphrase: undefined
        };
    }
}

async function initializeStaticKeys() {
    let keyPairs = {};
    for (const keyInfo of config.pgpKeys) {
        const keyPair = await generateStaticKeys(keyInfo.type, keyInfo.email, keyInfo.passphrase);
        keyPairs[keyInfo.type] = {
            publicKey: keyPair.publicKeyArmored,
            privateKey: keyPair.privateKeyArmored
        };
    }
    return keyPairs;
}

function getStaticKeyPairs() {
    return staticKeyPairs;
}

module.exports = { generateStaticKeys, initializeStaticKeys, getStaticKeyPairs };
