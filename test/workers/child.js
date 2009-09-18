var testRole = "undefined";
var maxNest = "worker-child-child";

function buildOnMessageHandler(callback) {
	return function(event) {
		postMessage(testRole + " received: " + event.data);
		
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
	testRole = event.data;
	// post the results of running tests back to the worker
	onmessage = function (event) {
		postMessage(testRole + " received: " + event.data);
	};
};

/* Load Test Suite */
importScripts("../jsunity/jsunity.js");

// jsUnity.attachAssertions();
jsUnity.log = function (msg) {
	postMessage("JSUNITY: " + msg);
};
jsUnity.error = function(msg) {
	postMessage("JSUNITY: ERROR: " + msg);
};

function dedicatedWorkerCoreTests() {
	
	// test importScripts functionality
	function testImport () {
		with (this) {
			importScripts("../scripts/import.js");
			jsUnity.assertions.assertEqual("i was imported", importedFunction(), "imported function succeeds");
			jsUnity.assertions.assertNotUndefined(importedFunction, "function imported by import.js");
		}
	}

	// test that the window object has been hidden properly
	function testWindow () {
		with (this) {
			jsUnity.assertions.assertEqual("undefined",typeof(window), "window is undefined");
		}
	}

	// test that the reference "self" is defined as the global scope
	function testSelf() {
		with (this) {
			jsUnity.assertions.assertIdentical(self,this,"self is the global scope: " + this.toSource());
		}
	}

	// WorkerGlobalScope objects should not be visible from inside the worker
	function testWGSVisibility() {
		with (this) {
			jsUnity.assertions.assertEqual("undefined",typeof(WorkerGlobalScope), "worker global scope is undefined");
			jsUnity.assertions.assertEqual("undefined",typeof(DedicatedWorkerGlobalScope), "dedicated worker global scope is undefined");
			jsUnity.assertions.assertEqual("undefined",typeof(SharedWorkerGlobalScope), "shared worker global scope is undefined");
		}
	}
}

function dedicatedWorkerPostMessageTests() {

	// test post message
	function testPostMessage() {
		with (this) {
			jsUnity.assertions.assertNotUndefined("postMessage is defined",postMessage);
	
			// expect identical reply
			onmessage = buildOnMessageHandler(function (event) {
				jsUnity.assertions.assertEqual("tested postMessage",event.data,"reply is identical to posted message");
			});

			// send message
			postMessage("testing postMessage");
			var i = 0;
			while (i < 100000) {
				i++;
			}
		}
	}
}

function dedicatedWorkerWorkerTests() {

	function testWorker() {
		with (this) {
			if (testRole !== maxNest) {
				jsUnity.assertions.assertNotUndefined(Worker,"worker is defined");
				var w = new Worker("child.js");
		
				w.onmessage = buildOnMessageHandler(function (event) {
					assertEqual("tested " + testRole + "-child", event.data, "testing " + testRole + "-child");
				});
		
				// establish the worker's role
				w.postMessage(testRole+"-child");
		
				// send it a message, triggering the onmessage handler above
				w.postMessage("testing " + testRole + "-child");
				var i = 0;
				while (i < 100000) {
					i++;
				}
			}
		}
	}
}

var dWCT = jsUnity.compile(dedicatedWorkerCoreTests),
	dWPT = jsUnity.compile(dedicatedWorkerPostMessageTests),
	dWWT = jsUnity.compile(dedicatedWorkerWorkerTests);
dWCT.scope = dWPT.scope = dWWT.scope = this;

// postMessage("this.toSource: " + this.toSource());

var value = jsUnity.run(dWCT);
postMessage(value);
setTimeout(function () {
	postMessage(jsUnity.run(dWPT));
},500);
setTimeout(function () {
	postMessage(jsUnity.run(dWWT));
},1000);

importScripts("../scripts/import.js");
postMessage(importedFunction());
