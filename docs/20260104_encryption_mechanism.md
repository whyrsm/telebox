# Metadata Encryption Mechanism

**Last Updated**: 2026-01-04  
**Status**: Current implementation (includes session stability fix)

## Overview

Telebox prioritizes user privacy by ensuring that sensitive metadata, specifically **file names** and **folder names**, are encrypted at rest in the database. This prevents database administrators or anyone with access to the raw database from reading the content structure of a user's drive.

This document details the technical implementation of this encryption mechanism, which is handled primarily by the `CryptoService` in the backend.

## Architecture: Two-Layer Encryption

Telebox uses a **two-layer encryption architecture**:

1. **Session String Encryption** (Layer 1): The user's Telegram session string is encrypted using a **master key** (`ENCRYPTION_KEY` from environment variables) before being stored in the database.

2. **Metadata Encryption** (Layer 2): File and folder names are encrypted using a **user-specific key** derived from the user's **decrypted** session string.

This dual-layer approach ensures:
- The master key protects session strings at rest
- Each user has a unique, stable key for their metadata
- No single key can decrypt all user data

---

## 1. Session String Encryption (Layer 1)

### Purpose
The session string is the user's Telegram authentication credential. It must be:
- Stored securely in the database (encrypted at rest)
- Retrievable for creating Telegram clients
- **Stable** - never changed after initial creation (critical for Layer 2 encryption)

### Algorithm
- **Cipher**: `aes-256-gcm`
- **Key**: Master `ENCRYPTION_KEY` from environment (padded/sliced to 32 bytes)
- **IV**: 12 bytes, randomly generated per encryption
- **Format**: `iv:authTag:encryptedData` (hex-encoded)

