'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Activity, Profile } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Activity as ActivityIcon, Users, Calendar, Filter } from 'lucide-react';

export default function ActivitiesPage() {
  const { user } = useStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const list = await db.getActivities(user!.id, 'admin');
        const empList = await db.listProfiles();
        setActivities(list);
        setEmployees(empList);
      } catch (err) {
        console.error(err);
        showToast('Error loading activities', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const uniqueActions = Array.from(new Set(activities.map(a => a.action)));

  const filteredActivities = activities.filter(act => {
    const matchesEmp = employeeFilter === 'All' || act.employee_id === employeeFilter;
    const matchesAction = actionFilter === 'All' || act.action === actionFilter;
    return matchesEmp && matchesAction;
  });

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading global audit log...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Global Audit Log</h2>
        <p className="text-sm text-muted-foreground mt-1">Review historical actions, system updates, and employee transactions chronologically.</p>
      </div>

      {/* Filters card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center text-xs text-muted-foreground uppercase font-bold tracking-wide mr-2">
            <Filter className="h-4 w-4 mr-1.5" /> Filters:
          </div>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto flex-1">
            <Select
              options={[
                { value: 'All', label: 'All Employees' },
                ...employees.map(e => ({ value: e.id, label: e.name }))
              ]}
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="h-10 text-xs py-1"
            />
            <Select
              options={[
                { value: 'All', label: 'All Actions' },
                ...uniqueActions.map(act => ({ value: act, label: act }))
              ]}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 text-xs py-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main activities listing */}
      <Card>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ActivityIcon className="h-12 w-12 text-muted-foreground/60 mb-3 animate-pulse" />
              <h3 className="text-md font-bold">No actions found</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Try clearing filters or trigger actions to log activities.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((act) => {
                  const emp = employees.find(e => e.id === act.employee_id);
                  return (
                    <TableRow key={act.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(act.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{emp?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{emp?.role || 'User'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/45 bg-primary/5 text-primary text-[10px]">
                          {act.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm">
                        {act.description}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
