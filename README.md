[![Build Status](https://travis-ci.org/8devices/restserver-api.svg?branch=master)](https://travis-ci.org/8devices/restserver-api)
[![codecov](https://codecov.io/gh/8devices/restserver-api/branch/master/graph/badge.svg)](https://codecov.io/gh/8devices/restserver-api)
# restserver-api
## Classes

<dl>
<dt><a href="#Endpoint">Endpoint</a></dt>
<dd><p>This class represents endpoint (device).</p>
</dd>
<dt><a href="#Service">Service</a></dt>
<dd><p>This class represents REST API service.</p>
</dd>
</dl>

<a name="Endpoint"></a>

## Endpoint
This class represents endpoint (device).

**Kind**: global class  

* [Endpoint](#Endpoint)
    * [new Endpoint(service, id)](#new_Endpoint_new)
    * [.getObjects()](#Endpoint+getObjects) ⇒ <code>Promise</code>
    * [.read(path, callback)](#Endpoint+read) ⇒ <code>Promise</code>
    * [.write(path, callback, tlvBuffer)](#Endpoint+write) ⇒ <code>Promise</code>
    * [.execute(path, callback)](#Endpoint+execute) ⇒ <code>Promise</code>
    * [.observe(path, callback)](#Endpoint+observe) ⇒ <code>Promise</code>
    * [.cancelObserve(path)](#Endpoint+cancelObserve) ⇒ <code>Promise</code>

<a name="new_Endpoint_new"></a>

### new Endpoint(service, id)
Constructor initiliazes given service object, endpoint's id
and starts listening for events emited by service (when endpoint
registers, updates, deregisters, sends data), handles "async
responses" and emits "register", "update", "deregister" events.


| Param | Type | Description |
| --- | --- | --- |
| service | <code>object</code> | Service object |
| id | <code>string</code> | Endpoint id |

<a name="Endpoint+getObjects"></a>

### endpoint.getObjects() ⇒ <code>Promise</code>
Sends request to get all endpoint's objects.

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Returns**: <code>Promise</code> - Promise object with endpoint's objects  
<a name="Endpoint+read"></a>

### endpoint.read(path, callback) ⇒ <code>Promise</code>
Sends request to read endpoint's resource data.

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Returns**: <code>Promise</code> - Promise with async response id  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Resource path |
| callback | <code>function</code> | Callback which will be called when async response is received |

<a name="Endpoint+write"></a>

### endpoint.write(path, callback, tlvBuffer) ⇒ <code>Promise</code>
Sends request to write a value into endpoint's resource.

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Returns**: <code>Promise</code> - Promise with async response id  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Resource path |
| callback | <code>function</code> | Callback which will be called when async response is received |
| tlvBuffer | <code>buffer</code> | Data in TLV format |

<a name="Endpoint+execute"></a>

### endpoint.execute(path, callback) ⇒ <code>Promise</code>
Sends request to execute endpoint's resource.

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Returns**: <code>Promise</code> - Promise with async response id  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Resource path |
| callback | <code>function</code> | Callback which will be called when async response is received |

<a name="Endpoint+observe"></a>

### endpoint.observe(path, callback) ⇒ <code>Promise</code>
Sends request to subscribe to resource.

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Returns**: <code>Promise</code> - Promise with async response id  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Resource path |
| callback | <code>function</code> | Callback which will be called when async response is received |

<a name="Endpoint+cancelObserve"></a>

### endpoint.cancelObserve(path) ⇒ <code>Promise</code>
Sends request to cancel subscriptions.

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
**Returns**: <code>Promise</code> - Promise with HTTP status code  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Resource path |

<a name="Service"></a>

## Service
This class represents REST API service.

**Kind**: global class  

* [Service](#Service)
    * [new Service(opts)](#new_Service_new)
    * [.start(opts)](#Service+start) ⇒ <code>Promise</code>
    * [.stop()](#Service+stop) ⇒ <code>Promise</code>
    * [.authenticate()](#Service+authenticate) ⇒ <code>Promise</code>
    * [.registerNotificationCallback()](#Service+registerNotificationCallback) ⇒ <code>Promise</code>
    * [.deleteNotificationCallback()](#Service+deleteNotificationCallback) ⇒ <code>Promise</code>
    * [.checkNotificationCallback()](#Service+checkNotificationCallback) ⇒ <code>Promise</code>
    * [.pullNotification()](#Service+pullNotification) ⇒ <code>Promise</code>
    * [.getDevices()](#Service+getDevices) ⇒ <code>Promise</code>
    * [.getVersion()](#Service+getVersion) ⇒ <code>Promise</code>
    * [.get(path)](#Service+get) ⇒ <code>Promise</code>
    * [.put(path, argument, type)](#Service+put) ⇒ <code>Promise</code>
    * [.delete(path)](#Service+delete) ⇒ <code>Promise</code>
    * [.post(path, argument, type)](#Service+post) ⇒ <code>Promise</code>

<a name="new_Service_new"></a>

### new Service(opts)
Initializes default configurations. Reconfigures with given options.


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | Options object |

**Example**  
```js
const opts = {
  // REST server's address
  host: 'http://localhost:8888',
  // CA certificate
  ca: '',
  // authentication (true or false)
  authentication: false,
  username: '',
  password: '',
  // notification polling (true or false)
  polling: false,
  // Time between each poll in miliseconds
  interval: 1234,
  // port for socket listener (not relevant if polling is disabled)
  port: 5728,
};
new Service(opts);
```
<a name="Service+start"></a>

### service.start(opts) ⇒ <code>Promise</code>
(Re)starts authentication,
socket listener creation and notification callback registration
or notification polling processes.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise which fulfills when service is started  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | Options object (optional) |

**Example**  
```js
const opts = {
  // REST server's address
  host: 'http://localhost:8888',
  // CA certificate
  ca: '',
  // authentication (true or false)
  authentication: false,
  username: '',
  password: '',
  // notification polling (true or false)
  polling: false,
  // Time between each poll in miliseconds
  interval: 1234,
  // port for socket listener (not relevant if polling is disabled)
  port: 5728,
};
service.start(opts);
```
<a name="Service+stop"></a>

### service.stop() ⇒ <code>Promise</code>
Stops receiving and processing events
Stops this service and all it's subservices
that were started in start().
Cleans up resources

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise which fulfills when service is stopped  
<a name="Service+authenticate"></a>

### service.authenticate() ⇒ <code>Promise</code>
Sends request to authenticate user.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with authentication data (token and after what time it expires)  
<a name="Service+registerNotificationCallback"></a>

### service.registerNotificationCallback() ⇒ <code>Promise</code>
Sends request to register notification callback.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise which fulfills when notification callback is registered  
<a name="Service+deleteNotificationCallback"></a>

### service.deleteNotificationCallback() ⇒ <code>Promise</code>
Sends request to delete notification callback.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with HTTP status code  
<a name="Service+checkNotificationCallback"></a>

### service.checkNotificationCallback() ⇒ <code>Promise</code>
Sends request to check whether or not notification callback is registered.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with notification callback data  
<a name="Service+pullNotification"></a>

### service.pullNotification() ⇒ <code>Promise</code>
Sends request to get pending/queued notifications.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with notification data (registrations,
deregistrations, updates, async responses)  
<a name="Service+getDevices"></a>

### service.getDevices() ⇒ <code>Promise</code>
Sends request to get all registered endpoints.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with endpoints  
<a name="Service+getVersion"></a>

### service.getVersion() ⇒ <code>Promise</code>
Sends request to get REST server version.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with REST server's version  
<a name="Service+get"></a>

### service.get(path) ⇒ <code>Promise</code>
Performs GET requests with given path.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with data and response object  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Request path |

<a name="Service+put"></a>

### service.put(path, argument, type) ⇒ <code>Promise</code>
Performs PUT requests with given path, data and data type.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with data and response object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | Request path |
| argument | <code>object</code> |  | Data which will be sent (optional) |
| type | <code>string</code> | <code>&quot;application/vnd.oma.lwm2m+tlv&quot;</code> | Data type (optional) |

<a name="Service+delete"></a>

### service.delete(path) ⇒ <code>Promise</code>
Performs DELETE requests with given path.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with data and response object  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Request path |

<a name="Service+post"></a>

### service.post(path, argument, type) ⇒ <code>Promise</code>
Performs POST requests with given path, data and data type.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - Promise with data and response object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | Request path |
| argument | <code>object</code> |  | Data which will be sent (optional) |
| type | <code>string</code> | <code>&quot;application/vnd.oma.lwm2m+tlv&quot;</code> | Data type (optional) |

