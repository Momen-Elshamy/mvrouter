export default interface IRole {
  _id?: string;
  name: 'admin' | 'user';
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 