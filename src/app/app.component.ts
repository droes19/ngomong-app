import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { callOutline, caretBack, chatboxEllipses, chatbubbleEllipses, downloadOutline, lockClosed, personAdd, personOutline, searchOutline } from 'ionicons/icons';
import { WebsocketService } from './core/service/websocket.service';
import { UserService } from './core/database';
import { WebsocketDTO, WebsocketHandler } from './handler/websocket.handler';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private wsService: WebsocketService,
    private userService: UserService,
    private wsHandler: WebsocketHandler,
  ) {
    addIcons({ chatboxEllipses, chatbubbleEllipses, caretBack, personAdd, personOutline, callOutline, downloadOutline, lockClosed, searchOutline })
    addIcons({})
  }

  async ngOnInit() {
    const ws = await this.wsService.getMessages()
    ws?.subscribe((res: WebsocketDTO) => {
      if (res.type === 'ping') {
        // Respond to server heartbeat
        this.wsService.sendMessage(JSON.stringify({ type: "pong" }));
      } else {
        // Handle your normal messages
        this.wsHandler.handler(res);
      }
    });
    setInterval(() => {
      this.wsService.sendMessage(JSON.stringify({ type: "ping" }));
    }, 240000)
  }
}
