# Comments service

Based on: https://www.youtube.com/watch?v=CnailTcJV_U

### Requirements

#### Create a comment

`POST /api/comments`

Need to include:
- Author
- Text
- PostId

Can also include:
- Reply to id (for nested comments)

After creation, it's also filled with:
- id
- createdAt
- modifiedAt
- hash
- published (set to true if there are no bad words, otherwise to false)
- source:
	- ip
	- user agent

The bad words are checked on some api called "content moderator"
https://contentmoderator.cognitive.microsoft.com/

#### Get comment

Return a comment with all its child comments, available as array under `replies`.

#### Change comment text

`PATCH /api/comments/:id`

Can only change text

#### Delete a comment

`DELETE /api/comments/:id`

Returns:
- Deleted count
- Whether it was soft delete

If comment has children, the comment is "soft deleted", meaning:
- author is set to `deleted`
- text is set to placeholder

If all comments in a chain are soft deleted, they are then actually deleted.

### Thoughts

- Async/await is still annoying to use with a debugger. Keep with Promises for now.

- 2 layer architecture (imperative shell, service layer) feels right. 3rd layer could be extracted from private mongo-based methods into some kind of DAL layer. But it feels a lot of these methods would really just be private methods of CommentManager (needlessly) living in a different service, so I didn't go for that. An ORM/OOM on its own could have been the third layer.

- Using pure classes for services is annoying. Writing `this.app.x` gets old quick. Closure factory is still a better choice for long lived services.

- Models with base class still the best choice. No idea how to prevent base class from balooning in complexity.

- Express with Promise wrapper good.

- Debug logger better than winston, but I miss the ability to log different events at different levels. Maybe those could too be tags? Had some problems configuring it properly, I wish these libraries didn't insist on screwing with global env-s.

- Dotenv based config serviceable in a small app, but I'd stil prefer yaml that maps precisely to the settings structure.

- Extracted all settings into one class, instead of each service declaring its own. Works fine for this small app, might become unwieldy in a real monolith.

- Does this arch make sense in a microservice? Seems like most code ended up in one file (comment_manager.js). Will it always be that? Should I break it apart? How?

- `Api-tester.http` is a JetBrains testing system, replacement for Postman and Insomnia. A bit better once you get used to it, but I found it annoying having to click between my debug and run window. I wish they'd have made results of requests appear in a side-window to the http file editor.

- Controllers as function work fine. No need for full service class ceremony.

- Missing features: validation, a bunch of consistency checks.

- Mongo's `ObjectID` is the most annoying part of dealing with mongo. I keep having to think which parts of my models need to be casted into and out of ID-s. I wish they could have just used a string (I guess that's why you use ODM?).

- Mongo is generally annoying.

