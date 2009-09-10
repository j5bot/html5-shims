postMessage("imported script I successfully executing, now setting a timer");
setTimeout(function() {
	postMessage("imported script I timer executed");
},1000);

postMessage("imported script I now creating another nested worker");
var iw = new Worker("grandchild.js");
iw.onmessage = function(event) {
	postMessage("nested worker C received a message: " + event.data);
};
postMessage("nested worker C created in imported script I")