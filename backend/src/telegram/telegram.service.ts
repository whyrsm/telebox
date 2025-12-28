import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import bigInt from 'big-integer';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { TELEGRAM } from '../common/constants';
import { TelegramApiError, FileDownloadError } from '../common/errors/file.errors';

@Injectable()
export class TelegramService {
  private readonly apiId: number;
  private readonly apiHash: string;
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.apiId = parseInt(this.configService.get<string>('TELEGRAM_API_ID') || '0');
    this.apiHash = this.configService.get<string>('TELEGRAM_API_HASH') || '';
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';
  }

  async createClient(sessionString?: string): Promise<TelegramClient> {
    const session = new StringSession(sessionString || '');
    const client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: TELEGRAM.CONNECTION_RETRIES,
    });
    await client.connect();
    return client;
  }

  async sendCode(client: TelegramClient, phone: string): Promise<{ phoneCodeHash: string }> {
    const result = await client.sendCode(
      { apiId: this.apiId, apiHash: this.apiHash },
      phone,
    );
    return { phoneCodeHash: result.phoneCodeHash };
  }

  async signIn(
    client: TelegramClient,
    phone: string,
    code: string,
    phoneCodeHash: string,
  ): Promise<{ user: Api.User; sessionString: string }> {
    const result = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code,
      }),
    );

    const user = (result as Api.auth.Authorization).user as Api.User;
    const sessionString = client.session.save() as unknown as string;

    return { user, sessionString };
  }

  async getMe(client: TelegramClient): Promise<Api.User> {
    return (await client.getMe()) as Api.User;
  }

  async uploadFile(
    client: TelegramClient,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<Api.Message> {
    const result = await client.sendFile(TELEGRAM.SAVED_MESSAGES, {
      file: buffer,
      caption: fileName,
      forceDocument: true,
      attributes: [
        new Api.DocumentAttributeFilename({ fileName }),
      ],
    });
    return result;
  }

  async downloadFile(client: TelegramClient, messageId: number): Promise<Buffer> {
    try {
      const messages = await client.getMessages(TELEGRAM.SAVED_MESSAGES, { ids: messageId });
      if (!messages.length || !messages[0].media) {
        throw new FileDownloadError('Message or media not found');
      }
      const buffer = await client.downloadMedia(messages[0].media);
      return buffer as Buffer;
    } catch (error) {
      throw new FileDownloadError('Failed to download file from Telegram', error as Error);
    }
  }

  async deleteMessage(client: TelegramClient, messageId: number): Promise<void> {
    await client.deleteMessages(TELEGRAM.SAVED_MESSAGES, [messageId], { revoke: true });
  }

  async getMessages(client: TelegramClient, limit = 100): Promise<Api.Message[]> {
    const messages = await client.getMessages(TELEGRAM.SAVED_MESSAGES, { limit });
    return messages.filter((m) => m.media) as Api.Message[];
  }

  async getDialogs(client: TelegramClient): Promise<any[]> {
    const dialogs = await client.getDialogs({ limit: 100 });
    return dialogs as any[];
  }

  async getMessagesFromChat(
    client: TelegramClient,
    chatId: string,
    chatType: 'user' | 'group' | 'channel' | 'saved',
    limit = 100,
  ): Promise<Api.Message[]> {
    try {
      if (chatType === 'saved' || chatId === 'me') {
        const messages = await client.getMessages(new Api.InputPeerSelf(), { limit });
        return messages.filter((m) => m.media) as Api.Message[];
      }
      
      // For channels/groups/users, we need to find the entity from dialogs
      // This ensures we have the proper access hash
      const dialogs = await client.getDialogs({ limit: 100 });
      
      let targetEntity: any = null;
      for (const dialog of dialogs) {
        const entity = (dialog as any).entity;
        if (entity && entity.id && entity.id.toString() === chatId) {
          targetEntity = entity;
          break;
        }
      }
      
      if (!targetEntity) {
        throw new Error(`Chat not found: ${chatId}`);
      }
      
      const messages = await client.getMessages(targetEntity, { limit });
      return messages.filter((m) => m.media) as Api.Message[];
    } catch (error) {
      console.error('Error getting messages from chat:', chatId, chatType, error);
      throw new TelegramApiError(`Failed to get messages from chat: ${(error as Error).message}`);
    }
  }

  async forwardToSavedMessages(
    client: TelegramClient,
    fromChatId: string,
    chatType: 'user' | 'group' | 'channel' | 'saved',
    messageIds: number[],
  ): Promise<Api.Message[]> {
    let targetEntity: any;
    
    if (chatType === 'saved' || fromChatId === 'me') {
      targetEntity = new Api.InputPeerSelf();
    } else {
      // Find the entity from dialogs to get proper access hash
      const dialogs = await client.getDialogs({ limit: 100 });
      
      let foundEntity: any = null;
      for (const dialog of dialogs) {
        const entity = (dialog as any).entity;
        if (entity && entity.id && entity.id.toString() === fromChatId) {
          foundEntity = entity;
          break;
        }
      }
      
      if (!foundEntity) {
        throw new Error(`Chat not found: ${fromChatId}`);
      }
      targetEntity = foundEntity;
    }
    
    // First get the original messages to access their media
    const originalMessages = await client.getMessages(targetEntity, { ids: messageIds });
    const results: Api.Message[] = [];

    for (const msg of originalMessages) {
      if (!msg.media) continue;

      try {
        // Download the media
        const buffer = await client.downloadMedia(msg.media);
        if (!buffer) continue;

        // Extract file info
        let fileName = 'file';

        if (msg.media instanceof Api.MessageMediaDocument) {
          const doc = msg.media.document;
          if (doc instanceof Api.Document) {
            for (const attr of doc.attributes) {
              if (attr instanceof Api.DocumentAttributeFilename) {
                fileName = attr.fileName;
                break;
              }
            }
          }
        } else if (msg.media instanceof Api.MessageMediaPhoto) {
          fileName = `photo_${msg.id}.jpg`;
        }

        // Re-upload to Saved Messages
        const result = await client.sendFile(TELEGRAM.SAVED_MESSAGES, {
          file: buffer as Buffer,
          caption: fileName,
          forceDocument: true,
          attributes: [
            new Api.DocumentAttributeFilename({ fileName }),
          ],
        });

        results.push(result);
      } catch (err) {
        console.error('Error processing message:', msg.id, err);
      }
    }

    return results;
  }

  encryptSession(sessionString: string): string {
    const iv = randomBytes(16);
    const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(sessionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptSession(encryptedSession: string): string {
    const [ivHex, encrypted] = encryptedSession.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
