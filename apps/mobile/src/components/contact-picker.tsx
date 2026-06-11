import {
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { trpc } from '../lib/trpc';

type ContactPickerProps = {
  selectedIds: Set<string>;
  onToggle: (contactId: string) => void;
  onSelectAll?: (contactIds: string[]) => void;
  search?: string;
};

export function ContactPicker({
  selectedIds,
  onToggle,
  search,
}: ContactPickerProps) {
  const { data: contacts, isLoading, error } = trpc.listContacts.useQuery({
    search: search?.trim() || undefined,
  });

  if (isLoading) {
    return <Typography color="text.secondary">Loading contacts...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error.message}</Typography>;
  }

  if (!contacts?.length) {
    return (
      <Typography color="text.secondary">
        No contacts found. Add contacts to your phonebook first.
      </Typography>
    );
  }

  return (
    <List
      dense
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {contacts.map((contact) => (
        <ListItem key={contact.id} disablePadding>
          <ListItemButton onClick={() => onToggle(contact.id)}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={selectedIds.has(contact.id)}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText
              primary={contact.name}
              secondary={`+${contact.phoneNumber}`}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

type SelectAllContactsProps = {
  contacts: Array<{ id: string }>;
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
};

export function SelectAllContactsControl({
  contacts,
  selectedIds,
  onChange,
}: SelectAllContactsProps) {
  const allSelected =
    contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id));

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={allSelected}
          indeterminate={
            contacts.some((contact) => selectedIds.has(contact.id)) && !allSelected
          }
          onChange={() => {
            if (allSelected) {
              onChange(new Set());
              return;
            }

            onChange(new Set(contacts.map((contact) => contact.id)));
          }}
        />
      }
      label={`${selectedIds.size} selected`}
    />
  );
}
