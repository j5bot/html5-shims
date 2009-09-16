var testingRole = "undefined";
var maxNest = "worker-child-child-child";

function buildOnMessageHandler(callback) {
	return function(event) {
		postMessage(testingRole + " received: " + event.data);
		
		if (event.data.indexOf && event.data.indexOf("testing")===0) {
			postMessage(event.data.replace("testing","tested"));
		} else if (event.data.indexOf && event.data.indexOf("tested")===0) {
			callback(event);
		} else {
			// do nothing?
		}
	};
}

onmessage = function (event) {
	testingRole = event.data;
	// post the results of running tests back to the worker
	onmessage = function (event) {
		postMessage(testingRole + " received: " + event.data);
	};
	
	postMessage(jsUnity.run(dWCT));
	setTimeout(function () {
		postMessage(jsUnity.run(dWPT));
	},500);
	setTimeout(function () {
		postMessage(jsUnity.run(dWWT));
	},1000)
};

/* Load Test Suite */
importScripts("../jsunity/jsunity.js");

jsUnity.attachAssertions();
jsUnity.log = function (msg) {
	postMessage("JSUNITY: " + msg);
};
jsUnity.error = function(msg) {
	postMessage("JSUNITY: ERROR: " + msg);
};
var dWCT = jsUnity.compile(dedicatedWorkerCoreTests),
	dWPT = jsUnity.compile(dedicatedWorkerPostMessageTests),
	dWWT = jsUnity.compile(dedicatedWorkerWorkerTests);
dWCT.scope = dWPT.scope = dWWT.scope = this;

function dedicatedWorkerCoreTests() {
	
	// test importScripts functionality
	function testImport () {
		importScripts("../scripts/import.js");
		assertNotUndefined(importedFunction, "function imported by import.js");
		assertEqual("i was imported", importedFunction(), "imported function succeeds");
	}

	// test that the window object has been hidden properly
	function testWindow () {
		assertEqual("undefined",typeof(window), "window is undefined");
	}

	// test that the reference "self" is defined as the global scope
	function testSelf() {
		assertIdentical(self,this,"self is the global scope: " + this.toSource());
	}

	// WorkerGlobalScope objects should not be visible from inside the worker
	function testWGSVisibility() {
		assertEqual("undefined",typeof(WorkerGlobalScope), "worker global scope is undefined");
		assertEqual("undefined",typeof(DedicatedWorkerGlobalScope), "dedicated worker global scope is undefined");
		assertEqual("undefined",typeof(SharedWorkerGlobalScope), "shared worker global scope is undefined");
	}
}

function dedicatedWorkerPostMessageTests() {

	// test post message
	function testPostMessage() {
		assertNotUndefined("postMessage is defined",postMessage);
	
		// expect identical reply
		onmessage = buildOnMessageHandler(function (event) {
			assertEqual("tested postMessage",event.data,"reply is identical to posted message");
		});

		// send message
		postMessage("testing postMessage");
		while (i < 100000) {
			i++;
		}
	}
}

function dedicatedWorkerWorkerTests() {

	function testWorker() {
		if (testingRole !== maxNest) {
			assertNotUndefined(Worker,"worker is defined");
			var w = new Worker("child.js");
		
			w.onmessage = buildOnMessageHandler(function (event) {
				assertEqual("tested " + testingRole + "-child", event.data, "testing " + testingRole + "-child");
			});
		
			// establish the worker's role
			w.postMessage(testingRole+"-child");
		
			// send it a message, triggering the onmessage handler above
			w.postMessage("testing " + testingRole + "-child");
			while (i < 100000) {
				i++;
			}
		}
	}
}