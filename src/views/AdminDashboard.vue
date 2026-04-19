<template>
  <div class="admin-page">

    <!-- ── Sidebar ────────────────────────────────────────────────── -->
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

    <!-- ── Main ───────────────────────────────────────────────────── -->
    <main class="main">

      <!-- Page Header -->
      <div class="page-header">
        <h1>Dashboard</h1>
        <p class="page-sub">System overview &amp; user management</p>
      </div>

      <!-- Stats -->
      <div v-if="statsError" class="inline-error">{{ statsError }}</div>
      <div class="stats-grid">
        <div class="stat-card" v-for="s in statCards" :key="s.label">
          <p class="stat-label">{{ s.label }}</p>
          <p class="stat-value" :style="s.color ? { color: s.color } : {}">
            {{ statsLoading ? "—" : s.value }}
          </p>
        </div>
      </div>

      <!-- Users Section -->
      <div class="section-header">
        <div>
          <h2>Users</h2>
          <p class="page-sub">{{ filteredUsers.length }} user{{ filteredUsers.length !== 1 ? "s" : "" }}</p>
        </div>
        <button class="btn-primary" @click="openAdd">+ Add User</button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input v-model="search" class="filter-input" type="text" placeholder="Search name or email…" />
        <select v-model="filterRole" class="filter-select">
          <option value="">All Roles</option>
          <option value="employer">Employer</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div v-if="usersError" class="inline-error">{{ usersError }}</div>

      <!-- Table -->
      <div class="table-card">
        <div v-if="usersLoading" class="table-empty">Loading users…</div>
        <table v-else class="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Employees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="table-empty">No users found.</td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ initials(user.name) }}</div>
                  <span class="user-name">{{ user.name }}</span>
                </div>
              </td>
              <td class="td-muted">{{ user.email }}</td>
              <td><span :class="['pill', 'pill-' + user.role]">{{ user.role }}</span></td>
              <td><span :class="['pill', 'pill-' + user.status]">{{ user.status }}</span></td>
              <td class="td-muted">{{ user.employeeCount ?? user.employees?.length ?? "—" }}</td>
              <td>
                <div class="row-actions">
                  <button class="act-edit" @click="openEdit(user)">Edit</button>
                  <button class="act-del" @click="askDelete(user)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </main>

    <!-- ── Add / Edit Modal ───────────────────────────────────────── -->
    <div v-if="showForm" class="overlay" @click.self="closeForm">
      <div class="modal">
        <h2>{{ editing ? "Edit User" : "Add User" }}</h2>
        <div class="field">
          <label>Full Name *</label>
          <input v-model="form.name" type="text" placeholder="Jane Doe" />
          <span v-if="fe.name" class="field-err">{{ fe.name }}</span>
        </div>
        <div class="field">
          <label>Email *</label>
          <input v-model="form.email" type="email" placeholder="jane@example.com" />
          <span v-if="fe.email" class="field-err">{{ fe.email }}</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Role</label>
            <select v-model="form.role">
              <option value="employee">Employee</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="field">
            <label>Status</label>
            <select v-model="form.status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div v-if="formError" class="inline-error">{{ formError }}</div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="closeForm">Cancel</button>
          <button class="btn-primary" @click="submitForm" :disabled="submitting">
            {{ submitting ? "Saving…" : (editing ? "Save Changes" : "Create User") }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirm ─────────────────────────────────────────── -->
    <div v-if="showDelete" class="overlay" @click.self="showDelete = false">
      <div class="modal modal-sm">
        <h2>Delete User</h2>
        <p class="modal-body">
          Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>? This cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showDelete = false">Cancel</button>
          <button class="btn-danger" @click="confirmDelete" :disabled="submitting">
            {{ submitting ? "Deleting…" : "Delete" }}
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
      statsLoading: true,
      statsError: null,
      users: [],
      usersLoading: true,
      usersError: null,
      search: "",
      filterRole: "",
      filterStatus: "",
      showForm: false,
      editing: false,
      editingId: null,
      form: { name: "", email: "", role: "employee", status: "active" },
      fe: {},
      formError: null,
      submitting: false,
      showDelete: false,
      deleteTarget: null,
    };
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser;
    },
    statCards() {
      return [
        { label: "Total Users",   value: this.stats.totalUsers     ?? 0 },
        { label: "Active Users",  value: this.stats.activeUsers    ?? 0 },
        { label: "Employers",     value: this.stats.totalEmployers ?? 0 },
        { label: "Employees",     value: this.stats.totalEmployees ?? 0 },
        { label: "System Status", value: this.stats.systemStatus   ?? "—", color: "#22c55e" },
      ];
    },
    filteredUsers() {
      return this.users.filter((u) => {
        const q = this.search.toLowerCase();
        const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        const matchRole   = !this.filterRole   || u.role   === this.filterRole;
        const matchStatus = !this.filterStatus || u.status === this.filterStatus;
        return matchSearch && matchRole && matchStatus;
      });
    },
  },
  async mounted() {
    await Promise.all([this.loadStats(), this.loadUsers()]);
  },
  methods: {
    async loadStats() {
      this.statsLoading = true;
      this.statsError = null;
      try {
        const { data } = await AdminServices.getStats();
        this.stats = data;
      } catch (err) {
        this.statsError = err.response?.data?.message || "Could not load stats.";
      } finally {
        this.statsLoading = false;
      }
    },
    async loadUsers() {
      this.usersLoading = true;
      this.usersError = null;
      try {
        const { data } = await AdminServices.getUsers();
        this.users = data;
      } catch (err) {
        this.usersError = err.response?.data?.message || "Could not load users.";
      } finally {
        this.usersLoading = false;
      }
    },
    initials(name = "") {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    },
    openAdd() {
      this.editing = false;
      this.editingId = null;
      this.form = { name: "", email: "", role: "employee", status: "active" };
      this.fe = {};
      this.formError = null;
      this.showForm = true;
    },
    openEdit(user) {
      this.editing = true;
      this.editingId = user.id;
      this.form = { name: user.name, email: user.email, role: user.role, status: user.status };
      this.fe = {};
      this.formError = null;
      this.showForm = true;
    },
    closeForm() { this.showForm = false; },
    validate() {
      this.fe = {};
      if (!this.form.name.trim()) this.fe.name = "Name is required.";
      if (!this.form.email.trim()) this.fe.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) this.fe.email = "Enter a valid email.";
      return Object.keys(this.fe).length === 0;
    },
    async submitForm() {
      if (!this.validate()) return;
      this.submitting = true;
      this.formError = null;
      try {
        if (this.editing) {
          await AdminServices.updateUser(this.editingId, this.form);
        } else {
          await AdminServices.createUser(this.form);
        }
        this.closeForm();
        await Promise.all([this.loadUsers(), this.loadStats()]);
      } catch (err) {
        this.formError = err.response?.data?.message || "Something went wrong.";
      } finally {
        this.submitting = false;
      }
    },
    askDelete(user) {
      this.deleteTarget = user;
      this.showDelete = true;
    },
    async confirmDelete() {
      this.submitting = true;
      try {
        await AdminServices.deleteUser(this.deleteTarget.id);
        this.showDelete = false;
        this.deleteTarget = null;
        await Promise.all([this.loadUsers(), this.loadStats()]);
      } catch (err) {
        this.usersError = err.response?.data?.message || "Could not delete user.";
        this.showDelete = false;
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

:deep(.v-main) { padding: 0 !important; }
:deep(.v-main__wrap) { display: flex; }

.admin-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #0e1117;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #151b26;
  border-right: 1px solid #1e2a3a;
  display: flex;
  flex-direction: column;
  padding: 28px 16px 24px;
}

.sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 8px; flex-grow: 1; }
.logo-mark { font-size: 22px; color: #3b82f6; line-height: 1; }
.logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: #f1f5f9; letter-spacing: 0.04em; }

.sidebar-footer { border-top: 1px solid #1e2a3a; padding-top: 16px; }

.admin-badge { display: flex; align-items: center; gap: 8px; padding: 0 8px; margin-bottom: 10px; font-size: 13px; color: #94a3b8; }
.admin-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

.logout-btn {
  width: 100%; padding: 9px; border: 1px solid #2d3f55; border-radius: 8px;
  background: transparent; color: #64748b; font-family: 'DM Sans', sans-serif;
  font-size: 13px; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.logout-btn:hover { background: #1e2a3a; color: #cbd5e1; }

.main { flex-grow: 1; padding: 40px 48px; overflow-x: auto; }

.page-header { margin-bottom: 28px; }

h1 { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
.page-sub { font-size: 14px; color: #64748b; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}

.stat-card { background: #151b26; border: 1px solid #1e2a3a; border-radius: 12px; padding: 22px 20px; }
.stat-label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
.stat-value { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 700; color: #f1f5f9; }

.section-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }

.filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

.filter-input {
  flex: 1; min-width: 200px; padding: 9px 14px; background: #151b26;
  border: 1px solid #1e2a3a; border-radius: 8px; color: #e2e8f0;
  font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s;
}
.filter-input::placeholder { color: #475569; }
.filter-input:focus { border-color: #3b82f6; }

.filter-select {
  padding: 9px 14px; background: #151b26; border: 1px solid #1e2a3a;
  border-radius: 8px; color: #e2e8f0; font-family: 'DM Sans', sans-serif;
  font-size: 14px; outline: none; cursor: pointer;
}

.table-card { background: #151b26; border: 1px solid #1e2a3a; border-radius: 12px; overflow: hidden; }
.user-table { width: 100%; border-collapse: collapse; }
.user-table thead tr { border-bottom: 1px solid #1e2a3a; }
.user-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
.user-table td { padding: 13px 16px; font-size: 14px; border-bottom: 1px solid #1a2332; }
.user-table tbody tr:last-child td { border-bottom: none; }
.user-table tbody tr:hover { background: #1a2332; }
.td-muted { color: #64748b; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: #1e3a5f; color: #60a5fa; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.user-name { color: #e2e8f0; font-weight: 500; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
.pill-admin    { background: #2d1f4e; color: #a78bfa; }
.pill-employer { background: #1a3a2a; color: #4ade80; }
.pill-employee { background: #1e2d4e; color: #60a5fa; }
.pill-active   { background: #14291a; color: #22c55e; }
.pill-inactive { background: #2d1a1a; color: #f87171; }

.row-actions { display: flex; gap: 8px; }
.act-edit, .act-del { padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
.act-edit { background: #1e3a5f; color: #60a5fa; }
.act-edit:hover { opacity: 0.8; }
.act-del  { background: #2d1a1a; color: #f87171; }
.act-del:hover { opacity: 0.8; }

.btn-primary { padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ghost { padding: 10px 20px; background: transparent; color: #64748b; border: 1px solid #2d3f55; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-ghost:hover { background: #1e2a3a; color: #cbd5e1; }

.btn-danger { padding: 10px 20px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }

.modal { background: #151b26; border: 1px solid #1e2a3a; border-radius: 16px; padding: 32px; width: 100%; max-width: 460px; }
.modal-sm { max-width: 380px; }
.modal h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 24px; }
.modal-body { font-size: 15px; color: #94a3b8; margin-bottom: 4px; line-height: 1.6; }
.modal-body strong { color: #f1f5f9; }

.field { margin-bottom: 16px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field label { display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.field input, .field select { width: 100%; padding: 10px 14px; background: #0e1117; border: 1px solid #1e2a3a; border-radius: 8px; color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.field input:focus, .field select:focus { border-color: #3b82f6; }
.field-err { display: block; margin-top: 4px; font-size: 12px; color: #f87171; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }

.inline-error { padding: 12px 16px; background: #2d1a1a; border: 1px solid #7f1d1d; color: #f87171; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
.table-empty { padding: 60px; text-align: center; color: #475569; font-size: 14px; }
</style>