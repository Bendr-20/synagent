# Review Queue Security

Last updated: 2026-05-13 UTC
Status: locked for reviewed access

## Authorized reviewers

The shared review key is restricted to:

- Jim
- Quigley
- Epifani

No one else should receive the key during reviewed access unless the team explicitly updates this roster.

## Key handling rules

- Do not paste the review key in Telegram group chat.
- Do not commit the key to git.
- Do not include the key in screenshots, Looms, docs, or support messages.
- Share the key only through a private channel controlled by the intended reviewer.
- If the key is sent to the wrong person, posted in a group, exposed in a screenshot, or included in any public artifact, rotate it immediately.
- Rotate the key before wider access if there is any uncertainty about who has it.

## Server-side audit result

2026-05-13 UTC audit:

- `SYNAGENT_REVIEW_API_KEY` is configured on the server.
- The configured key is not the placeholder value.
- `.env.local` is ignored by git.
- Cred Bureau JSON data files are ignored by git.
- Exact key was not found in tracked files.
- Exact key was not found in the working tree outside `.env.local`.
- Unauthenticated review queue GET requests return `401`.
- Wrong-key review queue GET requests return `401`.
- Unauthenticated review queue PATCH requests return `401`.
- Wrong-key review queue PATCH requests return `401`.

## Rotation procedure

1. Generate a new high-entropy review key locally.
2. Update `SYNAGENT_REVIEW_API_KEY` in the deployment environment or `.env.local` on the server.
3. Restart the Synagent service.
4. Verify unauthenticated requests still return `401`.
5. Verify the new key can load the review queue.
6. Privately distribute the new key only to the authorized reviewer roster.
7. Tell the group that rotation is complete, but never post the key.

Suggested generation command:

```bash
openssl rand -base64 32 | tr -d '\n'
```

## Human confirmation needed

Server checks can confirm the key is configured and not leaked in the repo. They cannot prove who has received it in private chats.

Before wider access, Jim, Quigley, and Epifani should confirm privately that no one else has the current key. If that cannot be confirmed, rotate it.
