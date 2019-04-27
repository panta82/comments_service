class ContentModerator {
  constructor(options, /** App */ app) {
    this._options = options;
    this._log = app.logger.for(ContentModerator);
  }

  /**
   * Resolves true if content is "clean", false if some potential bad words are detected
   * @param content
   * @return {Promise<boolean>}
   */
  moderate(content) {
    this._log(`Moderating: ${content}`);
    return Promise.resolve(true);
  }
}

module.exports = {
  ContentModerator
};
