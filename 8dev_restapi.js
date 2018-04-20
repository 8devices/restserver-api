

const EventEmitter = require('events');
const rest = require('node-rest-client');
const express = require('express');
const parser = require('body-parser');

class Endpoint extends EventEmitter {
  constructor(service, id) {
    super();

    this.service = service;
    this.id = id;
    this.transactions = {};
    this.observations = {};

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

    service.attachEndpoint(this);
  }

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

  addAsyncCallback(id, callback) {
    this.transactions[id] = callback;
  }

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
}

class Service extends EventEmitter {
  constructor(opts) {
    super();
    this.config = opts;
    this.client = new rest.Client();
    this.endpoints = [];
    this.addTlvSerializer();
    this.express = express();
    this.express.use(parser.json());
  }

  start(interval = 1234) {
    this.pollTimer = setInterval(() => {
      this.get('/notification/pull').then((dataAndResponse) => {
        this._processEvents(dataAndResponse.data);
      }).catch(() => {
        console.error('Failed to pull notifications!');
      });
    }, interval);
  }

  stop() {
    clearInterval(this.pollTimer);
  }

  setCallback() {
    const args = {
      data: {
        url: 'http://localhost:5727/notification',
        headers: {},
      },
      headers: { 'Content-Type': 'application/json' },
    };
    const callbackRequest = this.client.put(`${this.config.host}/notification/callback`, args, () => {});
    callbackRequest.on('error', (err) => {
      console.log(err);
    });
    this.express.put('/notification', (req, resp) => {
      this._processEvents(req.body);
      resp.send();
    });
    this.server = this.express.listen(5727);
  }

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

  get(path) {
    return new Promise((fulfill, reject) => {
      const args = {
        headers: { 'Content-Type': 'application/vnd.oma.lwm2m+tlv' },
      };
      const url = this.config.host + path;
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

  put(path, tlvBuffer) {
    return new Promise((fulfill, reject) => {
      const args = {
        headers: { 'Content-Type': 'application/vnd.oma.lwm2m+tlv' },
        data: tlvBuffer,
      };
      const url = this.config.host + path;
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

  post(path) {
    return new Promise((fulfill, reject) => {
      const args = {
        headers: { 'Content-Type': 'application/vnd.oma.lwm2m+tlv' },
      };
      const url = this.config.host + path;
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

  _processEvents(events) {
    for (let i = 0; i < events.registrations.length; i += 1) {
      const id = events.registrations[i].name;
      if (this.endpoints[id]) {
        this.endpoints[id].emit('register');
      }
    }

    for (let i = 0; i < events['reg-updates'].length; i += 1) {
      const id = events['reg-updates'][i].name;
      if (this.endpoints[id]) {
        this.endpoints[id].emit('update');
      }
    }

    for (let i = 0; i < events['de-registrations'].length; i += 1) {
      const id = events['de-registrations'][i].name;
      if (this.endpoints[id]) {
        this.endpoints[id].emit('deregister');
      }
    }

    const responses = events['async-responses'].sort((x, y) => x.timestamp - y.timestamp);
    for (let i = 0; i < responses.length; i += 1) {
      const res = responses[i];
      this.emit('async-response', res);
    }
  }

  createNode(id) {
    if (!this.endpoints[id]) {
      this.endpoints[id] = new Endpoint(this, id);
    }

    return this.endpoints[id];
  }

  attachEndpoint(ep) {
    this.endpoints[ep.id] = ep;
  }
}

module.exports.Service = Service;
module.exports.Device = Endpoint;
