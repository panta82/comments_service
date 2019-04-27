const { CustomError } = require("../types/base");
const { Comment, CommentWithReplies } = require("../types/comments");

class CommentManager {
  constructor(/** CommentManagerOptions */ options, /** App */ app) {
    this._options = options;
    this._app = app;
    this._log = app.logger.for(CommentManager);
  }

  // *******************************************************************************************************************

  async _fetchComment(id) {
    const res = await this._app.mongo.comments.findOne({
      _id: this._app.mongo.id(id)
    });
    if (!res) {
      throw new CommentManagerError(`Comment not found: ${id}`, 404);
    }
    return res;
  }

  async _fetchReplies(toId) {
    return await this._app.mongo.comments
      .find({
        replyToId: this._app.mongo.id(toId)
      })
      .toArray();
  }

  /**
   * @param {CommentWithReplies} comment
   * @return {Promise<CommentWithReplies>}
   * @private
   */
  async _loadReplies(comment) {
    const docs = await this._fetchReplies(comment._id);
    comment.replies = docs.map(doc => new CommentWithReplies(doc));
    await Promise.all(comment.replies.map(c => this._loadReplies(c)));
    return comment;
  }

  /**
   * @param id
   * @return {Promise<CommentWithReplies>}
   */
  async getCommentWithReplies(id) {
    const doc = await this._fetchComment(id);
    const comment = new CommentWithReplies(doc);
    await this._loadReplies(comment);
    return comment;
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
