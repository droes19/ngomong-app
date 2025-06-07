import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
// import { NewChatComponent } from '../new-chat/new-chat.component';
import { ModalController } from '@ionic/angular/standalone';
import { NewChatPage } from '../new-chat/new-chat.page';
// import { DatabaseService } from '../shared/service/database.service';
// import { CryptoService } from '../shared/service/crypto.service';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  imports: [
    IonicModule,
  ],
})
export class ChatsPage implements OnInit {

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
  ) { }

  async ngOnInit() {
  }

  async newChat() {
    // this.router.navigateByUrl('home/chats/new-chat')
    // this.isOpenNewChat = true

    const modal = await this.modalCtrl.create({
      component: NewChatPage
    })
    await modal.present()

    modal.onDidDismiss().then(d => {
      if (d.data) {

      }
    })
  }


}
