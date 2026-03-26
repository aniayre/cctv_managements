import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class SettingsComponent implements OnInit {
  staffList: any[] = [];
  filteredStaff: any[] = [];
  searchText = '';
  pageTitle = 'Setting';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    const token = localStorage.getItem('token');

    this.api.getStaff().subscribe((data) => {
      this.staffList = data;
      this.filteredStaff = data;
    });
  }
  toggleStatus(staff: any) {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';

    const token = localStorage.getItem('token');
    this.api.updateStaffStatus(staff.id, newStatus).subscribe(() => {
      staff.status = newStatus;
    });
  }
  filterStaff() {
    this.filteredStaff = this.staffList.filter((staff) =>
      staff.name.toLowerCase().includes(this.searchText.toLowerCase()),
    );
  }
  viewStaff(staff: any) {
    console.log(staff);
  }
}
