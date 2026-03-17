<template>
  <section class="tab-content">
    <div class="schedule-toolbar">
      <div class="week-nav">
        <button class="icon-button">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>
        <strong>Week of Jan 26, 2026</strong>
        <button class="icon-button">
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
      </div>
      <div class="actions">
        <button class="ghost-button" @click="templateDialog = true">
          <v-icon size="18">mdi-content-copy</v-icon>
          Templates
        </button>
        <button class="primary-button" @click="newShiftDialog = true">
          <v-icon size="18">mdi-plus</v-icon>
          New Shift
        </button>
      </div>
    </div>

    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Mon<br />1/26</th>
            <th>Tue<br />1/27</th>
            <th>Wed<br />1/28</th>
            <th>Thu<br />1/29</th>
            <th>Fri<br />1/30</th>
            <th>Sat<br />1/31</th>
            <th>Sun<br />2/1</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee.name">
            <td class="employee-cell">{{ employee.name }}</td>
            <td>
              <div v-if="employee.mon" class="shift-pill">
                {{ employee.mon }}
              </div>
            </td>
            <td></td>
            <td>
              <div v-if="employee.wed" class="shift-pill">
                {{ employee.wed }}
              </div>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="newShiftDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>New Shift</h2>
          <button class="icon-inline" @click="newShiftDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>Employee</label>
        <select>
          <option>Select employee</option>
        </select>
        <label>Position</label>
        <input type="text" placeholder="e.g., Server, Cook" />
        <label>Date</label>
        <input type="text" placeholder="mm/dd/yyyy" />
        <div class="two-col">
          <div>
            <label>Start Time</label>
            <input type="text" placeholder="--:-- --" />
          </div>
          <div>
            <label>End Time</label>
            <input type="text" placeholder="--:-- --" />
          </div>
        </div>
        <label>Task List (Optional)</label>
        <select>
          <option>Select task list (optional)</option>
        </select>
        <footer>
          <button class="ghost-button" @click="newShiftDialog = false">
            Cancel
          </button>
          <button class="primary-button" @click="newShiftDialog = false">
            Save Shift
          </button>
        </footer>
      </section>
    </div>

    <div v-if="templateDialog" class="overlay">
      <section class="modal template-modal">
        <header>
          <h2>Schedule Templates</h2>
          <button class="icon-inline" @click="templateDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <nav class="template-tabs">
          <button
            :class="{ active: templateTab === 'load' }"
            @click="templateTab = 'load'"
          >
            <v-icon size="16">mdi-download</v-icon>
            Load Template
          </button>
          <button
            :class="{ active: templateTab === 'create' }"
            @click="templateTab = 'create'"
          >
            <v-icon size="16">mdi-plus</v-icon>
            Create Template
          </button>
          <button
            :class="{ active: templateTab === 'manage' }"
            @click="templateTab = 'manage'"
          >
            <v-icon size="16">mdi-pencil-outline</v-icon>
            Manage Templates
          </button>
        </nav>

        <div v-if="templateTab === 'load'">
          <p class="muted">Select a saved template to apply to any week</p>
          <article class="template-card">
            <h3>Weekend Rush</h3>
            <p class="muted">Extra staff for busy weekends</p>
            <div class="chips"><span>Sat</span><span>Sun</span></div>
            <small>4 shifts</small>
          </article>
          <article class="template-card">
            <h3>Weekday Standard</h3>
            <p class="muted">Regular Monday-Friday schedule</p>
            <div class="chips">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span
              ><span>Fri</span>
            </div>
            <small>5 shifts</small>
          </article>
          <footer>
            <button class="ghost-button" @click="templateDialog = false">
              Cancel
            </button>
            <button class="disabled-button">Apply Template</button>
          </footer>
        </div>

        <div v-if="templateTab === 'create'">
          <h3>Save Current Schedule as Template</h3>
          <p class="muted">
            Create a reusable template from your current week's schedule
          </p>
          <label>Template Name</label>
          <input
            type="text"
            placeholder="e.g., Weekend Rush, Holiday Schedule"
          />
          <label>Description (Optional)</label>
          <input
            type="text"
            placeholder="Brief description of when to use this template"
          />
          <button class="primary-button full">
            <v-icon size="18">mdi-content-save-outline</v-icon>Save as Template
          </button>
          <div class="tip">
            <strong>Tip:</strong> Templates save the pattern of shifts without
            specific dates, so you can apply them to any week in the future.
          </div>
          <footer>
            <button class="ghost-button" @click="templateDialog = false">
              Cancel
            </button>
          </footer>
        </div>

        <div v-if="templateTab === 'manage'">
          <p class="muted">View and manage your saved templates</p>
          <div class="scroll-block">
            <article class="template-card">
              <div class="card-top">
                <div>
                  <h3>Weekend Rush</h3>
                  <p class="muted">Extra staff for busy weekends</p>
                  <small>Created: 1/14/2026 - 4 shifts</small>
                </div>
                <button class="icon-inline danger">
                  <v-icon size="18">mdi-delete-outline</v-icon>
                </button>
              </div>
              <hr />
              <small>Template Preview:</small>
              <p class="preview-line">Sat - John Doe - Server - 10:00-18:00</p>
              <p class="preview-line">Sun - Jane Smith - Cook - 09:00-17:00</p>
            </article>

            <article class="template-card">
              <div class="card-top">
                <div>
                  <h3>Weekday Standard</h3>
                  <p class="muted">Regular Monday-Friday schedule</p>
                  <small>Created: 1/9/2026 - 5 shifts</small>
                </div>
                <button class="icon-inline danger">
                  <v-icon size="18">mdi-delete-outline</v-icon>
                </button>
              </div>
              <hr />
              <small>Template Preview:</small>
              <p class="preview-line">Mon - John Doe - Server - 09:00-17:00</p>
              <p class="preview-line">Thu - Jane Smith - Cook - 12:00-20:00</p>
            </article>
          </div>
          <footer>
            <button class="ghost-button" @click="templateDialog = false">
              Cancel
            </button>
          </footer>
        </div>
      </section>
    </div>
  </section>
