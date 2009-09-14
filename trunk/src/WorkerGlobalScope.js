/*
        Copyright 2009 Jonathan 'J5' Cook 
        Licensed under the Apache License, Version 2.0 (the "License"); 
        you may not use this file except in compliance with the License. 
        You may obtain a copy of the License at 
        http://www.apache.org/licenses/LICENSE-2.0 Unless required 
        by applicable law or agreed to in writing, software distributed 
        under the License is distributed on an "AS IS" BASIS, WITHOUT 
        WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
        See the License for the specific language governing permissions 
        and limitations under the License.
*/
function WorkerGlobalScope (url) {
	
	/* WorkerGlobalScope abstract interface */
	/* readonly attribute WorkerGlobalScope */
	this.self = this;

	/* readonly attribute WorkerLocation */
	this.location = new WorkerLocation(url);

	/* attribute Function onerror */
	this.onerror = function() {};

	/* interface WorkerUtils */
	/* readonly attribute Navigator navigator
	
	ATTRIBUTE IS INITIALIZED AFTER CONSTRUCTOR IS RUN
	*/
	this.navigator = null;
	
	/* this flag is set by the close method to TRUE, at which time no further events can be queued */
	/*
	Each WorkerGlobalScope object also has a closing flag, which must initially be false, but which can get set to true by the algorithms in the processing model section below.

	Once the WorkerGlobalScope's closing flag is set to true, the event loop's task queues must discard any further tasks that would be added to them
	(tasks already on the queue are unaffected unless otherwise specified).
	
	Effectively, once the closing flag is true, timers stop firing, notifications for all pending asynchronous operations are dropped, etc.
	*/
	this.closing = false;
	
	/* Ports owned by WorkerGlobalScope, which are entangled with other workers or with the "parent" */
	/*
	Each WorkerGlobalScope worker global scope has a list of the worker's ports, which consists of all the MessagePort objects that are entangled with another port
	and that have one (but only one) port owned by worker global scope. This list includes  the implicit MessagePort in the case of dedicated workers.
	*/
	this._ports = [];
	
	/* Workers spawned by WorkerGlobalScope, i.e. in which this worker is the "parent" */
	/*
	Each WorkerGlobalScope also has a list of the worker's workers. Initially this list is empty; it is populated when the worker creates or obtains further workers.
	*/
	this._workers = {};
	
	/* Documents known to this worker */
	/*
	Finally, each WorkerGlobalScope also has a list of the worker's Documents. Initially this list is empty; it is populated when the worker is created.

	Whenever a Document d is added to the worker's Documents, the user agent must, for each worker in the list of the worker's workers
	whose list of the worker's Documents does not contain d, add d to q's WorkerGlobalScope owner's list of the worker's Documents.

	Whenever a Document object is discarded, it must be removed from the list of the worker's Documents of each worker whose list contains that Document.
	
	WTF::: when importScript loads a document into the workerglobalscope, for each sub-worker that does not already have the document loaded, do something?
	I think this has to do with knowing what scripts are running, where
	*/
	this._documents = [];
	
	/* cache of scripts to be loaded via importScripts */
	this._scripts = {};
	
	this._parent = null;
	
	/* simple implementation of the entanglement without using ports */
	this._wp = (function (wgs) {
		var wp = google.gears.workerPool;
		wp.onmessage = wgs.wom = function (a,b,msg) {
			if (wgs._parent === null && msg.body==="{{syn}}") {
				wgs._parent = msg.sender;
				wp.sendMessage("{{ack}}",wgs._parent);

				/* redefine onmessage */
				wp.onmessage = function(a,b,msg) {
					/* message coming from the inner worker */
					if (wgs._workers && wgs._workers["w"+msg.sender]) {
						/* set the worker to ready after ack */
						if (msg.body==="{{ack}}") {
							wgs._workers["w"+msg.sender]._ready=true;
						} else {
							wgs._workers["w"+msg.sender].onmessage({data:msg.body});
						}
					} else if (msg.sender === wgs._parent){
					/* message coming from the parent */
						wgs.onmessage({data:msg.body});
					} else {
						/*
						message is not from a parent or child worker
						each "port" is only available to the Worker and the WorkerGlobalScope -- i.e. all messages
						must go through parent-child MessagePort, they cannot go from grandchild to grandparent or from sibling to sibling
						as may be possible in SharedWorker
						*/
					}
				};
			} else {
				/* maybe you want to do this, maybe you don't: wgs.onmessage({data:msg.body}); */
				throw new Error("message came in but I don't know how to respond!");
			}
		};
		return wp;
	})(this);
	
	/* debug code: throw new Error("wgs handler: " + this.wom); */
}

