import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  applicationForm: FormGroup;
  isEditMode: boolean;

  readonly statuses: { value: ApplicationStatus; label: string }[] = [
    { value: 'applied', label: 'Applied' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
  ];

  readonly reminderTypes = [
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'interview', label: 'Interview' },
    { value: 'decision-deadline', label: 'Decision Deadline' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddApplicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddApplicationDialogData
  ) {
    this.isEditMode = !!data?.application;

    this.applicationForm = this.fb.group({
      company: [data?.application?.company || '', [Validators.required, Validators.minLength(2)]],
      position: [data?.application?.position || '', [Validators.required, Validators.minLength(2)]],
      status: [data?.application?.status || 'applied', Validators.required],
      dateApplied: [data?.application?.dateApplied || new Date(), Validators.required],
      notes: [data?.application?.notes || ''],
      reminderDate: [data?.application?.reminderDate || null],
      reminderType: [data?.application?.reminderType || 'follow-up'],
      reminderDescription: [data?.application?.reminderDescription || ''],
    });
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
      const formValue = this.applicationForm.value;
      const result: AddApplicationDialogResult = {
        application: {
          company: formValue.company,
          position: formValue.position,
          status: formValue.status,
          dateApplied: formValue.dateApplied,
          notes: formValue.notes,
          reminderDate: formValue.reminderDate,
          reminderType: formValue.reminderType,
          reminderDescription: formValue.reminderDescription,
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
      return `${fieldName} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
