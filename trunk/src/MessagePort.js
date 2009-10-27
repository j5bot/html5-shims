/* 

Each channel has two message ports. Data sent through one port is received by the other port, and vice versa.

Each MessagePort object can be entangled with another (a symmetric relationship). Each MessagePort  object also has a task source called the port message queue, initial empty. A port message queue can be enabled or disabled, and is initially disabled. Once enabled, a port can never be disabled again (though messages in the queue can get moved to another queue or removed altogether, which has much the same effect).

*/
function MessagePort() {
	
	/* port message queue, could also be implemented via local storage or database for cross-window, cross-domain messaging */
	var portMessageQueue = [];
	
	/* use an existing TaskLoop is available */
	var taskLoop = taskLoop || new TaskLoop();
}

/* A simple task loop implementation, replace this with your own task manager */
function TaskLoop() {
	
}
TaskLoop.prototype.add = function (func,interval) {
	return setInterval(func,interval);
}
TaskLoop.prototype.remove = function (id) {
	clearInterval(id);
}

MessagePort.prototype = {
	start: function () {
		var t = this;
		t.enabled = true;
		/* when start is called, the message port should begin processing */
		t._taskId = taskLoop.add(function () { if (t.enabled) { t._sendMessages(); } },15);
	},
	close: function () {
		this.enabled = false;
		taskLoop.remove(this._taskId);
	},
	entagle: function (source) {
		// establish the symmetric entangledment of this port and the entangled port
		this.entangled = source;
		source.entangled = this;

		this.ready = true;
	},
	onmessage: function (event) {
		// inboundMessages.push(event);
	},
	postMessage: function (msg, ports) {
		portMessageQueue.push({msg: msg, ports: ports});
	},
	
	/* used to process outbound queue */
	_sendMessages: function () {
		// ready flag is set by the entanglement process
		if (this.entangled && this.ready) {
			if (receiver.onmessage && inboundMessages.length > 0) {
				while (inboundMessages.length > 0) {
					receiver.onmessage(shift(inboundMessages));
				}
			}
		}
		*/
	},
	
	/* process inbound queue */
	_receiveMessages: function () {
		/*
		if (ready) {
			if (sender.postMessage && outboundMessages.length > 0) {
				while (outboundMessages.length > 0) {
					var mo = shift(outboundMessages);
					// post the message to all ports specified
					sender.postMessage(mo.msg,mo.ports);
				}
			}
		} */
	}
};