onmessage = function (event) {
	postMessage("received: " + event.data);
};

importScripts("../scripts/importError.js");
throwUp();