const { CommentPayload, CommentSource } = require("../types/comments");

module.exports = function commentsController(/** App */ app) {
  app.webServer.post("/api/comments", req => {
    const payload = new CommentPayload(req.body);
    const source = new CommentSource({
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"]
    });

    return app.commentManager.create(payload, source);
  });
};
