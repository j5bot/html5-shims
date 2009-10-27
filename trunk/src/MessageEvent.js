/* A message event object, which represents a message that will be consumed by various systems

Messages in server-sent events, Web sockets, cross-document messaging, and channel messaging use the message event.

The following interface is defined for this event:

interface MessageEvent : Event {
  readonly attribute any data;
  readonly attribute DOMString origin;
  readonly attribute DOMString lastEventId;
  readonly attribute WindowProxy source;
  readonly attribute MessagePortArray ports;
  void initMessageEvent(in DOMString typeArg, in boolean canBubbleArg, in boolean cancelableArg, in any dataArg, in DOMString originArg, in DOMString lastEventIdArg, in WindowProxy sourceArg, in MessagePortArray portsArg);
  void initMessageEventNS(in DOMString namespaceURI, in DOMString typeArg, in boolean canBubbleArg, in boolean cancelableArg, in any dataArg, in DOMString originArg, in DOMString lastEventIdArg, in WindowProxy sourceArg, in MessagePortArray portsArg);
};

event . data

    Returns the data of the message.
event . origin

    Returns the origin of the message, for server-sent events and cross-document messaging.
event . lastEventId

    Returns the last event ID, for server-sent events.
event . source

    Returns the WindowProxy of the source window, for cross-document messaging.
event . ports

    Returns the MessagePortArray sent with the message, for cross-document messaging and channel messaging.
*/

function MessageEvent () {
	this.namespaceURI = null;
	this.type = null;
	this.cancelable = null;
	this.canBubble = null;
	this.data = null;
	this.origin = null;
	this.lastEventId = null;
	this.source = null; // window or workerutils interface
	this.ports = null;
}

MessageEvent.prototype = {
	initMessageEvent: function (type, canBubble, cancelable, data, origin, lastEventId, source, ports) {
		this.type = type;
		this.canBubble = canBubble;
		this.cancelable = cancelable;
		this.data = data;
		this.origin = origin;
		this.lastEventId = lastEventId;
		this.source = source;
		this.ports = ports;
	},
	// namespaced version
	initMessageEventNS: function (namespaceURI, type, canBubble, cancelable, data, origin, lastEventId, source, ports) {
		this.initMessageEvent(type,canBubble,cancelable,data,origin,lastEventId,source,ports);
		this.namespaceURI = namespaceURI;
	}
};