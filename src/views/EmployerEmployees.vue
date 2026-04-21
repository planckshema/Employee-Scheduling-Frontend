<template>
  <section class="tab-content">
    <div class="toolbar-row">
      <div class="search-box">
        <v-icon size="18">mdi-magnify</v-icon>
        <input
          v-model="employeeSearch"
          type="text"
          placeholder="Search employees..."
        />
      </div>
      <button class="primary-button" @click="addEmployeeDialog = true">
        <v-icon size="18">mdi-plus</v-icon>
        Add Employee
      </button>
    </div>

    <div class="cards-grid">
      <article
        v-for="employee in filteredEmployees"
        :key="employee.id"
        class="card"
      >
        <h3>{{ employee.name }}</h3>
        <p class="muted">{{ employee.role }}</p>
        <p><v-icon size="18">mdi-email-outline</v-icon>{{ employee.email }}</p>
        <p><v-icon size="18">mdi-phone-outline</v-icon>{{ employee.phone }}</p>

        <div class="card-actions">
          <button class="ghost-button view-btn" @click="openAvailability(employee)">
            View Availability
          </button>
          <button
            class="delete-icon-btn"
            title="Delete employee"
            @click="deleteEmployee(employee.id)"
          >
            <v-icon size="20" color="red">mdi-trash-can-outline</v-icon>
          </button>
        </div>
      </article>
    </div>

    <div v-if="addEmployeeDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>Add Employee</h2>
          <button class="icon-inline" @click="closeAddDialog">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>Name</label>
        <input v-model="newEmployee.name" type="text" placeholder="John Doe" />
        <label>Email</label>
        <input
          v-model="newEmployee.email"
          type="text"
          placeholder="john@example.com"
        />
        <label>Phone</label>
        <input v-model="newEmployee.phone" type="text" placeholder="555-0101" />
        <label>Position</label>
        <input v-model="newEmployee.role" type="text" placeholder="Server" />
        <footer>
          <button class="ghost-button" @click="closeAddDialog">Cancel</button>
          <button class="primary-button" @click="saveEmployee">
            Add Employee
          </button>
        </footer>
      </section>
    </div>

    <div v-if="availabilityDialog" class="overlay">
      <section class="modal narrow">
        <header>
          <h2>{{ selectedEmployee.name }}'s Availability</h2>
          <button class="icon-inline" @click="availabilityDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <h3>Weekly Availability</h3>
        <article
          v-for="day in availability"
          :key="day.day"
          class="availability-row"
        >
          <strong>{{ day.day }}</strong>
          <span>{{ day.time }}</span>
        </article>
      </section>
    </div>
  </section>
</template>

<script>
import SchedulerServices from "@/services/schedulerServices";

export default {
  name: "EmployerEmployees",
  data() {
    return {
      employeeSearch: "",
      addEmployeeDialog: false,
      availabilityDialog: false,
      selectedEmployee: { name: "Employee" },
      employees: [],
      newEmployee: {
        name: "",
        email: "",
        phone: "",
        role: "",
      },
      availability: [
        { day: "Monday", time: "09:00 - 17:00" },
        { day: "Tuesday", time: "09:00 - 17:00" },
        { day: "Wednesday", time: "09:00 - 17:00" },
        { day: "Thursday", time: "09:00 - 17:00" },
        { day: "Friday", time: "09:00 - 17:00" },
        { day: "Saturday", time: "Not available" },
        { day: "Sunday", time: "Not available" },
      ],
    };
  },
  computed: {
    filteredEmployees() {
      const term = this.employeeSearch.toLowerCase().trim();
      if (!term) {
        return this.employees;
      }

      return this.employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(term) ||
          employee.role.toLowerCase().includes(term) ||
          employee.email.toLowerCase().includes(term)
      );
    },
  },
  created() {
    this.fetchEmployees();
  },
  methods: {
    mapEmployee(row) {
      return {
        id: row.EmployeeID,
        name: `${row.firstName} ${row.lastName}`.trim(),
        role: "Employee",
        email: row.email,
        phone: row.phoneNum,
      };
    },
    fetchEmployees() {
      SchedulerServices.getEmployees()
        .then((response) => {
          this.employees = (response.data || []).map(this.mapEmployee);
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    closeAddDialog() {
      this.addEmployeeDialog = false;
      this.newEmployee = { name: "", email: "", phone: "", role: "" };
    },
   saveEmployee() {
  if (!this.newEmployee.name.trim() || !this.newEmployee.email.trim()) {
    return;
  }

  // 1. Get the current employer's user ID from your store
  const currentUserId = this.$store.getters.getLoginUserInfo?.userId;

  const nameParts = this.newEmployee.name.trim().split(/\s+/);
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ") || "Employee";

  // 2. Add the employerId (currentUserId) to the request
  const payload = {
    firstName,
    lastName,
    email: this.newEmployee.email.trim(),
    phoneNum: this.newEmployee.phone.trim(),
    userId: currentUserId // This allows the backend to find which Employer record to link
  };

  SchedulerServices.createEmployee(payload)
    .then(() => {
      this.closeAddDialog();
      this.fetchEmployees();
    })
    .catch((error) => {
      console.log("error", error);
    });
},
    deleteEmployee(id) {
      if (!id || !window.confirm("Delete this employee?")) {
        return;
      }

      SchedulerServices.deleteEmployee(id)
        .then(() => {
          this.fetchEmployees();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    openAvailability(employee) {
      this.selectedEmployee = employee;
      this.availabilityDialog = true;
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 24px;
}

h2 {
  margin: 0;
  font-size: 22px;
}

h3 {
  margin-bottom: 4px;
}

p {
  margin: 0;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #d9deea;
  border-radius: 12px;
  background: #f7f8fc;
  width: 100%;
  max-width: 420px;
  padding: 0 12px;
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  height: 44px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 14px;
}

.card {
  border: 1px solid #dce1ec;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.card p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.muted {
  color: #617089;
}

.icon-inline {
  border: 1px solid #d5dae7;
  background: #fff;
  border-radius: 10px;
  width: 38px;
  height: 38px;
  cursor: pointer;
}

.ghost-button,
.primary-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  border: 1px solid #d7dceb;
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-button {
  border-color: #080c28;
  background: #060828;
  color: #fff;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 27, 39, 0.48);
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  max-height: 94vh;
  overflow-y: auto;
}

.modal.narrow {
  max-width: 640px;
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal label {
  font-size: 20px;
  font-weight: 700;
  margin-top: 10px;
  margin-bottom: 6px;
  display: inline-block;
}

.modal input {
  width: 100%;
  border: none;
  background: #f1f2f7;
  border-radius: 12px;
  min-height: 52px;
  padding: 11px 16px;
  outline: none;
  margin-bottom: 6px;
}

.modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.availability-row {
  border: 1px solid #dce1ec;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}

.view-btn {
  flex-grow: 1;
  justify-content: center;
}

.delete-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff1f1;
  border: 1px solid #ffcccc;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  cursor: pointer;
}

.delete-icon-btn:hover {
  background: #ffe0e0;
  border-color: #ffb3b3;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
