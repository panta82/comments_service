const dotenv = require("dotenv");

const { assign } = require("./util");

class Settings {
  constructor(/** Settings */ source) {
    this.Logger = /** @lends {LoggerOptions.prototype} */ {
      prefix: "CommentsService",
      debug: "CommentsService:"
    };

    this.WebServer = /** @lends {WebServerOptions.prototype} */ {
      /**
       * Web server port to listen on
       * @type {number}
       */
      port: 3000
    };

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
