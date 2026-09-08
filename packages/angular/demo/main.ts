import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { DemoApp } from './app';

void bootstrapApplication(DemoApp, {
  providers: [provideZonelessChangeDetection()]
});
