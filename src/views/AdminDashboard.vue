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
          <p class="page-sub">Management of all businesses and personnel</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openModal('add')">+ Add Employer</button>
        </div>
      </header>

      <section class="stats-grid">
        <div class="stat-card" v-for="s in statCards" :key="s.label">
          <p class="stat-label">{{ s.label }}</p>
          <div class="stat-flex">
            <p class="stat-value">{{ statsLoading ? "—" : s.value }}</p>
            <span class="stat-icon">{{ s.icon }}</span>
          </div>
        </div>
      </section>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Filter by business name, owner, or staff email..." />
      </div>

      <div v-if="usersLoading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else class="organization-list">
        <div v-for="employer in filteredData" :key="employer.employerid" class="employer-block">
          <div class="employer-info-bar">
            <div class="biz-meta">
              <span class="biz-initials">{{ (employer.businessName || 'B')[0] }}</span>
              <div>
                <h2 class="biz-name">{{ employer.businessName }}</h2>
                <p class="biz-owner">Owned by {{ employer.firstName }} {{ employer.lastName }}</p>
                <small style="color: #64748b;">📍 {{ employer.location }}</small>
              </div>
            </div>
            <div class="biz-contact">
              <span class="contact-pill">{{ employer.email }}</span>
              <button class="edit-icon-btn" @click="openModal('edit', employer)">⚙️</button>
              <button class="btn-text-del" style="margin-left: 10px;" @click="confirmDelete('employer', employer)">Delete</button>
            </div>
          </div>

          <div class="staff-container">
            <div class="staff-header">
              <h3>Staff</h3>
              <span class="staff-count">{{ employer.staff?.length || 0 }} Employees</span>
            </div>
            <table class="staff-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Contact</th>
                  <th>ID</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="staff in employer.staff" :key="staff.EmployeeID">
                  <td>{{ staff.firstName }} {{ staff.lastName }}</td>
                  <td class="email-cell">{{ staff.email }}</td>
                  <td class="id-cell">#{{ staff.EmployeeID }}</td>
                  <td class="text-right">
                    <button class="btn-text-del" @click="confirmDelete('staff', staff)">Remove</button>
                  </td>
                </tr>
                <tr v-if="!employer.staff?.length">
                  <td colspan="4" class="empty-msg">No employees assigned to this employer.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button class="close-x" @click="closeModal">&times;</button>
        </div>
        
        <div v-if="modalMode !== 'delete'" class="modal-body">
          <div class="input-group">
            <label>Business Name</label>
            <input v-model="form.businessName" type="text" placeholder="e.g. Campus Coffee Beans" />
          </div>
          <div class="input-row">
            <div class="input-group">
              <label>Owner First Name</label>
              <input v-model="form.firstName" type="text" placeholder="First Name" />
            </div>
            <div class="input-group">
              <label>Owner Last Name</label>
              <input v-model="form.lastName" type="text" placeholder="Last Name" />
            </div>
          </div>
          <div class="input-group">
            <label>Business Email</label>
            <input v-model="form.email" type="email" placeholder="email@example.com" />
          </div>
          <div class="input-group">
            <label>Location</label>
            <input v-model="form.location" type="text" placeholder="e.g. Downtown, Main St." />
          </div>
        </div>

        <div v-else class="modal-body delete-confirm-text">
          <p>Are you sure you want to remove <strong>{{ deleteTargetName }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button :class="modalMode === 'delete' ? 'btn-del-confirm' : 'btn-save'" @click="handleSubmit">
            {{ submitButtonText }}
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
      statsLoading: true,
      usersLoading: true,
      showModal: false,
      modalMode: 'add', 
      deleteType: '', 
      currentId: null,
      deleteTargetName: '',
      form: { 
        businessName: "", 
        firstName: "", 
        lastName: "", 
        email: "",
        location: "" 
      }
    };
  },
  computed: {
    currentUser() { return this.$store.state.loginUser; },
    statCards() {
      return [
        { label: "Active Employers", value: this.stats.totalEmployers || 0, icon: "🏢" },
        { label: "Total Employees", value: this.stats.totalEmployees || 0, icon: "👥" }
      ];
    },
    filteredData() {
      if (!this.searchQuery) return this.users;
      const q = this.searchQuery.toLowerCase();
      return this.users.filter(emp => emp.businessName?.toLowerCase().includes(q));
    },
    modalTitle() {
      if (this.modalMode === 'add') return 'Create New Employer';
      if (this.modalMode === 'edit') return 'Update Business Details';
      return 'Confirm Deletion';
    },
    submitButtonText() {
      if (this.modalMode === 'add') return 'Create Employer';
      if (this.modalMode === 'edit') return 'Save Changes';
      return 'Delete Forever';
    }
  },
  async mounted() { await this.refreshData(); },
  methods: {
    async refreshData() {
      this.usersLoading = true;
      try {
        const [sRes, uRes] = await Promise.all([AdminServices.getStats(), AdminServices.getUsers()]);
        this.stats = sRes.data;
        this.users = uRes.data;
      } catch (err) { console.error("Refresh failed:", err); }
      finally { this.usersLoading = false; this.statsLoading = false; }
    },
    openModal(mode, data = null) {
      this.modalMode = mode;
      if (mode === 'edit' && data) {
        this.currentId = data.employerid;
        this.form = { 
          businessName: data.businessName,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          location: data.location || ""
        };
      } else {
        this.form = { businessName: "", firstName: "", lastName: "", email: "", location: "" };
      }
      this.showModal = true;
    },
    confirmDelete(type, data) {
      this.modalMode = 'delete';
      this.deleteType = type;
      this.currentId = type === 'employer' ? data.employerid : data.EmployeeID;
      this.deleteTargetName = type === 'employer' ? data.businessName : `${data.firstName} ${data.lastName}`;
      this.showModal = true;
    },
    closeModal() { this.showModal = false; },

    async handleSubmit() {
      try {
        const payload = {
          firstName: this.form.firstName,
          lastName: this.form.lastName,
          email: this.form.email,
          businessName: this.form.businessName,
          location: this.form.location || "Not Specified", 
          phoneNum: "",
          niche: "",
          operatingHours: "",
          description: ""
        };

        if (this.modalMode === 'add') {
          await AdminServices.createUser(payload);
        } else if (this.modalMode === 'edit') {
          await AdminServices.updateUser(this.currentId, payload);
        } else if (this.modalMode === 'delete') {
          if (this.deleteType === 'employer') {
            await AdminServices.deleteUser(this.currentId);
          } else {
            await AdminServices.deleteEmployee(this.currentId);
          }
        }
        this.closeModal();
        await this.refreshData();
      } catch (err) { 
        console.error("Submission Error Details:", err.response?.data || err);
        const msg = err.response?.data?.message || "Internal Server Error";
        alert(`Action Failed: ${msg}`); 
      }
    },
    handleLogout() {
      this.$store.commit("setLoginUser", null);
      this.$router.push({ name: "login" });
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap');

.admin-page { display: flex; min-height: 100vh; background: #0b0e14; color: #f1f5f9; font-family: 'Inter', sans-serif; }
.sidebar { width: 220px; background: #11141d; border-right: 1px solid #1e293b; padding: 30px 20px; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
.sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: auto; }
.logo-mark { color: #3b82f6; font-size: 24px; }
.logo-text { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 19px; }
.sidebar-footer { border-top: 1px solid #1e293b; padding-top: 20px; }
.admin-badge { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 12px; }
.admin-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; }
.logout-btn { width: 100%; padding: 8px; background: #1e293b; border: none; color: #f87171; border-radius: 6px; cursor: pointer; font-weight: 500; }

.main { flex-grow: 1; padding: 40px 60px; max-width: 1300px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
h1 { font-family: 'Outfit', sans-serif; font-size: 32px; margin: 0; }
.page-sub { color: #94a3b8; font-size: 15px; }
.btn-primary { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 40px; }
.stat-card { background: #11141d; border: 1px solid #1e293b; padding: 24px; border-radius: 16px; }
.stat-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 15px; }
.stat-flex { display: flex; justify-content: space-between; align-items: flex-end; }
.stat-value { font-family: 'Outfit', sans-serif; font-size: 36px; margin: 0; }

.search-bar { background: #11141d; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
.search-bar input { background: transparent; border: none; color: white; width: 100%; outline: none; }

.employer-block { background: #11141d; border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 40px; overflow: hidden; }
.employer-info-bar { background: #161b26; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; }
.biz-meta { display: flex; align-items: center; gap: 16px; }
.biz-initials { width: 45px; height: 45px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.biz-name { font-size: 20px; margin: 0; }
.biz-owner { font-size: 14px; color: #94a3b8; margin: 0; }
.contact-pill { background: #0b0e14; padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #3b82f6; border: 1px solid #1e293b; }

.staff-container { padding: 24px; }
.staff-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.staff-header h3 { font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0; }
.staff-count { font-size: 12px; color: #64748b; background: #1e293b; padding: 2px 10px; border-radius: 10px; }
.staff-table { width: 100%; border-collapse: collapse; }
.staff-table th { text-align: left; padding: 12px; color: #475569; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #1e293b; }
.staff-table td { padding: 16px 12px; border-bottom: 1px solid #161b26; font-size: 14px; }
.text-right { text-align: right; }
.btn-text-del { background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 13px; }
.edit-icon-btn { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 18px; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
.modal-content { background: #11141d; border: 1px solid #1e293b; width: 500px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.modal-header { padding: 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { margin: 0; font-size: 20px; font-family: 'Outfit'; }
.modal-body { padding: 24px; }
.input-group { margin-bottom: 20px; display: flex; flex-direction: column; }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; box-sizing: border-box; }
label { font-size: 11px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; font-weight: 700; }
input { background: #0b0e14; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; color: white; outline: none; width: 100%; box-sizing: border-box; }
input:focus { border-color: #3b82f6; }
.modal-footer { padding: 24px; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { background: transparent; border: 1px solid #1e293b; color: #94a3b8; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-save { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-del-confirm { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.close-x { background: none; border: none; color: #64748b; font-size: 24px; cursor: pointer; }
.warning-text { color: #f87171; font-size: 13px; }
.loading-state { text-align: center; padding: 100px; }
.spinner { width: 30px; height: 30px; border: 3px solid #1e293b; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>