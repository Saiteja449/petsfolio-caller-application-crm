import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform } from 'react-native';

const ContactContext = createContext(null);

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
        if (permission) {
          Contacts.getAll().then(deviceContacts => {
            const formatted = deviceContacts.map(c => ({
              id: c.recordID,
              name: c.displayName || `${c.givenName} ${c.familyName}`,
              phone: c.phoneNumbers[0]?.number || '',
              company: c.company || 'Unknown',
              email: c.emailAddresses[0]?.email || '',
              location: 'Unknown',
              isFavorite: c.isStarred,
              isFrequent: false,
              lastCall: new Date().toISOString(),
              callCount: 0,
            })).filter(c => c.phone);
            setContacts(formatted);
          }).catch(e => console.error('Failed to fetch contacts', e));
        }
      }
    };
    fetchContacts();
  }, []);

  const getContactById = useCallback(
    (id) => contacts.find((c) => c.id === id),
    [contacts],
  );

  const getFilteredContacts = useCallback(
    (query) => {
      const q = query || searchQuery;
      if (!q.trim()) return contacts;
      const lower = q.toLowerCase();
      return contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.phone.includes(q) ||
          c.company.toLowerCase().includes(lower),
      );
    },
    [contacts, searchQuery],
  );

  const toggleFavorite = useCallback((contactId) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c,
      ),
    );
  }, []);

  const favorites = contacts.filter((c) => c.isFavorite);
  const frequent = contacts.filter((c) => c.isFrequent);
  const recent = [...contacts]
    .sort((a, b) => new Date(b.lastCall) - new Date(a.lastCall))
    .slice(0, 10);

  return (
    <ContactContext.Provider
      value={{
        contacts,
        favorites,
        frequent,
        recent,
        searchQuery,
        setSearchQuery,
        getContactById,
        getFilteredContacts,
        toggleFavorite,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (!context) throw new Error('useContacts must be used within ContactProvider');
  return context;
};

export default ContactContext;
