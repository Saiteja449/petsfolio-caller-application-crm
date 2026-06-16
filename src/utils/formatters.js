export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export const formatTalkTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getCallTypeColor = (type) => {
  const map = {
    incoming: '#2563EB',
    outgoing: '#16A34A',
    missed: '#DC2626',
    rejected: '#F59E0B',
    not_connected: '#94A3B8',
  };
  return map[type] || '#64748B';
};

export const getPriorityColor = (priority) => {
  const map = {
    high: '#DC2626',
    medium: '#F59E0B',
    low: '#16A34A',
  };
  return map[priority] || '#64748B';
};

export const getAvatarColor = (index) => {
  const colors = [
    '#2563EB',
    '#16A34A',
    '#DC2626',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#F97316',
  ];
  return colors[index % colors.length];
};

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
