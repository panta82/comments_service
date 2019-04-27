module.exports = function appController(/** App */ app) {
  app.webServer.get("/api/hello/:word", req => {
    return req.params.word;
  });
};
