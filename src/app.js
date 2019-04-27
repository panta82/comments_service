const SERVICES = {
  Logger: require("./logger").Logger,
  MongoDB: require("./mongodb").MongoDB,
  WebServer: require("./web_server").WebServer,

  HashUtil: require("./bl/hash_util").HashUtil,
  ContentModerator: require("./bl/content_moderator").ContentModerator,
  CommentManager: require("./bl/comment_manager").CommentManager,

  controllers: [
    require("./controllers/app_controller"),
    require("./controllers/comments_controller")
  ]
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

    /** @type {MongoDB} */
    this.mongo = this._create("MongoDB");

    /** @type {HashUtil} */
    this.hashUtil = this._create("HashUtil");

    /** @type {ContentModerator} */
    this.contentModerator = this._create("ContentModerator");

    /** @type {CommentManager} */
    this.commentManager = this._create("CommentManager");

    for (const controller of SERVICES.controllers) {
      controller(this);
    }
  }

  start() {
    return this.mongo.start().then(() => this.webServer.start());
  }
}

module.exports = {
  App
};
