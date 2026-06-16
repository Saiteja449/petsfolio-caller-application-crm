export const generateDummyData = () => {
  const contacts = Array.from({ length: 50 }).map((_, i) => ({
    id: `contact_${i}`,
    name: `User ${i + 1}`,
    mobile: `+1234567890${i}`,
    company: `Company ${i + 1}`,
    email: `user${i + 1}@company.com`,
    location: `City ${i % 5 + 1}`,
    isFavorite: i < 5,
    lastCall: `2024-03-0${(i % 9) + 1}T10:00:00Z`,
    callCount: Math.floor(Math.random() * 20),
    totalTalkTime: Math.floor(Math.random() * 5000), // in seconds
  }));

  const callTypes = ['Incoming', 'Outgoing', 'Missed', 'Rejected', 'Not Connected'];
  const callLogs = Array.from({ length: 200 }).map((_, i) => {
    const contact = contacts[i % contacts.length];
    const type = callTypes[Math.floor(Math.random() * callTypes.length)];
    return {
      id: `call_${i}`,
      contactId: contact.id,
      name: contact.name,
      number: contact.mobile,
      type: type,
      date: `2024-03-${String((i % 30) + 1).padStart(2, '0')}`,
      time: `${String(10 + (i % 12)).padStart(2, '0')}:00`,
      duration: type === 'Missed' || type === 'Rejected' || type === 'Not Connected' ? 0 : Math.floor(Math.random() * 300) + 10,
      status: type,
    };
  });

  const followUps = Array.from({ length: 50 }).map((_, i) => {
    const contact = contacts[i % contacts.length];
    return {
      id: `followup_${i}`,
      contactId: contact.id,
      name: contact.name,
      number: contact.mobile,
      scheduledDate: `2024-03-${String((i % 30) + 1).padStart(2, '0')}`,
      scheduledTime: `${String(9 + (i % 8)).padStart(2, '0')}:30`,
      priority: i % 3 === 0 ? 'High' : 'Normal',
      status: i % 4 === 0 ? 'Completed' : 'Pending',
    };
  });

  const notifications = Array.from({ length: 20 }).map((_, i) => ({
    id: `notif_${i}`,
    title: `Notification ${i + 1}`,
    message: `This is the detail for notification ${i + 1}`,
    type: i % 2 === 0 ? 'Missed Call' : 'Follow-up Reminder',
    time: `2024-03-10T10:00:00Z`,
    isRead: i < 5,
  }));

  const analytics = {
    overview: {
      totalCalls: 200,
      incomingCalls: 50,
      outgoingCalls: 80,
      missedCalls: 30,
      connectedCalls: 120,
      rejectedCalls: 20,
      notConnectedCalls: 20,
      totalTalkTime: 14500,
      averageDuration: 120,
      longestDuration: 600,
    },
    today: {
      callsToday: 15,
      talkTimeToday: 800,
      missedToday: 2,
      connectedToday: 10,
    },
    weekly: {
      callsThisWeek: 85,
      talkTime: 4500,
      performanceScore: 88,
      followUpsCompleted: 20,
    },
  };

  const templates = {
    whatsapp: [
      'Hello, I noticed your missed call.',
      'Thank you for contacting us.',
      'I will call you shortly.',
      'Please share your requirement.',
      'Our team will contact you soon.',
    ],
    sms: [
      'Hello, I noticed your missed call.',
      'Thank you for contacting us.',
      'I will call you shortly.',
      'Please share your requirement.',
      'Our team will contact you soon.',
    ]
  };

  return { contacts, callLogs, followUps, notifications, analytics, templates };
};

export const DummyData = generateDummyData();
