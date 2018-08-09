

const EventEmitter = require('events');
const rest = require('node-rest-client');
const express = require('express');
const parser = require('body-parser');
const ip = require('ip');

/**
 * This class represents endpoint (device)
 */
class Endpoint extends EventEmitter {
  /**
   * Constructor initiliazes given service object, endpoint's id
   * and starts listening for events emited by service (when endpoint
   * registers, updates, deregisters, sends data), handles "async
   * responses" and emits "register", "update", "deregister" events.
   * @constructor
   * @param {object} service - service object
   * @param {string} id - endpoint id
   */
  constructor(service, id) {
    super();

    this.service = service;
    this.id = id;
    this.transactions = {};
    this.observations = {};

    this.service.on('register', (name) => {
      if (this.id === name) {
        this.emit('register');
      }
    });

    this.service.on('update', (name) => {
      if (this.id === name) {
        this.emit('update');
      }
    });

    this.service.on('deregister', (name) => {
      if (this.id === name) {
        this.emit('deregister');
      }
    });

    this.service.on('async-response', (resp) => {
      const ID = resp.id;
      const code = resp.status;
      const data = resp.payload;
      if (this.transactions[ID] !== undefined) {
        this.transactions[ID](code, data);
        delete this.transactions[ID];
      }

      if (this.observations[ID] !== undefined) {
        this.observations[ID](code, data);
      }
    });
  }

