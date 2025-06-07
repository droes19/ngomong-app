import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular/standalone";

export interface WebsocketDTO {
  type: string;
  value?: string;
  from?: string;
  to?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketHandler {
  constructor(
    private alertController: AlertController
  ) {
  }

  handler(dto: WebsocketDTO) {
    switch (dto.type) {
      case 'sendOtp':
        this.sendOtpHandler(dto);
        break;
    }
  }

  async sendOtpHandler(dto: WebsocketDTO) {
    const alert = await this.alertController.create({
      header: 'OTP',
      message: `${dto.value}`,
      buttons: ['Ok']
    });
    await alert.present()

  }
}
