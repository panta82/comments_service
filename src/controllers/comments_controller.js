const {
  CommentCreatePayload,
  CommentUpdatePayload,
  CommentSource
} = require("../types/comments");

module.exports = function commentsController(/** App */ app) {
  app.webServer.get("/api/comments/:id", req => {
    return app.commentManager.getCommentWithReplies(req.params.id);
  });

  app.webServer.post("/api/comments", req => {
    const payload = new CommentCreatePayload(req.body);
    const source = new CommentSource({
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"]
    });

    return app.commentManager.create(payload, source);
  });

  app.webServer.patch("/api/comments/:id", req => {
    const payload = new CommentUpdatePayload(req.body);
    return app.commentManager.update(req.params.id, payload);
  });
};
