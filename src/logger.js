const debug = require("debug");

class Logger {
  constructor(/** LoggerOptions */ options) {
    this.options = options;

    // Explicitly enable debug-s we have configured
    debug.disable();
    debug.enable(options.debug);
  }

  for(name) {
    if (name.name) {
      name = name.name;
    }
    return debug(this.options.prefix + ":" + name);
  }
}

module.exports = {
  Logger
};
