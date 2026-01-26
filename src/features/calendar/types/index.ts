export type AppointmentType = 'zoom' | 'health' | 'tele';
export type AppointmentStatus = 'Success' | 'Pending' | 'Cancelled';

export interface Appointment {
  id: number;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: AppointmentType;
  time: string;
  location?: string;
  status: AppointmentStatus;
}