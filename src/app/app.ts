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
  reminderDate?: Date;
  reminderType?: 'follow-up' | 'interview' | 'decision-deadline';
  reminderDescription?: string;
}

export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface ApplicationStats {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  successRate: number;
}

export interface ComputedReminder {
  applicationId: string;
  company: string;
  position: string;
  type: 'follow-up' | 'interview' | 'decision-deadline';
  date: Date;
  description: string;
  isOverdue: boolean;
  daysUntilDue: number;
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
      dateApplied: new Date('2025-10-01'),
      notes: 'Applied via careers page',
      reminderDate: new Date('2025-10-08T09:00:00'),
      reminderType: 'follow-up',
      reminderDescription: 'Follow up on application status',
    },
    {
      id: '2',
      company: 'Microsoft',
      position: 'Software Engineer',
      status: 'applied',
      dateApplied: new Date('2025-10-03'),
      notes: 'Referral from John',
      reminderDate: new Date('2025-10-10T14:00:00'),
      reminderType: 'follow-up',
      reminderDescription: 'Check on application progress',
    },
  ]);

  protected readonly interviewApplications = signal<JobApplication[]>([
    {
      id: '3',
      company: 'Amazon',
      position: 'Full Stack Developer',
      status: 'interview',
      dateApplied: new Date('2025-09-25'),
      notes: 'Phone interview scheduled',
      reminderDate: new Date('2025-10-07T14:00:00'),
      reminderType: 'interview',
      reminderDescription: 'Technical phone interview at 2:00 PM',
    },
  ]);

  protected readonly offerApplications = signal<JobApplication[]>([
    {
      id: '5',
      company: 'Netflix',
      position: 'Senior Frontend Developer',
      status: 'offer',
      dateApplied: new Date('2025-09-15'),
      notes: 'Offer received - need to respond',
      reminderDate: new Date('2025-10-12T17:00:00'),
      reminderType: 'decision-deadline',
      reminderDescription: 'Deadline to respond to job offer',
    },
  ]);

  protected readonly rejectedApplications = signal<JobApplication[]>([
    {
      id: '4',
      company: 'Facebook',
      position: 'React Developer',
      status: 'rejected',
      dateApplied: new Date('2025-09-20'),
      notes: 'Technical interview did not go well',
      // No reminder for rejected applications
    },
    {
      id: '6',
      company: 'Apple',
      position: 'iOS Developer',
      status: 'applied',
      dateApplied: new Date('2025-09-30'),
      notes: 'Applied through LinkedIn',
      reminderDate: new Date('2025-10-05T10:00:00'), // Overdue reminder
      reminderType: 'follow-up',
      reminderDescription: 'Follow up on iOS developer position',
    },
  ]);

  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal<ApplicationStatus | 'all'>('all');

  // Computed stats based on all applications
  protected readonly stats = signal<ApplicationStats>({
    total: 5,
    applied: 2,
    interviews: 1,
    offers: 1,
    successRate: 20,
  });

  // Get upcoming and overdue reminders
  protected readonly upcomingReminders = signal<ComputedReminder[]>([]);
  protected readonly overdueReminders = signal<ComputedReminder[]>([]);

  constructor() {
    this.updateReminders();
    this.updateStats();
  }

  private getAllApplications(): JobApplication[] {
    return [
      ...this.appliedApplications(),
      ...this.interviewApplications(),
      ...this.offerApplications(),
      ...this.rejectedApplications(),
    ];
  }

  private updateReminders() {
    const currentDate = new Date();
    const reminderWindow = 14; // 14 days ahead
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + reminderWindow);

    const allApplications = this.getAllApplications();
    const applicationsWithReminders = allApplications.filter(
      (app) => app.reminderDate && app.reminderType && app.reminderDescription
    );

    const computedReminders: ComputedReminder[] = applicationsWithReminders.map((app) => {
      const reminderDate = app.reminderDate!;
      const timeDiff = reminderDate.getTime() - currentDate.getTime();
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        applicationId: app.id,
        company: app.company,
        position: app.position,
        type: app.reminderType!,
        date: reminderDate,
        description: app.reminderDescription!,
        isOverdue: reminderDate < currentDate,
        daysUntilDue,
      };
    });

    // Separate overdue and upcoming reminders
    const overdue = computedReminders
      .filter((reminder) => reminder.isOverdue)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent overdue first

    const upcoming = computedReminders
      .filter(
        (reminder) =>
          !reminder.isOverdue && reminder.date >= currentDate && reminder.date <= futureDate
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Soonest first

    this.overdueReminders.set(overdue);
    this.upcomingReminders.set(upcoming);
  }

  markReminderComplete(applicationId: string) {
    console.log('Marking reminder complete for application ID:', applicationId);

    // Find and update the application to remove its reminder
    const allArrays = [
      this.appliedApplications,
      this.interviewApplications,
      this.offerApplications,
      this.rejectedApplications,
    ];

    for (const arraySignal of allArrays) {
      const applications = arraySignal();
      const targetApp = applications.find((app) => app.id === applicationId);

      if (targetApp) {
        console.log('Found application:', targetApp.company, '-', targetApp.position);

        const updatedApplications = applications.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                reminderDate: undefined,
                reminderType: undefined,
                reminderDescription: undefined,
              }
            : app
        );

        console.log('Updating applications array');
        arraySignal.set(updatedApplications);
        break;
      }
    }

    console.log('Updating reminders and stats');
    this.updateReminders();
    this.updateStats();
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

  isReminderUrgent(reminder: ComputedReminder): boolean {
    return reminder.isOverdue || reminder.daysUntilDue <= 2;
  }

  getReminderUrgencyClass(reminder: ComputedReminder): string {
    if (reminder.isOverdue) return 'overdue';
    if (reminder.daysUntilDue <= 2) return 'urgent';
    return '';
  }

  getReminderDateText(reminder: ComputedReminder): string {
    if (reminder.isOverdue) {
      const daysPast = Math.abs(reminder.daysUntilDue);
      return daysPast === 1 ? '1 day overdue' : `${daysPast} days overdue`;
    }

    if (reminder.daysUntilDue === 0) return 'Today';
    if (reminder.daysUntilDue === 1) return 'Tomorrow';
    return `In ${reminder.daysUntilDue} days`;
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
      this.updateReminders();
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
