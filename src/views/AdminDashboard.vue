<template>
  <div class="admin-page">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-mark">⬡</span>
        <span class="logo-text">Admin</span>
      </div>
      <div class="sidebar-footer">
        <div class="admin-badge">
          <span class="admin-dot"></span>
          <span>{{ currentUser?.username || "Admin" }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <main class="main">
      <header class="page-header">
        <div>
          <h1>System Overview</h1>
          <p class="page-sub">Manage employers</p>
        </div>
        <button class="btn-primary" @click="openAddEmployer">+ Add Employer</button>
      </header>

      <section class="stats-grid stats-grid-single">
        <div class="stat-card">
          <p class="stat-label">ACTIVE EMPLOYERS</p>
          <div class="stat-flex">
            <p class="stat-value">{{ stats.totalEmployers || 0 }}</p>
            <span class="stat-icon">🏢</span>
          </div>
        </div>
      </section>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Filter by business name..." />
      </div>

      <div v-if="pageError" class="inline-error">{{ pageError }}</div>
      <div v-if="usersLoading" class="loading-msg">Loading...</div>

      <div class="organization-list">
        <div
          v-for="employer in filteredData"
          :key="employer.employerid"
          class="employer-card"
        >
          <div class="employer-header">
            <div class="biz-meta">
              <span class="biz-avatar">{{ (employer.businessName || "C")[0].toUpperCase() }}</span>
              <div>
                <h2 class="biz-name">{{ employer.businessName }}</h2>
                <p class="biz-owner">Owned by {{ employer.firstName }} {{ employer.lastName }}</p>
              </div>
            </div>

            <div class="biz-actions">
              <span class="email-pill">{{ employer.email }}</span>
              <button class="icon-btn" title="Edit employer" @click="openEditEmployer(employer)">⚙️</button>
              <button class="delete-link" @click="askDeleteEmployer(employer)">Delete</button>
            </div>
          </div>
        </div>

        <div v-if="!usersLoading && filteredData.length === 0" class="empty-msg-full">
          No employers found.
        </div>
      </div>
    </main>

    <div v-if="showAddEmployer" class="overlay" @click.self="showAddEmployer = false">
      <div class="modal">
        <div class="modal-head">
          <h2>Add Employer</h2>
          <button class="close-btn" @click="showAddEmployer = false">✕</button>
        </div>
        <div class="field">
          <label>First Name *</label>
          <input v-model="employerForm.firstName" type="text" placeholder="Jane" />
        </div>
        <div class="field">
          <label>Last Name *</label>
          <input v-model="employerForm.lastName" type="text" placeholder="Doe" />
        </div>
        <div class="field">
          <label>Email *</label>
          <input v-model="employerForm.email" type="email" placeholder="jane@business.com" />
        </div>
        <div class="field">
          <label>Business Name *</label>
          <input v-model="employerForm.businessName" type="text" placeholder="Acme Corp" />
        </div>
        <div class="field">
          <label>Location</label>
          <input v-model="employerForm.location" type="text" placeholder="City, State" />
        </div>
        <div v-if="modalError" class="inline-error">{{ modalError }}</div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showAddEmployer = false">Cancel</button>
          <button class="btn-primary" @click="submitAddEmployer" :disabled="submitting">
            {{ submitting ? "Saving…" : "Add Employer" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showEditEmployer" class="overlay" @click.self="showEditEmployer = false">
      <div class="modal">
        <div class="modal-head">
          <h2>Edit Employer</h2>
          <button class="close-btn" @click="showEditEmployer = false">✕</button>
        </div>
        <div class="field">
          <label>First Name *</label>
          <input v-model="employerForm.firstName" type="text" />
        </div>
        <div class="field">
          <label>Last Name *</label>
          <input v-model="employerForm.lastName" type="text" />
        </div>
        <div class="field">
          <label>Email *</label>
          <input v-model="employerForm.email" type="email" />
        </div>
        <div class="field">
          <label>Business Name *</label>
          <input v-model="employerForm.businessName" type="text" />
        </div>
        <div class="field">
          <label>Location</label>
          <input v-model="employerForm.location" type="text" />
        </div>
        <div v-if="modalError" class="inline-error">{{ modalError }}</div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showEditEmployer = false">Cancel</button>
          <button class="btn-primary" @click="submitEditEmployer" :disabled="submitting">
            {{ submitting ? "Saving…" : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteEmployer" class="overlay" @click.self="showDeleteEmployer = false">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h2>Delete Employer</h2>
          <button class="close-btn" @click="showDeleteEmployer = false">✕</button>
        </div>
        <p class="confirm-msg">
          Are you sure you want to delete <strong>{{ deleteEmployerTarget?.businessName }}</strong>?
          This cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showDeleteEmployer = false">Cancel</button>
          <button class="btn-danger" @click="confirmDeleteEmployer" :disabled="submitting">
            {{ submitting ? "Deleting…" : "Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdminServices from "@/services/adminServices";

export default {
  name: "AdminDashboard",
  data() {
    return {
      stats: {},
      users: [],
      searchQuery: "",
      usersLoading: true,
      pageError: null,
      showAddEmployer: false,
      showEditEmployer: false,
      editingEmployerId: null,
      employerForm: {
        firstName: "",
        lastName: "",
        email: "",
        businessName: "",
        location: "",
      },
      modalError: null,
      submitting: false,
      showDeleteEmployer: false,
      deleteEmployerTarget: null,
    };
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser;
    },
    filteredData() {
      if (!this.searchQuery) return this.users;
      const q = this.searchQuery.toLowerCase();
      return this.users.filter((u) =>
        (u.businessName || "").toLowerCase().includes(q),
      );
    },
  },
  async mounted() {
    await this.refreshData();
  },
  methods: {
    async refreshData() {
      this.usersLoading = true;
      this.pageError = null;
      try {
        const [sRes, uRes] = await Promise.all([
          AdminServices.getStats(),
          AdminServices.getUsers(),
        ]);
        this.stats = sRes.data;
        this.users = uRes.data;
      } catch (err) {
        this.pageError = err.response?.data?.message || "Could not load data.";
      } finally {
        this.usersLoading = false;
      }
    },

    openAddEmployer() {
      this.employerForm = {
        firstName: "",
        lastName: "",
        email: "",
        businessName: "",
        location: "",
      };
      this.modalError = null;
      this.showAddEmployer = true;
    },

    async submitAddEmployer() {
      const { firstName, lastName, email, businessName } = this.employerForm;
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !businessName.trim()) {
        this.modalError = "First name, last name, email, and business name are required.";
        return;
      }

      this.submitting = true;
      this.modalError = null;

      try {
        await AdminServices.createUser(this.employerForm);
        this.showAddEmployer = false;
        await this.refreshData();
      } catch (err) {
        this.modalError = err.response?.data?.message || "Could not add employer.";
      } finally {
        this.submitting = false;
      }
    },

    openEditEmployer(employer) {
      this.editingEmployerId = employer.employerid;
      this.employerForm = {
        firstName: employer.firstName || "",
        lastName: employer.lastName || "",
        email: employer.email || "",
        businessName: employer.businessName || "",
        location: employer.location || "",
      };
      this.modalError = null;
      this.showEditEmployer = true;
    },

    async submitEditEmployer() {
      const { firstName, lastName, email, businessName } = this.employerForm;
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !businessName.trim()) {
        this.modalError = "First name, last name, email, and business name are required.";
        return;
      }

      this.submitting = true;
      this.modalError = null;

      try {
        await AdminServices.updateUser(this.editingEmployerId, this.employerForm);
        this.showEditEmployer = false;
        await this.refreshData();
      } catch (err) {
        this.modalError = err.response?.data?.message || "Could not update employer.";
      } finally {
        this.submitting = false;
      }
    },

    askDeleteEmployer(employer) {
      this.deleteEmployerTarget = employer;
      this.showDeleteEmployer = true;
    },

    async confirmDeleteEmployer() {
      this.submitting = true;
      try {
        await AdminServices.deleteUser(this.deleteEmployerTarget.employerid);
        this.showDeleteEmployer = false;
        this.deleteEmployerTarget = null;
        await this.refreshData();
      } catch (err) {
        this.pageError = err.response?.data?.message || "Could not delete employer.";
        this.showDeleteEmployer = false;
      } finally {
        this.submitting = false;
      }
    },

    handleLogout() {
      this.$store.commit("setLoginUser", null);
      this.$router.push({ name: "login" });
    },
  },
};
</script>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
  background: #0b0e14;
  color: #fff;
  font-family: "Inter", sans-serif;
}

.sidebar {
  width: 220px;
  background: #0d1117;
  border-right: 1px solid #1e293b;
  padding: 25px;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: auto;
  font-weight: bold;
}

.logo-mark {
  color: #3b82f6;
  font-size: 20px;
}

.logo-text {
  font-size: 16px;
}

.sidebar-footer {
  border-top: 1px solid #1e293b;
  padding-top: 20px;
}

.admin-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 15px;
  color: #94a3b8;
}

.admin-dot {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
}

.logout-btn {
  width: 100%;
  background: #1c2128;
  border: 1px solid #30363d;
  color: #f85149;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.logout-btn:hover {
  background: #2d1a1a;
}

.main {
  flex: 1;
  padding: 40px 60px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 32px;
  margin: 0;
}

.page-sub {
  color: #8b949e;
  margin-top: 5px;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

.stats-grid-single {
  grid-template-columns: 1fr;
  max-width: 520px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
  padding: 25px;
  border-radius: 12px;
}

.stat-label {
  font-size: 11px;
  color: #8b949e;
  font-weight: 600;
  margin-bottom: 15px;
  letter-spacing: 0.06em;
}

.stat-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 42px;
  font-weight: bold;
  margin: 0;
}

.stat-icon {
  font-size: 28px;
}

.search-bar {
  background: #0d1117;
  border: 1px solid #30363d;
  padding: 14px 20px;
  border-radius: 10px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8b949e;
}

.search-bar input {
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  outline: none;
  font-size: 14px;
}

.employer-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  margin-bottom: 15px;
  overflow: hidden;
}

.employer-header {
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.biz-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.biz-avatar {
  width: 45px;
  height: 45px;
  background: #3b82f6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  flex-shrink: 0;
}

.biz-name {
  font-size: 18px;
  margin: 0;
}

.biz-owner {
  font-size: 13px;
  color: #8b949e;
  margin: 4px 0 0;
}

.biz-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.email-pill {
  background: #0d1117;
  border: 1px solid #30363d;
  color: #58a6ff;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: #21262d;
}

.delete-link {
  color: #f85149;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.delete-link:hover {
  background: #2d1a1a;
}

.loading-msg {
  text-align: center;
  color: #8b949e;
  padding: 40px;
}

.empty-msg-full {
  text-align: center;
  color: #8b949e;
  padding: 60px;
  font-style: italic;
}

.btn-primary {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 11px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 11px 20px;
  background: transparent;
  color: #8b949e;
  border: 1px solid #30363d;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:hover {
  background: #21262d;
  color: #fff;
}

.btn-danger {
  padding: 11px 20px;
  background: #b91c1c;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger:hover {
  background: #991b1b;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 14px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
}

.modal-sm {
  max-width: 400px;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.modal-head h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #8b949e;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: #21262d;
  color: #fff;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  padding: 10px 14px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.field input:focus {
  border-color: #3b82f6;
}

.confirm-msg {
  color: #94a3b8;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.confirm-msg strong {
  color: #fff;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}

.inline-error {
  padding: 12px 16px;
  background: #2d1a1a;
  border: 1px solid #7f1d1d;
  color: #f87171;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
