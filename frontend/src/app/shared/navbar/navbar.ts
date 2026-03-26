import { Component, Input, HostListener, Output, EventEmitter, Inject } from '@angular/core';
import {  NgIf, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf,],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent {
  @Input() pageTitle: string = '';
  @Output() menuClick = new EventEmitter<void>();

  isProfileOpen = false;

  user: any = {
    name: '',
    email: '',
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storedUser = localStorage.getItem('user');

        if (storedUser && storedUser !== 'undefined') {
          this.user = JSON.parse(storedUser);
        } else {
          this.user = {
            name: '',
            email: '',
          };
        }
      } catch (error) {
        console.error('Invalid user data in localStorage');

        this.user = {
          name: '',
          email: '',
        };
      }
    }
  }

  getStars(count: number) {
    return new Array(count);
  }
  // 🔥 THIS is the correct way
  toggleMenu() {
    this.menuClick.emit();
  }

  toggleProfileMenu() {
    this.isProfileOpen = !this.isProfileOpen;
  }

  logout() {
    localStorage.clear();
    window.location.href = '/';
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: any) {
    if (!event.target.closest('.nav-right')) {
      this.isProfileOpen = false;
    }
  }
}