</template>

<script>
export default {
  name: "EmployerSchedule",
  data() {
    return {
      templateTab: "load",
      newShiftDialog: false,
      templateDialog: false,
      employees: [
        {
          name: "John Doe",
          mon: "09:00 - 17:00\nServer",
          wed: "09:00 - 17:00\nServer",
        },
        {
          name: "Jane Smith",
          mon: "12:00 - 20:00\nCook",
          wed: "",
        },
        {
          name: "Bob Wilson",
          mon: "",
          wed: "",
        },
        {
          name: "Alice Johnson",
          mon: "",
          wed: "",
        },
        {
          name: "Mike Brown",
          mon: "",
          wed: "",
        },
      ],
    };
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

.schedule-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.actions,
.week-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-button,
.icon-inline {
  border: 1px solid #d5dae7;
  background: #fff;
  border-radius: 10px;
  width: 38px;
  height: 38px;
  cursor: pointer;
}

.icon-inline.danger {
  color: #e53935;
}

.ghost-button,
.primary-button,
.disabled-button {
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

.disabled-button {
  background: #9b9ba6;
  color: #fff;
  border-color: #9b9ba6;
}

.full {
  width: 100%;
  justify-content: center;
}

.schedule-table-wrap {
  border: 1px solid #d7dceb;
  border-radius: 14px;
  overflow-x: auto;
  background: #fff;
}

.schedule-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #dce1ec;
  padding: 12px;
  text-align: center;
  vertical-align: top;
}

.employee-cell {
  text-align: left;
  width: 180px;
}

.shift-pill {
  border: 1px solid #adcaf9;
  background: #d8e8ff;
  border-radius: 8px;
  padding: 8px;
  white-space: pre-line;
  text-align: left;
  color: #355ea5;
  font-weight: 600;
  min-height: 50px;
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

.template-modal {
  max-width: 760px;
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

.modal input,
.modal select {
  width: 100%;
  border: none;
  background: #f1f2f7;
  border-radius: 12px;
  min-height: 52px;
  padding: 11px 16px;
  outline: none;
  margin-bottom: 6px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.template-tabs {
  display: flex;
  gap: 5px;
  background: #ebeef5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 14px;
}

.template-tabs button {
  border: none;
  background: transparent;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
}

.template-tabs button.active {
  background: #fff;
}

.template-card {
  border: 1px solid #dde2ee;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.muted {
  color: #617089;
}

.chips {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.chips span {
  background: #dde7ff;
  color: #4f70b7;
  border-radius: 8px;
  padding: 3px 9px;
}

.tip {
  background: #e8f0ff;
  color: #51617a;
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
}

.scroll-block {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 6px;
}

.preview-line {
  margin-top: 3px;
  color: #525f79;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .schedule-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
