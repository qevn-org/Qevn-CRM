'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Profile, Client, Meeting } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { sendEmail, emailTemplates } from '@/lib/email/resend';
import { Users, Plus, Award, RefreshCw, Power, ShieldAlert, ArrowRightLeft } from 'lucide-react';

export default function EmployeesAdminPage() {
  const { user } = useStore();
  
  // Data States
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  // Create Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

  // Reassignment Fields
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentHolder, setCurrentHolder] = useState<Profile | null>(null);

  const fetchData = async () => {
    try {
      const empList = await db.listProfiles();
      const clientList = await db.getClients(user!.id, 'admin');
      const meetingList = await db.getMeetings(user!.id, 'admin');

      setEmployees(empList.filter(e => e.id !== user!.id)); // don't list self
      setClients(clientList);
      setMeetings(meetingList);
    } catch (e) {
      console.error(e);
      showToast('Error loading directories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Name and Email are required', 'warning');
      return;
    }

    try {
      const created = await db.createProfile(name, email, phone, role);
      if (created) {
        showToast(`Employee ${name} added successfully!`, 'success');
        
        // Audit log
        await db.createActivity({
          employee_id: user!.id,
          action: 'Employee Created',
          description: `Provisioned profile ${name} (${role})`
        });

        // Trigger welcome email
        await sendEmail({
          to: email,
          subject: 'Welcome to QEVN CRM',
          html: emailTemplates.welcome(name).html,
          employeeId: created.id,
          template: 'Welcome Email'
        });

        setCreateOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setRole('employee');

        fetchData();
      } else {
        showToast('Email is already registered in the CRM', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (emp: Profile) => {
    const newStatus = emp.status === 'active' ? 'disabled' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} ${emp.name}?`)) return;

    try {
      const success = await db.updateProfileStatus(emp.id, newStatus);
      if (success) {
        showToast(`Employee profile is now ${newStatus}`, 'success');
        
        await db.createActivity({
          employee_id: user!.id,
          action: 'Client Updated',
          description: `${newStatus === 'active' ? 'Activated' : 'Disabled'} employee profile: ${emp.name}`
        });

        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openReassignDialog = (emp: Profile) => {
    setCurrentHolder(emp);
    setSelectedClient('');
    setSelectedEmployee('');
    setReassignOpen(true);
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedEmployee) {
      showToast('Please select client and new assignee', 'warning');
      return;
    }

    try {
      const client = clients.find(c => c.id === selectedClient);
      const newHolder = employees.find(e => e.id === selectedEmployee);
      
      const updated = await db.updateClient(selectedClient, { employee_id: selectedEmployee });
      if (updated) {
        showToast(`Reassigned ${client?.client_name} to ${newHolder?.name}`, 'success');

        await db.createActivity({
          client_id: selectedClient,
          employee_id: user!.id,
          action: 'Client Updated',
          description: `Lead ownership reassigned from ${currentHolder?.name} to ${newHolder?.name}`
        });

        setReassignOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Performance calculations
  const getEmployeeStats = (empId: string) => {
    const empClients = clients.filter(c => c.employee_id === empId);
    const empMeetings = meetings.filter(m => m.employee_id === empId);
    const dealsWon = empClients.filter(c => c.status === 'Won').length;
    const dealsLost = empClients.filter(c => c.status === 'Lost').length;
    const pendingFollowups = empMeetings.filter(m => {
      const meetingDateTime = new Date(`${m.meeting_date}T${m.meeting_end}`);
      const dayAfter = new Date(meetingDateTime.getTime() + 24 * 60 * 60 * 1000);
      return dayAfter < new Date() && !m.followup_sent;
    }).length;

    return {
      clientsCount: empClients.length,
      meetingsCount: empMeetings.length,
      dealsWon,
      dealsLost,
      pendingFollowups
    };
  };

  // Sort employees for leaderboard: by deals won desc
  const leaderboard = [...employees].sort((a, b) => {
    return getEmployeeStats(b.id).dealsWon - getEmployeeStats(a.id).dealsWon;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Employee Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Review team performance metrics, assign client leads, and configure active credentials.</p>
        </div>
        <Button className="flex items-center" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Employee
        </Button>
      </div>

      {/* Leaderboard Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-yellow-400" /> Team Leaderboard
          </CardTitle>
          <CardDescription>Performance ranking based on won deals.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((emp, idx) => {
            const stats = getEmployeeStats(emp.id);
            return (
              <div key={emp.id} className="p-4 rounded-xl border border-border/20 bg-secondary/15 flex items-center justify-between glass">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{emp.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-foreground">{stats.dealsWon}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Deals Closed</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Main Employee list table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-secondary/30 animate-pulse rounded-lg w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clients Assigned</TableHead>
                  <TableHead>Meetings Held</TableHead>
                  <TableHead>Won / Lost</TableHead>
                  <TableHead>Pending followups</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const stats = getEmployeeStats(emp.id);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{emp.name}</span>
                          <span className="text-xs text-muted-foreground">{emp.email}</span>
                          {emp.phone && <span className="text-[10px] text-muted-foreground mt-0.5">{emp.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.status === 'active' ? 'success' : 'danger'}>
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{stats.clientsCount}</TableCell>
                      <TableCell>{stats.meetingsCount}</TableCell>
                      <TableCell>
                        <span className="text-emerald-400 font-semibold">{stats.dealsWon}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-rose-400 font-semibold">{stats.dealsLost}</span>
                      </TableCell>
                      <TableCell>
                        {stats.pendingFollowups > 0 ? (
                          <Badge variant="danger">{stats.pendingFollowups} pending</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="text-xs py-1 h-8" onClick={() => openReassignDialog(emp)}>
                            <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Reassign
                          </Button>
                          <Button
                            variant={emp.status === 'active' ? 'destructive' : 'secondary'}
                            size="sm"
                            className="text-xs py-1 h-8"
                            onClick={() => handleToggleStatus(emp)}
                          >
                            <Power className="mr-1.5 h-3.5 w-3.5" />
                            {emp.status === 'active' ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create New Employee"
        description="Add a new profile credentials to the organization list. They will receive a welcome email with credentials details."
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <Input label="Name *" placeholder="e.g. Rahul Mehta" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email Address *" type="email" placeholder="e.g. rahul@qevn.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Phone Number" placeholder="e.g. +91 99887 76655" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Select
            label="System Access Role *"
            options={[
              { value: 'employee', label: 'Employee Access' },
              { value: 'admin', label: 'Administrator Access' }
            ]}
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Register User
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        title="Reassign Client Lead"
        description={`Move clients currently holding by ${currentHolder?.name} to another active employee assignee.`}
      >
        <form onSubmit={handleReassign} className="space-y-4">
          <Select
            label="Select Client to Move *"
            options={[
              { value: '', label: 'Select client...' },
              ...clients
                .filter(c => c.employee_id === currentHolder?.id)
                .map(c => ({ value: c.id, label: `${c.client_name} (${c.company_name})` }))
            ]}
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            required
          />

          <Select
            label="Reassign To *"
            options={[
              { value: '', label: 'Select new employee...' },
              ...employees
                .filter(e => e.status === 'active')
                .map(e => ({ value: e.id, label: e.name }))
            ]}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setReassignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Move
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
