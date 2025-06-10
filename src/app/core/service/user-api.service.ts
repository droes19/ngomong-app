import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  constructor(
    private apiService: ApiService,
  ) { }

  getUserByPin(pin: string) {
    return this.apiService.get(`users/${pin}`)
  }
  getUserByEmail(email: string) {
    return this.apiService.get(`users/email/${email}`)
  }
  getUserByPhoneNumber(phoneNumber: string) {
    return this.apiService.get(`users/phoneNumber/${phoneNumber}`)
  }
}
