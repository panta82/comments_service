const crypto = require("crypto");

class HashUtil {
  constructor(options, /** App */ app) {
    this._options = options;
    this._log = app.logger.for(HashUtil);
  }

  hashContent(content) {
    return crypto
      .createHash("md5")
      .update(String(content))
      .digest("hex");
  }
}

module.exports = {
  HashUtil
};
