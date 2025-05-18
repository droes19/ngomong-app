import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeyService {

  /**
   * Generate a cryptographic key pair (ECDH)
   * @returns Promise with private and public keys
   */
  async generateKeyPair(): Promise<{ privateKey: string, publicKey: string }> {
    try {
      // Generate an ECDH key pair using P-256 curve
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256' // NIST P-256 curve (also known as secp256r1)
        },
        true, // extractable
        ['deriveKey', 'deriveBits'] // key usages
      );

      // Export the private key in PKCS#8 format
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        'pkcs8',
        keyPair.privateKey
      );

      // Export the public key in SPKI format
      const publicKeyBuffer = await window.crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey
      );

      // Convert the ArrayBuffers to base64 strings
      const privateKeyBase64 = this.arrayBufferToBase64(privateKeyBuffer);
      const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer);

      return {
        privateKey: privateKeyBase64,
        publicKey: publicKeyBase64
      };
    } catch (error) {
      console.error('Error generating ECDH key pair:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Derive a shared secret key using ECDH
   * @param privateKeyBase64 Your private key in base64 format
   * @param peerPublicKeyBase64 Peer's public key in base64 format
   * @returns Derived AES key for encryption/decryption
   */
  private async deriveSharedKey(privateKeyBase64: string, peerPublicKeyBase64: string): Promise<CryptoKey> {
    try {
      // Convert the keys from base64 to ArrayBuffer
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
      const peerPublicKeyBuffer = this.base64ToArrayBuffer(peerPublicKeyBase64);

      // Import the private key
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        false,
        ['deriveKey', 'deriveBits']
      );

      // Import the peer's public key
      const peerPublicKey = await window.crypto.subtle.importKey(
        'spki',
        peerPublicKeyBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        false,
        []
      );

      // Derive a shared secret key
      return await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: peerPublicKey
        },
        privateKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false, // not extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error deriving shared key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using a peer's public key
   * @param data Data to encrypt (string or object)
   * @param privateKeyBase64 Your private key in base64 format
   * @param peerPublicKeyBase64 Peer's public key in base64 format
   * @returns Encrypted data object with iv and data as base64 strings
   */
  async encrypt<T>(data: T, privateKeyBase64: string, peerPublicKeyBase64: string): Promise<{ iv: string, data: string }> {
    try {
      // Convert any data type to string via JSON
      const dataString = JSON.stringify(data);

      // Derive shared key
      const sharedKey = await this.deriveSharedKey(privateKeyBase64, peerPublicKeyBase64);

      // Generate initialization vector (IV)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Convert the data to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        sharedKey,
        dataBuffer
      );

      // Convert the encrypted data and IV to base64
      return {
        iv: this.arrayBufferToBase64(iv),
        data: this.arrayBufferToBase64(encryptedBuffer)
      };
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using derived shared key
   * @param encryptedData Object with iv and data as base64 strings
   * @param privateKeyBase64 Your private key in base64 format
   * @param peerPublicKeyBase64 Peer's public key in base64 format
   * @returns Decrypted data as the original type T
   */
  async decrypt<T>(encryptedData: { iv: string, data: string }, privateKeyBase64: string, peerPublicKeyBase64: string): Promise<T> {
    try {
      // Derive shared key
      const sharedKey = await this.deriveSharedKey(privateKeyBase64, peerPublicKeyBase64);

      // Convert the IV from base64 to ArrayBuffer
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      // Convert the encrypted data from base64 to ArrayBuffer
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data);

      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        sharedKey,
        encryptedBuffer
      );

      // Convert the decrypted data to string and then parse as JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);

      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }
}
