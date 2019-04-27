const dotenv = require("dotenv");

const { assign } = require("./util");

class Settings {
  constructor(/** Settings */ source) {
    this.Logger = /** @lends {LoggerOptions.prototype} */ {
      prefix: "CommentsService",
      debug: "CommentsService:"
    };

    /** @type {WebServerOptions} */
    this.WebServer = /** @lends {WebServerOptions.prototype} */ {
      /**
       * Web server port to listen on
       * @type {number}
       */
      port: 3000
    };

    /** @type {MongoDBOptions} */
    this.MongoDB = /** @lends {MongoDBOptions.prototype} */ {
      url: "mongodb://localhost:27017",
      db: "comments_service"
    };

    /** @type {CommentManagerOptions} */
    this.commentManager = /** @lends {CommentManagerOptions.prototype} */ {};

    assign(this, source);
  }

  /**
   * @param env
   * @return {Settings}
   */
  static fromEnv(env) {
    return new Settings({
      Logger: {
        debug: env.DEBUG
      },
      WebServer: {
        port: env.PORT
      },
      MongoDB: {
        url: env.MONGO_URL,
        db: env.MONGO_DB
      }
    });
  }

  /**
   * @return {Settings}
   */
  static load() {
    dotenv.config();
    return Settings.fromEnv(process.env);
  }
}

module.exports = {
  Settings
};
