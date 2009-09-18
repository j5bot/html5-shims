self.testRole = "undefined";
self.maxNest = "worker-child-child-child-child-child-child";

function buildOnMessageHandler(callback) {
	return function(event) {
		postMessage(self.testRole + " received: " + event.data);
		
		if (event.data.indexOf && event.data.indexOf("testing")===0) {
			postMessage(event.data.replace("testing","tested"));
		} else if (event.data.indexOf && event.data.indexOf("tested")===0) {
			callback(event);
		} else {
			// throw new Error("trying to find bugs: " + event.data.toSource());
		}
	};
}

function runCallbacks(callbacks) {
	if (callbacks.length > 0) {
		var cb = callbacks[0];
		callbacks = callbacks.slice(1);
		cb.call(this,callbacks);
	}
}

function testPost (callbacks) {
	// expect identical reply
	var t = this;
	
	// create testing message handler
	t.onmessage = buildOnMessageHandler(function (event) {
		t.postMessage(jsUnity.run({
			testResponse: function () { jsUnity.assertions.assertEqual("tested postMessage",event.data,"reply is identical to posted message"); }
		}));
		// reset message handler
		t.onmessage = buildOnMessageHandler(function(){});
		
		// run more tests, if needed
		if (callbacks.length > 0) { runCallbacks.call(t,callbacks); }
	});

	// send message
	t.postMessage("testing postMessage");
}

function testWorker (callbacks) {
	var t = this;
	if ((self.testRole !== "undefined") && (self.testRole !== self.maxNest)) {
		postMessage(jsUnity.run({
			testInnerWorkerExists: function () { jsUnity.assertions.assertNotUndefined(Worker,"worker is defined"); }
		}));
		var wx = new Worker("child.js");

		wx.onmessage = buildOnMessageHandler(function (event) {
			t.postMessage(jsUnity.run({
				testInnerWorkerMessaging: function () { jsUnity.assertions.assertEqual("tested " + self.testRole + "-child", event.data, "testing " + self.testRole + "-child"); }
			}));
			
			// reset message handler
			wx.onmessage = buildOnMessageHandler(function(){});
			
			if (callbacks.length > 0) { runCallbacks.call(t,callbacks); }
		});
		
		// establish the worker's role
		wx.postMessage(self.testRole+"-child");
		t.postMessage(self.testRole+"-child queue: " + wx._queue);

		// send it a message, triggering the onmessage handler above
		wx.postMessage("testing " + self.testRole + "-child");
	} else {
		runCallbacks.call(t,callbacks);
	}
}

onmessage = function (event) {
	self.testRole = event.data;
	postMessage(self.testRole + " received: " + event.data);
	// post the results of running tests back to the worker
	onmessage = function (event) {
		postMessage(self.testRole + " received: " + event.data);
	};
	
	// run core test suite
	var dWCT = jsUnity.compile(dedicatedWorkerCoreTests);
	dWCT.scope = self;
	postMessage(jsUnity.run(dWCT));
	
	// test runners for asynchronous stuff, pass an array of tests to be run
	runCallbacks.call(self,[testWorker]);
};

/* Load Test Suite */
importScripts("../jsunity/jsunity.js");

// jsUnity.attachAssertions();
jsUnity.log = function (msg) {
	postMessage(self.testRole + ": JSUNITY: " + msg);
};
jsUnity.error = function(msg) {
	postMessage(self.testRole + ": JSUNITY: ERROR: " + msg);
};

dedicatedWorkerCoreTests = {
	
	// test importScripts functionality
	testImport: function () {
		with (this) {
			importScripts("../scripts/import.js");
			jsUnity.assertions.assertEqual("i was imported", importedFunction(), "imported function succeeds");
			jsUnity.assertions.assertNotUndefined(importedFunction, "function imported by import.js");
		}
	},

	// test that the window object has been hidden properly
	testWindow: function () {
		with (this) {
			jsUnity.assertions.assertEqual("undefined",typeof(window), "window is undefined");
		}
	},

	// test that the reference "self" is defined as the global scope
	testSelf: function () {
		with (this) {
			jsUnity.assertions.assertIdentical(self,this,"self is the global scope: " + this.toSource());
		}
	},

	// WorkerGlobalScope objects should not be visible from inside the worker
	testWGSVisibility: function () {
		with (this) {
			jsUnity.assertions.assertEqual("undefined",typeof(WorkerGlobalScope), "worker global scope is undefined");
			jsUnity.assertions.assertEqual("undefined",typeof(DedicatedWorkerGlobalScope), "dedicated worker global scope is undefined");
			jsUnity.assertions.assertEqual("undefined",typeof(SharedWorkerGlobalScope), "shared worker global scope is undefined");
		}
	}
}