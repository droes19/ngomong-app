import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-new-contact',
  templateUrl: './new-contact.page.html',
  styleUrls: ['./new-contact.page.scss'],
  imports: [
    IonicModule
  ]
})
export class NewContactPage implements OnInit {
  contactForm!: FormGroup

  constructor(private fb: FormBuilder,
    private modalCtrl: ModalController) { }

  ngOnInit() {
    this.contactForm = this.fb.group({
      firstName: '',
      lastName: '',
      country: '',
      phone: '',
      saveTo: 'phone',
    })
  }

  goBack() {
    this.modalCtrl.dismiss()
  }
}
