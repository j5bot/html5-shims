// test that the html5shims constructor and object is not visible in the global scope
function testObjectVisibility () {
	jsUnity.assertions.assertEqual(typeof(Html5Shims),"undefined","Html5Shims constructor is not defined");
	jsUnity.assertions.assertEqual(typeof(html5shims),"undefined","html5shims object is not defined");
}

// test that the worker is defined and that we can create a simple worker
function testWorker () {
	jsUnity.assertions.assertNotUndefined(Worker,"worker is defined");
	var w = new Worker("../workers/simplechild.js");
	document.getElementById("html5shimsworker").innerHTML=w._source;
	w.onmessage = function (event) {
		alert(event.data);
	};
	w.postMessage("sending test message");
	jsUnity.assertions.assertNotUndefined(w,"worker was created");
}

function singleTest(name,func) {
	var tst = {}
	tst[name]=func;
	return jsUnity.run(tst);
}