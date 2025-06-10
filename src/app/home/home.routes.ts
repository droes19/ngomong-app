import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'chats',
    loadComponent: () =>
      import('../chats/chats.page').then((m) => m.ChatsPage),
  },
  {
    path: '',
    redirectTo: 'chats',
    pathMatch: 'full',
  },
];
