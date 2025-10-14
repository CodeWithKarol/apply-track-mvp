import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { JobApplication, ApplicationStatus } from '../../app';

export interface AddApplicationDialogData {
  application?: JobApplication;
}

export interface AddApplicationDialogResult {
  application: Omit<JobApplication, 'id'>;
}

@Component({
  selector: 'app-add-application-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './add-application-dialog.component.html',
  styleUrls: ['./add-application-dialog.component.scss'],
})
export class AddApplicationDialogComponent {
  // Inject dependencies using the inject() function
  private readonly dialogRef = inject(MatDialogRef<AddApplicationDialogComponent>);
  public readonly data = inject<AddApplicationDialogData>(MAT_DIALOG_DATA);

  // Signals for reactive state management
  readonly isEditMode = signal<boolean>(!!this.data?.application);

  readonly statuses = signal<{ value: ApplicationStatus; label: string }[]>([
    { value: 'applied', label: 'Applied' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
  ]);

  readonly reminderTypes = signal([
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'interview', label: 'Interview' },
    { value: 'decision-deadline', label: 'Decision Deadline' },
  ]);

  // Reactive form using FormGroup with typed controls
  readonly applicationForm: FormGroup<{
    company: FormControl<string>;
    position: FormControl<string>;
    status: FormControl<ApplicationStatus>;
    dateApplied: FormControl<Date>;
    notes: FormControl<string>;
    reminderDate: FormControl<Date | null>;
    reminderType: FormControl<'follow-up' | 'interview' | 'decision-deadline'>;
    reminderDescription: FormControl<string>;
  }> = new FormGroup({
    company: new FormControl(this.data?.application?.company || '', {
      validators: [Validators.required, Validators.minLength(2)],
      nonNullable: true,
    }),
    position: new FormControl(this.data?.application?.position || '', {
      validators: [Validators.required, Validators.minLength(2)],
      nonNullable: true,
    }),
    status: new FormControl<ApplicationStatus>(this.data?.application?.status || 'applied', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    dateApplied: new FormControl(this.data?.application?.dateApplied || new Date(), {
      validators: [Validators.required],
      nonNullable: true,
    }),
    notes: new FormControl(this.data?.application?.notes || '', { nonNullable: true }),
    reminderDate: new FormControl<Date | null>(this.data?.application?.reminderDate || null),
    reminderType: new FormControl<'follow-up' | 'interview' | 'decision-deadline'>(
      this.data?.application?.reminderType || 'follow-up',
      { nonNullable: true }
    ),
    reminderDescription: new FormControl(this.data?.application?.reminderDescription || '', {
      nonNullable: true,
    }),
  });

  // Getters for form validation - using reactive forms instead of signals
  get isFormValid(): boolean {
    return this.applicationForm.valid;
  }

  get notesLength(): number {
    return this.applicationForm.controls.notes.value?.length || 0;
  }

  get reminderDescLength(): number {
    return this.applicationForm.controls.reminderDescription.value?.length || 0;
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
      const formValue = this.applicationForm.getRawValue();
      const result: AddApplicationDialogResult = {
        application: {
          company: formValue.company,
          position: formValue.position,
          status: formValue.status,
          dateApplied: formValue.dateApplied,
          notes: formValue.notes || undefined,
          reminderDate: formValue.reminderDate || undefined,
          reminderType: formValue.reminderType,
          reminderDescription: formValue.reminderDescription || undefined,
        },
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const field = this.applicationForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength']?.requiredLength || 0;
      return `${fieldName} must be at least ${requiredLength} characters`;
    }
    return '';
  }
}
