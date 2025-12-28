import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

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
      connectionRetries: 5,
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
    const result = await client.sendFile('me', {
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
    const messages = await client.getMessages('me', { ids: messageId });
    if (!messages.length || !messages[0].media) {
      throw new Error('Message or media not found');
    }
    const buffer = await client.downloadMedia(messages[0].media);
    return buffer as Buffer;
  }

  async deleteMessage(client: TelegramClient, messageId: number): Promise<void> {
    await client.deleteMessages('me', [messageId], { revoke: true });
  }

  async getMessages(client: TelegramClient, limit = 100): Promise<Api.Message[]> {
    const messages = await client.getMessages('me', { limit });
    return messages.filter((m) => m.media) as Api.Message[];
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
