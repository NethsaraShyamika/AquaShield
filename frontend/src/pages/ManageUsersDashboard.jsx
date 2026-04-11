import React, { useState, useEffect } from 'react';
import api from "../api/axios";
import Papa from 'papaparse';
import GenerateUsersPDF from "../components/GenerateUsersPDF";
import { Users, LayoutDashboard, Fish, FileText, Briefcase, Settings, LogOut, Search, Shield, UserCheck, UserX, Download, FileText as FilePdf } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "users", label: "User Management", icon: Users, path: "/admin/users" },
  { id: "species", label: "Species Management", icon: Fish, path: "/admin/species" },
  { id: "reports", label: "Report Management", icon: FileText, path: "/admin/reports" },
  { id: "cases", label: "Case Management", icon: Briefcase, path: "/admin/cases" },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
];

const ManageUsersDashboard = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("users");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0, verified: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    fetchUsers();
  }, [navigate]);

 
  const filterNonAdmins = (userList) => userList.filter(user => !user.isAdmin);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const nonAdminUsers = filterNonAdmins(response.data);
      setUsers(nonAdminUsers);
      
     
      const total = nonAdminUsers.length;
      const active = nonAdminUsers.filter(u => !u.isBlocked).length;
      const blocked = nonAdminUsers.filter(u => u.isBlocked).length;
      const verified = nonAdminUsers.filter(u => u.isEmailVerified).length;
      setStats({ total, active, blocked, verified });
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      fetchUsers();
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
     
      const nonAdminUsers = filterNonAdmins(response.data);
      setUsers(nonAdminUsers);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (uid) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/users/block/${uid}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // refresh list
    } catch {
      alert('Failed to block user');
    }
  };

  const unblockUser = async (uid) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/users/unblock/${uid}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // refresh list
    } catch {
      alert('Failed to unblock user');
    }
  };

  const exportToCSV = () => {
    
    const headers = ['UID', 'Email', 'First Name', 'Last Name', 'Blocked', 'Verified'];
    const csvData = users.map(user => [
      user.uid,
      user.email,
      user.firstName,
      user.lastName,
      user.isBlocked ? 'Yes' : 'No',
      user.isEmailVerified ? 'Yes' : 'No'
    ]);

    const csv = Papa.unparse([headers, ...csvData]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleNav = (id, path) => {
    setActiveNav(id);
    navigate(path);
  };

  // Local filtering (already excludes admins because users state never contains them)
  const filteredUsers = users.filter(user =>
    user.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#0C1423] overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="absolute w-[380px] h-[380px] rounded-full blur-[70px] bg-blue-500/20 -top-[120px] -left-[100px] pointer-events-none"></div>
      <div className="absolute w-[460px] h-[460px] rounded-full blur-[70px] bg-[#1E3A5F]/30 -right-[140px] -bottom-[170px] pointer-events-none"></div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-[260px] flex-shrink-0 border-r border-white/10 bg-[rgba(6,15,30,0.88)] backdrop-blur-[18px] fixed top-0 left-0 h-full z-20 overflow-y-auto">
          {/* Logo Section */}
          <div className="flex items-center gap-2.5 px-3 py-5 pb-4 mb-1 border-b border-white/10">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
              <Fish size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white m-0">AquaShield</p>
              <p className="text-[10px] tracking-[0.1em] uppercase text-white/45 m-0">Admin Panel</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col gap-2.5 p-3">
            {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id, path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-180 ${
                  activeNav === id 
                    ? 'bg-cyan-500/15 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Footer with Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 mt-auto">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-all duration-180"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-[260px] w-[calc(100%-260px)] p-6">
          <div className="max-w-[1180px] mx-auto">
            {/* Header Card */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl px-6 py-5 mb-6 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-cyan-400 mb-3">
                    <Shield size={12} /> Admin Panel
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-white">User Management</h1>
                  <p className="text-sm text-white/40 mt-1">Manage system users, access controls and permissions</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(6,182,212,0.30)] hover:brightness-105 transition-all"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={() => setShowPDFModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    <FilePdf size={16} /> Generate PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards (based on non-admin users only) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30 mb-3">
                  <Users size={18} className="text-cyan-400" />
                </div>
                <p className="text-sm text-white/40">Total Users</p>
                <p className="text-3xl font-extrabold text-white">{stats.total}</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30 mb-3">
                  <UserCheck size={18} className="text-green-400" />
                </div>
                <p className="text-sm text-white/40">Active Users</p>
                <p className="text-3xl font-extrabold text-white">{stats.active}</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30 mb-3">
                  <UserX size={18} className="text-red-400" />
                </div>
                <p className="text-sm text-white/40">Blocked Users</p>
                <p className="text-3xl font-extrabold text-white">{stats.blocked}</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-2xl p-5 shadow-xl">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 mb-3">
                  <Shield size={18} className="text-blue-400" />
                </div>
                <p className="text-sm text-white/40">Verified Users</p>
                <p className="text-3xl font-extrabold text-white">{stats.verified}</p>
              </div>
            </div>

            {/* Users Table Card */}
            <div className="bg-white/5 backdrop-blur-[14px] border border-white/20 rounded-3xl overflow-hidden shadow-xl">
              {/* Search Bar */}
              <div className="flex flex-col gap-3 px-6 py-4 border-b border-white/10 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">User Directory</h2>
                  <p className="text-sm text-white/40">Search, manage and control user access</p>
                </div>
                <div className="relative w-full md:w-[320px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by UID or email..."
                    className="w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5"></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">UID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Verification</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr
                            key={user._id}
                            className="border-b border-white/5 hover:bg-white/5 transition-all duration-200"
                          >
                            <td className="px-4 py-3 font-mono text-sm text-white/80">{user.uid}</td>
                            <td className="px-4 py-3 text-sm text-white/80">{user.email}</td>
                            <td className="px-4 py-3 text-sm text-white/80">{user.firstName} {user.lastName}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                user.isBlocked 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                {user.isBlocked ? "Blocked" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                user.isEmailVerified 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {user.isEmailVerified ? "Verified" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => user.isBlocked ? unblockUser(user.uid) : blockUser(user.uid)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
                                  user.isBlocked 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                              >
                                {user.isBlocked ? "Unblock" : "Block"}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-4 py-14 text-center text-white/40">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {error && (
                <div className="px-6 py-4 text-center text-red-400 bg-red-500/10">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPDFModal && (
        <GenerateUsersPDF users={users} onClose={() => setShowPDFModal(false)} />
      )}
    </div>
  );
};

export default ManageUsersDashboard;