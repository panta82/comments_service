const SERVICES = {
  Logger: require("./logger").Logger,
  WebServer: require("./web_server").WebServer,

  controllers: [require("./app_controller")]
};

class App {
  constructor(settings) {
    /** @type {Settings} */
    this.settings = settings;

    this._construct();
  }

  _create(name) {
    if (!SERVICES[name]) {
      throw new Error(`Invalid service name: ${name}`);
    }

    const Ctr = SERVICES[name];
    const options = this.settings[name];
    return new Ctr(options, this);
  }

  _construct() {
    /** @type {Logger} */
    this.logger = this._create("Logger");

    /** @type {WebServer} */
    this.webServer = this._create("WebServer");

    for (const controller of SERVICES.controllers) {
      controller(this);
    }
  }

  start() {
    return this.webServer.start();
  }
}

module.exports = {
  App
};
