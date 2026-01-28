
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Register Spanish locale data
registerLocaleData(localeEs);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    // Set default locale to Spanish (Mexico context)
    { provide: LOCALE_ID, useValue: 'es-MX' }
  ]
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
