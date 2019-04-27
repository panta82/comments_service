const http = require("http");

const express = require("express");

class WebServer {
  constructor(/** WebServerOptions */ options, /** App */ app) {
    this.options = options;
    this._log = app.logger.for(WebServer);

    this._app = express();

    this._app.use(express.json());
    this._app.use(express.urlencoded({ extended: false }));

    this._router = express.Router();
    this._app.use("/", this._router);
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

  get(path, handler) {
    this._router.get(path, this._wrapHandler(handler));
  }
  post(path, handler) {
    this._router.post(path, this._wrapHandler(handler));
  }
  use(path, handler) {
    this._router.use(path, this._wrapHandler(handler));
  }
  patch(path, handler) {
    this._router.patch(path, this._wrapHandler(handler));
  }
  delete(path, handler) {
    this._router.delete(path, this._wrapHandler(handler));
  }

  _onError(err) {
    this._log(err);
  }

  start() {
    // Add final middleware-s

    this._app.use((err, req, res, next) => {
      res.status(err.status || err.code || 500);
      res.send({
        message: err.message || err
      });

      this._log(err);
    });

    this._log("Starting...");

    return new Promise((resolve, reject) => {
      this._http = http.createServer(this._app);

      const onListenError = err => {
        if (err.syscall === "listen") {
          switch (err.code) {
            case "EACCES":
              return reject(
                new Error(
                  `Port ${this.options.port} requires elevated privileges`
                )
              );
            case "EADDRINUSE":
              return reject(
                new Error(`Port ${this.options.port} is already in use`)
              );
          }
        }

        reject(err);
      };

      this._http.once("error", onListenError);
      this._http.listen(this.options.port, () => {
        this._http.removeListener("error", onListenError);
        this._http.on("error", err => this._onError(err));

        this._log(`Listening on http://localhost:${this.options.port}`);

        resolve();
      });
    });
  }
}

module.exports = {
  WebServer
};
