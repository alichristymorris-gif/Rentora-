# Security Specification for Rentora / Roventro - Real-time Chat & calling

## 1. Security Invariants
- **Message Privacy**: A message inside `chats/{chatId}/messages/{msgId}` must only be readable or writable by users who are listed in the parent chat's `participants` array.
- **Message Integrity**: The sender ID of a message must strictly match the authenticated user (`request.auth.uid`). Users cannot spoof senders.
- **Message Editing Constraints**: A user can only edit their own messages. They cannot edit other users' messages. Pushing updates is bounded strictly to the `content` and `edited` flag.
- **Call Authorization**: Active WebRTC signaling calls in `/calls/{callId}` are restricted to the caller and receiver. No third parties can spy on WebRTC offer/answer handshakes.
- **Call Candiate signaling Isolation**: ICE candidates inside `calls/{callId}/candidates` are restricted solely to the call's authorized caller or receiver.
- **Immortal Message Identifiers**: A message's `createdAt`, `senderId`, and `id` properties are immutable and cannot be altered after creation.
- **Blocking Protection**: If a user 'A' blocks user 'B', user 'B' cannot write to the chat document or add messages to their shared session.

## 2. The Dirty Dozen Payloads (Vulnerability Scenarios)
1. **Sender ID Spoofing**: User A sends a message in chat A_B setting `senderId: "B"`.
2. **Unauthorized Message Read**: User C tries to read messages in chat A_B.
3. **Chat Hijacking (adding self to participants)**: User C attempts to update chat A_B to add their own UID to `participants`.
4. **Message Edit Hijacking**: User B tries to update User A's message content.
5. **Call Signal Eavesdropping**: User C tries to query/read the document `/calls/call_A_B`.
6. **Call Signaling Interception**: User C tries to write a spoofed `answer` or `offer` into `/calls/call_A_B`.
7. **Junk ID Poisoning**: User A tries to create a message with a 1.5MB garbage string as the ID.
8. **Malicious Message Bloating**: User A attempts to send a message with content size of 2MB (exceeding text length norms).
9. **Spamming Chat Pinned List**: Non-participant attempts to pin or modify chat settings.
10. **Bypassing Verification**: User without verified email attempts to send private documents.
11. **Impersonating Admin**: Attempting to list all system reports or delete another user's profile.
12. **Self-Role Elevation**: Modifying own user record to set `role: "admin"` directly in firestore.

## 3. WebRTC Call & Message Schema Rules Specification
The firestore rules must strictly require `isValidId()` on collection paths and validate message schema sizes in `chats/{chatId}/messages/{messageId}` and signaling entries in `calls/{callId}`.
