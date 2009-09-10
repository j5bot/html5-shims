onmessage = function (event) {
	postMessage("reply to: " + event.data + " from grandchild");
};

postMessage("nested worker created, parent ID is: " + (this._parent || "no worker ID in official API"));
postMessage("nested worker navigator.appVersion: " + navigator.appVersion);
postMessage("nested worker setting a timer");
setTimeout(function(){postMessage("nested worker B timer triggered"); },3000);