export enum ConversationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  GROUP = 'GROUP',
}

export enum ConversationRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum MessageVisibility {
  ALL = 'ALL',
  STAFF_ADMIN = 'STAFF_ADMIN',
}
