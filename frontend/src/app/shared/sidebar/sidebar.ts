import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {

  @Input() isOpen: boolean = false;
  role: string = '';

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}