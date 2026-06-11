import type { TemplateSendOptions } from '@bulk-messanger/whatsapp';

export type WhatsAppQueueJobData = {
  campaignMessageId: string;
  campaignId: string;
  userId: string;
  phoneNumber: string;
  type: 'TEMPLATE' | 'TEXT';
  template?: TemplateSendOptions;
  textBody?: string;
};

export type CampaignRecipient = {
  phoneNumber: string;
  contactName?: string;
};

export type EnqueueTemplateCampaignInput = {
  userId: string;
  templateName: string;
  language: string;
  variables?: TemplateSendOptions['variables'];
  groupId?: string;
  groupName?: string;
  recipients: CampaignRecipient[];
};

export type EnqueueTextCampaignInput = {
  userId: string;
  textBody: string;
  recipients: CampaignRecipient[];
};
