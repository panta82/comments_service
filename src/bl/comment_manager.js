const { CustomError } = require("../types/base");
const { Comment } = require("../types/comments");

class CommentManager {
  constructor(/** CommentManagerOptions */ options, /** App */ app) {
    this._options = options;
    this._app = app;
    this._log = app.logger.for(CommentManager);
  }

  // *******************************************************************************************************************

  /**
   * @param {Comment} comment
   * @return {Promise<Comment|*>}
   * @private
   */
  async _insertComment(comment) {
    const res = await this._app.mongo.comments.insertOne(comment.mongoize());
    return new Comment(res.ops[0]);
  }

  /**
   * @param {CommentCreatePayload} payload
   * @param {CommentSource} source
   */
  async create(payload, source) {
    const comment = new Comment(payload);

    comment.contentHash = this._app.hashUtil.hashContent(comment.text);
    comment.createdAt = new Date();
    comment.modifiedAt = new Date();
    comment.source = source;

    comment.published = await this._app.contentModerator.moderate(comment.text);

    const result = await this._insertComment(comment);

    this._log(`Created: ${result}`);

    return result;
  }

  // *******************************************************************************************************************

  async _updateComment(commentId, payload) {
    const result = await this._app.mongo.comments.findOneAndUpdate(
      { _id: this._app.mongo.id(commentId) },
      {
        $set: payload.mongoize()
      },
      {
        returnOriginal: false
      }
    );
    if (!result.value) {
      throw new CommentManagerError(`Comment not found: ${commentId}`, 404);
    }

    return new Comment(result.value);
  }

  /**
   * @param commentId
   * @param {CommentUpdatePayload} payload
   * @return {Promise<Comment>}
   */
  async update(commentId, payload) {
    const comment = new Comment(payload);
    comment.modifiedAt = new Date();

    const updated = await this._updateComment(commentId, comment);

    this._log(`Updated ${commentId}: ${JSON.stringify(comment)}`);

    return updated;
  }
}

class CommentManagerError extends CustomError {}

module.exports = {
  CommentManager
};
