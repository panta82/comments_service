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