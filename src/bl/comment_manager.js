const { Comment } = require("../types/comments");

class CommentManager {
  constructor(/** CommentManagerOptions */ options, /** App */ app) {
    this._options = options;
    this._app = app;
    this._log = app.logger.for(CommentManager);
  }

  /**
   * @param {Comment} comment
   * @return {Promise<Comment|*>}
   * @private
   */
  async _insertComment(comment) {
    if (comment.replyToId) {
      comment.replyToId = this._app.mongo.id(comment.replyToId);
    }
    const res = await this._app.mongo.comments.insertOne(comment);
    return new Comment(res.ops[0]);
  }

  /**
   * @param {CommentPayload} payload
   * @param {CommentSource} source
   */
  async create(payload, source) {
    const comment = new Comment(payload);

    comment.contentHash = this._app.hashUtil.hashContent(comment.text);
    comment.createdAt = new Date();
    comment.modifiedAt = new Date();
    comment.source = source;

    comment.published = await this._app.contentModerator.moderate(comment.text);

    return await this._insertComment(comment);
  }
}

module.exports = {
  CommentManager
};
