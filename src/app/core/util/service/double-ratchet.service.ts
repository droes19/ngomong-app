// This is the core ratchet implementation that builds on your KeyService
import { Injectable } from '@angular/core';
import { KeyService } from './key.service';

// Interfaces for the Double Ratchet protocol
export interface MessageHeader {
  dhRatchetKey: string;    // Sender's current ratchet public key
  counter: number;         // Number of messages in current sending chain
  previousCounter: number; // Number of messages in previous sending chain
}

export interface EncryptedMessage {
  header: MessageHeader;
  ciphertext: string;      // Base64-encoded encrypted message
  iv: string;              // Base64-encoded initialization vector
}

@Injectable({
  providedIn: 'root'
})
export class DoubleRatchetService {
  // Identity key information
  private myIdentityKeyPair: { privateKey: string, publicKey: string } | null = null;
  private peerIdentityKey: string | null = null;

  // Ratchet state
  private DHRatchetKeyPair: { privateKey: string, publicKey: string } | null = null;
  private DHPeerRatchetKey: string | null = null;

  // Chain keys
  private rootKey: CryptoKey | null = null;
  private sendingChainKey: ArrayBuffer | null = null;
  private receivingChainKey: ArrayBuffer | null = null;

  // Message counters
  private sendingCounter: number = 0;
  private receivingCounter: number = 0;
  private previousSendingCounter: number = 0;

  // Skipped message keys (for handling out-of-order messages)
  private skippedMessageKeys: Map<string, ArrayBuffer> = new Map();

  constructor(private keyService: KeyService) { }

  /**
   * Initialize a new session with a peer
   * @param myIdentityKeyPair My identity key pair
   * @param peerIdentityKey Peer's identity public key
   */
  async initializeSession(
    myIdentityKeyPair: { privateKey: string, publicKey: string },
    peerIdentityKey: string
  ): Promise<void> {
    // Store identity keys
    this.myIdentityKeyPair = myIdentityKeyPair;
    this.peerIdentityKey = peerIdentityKey;

    // Generate initial ratchet key pair
    this.DHRatchetKeyPair = await this.keyService.generateKeyPair();

    // Calculate initial shared secret from identity keys
    const initialSharedKey = await this.keyService.deriveSharedKey(
      myIdentityKeyPair.privateKey,
      peerIdentityKey
    );

    // Export the shared key as raw bytes to use as root key
    const initialSharedKeyBytes = await window.crypto.subtle.exportKey('raw', initialSharedKey);

    // Import as HMAC key to use for KDF
    this.rootKey = await this.importKeyAsHMAC(initialSharedKeyBytes);

    console.log('Session initialized with peer identity key: ' + peerIdentityKey.substring(0, 16) + '...');
    console.log('Generated initial ratchet key: ' + this.DHRatchetKeyPair.publicKey.substring(0, 16) + '...');
  }

  /**
   * Get current ratchet public key
   * For sharing with the peer in initial key exchange
   */
  getCurrentRatchetPublicKey(): string | null {
    return this.DHRatchetKeyPair?.publicKey || null;
  }

  /**
   * Encrypt a message to send to the peer
   * @param plaintext The message text to encrypt
   */
  async encryptMessage(plaintext: string): Promise<EncryptedMessage> {
    if (!this.myIdentityKeyPair || !this.peerIdentityKey || !this.DHRatchetKeyPair || !this.rootKey) {
      throw new Error('Session not properly initialized');
    }

    // If we have the peer's ratchet key but no sending chain yet, perform a ratchet step
    if (this.DHPeerRatchetKey && !this.sendingChainKey) {
      await this.performRatchetStep();
    }

    // If we still don't have a sending chain (i.e., we haven't received any messages yet)
    // then create an initial one from the root key (identity key derived)
    if (!this.sendingChainKey) {
      // Create initial sending chain from root key
      this.sendingChainKey = await this.deriveInitialChainKey(this.rootKey, 'sending');
    }

    // Derive a message key from the sending chain
    const { messageKey, nextChainKey } = await this.deriveMessageKey(this.sendingChainKey);

    // Update the sending chain key for next message
    this.sendingChainKey = nextChainKey;

    // Encrypt the message with the derived message key
    const { ciphertext, iv } = await this.encryptWithMessageKey(plaintext, messageKey);

    // Prepare the message header
    const header: MessageHeader = {
      dhRatchetKey: this.DHRatchetKeyPair.publicKey,
      counter: this.sendingCounter,
      previousCounter: this.previousSendingCounter
    };

    // Increment the message counter
    this.sendingCounter++;

    return {
      header,
      ciphertext,
      iv
    };
  }

