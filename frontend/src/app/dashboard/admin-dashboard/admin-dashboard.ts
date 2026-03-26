import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit, OnDestroy {
  API_URL = 'http://192.168.0.100:3000';

  jobs: any[] = [];
  technicians: any[] = [];
  totalRevenue = 0;
  totalCustomers = 0;
  pendingAmount = 0;
  currentFilter = 'today';
  revenueChartData: any;
  jobStatusChartData: any;
  refreshInterval: any;
  isModalOpen = false;
  pageTitle = 'Dashboard';

  constructor(private api: ApiService) {}

  /* ==============================
     INIT
  ============================== */

  ngOnInit() {
    this.loadDashboard();

    // auto refresh every 30 sec
    this.refreshInterval = setInterval(() => {
      this.loadDashboard();
    }, 30000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
  }

  /* ==============================
     AUTH HEADER
  ============================== */

  getHeaders() {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Token missing');
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  /* ==============================
     LOAD DASHBOARD
  ============================== */

  loadDashboard() {
    forkJoin({
      jobs: this.api.getJobs(),
      technicians: this.api.getTechnicians(),
    }).subscribe((res) => {
      this.jobs = res.jobs;
      this.technicians = res.technicians;

      this.totalCustomers = this.jobs.length;

      this.totalRevenue = this.jobs
        .filter((j) => j.payment_status === 'Paid')
        .reduce((sum, j) => sum + Number(j.amount || 0), 0);

      this.pendingAmount = this.jobs
        .filter((j) => j.payment_status === 'Pending')
        .reduce((sum, j) => sum + Number(j.amount || 0), 0);

      this.setupCharts();
    });
  }

  /* ==============================
     FILTER
  ============================== */

  changeFilter(e: any) {
    this.currentFilter = e.target.value;
    this.setupCharts();
  }

  applyCustomDate(e: any) {
    const selectedDate = e.target.value;

    const filtered = this.jobs.filter((j) => j.created_at.includes(selectedDate));

    this.setupCharts(filtered);
  }

  /* ==============================
     MODAL
  ============================== */

  get pendingJobs() {
    return this.jobs.filter((j) => j.payment_status === 'Pending');
  }

  openPendingModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  /* ==============================
     CHART OPTIONS
  ============================== */

  chartOptions: any = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
  };

  /* ==============================
     CHART LOGIC
  ============================== */

  setupCharts(customData?: any[]) {
    let filtered = customData ? [...customData] : [...this.jobs];

    const today = new Date();

    if (this.currentFilter === 'today') {
      filtered = filtered.filter(
        (j) => new Date(j.created_at).toDateString() === today.toDateString(),
      );
    }

    if (this.currentFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      filtered = filtered.filter(
        (j) => new Date(j.created_at).toDateString() === yesterday.toDateString(),
      );
    }

    if (this.currentFilter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      filtered = filtered.filter((j) => new Date(j.created_at) >= weekAgo);
    }

    if (this.currentFilter === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);

      filtered = filtered.filter((j) => new Date(j.created_at) >= monthAgo);
    }

    /* REVENUE CHART */

    const revenueMap: any = {};

    filtered.forEach((j) => {
      if (j.payment_status === 'Paid') {
        const date = new Date(j.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        if (!revenueMap[date]) {
          revenueMap[date] = 0;
        }

        revenueMap[date] += Number(j.amount || 0);
      }
    });

    this.revenueChartData = {
      labels: Object.keys(revenueMap),
      datasets: [
        {
          label: 'Revenue',
          data: Object.values(revenueMap),
          backgroundColor: '#c9a227',
        },
      ],
    };

    /* JOB STATUS */

    const pending = filtered.filter((j) => j.job_status === 'Pending').length;
    const completed = filtered.filter((j) => j.job_status === 'Completed').length;

    this.jobStatusChartData = {
      labels: ['Pending', 'Completed'],
      datasets: [
        {
          data: [pending, completed],
          backgroundColor: ['#ffb347', '#2ecc71'],
        },
      ],
    };
  }
}