function DedicatedWorkerGlobalScope (url) {
	
	var t = new WorkerGlobalScope(url);
	
	/* attribute Function onmessage */
	t.onmessage = function () {};
	
	return t;
}

function SharedWorkerGlobalScope (url, name) {
	
	var t = new WorkerGlobalScope(url);
	
	t.name = name;
	t.applicationCache = new ApplicationCache();
	
	/* ports connect to worker scope through connect event */
	t.onconnect = function () {};
	
	return t;
}

function WorkerLocation(url){
	/* URL is expanded to full path by DedicatedWorker constructor */
    var m = /^([^:]+):\/\/([^\/]*)([^\?#]+)(\?([^#]*))?(#(.*))?$/.exec(this.href = "" + url);
    /*
	if(m === null)
        throw new Error("Invalid URL");
	*/
	if (m === null) { return false; }
    this.protocol = m[1] + ":";
    this.host = m[2] || "";
    this.pathname = m[3] || "";
    this.search = m[5] ? m[4] : "";
    this.hash = m[7] ? m[6] : "";
    m = this.host.split(":");
    this.hostname = m[0];
    this.port = m[1] || "";
	this.toString = function() { return url; };
}

/*
Navigator implements NavigatorID;
Navigator implements NavigatorOnLine;

[Supplemental, NoInterfaceObject]
interface NavigatorID {
  readonly attribute DOMString appName;
  readonly attribute DOMString appVersion;
  readonly attribute DOMString platform;
  readonly attribute DOMString userAgent;
};

[Supplemental, NoInterfaceObject]
interface NavigatorOnLine {
  readonly attribute boolean onLine;
};

*/
/* added after object construction, now
function Navigator() {
	this.appName = "";
	this.appVersion = "";
	this.platform = "";
	this.userAgent = "";
	this.onLine = true;
}
*/

/* no ideas! */
function ApplicationCache() {
	
}

SharedWorkerGlobalScope.prototype = DedicatedWorkerGlobalScope.prototype = WorkerGlobalScope.prototype = {

	/* private, implementation specific methods */
	/* Execute the given code in the worker global scope (using with) */
	_execute: function(source) {
		/* debugging code: this.self.postMessage(source.toSource()); */
		Function("with (this.self) { " + source + " }").call(this);
	},
	
	_loadSource: function(options) {
		
		/* variable declarations */
		var urls = options.url.slice ? options.url : [options.url],
			callback = options.callback,
			scripts = {},
			inprogress = true,
		
			XMLHttpRequest = this.XMLHttpRequest,
			re = /importScripts\(["']{1}([^"']*)["']{1}\)/mig,
			location = this.location;

		function loadMore () {
			if (urls.length === 0) {
				if (!inprogress) {
					callback(scripts);
				}
			} else {
				/* gears Array doesn't have shift */
				var l = absolute(urls[0]);
				urls = urls.slice(1);
				load(l);
			}
		}

		function test (source) {
			var scripts = [];
			var matches = re.exec(source);
			while (matches !== null) {
				scripts.push(matches[1]);
				matches = re.exec(source);
			}
			urls = urls.concat(scripts);
		}
		
		/* return the "absolute" version of the given URL */
		function absolute(url) {
			return url.charAt(0)==="/" ? location.href.split("/")[0]+url : (url.indexOf(":")!=-1 ? url : location.href.substring(0,location.href.lastIndexOf("/")+1) + url);
		}

		function load (url) {
			if (!scripts[url]) {
				if (urls.length===0 && inprogress) { inprogress = false; }
				var xhr = new XMLHttpRequest();
				xhr.open("get",url,true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState===4) {
						scripts[url]={source: xhr.responseText, loaded: true};
						test(xhr.responseText);
						loadMore();
					}
				};
				xhr.send();
			} else {
				loadMore();
			}
		}
		
		/* debugging code: throw new Error("shift: " + typeof(urls.shift) + ", slice: " + typeof(urls.slice)); */
		
		loadMore();
	},
	
	_timerMethod: function(method) {
		if (typeof this._timer === "undefined") {
			this._timer = google.gears.factory.create("beta.timer");
		}
		/* can't use apply here because gears timer object doesn't implement it */
		return arguments.length == 2 ? this._timer[method](arguments[1]) : this._timer[method](arguments[1],arguments[2]);
	},
	
	/* WorkerGlobalScope abstract interface */
	/* void close() */
	/*
		When a script invokes the close()  method on a WorkerGlobalScope object, the user agent must run the following steps (atomically):
		   1. Discard any tasks that have been added to the event loop's task queues.
		   2. Set the worker's WorkerGlobalScope object's closing flag to true. (This prevents any further tasks from being queued.)
		   3. Disentangle all the ports in the list of the worker's ports.
	*/
	close: function () {
		this.closing = true;
	},

	/* interface WorkerUtils */
	/* void importScripts (in DOMString... url) */
	importScripts: function () {
	/* import the script(s) and then execute it in the worker global scope, in order, synchronously */
		/*
		Set the script's global object to worker global scope.

		Set the script's browsing context to owner browsing context.

		Set the script's URL character encoding to UTF-8. (This is just used for encoding non-ASCII characters in the query component of URLs.)

		Set the script's base URL to url.
		*/
		/* the script is read from a cache generated when the WorkerGlobalScope is created */
		for(var i = 0, length = arguments.length; i < length; ++i) {
	        this._execute(this._scripts[ arguments[i] ].source);
		}
	},	
	
	/* Implements TimerUtils */
	setTimeout: function (f,t) {
		return this._timerMethod("setTimeout",f,t);
	},

	setInterval: function (f,t) {
		return this._timerMethod("setInterval",f,t);
	},

	clearTimeout: function (f) {
		return this._timerMethod("clearTimeout",f);
	},

	clearInterval: function (f) {
		return this._timerMethod("clearInterval",f);
	},

	/* Other available APIs */
	openDatabase: function () {
	
	},

	openDatabaseSync: function () {
		
	},
	
	/* the shim for XHR */
	XMLHttpRequest: function() {
		/* flag whether synchronous request is supported */
		var xhr, syncable = true, _async = true, t = this;
		/* get the available XHR object */
		if (typeof window === "undefined") {
			xhr = google.gears.factory.create("beta.httprequest");
			syncable = false;
		} else if (typeof ActiveXObject === "undefined") {
			if (typeof XMLHttpRequest != "undefined") {
				xhr = new XMLHttpRequest();
			} else {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
		}
		
		/* here we can redefine the XHR methods if needed, but I had no success with implementing synchronous call this way */
		
		return xhr;
	},
	
	/*
	WebSocket
	MessageChannel
	EventSource
	*/
	
	/* this will be overwritten by the parent's implementation */
	Worker: function () {
		
	},
	
	SharedWorker: function () {
	/* the implementation of SharedWorker is not started */
	}
};

/* void postMessage(in any message, optional in MessagePortArray ports); */
DedicatedWorkerGlobalScope.prototype.postMessage = function (message, ports) {
	/*
	DedicatedWorkerGlobalScope objects act as if they had an implicit MessagePort associated with them. This port is part of a channel that is set up when the worker is created, but it is not exposed. This object must never be garbage collected before the DedicatedWorkerGlobalScope object.

	All messages received by that port must immediately be retargeted at the DedicatedWorkerGlobalScope object.

	The postMessage() method on DedicatedWorkerGlobalScope objects must act as if, when invoked, it immediately invoked the method of the same name on the port, with the same arguments, and returned the same return value.
	*/
	this._wp.sendMessage(message,this._parent);
};