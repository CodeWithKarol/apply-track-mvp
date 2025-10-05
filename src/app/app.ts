import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  dateApplied: Date;
  notes?: string;
}

export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface ApplicationStats {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  successRate: number;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('ApplyTrack');

  // Mock data for demonstration
  protected readonly applications = signal<JobApplication[]>([]);

  protected readonly stats = signal<ApplicationStats>({
    total: 0,
    applied: 0,
    interviews: 0,
    offers: 0,
    successRate: 0,
  });

  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal<ApplicationStatus | 'all'>('all');
}