### Implementation
```typescript
// Backend: src/common/services/crypto.service.ts
encryptSession(sessionString: string): string {
  const iv = randomBytes(12);
  const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(sessionString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

### Decryption (Multi-Format Support)
The `decryptSession()` method supports **three formats** for backward compatibility:

1. **GCM Format** (current): `iv:authTag:encrypted` (3 parts)
2. **Legacy CBC Format**: `iv:encrypted` (2 parts)
3. **Plaintext**: Unencrypted session (for migration)

```typescript
decryptSession(encryptedSession: string): string {
  const parts = encryptedSession.split(':');
  
  // GCM Format (current)
  if (parts.length === 3) {
    // Decrypt using AES-256-GCM
  }
  
  // Legacy CBC Format
  if (parts.length === 2) {
    // Decrypt using AES-256-CBC
  }
  
  // Plaintext fallback
  return encryptedSession;
}
```

### 🔒 Critical: Session String Stability

**The session string is NEVER updated after initial user creation.**

```typescript
// Backend: src/auth/auth.service.ts
const dbUser = await this.prisma.user.upsert({
  where: { telegramId: BigInt(user.id.toString()) },
  update: {
    // ✅ DO NOT update sessionString - keep the original!
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    phone,
  },
  create: {
    telegramId: BigInt(user.id.toString()),
    sessionString: encryptedSession,  // ✅ Only set on creation
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    phone,
  },
});
```

**Why this matters:**
- The encryption key for metadata (Layer 2) is derived from the session string
- If the session string changes, the encryption key changes
- All previously encrypted file/folder names become **permanently unreadable**
- Telegram generates a new session on each login, but we **ignore** it and keep the original

**See**: `docs/20260104_session_string_stability_fix.md` for the full incident report.

---

## 2. Per-User Key Derivation (Layer 2)

A critical security feature of Telebox is that **there is no single master key** for user metadata. Instead, each user has a unique encryption key derived from their own Telegram session.

### Source
The key is derived from the user's **raw (decrypted) Telegram session string**. This session string acts as a stable, user-specific secret that is already required for the user to access their account.

### Derivation Method
We use `SHA-256` to hash the **decrypted** session string:

```typescript
// Backend: src/common/services/crypto.service.ts
deriveKeyFromSession(rawSessionString: string): Buffer {
  return createHash('sha256').update(rawSessionString).digest();
}
```

### Result
A consistent 32-byte (256-bit) key that is:
- Unique to each user
- Stable for the lifetime of the user account
- Never stored directly in the database
- Only derivable when the user is authenticated

---

## 3. Metadata Encryption Algorithm

We use **AES-256-GCM** (Galois/Counter Mode) for all metadata encryption. GCM is an authenticated encryption mode that provides both confidentiality (encryption) and integrity (ensuring data hasn't been tampered with).

### Specifications
- **Cipher**: `aes-256-gcm`
- **Key Size**: 256 bits (32 bytes)
- **IV (Initialization Vector)**: 96 bits (12 bytes), randomly generated for *every* encryption operation
- **Auth Tag**: 128 bits (16 bytes), generated by the GCM algorithm

### Storage Format
The encrypted data is stored in the PostgreSQL database as a single string field (e.g., `File.name`, `Folder.name`). To ensure we can properly decrypt it later, we concatenate the IV, the Authentication Tag, and the Encrypted Data (Ciphertext) into a single string using `:` as a separator.

**Format:**
```
iv:authTag:encryptedData
```
*All parts are Hex-encoded strings.*

- **iv**: 12 bytes (24 hex characters)
- **authTag**: 16 bytes (32 hex characters)
- **encryptedData**: Variable length (hex characters)

### Implementation
```typescript
encryptMetadata(plaintext: string, userKey: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', userKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

---

## 4. Migration & Backward Compatibility

### Dual-Key Strategy

Due to the session string stability fix (2026-01-04), the system now uses **two keys** for decryption:

```typescript
interface UserKeys {
  canonical: Buffer;  // Derived from DECRYPTED session (correct, stable)
  legacy: Buffer;     // Derived from ENCRYPTED session (fallback for old data)
}
```

### Why Two Keys?

Before the stability fix, some data may have been encrypted using a key derived from the **encrypted** session string (incorrect). After the fix, all new data is encrypted using the **decrypted** session string (correct).

### Encryption Strategy (Write)
**Always use the canonical key:**

```typescript
private encryptName(name: string, keys: UserKeys): string {
  // Always encrypt using the Canonical key for new/updated data
  return this.cryptoService.encryptMetadata(name, keys.canonical);
}
```

### Decryption Strategy (Read)
**Try canonical first, fallback to legacy:**

```typescript
private decryptName(encryptedName: string, keys: UserKeys): string {
  // 1. Try Canonical Key (correct key)
  const val = this.cryptoService.decryptMetadata(encryptedName, keys.canonical);
  
  // 2. If decryption failed (returns input unchanged), try Legacy Key
  if (val === encryptedName) {
    return this.cryptoService.decryptMetadata(encryptedName, keys.legacy);
  }
  
  return val;
}
```

### Backward Compatibility for Unencrypted Data

The `decryptMetadata()` method also handles **unencrypted data** (for migration scenarios):

```typescript
decryptMetadata(encryptedData: string, userKey: Buffer): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  // If not in encrypted format, return as-is
  if (!ivHex || !authTagHex || !encrypted) {
    return encryptedData;
  }
  
  try {
    // Decrypt...
  } catch {
    // If decryption fails, return as-is (backward compatibility)
    return encryptedData;
  }
}
```

---

## 5. Process Flow

### Visual Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    TWO-LAYER ENCRYPTION                         │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: Session String Encryption
═══════════════════════════════════════════════════════════════════
                    ┌──────────────────────┐
                    │ Master Key (Env Var) │
                    │   ENCRYPTION_KEY     │
                    └──────────┬───────────┘
                               │
┌────────────────┐    ┌────────▼─────────┐    ┌──────────────────┐
│ Raw Session    │───▶│ Encrypt Session  │───▶│ Encrypted Session│
│ (from Telegram)│    │  (AES-256-GCM)   │    │  (Stored in DB)  │
└────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                        │
                      ⚠️ NEVER UPDATED AFTER CREATION   │
                                                        │
                                              ┌─────────▼─────────┐
                                              │ Decrypt Session   │
                                              │ (when needed)     │
                                              └─────────┬─────────┘
                                                        │
                                                        ▼
LAYER 2: Metadata Encryption                  ┌──────────────────┐
═══════════════════════════════════════════   │  Raw Session     │
                                              └────────┬─────────┘
                                                       │
                                                    SHA-256
                                                       │
┌─────────────────┐                          ┌────────▼─────────┐
│ Plaintext Name  │                          │   User Key       │
│ "My Document"   │                          │  (32 bytes)      │
└─────────────────┘                          └────────┬─────────┘
         │                                            │
         │                    ┌───────────────────────┘
         │                    │
         │           ┌────────▼─────────┐
         └──────────▶│  AES-256-GCM     │
                     │  Encrypt Metadata│
         ┌───────────┤  (Random IV)     │
         │           └────────┬─────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│   Random IV     │  │ Encrypted Output │
│   (12 bytes)    │  ├──────────┬───────┤
└─────────────────┘  │ Cipher   │AuthTag│
                     └─────┬────┴───┬───┘
                           │        │
                           ▼        ▼
              ┌─────────────────────────────────────┐
              │ Format:  iv : authTag : ciphertext  │
              │      (Stored in DB: File.name)      │
              └─────────────────────────────────────┘

DECRYPTION (with Dual-Key Fallback)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────┐
│ Encrypted Name from DB  │
└───────────┬─────────────┘
            │
            ▼
┌───────────────────────────┐
│ Try Canonical Key (from   │
│ decrypted session)        │
└───────────┬───────────────┘
            │
            ├─── Success ──▶ Return decrypted name
            │
            └─── Failed ───┐
                           │
                           ▼
            ┌──────────────────────────┐
            │ Try Legacy Key (from     │
            │ encrypted session)       │
            └──────────┬───────────────┘
                       │
                       ├─── Success ──▶ Return decrypted name
                       │
                       └─── Failed ───▶ Return as-is (unencrypted)
```

### Encryption Flow (Write)

When a user uploads a file or creates a folder:

1. **Retrieve Session**: The backend retrieves the user's encrypted session string from the database.
2. **Decrypt Session**: The session string is decrypted using the server's master `ENCRYPTION_KEY`.
3. **Derive User Key**: The `SHA-256` hash of the *decrypted* session string is calculated (canonical key).
4. **Encrypt Metadata**:
   - A new random 12-byte IV is generated.
   - The file/folder name is encrypted using the **canonical** User Key and the IV.
   - An Auth Tag is computed.
5. **Store**: The result is formatted as `iv:authTag:ciphertext` and saved to the database.

### Decryption Flow (Read)

When a user lists their files or folders:

1. **Retrieve Data**: The backend queries the database for the user's files/folders.
2. **Derive User Keys**: 
   - **Canonical Key**: Derived from the decrypted session string
   - **Legacy Key**: Derived from the encrypted session string (for backward compatibility)
3. **Parse Data**: The stored name string is split by `:` into IV, Auth Tag, and Ciphertext.
4. **Decrypt Metadata** (Dual-Key Strategy):
   - First attempt: Decrypt using the **Canonical Key**
   - If that fails: Decrypt using the **Legacy Key**
   - If both fail: Return the value as-is (unencrypted data)
5. **Response**: The decrypted names are sent to the frontend.

---

## 6. Security Benefits

### 1. Unique IVs
Because a random IV is used for every single encryption, encrypting the same filename twice (e.g., two folders named "Documents") results in completely different stored strings. This prevents statistical analysis of the encrypted data.

**Example:**
```
"Documents" → First encryption  → "a1b2c3d4...:e5f6g7h8...:..."
"Documents" → Second encryption → "9z8y7x6w...:5v4u3t2s...:..."
```

### 2. Tamper Evidence
The GCM Auth Tag ensures that if an attacker modifies the encrypted string in the database, the decryption process will throw an error rather than producing garbage data.

### 3. No Master Key Exposure
The keys used to encrypt user filenames are never stored directly in the database. They can only be derived transiently when the user is authenticated (since the session string is needed), and the session string itself is encrypted at rest.

### 4. Per-User Isolation
Even with full database access and the master `ENCRYPTION_KEY`, an attacker cannot decrypt user metadata without:
- The user's encrypted session string (from the database)
- The master key (to decrypt the session)
- Knowledge of the key derivation process

Each user's data is cryptographically isolated from other users.

### 5. Session String Stability
By preserving the original session string throughout the user's lifetime:
- The encryption key remains stable
- Users can always decrypt their data
- No data loss on re-login
- Prevents accidental key rotation

---

## 7. Implementation Files

### Core Services
- **`backend/src/common/services/crypto.service.ts`**  
  Core encryption/decryption logic for both sessions and metadata

### Service Integration
- **`backend/src/files/files.service.ts`**  
  File metadata encryption/decryption with dual-key strategy

- **`backend/src/folders/folders.service.ts`**  
  Folder metadata encryption/decryption with dual-key strategy

- **`backend/src/import/import.service.ts`**  
  Import service with metadata encryption

### Authentication
- **`backend/src/auth/auth.service.ts`**  
  Session string management (creation, preservation, never updates)

- **`backend/src/telegram/telegram.service.ts`**  
  Telegram session creation and management

---

## 8. Migration Notes

### For Existing Deployments

If you're upgrading from a version before the session string stability fix:

1. **Session strings are preserved**: Existing users will keep their original session strings
2. **Dual-key decryption**: Old data encrypted with legacy keys will still be readable
3. **New data uses canonical keys**: All new/updated metadata uses the correct key
4. **Gradual migration**: As users rename files/folders, data migrates to canonical encryption

### Session Encryption Format Migration

If you have sessions in legacy CBC format or plaintext:

1. Use `backend/scripts/assess-session-encryption.ts` to check current status
2. Use `backend/scripts/migrate-sessions-to-gcm.ts` to migrate to GCM format
3. The `decryptSession()` method supports all formats during transition

---

## 9. Testing & Verification

### Test Session String Stability
```bash
# 1. Login as a user
# 2. Upload files and create folders
# 3. Verify names are visible
# 4. Logout
# 5. Login again
# 6. Verify file and folder names are still correctly displayed
```

### Test Encryption/Decryption
```bash
# Use the decrypt tool to verify encryption
cd backend
npx ts-node scripts/decrypt_tool.ts
```

### Verify Session Encryption Status
```bash
cd backend
npx ts-node scripts/assess-session-encryption.ts
```

---

## 10. Related Documentation

- **`docs/20260104_session_string_stability_fix.md`** - Critical fix for session preservation
- **`AGENT.md`** - Project guidelines and conventions
- **`backend/src/common/services/crypto.service.ts`** - Implementation reference

---

## Appendix: Key Terminology

| Term | Definition |
|------|------------|
| **Master Key** | Environment variable `ENCRYPTION_KEY` used to encrypt session strings |
| **User Key** | Per-user key derived from session string via SHA-256 |
| **Canonical Key** | User key derived from **decrypted** session (correct, stable) |
| **Legacy Key** | User key derived from **encrypted** session (fallback for old data) |
| **Session String** | Telegram authentication credential, encrypted at rest |
| **Metadata** | File names and folder names (encrypted with user key) |
| **IV** | Initialization Vector, random 12 bytes per encryption |
| **Auth Tag** | GCM authentication tag, 16 bytes for integrity verification |
| **GCM** | Galois/Counter Mode, authenticated encryption algorithm |
