import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './technician-dashboard.html',
  styleUrls: ['./technician-dashboard.css'],
})
export class TechnicianDashboard implements OnInit {
  user: any;

  jobs: any[] = [];
  filteredJobs: any[] = [];
  technicians: any[] = [];
  selectedTechnician = 'All';
  showViewModal = false;
  showActionModal = false;
  selectedJob: any = null;
  pageTitle = 'Technician';
  searchText = '';
  selectedStatus = 'All';

  constructor(private api: ApiService) {}

  ngOnInit() {
    const token = localStorage.getItem('token');

    if (token) {
      this.user = JSON.parse(atob(token.split('.')[1]));
    }
    if (this.user.designation === 'Admin') {
      this.loadTechnicians();
    }

    this.loadJobs();
  }

  getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  /* ---------------- LOAD JOBS ---------------- */

  loadJobs() {
    const techId = this.user.id;

    this.api.getTechnicianJobs(techId).subscribe((res) => {
      this.jobs = res;
      this.filterJobs();
    });
  }

  // load tech------//
  loadTechnicians() {
    this.api.getTechnicians().subscribe((res) => {
      this.technicians = res;
    });
  }

  /* ---------------- FILTER ---------------- */

  filterJobs() {
    this.filteredJobs = this.jobs.filter((job) => {
      const matchSearch = job.customer_name.toLowerCase().includes(this.searchText.toLowerCase());

      const matchStatus = this.selectedStatus === 'All' || job.job_status === this.selectedStatus;

      const matchTechnician =
        this.selectedTechnician === 'All' || job.technician_id == this.selectedTechnician;

      return matchSearch && matchStatus && matchTechnician;
    });
  }
  /* ---------------- VIEW ---------------- */

  viewJob(job: any) {
    this.selectedJob = { ...job };

    this.showViewModal = true;
  }

  /* ---------------- EDIT ---------------- */
  editJob(job: any) {
    this.selectedJob = { ...job };
    this.showActionModal = true;
  }
  closeModal() {
    this.showViewModal = false;
    this.showActionModal = false;
  }

  /* ---------------- UPDATE ---------------- */
  saveUpdate() {
    this.api
      .updateTechnicianJob(this.selectedJob.id, {
        job_status: this.selectedJob.job_status,
        payment_status: this.selectedJob.payment_status,
        payment_method: this.selectedJob.payment_method,
        amount: this.selectedJob.amount,
        remark: this.selectedJob.remark,
      })
      .subscribe(() => {
        this.closeModal();
        this.loadJobs();
      });
  }
  /* ---------------- SUMMARY ---------------- */

  get urgentCount() {
    return this.jobs.filter((j) => j.priority === 'High' && j.job_status !== 'Completed').length;
  }

  get completedCount() {
    return this.jobs.filter((j) => j.job_status === 'Completed').length;
  }

  get earnings() {
    return this.jobs
      .filter((j) => j.payment_status === 'Paid')
      .reduce((t, j) => t + Number(j.amount || 0), 0);
  }

  get pendingCount() {
    return this.jobs.filter((j) => j.job_status !== 'Completed').length;
  }
}
