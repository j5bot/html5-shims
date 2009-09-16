var testingRole = "undefined";
var maxNest = "worker-child-child-child";

function buildOnMessageHandler(callback) {
	return function(event) {
		if (event.data.indexOf("testing")===0) {
			postMessage(event.data.replace("testing","tested"));
		} else if (event.data.indexOf("tested")===0) {
			callback(event);
		} else {
			// do nothing?
		}
	};
}

onmessage = function (event) {
	testingRole = event.data;
	// post the results of running tests back to the worker
	var results = jsUnity.run(dedicatedWorkerTests);
	postMessage(results);
};

/* Load Test Suite */
importScripts("../jsunity/jsunity.js");

jsUnity.attachAssertions();

function dedicatedWorkerTests() {
	
	// test importScripts functionality
	function testImport () {
		importScripts("../scripts/import.js");
		assertNotUndefined("function imported by import.js",importedFunction);
		assertEqual("imported function succeeds",importedFunction(),"i was imported");
	}

	// test that the window object has been hidden properly
	function testWindow () {
		assertUndefined("window is undefined",window);
	}

	// test that the reference "self" is defined as the global scope
	function testSelf() {
		assertIdentical("self is the global scope",self,this);
	}

	// WorkerGlobalScope objects should not be visible from inside the worker
	function testWGSVisibility() {
		assertUndefined("worker global scope is undefined",WorkerGlobalScope);
		assertUndefined("dedicated worker global scope is undefined",DedicatedWorkerGlobalScope);
		assertUndefined("shared worker global scope is undefined",SharedWorkerGlobalScope);
	}
	
	function testWorker() {
		if (testingRoles !== maxNext) {
			assertNotUndefined("worker is defined",Worker);
			var w = new Worker("child.js");
			
			w.onmessage = buildOnMessageHandler(function (event) {
				assertEqual("testing " + testingRole + "-child", event.data, "tested " + testingRole + "-child");
			});
			
			// establish the worker's role
			w.postMessage(testingRole+"-child");
			
			// send it a message, triggering the onmessage handler above
			w.postMessage("testing " + testingRole + "-child");
		}
	}
	
	// test post message
	function testPostMessage() {
		assertNotUndefined("postMessage is defined",postMessage);
		
		// expect identical reply
		onmessage = buildOnMessageHandler(function (event) {
			assertEqual("reply is identical to posted message", event.data, "tested postMessage");
		});

		// send message
		postMessage("testing postMessage");
	}
}