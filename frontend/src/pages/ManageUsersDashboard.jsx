import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import GenerateUsersPDF from "../components/GenerateUsersPDF";

const ManageUsersDashboard = () => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPDFModal, setShowPDFModal] = useState(false);

    // Fetch all users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        if (!query) {
            fetchUsers();
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/users/search?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const blockUser = async (uid) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/users/block/${uid}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to block user');
        }
    };

    const unblockUser = async (uid) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/users/unblock/${uid}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to unblock user');
        }
    };

    const exportToCSV = () => {
        const headers = ['UID', 'Email', 'First Name', 'Last Name', 'Blocked', 'Email Verified'];
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

    const filteredUsers = users.filter(user =>
        user.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white">

            {/* ✅ PDF Modal — properly inside return */}
            {showPDFModal && (
                <GenerateUsersPDF
                    users={users}
                    onClose={() => setShowPDFModal(false)}
                />
            )}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Users</h1>
                <div className="flex gap-4">
                    <button
                        onClick={exportToCSV}
                        className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowPDFModal(true)}
                        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Generate PDF
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search users by UID, email, name..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                    className="w-full md:w-96 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading && <p className="text-center py-8">Loading users...</p>}
            {error && <p className="text-red-500 text-center py-8">{error}</p>}

            <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-2xl">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="p-4 text-left">UID</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Verified</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user._id} className="border-t border-gray-700 hover:bg-gray-750">
                                <td className="p-4 font-mono">{user.uid}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">{`${user.firstName} ${user.lastName}`}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs ${
                                        user.isBlocked ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                                    }`}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs ${
                                        user.isEmailVerified ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                                    }`}>
                                        {user.isEmailVerified ? 'Verified' : 'Pending'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => user.isBlocked ? unblockUser(user.uid) : blockUser(user.uid)}
                                        className={`px-4 py-1 rounded text-sm mr-2 ${
                                            user.isBlocked
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                    >
                                        {user.isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && !loading && (
                <p className="text-center py-12 text-gray-400">No users found</p>
            )}
        </div>
    );
};

export default ManageUsersDashboard;