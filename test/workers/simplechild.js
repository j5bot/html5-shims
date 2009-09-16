onmessage = function (event) {
	postMessage("received: " + event.data);
};

/* Load Test Suite */
/* importScripts("../jsunity/jsunity.js");

jsUnity.attachAssertions();
jsUnity.log = function (msg) {
	postMessage("JSUNITY: " + msg);
};
jsUnity.error = function(msg) {
	postMessage("JSUNITY: ERROR: " + msg);
}; */