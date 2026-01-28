import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { D3BarChartComponent } from '../charts/d3-bar-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, D3BarChartComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  store = inject(StoreService);
  
  // Format helpers
  formatPercent(val: number) {
    return val.toFixed(1) + '%';
  }

  // Converts minutes (e.g. 115) to HH:MM (e.g. 01:55)
  minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  forceGlobalSync() {
    this.store.forceSync();
  }
}