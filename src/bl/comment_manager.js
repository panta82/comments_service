const { Model, CustomError } = require("../types/base");
const { Comment, CommentWithReplies } = require("../types/comments");

class CommentManager {
  constructor(/** CommentManagerOptions */ options, /** App */ app) {
    this._options = options;
    this._app = app;
    this._log = app.logger.for(CommentManager);
  }

  // *******************************************************************************************************************

  /**
   * @param id
   * @return {Promise<Comment>}
   * @private
   */
  async _fetchComment(id) {
    const res = await this._app.mongo.comments.findOne({
      _id: this._app.mongo.id(id)
    });
    if (!res) {
      throw new CommentNotFoundError(id);
    }
    return res;
  }

  /**
   * @param toIds
   * @return {Promise<Comment>}
   * @private
   */
  async _fetchReplies(toIds) {
    return await this._app.mongo.comments
      .find({
        replyToId: {
          $in: toIds.map(this._app.mongo.id)
        }
      })
      .toArray();
  }

  /**
   * @param {CommentWithReplies[]} comments
   * @return {Promise<CommentWithReplies[]>}
   * @private
   */
  async _loadReplies(comments) {
    if (!comments.length) {
      return Promise.resolve(comments);
    }

    const replies = (await this._fetchReplies(comments.map(c => c._id))).map(
      doc => new CommentWithReplies(doc)
    );
    await this._loadReplies(replies);

    // Assign replies to their comments
    for (const comment of comments) {
      comment.replies = replies.filter(
        r => String(r.replyToId) === String(comment._id)
      );
    }

    return comments;
  }

  /**
   * @param id
   * @return {Promise<CommentWithReplies>}
   */
  async getCommentWithReplies(id) {
    const doc = await this._fetchComment(id);
    const comment = new CommentWithReplies(doc);
    await this._loadReplies([comment]);
    return comment;
  }

  async _fetchTopLevelCommentsForPost(postId) {
    return await this._app.mongo.comments
      .find({
        postId,
        replyToId: null
      })
      .toArray();
  }

  /**
   * @param postId
   * @return {Promise<CommentWithReplies[]>}
   */
  async listCommentsWithRepliesForPost(postId) {
    const comments = (await this._fetchTopLevelCommentsForPost(postId)).map(
      res => new CommentWithReplies(res)
    );
    await this._loadReplies(comments);
    return comments;
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

    this._log(`Created: ${JSON.stringify(result)}`);

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
      throw new CommentNotFoundError(commentId);
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

  // *******************************************************************************************************************

  async _selectHasReplies(commentId) {
    return this._app.mongo.comments.countDocuments(
      { replyToId: this._app.mongo.id(commentId) },
      { limit: 1 }
    );
  }

  async _softDelete(commentId) {
    const res = await this._app.mongo.comments.findOneAndUpdate(
      { _id: this._app.mongo.id(commentId), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          author: "deleted",
          text: "(This comment has been deleted)"
        }
      },
      {
        returnOriginal: false
      }
    );
    if (!res.value) {
      throw new CommentManagerError(
        `Comment ${commentId} doesn't exist or already deleted`,
        400
      );
    }
    return new Comment(res.value);
  }

  /**
   * @param commentId
   * @return {Promise<Comment>}
   * @private
   */
  async _hardDelete(commentId) {
    const res = await this._app.mongo.comments.findOneAndDelete({
      _id: this._app.mongo.id(commentId)
    });

    if (!res.value) {
      throw new CommentNotFoundError(commentId);
    }
    return new Comment(res.value);
  }

  /**
   * @param {CommentWithReplies} comment
   * @param {string[]} hardDeleteTargets
   * @returns boolean True if the entire tree is to be deleted
   */
  _findHardDeleteTargets(comment, hardDeleteTargets) {
    if (comment.replies.length) {
      const deleteReplies = comment.replies.map(c =>
        this._findHardDeleteTargets(c)
      );
      if (deleteReplies.some(x => !x)) {
        // One of the replies wasn't deleted, so this one can't be deleted too
        return false;
      }
    }

    if (!comment.deletedAt) {
      // Not soft-deleted
      return false;
    }

    // We can delete this one
    hardDeleteTargets.push(comment._id);
    return true;
  }

  /**
   * @param commentId
   * @return {Promise<number>}
   * @private
   */
  async _pruneCommentTree(commentId) {
    const comment = await this.getCommentWithReplies(commentId);

    const toDelete = [];
    this._findHardDeleteTargets(comment, toDelete);

    // Do it one by one, that will ensure no dangling references
    for (const id of toDelete) {
      await this._hardDelete(id);
    }

    return toDelete.length;
  }

  /**
   * When deleting comment with live replies, then soft delete. It's enough to check if there is even one
   * existing reply. After hard delete, check if there are any soft-deleted comments we are now
   * free to hard-delete (and so on, recursively).
   * @param commentId
   * @return {Promise<DeleteResult>}
   */
  async delete(commentId) {
    const hasReplies = await this._selectHasReplies(commentId);
    const result = new DeleteResult({
      deletedCount: 1
    });

    if (hasReplies) {
      await this._softDelete(commentId);
      result.softDelete = true;
    } else {
      result.softDelete = false;
      const deletedComment = await this._hardDelete(commentId);
      if (deletedComment.replyToId) {
        const deletedCount = await this._pruneCommentTree(
          deletedComment.replyToId
        );
        result.deletedCount += deletedCount;
      }
    }

    this._log(`Deleted comment ${commentId}: ${JSON.stringify(result)}`);
    return result;
  }
}

class DeleteResult extends Model {
  constructor(/** DeleteResult */ source) {
    super();

    /**
     * Whether the comment was soft-deleted
     * @type {boolean}
     */
    this.softDelete = undefined;

    /**
     * How many comments were deleted in total
     * @type {number}
     */
    this.deletedCount = undefined;

    this.assign(source);
  }
}

class CommentManagerError extends CustomError {}

class CommentNotFoundError extends CommentManagerError {
  constructor(id) {
    super(`Comment not found: ${id}`, 404);
  }
}

module.exports = {
  CommentManager,

  DeleteResult
};
