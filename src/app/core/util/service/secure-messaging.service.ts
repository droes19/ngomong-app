// Higher-level service that manages the crypto and actual messaging functionality
import { Injectable } from '@angular/core';
import { KeyService } from './key.service';
import { DoubleRatchetService, EncryptedMessage } from './double-ratchet.service';
import { BehaviorSubject, Observable } from 'rxjs';

// User info interface
export interface User {
  id: string;
  name: string;
  identityPublicKey: string;
}

// Message interface for the UI
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  sent: boolean; // true if sent by me, false if received
}

// Conversation interface for the UI
export interface Conversation {
  id: string;
  userId: string;   // The ID of the other user
  userName: string; // The name of the other user
  userPublicKey: string; // The identity public key of the other user
  lastMessage?: string;
  unreadCount: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SecureMessagingService {
  // My identity info
  private myUserId: string | null = null;
  private myUserName: string | null = null;
  private myIdentityKeyPair: { privateKey: string, publicKey: string } | null = null;

  // Active sessions with other users (userId -> DoubleRatchetService)
  private sessions: Map<string, DoubleRatchetService> = new Map();

  // Message history (userId -> messages)
  private messageHistory: Map<string, Message[]> = new Map();

  // BehaviorSubjects for reactive updates
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  private activeConversationSubject = new BehaviorSubject<string | null>(null);
  private messagesSubject = new BehaviorSubject<Message[]>([]);

  // User directory (userId -> User)
  private users: Map<string, User> = new Map();

  constructor(
    private keyService: KeyService
  ) { }

  /**
   * Initialize the secure messaging service with user info
   */
  async initialize(userId: string, userName: string): Promise<void> {
    this.myUserId = userId;
    this.myUserName = userName;

    // Load or generate identity key pair
    await this.loadOrGenerateIdentityKeys();

    console.log('Secure messaging initialized for user:', userName);
    console.log('My identity public key:', this.myIdentityKeyPair?.publicKey);

    // Normally you would load conversations and users from a backend,
    // but for demo purposes we'll use mock data
    await this.loadMockData();
  }

  /**
   * Get my user ID
   */
  getMyUserId(): string | null {
    return this.myUserId;
  }

  /**
   * Get my identity public key
   */
  getMyPublicKey(): string | null {
    return this.myIdentityKeyPair?.publicKey || null;
  }

  /**
   * Observable for all conversations
   */
  getConversations(): Observable<Conversation[]> {
    return this.conversationsSubject.asObservable();
  }

  /**
   * Observable for messages in the active conversation
   */
  getMessages(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }

  /**
   * Set active conversation
   */
  setActiveConversation(userId: string): void {
    this.activeConversationSubject.next(userId);

    // Load messages for this conversation
    const messages = this.messageHistory.get(userId) || [];
    this.messagesSubject.next([...messages]);

    // Mark messages as read (in a real app, you'd sync this with the server)
    const conversations = this.conversationsSubject.value;
    const updatedConversations = conversations.map(conv => {
      if (conv.userId === userId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    });

    this.conversationsSubject.next(updatedConversations);
  }

  /**
   * Send a message to a user
   */
  async sendMessage(receiverId: string, content: string): Promise<void> {
    if (!this.myUserId || !this.myIdentityKeyPair) {
      throw new Error('Not initialized');
    }

    // Get receiver's public key
    const receiver = this.users.get(receiverId);
    if (!receiver) {
      throw new Error('User not found');
    }

    // Get or create a session with this user
    let session = this.sessions.get(receiverId);
    if (!session) {
      session = await this.createSession(receiverId, receiver.identityPublicKey);
    }

    // Encrypt the message
    const encryptedMessage = await session.encryptMessage(content);

    // In a real app, you would send this to your server
    console.log('Sending encrypted message to', receiver.name);
    console.log('Encrypted message:', encryptedMessage);

    // For demo purposes, we'll just add it to our local message history
    const message: Message = {
      id: this.generateId(),
      senderId: this.myUserId,
      receiverId: receiverId,
      content: content,
      timestamp: Date.now(),
      sent: true
    };

    this.addMessageToHistory(message);
    this.updateConversationLastMessage(receiverId, content);

    // In a real app, you would wait for server confirmation here
    // For demo, we'll simulate an immediate delivery
    this.simulateMessageDelivery(message, encryptedMessage);
  }

  /**
   * Receive a message (normally called by your messaging backend)
   */
  async receiveMessage(senderId: string, encryptedMessage: EncryptedMessage): Promise<void> {
    if (!this.myUserId || !this.myIdentityKeyPair) {
      throw new Error('Not initialized');
    }

    // Get sender info
    const sender = this.users.get(senderId);
    if (!sender) {
      throw new Error('Unknown sender');
    }

    // Get or create a session with this user
    let session = this.sessions.get(senderId);
    if (!session) {
      session = await this.createSession(senderId, sender.identityPublicKey);

      // For the first message, we need to set the peer's ratchet key
      // This comes from the message header
      await session.setPeerRatchetKey(encryptedMessage.header.dhRatchetKey);
    }

    // Decrypt the message
    const decryptedContent = await session.decryptMessage(encryptedMessage);

    // Create a message object
    const message: Message = {
      id: this.generateId(),
      senderId: senderId,
      receiverId: this.myUserId,
      content: decryptedContent,
      timestamp: Date.now(),
      sent: false
    };

    // Add to history
    this.addMessageToHistory(message);

    // Update conversation
    this.updateConversationForNewMessage(senderId, decryptedContent);
  }

  /**
   * Start a new conversation with a user
   */
  async startConversation(userId: string, userName: string, publicKey: string): Promise<string> {
    // Add user to directory
    const user: User = {
      id: userId,
      name: userName,
      identityPublicKey: publicKey
    };

    this.users.set(userId, user);

    // Create a new conversation
    const conversation: Conversation = {
      id: this.generateId(),
      userId: userId,
      userName: userName,
      userPublicKey: publicKey,
      unreadCount: 0,
      timestamp: Date.now()
    };

    // Update conversations list
    const conversations = [...this.conversationsSubject.value, conversation];
    this.conversationsSubject.next(conversations);

    // Initialize session
    await this.createSession(userId, publicKey);

    return conversation.id;
  }

  /**
   * Load or generate identity keys
   */
  private async loadOrGenerateIdentityKeys(): Promise<void> {
    // In a real app, you might load from secure storage
    // For demo, we'll generate new keys each time
    this.myIdentityKeyPair = await this.keyService.generateKeyPair();
  }

  /**
   * Create a session with a user
   */
  private async createSession(userId: string, peerPublicKey: string): Promise<DoubleRatchetService> {
    if (!this.myIdentityKeyPair) {
      throw new Error('Identity keys not initialized');
    }

    // Create a new Double Ratchet service for this session
    const session = new DoubleRatchetService(this.keyService);

    // Initialize the session
    await session.initializeSession(this.myIdentityKeyPair, peerPublicKey);

    // Store the session
    this.sessions.set(userId, session);

    return session;
  }

  /**
   * Add a message to the history
   */
  private addMessageToHistory(message: Message): void {
    const userId = message.sent ? message.receiverId : message.senderId;

    // Get existing messages or create new array
    const messages = this.messageHistory.get(userId) || [];

    // Add new message
    messages.push(message);

    // Update map
    this.messageHistory.set(userId, messages);

    // If this is the active conversation, update the messages subject
    const activeConversation = this.activeConversationSubject.value;
    if (activeConversation === userId) {
      this.messagesSubject.next([...messages]);
    }
  }

  /**
   * Update the last message in a conversation
   */
  private updateConversationLastMessage(userId: string, message: string): void {
    const conversations = this.conversationsSubject.value;
    const updatedConversations = conversations.map(conv => {
      if (conv.userId === userId) {
        return {
          ...conv,
          lastMessage: message,
          timestamp: Date.now()
        };
      }
      return conv;
    });

    // Sort by newest first
    updatedConversations.sort((a, b) => b.timestamp - a.timestamp);

    this.conversationsSubject.next(updatedConversations);
  }

  /**
   * Update conversation for a new received message
   */
  private updateConversationForNewMessage(senderId: string, message: string): void {
    const activeConversation = this.activeConversationSubject.value;
    const isActive = activeConversation === senderId;

    const conversations = this.conversationsSubject.value;
    const updatedConversations = conversations.map(conv => {
      if (conv.userId === senderId) {
        return {
          ...conv,
          lastMessage: message,
          timestamp: Date.now(),
          unreadCount: isActive ? 0 : conv.unreadCount + 1
        };
      }
      return conv;
    });

    // Sort by newest first
    updatedConversations.sort((a, b) => b.timestamp - a.timestamp);

    this.conversationsSubject.next(updatedConversations);
  }

  /**
   * Generate a random ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Load mock data (for demo purposes)
   */
  private async loadMockData(): Promise<void> {
    // Mock users
    const mockUsers: User[] = [
      {
        id: 'user1',
        name: 'Alice',
        identityPublicKey: (await this.keyService.generateKeyPair()).publicKey
      },
      {
        id: 'user2',
        name: 'Bob',
        identityPublicKey: (await this.keyService.generateKeyPair()).publicKey
      },
      {
        id: 'user3',
        name: 'Charlie',
        identityPublicKey: (await this.keyService.generateKeyPair()).publicKey
      }
    ];

    // Add users to directory
    mockUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    // Create mock conversations
    const mockConversations: Conversation[] = mockUsers.map(user => ({
      id: this.generateId(),
      userId: user.id,
      userName: user.name,
      userPublicKey: user.identityPublicKey,
      lastMessage: 'Start a secure conversation',
      unreadCount: 0,
      timestamp: Date.now() - Math.random() * 1000000
    }));

    // Initialize sessions for each user
    for (const user of mockUsers) {
      await this.createSession(user.id, user.identityPublicKey);
    }

    // Sort by newest first
    mockConversations.sort((a, b) => b.timestamp - a.timestamp);

    // Update conversations list
    this.conversationsSubject.next(mockConversations);
  }

  /**
   * Simulate message delivery (for demo purposes)
   */
  private simulateMessageDelivery(message: Message, encryptedMessage: EncryptedMessage): void {
    // In a real app, this would be handled by your backend
    // For demo, we'll simulate a small delay and then "deliver" the message
    setTimeout(() => {
      console.log('Message delivered successfully');
    }, 500);
  }
}
