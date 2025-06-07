import { Component, computed, input, Input, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, IonContent, IonHeader, IonTitle, IonToolbar, LoadingController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/module.d-CnjH8Dlt';
import { AuthService } from 'src/app/core/service/auth.service';
import { User, UserService } from 'src/app/core/database';
import { KeyService } from 'src/app/core/util/service/key.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.page.html',
  styleUrls: ['./otp.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class OtpPage implements OnInit {
  type = input.required<string>();
  value = input.required<string>();
  verificationForm!: FormGroup;
  isVerificationSubmitted = false;
  countdown = 0;
  countdownInterval: any;

  toApp: boolean = false;
  method!: string

  constructor(
    private location: Location,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private authService: AuthService,
    private alertController: AlertController,
    private userService: UserService,
    private keyService: KeyService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.toApp = this.activatedRoute.snapshot.queryParamMap.get('a') ? true : false;
    this.method = this.toApp ? 'other device' : this.type()
    this.verificationForm = this.formBuilder.group({
      digit1: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit2: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit3: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit4: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit5: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit6: ['', [Validators.required, Validators.pattern('^[0-9]$')]]
    });
    this.startCountdown()
  }

  onOtpInput(event: any, nextInput: any) {
    const input = event.target;
    const value = input.value;

    if (value.length === 1 && nextInput) {
      nextInput.setFocus();
    }
  }

  getFullOtp(): string {
    const verificationValue = this.verificationForm.value;
    return `${verificationValue.digit1}${verificationValue.digit2}${verificationValue.digit3}${verificationValue.digit4}${verificationValue.digit5}${verificationValue.digit6}`;
  }

  async verifyOTP() {
    this.isVerificationSubmitted = true;

    if (!this.verificationForm.valid) {
      return;
    }

    const fullOtp = this.getFullOtp();

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Verifying code...',
      spinner: 'circles'
    });
    await loading.present();

    this.authService.verifyOtp(this.value(), fullOtp).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        console.log(res)
        const now = new Date().toISOString();
        const keyPair = await this.keyService.generateKeyPair();
        const user: User = {
          id: res.pin,
          email: res.email,
          nickname: res.nickname,
          pin: res.pin,
          identityKeyPair: JSON.stringify(keyPair),
          identityPublicKey: keyPair.publicKey,
          createdAt: now,
          updatedAt: now,
        }
        await this.userService.create(user);
        this.router.navigateByUrl('/home');
      },
      error: async (err: any) => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          message: err.error?.message || 'An error occurred. Please try again later.',
          buttons: ['OK']
        });
        await alert.present();
        console.log(err);
      }
    });
  }

  startCountdown() {
    // this.countdown = 60;
    this.countdown = 5;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  async resendOTP() {
    if (this.toApp) {
      this.resendOTPExistAccount();
    } else {
      this.requestOTP();
    }
  }

  async resendOTPExistAccount() {
    const alert = await this.alertController.create({
      header: 'Resend OTP',
      message: `Where do you want to resend OTP?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Resend to email',
          handler: async () => {
            this.method = this.type()
            this.requestOTP();
          }
        },
        {
          text: 'Resend to the other device',
          handler: async () => {
            this.method = 'other device'
            this.requestOTP(true);
          }
        }
      ]
    });
    await alert.present()
  }

  async requestOTP(toApp: boolean = false) {
    const loading = await this.loadingController.create({
      message: 'Resend OTP...',
      spinner: 'circles'
    });
    await loading.present();
    this.authService.requestOtp(this.type(), this.value(), toApp).subscribe({
      next: async () => {
        await loading.dismiss();
        this.startCountdown();
      },
    })
  }

  goBack() {
    clearInterval(this.countdownInterval);
    this.location.back()
  }
}
