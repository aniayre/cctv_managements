import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { SidebarComponent } from '../../shared/sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css'],
})
export class MainLayoutComponent {
  pageTitle = '';
  isSidebarOpen = false;

  // 🔥 Update page title from child route
  onActivate(component: any) {
    setTimeout(() => {
      this.pageTitle = component.pageTitle || '';
    });
  }

  // 🔥 Toggle sidebar
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // 🔥 Close sidebar manually
  closeSidebar() {
    this.isSidebarOpen = false;
  }

  // 🔥 Close sidebar when clicking outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (this.isSidebarOpen && !target.closest('.sidebar') && !target.closest('.menu-btn')) {
      this.isSidebarOpen = false;
    }
  }
}
