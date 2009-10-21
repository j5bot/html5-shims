onmessage = function (event) {
	postMessage("received: " + event.data);
};