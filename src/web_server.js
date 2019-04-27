const http = require("http");

const express = require("express");

class WebServer {
  constructor(/** WebServerOptions */ options, /** App */ app) {
    this._options = options;
    this._log = app.logger.for(WebServer);

    this._express = express();

    this._express.use(express.json());
    this._express.use(express.urlencoded({ extended: false }));

    this._router = express.Router();
    this._express.use("/", this._router);

    this._express.use((...args) => this._requestLoggerMiddleware(...args));
  }

  _wrapHandler(handler) {
    return (req, res, next) => {
      return Promise.resolve()
        .then(() => handler(req, res))
        .then(
          result => {
            res.status(200).send(result);
          },
          err => next(err)
        );
    };
  }

  /**
   * @param {e.Request} req
   * @param res
   * @param next
   * @private
   */
  _requestLoggerMiddleware(req, res, next) {
    this._log(`${req.method} ${req.path}`);
  }

  /**
   * @callback handlerCallback
   * @param {e.Request} req
   * @param {e.Response} res
   */

  /**
   * @param path
   * @param {handlerCallback} handler
   */
  get(path, handler) {
    this._router.get(path, this._wrapHandler(handler));
  }

  /**
   * @param path
   * @param {handlerCallback} handler
   */
  post(path, handler) {
    this._router.post(path, this._wrapHandler(handler));
  }

  /**
   * @param path
   * @param {handlerCallback} handler
   */
  put(path, handler) {
    this._router.put(path, this._wrapHandler(handler));
  }

  /**
   * @param path
   * @param {handlerCallback} handler
   */
  patch(path, handler) {
    this._router.patch(path, this._wrapHandler(handler));
  }

  /**
   * @param path
   * @param {handlerCallback} handler
   */
  delete(path, handler) {
    this._router.delete(path, this._wrapHandler(handler));
  }

  _onError(err) {
    this._log(err);
  }

  start() {
    // Add final middleware-s

    this._express.use((err, req, res, next) => {
      res.status(err.status || err.code || 500);
      res.send({
        message: err.message || err
      });

      this._log(err);
    });

    this._log("Starting...");

    return new Promise((resolve, reject) => {
      this._http = http.createServer(this._express);

      const onListenError = err => {
        if (err.syscall === "listen") {
          switch (err.code) {
            case "EACCES":
              return reject(
                new Error(
                  `Port ${this._options.port} requires elevated privileges`
                )
              );
            case "EADDRINUSE":
              return reject(
                new Error(`Port ${this._options.port} is already in use`)
              );
          }
        }

        reject(err);
      };

      this._http.once("error", onListenError);
      this._http.listen(this._options.port, () => {
        this._http.removeListener("error", onListenError);
        this._http.on("error", err => this._onError(err));

        this._log(`Listening on http://localhost:${this._options.port}`);

        resolve();
      });
    });
  }
}

module.exports = {
  WebServer
};
