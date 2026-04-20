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
      <div class="page-header">
        <h1>Dashboard</h1>
        <p class="page-sub">Business Areas & Organizational Hierarchy</p>
      </div>

      <div v-if="statsError" class="inline-error">{{ statsError }}</div>
      <div class="stats-grid">
        <div class="stat-card" v-for="s in statCards" :key="s.label">
          <p class="stat-label">{{ s.label }}</p>
          <p class="stat-value" :style="s.color ? { color: s.color } : {}">
            {{ statsLoading ? "—" : s.value }}
          </p>
        </div>
      </div>

      <div class="section-header">
        <div>
          <h2>Managed Areas</h2>
          <p class="page-sub">{{ filteredHierarchy.length }} Business Area(s) identified</p>
        </div>
        <button class="btn-primary" @click="openAdd">+ Add Employer</button>
      </div>

      <div class="filters">
        <input v-model="search" class="filter-input" type="text" placeholder="Search areas or business names…" />
      </div>

      <div v-if="usersError" class="inline-error">{{ usersError }}</div>

      <div v-if="usersLoading" class="table-empty">Loading organization data…</div>
      
      <div v-else-if="filteredHierarchy.length === 0" class="table-empty">
        No matching data found.
      </div>

      <div v-else v-for="area in filteredHierarchy" :key="area.AreaId" class="area-group">
        <div class="area-header">
          <div class="area-title">
            <span class="area-icon">📍</span>
            <h3>{{ area.Name }}</h3>
            <span class="badge">Area ID: {{ area.AreaId }}</span>
          </div>
        </div>

        <div v-if="area.employer" class="employer-section">
          <div class="employer-info">
            <div>
              <p class="biz-name">{{ area.employer.businessName }}</p>
              <p class="biz-owner">Owner: {{ area.employer.firstName }} {{ area.employer.lastName }}</p>
            </div>
            <div class="biz-contact">
              <p class="td-muted">{{ area.employer.email }}</p>
              <span class="pill pill-employer">Primary Employer</span>
            </div>
          </div>

          <div class="table-card mt-4">
            <table class="user-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Email</th>
                  <th>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="staff in area.employer.staff" :key="staff.EmployeeID">
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ initials(staff.firstName + ' ' + staff.lastName) }}</div>
                      <span class="user-name">{{ staff.firstName }} {{ staff.lastName }}</span>
                    </div>
                  </td>
                  <td class="td-muted">{{ staff.email }}</td>
                  <td class="td-muted font-mono">#{{ staff.EmployeeID }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="act-edit" @click="openEdit(staff)">Edit</button>
                      <button class="act-del" @click="askDelete(staff)">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!area.employer.staff?.length">
                  <td colspan="4" class="table-empty">No staff members currently assigned.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div v-else class="table-empty p-4">No employer assigned to this business area.</div>
      </div>
    </main>

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
      users: [], // This will now hold the nested BusinessArea data
      usersLoading: true,
      usersError: null,
      search: "",
    };
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser;
    },
    statCards() {
      return [
        { label: "Total Users",   value: this.stats.totalUsers ?? 0 },
        { label: "Employers",     value: this.stats.totalEmployers ?? 0 },
        { label: "Employees",     value: this.stats.totalEmployees ?? 0 },
        { label: "Business Areas",value: this.stats.totalAreas ?? 0 },
        { label: "System Status", value: "Online", color: "#22c55e" },
      ];
    },
    filteredHierarchy() {
      if (!this.search) return this.users;
      const q = this.search.toLowerCase();
      return this.users.filter(area => 
        area.Name?.toLowerCase().includes(q) || 
        area.employer?.businessName?.toLowerCase().includes(q)
      );
    },
  },
  async mounted() {
    await Promise.all([this.loadStats(), this.loadUsers()]);
  },
  methods: {
    async loadStats() {
      this.statsLoading = true;
      try {
        const { data } = await AdminServices.getStats();
        this.stats = data;
      } catch (err) {
        this.statsError = "Could not load stats.";
      } finally {
        this.statsLoading = false;
      }
    },
    async loadUsers() {
      this.usersLoading = true;
      try {
        const { data } = await AdminServices.getUsers();
        // data should be BusinessArea[] including Employers and Staff
        this.users = data;
      } catch (err) {
        this.usersError = "Could not load organization data.";
      } finally {
        this.usersLoading = false;
      }
    },
    initials(name = "") {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

/* --- Existing Styles --- */
.admin-page { display: flex; width: 100%; min-height: 100vh; background: #0e1117; font-family: 'DM Sans', sans-serif; color: #e2e8f0; }
.sidebar { width: 200px; flex-shrink: 0; background: #151b26; border-right: 1px solid #1e2a3a; display: flex; flex-direction: column; padding: 28px 16px 24px; }
.sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 8px; flex-grow: 1; }
.logo-mark { font-size: 22px; color: #3b82f6; }
.logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: #f1f5f9; }
.main { flex-grow: 1; padding: 40px 48px; overflow-x: auto; }

/* --- Hierarchy Styles --- */
.area-group { margin-bottom: 32px; background: #151b26; border: 1px solid #1e2a3a; border-radius: 12px; overflow: hidden; }
.area-header { background: #1e2a3a; padding: 16px 20px; border-bottom: 1px solid #2d3f55; }
.area-title { display: flex; align-items: center; gap: 12px; }
.area-title h3 { font-family: 'Syne', sans-serif; font-size: 18px; color: #f1f5f9; margin: 0; }
.badge { font-size: 10px; background: #0e1117; padding: 2px 8px; border-radius: 4px; color: #64748b; }

.employer-section { padding: 20px; }
.employer-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #1e2a3a; }
.biz-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #3b82f6; }
.biz-owner { font-size: 14px; color: #94a3b8; }
.biz-contact { text-align: right; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 48px; }
.stat-card { background: #151b26; border: 1px solid #1e2a3a; border-radius: 12px; padding: 22px 20px; }
.stat-label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
.stat-value { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 700; color: #f1f5f9; }

/* --- Table Styles --- */
.table-card { background: #0e1117; border: 1px solid #1e2a3a; border-radius: 8px; overflow: hidden; }
.user-table { width: 100%; border-collapse: collapse; }
.user-table th { padding: 12px 16px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; }
.user-table td { padding: 13px 16px; font-size: 14px; border-bottom: 1px solid #1a2332; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: #1e3a5f; color: #60a5fa; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }

.pill { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.pill-employer { background: #1a3a2a; color: #4ade80; }
.td-muted { color: #64748b; }
.row-actions { display: flex; gap: 8px; }
.act-edit { background: #1e3a5f; color: #60a5fa; border:none; padding: 5px 12px; border-radius: 4px; cursor:pointer;}
.act-del { background: #2d1a1a; color: #f87171; border:none; padding: 5px 12px; border-radius: 4px; cursor:pointer;}
.btn-primary { padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }

.table-empty { padding: 40px; text-align: center; color: #475569; }
.font-mono { font-family: monospace; }
</style>