[![Build Status](https://travis-ci.org/8devices/restserver-api.svg?branch=master)](https://travis-ci.org/8devices/restserver-api)
[![codecov](https://codecov.io/gh/8devices/restserver-api/branch/master/graph/badge.svg)](https://codecov.io/gh/8devices/restserver-api)
# restserver-api
## Classes

<dl>
<dt><a href="#Endpoint">Endpoint</a></dt>
<dd><p>This class represents endpoint (device)</p>
</dd>
<dt><a href="#Service">Service</a></dt>
<dd><p>This class represents REST API service</p>
</dd>
</dl>

<a name="Endpoint"></a>

## Endpoint
This class represents endpoint (device)

**Kind**: global class  

* [Endpoint](#Endpoint)
    * [new Endpoint(service, id)](#new_Endpoint_new)
    * [.getObjects()](#Endpoint+getObjects)
    * [.read(path, callback)](#Endpoint+read)
    * [.write(path, callback, tlvBuffer)](#Endpoint+write)
    * [.execute(path, callback)](#Endpoint+execute)
    * [.observe(path, callback)](#Endpoint+observe)
    * [.cancelObserve(path)](#Endpoint+cancelObserve)

<a name="new_Endpoint_new"></a>

### new Endpoint(service, id)
Constructor initiliazes given service object, endpoint's id
and starts listening for events emited by service (when endpoint
registers, updates, deregisters, sends data), handles "async
responses" and emits "register", "update", "deregister" events.


| Param | Type | Description |
| --- | --- | --- |
| service | <code>object</code> | service object |
| id | <code>string</code> | endpoint id |

<a name="Endpoint+getObjects"></a>

### endpoint.getObjects()
Sends request to get all endpoint's objects

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  
<a name="Endpoint+read"></a>

### endpoint.read(path, callback)
Sends request to read endpoint's resource data

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | resource path |
| callback | <code>function</code> | callback which will be called when async response is recieved |

<a name="Endpoint+write"></a>

### endpoint.write(path, callback, tlvBuffer)
Sends request to write a value into endpoint's resource

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | resource path |
| callback | <code>function</code> | callback which will be called when async response is recieved |
| tlvBuffer | <code>buffer</code> | data in TLV format |

<a name="Endpoint+execute"></a>

### endpoint.execute(path, callback)
Sends request to execute endpoint's resource

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | resource path |
| callback | <code>function</code> | callback which will be called when async response is recieved |

<a name="Endpoint+observe"></a>

### endpoint.observe(path, callback)
Sends request to subscribe to resource

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | resource path |
| callback | <code>function</code> | callback which will be called when async response is recieved |

<a name="Endpoint+cancelObserve"></a>

### endpoint.cancelObserve(path)
Sends request to cancel subscriptions

**Kind**: instance method of [<code>Endpoint</code>](#Endpoint)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | resource path |

<a name="Service"></a>

## Service
This class represents REST API service

**Kind**: global class  

* [Service](#Service)
    * [new Service(opts)](#new_Service_new)
    * [.start(opts)](#Service+start)
    * [.stop()](#Service+stop)
    * [.createServer()](#Service+createServer)
    * [.authenticate()](#Service+authenticate)
    * [.registerNotificationCallback()](#Service+registerNotificationCallback)
    * [.deleteNotificationCallback()](#Service+deleteNotificationCallback)
    * [.checkNotificationCallback()](#Service+checkNotificationCallback)
    * [.pullNotification()](#Service+pullNotification)
    * [.getDevices()](#Service+getDevices)
    * [.getVersion()](#Service+getVersion)
    * [.addTlvSerializer()](#Service+addTlvSerializer)
    * [.get(path)](#Service+get)
    * [.put(path, argument, type)](#Service+put)
    * [.delete(path)](#Service+delete)
    * [.post(path, argument, type)](#Service+post)

<a name="new_Service_new"></a>

### new Service(opts)
Initializes default configurations.
opts - options object which stores host, ca (CA certificate),
authentication(true/ false), username, password, polling (true/false),
port (for socket listener)


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options object |

<a name="Service+start"></a>

### service.start(opts)
Stops service if it was runing.
Starts authentication,
socket listener creation and notification callback registration
or notification polling processes

**Kind**: instance method of [<code>Service</code>](#Service)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options object |

<a name="Service+stop"></a>

### service.stop()
Stops authentication timer,
shuts down socket listener and deletes notificatrion callback,
stops polling notifications

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+createServer"></a>

### service.createServer()
Creates socket listener

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+authenticate"></a>

### service.authenticate()
Sends request to authenticate user

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+registerNotificationCallback"></a>

### service.registerNotificationCallback()
Sends request to register notification callback

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+deleteNotificationCallback"></a>

### service.deleteNotificationCallback()
Sends request to delete notification callback

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+checkNotificationCallback"></a>

### service.checkNotificationCallback()
Sends request to check whether or not notification callback is reigstered

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+pullNotification"></a>

### service.pullNotification()
Sends request to get notifications

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+getDevices"></a>

### service.getDevices()
Sends request to get all connected endpoints

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+getVersion"></a>

### service.getVersion()
Sends request to get REST servers version

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+addTlvSerializer"></a>

### service.addTlvSerializer()
Adds TLV serializer to rest client

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+get"></a>

### service.get(path)
Performs GET requests with given path

**Kind**: instance method of [<code>Service</code>](#Service)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | request path |

<a name="Service+put"></a>

### service.put(path, argument, type)
Performs PUT requests with given path, data and data type

**Kind**: instance method of [<code>Service</code>](#Service)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | request path |
| argument |  |  | data which will be sent |
| type | <code>string</code> | <code>&quot;application/vnd.oma.lwm2m+tlv&quot;</code> | data type |

<a name="Service+delete"></a>

### service.delete(path)
Performs GET requests with given path

**Kind**: instance method of [<code>Service</code>](#Service)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | request path |

<a name="Service+post"></a>

### service.post(path, argument, type)
Performs PUT requests with given path, data and data type

**Kind**: instance method of [<code>Service</code>](#Service)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | request path |
| argument |  |  | data which will be sent |
| type |  | <code>application/vnd.oma.lwm2m+tlv</code> | data type |

