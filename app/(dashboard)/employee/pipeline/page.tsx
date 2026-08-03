'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client } from '@/lib/mock-db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { Plus, User, Building2, Calendar, Phone } from 'lucide-react';
import Link from 'next/link';

const STAGES = [
  'Lead',
  'Contacted',
  'Meeting Scheduled',
  'Meeting Completed',
  'Feedback Pending',
  'Feedback Sent',
  'Follow-up Pending',
  'Negotiation',
  'Won',
  'Lost'
] as const;

type Stage = typeof STAGES[number];

export default function KanbanPipeline() {
  const { user } = useStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async () => {
    if (!user) return;
    try {
      const list = await db.getClients(user.id, user.role);
      setClients(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData('text/plain', clientId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: Stage) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('text/plain');
    if (!clientId) return;

    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    if (client.status === targetStage) return;

    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: targetStage } : c));

    try {
      const updated = await db.updateClient(clientId, { status: targetStage });
      if (updated) {
        showToast(`Moved ${client.client_name} to ${targetStage}`, 'success');
        
        // Add activity audit log
        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Client Updated',
          description: `Stage moved from ${client.status} to ${targetStage} in Kanban pipeline`
        });
      } else {
        showToast('Failed to update stage', 'error');
        fetchClients(); // Rollback
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating status', 'error');
      fetchClients();
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'danger';
    if (p === 'Medium') return 'warning';
    return 'info';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-secondary/40 animate-pulse rounded-lg" />
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-72 h-[60vh] bg-secondary/20 animate-pulse rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Kanban Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">Drag and drop clients to transition their sales cycle stages.</p>
        </div>
        <Link href="/employee/clients?add=true">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </Link>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto flex space-x-4 pb-4">
        {STAGES.map((stage) => {
          const stageClients = clients.filter(c => c.status === stage);
          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="w-72 flex-shrink-0 flex flex-col rounded-xl bg-secondary/15 border border-border/20 p-3 h-full glass"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-foreground/80 tracking-wide uppercase">{stage}</span>
                <span className="text-xs font-bold bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {stageClients.length}
                </span>
              </div>

              {/* Column Cards Area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageClients.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-border/10 rounded-lg py-12 text-center">
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Drag leads here</p>
                  </div>
                ) : (
                  stageClients.map((client) => (
                    <div
                      key={client.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      className="group relative cursor-grab active:cursor-grabbing p-4 rounded-xl border border-border/30 bg-card hover:border-primary/50 transition-all duration-200 shadow-md hover:shadow-lg flex flex-col space-y-3"
                    >
                      {/* Priority and detail redirect */}
                      <div className="flex justify-between items-center">
                        <Badge variant={getPriorityColor(client.priority)}>
                          {client.priority} Priority
                        </Badge>
                        <Link href={`/employee/clients/${client.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-semibold text-primary hover:underline flex items-center">
                            Profile
                          </span>
                        </Link>
                      </div>

                      {/* Name info */}
                      <div>
                        <h4 className="text-sm font-bold text-foreground tracking-tight">{client.client_name}</h4>
                        <div className="flex items-center text-[11px] text-muted-foreground mt-1">
                          <Building2 className="h-3 w-3 mr-1 flex-shrink-0 text-muted-foreground/60" />
                          <span className="truncate">{client.company_name}</span>
                        </div>
                      </div>

                      {/* Contact metadata */}
                      <div className="flex justify-between items-center pt-2 border-t border-border/10 text-[10px] text-muted-foreground">
                        {client.industry ? (
                          <span className="truncate max-w-[120px]">{client.industry}</span>
                        ) : (
                          <span>No Industry</span>
                        )}
                        <span>{new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>

                      {/* Lead Owner tag for Admins */}
                      {user?.role === 'admin' && client.owner_name && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/10 text-[10px]">
                          <span className="text-muted-foreground">Owner</span>
                          <span className="font-semibold text-primary/95">{client.owner_name}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
