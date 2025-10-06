import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

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
    DatePipe,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('ApplyTrack');

  // Separate arrays for each application status
  protected readonly appliedApplications = signal<JobApplication[]>([
    {
      id: '1',
      company: 'Google',
      position: 'Frontend Developer',
      status: 'applied',
      dateApplied: new Date('2024-10-01'),
      notes: 'Applied via careers page',
    },
    {
      id: '2',
      company: 'Microsoft',
      position: 'Software Engineer',
      status: 'applied',
      dateApplied: new Date('2024-10-03'),
      notes: 'Referral from John',
    },
  ]);

  protected readonly interviewApplications = signal<JobApplication[]>([
    {
      id: '3',
      company: 'Amazon',
      position: 'Full Stack Developer',
      status: 'interview',
      dateApplied: new Date('2024-09-25'),
      notes: 'Phone interview scheduled',
    },
  ]);

  protected readonly offerApplications = signal<JobApplication[]>([]);

  protected readonly rejectedApplications = signal<JobApplication[]>([
    {
      id: '4',
      company: 'Facebook',
      position: 'React Developer',
      status: 'rejected',
      dateApplied: new Date('2024-09-20'),
      notes: 'Technical interview did not go well',
    },
  ]);

  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal<ApplicationStatus | 'all'>('all');

  // Computed stats based on all applications
  protected readonly stats = signal<ApplicationStats>({
    total: 4,
    applied: 2,
    interviews: 1,
    offers: 0,
    successRate: 0,
  });

  // Drag and drop handler for job applications
  drop(event: CdkDragDrop<JobApplication[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between columns - update the application status
      const application = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);

      // Update application status
      application.status = newStatus;

      // Transfer the item between arrays
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update stats after moving
      this.updateStats();
    }
  }

  private getStatusFromContainerId(containerId: string): ApplicationStatus {
    switch (containerId) {
      case 'applied-list':
        return 'applied';
      case 'interview-list':
        return 'interview';
      case 'offer-list':
        return 'offer';
      case 'rejected-list':
        return 'rejected';
      default:
        return 'applied';
    }
  }

  private updateStats() {
    const applied = this.appliedApplications().length;
    const interviews = this.interviewApplications().length;
    const offers = this.offerApplications().length;
    const rejected = this.rejectedApplications().length;
    const total = applied + interviews + offers + rejected;
    const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

    this.stats.set({
      total,
      applied,
      interviews,
      offers,
      successRate,
    });
  }
}
