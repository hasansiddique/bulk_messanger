import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import { normalizePhoneNumber, isValidPhoneNumber } from './phone-numbers';

export type DeviceContact = {
  deviceContactId: string;
  name: string;
  phoneNumber: string;
  email?: string;
};

export function isNativeContactsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

function getContactName(contact: {
  name?: { display?: string | null; given?: string | null; family?: string | null } | null;
}): string {
  const display = contact.name?.display?.trim();
  if (display) {
    return display;
  }

  const given = contact.name?.given?.trim() ?? '';
  const family = contact.name?.family?.trim() ?? '';
  const combined = `${given} ${family}`.trim();

  return combined || 'Unknown contact';
}

function getPrimaryPhone(contact: {
  phones?: Array<{ number?: string | null }> | null;
}): string | null {
  for (const phone of contact.phones ?? []) {
    const normalized = normalizePhoneNumber(phone.number ?? '');
    if (isValidPhoneNumber(normalized)) {
      return normalized;
    }
  }

  return null;
}

function getPrimaryEmail(contact: {
  emails?: Array<{ address?: string | null }> | null;
}): string | undefined {
  const email = contact.emails?.find((item) => item.address?.trim())?.address?.trim();
  return email || undefined;
}

export async function ensureContactsPermission(): Promise<
  'granted' | 'denied' | 'prompt' | 'limited'
> {
  const current = await Contacts.checkPermissions();

  if (current.contacts === 'granted' || current.contacts === 'limited') {
    return current.contacts;
  }

  const requested = await Contacts.requestPermissions();
  return requested.contacts;
}

export async function loadDeviceContacts(): Promise<DeviceContact[]> {
  if (!isNativeContactsAvailable()) {
    throw new Error('Importing contacts is only available on iOS and Android.');
  }

  const permission = await ensureContactsPermission();

  if (permission !== 'granted' && permission !== 'limited') {
    throw new Error('Contacts permission was denied. Enable it in device settings.');
  }

  const result = await Contacts.getContacts({
    projection: {
      name: true,
      phones: true,
      emails: true,
    },
  });

  const contacts: DeviceContact[] = [];
  const seenNumbers = new Set<string>();

  for (const contact of result.contacts) {
    const phoneNumber = getPrimaryPhone(contact);

    if (!phoneNumber || seenNumbers.has(phoneNumber)) {
      continue;
    }

    seenNumbers.add(phoneNumber);
    contacts.push({
      deviceContactId: contact.contactId,
      name: getContactName(contact),
      phoneNumber,
      email: getPrimaryEmail(contact),
    });
  }

  return contacts.sort((left, right) => left.name.localeCompare(right.name));
}
