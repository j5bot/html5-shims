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
A collection of shims which make the current browser environment support some features of the HTML5 spec
*/

// optionally assign a visible reference to html5shims
// html5shims = 
(function InitHtml5Shims(globalScope) {
	
	// The constructor for a new html5shims object
	function Html5Shims() {
		
		// retrieve and store the global variable for our path and then destroy it
		this.path = globalScope["html5-shims.baseURL"];
		delete globalScope["html5-shims.baseURL"];
				
		//  APIs which are waiting to be loaded queue here
		this.lazyLoadingQueue = [];
				
		// a store of the scripts, including the initializer, we'll use this to send APIs into the worker global scope
		this.scripts = { InitHtml5Shims: InitHtml5Shims };
		
		// reference back to the prototype for later extending
		this.prototype = this.constructor.prototype;
	}
	var html5shims = new Html5Shims();
	
	Html5Shims.prototype.status = {
		IDLE: 0,
		LOADING: 1,
		READY: 3
	};
	Html5Shims.prototype.attach = function () {
		// for all of the APIs, make them available to the global scope
		with (globalScope) {
			if (Html5Shims.prototype.Worker) { Worker = Html5Shims.prototype.Worker; }
		}
	};
	
	/* Helper Methods */	
	/* this method provides a closure for the address of the script which provides the shim and returns
	   a function which will load the shim on first use, or as soon as the lazyloader is started (when the page is idle) */
	Html5Shims.prototype.lazyLoadShim = function (name,source,isObject) {
		// Add this shim to the queue of what to load when we're ready
		var llqRef = this.lazyLoadingQueue.push({name: name, source: source, status: this.status.IDLE});
		var hs = this;
		return function () {
			hs.loadShim(name,source);
			if (isObject) {
				var o = new Object();
				o.constructor = hs[name];
				hs[name].prototype.constructor.apply(o,arguments);
				return o;
			}
		};
	};
	/* immediately asynchrounously load the given shim script. calls made before the script is loaded are queued */
	Html5Shims.prototype.loadShim = function (name,source) {
		var hs = this;
		this.load(name,source);
		// finally, return the function which queues calls while we wait
		return hs[name];
	};
	
	/* load in the source given, attach it to the prototype as name */
	Html5Shims.prototype.load = function (name,source) {
		if (!this.scripts[name]) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET",this.path + source,false);
			xhr.send(null);
			this.scripts[name]=xhr.responseText;
		}
		Html5Shims.prototype[name] = Function("html5shims", "globalScope", this.scripts[name])(this,globalScope);
	};
	
	Html5Shims.prototype.escapeQuotes = function (s) {
		return s.replace(/\\/ig,"\\\\").replace(/\'/ig,"\\'").replace(/\n/ig,"\\n");
	};
	
	Html5Shims.prototype.toSource = function (t) {
		if (t.toSource) { return t.toSource(); }
		var s = [];
		for (var p in t) {
			s.push("'"+p+"':'"+t[p].toString()+"'")
		}
		return "{"+s.join(",")+"}";
	};	
			
	/* APIs provided by shims */
	if (typeof globalScope.Worker === "undefined" || globalScope.Worker.prototype.constructor === globalScope.Worker) {
		Html5Shims.prototype.Worker = html5shims.lazyLoadShim("Worker","/apis/DedicatedWorker.js",true);
	}
	
	html5shims.attach();
		
	// return the shims object
	return html5shims;

})(this); // we pass in the global scope object using the "this" reference, but refer to it as "globalScope"