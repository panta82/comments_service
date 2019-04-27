const { assign } = require("../util");

const KEYS_WM = new WeakMap();

class Model {
  assign(source) {
    let keys = KEYS_WM.get(this);
    if (!keys) {
      keys = {};
      for (const key in this) {
        if (this.hasOwnProperty(key)) {
          keys[key] = key;
        }
      }
      KEYS_WM.set(this, keys);
    }

    assign(this, source);

    for (const key in this) {
      if (!keys[key]) {
        delete this[key];
      }
    }
  }
}

module.exports = {
  Model
};
