import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/service/auth.service';
import { AlertController, LoadingController } from '@ionic/angular/standalone';
import { HttpErrorResponse } from '@angular/common/module.d-CnjH8Dlt';
import { Router } from '@angular/router';
import { UserApiService } from '../core/service/user-api.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class AuthPage implements OnInit {
  registerForm!: FormGroup;
  isSubmitted = false;
  showAlternativeMethod = false; // Flag to show/hide alternative method option
  verificationMethod = 'email'; // Default to email verification

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userApiService: UserApiService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private route: Router,
  ) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      contactMethod: this.formBuilder.group({
        method: ['email', Validators.required], // Default is now always email
        email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$')]],
        phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]] // Still kept for future use
      }, { validators: this.contactMethodValidator } as AbstractControlOptions),
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  // Custom validator to ensure either email or phone number is provided based on method
  contactMethodValidator(group: FormGroup) {
    const method = group.get('method')?.value;
    const email = group.get('email')?.value;
    const phoneNumber = group.get('phoneNumber')?.value;

    if (method === 'email' && (!email || email.trim() === '')) {
      group.get('email')?.setErrors({ required: true });
      return { emailRequired: true };
    } else if (method === 'phone' && (!phoneNumber || phoneNumber.trim() === '')) {
      group.get('phoneNumber')?.setErrors({ required: true });
      return { phoneRequired: true };
    }

    return null;
  }
  get contactMethodControl() {
    return (this.registerForm.get('contactMethod') as FormGroup).controls;
  }

  async submitInitialForm() {
    this.isSubmitted = true;

    if (!this.registerForm.valid) {
      return;
    }
    const loading = await this.loadingController.create({
      message: 'Checking information...',
      spinner: 'circles'
    });
    await loading.present();

    // this.verificationMethod = this.contactMethodControl['method']?.value || 'email';
    // let type = this.verificationMethod
    let type = this.contactMethodControl['method']?.value || 'email';
    const value = this.contactMethodControl['email']?.value || '';
    const exists = await this.checkIfContactExists(type, value);

    if (exists === undefined) {
      await loading.dismiss();
      this.showAlertError();
    }
    if (exists) {
      await loading.dismiss();
      const alert = await this.alertController.create({
        header: 'Account Already Exists',
        message: `This email address is already registered. Do you want to continue using this email on this device?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Continue',
            handler: async () => {
              this.requestOtp(type, value, true);
            }
          }
        ]
      });
      await alert.present()
    } else {
      await loading.dismiss();
      this.requestOtp(type, value);
    }
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
    this.authService.requestOtp(type, value, toApp).subscribe({
      next: async () => {
        await verifyLoading.dismiss();
        this.route.navigateByUrl(`auth/${type}/${value}${toApp ? '?a=1' : ''}`)
      },
      error: async () => {
        await verifyLoading.dismiss();
        this.showAlertError();
      }
    })
  }

  async checkIfContactExists(type: string, value: string): Promise<boolean | undefined> {
    return new Promise(async (resolve) => {
      let service = this.userApiService.getUserByPhoneNumber(value)
      if (type === 'email') {
        service = this.userApiService.getUserByEmail(value)
      }
      service.subscribe({
        next: () => {
          resolve(true)
        },
        error: async (err: HttpErrorResponse) => {
          if (err.status === 404) {
            resolve(false);
          } else {
            const alert = await this.alertController.create({
              header: 'Error',
              message: 'An error occurred. Please try again later.',
              buttons: ['OK']
            });
            await alert.present()
            resolve(undefined);
          }
        }
      })

    });
  }

  toggleAlternativeMethod() {
    this.showAlternativeMethod = !this.showAlternativeMethod;
  }

  // Switch verification method between email and phone - kept for future functionality
  switchVerificationMethod(method: string | number | undefined) {
    const contactMethodGroup = this.registerForm.get('contactMethod') as FormGroup;
    contactMethodGroup.get('method')?.setValue(method);
    this.verificationMethod = method as string;

    // Clear validation errors when switching
    if (method === 'email') {
      contactMethodGroup.get('email')?.updateValueAndValidity();
      contactMethodGroup.get('phoneNumber')?.setErrors(null);
    } else {
      contactMethodGroup.get('phoneNumber')?.updateValueAndValidity();
      contactMethodGroup.get('email')?.setErrors(null);
    }
  }

  get errorControl() {
    return this.registerForm.controls;
  }
}
