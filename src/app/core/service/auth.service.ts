import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
  ) { }

  requestOtp(type: string, value: string, toApp: boolean) {
    return this.apiService.post('auth/request-otp', { type: type, value: value, toApp: toApp })
  }

  verifyOtp(type: string, value: string, otp: string, identityPublicKey: string) {
    return this.apiService.post('auth/verify-otp', { type: type, value: value, otp: otp, identityPublicKey: identityPublicKey })
  }

  isAlreadyRequestOtp(type: string, value: string) {
    return this.apiService.get(`auth/is-requesting-otp/${type}/${value}`)
  }
}
