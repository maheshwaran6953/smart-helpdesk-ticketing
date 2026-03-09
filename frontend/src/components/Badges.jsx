import React from 'react';

// Priority badges
const priorityConfig = {
  critical: { bg: 'var(--red-soft)', dot: 'var(--red)', text: 'var(--red)', label: 'Critical' },
  high: { bg: 'var(--orange-soft)', dot: 'var(--orange)', text: 'var(--orange)', label: 'High' },
  medium: { bg: 'var(--amber-soft)', dot: 'var(--amber)', text: 'var(--amber)', label: 'Medium' },
  low: { bg: 'var(--green-soft)', dot: 'var(--green)', text: 'var(--green)', label: 'Low' },
};

// Status badges
const statusConfig = {
  open: { bg: 'var(--blue-soft)', dot: 'var(--blue)', text: 'var(--blue)', label: 'Open' },
  in_progress: { bg: 'var(--orange-soft)', dot: 'var(--orange)', text: 'var(--orange)', label: 'In Progress' },
  pending_verification: { bg: 'var(--purple-soft)', dot: 'var(--purple)', text: 'var(--purple)', label: 'Pending Verification' },
  resolved: { bg: 'var(--green-soft)', dot: 'var(--green)', text: 'var(--green)', label: 'Resolved' },
  closed: { bg: 'var(--surface2)', dot: 'var(--text3)', text: 'var(--text2)', label: 'Closed' },
};

const BadgeBase = ({ bg, dot, text, label }) => (
  <span 
    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-badge text-[11px] font-bold whitespace-nowrap"
    style={{ backgroundColor: bg, color: text }}
  >
    <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: dot }} />
    {label}
  </span>
);

export function PriorityBadge({ priority }) {
  const cfg = priorityConfig[priority?.toLowerCase()] || {
    bg: 'var(--surface2)',
    dot: 'var(--text4)',
    text: 'var(--text3)',
    label: priority || 'Unknown',
  };
  return <BadgeBase {...cfg} />;
}

export function StatusBadge({ status }) {
  const cfg = statusConfig[status?.toLowerCase()] || {
    bg: 'var(--surface2)',
    dot: 'var(--text4)',
    text: 'var(--text3)',
    label: status || 'Unknown',
  };
  return <BadgeBase {...cfg} />;
}

export function RoleBadge({ role }) {
  const roleMap = {
    admin: { bg: 'var(--indigo-soft)', dot: 'var(--indigo)', text: 'var(--indigo)', label: 'Admin' },
    agent: { bg: 'var(--blue-soft)', dot: 'var(--blue)', text: 'var(--blue)', label: 'Agent' },
    user: { bg: 'var(--green-soft)', dot: 'var(--green)', text: 'var(--green)', label: 'User' },
  };
  const cfg = roleMap[role?.toLowerCase()] || { 
    bg: 'var(--surface2)', 
    dot: 'var(--text4)', 
    text: 'var(--text3)', 
    label: role 
  };
  return <BadgeBase {...cfg} />;
}

export function BurnoutBadge({ level }) {
  const map = {
    HIGH: { bg: 'var(--red-soft)', dot: 'var(--red)', text: 'var(--red)' },
    MEDIUM: { bg: 'var(--orange-soft)', dot: 'var(--orange)', text: 'var(--orange)' },
    LOW: { bg: 'var(--green-soft)', dot: 'var(--green)', text: 'var(--green)' },
  };
  const cfg = map[level?.toUpperCase()] || { 
    bg: 'var(--surface2)', 
    dot: 'var(--text4)', 
    text: 'var(--text3)' 
  };
  return <BadgeBase {...cfg} label={level || 'UNKNOWN'} />;
}

export function LoadBadge({ level }) {
  const map = {
    HIGH: { bg: 'var(--red-soft)', dot: 'var(--red)', text: 'var(--red)' },
    MEDIUM: { bg: 'var(--amber-soft)', dot: 'var(--amber)', text: 'var(--amber)' },
    LOW: { bg: 'var(--green-soft)', dot: 'var(--green)', text: 'var(--green)' },
  };
  const cfg = map[level?.toUpperCase()] || { 
    bg: 'var(--surface2)', 
    dot: 'var(--text4)', 
    text: 'var(--text3)' 
  };
  return <BadgeBase {...cfg} label={level || 'UNKNOWN'} />;
}
