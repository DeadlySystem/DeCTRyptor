"use strict";

/**
 * The secret provider is responsible for delivering secret keys and the constant c used in the key scrambler.
 * This implementation reads the values from a publicly accessible online source.
 */
class SecretProvider
{
    constructor()
    {
        this.secretDoc = null;
    }

    /**
     * @param {number} slot
     * @returns {Promise}
     */
    getKeyX(slot)
    {
        const self = this;
        const normalizedSlot = this.normalizeSlot(slot);
        return new Promise(
            function (resolve, reject) {
                self.openSecretDoc().then(
                    function (secretDoc) {
                        const keyX = secretDoc.evaluate("//table[@class='waffle']/tbody/tr/td[text()='" + normalizedSlot + "']/following-sibling::td[1]//text()", secretDoc, null, XPathResult.STRING_TYPE).stringValue;
                        resolve(keyX);
                    }
                );
            }
        );
    }

    /**
     * @param {number} slot
     * @returns {Promise}
     */
    getKeyY(slot)
    {
        const self = this;
        const normalizedSlot = this.normalizeSlot(slot);
        return new Promise(
            function (resolve, reject) {
                self.openSecretDoc().then(
                    function (secretDoc) {
                        const keyY = secretDoc.evaluate("//table[@class='waffle']/tbody/tr/td[text()='" + normalizedSlot + "']/following-sibling::td[2]//text()", secretDoc, null, XPathResult.STRING_TYPE).stringValue;
                        resolve(keyY);
                    }
                );
            }
        );
    }

    /**
     * @returns {Promise}
     */
    getKeyScramblerConstant()
    {
        const self = this;
        return new Promise(
            function (resolve, reject) {
                self.openSecretDoc().then(
                    function (secretDoc) {
                        const keyScramblerFunction = secretDoc.evaluate("//table[@class='waffle']/tbody/tr/td[contains(text(),'F(KeyX, KeyY) = ')]//text()", secretDoc, null, XPathResult.STRING_TYPE).stringValue;

                        const regex = /^\s*F\(KeyX,\s*KeyY\)\s*=\s*\(\(\(KeyX\s*<<<\s*2\)\s*\^\s*KeyY\)\s*\+\s*([0-9A-Fa-f]{32})\)\s*<<<\s*87\s*$/g;
                        const matches = regex.exec(keyScramblerFunction);
                        if (matches === null) {
                            reject(Error("Could not identify key scrambler constant in formula " + keyScramblerFunction));
                        }
                        const c = matches[1];
                        resolve(c);
                    }
                );
            }
        );
    }

    /**
     * @param {number} slot
     * @returns {string}
     */
    normalizeSlot(slot)
    {
        return "0x" + ("00" + slot.toString(16).toUpperCase()).substr(-2);
    }

    /**
     * @returns {Promise}
     */
    openSecretDoc()
    {
        const self = this;
        return new Promise(
            function (resolve, reject) {
                if (self.secretDoc !== null) {
                    resolve(self.secretDoc)
                } else {
                    const request = new XMLHttpRequest();
                    const crossOriginProxy = "https://cors-anywhere.herokuapp.com/";
                    const sheetUrl = "https://docs.google.com/spreadsheets/d/18zzG3p_30cu6nPf3BkvWWDPxqJBE329fREVtpPFisP8/edit";
                    request.open("GET", crossOriginProxy + sheetUrl, true);
                    request.addEventListener(
                        "load",
                        function (event) {
                            const parser = new DOMParser();
                            self.secretDoc = parser.parseFromString(request.responseText, "text/html");
                            resolve(self.secretDoc);
                        }
                    );
                    request.addEventListener(
                        "error",
                        function (event) {
                            reject(Error("Could not retrieve secret document (HTTP Status " + request.status + ")"));
                        }
                    );
                    request.send();
                }
            }
        );
    }
}