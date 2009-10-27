// we need to load up the APIs that are available inside the worker
html5shims.loadShim("WorkerGlobalScope","/apis/WorkerGlobalScope.js");
html5shims._workers = html5shims._workers || {};

// clone the parts of the global scope navigator object that we need for WorkerGlobalScope
var navigator = {
	appName: globalScope.navigator.appName,
	appVersion: globalScope.navigator.appVersion,
	platform: globalScope.navigator.platform,
	userAgent: globalScope.navigator.userAgent
};

if (google && google.gears) {
	if (google.gears.factory.getPermission("HTML5 Web Worker Emulator",null,"We use Google Gears to emulate the HTML5 Web Worker API and provide a faster experience for you.")) {
		// not sure what to do here ... this is just giving us the permissions, really
	}
}

html5shims.prototype.entangleGearsWorkerPool = function (globalScope) {
	var isInner = !!google.gears.workerPool;
	var wp = google.gears.workerPool || google.gears.factory.create("beta.workerpool");
	var workers = html5shims._workers;
	
	// this is the "final" message handler, we'll hold a closure for it so that we can reference it from a temporary handler later
	var wom = function(a,b,msg) {
        /* message coming from a child worker */
        if (workers && workers["w"+msg.sender]) {
            /* set the worker to ready after ack */
            if (msg.body==="{{ack}}") {
				with (workers["w"+msg.sender]) {
					_ready = true;
					/* dequeue messages waiting to be sent to child worker */
					while (_queue.length > 0) {
						var mo = _queue[0];
						_queue = _queue.slice(1);							
						postMessage(mo);
					}
				}
            } else {
                workers["w"+msg.sender].onmessage({data:msg.body});
            }
        } else if (msg.sender === globalScope._parent){
        	/* message coming from the parent */
            globalScope.onmessage({data:msg.body});
        } else {
            /*
            message is not from a parent or child worker
            each "port" is only available to the Worker and the WorkerGlobalScope -- i.e. all messages
            must go through parent-child MessagePort, they cannot go from grandchild to grandparent or from sibling to sibling
            as may be possible in SharedWorker
            */
        }
    };

	wp.onmessage = !isInner ? wom : function (a,b,msg) {
    	if (globalScope._parent === null && msg.body==="{{syn}}") {
	        globalScope._parent = msg.sender;
	        wp.sendMessage("{{ack}}",globalScope._parent);
			wp.onmessage = wom;
		}
	};
	
	return wp;
};

function DedicatedWorker(url) {
	this._ready = false;
	this._queue = [];
	
	this.postMessage = function (o) {
		/* debug code if (document) document.getElementById("demoworkers").innerHTML+=("this._id: " + this._id); */
		if (this._wp && this._id !== null && this._ready) {
			this._wp.sendMessage(o,this._id);
		} else {
			this._queue.push(o);
		}
	};
	
	url = url.charAt(0)==="/" ? globalScope.location.href.split("/")[0]+url : (url.indexOf(":")!=-1 ? url : globalScope.location.href.substring(0,globalScope.location.href.lastIndexOf("/")+1) + url);

	this._source = [
		"var html5shims=(" + html5shims.scripts["InitHtml5Shims"] + ")(this);",
		"var navigator = " + html5shims.toSource(navigator)+";",
		"navigator.online=true;",
		"html5shims.scripts.WorkerGlobalScope='" + html5shims.escapeQuotes(html5shims.scripts.WorkerGlobalScope) + "';",
		"html5shims.scripts.Worker='" + html5shims.escapeQuotes(html5shims.scripts.Worker) + "';",
		"google.gears.workerPool.onmessage = function (a,b,msg) { google.gears.workerPool.sendMessage(msg.body,0); };",
		"html5shims.loadShim('Worker','/apis/DedicatedWorker.js');",
		"html5shims.loadShim('WorkerGlobalScope','/apis/WorkerGlobalScope.js');",
		"html5shims.workerGlobalScope = html5shims.DedicatedWorkerGlobalScope(\""+url+"\");",
		"html5shims.workerGlobalScope.attach(this);",
		"//html5shims.workerGlobalScope._loadSource({url: ['" + url + "'], callback: function(scripts){ html5shims.workerGlobalScope._scripts = scripts; html5shims.workerGlobalScope._execute('importScripts(\""+url+"\")'); html5shims.workerGlobalScope._start(); } });"
	].join("\n");
	
	function defineOnMessageHandler() {
		if (arguments.length > 0) {
			delete this["onmessage"];
			this.onmessage = arguments[0];
		}
		if (typeof this.onmessage === "undefined") {
			throw new Error("undefined onmessage handler and worker to be created: " + url);
		}
		/* create the Gears worker process */
		this._wp = html5shims.entangleGearsWorkerPool(this);
		
		this._ready = false;
		this._id = this._wp.createWorker(this._source);
		/* debug code workerPool.sendMessage("created gears worker: " + this._id,0); */
		html5shims._workers["w"+this._id] = this;
		/* upon receipt of this message, the WorkerGlobalScope will entangle with the worker and redefine it's onmessage method */
		this._wp.sendMessage("{{syn}}",this._id);
	}

	/* we can only create the worker after the onmessage handler is defined
	otherwise we may lose some messages */
	/* for mozilla / opera / webkit / etc */
	if (typeof document !== "undefined" && this.__defineSetter__) {
			this.__defineSetter__("onmessage",function(val){ defineOnMessageHandler.call(this,val); });
	/* for IE / others */
	} else {
		var t = this;
		var interval = globalScope.setInterval(function(){ if (typeof t.onmessage != "undefined") { globalScope.clearInterval(interval); defineOnMessageHandler.call(t); } else { throw new Error("can't find onmessage"); }},1000);
		delete t; delete interval;
	}
	return this;
}

return DedicatedWorker;