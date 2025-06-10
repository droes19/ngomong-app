import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController, LoadingController, ModalController } from '@ionic/angular/standalone';
import { UserApiService } from '../core/service/user-api.service';
import { HttpErrorResponse } from '@angular/common/module.d-CnjH8Dlt';
import { ContactService, User, UserService } from '../core/database';

@Component({
  selector: 'app-new-contact',
  templateUrl: './new-contact.page.html',
  styleUrls: ['./new-contact.page.scss'],
  imports: [
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
  ]
})
export class NewContactPage implements OnInit {
  searchContactForm!: FormGroup
  contactForm!: FormGroup
  hasSearch = false
  pinOrEmail!: string

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingController: LoadingController,
    private userApiService: UserApiService,
    private alertController: AlertController,
    private userService: UserService,
    private contactService: ContactService,
  ) { }

  ngOnInit() {
    this.searchContactForm = this.fb.group({
      pinOrEmail: ['', this.validatorSearchContact()]
    });
    this.contactForm = this.fb.group({
      pin: ['', Validators.required],
      nickname: ['', Validators.required],
      email: '',
      // phone: '',
      // saveTo: 'phone',
    })
  }

  validatorSearchContact(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value || value.trim() === '') {
        return { validSearchContact: { message: "PIN or Email is required" } };
      }

      if ((value as string).includes('@')) {
        const emailReg: RegExp = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        if (!emailReg.test(value)) {
          return { validSearchContact: { message: "Invalid email format" } };
        }
      } else {
        const pinReg: RegExp = /^[a-zA-Z0-9]+$/;
        if (!pinReg.test(value)) {
          return { validSearchContact: { message: "PIN can only contain letters and numbers" } };
        }

        if (value.length < 10) {
          return { validSearchContact: { message: "PIN must be at least 10 characters" } };
        }
      }
      return null;
    };
  }

  async searchContact() {
    if (!this.searchContactForm.valid) {
      return
    }
    const loading = await this.loadingController.create({
      message: 'Checking information...',
      spinner: 'circles'
    });
    await loading.present();

    let service;
    let userDb;
    let contactDb;
    let alert;
    let value = this.searchContactForm.get('pinOrEmail')?.value;
    if (value.includes('@')) {
      userDb = await this.userService.findByEmail(value);
      if (userDb?.email === value) {
        await loading.dismiss()
        alert = await this.alertController.create({
          message: 'This Email is yours',
          buttons: ['OK']
        });
        await alert.present()
        return
      }
      contactDb = await this.contactService.findByEmail(value);
      if (contactDb?.email === value) {
        await loading.dismiss()
        alert = await this.alertController.create({
          message: `Email already in contact as ${contactDb?.nickname}`,
          buttons: ['OK']
        });
        await alert.present()
        return
      }
      service = this.userApiService.getUserByEmail(value)
    } else {
      userDb = await this.userService.getById(value);
      if (userDb?.pin === value) {
        await loading.dismiss()
        alert = await this.alertController.create({
          message: 'This PIN is yours',
          buttons: ['OK']
        });
        await alert.present()
        return
      }
      contactDb = await this.contactService.getById(value);
      if (contactDb?.email === value) {
        await loading.dismiss()
        alert = await this.alertController.create({
          message: `PIN already in contact as ${contactDb?.nickname}`,
          buttons: ['OK']
        });
        await alert.present()
        return
      }
      service = this.userApiService.getUserByPin(value)
    }
    service.subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.hasSearch = true
        console.log(res as User);
      },
      error: async (err: HttpErrorResponse) => {
        await loading.dismiss();
        if (err.status === 404) {
          alert = await this.alertController.create({
            message: 'User not found',
            buttons: ['OK']
          });
        } else {
          alert = await this.alertController.create({
            header: 'Error',
            message: 'An error occurred. Please try again later.',
            buttons: ['OK']
          });
        }
        await alert.present()
      }
    })
  }

  backToSearch() {
    this.hasSearch = false;
  }
  goBack() {
    this.modalCtrl.dismiss()
  }
}
