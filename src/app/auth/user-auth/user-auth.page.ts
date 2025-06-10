import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController, LoadingController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { User, UserService } from 'src/app/core/database';

@Component({
  selector: 'app-user-auth',
  templateUrl: './user-auth.page.html',
  styleUrls: ['./user-auth.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class UserAuthPage implements OnInit {
  userForm: FormGroup = new FormGroup({
    id: new FormControl(),
    nickname: new FormControl(),
    pin: new FormControl(),
    email: new FormControl(),
    phoneNumber: new FormControl(),
    identityKeyPair: new FormControl(),
    identityPublicKey: new FormControl(),
    createdAt: new FormControl(),
    updatedAt: new FormControl(),
  });

  constructor(
    private formBuilder: FormBuilder,
    // private authService: AuthService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private route: Router,
    private userService: UserService,
  ) { }

  ngOnInit() {
    this.initForm()
  }

  async initForm() {
    let userAsync = await this.userService.getAll()
    let user: User = userAsync[0]
    console.log(user);
    this.userForm = this.formBuilder.group({
      id: [{ value: user.id, disabled: true }],
      nickname: [user.nickname ? user.nickname : '', Validators.required],
      pin: [{ value: user.pin, disabled: true }],
      email: [{ value: user.email, disabled: true }],
      phoneNumber: [{ value: user.phoneNumber, disabled: true }],
      identityKeyPair: [{ value: user.identityKeyPair, disabled: true }],
      identityPublicKey: [{ value: user.identityPublicKey, disabled: true }],
      createdAt: [{ value: user.createdAt, disabled: true }],
      updatedAt: [user.updatedAt],
    })
  }

  async saveForm() {
    if (!this.userForm.valid) {
      return
    }
    const now = new Date().toISOString();
    let user: User = this.userForm.value
    this.userService.update(user.id, { nickname: user.nickname, updatedAt: now });
  }

  async showAlertError() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'An error occurred. Please try again later.',
      buttons: ['OK']
    });
    await alert.present()
  }

  async requestOtp(type: string, value: string, toApp: boolean = false) {
    const verifyLoading = await this.loadingController.create({
      message: 'Sending verification code...',
      spinner: 'circles'
    });
    await verifyLoading.present();
    // this.authService.requestOtp(type, value, toApp).subscribe({
    //   next: async () => {
    //     await verifyLoading.dismiss();
    //     this.route.navigateByUrl(`login/${type}/${value}${toApp ? '?a=1' : ''}`)
    //   },
    //   error: async () => {
    //     await verifyLoading.dismiss();
    //     this.showAlertError();
    //   }
    // })
  }

  async checkIfContactExists(type: string, value: string): Promise<boolean | undefined> {
    return new Promise(async (resolve) => {
      if (type === 'email') {
        // this.authService.isEmailRegistered(value).subscribe({
        //   next: () => {
        //     resolve(true)
        //   },
        //   error: async (err: HttpErrorResponse) => {
        //     if (err.status === 404) {
        //       resolve(false);
        //     } else {
        //       const alert = await this.alertController.create({
        //         header: 'Error',
        //         message: 'An error occurred. Please try again later.',
        //         buttons: ['OK']
        //       });
        //       await alert.present()
        //       resolve(undefined);
        //     }
        //   }
        // })
      }
    });
  }
}
