import { inject, Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import { UserService } from '../database';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private wsUrl = environment.wsUrl;
  private socket$!: WebSocketSubject<any>;
  private userService = inject(UserService);
  private isConnected = false;

  private async initSocket(): Promise<void> {
    if (!this.isConnected) {
      const users = await this.userService.getAll();
      if (users && users.length > 0) {
        this.socket$ = webSocket(this.wsUrl + `?token=${users[0].id}`);
        this.isConnected = true;
        // } else {
        //   this.socket$ = webSocket(this.wsUrl);
        // throw new Error('User not found');
      }
    }
  }

  async sendMessage(msg: any) {
    await this.initSocket();
    if (this.isConnected) {
      this.socket$.next(msg);
    }
  }

  async getMessages() {
    await this.initSocket();
    if (this.isConnected) {
      return this.socket$?.asObservable();
    }
    return null;
  }

  async close() {
    if (this.socket$) {
      this.socket$.complete();
      this.isConnected = false;
    }
  }
}
