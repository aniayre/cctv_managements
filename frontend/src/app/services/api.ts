import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // 🔥 CHANGE ONLY HERE WHEN IP CHANGES
  private BASE_URL = 'https://beige-quetzal-954424.hostingersite.com';

  constructor(private http: HttpClient) {}

  /* ==============================
     COMMON HEADER (TOKEN)
  ============================== */
  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  /* ==============================
     AUTH APIs
  ============================== */

  register(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/login`, data);
  }

  /* ==============================
     JOB APIs
  ============================== */

  getJobs(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/jobs`, this.getHeaders());
  }

  getTechnicianJobs(id: number): Observable<any> {
    return this.http.get(`${this.BASE_URL}/technician/jobs/${id}`, this.getHeaders());
  }

  createJob(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/jobs`, data, this.getHeaders());
  }

  updateJob(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/jobs/${id}`, data, this.getHeaders());
  }

  deleteJob(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/jobs/${id}`, this.getHeaders());
  }

  reassignJob(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/jobs/reassign/${id}`, data, this.getHeaders());
  }

  /* ==============================
     TECHNICIAN APIs
  ============================== */

  getTechnicians(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/technician-list`, this.getHeaders());
  }

  updateTechnicianJob(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/technician/jobs/${id}`, data, this.getHeaders());
  }

  /* ==============================
     STAFF APIs
  ============================== */

  getStaff(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/api/staff`, this.getHeaders());
  }

  updateStaffStatus(id: number, status: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/api/staff/${id}/status`, { status }, this.getHeaders());
  }
}
