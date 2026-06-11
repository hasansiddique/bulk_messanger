import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
import {
  contactInputSchema,
  getOwnedContact,
  importContactSchema,
  phoneNumberSchema,
  serializeContact,
} from './contacts';
import {
  getOwnedCampaign,
  resolveCampaignRecipients,
  serializeCampaign,
  serializeCampaignMessage,
} from './campaigns';
import {
  contactGroupInputSchema,
  getOwnedContactGroup,
  groupInclude,
  replaceGroupMembers,
  serializeContactGroup,
  validateOwnedContactIds,
} from './groups';
import type { TRPCContext } from './context';

const templateVariableSchema = z.object({
  component: z.enum(['body', 'header']),
  index: z.number().int().min(0),
  value: z.string().trim().min(1),
});

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  })),
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
  getProfile: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    name: ctx.user.name,
    email: ctx.user.email,
    image: ctx.user.image,
    createdAt: ctx.user.createdAt,
  })),
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');

      const user = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { name: input.name },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }),
  sendTestWhatsAppCampaign: protectedProcedure
    .input(z.object({}).default({}))
    .mutation(async () => {
      const { sendBulkTestCampaign } = await import('@bulk-messanger/whatsapp');
      return sendBulkTestCampaign();
    }),
  listContacts: protectedProcedure
    .input(
      z
        .object({
          search: z.string().trim().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      const search = input?.search?.trim();

      const contacts = await prisma.contact.findMany({
        where: {
          userId: ctx.user.id,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { phoneNumber: { contains: search } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
      });

      return contacts.map(serializeContact);
    }),
  getContactStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = await import('@bulk-messanger/database');
    const [total, manual, imported] = await Promise.all([
      prisma.contact.count({ where: { userId: ctx.user.id } }),
      prisma.contact.count({
        where: { userId: ctx.user.id, source: 'MANUAL' },
      }),
      prisma.contact.count({
        where: { userId: ctx.user.id, source: 'IMPORTED' },
      }),
    ]);

    return { total, manual, imported };
  }),
  getContact: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const contact = await getOwnedContact(ctx.user.id, input.id);
      return serializeContact(contact);
    }),
  createContact: protectedProcedure
    .input(contactInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');

      const existing = await prisma.contact.findUnique({
        where: {
          userId_phoneNumber: {
            userId: ctx.user.id,
            phoneNumber: input.phoneNumber,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A contact with this phone number already exists',
        });
      }

      const contact = await prisma.contact.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          phoneNumber: input.phoneNumber,
          email: input.email,
          source: 'MANUAL',
        },
      });

      return serializeContact(contact);
    }),
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        data: contactInputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      await getOwnedContact(ctx.user.id, input.id);

      const duplicate = await prisma.contact.findFirst({
        where: {
          userId: ctx.user.id,
          phoneNumber: input.data.phoneNumber,
          NOT: { id: input.id },
        },
      });

      if (duplicate) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Another contact already uses this phone number',
        });
      }

      const contact = await prisma.contact.update({
        where: { id: input.id },
        data: {
          name: input.data.name,
          phoneNumber: input.data.phoneNumber,
          email: input.data.email,
        },
      });

      return serializeContact(contact);
    }),
  deleteContact: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      await getOwnedContact(ctx.user.id, input.id);

      await prisma.contact.delete({
        where: { id: input.id },
      });

      return { success: true as const };
    }),
  importContacts: protectedProcedure
    .input(
      z.object({
        contacts: z.array(importContactSchema).min(1).max(500),
        skipDuplicates: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      const existingContacts = await prisma.contact.findMany({
        where: { userId: ctx.user.id },
        select: { phoneNumber: true },
      });
      const existingNumbers = new Set(
        existingContacts.map((entry) => entry.phoneNumber),
      );

      let imported = 0;
      let skipped = 0;
      let invalid = 0;
      const results: Array<{
        phoneNumber: string;
        name: string;
        status: 'imported' | 'duplicate' | 'invalid';
        error?: string;
      }> = [];

      for (const contact of input.contacts) {
        if (!/^\d{10,15}$/.test(contact.phoneNumber)) {
          invalid += 1;
          results.push({
            phoneNumber: contact.phoneNumber,
            name: contact.name,
            status: 'invalid',
            error: 'Invalid phone number',
          });
          continue;
        }

        if (existingNumbers.has(contact.phoneNumber)) {
          skipped += 1;
          results.push({
            phoneNumber: contact.phoneNumber,
            name: contact.name,
            status: 'duplicate',
          });
          continue;
        }

        try {
          await prisma.contact.create({
            data: {
              userId: ctx.user.id,
              name: contact.name,
              phoneNumber: contact.phoneNumber,
              email: contact.email,
              source: 'IMPORTED',
              deviceContactId: contact.deviceContactId,
            },
          });

          existingNumbers.add(contact.phoneNumber);
          imported += 1;
          results.push({
            phoneNumber: contact.phoneNumber,
            name: contact.name,
            status: 'imported',
          });
        } catch {
          skipped += 1;
          results.push({
            phoneNumber: contact.phoneNumber,
            name: contact.name,
            status: 'duplicate',
            error: 'Could not import contact',
          });
        }
      }

      return {
        imported,
        skipped,
        invalid,
        total: input.contacts.length,
        results,
      };
    }),
  listWhatsAppTemplates: protectedProcedure.query(async () => {
    const { listMessageTemplates } = await import('@bulk-messanger/whatsapp');
    return listMessageTemplates();
  }),
  sendWhatsAppTemplateCampaign: protectedProcedure
    .input(
      z
        .object({
          templateName: z.string().trim().min(1),
          language: z.string().trim().min(2),
          variables: z.array(templateVariableSchema).default([]),
          groupId: z.string().min(1).optional(),
          contactIds: z.array(z.string().min(1)).max(500).optional(),
          recipients: z.array(phoneNumberSchema).max(500).optional(),
        })
        .refine(
          (input) =>
            Boolean(input.groupId) ||
            (input.contactIds?.length ?? 0) > 0 ||
            (input.recipients?.length ?? 0) > 0,
          {
            message: 'Select a group, contacts, or recipients',
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { enqueueTemplateCampaign } = await import('@bulk-messanger/queue');
      const { recipients, groupName } = await resolveCampaignRecipients(
        ctx.user.id,
        input,
      );

      if (recipients.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No recipients found for this campaign',
        });
      }

      return enqueueTemplateCampaign({
        userId: ctx.user.id,
        templateName: input.templateName,
        language: input.language,
        variables: input.variables,
        groupId: input.groupId,
        groupName,
        recipients,
      });
    }),
  sendWhatsAppMessage: protectedProcedure
    .input(
      z
        .object({
          message: z.string().trim().min(1).max(4096),
          groupId: z.string().min(1).optional(),
          contactIds: z.array(z.string().min(1)).max(500).optional(),
          recipients: z.array(phoneNumberSchema).max(500).optional(),
        })
        .refine(
          (input) =>
            Boolean(input.groupId) ||
            (input.contactIds?.length ?? 0) > 0 ||
            (input.recipients?.length ?? 0) > 0,
          {
            message: 'Select a group, contacts, or recipients',
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { enqueueTextCampaign } = await import('@bulk-messanger/queue');
      const { recipients } = await resolveCampaignRecipients(ctx.user.id, input);

      if (recipients.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No recipients found for this campaign',
        });
      }

      return enqueueTextCampaign({
        userId: ctx.user.id,
        textBody: input.message,
        recipients,
      });
    }),
  getCampaign: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { refreshCampaignStatus, recoverStalledCampaign } = await import(
        '@bulk-messanger/queue'
      );
      await recoverStalledCampaign(input.id);
      await refreshCampaignStatus(input.id);
      const campaign = await getOwnedCampaign(ctx.user.id, input.id);
      return serializeCampaign(campaign);
    }),
  listCampaigns: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      const campaigns = await prisma.messageCampaign.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 20,
      });

      return campaigns.map(serializeCampaign);
    }),
  getCampaignMessages: protectedProcedure
    .input(z.object({ campaignId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      await getOwnedCampaign(ctx.user.id, input.campaignId);

      const messages = await prisma.campaignMessage.findMany({
        where: { campaignId: input.campaignId },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      });

      return messages.map(serializeCampaignMessage);
    }),
  listContactGroups: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = await import('@bulk-messanger/database');
    const groups = await prisma.contactGroup.findMany({
      where: { userId: ctx.user.id },
      include: groupInclude,
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    });

    return groups.map(serializeContactGroup);
  }),
  getContactGroup: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const group = await getOwnedContactGroup(ctx.user.id, input.id);
      return serializeContactGroup(group);
    }),
  createContactGroup: protectedProcedure
    .input(contactGroupInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      await validateOwnedContactIds(ctx.user.id, input.contactIds);

      const group = await prisma.contactGroup.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
        },
      });

      await replaceGroupMembers(group.id, input.contactIds);

      const created = await getOwnedContactGroup(ctx.user.id, group.id);
      return serializeContactGroup(created);
    }),
  updateContactGroup: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        data: contactGroupInputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      await getOwnedContactGroup(ctx.user.id, input.id);
      await validateOwnedContactIds(ctx.user.id, input.data.contactIds);

      await prisma.contactGroup.update({
        where: { id: input.id },
        data: { name: input.data.name },
      });

      await replaceGroupMembers(input.id, input.data.contactIds);

      const updated = await getOwnedContactGroup(ctx.user.id, input.id);
      return serializeContactGroup(updated);
    }),
  deleteContactGroup: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import('@bulk-messanger/database');
      await getOwnedContactGroup(ctx.user.id, input.id);

      await prisma.contactGroup.delete({
        where: { id: input.id },
      });

      return { success: true as const };
    }),
});

export type AppRouter = typeof appRouter;
