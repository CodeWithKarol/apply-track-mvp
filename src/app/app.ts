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
  followUpDate?: Date;
  interviewDate?: Date;
}

export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface ApplicationStats {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  successRate: number;
}

export interface Reminder {
  id: string;
  applicationId: string;
  company: string;
  position: string;
  type: 'follow-up' | 'interview' | 'decision-deadline';
  date: Date;
  description: string;
  completed: boolean;
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
      followUpDate: new Date('2024-10-08'),
    },
    {
      id: '2',
      company: 'Microsoft',
      position: 'Software Engineer',
      status: 'applied',
      dateApplied: new Date('2024-10-03'),
      notes: 'Referral from John',
      followUpDate: new Date('2024-10-10'),
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
      interviewDate: new Date('2024-10-07'),
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

  // Reminders data
  protected readonly reminders = signal<Reminder[]>([
    {
      id: 'r1',
      applicationId: '1',
      company: 'Google',
      position: 'Frontend Developer',
      type: 'follow-up',
      date: new Date('2025-10-08'),
      description: 'Follow up on application status',
      completed: false,
    },
    {
      id: 'r2',
      applicationId: '3',
      company: 'Amazon',
      position: 'Full Stack Developer',
      type: 'interview',
      date: new Date('2025-10-07'),
      description: 'Technical phone interview at 2:00 PM',
      completed: false,
    },
    {
      id: 'r3',
      applicationId: '2',
      company: 'Microsoft',
      position: 'Software Engineer',
      type: 'follow-up',
      date: new Date('2025-10-10'),
      description: 'Check on application progress',
      completed: false,
    },
  ]);

  // Computed stats based on all applications
  protected readonly stats = signal<ApplicationStats>({
    total: 4,
    applied: 2,
    interviews: 1,
    offers: 0,
    successRate: 0,
  });

  // Get upcoming reminders (next 7 days)
  protected readonly upcomingReminders = signal<Reminder[]>([]);

  constructor() {
    this.updateUpcomingReminders();
  }

  private updateUpcomingReminders() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = this.reminders()
      .filter((reminder) => !reminder.completed)
      .filter((reminder) => reminder.date >= today && reminder.date <= nextWeek)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    this.upcomingReminders.set(upcoming);
  }

  markReminderComplete(reminderId: string) {
    const updatedReminders = this.reminders().map((reminder) =>
      reminder.id === reminderId ? { ...reminder, completed: true } : reminder
    );
    this.reminders.set(updatedReminders);
    this.updateUpcomingReminders();
  }

  getReminderIcon(type: string): string {
    switch (type) {
      case 'interview':
        return 'videocam';
      case 'follow-up':
        return 'email';
      case 'decision-deadline':
        return 'schedule';
      default:
        return 'notifications';
    }
  }

  isReminderUrgent(date: Date): boolean {
    const today = new Date();
    const timeDiff = date.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 2; // Urgent if within 2 days
  }

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
