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
        :key="employee.email"
        class="card"
      >
        <h3>{{ employee.name }}</h3>
        <p class="muted">{{ employee.role }}</p>
        <p><v-icon size="18">mdi-email-outline</v-icon>{{ employee.email }}</p>
        <p><v-icon size="18">mdi-phone-outline</v-icon>{{ employee.phone }}</p>
        <button class="ghost-button full" @click="availabilityDialog = true">
          View Availability
        </button>
      </article>
    </div>

    <div v-if="addEmployeeDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>Add Employee</h2>
          <button class="icon-inline" @click="addEmployeeDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>Name</label>
        <input type="text" placeholder="John Doe" />
        <label>Email</label>
        <input type="text" placeholder="john@example.com" />
        <label>Phone</label>
        <input type="text" placeholder="555-0101" />
        <label>Position</label>
        <input type="text" placeholder="Server" />
        <footer>
          <button class="ghost-button" @click="addEmployeeDialog = false">
            Cancel
          </button>
          <button class="primary-button" @click="addEmployeeDialog = false">
            Add Employee
          </button>
        </footer>
      </section>
    </div>

    <div v-if="availabilityDialog" class="overlay">
      <section class="modal narrow">
        <header>
          <h2>John Doe's Availability</h2>
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

        <h3>Time-Off Requests</h3>
        <article class="timeoff-row">
          <div>
            <strong>2026-02-01</strong>
            <p class="muted">Vacation</p>
          </div>
          <span class="status approved">approved</span>
        </article>
        <article class="timeoff-row">
          <div>
            <strong>2026-02-15</strong>
            <p class="muted">Doctor appointment</p>
          </div>
          <span class="status pending">pending</span>
        </article>
      </section>
    </div>
  </section>
</template>

<script>
export default {
  name: "EmployerEmployees",
  data() {
    return {
      employeeSearch: "",
      addEmployeeDialog: false,
      availabilityDialog: false,
      employees: [
        {
          name: "John Doe",
          role: "Server",
          email: "john@example.com",
          phone: "555-0101",
        },
        {
          name: "Jane Smith",
          role: "Cook",
          email: "jane@example.com",
          phone: "555-0102",
        },
        {
          name: "Bob Wilson",
          role: "Server",
          email: "bob@example.com",
          phone: "555-0103",
        },
        {
          name: "Alice Johnson",
          role: "Bartender",
          email: "alice@example.com",
          phone: "555-0104",
        },
        {
          name: "Mike Brown",
          role: "Host",
          email: "mike@example.com",
          phone: "555-0105",
        },
      ],
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

.full {
  width: 100%;
  justify-content: center;
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

.availability-row,
.timeoff-row {
  border: 1px solid #dce1ec;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status {
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 700;
}

.status.approved {
  background: #060828;
  color: #fff;
}

.status.pending {
  background: #eceff5;
  color: #293850;
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
