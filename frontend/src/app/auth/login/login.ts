import { Component, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.loginForm = this.fb.group({
      emailOrPhone: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.submitted = true;
    if (this.loginForm.invalid) return;

    this.api.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.designation);
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('user', JSON.stringify(res.user));
        }

        // redirect based on role
        this.redirectUser(res.designation);
      },
      error: (err) => {
        alert(err?.error?.message || 'Login failed');
      },
    });
  }
  redirectUser(role: string) {
    if (role === 'Admin') {
      this.router.navigate(['/dashboard/admin']);
    } else if (role === 'Operator') {
      this.router.navigate(['/dashboard/operator']);
    } else if (role === 'Technician') {
      this.router.navigate(['/dashboard/technician']);
    }
  }
}
