onmessage = function (event) {
	postMessage("reply to: " + event.data + " from child");
};

postMessage("worker A created");
postMessage("worker A navigator.appName: " + navigator.appName);
postMessage("worker A now creating nested worker B");
var w = new Worker("grandchild.js");
w.onmessage = function (event) {
	postMessage("data resent from nested worker B through it's parent: " + event.data);
};
postMessage("nested worker B created, now importing a script");
importScripts("../scripts/import.js");
postMessage("worker A setting a timer");
setTimeout(function(){postMessage("worker A timer triggered"); },4000);