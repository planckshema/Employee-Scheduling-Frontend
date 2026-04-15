<template>
  <div class="admin-container">
    <aside class="sidebar">
      <div class="logo-section">
        <span class="logo-icon">🛡️</span>
        <h2>Admin Panel</h2>
      </div>
      <nav class="nav-menu">
        <a href="#" class="nav-item active">Dashboard</a>
        <a href="#" class="nav-item">Manage Users</a>
        <a href="#" class="nav-item">System Logs</a>
        <a href="#" class="nav-item">Settings</a>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <span class="icon">Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <h1>Welcome, System Admin</h1>
        <div class="user-badge">Admin Mode Active</div>
      </header>

      <section class="dashboard-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-val">1,284</p>
        </div>
        <div class="stat-card">
          <h3>Pending Approvals</h3>
          <p class="stat-val">12</p>
        </div>
        <div class="stat-card">
          <h3>System Status</h3>
          <p class="stat-val status-ok">Online</p>
        </div>
      </section>

      <section class="content-area">
        <div class="placeholder-card">
          <h3>Admin Overview</h3>
          <p>You are now authenticated. Use the sidebar to manage the scheduling system.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import Utils from "@/config/utils.js";

export default {
  name: "AdminDashboard",
  methods: {
    handleLogout() {
      // 1. Clear the store/state
      this.$store.commit("setLoginUser", null);

      // 2. Clear localStorage using your Utils helper
      Utils.removeItem("user");

      // 3. Redirect back to the standard login
      this.$router.push({ name: "login" });
    },
  },
};
</script>

<style scoped>
.admin-container {
  display: flex;
  min-height: 100vh;
  background-color: #f4f7fa;
  font-family: 'Inter', sans-serif;
}

/* Sidebar Styling */
.sidebar {
  width: 260px;
  background-color: #1a2138;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 24px;
}

.logo-section h2 {
  font-size: 18px;
  margin: 0;
  letter-spacing: 0.5px;
}

.nav-menu {
  flex-grow: 1;
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

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.top-header h1 {
  font-size: 28px;
  color: #1a202c;
  margin: 0;
}

.user-badge {
  background-color: #ebf4ff;
  color: #3182ce;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
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