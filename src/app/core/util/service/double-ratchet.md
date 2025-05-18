# Double Ratchet Implementation in Angular

This documentation explains the secure messaging implementation using the Double Ratchet algorithm in Angular. The Double Ratchet algorithm is used in protocols like Signal to provide end-to-end encrypted messaging with advanced security properties.

## Table of Contents

1. [Overview](#overview)
2. [Key Components](#key-components)
3. [Key Flow](#key-flow)
4. [Implementation Files](#implementation-files)
5. [Usage Examples](#usage-examples)
6. [Security Properties](#security-properties)

## Overview

The Double Ratchet algorithm provides end-to-end encrypted messaging with properties like:

- **Forward secrecy**: Past messages remain secure even if keys are later compromised
- **Break-in recovery**: Future messages regain security even after a compromise
- **Cryptographic deniability**: Messages cannot be cryptographically proven to be from a specific sender

This implementation follows the Signal protocol pattern with a few simplifications for clarity.

## Key Components

The system consists of three key components:

1. **Identity Keys**: Long-term keys that identify each user
   - Used for initial authentication and bootstrapping the encryption
   - Not directly used for message encryption

2. **Ratchet Keys**: Ephemeral key pairs that evolve during the conversation
   - Changed regularly to ensure forward secrecy
   - Used to perform Diffie-Hellman key exchanges
   - Included in message headers (not encrypted)

3. **Message Keys**: One-time keys derived from the ratchet process
   - Used to encrypt/decrypt individual messages
   - Never reused for multiple messages
   - Derived through a Key Derivation Function (KDF)

## Key Flow

The key flow in Double Ratchet happens in these phases:

### Initial Setup (First-Time Conversation)

1. Both parties have their identity key pairs
2. Party A knows Party B's identity public key
3. For the first message:
   - Party A derives an initial shared secret from identity keys:
     ```
     initialSharedSecret = ECDH(A's identity private key, B's identity public key)
     ```
   - Party A generates a ratchet key pair and includes the public key in the message header
   - The message is encrypted with a key derived from the initial shared secret

### First Response (Party B Replies)

1. Party B calculates the same initial shared secret from identity keys
2. Party B receives Party A's ratchet public key from the message header
3. Party B generates their own ratchet key pair
4. Party B performs a DH calculation:
   ```
   dhOutput = ECDH(B's ratchet private key, A's ratchet public key)
   ```
5. This DH output feeds into the ratchet to derive new root and chain keys
6. Party B includes their ratchet public key in the response header

### Subsequent Messages

1. Each new message advances the "symmetric ratchet" to derive a new message key
2. When a new ratchet public key is received, a "DH ratchet" step occurs:
   - New DH calculation performed
   - New ratchet key pair generated
   - Root key and chain keys updated

### Multiple Messages Without Response

If Party A sends multiple messages before receiving a response from Party B:
- Party A continues using the same ratchet key pair
- The symmetric ratchet still advances for each message (new message keys)
- Only when Party B responds will Party A perform a DH ratchet step

## Implementation Files

This implementation consists of the following files:

1. **key.service.ts**: Handles cryptographic operations for identity keys
   - Generates ECDH key pairs
   - Derives shared secrets
   - Basic encryption/decryption functions

2. **double-ratchet.service.ts**: Core Double Ratchet implementation
   - Manages ratchet key pairs and ratchet state
   - Handles DH ratchet steps
   - Derives message keys
   - Encrypts/decrypts messages

3. **secure-messaging.service.ts**: Higher-level messaging service
   - Manages conversations and messages
   - Handles session initialization
   - Provides reactive observables for the UI

4. **chat.component.ts/html/scss**: Angular UI components
   - Displays conversations and messages
   - Handles user interactions
   - Shows security information

## Usage Examples

### Initializing a Session

```typescript
// First, get your identity key pair
const myIdentityKeyPair = await keyService.generateKeyPair();

// Initialize a session with another user's public key
const doubleRatchet = new DoubleRatchetService(keyService);
await doubleRatchet.initializeSession(myIdentityKeyPair, peerIdentityPublicKey);
```

### Sending a Message

```typescript
// Encrypt a message
const encryptedMessage = await doubleRatchet.encryptMessage("Hello, secure world!");

// The encryptedMessage object contains:
// - header: Information needed for the ratchet (including ratchet public key)
// - ciphertext: The encrypted message content
// - iv: Initialization vector for the encryption

// Send this entire object to the recipient
```

### Receiving a Message

```typescript
// When you receive an encrypted message from a peer
const decryptedMessage = await doubleRatchet.decryptMessage(receivedEncryptedMessage);

// If this is the first message, you might need to set the peer's ratchet key first:
// await doubleRatchet.setPeerRatchetKey(receivedEncryptedMessage.header.dhRatchetKey);
```

## Security Properties

The Double Ratchet algorithm provides these security properties:

1. **Forward Secrecy**: 
   - If your keys are compromised, past messages remain secure
   - Each message uses a unique key that's deleted after use

2. **Break-in Recovery**:
   - Even if current keys are compromised, future security is restored
   - New DH exchanges create fresh randomness

3. **Message Integrity**:
   - Messages cannot be altered without detection
   - Uses authenticated encryption (AES-GCM)

4. **Resilience to Key Compromise**:
   - Compromising one user doesn't compromise the entire system
   - Key rotation limits the impact of compromise

5. **Out-of-Order Message Handling**:
   - Can decrypt messages received out of order
   - Stores skipped message keys when needed

## Important Notes

1. **First Message Requirements**:
   - The very first message must use the identity key-derived shared secret
   - It must include the sender's ratchet public key in the header
   - The recipient needs this key to start the ratchet process

2. **Multiple Messages Before Response**:
   - If sending multiple messages without receiving a reply, the same ratchet key pair is used
   - The symmetric ratchet still advances (different message keys)
   - Only when a response is received will a full DH ratchet step occur

3. **Ratchet Public Keys**:
   - Ratchet public keys are sent in plaintext in message headers
   - This is secure since public keys are meant to be shared
   - The actual encryption uses derived message keys, not these public keys directly
