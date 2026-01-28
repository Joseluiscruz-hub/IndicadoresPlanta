import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from './components/admin/admin.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, AdminComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Simple view switching state
  currentView = signal<'dashboard' | 'admin'>('dashboard');

  toggleView() {
    this.currentView.update(v => v === 'dashboard' ? 'admin' : 'dashboard');
  }
}