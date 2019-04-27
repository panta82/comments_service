const { Model } = require("./base");

class CommentSource extends Model {
  constructor(/** CommentSource */ source) {
    super();

    this.ip = undefined;
    this.user_agent = undefined;

    this.assign(source);
  }
}

class Comment extends Model {
  constructor(/** Comment */ source) {
    super();

    this._id = undefined;
    this.postId = undefined;
    this.author = undefined;
    this.text = undefined;
    this.replyToId = undefined;
    this.contentHash = undefined;
    this.published = undefined;
    this.createdAt = undefined;
    this.modifiedAt = undefined;
    this.deletedAt = undefined;

    /** @type {CommentSource} */
    this.source = undefined;

    this.assign(source);
  }

  assign(source) {
    super.assign(source);

    if (this.source) {
      this.source = new CommentSource(this.source);
    }
  }
}
Comment.OBJECT_IDS = ["replyToId"];

class CommentCreatePayload extends Model {
  constructor(/** CommentCreatePayload */ source) {
    super();

    this.postId = undefined;
    this.author = undefined;
    this.text = undefined;
    this.replyToId = undefined;

    this.assign(source);
  }
}

class CommentUpdatePayload extends Model {
  constructor(/** CommentUpdatePayload */ source) {
    super();

    this.text = undefined;

    this.assign(source);
  }
}

module.exports = {
  Comment,
  CommentSource,

  CommentCreatePayload,
  CommentUpdatePayload
};
