import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../database/services/user.service';
import { User } from '../database/models/user';
import { ApiService } from '../api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private apiService: ApiService,
  ) {
    this.checkAuthentication();
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication(): Promise<boolean> {
    // For demo purposes, we'll just check if we have users in the database
    // In a real application, you would check for a valid session, token, etc.
    try {
      const users = await this.userService.getAll();
      if (users.length > 0) {
        this.currentUser = users[0];
        this.isAuthenticated = true;
        return true;
      }
      this.isAuthenticated = false;
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.router.navigate(['/auth']);
  }

  isEmailRegistered(email: string) {
    return this.apiService.get('registration/check-email', { email: email })
  }
}
