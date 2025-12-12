
import React from 'react';
import { JiraTicket } from '../types';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

interface StuckTicketsListProps {
  tickets: JiraTicket[];
}

export const StuckTicketsList: React.FC<StuckTicketsListProps> = ({ tickets }) => {
  // Filter for tickets that are actually stuck (In Progress > 3 days)
  const stuckTickets = tickets.filter(t => t.status === 'In Progress' && t.daysInStatus > 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full">
      <div className="p-6 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          Flow Blockers
        </h3>
        <p className="text-sm text-slate-400">Tickets in 'In Progress' for &gt; 3 days</p>
      </div>

      <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
        {stuckTickets.map(ticket => (
          <div key={ticket.id} className="p-4 hover:bg-slate-800/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  ticket.type === 'Bug' ? 'bg-red-500/10 text-red-500' :
                  ticket.type === 'Story' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {ticket.type}
                </span>
                <span className="text-xs font-mono text-slate-500">{ticket.key}</span>
              </div>
              <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded">
                <Clock size={12} className="mr-1" />
                {ticket.daysInStatus} days
              </div>
            </div>

            <h4 className="text-sm font-medium text-slate-200 mb-2 line-clamp-1">{ticket.title}</h4>

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <img src={ticket.assigneeAvatar} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-slate-400">{ticket.assignee}</span>
              </div>
              <div className="flex items-center text-slate-500">
                In Progress <ArrowRight size={12} className="mx-1" /> ?
              </div>
            </div>
          </div>
        ))}

        {stuckTickets.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No blockers found. Flow is healthy!
          </div>
        )}
      </div>
    </div>
  );
};
