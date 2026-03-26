import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  name = '';
  email = '';
  phone = '';
  designation = '';
  password = '';
  confirmPassword = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  register() {
    if (!this.name || !this.email || !this.phone || !this.designation || !this.password) {
      alert('Please fill all fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.api
      .register({
        name: this.name,
        email: this.email,
        phone: this.phone,
        designation: this.designation,
        password: this.password,
      })
      .subscribe({
        next: (res: any) => {
          alert(res.message);
          this.router.navigate(['/']);
        },
        error: (err) => {
          alert(err.error.message);
        },
      });
  }
}
