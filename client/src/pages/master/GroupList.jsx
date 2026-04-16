import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/UI/Button';
import DeleteModal from '../../components/UI/DeleteModal';
import { API_BASE_URL } from '../../config';

const GroupList = () => {
  // --- Available members pool ---
  const [availableJobbers, setAvailableJobbers] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);

  // Unified member pool: { id, label, member_type, member_id }
  const buildMemberPool = (jobbers, clients) => [
    ...jobbers.map(j => ({ id: `jobber-${j.id}`, label: `[J] ${j.name}`, member_type: 'jobber', member_id: j.id })),
    ...clients.map(c => ({ id: `client-${c.id}`, label: `[C] ${c.name}`, member_type: 'client', member_id: c.id })),
  ];

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    selectedMembers: [], // { id, label, member_type, member_id }
    description: ''
  });

  // --- List State ---
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // --- Multi-Select State (Add Form) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- Inline Edit State ---
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', selectedMembers: [], description: '' });
  const [editSearchTerm, setEditSearchTerm] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const editDropdownRef = useRef(null);
  const editRowRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setIsEditDropdownOpen(false);
      }
      if (editRowRef.current && !editRowRef.current.contains(event.target)) {
        handleEditCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Fetch all data ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [jobbersRes, clientsRes, groupsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jobbers`),
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/groups`),
      ]);
      const jobbersData = await jobbersRes.json();
      const clientsData = await clientsRes.json();
      const groupsData = await groupsRes.json();

      if (jobbersData.success) setAvailableJobbers(jobbersData.data);
      if (clientsData.success) setAvailableClients(clientsData.data);
      if (groupsData.success) setGroups(groupsData.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Compute filtered member pool for add form
  const memberPool = buildMemberPool(availableJobbers, availableClients);
  const filteredMembers = memberPool.filter(m =>
    m.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !formData.selectedMembers.some(sm => sm.id === m.id)
  );

  // Compute filtered member pool for edit form
  const editFilteredMembers = memberPool.filter(m =>
    m.label.toLowerCase().includes(editSearchTerm.toLowerCase()) &&
    !editFormData.selectedMembers.some(sm => sm.id === m.id)
  );

  // --- Add Form Handlers ---
  const handleToggleMember = (member) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.some(sm => sm.id === member.id)
        ? prev.selectedMembers.filter(m => m.id !== member.id)
        : [...prev.selectedMembers, member]
    }));
    setSearchTerm('');
  };

  const removeMember = (member) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.filter(m => m.id !== member.id)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          members: formData.selectedMembers.map(m => ({
            member_type: m.member_type,
            member_id: m.member_id
          }))
        })
      });
      const result = await response.json();
      if (result.success) {
        await fetchData();
        handleRedo();
      } else {
        alert(result.message || 'Failed to save group');
      }
    } catch (err) {
      alert('Network error while saving');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedo = () => {
    setFormData({ name: '', selectedMembers: [], description: '' });
    setSearchTerm('');
  };

  // --- Inline Edit Handlers ---
  const handleEditClick = (group) => {
    setEditingId(group.id);
    // Map backend members to pool format
    const selected = (group.members || []).map(m => ({
      id: `${m.member_type}-${m.member_id}`,
      label: `${m.member_type === 'jobber' ? '[J]' : '[C]'} ${m.name}`,
      member_type: m.member_type,
      member_id: m.member_id
    }));
    setEditFormData({
      name: group.name,
      selectedMembers: selected,
      description: group.description || ''
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ name: '', selectedMembers: [], description: '' });
    setEditSearchTerm('');
    setIsEditDropdownOpen(false);
  };

  const handleEditSave = async (id) => {
    if (!editFormData.name.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          description: editFormData.description.trim() || null,
          members: editFormData.selectedMembers.map(m => ({
            member_type: m.member_type,
            member_id: m.member_id
          }))
        })
      });
      const result = await response.json();
      if (result.success) {
        await fetchData();
        setEditingId(null);
      } else {
        alert(result.message || 'Failed to update group');
      }
    } catch (err) {
      alert('Network error while updating');
    }
  };

  const handleToggleEditMember = (member) => {
    setEditFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.some(sm => sm.id === member.id)
        ? prev.selectedMembers.filter(m => m.id !== member.id)
        : [...prev.selectedMembers, member]
    }));
    setEditSearchTerm('');
  };

  const removeEditMember = (member) => {
    setEditFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.filter(m => m.id !== member.id)
    }));
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter' && !isEditDropdownOpen) handleEditSave(id);
    else if (e.key === 'Escape') handleEditCancel();
  };

  // --- Delete Handlers ---
  const openDeleteModal = (id) => {
    setGroupToDelete(id);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deletePassword) { setDeleteError('Password is required'); return; }
    if (deletePassword !== import.meta.env.VITE_DEL_PASS) { setDeleteError('Incorrect master password'); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });
      const result = await response.json();
      if (result.success) {
        setIsDeleteModalOpen(false);
        setDeletePassword('');
        fetchData();
      } else {
        setDeleteError(result.message || 'Failed to delete');
      }
    } catch (err) {
      setDeleteError('Network error while deleting');
    }
  };

  // Badge color per member type
  const memberTagClass = (type) =>
    type === 'jobber'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const memberDotClass = (type) =>
    type === 'jobber' ? 'bg-purple-500' : 'bg-emerald-500';

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-10">
        <PageHeader
          title="Group List"
          subtitle="MANAGE GROUPS OF JOBBERS & CLIENTS"
        />

        <div className="px-6 flex flex-col gap-6">
          {/* ── Data Entry Section ── */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-visible">
            <div className="bg-table-header px-4 py-2 border-b border-border-soft rounded-t-xl">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Group Entry</h3>
            </div>

            <div className="p-0 overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-primary">
                    <th className="px-4 py-2 text-left border-r border-border-soft w-1/4">Group Name</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft">Members (Jobbers & Clients)</th>
                    <th className="px-4 py-2 text-left w-1/4">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-soft/50">
                    {/* Group Name */}
                    <td className="p-0 border-r border-border-soft h-12">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                        className="w-full h-full px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-primary/50"
                        placeholder="Enter group name..."
                      />
                    </td>

                    {/* Members Multi-Select */}
                    <td className="p-0 h-12 border-r border-border-soft">
                      <div className="relative w-full h-full flex items-center px-3" ref={dropdownRef}>
                        <div className="flex flex-wrap gap-1.5 flex-1 items-center overflow-hidden">
                          {formData.selectedMembers.map(m => (
                            <span key={m.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${memberTagClass(m.member_type)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${memberDotClass(m.member_type)}`} />
                              {m.label.replace('[J] ', '').replace('[C] ', '')}
                              <button onClick={() => removeMember(m)} className="hover:opacity-60">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="flex-1 min-w-[120px] bg-transparent outline-none text-[12px] placeholder:text-text-primary/50 h-8"
                            placeholder={formData.selectedMembers.length === 0 ? 'Type to search members...' : 'Add more...'}
                          />
                        </div>

                        {isDropdownOpen && (filteredMembers.length > 0 || searchTerm) && (
                          <div className="absolute top-full left-0 w-full bg-white border border-border-soft shadow-2xl rounded-b-lg z-[200] max-h-72 overflow-y-auto mt-0.5">
                            {filteredMembers.map(m => (
                              <button
                                key={m.id}
                                onClick={() => handleToggleMember(m)}
                                className="w-full text-left px-4 py-2 text-[12px] hover:bg-bg-main/50 text-text-primary font-medium transition-colors border-b last:border-none border-border-soft/30 flex items-center gap-2"
                              >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${memberDotClass(m.member_type)}`} />
                                {m.label}
                              </button>
                            ))}
                            {filteredMembers.length === 0 && (
                              <div className="px-4 py-3 text-[12px] text-text-primary italic">No matching members found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="p-0 h-12">
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                        className="w-full h-full px-4 bg-transparent outline-none text-[12px] placeholder:text-text-primary/50"
                        placeholder="Remarks (optional)..."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-bg-main/30 flex justify-end gap-16 border-t border-border-soft">
              <button
                onClick={handleRedo}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[11.5px] font-bold text-text-primary hover:text-text-primary transition uppercase tracking-tight border border-brand-navy rounded-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Redo
              </button>
              <Button variant="primary" size="sm" onClick={handleSave} className="px-6 shadow-brand-blue/20">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Group
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span className="text-[11px] font-semibold text-text-primary opacity-70">[J] Jobber</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[11px] font-semibold text-text-primary opacity-70">[C] Client</span>
            </div>
          </div>

          {/* ── Master Table Section ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-brand-blue rounded-full" />
              <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Group Master List</h2>
            </div>

            <div className="bg-white border border-border-soft rounded-xl shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-1/4">Group Name</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Members</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-1/4">Remarks</th>
                    <th className="px-4 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {groups.map((group) => (
                    <tr
                      key={group.id}
                      ref={editingId === group.id ? editRowRef : null}
                      className={`transition-colors ${editingId === group.id ? 'bg-brand-blue/[0.04] relative z-[100]' : 'hover:bg-bg-main/30'}`}
                    >
                      {/* Name */}
                      <td className="px-5 py-2 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                        {editingId === group.id ? (
                          <input
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            onKeyDown={(e) => handleEditKeyDown(e, group.id)}
                            autoFocus
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue text-[12px]"
                          />
                        ) : group.name}
                      </td>

                      {/* Members */}
                      <td className="px-5 py-2 border-r border-border-soft relative" ref={editingId === group.id ? editDropdownRef : null}>
                        {editingId === group.id ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {editFormData.selectedMembers.map(m => (
                              <span key={m.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${memberTagClass(m.member_type)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${memberDotClass(m.member_type)}`} />
                                {m.label.replace('[J] ', '').replace('[C] ', '')}
                                <button onClick={() => removeEditMember(m)} className="hover:opacity-60">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              value={editSearchTerm}
                              onChange={(e) => { setEditSearchTerm(e.target.value); setIsEditDropdownOpen(true); }}
                              onFocus={() => setIsEditDropdownOpen(true)}
                              onKeyDown={(e) => handleEditKeyDown(e, group.id)}
                              className="flex-1 min-w-[100px] bg-white border border-brand-blue/20 rounded px-2 py-0.5 outline-none text-[12px]"
                              placeholder="Add members..."
                            />
                            {isEditDropdownOpen && editFilteredMembers.length > 0 && (
                              <div className="absolute top-full left-0 w-full bg-white border border-border-soft shadow-2xl rounded-lg z-[200] max-h-72 overflow-y-auto mt-1">
                                {editFilteredMembers.map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => handleToggleEditMember(m)}
                                    className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-main/50 text-text-primary hover:text-brand-blue font-medium transition-colors flex items-center gap-2"
                                  >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${memberDotClass(m.member_type)}`} />
                                    {m.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {(group.members || []).map((m, idx) => (
                              <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${memberTagClass(m.member_type)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${memberDotClass(m.member_type)}`} />
                                {m.name}
                              </span>
                            ))}
                            {(!group.members || group.members.length === 0) && (
                              <span className="text-[11px] text-text-primary/40 italic">No members</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-5 py-2 border-r border-border-soft text-[12px] text-text-primary/70">
                        {editingId === group.id ? (
                          <input
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            onKeyDown={(e) => handleEditKeyDown(e, group.id)}
                            className="w-full bg-white border border-brand-blue/20 rounded px-2 py-0.5 outline-none text-[12px]"
                            placeholder="Remarks..."
                          />
                        ) : (
                          <span className={group.description ? '' : 'italic opacity-40'}>{group.description || '—'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-1.5">
                        <div className="flex items-center justify-center gap-2.5">
                          {editingId === group.id ? (
                            <>
                              <button onClick={() => handleEditSave(group.id)} className="text-green-600 hover:scale-110 transition p-1" title="Save">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button onClick={handleEditCancel} className="text-red-500 hover:scale-110 transition p-1" title="Cancel">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(group)} className="text-brand-blue hover:scale-110 transition p-1" title="Edit Group">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => openDeleteModal(group.id)} className="text-red-500 hover:scale-110 transition p-1" title="Delete Group">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {groups.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-text-primary italic text-[13px]">
                        No groups found. Create a new group to get started.
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-brand-blue animate-pulse font-bold text-[13px]">
                        Loading master data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        password={deletePassword}
        setPassword={setDeletePassword}
        error={deleteError}
      />
    </Layout>
  );
};

export default GroupList;
