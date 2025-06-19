import { Request } from 'express';
export interface UserData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role: 'admin' | 'customer' | 'manager';
}
export interface RegisterUserRequest extends Request {
	body: UserData;
}
export interface User extends Omit<UserData, 'password' | 'role'> {
	id: number;
}