  /**
   * Sends request to get all endpoint's objects
   * @returns {Promise} Promise object with endpoint's objects
   */
  getObjects() {
    return new Promise((fulfill, reject) => {
      this.service.get(`/endpoints/${this.id}`).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 200) {
          fulfill(dataAndResponse.data);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Adds a callback to transactions list.
   * Key value is endpoint's id
   * @private
   * @param {string} id - endpoint id
   * @param {function} callback -   callback which will be called when async response is recieved
   * @return {void}
   */
  addAsyncCallback(id, callback) {
    this.transactions[id] = callback;
  }

  /**
   * Sends request to read endpoint's resource data
   * @param {string} path - resource path
   * @param {function} callback - callback which will be called when async response is recieved
   * @returns {Promise} Promise object with async response id
   */
  read(path, callback) {
    return new Promise((fulfill, reject) => {
      this.service.get(`/endpoints/${this.id}${path}`).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 202) {
          const id = dataAndResponse.data['async-response-id'];
          this.addAsyncCallback(id, callback);
          fulfill(id);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to write a value into endpoint's resource
   * @param {string} path - resource path
   * @param {function} callback - callback which will be called when async response is recieved
   * @param {buffer} tlvBuffer - data in TLV format
   * @returns {Promise} Promise object with async response id
   */
  write(path, callback, tlvBuffer) {
    return new Promise((fulfill, reject) => {
      this.service.put(`/endpoints/${this.id}${path}`, tlvBuffer).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 202) {
          const id = dataAndResponse.data['async-response-id'];
          this.addAsyncCallback(id, callback);
          fulfill(id);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to execute endpoint's resource
   * @param {string} path - resource path
   * @param {function} callback - callback which will be called when async response is recieved
   * @returns {Promise} Promise object with async response id
   */
  execute(path, callback) {
    return new Promise((fulfill, reject) => {
      this.service.post(`/endpoints/${this.id}${path}`).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 202) {
          const id = dataAndResponse.data['async-response-id'];
          this.addAsyncCallback(id, callback);
          fulfill(id);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to subscribe to resource
   * @param {string} path - resource path
   * @param {function} callback - callback which will be called when async response is recieved
   * @returns {Promise} Promise object with async response id
   */
  observe(path, callback) {
    return new Promise((fulfill, reject) => {
      this.service.put(`/subscriptions/${this.id}${path}`).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 202) {
          const id = dataAndResponse.data['async-response-id'];
          this.observations[id] = callback;
          fulfill(id);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to cancel subscriptions
   * @param {string} path - resource path
   * @returns {Promise} Promise object with HTTP status code
   */
  cancelObserve(path) {
    return new Promise((fulfill, reject) => {
      this.service.delete(`/subscriptions/${this.id}${path}`).then((dataAndResponse) => {
        // Promise is fulfilled with any status code.
        // 204 means observation will be succesfully cancelled.
        // 404 means observation will not be deleted because it was not registered or found.
        fulfill(dataAndResponse.resp.statusCode);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

/**
 * This class represents REST API service
 */
class Service extends EventEmitter {
  /**
   * Initializes default configurations.
   * opts - options object which stores host, ca (CA certificate),
   * authentication(true/ false), username, password, polling (true/false),
   * port (for socket listener)
   * @constructor
   * @param {object} opts - options object
   */
  constructor(opts) {
    super();
    this.config = {
      host: 'http://localhost:8888',
      ca: '',
      authentication: false,
      username: '',
      password: '',
      interval: 1234,
      polling: false,
      port: 5728,
    };
    this.authenticationToken = '';
    this.tokenValidation = 3600;
    this.configure(opts);
    this.ipAddress = ip.address();
    this.configureNodeRestClient();
    this.addTlvSerializer();
    this.express = express();
    this.express.use(parser.json());
  }

  /**
   * Configures service configuration with given options
   * @private
   * @param {object} opts - options object
   * @return {void}
   */
  configure(opts) {
    Object.keys(opts).forEach((opt) => {
      this.config[opt] = opts[opt];
    });
  }

  /**
   * Initializes node rest client
   * @private
   * @return {void}
   */
  configureNodeRestClient() {
    const opts = {
      ca: this.config.ca
    };
    this.client = new rest.Client({ connection: opts });
  }

  /**
   * Stops service if it was runing.
   * Starts authentication,
   * socket listener creation and notification callback registration
   * or notification polling processes
   * @param {object} opts - options object
   * @returns {Promise} Empty promise
   */
  start(opts) {
    return new Promise((fulfill, reject) => {
      const promises = [];

      promises.push(this.stop());

      if (opts !== undefined) {
        this.configure(opts);
      }

      if (this.config.authentication) {
        const authenticatePromise = this.authenticate().then((data) => {
          this.authenticationToken = data.access_token;
          this.tokenValidation = data.expires_in;
          const authenticateTime = 0.9 * (this.tokenValidation * 1000);
          this.authenticateTimer = setInterval(() => {
            this.authenticate().then((newData) => {
              this.authenticationToken = newData.access_token;
            }).catch((err) => {
              console.error(`Failed to authenticate user: ${err}`);
            });
          }, authenticateTime);
        }).catch((err) => {
          console.error(`Failed to authenticate user: ${err}`);
          reject(err);
        });
        promises.push(authenticatePromise);
      }

      Promise.all(promises).then(() => {
        if (!this.config.polling) {
          this.createServer().catch((err) => {
            console.error(`Failed to create socket listener: ${err}`);
            reject(err);
          }).then(() => this.registerNotificationCallback()).catch((err) => {
            console.error(`Failed to set notification callback: ${err}`);
            reject(err);
          })
            .then(() => {
              fulfill();
            });
        } else {
          this.pollTimer = setInterval(() => {
            this.pullNotification().then((data) => {
              this._processEvents(data);
            }).catch((err) => {
              console.error(`Failed to pull notifications: ${err}`);
            });
          }, this.config.interval);
          fulfill();
        }
      });
    });
  }

  /**
   * Stops authentication timer,
   * shuts down socket listener and deletes notificatrion callback,
   * stops polling notifications
   * @returns {Promise} Promise array
   */
  stop() {
    const promises = [];

    if (this.authenticateTimer !== undefined) {
      clearInterval(this.authenticateTimer);
      this.authenticateTimer = undefined;
    }
    if (this.server !== undefined) {
      this.server.close();
      this.server = undefined;
      promises.push(this.deleteNotificationCallback());
    }
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    return Promise.all(promises);
  }

  /**
   * Creates socket listener
   * @returns {Promise} Empty promise
   */
  createServer() {
    return new Promise((fulfill, reject) => {
      this.express.put('/notification', (req, resp) => {
        this._processEvents(req.body);
        resp.send();
      });
      this.server = this.express.listen(this.config.port, fulfill);
      this.server.on('error', reject);
    });
  }

  /**
   * Sends request to authenticate user
   * @returns {Promise} Promise with authentication data (token and after what time it expires)
   */
  authenticate() {
    return new Promise((fulfill, reject) => {
      const data = {
        name: this.config.username,
        secret: this.config.password
      };
      const type = 'application/json';

      this.post('/authenticate', data, type).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 201) {
          fulfill(dataAndResponse.data);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to register notification callback
   * @returns {Promise} Empty promise
   */
  registerNotificationCallback() {
    return new Promise((fulfill, reject) => {
      const data = {
        url: `http://${this.ipAddress}:${this.config.port}/notification`,
        headers: {},
      };
      const type = 'application/json';

      this.put('/notification/callback', data, type).then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 204) {
          fulfill(dataAndResponse.data);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to delete notification callback
   * @returns {Promise} Promise object with HTTP status code
   */
  deleteNotificationCallback() {
    return new Promise((fulfill, reject) => {
      this.delete('/notification/callback').then((dataAndResponse) => {
        // Promise is fulfilled with any status code.
        // 204 means callback will be succesfully removed.
        // 404 means callback will not be removed because it was not registered or found.
        fulfill(dataAndResponse.resp.statusCode);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to check whether or not notification callback is reigstered
   * @returns {Promise} Promise with notification callback data
   */
  checkNotificationCallback() {
    return new Promise((fulfill, reject) => {
      this.get('/notification/callback').then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 200) {
          fulfill(dataAndResponse.data);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to get notifications
   * @returns {Promise} Promise with notification data (registrations,
   * deregistrations, updates, async responses)
   */
  pullNotification() {
    return new Promise((fulfill, reject) => {
      this.get('/notification/pull').then((dataAndResponse) => {
        fulfill(dataAndResponse.data);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to get all connected endpoints
   * @returns {Promise} Promise with endpoints
   */
  getDevices() {
    return new Promise((fulfill, reject) => {
      this.get('/endpoints').then((dataAndResponse) => {
        if (dataAndResponse.resp.statusCode === 200) {
          fulfill(dataAndResponse.data);
        } else {
          reject(dataAndResponse.resp.statusCode);
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Sends request to get REST servers version
   * @returns {Promise} Promise with REST server's versiong
   */
  getVersion() {
    return new Promise((fulfill, reject) => {
      this.get('/version').then((dataAndResponse) => {
        fulfill(dataAndResponse.data);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Adds TLV serializer to rest client
   * @return {void}
   */
  addTlvSerializer() {
    this.client.serializers.add({
      name: 'buffer-serializer',
      isDefault: false,
      match: request => request.headers['Content-Type'] === 'application/vnd.oma.lwm2m+tlv',
      serialize: (data, nrcEventEmitter, serializedCallback) => {
        if (data instanceof Buffer) {
          nrcEventEmitter('serialized', data);
          serializedCallback(data);
        }
      },
    });
  }

  /**
   * Performs GET requests with given path
   * @param {string} path - request path
   * @returns {Promise} Promise with data and response object
   */
  get(path) {
    return new Promise((fulfill, reject) => {
      const url = this.config.host + path;
      const args = {};
      args.headers = {};
      if (this.config.authentication) {
        args.headers.Authorization = `Bearer ${this.authenticationToken}`;
      }

      const getRequest = this.client.get(url, args, (data, resp) => {
        const dataAndResponse = {};
        dataAndResponse.data = data;
        dataAndResponse.resp = resp;
        fulfill(dataAndResponse);
      });
      getRequest.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Performs PUT requests with given path, data and data type
   * @param {string} path - request path
   * @param {object} argument - data which will be sent
   * @param {string} type - data type
   * @returns {Promise} Promise with data and response object
   */
  put(path, argument, type = 'application/vnd.oma.lwm2m+tlv') {
    return new Promise((fulfill, reject) => {
      const url = this.config.host + path;
      const args = {
        headers: { 'Content-Type': type },
        data: argument,
      };
      if (this.config.authentication) {
        args.headers.Authorization = `Bearer ${this.authenticationToken}`;
      }
      const putRequest = this.client.put(url, args, (data, resp) => {
        const dataAndResponse = {};
        dataAndResponse.data = data;
        dataAndResponse.resp = resp;
        fulfill(dataAndResponse);
      });
      putRequest.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Performs GET requests with given path
   * @param {string} path - request path
   * @returns {Promise} Promise with data and response object
   */
  delete(path) {
    return new Promise((fulfill, reject) => {
      const url = this.config.host + path;
      const args = {};
      args.headers = {};
      if (this.config.authentication) {
        args.headers.Authorization = `Bearer ${this.authenticationToken}`;
      }
      const deleteRequest = this.client.delete(url, args, (data, resp) => {
        const dataAndResponse = {};
        dataAndResponse.data = data;
        dataAndResponse.resp = resp;
        fulfill(dataAndResponse);
      });
      deleteRequest.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Performs PUT requests with given path, data and data type
   * @param {string} path - request path
   * @param {object} argument - data which will be sent
   * @param {string} type - data type
   * @returns {Promise} Promise with data and response object
   */
  post(path, argument, type = 'application/vnd.oma.lwm2m+tlv') {
    return new Promise((fulfill, reject) => {
      const url = this.config.host + path;
      const args = {
        headers: { 'Content-Type': type },
        data: argument,
      };
      if (this.config.authentication) {
        args.headers.Authorization = `Bearer ${this.authenticationToken}`;
      }
      const postRequest = this.client.post(url, args, (data, resp) => {
        const dataAndResponse = {};
        dataAndResponse.data = data;
        dataAndResponse.resp = resp;
        fulfill(dataAndResponse);
      });
      postRequest.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Handles notification data and emits events
   * @private
   * @param {object} events - Notifications (registrations,
   * reg-updates, de-registrations, async-responses)
   * @return {void}
   */
  _processEvents(events) {
    for (let i = 0; i < events.registrations.length; i += 1) {
      const id = events.registrations[i].name;
      this.emit('register', id);
    }

    for (let i = 0; i < events['reg-updates'].length; i += 1) {
      const id = events['reg-updates'][i].name;
      this.emit('update', id);
    }

    for (let i = 0; i < events['de-registrations'].length; i += 1) {
      const id = events['de-registrations'][i].name;
      this.emit('deregister', id);
    }

    const responses = events['async-responses'].sort((x, y) => x.timestamp - y.timestamp);
    for (let i = 0; i < responses.length; i += 1) {
      const res = responses[i];
      this.emit('async-response', res);
    }
  }
}

module.exports.Service = Service;
module.exports.Device = Endpoint;
