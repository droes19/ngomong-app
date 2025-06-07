import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../core/service/websocket.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonicModule, CommonModule],
})
export class HomePage implements OnInit {
  shouldShowTabs = true;
  constructor(
    private wsService: WebsocketService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Hide tabs when URL depth is greater than base tabs level
      const urlSegments = event.url.split('/').filter(segment => segment.length > 0);
      console.log(urlSegments);

      // Show tabs only for routes like /home/chats, /home/profile, etc.
      // Hide for deeper routes like /home/chats/new-chat, /home/chats/chat/123
      this.shouldShowTabs = urlSegments.length <= 2;
    });
  }
  test() {
    // console.log("test");
    // this.wsService.o
    // this.wsService.sendMessage("test1")
  }
}
