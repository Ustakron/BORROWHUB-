export type ItemCategory = 
  | 'all'
  | 'learning' // อุปกรณ์การเรียน
  | 'sports' // กีฬา
  | 'electronics' // อิเล็กทรอนิกส์ / คอมพิวเตอร์
  | 'music_activity' // ดนตรี / กิจกรรม
  | 'other'; // อื่นๆ

export type ItemStatus = 'available' | 'borrowed' | 'maintenance';

export interface Item {
  id: string;
  name: string;
  code: string;
  category: ItemCategory;
  categoryLabel: string;
  image: string;
  location: string;
  status: ItemStatus;
  condition: string;
  description: string;
  currentBorrowerName?: string;
  currentBorrowerRoom?: string;
  currentBorrowPeriod?: string;
  currentDueDate?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue';

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemImage: string;
  borrowerId: string;
  borrowerName: string;
  borrowerGrade: string;
  borrowerRoom: string;
  borrowerLineId: string;
  borrowerAvatar?: string;
  borrowDate: string;
  borrowPeriod: string;
  returnDate: string;
  returnPeriod: string;
  pickupLocation: string;
  returnLocation: string;
  reason: string;
  note?: string;
  status: RequestStatus;
  createdAt: string;
  approvedAt?: string;
  returnedAt?: string;
  approverName?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  lineUserId: string;
  name: string;
  studentId: string;
  grade: string;
  room: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string;
  email?: string;
  phone?: string;
}

export interface LineNotification {
  id: string;
  title: string;
  message: string;
  type: 'borrow_request' | 'approval' | 'rejection' | 'reminder' | 'overdue' | 'returned' | 'system';
  timestamp: string;
  read: boolean;
  recipientLineId: string;
  relatedRequestId?: string;
}
