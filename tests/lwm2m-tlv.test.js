const chai = require('chai');

const { expect } = chai;
const { TLV } = require('../lwm2m');

describe('LwM2M TLV', () => {
  describe('binaryToInteger', () => {
    it('should convert binary data to integer', () => {
      const buffer = Buffer.from([0x02]);
      const binToInt = TLV.binaryToInteger;
      const integer = binToInt(buffer);
      expect(integer).to.be.eql(2);
    });
  });

  describe('binaryToBitString', () => {
    it('should convert binary data to string', () => {
      const buffer = Buffer.from([0x02]);
      const binToString = TLV.binaryToBitString;
      const string = binToString(buffer);
      expect(typeof string).to.be.eql('string');
      expect(string).to.be.eql('10');
    });
  });

  describe('changeBufferSize', () => {
    const changeBuffer = TLV.changeBufferSize;
    it('should change buffer size', () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
      const newBuffer = changeBuffer(buffer, 0, 5);
      expect(typeof newBuffer).to.be.eql('object');
      expect(newBuffer.length).to.be.eql(5);
    });
    it('should throw an error when given size is larger than buffer', (done) => {
      try {
        const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
        changeBuffer(buffer, 0, 8);
      } catch (e) {
        done();
      }
    });
    it('should throw an error when given start index is larger than end index', (done) => {
      try {
        const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
        changeBuffer(buffer, 12, 8);
      } catch (e) {
        done();
      }
    });
    it('should throw an error when start index is negative', (done) => {
      try {
        const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
        changeBuffer(buffer, -1, 8);
      } catch (e) {
        done();
      }
    });
    it('should throw an error when given object is not buffer', (done) => {
      try {
        const notBuffer = {};
        changeBuffer(notBuffer, 0);
      } catch (e) {
        done();
      }
    });
  });

  describe('getDictionaryByValue', () => {

  });

  describe('encodeResourceValue', () => {
    const encode = TLV.encodeResourceValue;
    it('should throw an error if value is not a number', (done) => {
      try {
        const res = {
          value: 'NAN'
        };
        encode(res);
      } catch (e) {
        done();
      }
    });

    it('should return empty buffer if resource type is set to none', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.NONE,
        value: 0x80000000
      };

      expect(encode(res)).to.be.eql(Buffer.from([]));
    });

    it('should throw an error if resource type is set to none and value is not a number', (done) => {
      try {
        const res = {
          type: TLV.RESOURCE_TYPE.NONE,
          value: 'NAN'
        };
        encode(res);
      } catch (e) {
        done();
      }
    });

    it('should encode integer (0)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 0
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x00]));
    });

    it('should encode integer (1)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 1
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x01]));
    });

    it('should encode integer (-1)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: -1
      };

      expect(encode(res)).to.be.eql(Buffer.from([0xff]));
    });

    it('should encode integer (2^7 - 1)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 127
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x7f]));
    });

    it('should encode integer (-2^7)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: -128
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x80]));
    });

    it('should encode integer (2^7)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 128
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x00, 0x80]));
    });

    it('should encode integer (2^15 - 1)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 32767
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x7f, 0xff]));
    });

    it('should encode integer (-2^15)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: -0x8000
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x80, 0x00]));
    });

    it('should encode integer (2^15)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 0x8000
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x00, 0x00, 0x80, 0x00]));
    });

    it('should encode integer (2^31 - 1)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: 0x7fffffff
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x7f, 0xff, 0xff, 0xff]));
    });

    it('should encode integer (-2^31)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.INTEGER,
        value: -0x80000000
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x80, 0x00, 0x00, 0x00]));
    });

    it('should throw an error if resource type is set to integer and value is not a number', (done) => {
      try {
        const res = {
          type: TLV.RESOURCE_TYPE.INTEGER,
          value: 'NAN'
        };
        encode(res);
      } catch (e) {
        done();
      }
    });

    it('should throw an error if value is set as 64-bit integer', (done) => {
      try {
        const res = {
          type: TLV.RESOURCE_TYPE.INTEGER,
          value: 0x7ffffffff
        };
        encode(res);
      } catch (e) {
        done();
      }
    });

    it('should encode float (1.23)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.FLOAT,
        value: 1.23
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x3f, 0x9d, 0x70, 0xa4]));
    });

    it('should throw an error if resource type is set to float and value is not a number', (done) => {
      try {
        const res = {
          type: TLV.RESOURCE_TYPE.FLOAT,
          value: 'NAN'
        };
        encode(res);
      } catch (e) {
        done();
      }
    });

    it('should encode boolean (true)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.BOOLEAN,
        value: true
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x01]));
    });

    it('should throw an error if resource type is set to boolean and value is not a boolean', (done) => {
      try {
        const res = {
          type: TLV.RESOURCE_TYPE.BOOLEAN,
          value: 'Not boolean'
        };
        encode(res);
      } catch (e) {
        done();
      }
    });

    it('should encode string (text)', () => {
      const res = {
        type: TLV.RESOURCE_TYPE.STRING,
        value: 'text'
      };

      expect(encode(res)).to.be.eql(Buffer.from([0x74, 0x65, 0x78, 0x74]));
    });

    it('should throw an error if resource type is set to string and value is not a string', (done) => {
      try {
        const res = {
          type: TLV.RESOURCE_TYPE.STRING,
          value: 123
        };
        encode(res);
      } catch (e) {
        done();
      }
    });
  });

  describe('decodeResourceValue', () => {
    const decode = TLV.decodeResourceValue;
    describe('Resource type: integer', () => {
      it('return 0 if given buffer is empty', () => {
        const buffer = Buffer.from([]);
        const res = {
          type: TLV.RESOURCE_TYPE.INTEGER,
        };

        expect(decode(buffer, res)).to.be.eql(0);
      });

      it('should decode buffer to 8 bit integer', () => {
        const buffer = Buffer.from([0x01]);
        const res = {
          type: TLV.RESOURCE_TYPE.INTEGER,
        };

        expect(decode(buffer, res)).to.be.eql(1);
      });

      it('should decode buffer to 16 bit integer', () => {
        const buffer = Buffer.from([0x00, 0x80]);
        const res = {
          type: TLV.RESOURCE_TYPE.INTEGER,
        };

        expect(decode(buffer, res)).to.be.eql(128);
      });

      it('should decode buffer to 32 bit integer', () => {
        const buffer = Buffer.from([0x7f, 0xff, 0xff, 0xff]);
        const res = {
          type: TLV.RESOURCE_TYPE.INTEGER,
        };

        expect(decode(buffer, res)).to.be.eql(2147483647);
      });

      it('should throw an error if given buffer length does not meet 8, 16, 32 bit integer', (done) => {
        try {
          const buffer = Buffer.from([0x7f, 0xff, 0xff]);
          const res = {
            type: TLV.RESOURCE_TYPE.INTEGER,
          };
          decode(buffer, res);
        } catch (e) {
          done();
        }
      });
    });

    describe('Resource type: float', () => {
      it('should decode buffer to float', () => {
        const buffer = Buffer.from([0x3f, 0x9d, 0x70, 0xa4]);
        const res = {
          type: TLV.RESOURCE_TYPE.FLOAT,
        };

        expect(Number(decode(buffer, res).toPrecision(7))).to.be.eql(1.23);
      });

      it('should decode buffer to double', () => {
        const buffer = Buffer.from([0x3f, 0xf3, 0xae, 0x14, 0x7a, 0xe1, 0x47, 0xae]);
        const res = {
          type: TLV.RESOURCE_TYPE.FLOAT,
        };

        expect(decode(buffer, res)).to.be.eql(1.23);
      });

      it('should throw an error if given buffer length does not meet float or double', (done) => {
        try {
          const buffer = Buffer.from([0x7f, 0xff, 0xff]);
          const res = {
            type: TLV.RESOURCE_TYPE.FLOAT,
          };
          decode(buffer, res);
        } catch (e) {
          done();
        }
      });
    });

    describe('Resource type: string', () => {
      it('should decode buffer to string', () => {
        const buffer = Buffer.from([0x74, 0x65, 0x78, 0x74]);
        const res = {
          type: TLV.RESOURCE_TYPE.STRING,
        };

        expect(decode(buffer, res)).to.be.eql('text');
      });
    });

    describe('Resource type: boolean', () => {
      it('should decode buffer to boolean', () => {
        const buffer = Buffer.from([0x01]);
        const res = {
          type: TLV.RESOURCE_TYPE.BOOLEAN,
        };

        expect(decode(buffer, res)).to.be.eql(true);
      });
    });
  });

  describe('encodeResourceTLV', () => {
    const encode = TLV.encodeResource;
    it('should encode resource and return a buffer', () => {
      const res = {
        identifier: 5850,
        type: TLV.RESOURCE_TYPE.BOOLEAN,
        value: true
      };
      expect(typeof encode(res)).to.be.eql('object');
      expect(encode(res)).to.be.eql(Buffer.from([0xe1, 0x16, 0xda, 0x01]));
    });

    it('should encode multiple resources instance and return a buffer', () => {
      const res = {
        identifier: 5850,
        type: TLV.RESOURCE_TYPE.BOOLEAN,
        value: [true, false]
      };
      expect(typeof encode(res)).to.be.eql('object');
    });
  });

  describe('encodeResourceInstanceTLV', () => {
    const encode = TLV.encodeResourceInstance;
    it('should encode resource instance and return a buffer', () => {
      const res = {
        identifier: 5850,
        type: TLV.RESOURCE_TYPE.BOOLEAN,
        value: true
      };
      expect(typeof encode(res)).to.be.eql('object');
      expect(encode(res)).to.be.eql(Buffer.from([0x61, 0x16, 0xda, 0x01]));
    });
  });

  describe('decodeResourceTLV', () => {
    const decode = TLV.decodeResource;
    it('should decode resource and return its identifier, type, value, tlv size', () => {
      const buffer = Buffer.from([0xe1, 0x16, 0xda, 0x01]);
      const res = {
        identifier: 5850,
        type: TLV.RESOURCE_TYPE.BOOLEAN,
      };
      const decoded = decode(buffer, res);
      expect(typeof decoded).to.be.eql('object');
      expect(decoded.identifier).to.be.eql(5850);
      expect(decoded.type).to.be.eql(1);
      expect(decoded.value).to.be.eql(true);
      expect(decoded.tlvSize).to.be.eql(4);
    });

    it('should decode resource and return its identifier, type, value, tlv size', () => {
      const buffer = Buffer.from([0xa6, 0x16, 0xda, 0x41, 0x00, 0x01, 0x41, 0x01, 0x00]);
      const res = {
        identifier: 5850,
        type: TLV.RESOURCE_TYPE.BOOLEAN,
      };
      const decoded = decode(buffer, res);
      expect(typeof decoded).to.be.eql('object');
      expect(decoded.identifier).to.be.eql(5850);
      expect(decoded.type).to.be.eql(1);
      expect(decoded.value).to.be.eql([true, false]);
      expect(decoded.tlvSize).to.be.eql(9);
    });
  });
});
