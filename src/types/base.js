const { ObjectID } = require("mongodb");

const { assign } = require("../util");

// *********************************************************************************************************************

const KEYS_WM = new WeakMap();

class Model {
  _ensureKeys() {
    let keys = KEYS_WM.get(this.constructor);
    if (!keys) {
      keys = {};
      for (const key in this) {
        if (this.hasOwnProperty(key)) {
          keys[key] = key;
        }
      }
      KEYS_WM.set(this.constructor, keys);
    }
    return keys;
  }

  assign(source) {
    this._ensureKeys();

    assign(this, source);

    const keys = this._ensureKeys();
    for (const key in this) {
      if (!keys[key]) {
        delete this[key];
      }
    }
  }

  mongoize() {
    for (const key in this) {
      if (this.hasOwnProperty(key) && this[key] === undefined) {
        delete this[key];
      }
    }

    if (this.constructor.OBJECT_IDS) {
      for (const key of this.constructor.OBJECT_IDS) {
        if (this[key]) {
          this[key] = ObjectID(this[key]);
        }
      }
    }
    return this;
  }
}

// *********************************************************************************************************************

class CustomError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
  }
}

// *********************************************************************************************************************

module.exports = {
  Model,
  CustomError
};
