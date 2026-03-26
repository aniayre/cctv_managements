import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operator-dashboard.html',
  styleUrls: ['./operator-dashboard.css'],
})
export class OperatorDashboard implements OnInit {
  showModal = false;
  showViewModal = false;
  showReassignModal = false;
  jobs: any[] = [];
  technicians: any[] = [];
  filterType = 'All';
  searchText = '';
  selectedJob: any = null;
  selectedTechnicianId: any = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 10;
  pageTitle = 'Operator';
  isSaving = false;
  editMode = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadJobs();
    this.loadTechnicians();
  }

  /* ---------------- AUTH HEADER ---------------- */

  getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  onlyNumber(event: any) {
    const charCode = event.which ? event.which : event.keyCode;

    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  /* ---------------- LOAD JOBS ---------------- */

  loadJobs(): void {
    this.api.getJobs().subscribe({
      next: (res) => {
        this.jobs = Array.isArray(res) ? res : [];

        this.jobs.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      },
      error: (err) => console.error(err),
    });
  }

  updateJob() {
    const payload = {
      customer_name: this.selectedJob.customer_name,
      mobile: this.selectedJob.mobile,
      location: this.selectedJob.location,
      issue: this.selectedJob.issue,
      technician_id: this.selectedJob.technician_id,
      priority: this.selectedJob.priority,
      remark: this.selectedJob.remark,
    };

    this.api.updateJob(this.selectedJob.id, payload).subscribe({
      next: () => {
        alert('Job Updated Successfully');
        this.editMode = false;
        this.loadJobs();
        this.closeViewModal();
      },
      error: (err) => console.error(err),
    });
  }
  get tableHeading(): string {
    switch (this.filterType) {
      case 'Pending':
        return 'Pending Jobs';
      case 'Completed':
        return 'Completed Jobs';
      case 'PaymentPending':
        return 'Pending Payment Jobs';
      default:
        return 'All Customers';
    }
  }
  /* ---------------- TECHNICIANS ---------------- */

  loadTechnicians() {
    this.api.getTechnicians().subscribe({
      next: (data) => {
        this.technicians = data;
      },
      error: (err) => console.error(err),
    });
  }

  /* ---------------- FILTER ---------------- */

  setFilter(type: string) {
    this.filterType = type;
    this.currentPage = 1;
  }

  filteredJobs(): any[] {
    let filtered = this.jobs;

    if (this.filterType === 'Pending') {
      filtered = filtered.filter((j) => j.job_status === 'Pending');
    }

    if (this.filterType === 'Completed') {
      filtered = filtered.filter((j) => j.job_status === 'Completed');
    }

    if (this.filterType === 'PaymentPending') {
      filtered = filtered.filter((j) => j.payment_status === 'Pending');
    }

    if (this.searchText) {
      const text = this.searchText.toLowerCase();

      filtered = filtered.filter(
        (job) =>
          (job.customer_name || '').toLowerCase().includes(text) ||
          (job.location || '').toLowerCase().includes(text),
      );
    }

    return filtered;
  }

  /* ---------------- SORT COLUMN ---------------- */
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.jobs.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (valA === null) valA = '';
      if (valB === null) valB = '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;

      return 0;
    });
  }

  //Delete function////
  deleteJob(id: number) {
    if (!confirm('Are you sure you want to delete this job?')) return;

    this.api.getTechnicians().subscribe({
      next: (data) => {
        this.technicians = data;
      },
      error: (err) => console.error(err),
    });
  }

  /* ---------------- PAGINATION ---------------- */

  paginatedJobs(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredJobs().slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredJobs().length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  /* ---------------- JOB SUMMARY ---------------- */

  get pendingJobs() {
    return this.jobs.filter((j) => j.job_status === 'Pending').length;
  }

  get completedJobs() {
    return this.jobs.filter((j) => j.job_status === 'Completed').length;
  }

  get pendingPayment() {
    return this.jobs.filter((j) => j.payment_status === 'Pending').length;
  }

  get totalCollection() {
    return this.jobs
      .filter((j) => j.payment_status === 'Paid')
      .reduce((t, j) => t + Number(j.amount || 0), 0);
  }

  /* ---------------- ADD JOB ---------------- */

  currentJob: any = this.getEmptyJob();

  openModal() {
    this.currentJob = this.getEmptyJob();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveJob(form: any) {
    if (form.invalid || this.isSaving) return;

    this.isSaving = true;

    this.api.createJob(this.currentJob).subscribe({
      next: () => {
        this.loadJobs();
        this.closeModal();
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  private getEmptyJob() {
    return {
      customer_name: '',
      mobile: '',
      location: '',
      issue: '',
      technician_id: '',
      priority: 'Medium',
      amount: 0,
      remark: '',
      job_status: 'Pending',
      payment_status: 'Pending',
      assigned_date: new Date(),
    };
  }

  /* ---------------- VIEW JOB ---------------- */

  openViewModal(job: any) {
    this.selectedJob = { ...job }; // copy object
    this.editMode = false;
    this.showViewModal = true;
  }
  closeViewModal() {
    this.showViewModal = false;
  }
  /* ---------------- REASSIGN ---------------- */

  openReassignModal(job: any) {
    this.selectedJob = job;
    this.selectedTechnicianId = '';
    this.showReassignModal = true;
  }

  closeReassignModal() {
    this.showReassignModal = false;
  }

  confirmReassign() {
    if (!this.selectedTechnicianId) return;

    this.api
      .reassignJob(this.selectedJob.id, {
        technician_id: this.selectedTechnicianId,
        issue: this.selectedJob.issue,
      })
      .subscribe({
        next: () => {
          this.loadJobs();
          this.closeReassignModal();
        },
        error: (err) => console.error(err),
      });
  }
  exportToExcel(): void {
    const exportData = this.filteredJobs().map((job) => ({
      Date: job.assigned_date,
      Customer: job.customer_name,
      Mobile: job.mobile,
      Location: job.location,
      Technician: job.technician_name,
      Status: job.job_status,
      Payment: job.payment_status,
      Amount: job.amount,
      Priority: job.priority,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { Jobs: worksheet },
      SheetNames: ['Jobs'],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    saveAs(data, `Jobs_${new Date().getTime()}.xlsx`);
  }
}
