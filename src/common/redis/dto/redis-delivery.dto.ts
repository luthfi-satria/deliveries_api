export class CreateAutoSyncDeliveryDto {
  job_id: string;
  repeat: RepeatOpts;
}

export class ClearAutoSyncDeliveryDto {
  job_id: string;
}

export interface RepeatOpts {
  cron: string; // Cron string
  tz?: string; // Timezone
  // startDate?: Date | string | number; // Start date when the repeat job should start repeating (only with cron).
  // endDate?: Date | string | number; // End date when the repeat job should stop repeating.
  // limit?: number; // Number of times the job should repeat at max.
  // count?: number; // The start value for the repeat iteration count.
}

export class DeleteAutoSyncDeliveryDto {
  job_id: string;
}
