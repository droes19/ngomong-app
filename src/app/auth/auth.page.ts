import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../core/database/services/user.service';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class AuthPage implements OnInit {
  registerForm!: FormGroup;
  verificationForm!: FormGroup;
  isSubmitted = false;
  isVerificationSubmitted = false;
  registrationStep = 1; // 1: Initial name form, 2: OTP verification
  countdown = 0;
  countdownInterval: any;
  verificationMethod = 'email'; // Default to email verification
  contactInfo = ''; // Will store either email or phone based on selection
  showAlternativeMethod = false; // Flag to show/hide alternative method option

  constructor(
    public formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      contactMethod: this.formBuilder.group({
        method: ['email', Validators.required], // Default is now always email
        email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$')]],
        phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]] // Still kept for future use
      }, { validators: this.contactMethodValidator }),
      termsAccepted: [false, Validators.requiredTrue]
    });

    this.verificationForm = this.formBuilder.group({
      digit1: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit2: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit3: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit4: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit5: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit6: ['', [Validators.required, Validators.pattern('^[0-9]$')]]
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

  // Easy access to form fields
  get errorControl() {
    return this.registerForm.controls;
  }

  get contactMethodControl() {
    return (this.registerForm.get('contactMethod') as FormGroup).controls;
  }

  get verificationErrorControl() {
    return this.verificationForm.controls;
  }

  // For future use when phone option is enabled
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

  async submitInitialForm() {
    this.isSubmitted = true;

    if (!this.registerForm.valid) {
      return;
    }

    // Get contact info based on selected verification method (always email for now)
    const contactMethodGroup = this.registerForm.get('contactMethod') as FormGroup;
    this.verificationMethod = contactMethodGroup.get('method')?.value || 'email';
    this.contactInfo = contactMethodGroup.get('email')?.value || '';

    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Checking information...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      // Check if email already exists through API
      const exists = await this.checkIfContactExists(
        this.verificationMethod,
        this.contactInfo
      );

      if (exists === undefined) {
        await loading.dismiss();
        return;
      }
      if (exists) {
        await loading.dismiss();

        // Show alert for existing account with continue and cancel options
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
                // Show loading while transitioning to OTP verification
                const verifyLoading = await this.loadingController.create({
                  message: 'Sending verification code...',
                  spinner: 'circles'
                });
                await verifyLoading.present();

                // Send OTP for device verification
                const otpSent = await this.sendOtpCode(
                  this.verificationMethod,
                  this.contactInfo,
                  true // Indicate this is for existing account
                );

                await verifyLoading.dismiss();

                if (otpSent) {
                  // Move to verification step
                  this.registrationStep = 2;
                  this.startCountdown();

                  // Show toast notification
                  const toast = await this.toastController.create({
                    message: `Verification code sent to your email`,
                    duration: 3000,
                    position: 'bottom',
                    color: 'success'
                  });
                  toast.present();
                } else {
                  // Show error if OTP sending failed
                  const errorAlert = await this.alertController.create({
                    header: 'Error',
                    message: `Failed to send verification code. Please try again later.`,
                    buttons: ['OK']
                  });

                  await errorAlert.present();
                }
              }
            }
          ]
        });

        await alert.present();
        return;
      }

      // If we get here, the contact info is available
      loading.message = 'Sending verification code...';

      // Send OTP via API
      const otpSent = await this.sendOtpCode(
        this.verificationMethod,
        this.contactInfo
      );

      await loading.dismiss();

      if (otpSent) {
        // Move to verification step
        this.registrationStep = 2;
        this.startCountdown();

        // Show toast notification
        const toast = await this.toastController.create({
          message: `Verification code sent to your email`,
          duration: 3000,
          position: 'bottom',
          color: 'success'
        });
        toast.present();
      } else {
        // Show error if OTP sending failed
        const alert = await this.alertController.create({
          header: 'Error',
          message: `Failed to send verification code. Please try again later.`,
          buttons: ['OK']
        });

        await alert.present();
      }
    } catch (error) {
      await loading.dismiss();

      // Show error alert
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'An error occurred. Please try again later.',
        buttons: ['OK']
      });

      await alert.present();
      console.error('Registration error:', error);
    }
  }

  // Check if contact info (email/phone) already exists
  async checkIfContactExists(type: string, value: string): Promise<boolean | undefined> {
    // This would be an actual API call in production
    // For simulation purposes, we'll use a timeout and mock response

    return new Promise(async (resolve) => {
      // Simulating API call with timeout

      if (type === 'email') {
        this.authService.isEmailRegistered(value).subscribe({
          next: (res: any) => {
            resolve(res.exists)
          },
          error: async (_err: Error) => {
            const alert = await this.alertController.create({
              header: 'Error',
              message: 'An error occurred. Please try again later.',
              buttons: ['OK']
            });
            await alert.present()
            resolve(undefined);
          }
        })
      }
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'An error occurred. Please try again later.',
        buttons: ['OK']
      });
      await alert.present()
      resolve(undefined);
      //setTimeout(() => {
      //  // For demo purposes:
      //  // - test@example.com and 1234567890 are "already registered"
      //  // - all other values are considered available
      //
      //  if (type === 'email' && value === 'test@example.com') {
      //    resolve(true); // Email exists
      //  } else if (type === 'phone' && value === '1234567890') {
      //    resolve(true); // Phone exists
      //  } else {
      //    resolve(false); // Contact info doesn't exist
      //  }
      //
      //  // In production, replace with actual API call:
      //  // return this.authService.checkContactExists(type, value).toPromise();
      //}, 1500);
    });
  }

  // Send OTP code via API
  async sendOtpCode(type: string, value: string, isExistingAccount: boolean = false): Promise<boolean> {
    // This would be an actual API call in production
    // For simulation purposes, we'll use a timeout and mock response

    return new Promise((resolve) => {
      // Simulating API call with timeout
      setTimeout(() => {
        // Simulating successful OTP sending (could include error scenarios)
        resolve(true);

        // In production, replace with actual API call:
        // For new accounts:
        // return this.authService.sendOtp(type, value).toPromise();

        // For existing accounts (moving to new device):
        // if (isExistingAccount) {
        //   return this.authService.sendDeviceVerificationOtp(type, value).toPromise();
        // } else {
        //   return this.authService.sendRegistrationOtp(type, value).toPromise();
        // }
      }, 1500);
    });
  }

  startCountdown() {
    this.countdown = 60;
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
    if (this.countdown > 0) return;

    const loading = await this.loadingController.create({
      message: 'Resending verification code...',
      spinner: 'circles'
    });
    await loading.present();

    // Simulate API call to resend OTP
    setTimeout(async () => {
      await loading.dismiss();
      this.startCountdown();

      // Show toast notification
      const toast = await this.toastController.create({
        message: `New verification code sent to your email`,
        duration: 3000,
        position: 'bottom',
        color: 'success'
      });
      toast.present();
    }, 2000);
  }

  // Handle input focus for OTP fields
  onOtpInput(event: any, nextInput: any) {
    const input = event.target;
    const value = input.value;

    if (value.length === 1 && nextInput) {
      nextInput.setFocus();
    }
  }

  // Get full OTP from individual digits
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

    try {
      // Check if this was for an existing account
      const contactMethodGroup = this.registerForm.get('contactMethod') as FormGroup;
      const contactExists = await this.checkIfContactExists(
        this.verificationMethod,
        this.contactInfo
      );

      // Verify OTP via API
      const verificationResult = await this.verifyOtpCode(
        this.verificationMethod,
        this.contactInfo,
        fullOtp,
        contactExists
      );

      await loading.dismiss();
      clearInterval(this.countdownInterval);

      if (verificationResult.success) {
        // Different success message based on whether this was a new account or device transfer
        const header = contactExists ? 'Verification Successful' : 'Registration Successful';
        const message = contactExists
          ? `You can now use your account on this device.`
          : `Welcome! Your account has been created successfully.`;

        // Display success message
        const alert = await this.alertController.create({
          header: header,
          message: message,
          buttons: [
            {
              text: 'Continue',
              handler: () => {
                // Navigate to home page or onboarding
                this.router.navigate(['/home']);
              }
            }
          ]
        });
        await alert.present();
      } else {
        // Show error for invalid OTP
        const alert = await this.alertController.create({
          header: 'Verification Failed',
          message: verificationResult.message || 'The verification code is incorrect or has expired. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } catch (error) {
      await loading.dismiss();

      // Show error alert
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'An error occurred while verifying your code. Please try again.',
        buttons: ['OK']
      });

      await alert.present();
      console.error('OTP verification error:', error);
    }
  }

  // Verify OTP code via API
  async verifyOtpCode(type: string, contact: string, otp: string, isExistingAccount: boolean = false): Promise<{ success: boolean, message?: string }> {
    // This would be an actual API call in production
    // For simulation purposes, we'll use a timeout and mock response

    return new Promise((resolve) => {
      // Simulating API call with timeout
      setTimeout(() => {
        // For demo purposes:
        // - "123456" is a valid OTP
        // - Any other value is invalid

        if (otp === '123456') {
          resolve({
            success: true
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid verification code. Please try again.'
          });
        }

        // In production, replace with actual API call:
        // if (isExistingAccount) {
        //   return this.authService.verifyDeviceTransferOtp(type, contact, otp).toPromise();
        // } else {
        //   return this.authService.verifyRegistrationOtp(type, contact, otp).toPromise();
        // }
      }, 2000);
    });
  }

  goBack() {
    this.registrationStep = 1;
    clearInterval(this.countdownInterval);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
