import { Component, signal, inject, effect } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  AddApplicationDialogComponent,
  AddApplicationDialogResult,
} from './components/add-application-dialog/add-application-dialog.component';

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
    MatDialogModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Inject dependencies using the inject() function
  private readonly dialog = inject(MatDialog);

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

  // Filtered applications based on search and status filters
  protected readonly filteredAppliedApplications = signal<JobApplication[]>([]);
  protected readonly filteredInterviewApplications = signal<JobApplication[]>([]);
  protected readonly filteredOfferApplications = signal<JobApplication[]>([]);
  protected readonly filteredRejectedApplications = signal<JobApplication[]>([]);

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

  // Initialize data on component creation using constructor pattern
  constructor() {
    // Initial setup
    this.updateReminders();
    this.updateStats();
    this.updateFilteredApplications();

    // Reactive effects to update computed values when source data changes
    effect(() => {
      // Watch all application arrays and update stats when they change
      this.appliedApplications();
      this.interviewApplications();
      this.offerApplications();
      this.rejectedApplications();
      this.updateStats();
    });

    effect(() => {
      // Watch all application arrays and update reminders when they change
      this.appliedApplications();
      this.interviewApplications();
      this.offerApplications();
      this.rejectedApplications();
      this.updateReminders();
    });

    effect(() => {
      // Watch search term, status filter, and application arrays for filtered updates
      this.searchTerm();
      this.selectedStatus();
      this.appliedApplications();
      this.interviewApplications();
      this.offerApplications();
      this.rejectedApplications();
      this.updateFilteredApplications();
    });
  }

  private getAllApplications(): JobApplication[] {
    return [
      ...this.appliedApplications(),
      ...this.interviewApplications(),
      ...this.offerApplications(),
      ...this.rejectedApplications(),
    ];
  }

  private updateFilteredApplications() {
    const searchTerm = this.searchTerm().toLowerCase().trim();
    const selectedStatus = this.selectedStatus();

    // Filter function
    const filterApplications = (applications: JobApplication[]): JobApplication[] => {
      return applications.filter((app) => {
        // Search filter - check company and position
        const matchesSearch =
          searchTerm === '' ||
          app.company.toLowerCase().includes(searchTerm) ||
          app.position.toLowerCase().includes(searchTerm);

        // Status filter
        const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;

        return matchesSearch && matchesStatus;
      });
    };

    // Apply filters to each status array
    this.filteredAppliedApplications.set(filterApplications(this.appliedApplications()));
    this.filteredInterviewApplications.set(filterApplications(this.interviewApplications()));
    this.filteredOfferApplications.set(filterApplications(this.offerApplications()));
    this.filteredRejectedApplications.set(filterApplications(this.rejectedApplications()));
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
    // Effects will automatically handle updates
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

  // Filter handling methods
  onSearchChange(value: string) {
    this.searchTerm.set(value);
    // Effect will automatically trigger updateFilteredApplications()
  }

  onStatusChange(status: ApplicationStatus | 'all') {
    this.selectedStatus.set(status);
    // Effect will automatically trigger updateFilteredApplications()
  }

  // Drag and drop handler for job applications
  drop(event: CdkDragDrop<JobApplication[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same column - work with original arrays
      const containerId = event.container.id;
      const originalArray = this.getOriginalArrayFromContainerId(containerId);

      // Find the actual indices in the original array
      const draggedItem = event.container.data[event.previousIndex];
      const actualPrevIndex = originalArray().findIndex(
        (app: JobApplication) => app.id === draggedItem.id
      );

      // For reordering, we need to find where to insert in the original array
      // This is complex with filtering, so for now we'll skip reordering when filters are active
      if (this.searchTerm() === '' && this.selectedStatus() === 'all') {
        moveItemInArray(originalArray(), actualPrevIndex, event.currentIndex);
        this.updateFilteredApplications();
      }
    } else {
      // Moving between columns - update the application status
      const application = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      const oldStatus = this.getStatusFromContainerId(event.previousContainer.id);

      // Remove from old array
      const oldArray = this.getOriginalArrayFromContainerId(event.previousContainer.id);
      const oldApplications = oldArray().filter((app: JobApplication) => app.id !== application.id);
      oldArray.set(oldApplications);

      // Update application status and add to new array
      const updatedApplication = { ...application, status: newStatus };
      const newArray = this.getOriginalArrayFromContainerId(event.container.id);
      const newApplications = [...newArray(), updatedApplication];
      newArray.set(newApplications);

      // Effects will automatically handle updates
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

  private getOriginalArrayFromContainerId(containerId: string) {
    switch (containerId) {
      case 'applied-list':
        return this.appliedApplications;
      case 'interview-list':
        return this.interviewApplications;
      case 'offer-list':
        return this.offerApplications;
      case 'rejected-list':
        return this.rejectedApplications;
      default:
        return this.appliedApplications;
    }
  }

  openAddApplicationDialog(): void {
    const dialogRef = this.dialog.open(AddApplicationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {},
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: AddApplicationDialogResult | undefined) => {
      if (result) {
        this.addNewApplication(result.application);
      }
    });
  }

  editApplication(application: JobApplication, event?: Event): void {
    // Prevent edit when dragging
    if (event && (event.target as HTMLElement).closest('.cdk-drag-preview')) {
      return;
    }

    const dialogRef = this.dialog.open(AddApplicationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { application },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: AddApplicationDialogResult | undefined) => {
      if (result) {
        this.updateExistingApplication(application.id, result.application);
      }
    });
  }

  private addNewApplication(application: Omit<JobApplication, 'id'>): void {
    const newApplication: JobApplication = {
      ...application,
      id: this.generateId(),
    };

    // Add to the appropriate status array
    switch (newApplication.status) {
      case 'applied':
        this.appliedApplications.update((apps) => [...apps, newApplication]);
        break;
      case 'interview':
        this.interviewApplications.update((apps) => [...apps, newApplication]);
        break;
      case 'offer':
        this.offerApplications.update((apps) => [...apps, newApplication]);
        break;
      case 'rejected':
        this.rejectedApplications.update((apps) => [...apps, newApplication]);
        break;
    }

    // Effects will automatically handle computed value updates
  }

  private updateExistingApplication(
    applicationId: string,
    updatedData: Omit<JobApplication, 'id'>
  ): void {
    const updatedApplication: JobApplication = {
      ...updatedData,
      id: applicationId,
    };

    // Find and remove from current array
    const allArrays = [
      this.appliedApplications,
      this.interviewApplications,
      this.offerApplications,
      this.rejectedApplications,
    ];

    for (const arraySignal of allArrays) {
      const applications = arraySignal();
      const index = applications.findIndex((app) => app.id === applicationId);

      if (index !== -1) {
        // Remove from current array
        const updatedApps = applications.filter((app) => app.id !== applicationId);
        arraySignal.set(updatedApps);
        break;
      }
    }

    // Add to the appropriate status array based on new status
    switch (updatedApplication.status) {
      case 'applied':
        this.appliedApplications.update((apps) => [...apps, updatedApplication]);
        break;
      case 'interview':
        this.interviewApplications.update((apps) => [...apps, updatedApplication]);
        break;
      case 'offer':
        this.offerApplications.update((apps) => [...apps, updatedApplication]);
        break;
      case 'rejected':
        this.rejectedApplications.update((apps) => [...apps, updatedApplication]);
        break;
    }

    // Effects will automatically handle computed value updates
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
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
