export class UpdateNoteDto {
  topicName?: string;
  classType?: 'online' | 'offline';
  batch?: string;
  panel?: 'staff' | 'student';
  materialType?: 'NotePDF' | 'PPT' | 'DOC' | 'MP4';
  classDate?: string;
  status?: 'ongoing' | 'completed';
  classId!: string
}