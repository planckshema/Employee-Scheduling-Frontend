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
  background-color: #f4f7fa;
  font-family: 'Inter', sans-serif;
}

.sidebar {
  width: 260px;
  background-color: #1a2138;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: auto;
  font-weight: bold;
}

.logo-icon {
  font-size: 24px;
}

.logo-section h2 {
  font-size: 18px;
  margin: 0;
  letter-spacing: 0.5px;
}

.admin-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 15px;
  color: #94a3b8;
}

.nav-item {
  display: block;
  color: #a0aec0;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.nav-item:hover, .nav-item.active {
  background-color: #2d3748;
  color: white;
}

/* Main Content Styling */
.main-content {
  flex-grow: 1;
  padding: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.top-header h1 {
  font-size: 28px;
  color: #1a202c;
  margin: 0;
  letter-spacing: -0.03em;
}

.user-badge {
  background-color: #ebf4ff;
  color: #3182ce;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
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
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.stat-card h3 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #718096;
  text-transform: uppercase;
}

.stat-val {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #2d3748;
}

.status-ok {
  color: #48bb78;
}

.placeholder-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  text-align: center;
  color: #718096;
}

/* Logout Button */
.logout-btn {
  width: 100%;
  padding: 12px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background-color: #c53030;
}
</style>
