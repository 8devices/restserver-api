const chai = require('chai');
const nock = require('nock');

const { expect } = chai;
const response = require('./rest-response');
const restAPI = require('../8dev_restapi.js');

describe('Rest API interface', () => {
  chai.should();
  const url = 'http://localhost:8888';
  const deviceName = 'threeSeven';
  const path = '/3312/0/5850';
  const service = new restAPI.Service({ host: url });
  const device = new restAPI.Device(service, deviceName);
  const tlvBuffer = Buffer.from([0xe4, 0x16, 0x44, 0x00, 0x00, 0x00, 0x01]);

  describe('Endpoint interface', () => {
    describe('getObjects function', () => {
      it('should return an array of all endpont\'s resource paths', () => {
        nock(url)
          .get(`/endpoints/${deviceName}`)
          .reply(200, response.sensorObjects);
        return device.getObjects().then((resp) => {
          expect(typeof resp).to.equal('object');
          resp.should.be.a('array');
          resp[0].should.have.property('uri');
        });
      });

      it('should return an error (status code number) if status code is not 200', () => {
        nock(url)
          .get(`/endpoints/${deviceName}`)
          .reply(400);
        return device.getObjects().catch((err) => {
          expect(typeof err).to.equal('number');
        });
      });
    });

    describe('read function', () => {
      it('should return async-response-id ', () => {
        nock(url)
          .get(`/endpoints/${deviceName}${path}`)
          .reply(202, response.request);
        const idRegex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
        return device.read(path).then((resp) => {
          expect(typeof resp).to.equal('string');
          resp.should.match(idRegex);
        });
      });

      it('should return an error (status code number) if status code is not 202', () => {
        nock(url)
          .get(`/endpoints/${deviceName}${path}`)
          .reply(400);
        return device.read(path).catch((err) => {
          expect(typeof err).to.equal('number');
        });
      });
    });

    describe('write function', () => {
      it('should return async-response-id ', () => {
        nock(url)
          .put(`/endpoints/${deviceName}${path}`)
          .reply(202, response.request);
        const idRegex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
        return device.write(path, () => {}, tlvBuffer).then((resp) => {
          expect(typeof resp).to.equal('string');
          resp.should.match(idRegex);
        });
      });

      it('should return an error (status code number) if status code is not 202', () => {
        nock(url)
          .put(`/endpoints/${deviceName}${path}`)
          .reply(400);
        return device.write(path, () => {}, tlvBuffer).catch((err) => {
          expect(typeof err).to.equal('number');
        });
      });
    });

    describe('execute function', () => {
      it('should return async-response-id ', () => {
        nock(url)
          .post(`/endpoints/${deviceName}${path}`)
          .reply(202, response.request);
        const idRegex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
        return device.execute(path).then((resp) => {
          expect(typeof resp).to.equal('string');
          resp.should.match(idRegex);
        });
      });

      it('should return an error (status code number) if status code is not 202', () => {
        nock(url)
          .post(`/endpoints/${deviceName}${path}`)
          .reply(400);
        return device.execute(path).catch((err) => {
          expect(typeof err).to.equal('number');
        });
      });
    });

    describe('observe function', () => {
      it('should return async-response-id ', () => {
        nock(url)
          .put(`/subscriptions/${deviceName}${path}`)
          .reply(202, response.request);
        const idRegex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
        return device.observe(path).then((resp) => {
          expect(typeof resp).to.equal('string');
          resp.should.match(idRegex);
        });
      });

      it('should return an error (status code number) if status code is not 202', () => {
        nock(url)
          .put(`/subscriptions/${deviceName}${path}`)
          .reply(400);
        return device.observe(path).catch((err) => {
          expect(typeof err).to.equal('number');
        });
      });
    });
    service.stop();
  });

  describe('Service interface', () => {
    describe('start function', () => {
      const defaultPullTime = 1324;
      const timeError = 20;
      const statusCode = 202;
      nock(url)
        .get('/notification/pull')
        .times(4)
        .reply(statusCode, response.oneAsyncResponse);

      it('should send GET requests in order to pull out notifications every 1234 ms if start method is called without a parameter', () => {
        const notificationPullTime = [];
        service.start();
        return new Promise((fulfill) => {
          service.on('async-response', () => {
            notificationPullTime.push(new Date().getTime());
            if (notificationPullTime.length === 2) {
              service.stop();
              fulfill();
            }
          });
        }).then(() => {
          let pulledOnTime = false;
          if (notificationPullTime[1] - notificationPullTime[0] - defaultPullTime <= timeError) {
            pulledOnTime = true;
          }
          pulledOnTime.should.be.eql(true);
        });
      }).timeout(3000);

      it('should send GET requests in order to pull out notifications every interval of time in ms which is set by the parameter', () => {
        const notificationPullTime = [];
        const chosenTime = 200;
        service.start(chosenTime);
        return new Promise((fulfill) => {
          service.on('async-response', () => {
            notificationPullTime.push(new Date().getTime());
            if (notificationPullTime.length === 2) {
              service.stop();
              fulfill();
            }
          });
        }).then(() => {
          let pulledOnTime = false;
          if (notificationPullTime[1] - notificationPullTime[0] - chosenTime <= timeError) {
            pulledOnTime = true;
          }
          pulledOnTime.should.be.eql(true);
        });
      });
    });

    describe('stop function', () => {
      const statusCode = 202;
      nock(url)
        .get('/notification/pull')
        .reply(statusCode, response.oneAsyncResponse);
      it('Stop method should stop sending GET requests for notification pulling', (done) => {
        const chosenTime = 200;
        let pulled = false;
        service.on('async-response', () => {
          pulled = true;
        });
        service.start(chosenTime);
        service.stop();
        setTimeout(() => {
          pulled.should.be.eql(false);
          done();
        }, 300);
      });
    });


    describe('_processEvents function', () => {
      it('should handle notifications', () => {
        let registered = false;
        let updated = false;
        let deregistered = false;
        let asyncResponse = false;
        device.on('register', () => {
          registered = true;
        });
        device.on('update', () => {
          updated = true;
        });
        device.on('deregister', () => {
          deregistered = true;
        });
        service.on('async-response', () => {
          asyncResponse = true;
        });
        service._processEvents(response.notifications);
        registered.should.be.eql(true);
        updated.should.be.eql(true);
        deregistered.should.be.eql(true);
        asyncResponse.should.be.eql(true);
      });
    });

    describe('get function', () => {
      it('should return fullfilled promise with data and response if connection is succesfull', () => {
        const statusCode = 202;
        nock(url)
          .get(`/endpoints/${deviceName}${path}`)
          .reply(statusCode, response.request);
        return service.get(`/endpoints/${deviceName}${path}`).then((dataAndResponse) => {
          expect(typeof dataAndResponse).to.equal('object');
          dataAndResponse.data.should.have.property('async-response-id');
          dataAndResponse.resp.statusCode.should.be.eql(statusCode);
        });
      });

      it('should return rejected promise with exception object if connection is not succesfull', () => service.get(`/endpoints/${deviceName}${path}`).catch((err) => {
        expect(typeof err).to.equal('object');
      }));
    });

    describe('put function', () => {
      it('should return fullfilled promise with data and response if connection is succesfull', () => {
        const statusCode = 202;
        nock(url)
          .put(`/endpoints/${deviceName}${path}`)
          .reply(statusCode, response.request);
        return service.put(`/endpoints/${deviceName}${path}`, tlvBuffer).then((dataAndResponse) => {
          expect(typeof dataAndResponse).to.equal('object');
          dataAndResponse.data.should.have.property('async-response-id');
          dataAndResponse.resp.statusCode.should.be.eql(statusCode);
        });
      });

      it('should return rejected promise with exception object if connection is not succesfull', () => service.put(`/endpoints/${deviceName}${path}`, tlvBuffer).catch((err) => {
        expect(typeof err).to.equal('object');
      }));
    });

    describe('post function', () => {
      it('should return fullfilled promise with data and response if connection is succesfull', () => {
        const statusCode = 202;
        nock(url)
          .post(`/endpoints/${deviceName}${path}`)
          .reply(statusCode, response.request);
        return service.post(`/endpoints/${deviceName}${path}`).then((dataAndResponse) => {
          expect(typeof dataAndResponse).to.equal('object');
          dataAndResponse.data.should.have.property('async-response-id');
          dataAndResponse.resp.statusCode.should.be.eql(statusCode);
        });
      });

      it('should return rejected promise with exception object if connection is not succesfull', () => service.post(`/endpoints/${deviceName}${path}`).catch((err) => {
        expect(typeof err).to.equal('object');
      }));
    });

    describe('createNode function', () => {
      it('should add a new endpoint in service endpoints array if the endpoint does not exist', () => {
        const endpointID = 'testNode';
        const endpoint = service.createNode(endpointID);
        expect(typeof endpoint).to.equal('object');
        endpoint.id.should.be.eql(endpointID);
        service.endpoints[endpointID].should.be.eql(endpoint);
      });
    });

    describe('createNode function', () => {
      it('should add endpoint to endponts array which belongs to service class', () => {
        const attachedEndpointID = 'attachedNode';
        const attachedEndpoint = service.createNode(attachedEndpointID);
        service.attachEndpoint(attachedEndpoint);
        expect(typeof service.endpoints[attachedEndpointID]).to.equal('object');
        service.endpoints[attachedEndpointID].id.should.be.eql(attachedEndpointID);
      });
    });
  });
});

