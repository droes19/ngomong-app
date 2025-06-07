import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { NewContactPage } from '../new-contact/new-contact.page';
// import { NewContactComponent } from '../new-contact/new-contact.component';

@Component({
  selector: 'app-new-chat',
  templateUrl: './new-chat.page.html',
  styleUrls: ['./new-chat.page.scss'],
  imports: [
    IonicModule
  ],
})

export class NewChatPage implements OnInit {
  constructor(private router: Router,
    private modalCtrl: ModalController) { }

  ngOnInit() { }

  chatTo() {

  }
  goBack() {
    this.modalCtrl.dismiss()
  }

  async newContact() {
    let modal = await this.modalCtrl.create({
      component: NewContactPage
    })

    await modal.present()
  }

  // newContact() {
  //   this.router.navigateByUrl('/home/chats/new-chat/new-contact')
  // }
  //
  // goBack() {
  //   this.router.navigateByUrl('home/chats');
  // }

}
