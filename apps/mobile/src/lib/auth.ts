import { createAppAuthClient } from '@bulk-messanger/auth/client';
import { getApiBaseUrl } from './api-url';

export const authClient = createAppAuthClient(getApiBaseUrl());