  /**
   * Decrypt a message received from the peer
   * @param encryptedMessage The encrypted message to decrypt
   */
  async decryptMessage(encryptedMessage: EncryptedMessage): Promise<string> {
    if (!this.myIdentityKeyPair || !this.peerIdentityKey || !this.rootKey) {
      throw new Error('Session not properly initialized');
    }

    const header = encryptedMessage.header;

    // Check if this is the first message with a ratchet key from the peer
    if (!this.DHPeerRatchetKey) {
      // First message from peer - save their ratchet key
      this.DHPeerRatchetKey = header.dhRatchetKey;

      // Perform an initial ratchet step to set up receiving chain
      await this.performRatchetStep();
    }
    // Check if this is a new ratchet key from the peer
    else if (this.DHPeerRatchetKey !== header.dhRatchetKey) {
      // Save previous counters before updating
      this.previousSendingCounter = this.sendingCounter;
      this.sendingCounter = 0;

      // Store any skipped message keys from the previous ratchet
      if (header.previousCounter > this.receivingCounter) {
        await this.storeSkippedMessageKeys(
          this.DHPeerRatchetKey,
          this.receivingCounter,
          header.previousCounter
        );
      }

      // Save the peer's new ratchet key
      this.DHPeerRatchetKey = header.dhRatchetKey;
      this.receivingCounter = 0;

      // Perform a DH ratchet step
      await this.performRatchetStep();
    }

    // Check if we need to skip ahead in the current receiving chain
    if (header.counter > this.receivingCounter) {
      // Store skipped message keys
      await this.storeSkippedMessageKeys(
        this.DHPeerRatchetKey,
        this.receivingCounter,
        header.counter
      );

      // Update receiving counter
      this.receivingCounter = header.counter;
    }

    // Check if this is a skipped message we've seen before
    const skippedMessageKey = this.getSkippedMessageKey(this.DHPeerRatchetKey, header.counter);
    if (skippedMessageKey) {
      // Use the skipped message key to decrypt
      return await this.decryptWithMessageKey(
        encryptedMessage.ciphertext,
        encryptedMessage.iv,
        skippedMessageKey
      );
    }

    // Regular message - derive the message key from current receiving chain
    const { messageKey, nextChainKey } = await this.deriveMessageKey(this.receivingChainKey!);

    // Update receiving chain key and counter
    this.receivingChainKey = nextChainKey;
    this.receivingCounter++;

    // Decrypt the message
    return await this.decryptWithMessageKey(
      encryptedMessage.ciphertext,
      encryptedMessage.iv,
      messageKey
    );
  }

  /**
   * Manually set peer's ratchet key (used for initial key exchange)
   * Only use this if you receive the peer's ratchet key through a separate channel
   */
  async setPeerRatchetKey(peerRatchetKey: string): Promise<void> {
    if (!this.myIdentityKeyPair || !this.peerIdentityKey || !this.rootKey) {
      throw new Error('Session not properly initialized');
    }

    this.DHPeerRatchetKey = peerRatchetKey;

    // Initialize receiving chain
    await this.performRatchetStep();
  }

  /**
   * Perform a DH ratchet step when receiving a new ratchet key
   */
  private async performRatchetStep(): Promise<void> {
    if (!this.myIdentityKeyPair || !this.peerIdentityKey || !this.DHRatchetKeyPair || !this.DHPeerRatchetKey || !this.rootKey) {
      throw new Error('Cannot perform ratchet step: missing keys');
    }

    // Calculate DH output using our private ratchet key and peer's public ratchet key
    const dhOutputKey = await this.keyService.deriveSharedKey(
      this.DHRatchetKeyPair.privateKey,
      this.DHPeerRatchetKey
    );

    // Export the shared key as raw bytes
    const dhOutputBytes = await window.crypto.subtle.exportKey('raw', dhOutputKey);

    // Derive new root key and receiving chain key
    const { rootKey, chainKey } = await this.deriveRootAndChainKeys(this.rootKey, dhOutputBytes);

    // Update root key and receiving chain key
    this.rootKey = rootKey;
    this.receivingChainKey = chainKey;

    // Generate a new ratchet key pair for next sending
    this.DHRatchetKeyPair = await this.keyService.generateKeyPair();

    // Calculate new DH output using our new private key and peer's public key
    const newDhOutputKey = await this.keyService.deriveSharedKey(
      this.DHRatchetKeyPair.privateKey,
      this.DHPeerRatchetKey
    );

    // Export the shared key as raw bytes
    const newDhOutputBytes = await window.crypto.subtle.exportKey('raw', newDhOutputKey);

    // Derive new root key and sending chain key
    const { rootKey: newRootKey, chainKey: newChainKey } = await this.deriveRootAndChainKeys(rootKey, newDhOutputBytes);

    // Update root key and sending chain key
    this.rootKey = newRootKey;
    this.sendingChainKey = newChainKey;

    console.log('Ratchet step performed. Generated new ratchet key: ' + this.DHRatchetKeyPair.publicKey.substring(0, 16) + '...');
  }

