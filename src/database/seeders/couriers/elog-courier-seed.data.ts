import { CourierDocument } from 'src/database/entities/couriers.entity';

export const elogCouriersData: CourierDocument[] = [
  {
    id: '1e9449bd-d5f9-4cf2-bba5-126a86b0b21e',
    name: 'eDOT Logistics',
    code: 'elog',
    service_name: 'Instant',
    service_code: 'instant',
    tier: 'standard',
    description: 'Layanan eDOT Logistics',
    service_type: 'same_day',
    shipping_type: 'parcel',
    duration_range: '1 - 3',
    duration_unit: 'hours',
    status: 'ACTIVE',
    sequence: 0,
    created_at: 'now()',
    updated_at: 'now()',
    deleted_at: null,
  },
];
