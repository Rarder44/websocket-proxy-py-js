
// This is a singleton class that manages a WebSocket connection to a server. 
// It allows sending requests and receiving responses, including handling binary data and downloading files.
// It also provides a method to inject JavaScript code into the current document.
class WSProxy {

    #socket;
    #queue = [];
    #connected = false;

    constructor(WBurl) {
        this.#socket = new WebSocket(WBurl);

        this.#socket.onopen = () => {
            console.log("proxy connected");
            this.#connected = true;
            for (const { resolve, req } of this.#queue) {
                this.#manageRequest(req, resolve);
            }
            this.#queue = [];
        };

        this.#socket.onerror = (err) => console.error("WebSocket error:", err);

    }

    /**
     * Sends a request to the server via WebSocket.
     * @param {string} url - The URL to request.
     * @param {Object} params - Query parameters to include in the request.
     * @param {string} method - HTTP method (e.g., "GET", "POST").
     * @param {Object} data - Data to send in the request body.
     * @param {boolean} outAsArrayBuffer - Whether to return the response as an ArrayBuffer.
     * @returns {Promise<Object>} - A promise that resolves with the server's response.
     */
    async fetch(url, params = {}, method = "GET", data = {}, outAsArrayBuffer = false) {
        const req = { url, method, params, data, outAsArrayBuffer };

        return new Promise((resolve) => {
            if (this.#connected) {
                this.#manageRequest(req, resolve);
            } else {
                this.#queue.push({ resolve, req });
            }
        });
    }

    #manageRequest(req, resolve) {
        this.#socket.send(JSON.stringify(req));
        this.#socket.onmessage = (e) => resolve(this.#parseResponse(e.data, req.outAsArrayBuffer));
    }

    #parseResponse(raw, outAsArrayBuffer = false) {
        const response = JSON.parse(raw);
        if (response.is_base64) {
            const binary = atob(response.body);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            response.body = bytes.buffer; // Replace body with ArrayBuffer
            if (!outAsArrayBuffer) {
                response.body = new TextDecoder("utf-8").decode(response.body);
            }

        }
        return response;
    }


    /**
     * Uploads a file to the server via WebSocket.
     * @param {string} url - The URL to upload the file to.
     * @param {File} file - The file to upload.
     * @param {Object} params - Additional query parameters to include in the request.
     * @returns {Promise<Object>} - A promise that resolves with the server's response.
     */

    async download(url, filename = null, params = {}) {

        return new Promise(async (resolve) => {
            const res = await this.fetch(url, params, "GET", {}, true);
            const blob = new Blob([res.body], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            if (!filename) {
                const urlParts = url.split("/");
                filename = urlParts[urlParts.length - 1] || "download";
            }
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            resolve();
        });
    }

    /**
     * Retrieves a JSON object from the server via WebSocket.
     * @param {string} url - The URL to request.
     * @returns {Promise<Object>} - A promise that resolves with the JSON object.
     */
    async injectJS(url) {
        return new Promise(async (resolve) => {
            let response = await this.fetch(url, { "date": Date.now() });
            let script = response["body"];
            var scriptToInject = document.createElement('script');
            scriptToInject.textContent = script;
            document.head.appendChild(scriptToInject);
            resolve();
        });
    }

}