  /**
   * Derive new root key and chain key using KDF
   */
  private async deriveRootAndChainKeys(
    rootKey: CryptoKey,
    dhOutput: ArrayBuffer
  ): Promise<{ rootKey: CryptoKey; chainKey: ArrayBuffer }> {
    // KDF info strings
    const rootKeyInfo = new TextEncoder().encode('WhisperRatchet_RootKey');
    const chainKeyInfo = new TextEncoder().encode('WhisperRatchet_ChainKey');

    // Use root key as HMAC key to derive new root key
    const newRootKeyBytes = await window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      rootKey,
      this.concatArrayBuffers(new Uint8Array(dhOutput), rootKeyInfo)
    );

    // Use root key as HMAC key to derive chain key
    const chainKeyBytes = await window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      rootKey,
      this.concatArrayBuffers(new Uint8Array(dhOutput), chainKeyInfo)
    );

    // Import new root key as HMAC key
    const newRootKey = await this.importKeyAsHMAC(newRootKeyBytes);

    return {
      rootKey: newRootKey,
      chainKey: chainKeyBytes
    };
  }

  /**
   * Derive initial chain key from root key
   */
  private async deriveInitialChainKey(rootKey: CryptoKey, type: 'sending' | 'receiving'): Promise<ArrayBuffer> {
    const info = new TextEncoder().encode(`WhisperRatchet_${type === 'sending' ? 'Sending' : 'Receiving'}_Initial`);

    return window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      rootKey,
      info
    );
  }

  /**
   * Derive message key and next chain key from current chain key
   */
  private async deriveMessageKey(
    chainKey: ArrayBuffer
  ): Promise<{ messageKey: ArrayBuffer; nextChainKey: ArrayBuffer }> {
    // Import chain key as HMAC key
    const hmacKey = await this.importKeyAsHMAC(chainKey);

    // Derive message key
    const messageKeyInfo = new TextEncoder().encode('WhisperRatchet_MessageKey');
    const messageKey = await window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      hmacKey,
      messageKeyInfo
    );

    // Derive next chain key
    const chainKeyInfo = new TextEncoder().encode('WhisperRatchet_NextChainKey');
    const nextChainKey = await window.crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      hmacKey,
      chainKeyInfo
    );

    return { messageKey, nextChainKey };
  }

  /**
   * Store skipped message keys for handling out-of-order messages
   */
  private async storeSkippedMessageKeys(
    ratchetKey: string,
    currentCounter: number,
    targetCounter: number
  ): Promise<void> {
    // Can't skip more than 1000 messages for safety
    const maxSkip = 1000;
    if (targetCounter - currentCounter > maxSkip) {
      throw new Error('Too many skipped messages');
    }

    let chainKey = this.receivingChainKey!;

    // For each skipped message
    for (let i = currentCounter; i < targetCounter; i++) {
      // Derive message key and next chain key
      const { messageKey, nextChainKey } = await this.deriveMessageKey(chainKey);
      chainKey = nextChainKey;

      // Store the skipped message key
      const messageKeyId = `${ratchetKey}:${i}`;
      this.skippedMessageKeys.set(messageKeyId, messageKey);
    }

    // Update the receiving chain key to the latest
    this.receivingChainKey = chainKey;
  }

  /**
   * Get a skipped message key if available
   */
  private getSkippedMessageKey(ratchetKey: string, counter: number): ArrayBuffer | undefined {
    const messageKeyId = `${ratchetKey}:${counter}`;
    const messageKey = this.skippedMessageKeys.get(messageKeyId);

    if (messageKey) {
      // Remove the used key
      this.skippedMessageKeys.delete(messageKeyId);
    }

    return messageKey;
  }

  /**
   * Encrypt plaintext using a message key
   */
  private async encryptWithMessageKey(
    plaintext: string,
    messageKey: ArrayBuffer
  ): Promise<{ ciphertext: string; iv: string }> {
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Import message key for encryption
    const encryptionKey = await window.crypto.subtle.importKey(
      'raw',
      messageKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt the plaintext
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      encryptionKey,
      new TextEncoder().encode(plaintext)
    );

    // Return base64 encoded ciphertext and IV
    return {
      ciphertext: this.keyService.arrayBufferToBase64(ciphertext),
      iv: this.keyService.arrayBufferToBase64(iv)
    };
  }

  /**
   * Decrypt ciphertext using a message key
   */
  private async decryptWithMessageKey(
    ciphertext: string,
    iv: string,
    messageKey: ArrayBuffer
  ): Promise<string> {
    // Import message key for decryption
    const decryptionKey = await window.crypto.subtle.importKey(
      'raw',
      messageKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the ciphertext
    const plaintext = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.keyService.base64ToArrayBuffer(iv)
      },
      decryptionKey,
      this.keyService.base64ToArrayBuffer(ciphertext)
    );

    // Return the plaintext as string
    return new TextDecoder().decode(plaintext);
  }

  /**
   * Import key as HMAC key
   */
  private async importKeyAsHMAC(keyData: ArrayBuffer): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }

  /**
   * Concatenate two array buffers
   */
  private concatArrayBuffers(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
    const result = new Uint8Array(buffer1.length + buffer2.length);
    result.set(buffer1, 0);
    result.set(buffer2, buffer1.length);
    return result;
  }
}
