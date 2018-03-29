const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const nock = require('nock');

const response = require('./rest-response');
const restAPI = require('../8dev_restapi.js');

describe('Rest API interface', () => {
  
  const url = 'http://localhost:8888';
  const device_name = 'threeSeven';
  const path = '/3312/0/5850';
  const service = new restAPI.Service({ host: url});
  const device = new restAPI.Device(service, device_name);
  const tlvBuffer = new Buffer([0xe4, 0x16, 0x44, 0x00, 0x00, 0x00, 0x01]);

  describe('Endpoint interface', () => {
    
    it('getObjects function should return an array of all endpont\'s resource paths', () => {
      nock(url)
      .get('/endpoints/' + device_name)
      .reply(200, response.sensorObjects);
      return device.getObjects().then((resp) => {
        expect(typeof resp).to.equal('object');
        resp.should.be.a('array');
        resp[0].should.have.property('uri');
      });
    });
    
    it('getObjects function should return an error (status code number) if status code is not 200', () => {
      nock(url)
      .get('/endpoints/' + device_name)
      .reply(400);
      return device.getObjects().catch((err) => {
        expect(typeof err).to.equal('number');
      });
    });
    
    it('Read function should return async-response-id ', () => {
      nock(url)
      .get('/endpoints/' + device_name + path)
      .reply(202, response.request);
      const id_regex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
      return device.read(path).then((resp) => {
        expect(typeof resp).to.equal('string');
        resp.should.match(id_regex);
      });
    });
    
    it('Read function should return an error (status code number) if status code is not 202', () => {
      nock(url)
      .get('/endpoints/' + device_name + path)
      .reply(400);
      return device.read(path).catch((err) => {
        expect(typeof err).to.equal('number');
      });
    });
    
    it('Write function should return async-response-id ', () => {
      nock(url)
      .put('/endpoints/' + device_name + path)
      .reply(202, response.request);
      const id_regex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
      return device.write(path, () => {}, tlvBuffer).then((resp) => {
        expect(typeof resp).to.equal('string');
        resp.should.match(id_regex);
      });
    });
    
    it('Write function should return an error (status code number) if status code is not 202', () => {
      nock(url)
      .put('/endpoints/' + device_name + path)
      .reply(400);
      return device.write(path, () => {}, tlvBuffer).catch((err) => {
        expect(typeof err).to.equal('number');
      });
    });
    
    it('Execute function should return async-response-id ', () => {
      nock(url)
      .post('/endpoints/' + device_name + path)
      .reply(202, response.request);
      const id_regex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
      return device.execute(path).then((resp) => {
        expect(typeof resp).to.equal('string');
        resp.should.match(id_regex);
      });
    });
    
    it('Execute function should return an error (status code number) if status code is not 202', () => {
      nock(url)
      .post('/endpoints/' + device_name + path)
      .reply(400);
      return device.execute(path).catch((err) => {
        expect(typeof err).to.equal('number');
      });
    });
    
    it('Observe function should return async-response-id ', () => {
      nock(url)
      .put('/subscriptions/' + device_name + path)
      .reply(202, response.request);
      const id_regex = /^\d+#[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/g;
      return device.observe(path).then((resp) => {
        expect(typeof resp).to.equal('string');
        resp.should.match(id_regex);
      });
    });
    
    it('Observe function should return an error (status code number) if status code is not 202', () => {
      nock(url)
      .put('/subscriptions/' + device_name + path)
      .reply(400);
      return device.observe(path).catch((err) => {
        expect(typeof err).to.equal('number');
      });
    });
    service.stop();
  }); 

  describe('Service interface', () => {

    it('Notification pulling repeat is set to default value (1234 ms) after start method is called without a parameter', () => {
      service.start();
      service.pollTimer._repeat.should.be.eql(1234);
      service.stop();
    });

    it('Notification pulling repeat time is set with a parameter when calling start method', () => {
      const interval = 5000;
      service.start(interval);
      chai.expect(service.pollTimer).to.exist;
      service.pollTimer._repeat.should.be.eql(interval);
      service.stop();
    });

    it('Stop method should stop notification pulling', () => {
      service.start();
      service.stop();
      chai.expect(service.pollTimer).to.exist;
      chai.expect(service.pollTimer._repeat).to.not.exist;
    });

    it('_processEvents method should handle notifications', () => {
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

    it('get method should return fullfilled promise with data and response if connection is succesfull', () => {
      let statusCode = 202;
      let data=null;
      let resp;
      nock(url)
      .get('/endpoints/' + device_name + path)
      .reply(statusCode, response.request);
      return service.get('/endpoints/' + device_name + path).then((dataAndResponse) => {
        expect(typeof dataAndResponse).to.equal('object');
        dataAndResponse.data.should.have.property('async-response-id');
        dataAndResponse.resp.statusCode.should.be.eql(statusCode);
      });
    });
    
    it('get method should return rejected promise with exception object if connection is not succesfull', () => {
    return service.get('/endpoints/' + device_name + path).catch((err) => {
         expect(typeof err).to.equal('object');
      });
    });
    
    it('put method should return fullfilled promise with data and response if connection is succesfull', () => {
      let statusCode = 202;
      let data=null;
      let resp;
      nock(url)
      .put('/endpoints/' + device_name + path)
      .reply(statusCode, response.request);
      return service.put('/endpoints/' + device_name + path, tlvBuffer).then((dataAndResponse) => {
        expect(typeof dataAndResponse).to.equal('object');
        dataAndResponse.data.should.have.property('async-response-id');
        dataAndResponse.resp.statusCode.should.be.eql(statusCode);
      });
    });
    
    it('put method should return rejected promise with exception object if connection is not succesfull', () => {
      return service.put('/endpoints/' + device_name + path, tlvBuffer).catch((err) => {
         expect(typeof err).to.equal('object');
      });
    });
    
    it('post method should return fullfilled promise with data and response if connection is succesfull', () => {
      let statusCode = 202;
      let data=null;
      let resp;
      nock(url)
      .post('/endpoints/' + device_name + path)
      .reply(statusCode, response.request);
      return service.post('/endpoints/' + device_name + path).then((dataAndResponse) => {
        expect(typeof dataAndResponse).to.equal('object');
        dataAndResponse.data.should.have.property('async-response-id');
        dataAndResponse.resp.statusCode.should.be.eql(statusCode);
      });
    });
    
    it('post method should return rejected promise with exception object if connection is not succesfull', () => {
      return service.post('/endpoints/' + device_name + path).catch((err) => {
         expect(typeof err).to.equal('object');
      });
    });
    
    it('createNode method adds a new endpoint in service endpoints array if the endpoint does not exist', () => {
      let endpointID = 'testNode';
      let endpoint = service.createNode(endpointID);
      expect(typeof endpoint).to.equal('object');
      endpoint.id.should.be.eql(endpointID);
      service.endpoints[endpointID].should.be.eql(endpoint);
    });
    
    it('attachEndpoint method should add endpoint to endponts array which belongs to service class', () => {
      let attachedEndpointID = 'attachedNode';
      let attachedEndpoint = service.createNode(attachedEndpointID);
      service.attachEndpoint(attachedEndpoint);
      expect(typeof service.endpoints[attachedEndpointID]).to.equal('object');
      service.endpoints[attachedEndpointID].id.should.be.eql(attachedEndpointID);
    });

  }); 
}); 
