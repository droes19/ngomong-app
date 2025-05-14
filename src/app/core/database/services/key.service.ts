import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeyService {
  
  /**
   * Generate a cryptographic key pair (RSA)
   * @returns Promise with private and public keys
   */
  async generateKeyPair(): Promise<{ privateKey: string, publicKey: string }> {
    try {
      // Generate an RSA key pair with 2048 bits
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: 'SHA-256'
        },
        true, // extractable
        ['encrypt', 'decrypt'] // key usages
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
      console.error('Error generating key pair:', error);
      throw error;
    }
  }
  
  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
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
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  /**
   * Encrypt data using a public key (from contacts table)
   * @param data Data to encrypt
   * @param publicKeyBase64 Public key in base64 format
   * @returns Encrypted data as base64 string
   */
  async encrypt(data: string, publicKeyBase64: string): Promise<string> {
    try {
      // Convert the public key from base64 to ArrayBuffer
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
      
      // Import the public key
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        false,
        ['encrypt']
      );
      
      // Convert the data to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        publicKey,
        dataBuffer
      );
      
      // Convert the encrypted data to base64
      return this.arrayBufferToBase64(encryptedBuffer);
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }
  
  /**
   * Decrypt data using a private key (from user table)
   * @param encryptedBase64 Encrypted data as base64 string
   * @param privateKeyBase64 Private key in base64 format
   * @returns Decrypted data as string
   */
  async decrypt(encryptedBase64: string, privateKeyBase64: string): Promise<string> {
    try {
      // Convert the private key from base64 to ArrayBuffer
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
      
      // Import the private key
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        false,
        ['decrypt']
      );
      
      // Convert the encrypted data from base64 to ArrayBuffer
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedBase64);
      
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        privateKey,
        encryptedBuffer
      );
      
      // Convert the decrypted data to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }
}