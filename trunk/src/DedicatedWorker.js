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

/*
	a shim implementing the HTML5 web worker specification on top of google gears
	
	@author Jonathan 'J5' Cook (jonathan.j5.cook@gmail.com)
	@impetus Andrea Giammarchi (http://webreflection.blogspot.com)
*/

if (typeof Worker === "undefined" || Worker.prototype.constructor === Worker) {
	Worker = (function InitWorker(window,navigator,wgsSource){
		function DedicatedWorker(url) {
			this._ready = false;
			this._queue = [];
			
			url = url.charAt(0)==="/" ? window.location.href.split("/")[0]+url : (url.indexOf(":")!=-1 ? url : window.location.href.substring(0,window.location.href.lastIndexOf("/")+1) + url);

			this._source = [
				wgsSource,
				"var wgs = new DedicatedWorkerGlobalScope(\""+url+"\");",
				"wgs.navigator = " + toSource.call(navigator)+";",
				"wgs.navigator.online=true;",
				"Worker=wgs.Worker=("+InitWorker+")(wgs,"+ toSource.call(navigator) +",'"+ escapeQuotes(wgsSource)+"');",
				"wgs._loadSource({url: ['" + url + "'], "+
				"callback: function(scripts){ wgs._scripts = scripts; wgs._execute('importScripts(\""+url+"\")'); } });"
			].join("\n");
					
			function escapeQuotes(s) {
				return s.replace(/\\/ig,"\\\\").replace(/\'/ig,"\\'").replace(/\n/ig,"\\n");
			}
			
			function toSource() {
				if (this.toSource) { return this.toSource(); }
				var s = [];
				for (var p in this) {
					s.push("'"+p+"':'"+this[p].toString()+"'")
				}
				return "{"+s.join(",")+"}";
			}
		
			function defineOnMessageHandler() {
				if (arguments.length > 0) {
					delete this["onmessage"];
					this.onmessage = arguments[0];
				}
				if (typeof this.onmessage === "undefined") {
					throw new Error("undefined onmessage handler and worker to be created: " + url);
				}
				/* create the Gears worker process */
				this._ready = false;
				this._id = workerPool.createWorker(this._source);
				workers["w"+this._id] = this;
				/* upon receipt of this message, the WorkerGlobalScope will entangle with the worker and redefine it's onmessage method */
				workerPool.sendMessage("{{syn}}",this._id);
				/* debug code: throw new Error("worker pool for " + this._id + " has handler: " + (wom || wgs.wom || this.wom).toSource()); */
			}

			/* we can only create the worker after the onmessage handler is defined
			otherwise we may lose some messages */
			/* for mozilla / opera / webkit / etc */
			if (typeof document !== "undefined" && this.__defineSetter__) {
					this.__defineSetter__("onmessage",function(val){ defineOnMessageHandler.call(this,val); });
			/* for IE / others */
			} else {
				var t = this;
				var interval = window.setInterval(function(){ if (typeof t.onmessage != "undefined") { window.clearInterval(interval); defineOnMessageHandler.call(t); }},10);
				delete t; delete interval;
			}
			return this;
		}
		DedicatedWorker.prototype.postMessage = function (o) {
			document.getElementById("demoworkers").innerHTML+=("this._id: " + this._id);
			if (workerPool && this._id !== null && this._ready) {
				workerPool.sendMessage(o,this._id);
			} else {
				document.getElementById("demoworkers").innerHTML+=("queueing message: " + o);
				this._queue.push(o);
			}
		};
		
		function shift(t) {
			if (Array.prototype.shift) {
				return Array.prototype.shift.call(t);
			} else {
				var f = t[0];
				t = t.slice(1);
				return f;
			}
		}
	
		/* establish / reference the worker pool */
		if (google && google.gears) {
			if (google.gears.factory.getPermission("HTML5 Web Worker Emulator",null,"We use Google Gears to emulate the HTML5 Web Worker API and provide a faster experience for you.")) {
				var workerPool = google.gears.workerPool || google.gears.factory.create("beta.workerpool");
				var workers = window._workers || {};
				var wom = null;
	
				/* avoid redefining the onmessage handler for workers running in gears */
				if (!google.gears.workerPool) {
					workerPool.onmessage = wom = function (a, b, msg) {
						if (workers && workers["w"+msg.sender]) {
							/* acknowledging an entanglement */
							if (msg.body == "{{ack}}") {
								with (workers["w"+msg.sender]) {
									_ready = true;
									/* dequeue messages waiting to be sent */
									document.getElementById("demoworkers").innerHTML+=("queue length: " + _queue.length);
									while (_queue.length > 0) {
										postMessage(shift(_queue));
									}
								}
							} else {
								/* receiving a message */
								workers["w"+msg.sender].onmessage({data:msg.body});
							}
						} else {
							throw new Error("w" + msg.sender + " does not exist? message is: " + msg.body);
						}
					};
				}
			
				return DedicatedWorker;
			} else {
				throw new Error("Permission to use gears was not granted");
			}
		} else {
			throw new Error("No native worker implementation and google gears is not installed");
		}
	})(
		/* pass the current context in as window -- so this must be an object which provides a window-like environment... either a WorkerGlobalScope or a window */
		this,
		/* pass in a copy of the navigator object from the context */
		{
			appName: navigator.appName,
			appVersion: navigator.appVersion,
			platform: navigator.platform,
			userAgent: navigator.userAgent
		},
		/* load in the source for WorkerGlobalScope and pass it in */
		(function (url){
			    var xhr = typeof ActiveXObject === "undefined" ? new window.XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
			    xhr.open("get", url, false);
			    xhr.send(null);
			    return xhr.responseText;
			})(
				/* REPLACE WITH FULL PATH OF SCRIPT, OR SET THE REFERENCED GLOBAL VAR */
				window["html5-shim.baseURL"] + "WorkerGlobalScope.js"
			)
		);
}