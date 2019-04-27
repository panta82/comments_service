const MongoClient = require("mongodb").MongoClient;

class MongoDB {
  constructor(/** MongoDBOptions */ options, /** App */ app) {
    this._options = options;
    this._app = app;
    this._log = app.logger.for(MongoDB);
  }

  start() {
    this._client = new MongoClient(this._options.url, {
      useNewUrlParser: true
    });
    return this._client.connect().then(() => {
      this._log(`Connected to ${this._options.url}`);

      this._db = this._client.db(this._options.db);
    });
  }

  /**
   * @type {Collection}
   */
  get comments() {
    return this._db.collection("comments");
  }

  stop() {
    if (this._client) {
      return this._client.close();
    }
  }
}

module.exports = {
  MongoDB
};
